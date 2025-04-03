import { Router } from "express";
import { storage } from "../storage";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { z } from "zod";
import { insertEtlJobSchema } from "@shared/schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Helper function to run Python scripts
async function runPythonScript(scriptName: string, args: string[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    // Check if the script exists
    const scriptPath = path.join(__dirname, "..", "python", scriptName);
    if (!fs.existsSync(scriptPath)) {
      return reject(new Error(`Python script not found: ${scriptPath}`));
    }

    const process = spawn("python", [scriptPath, ...args]);
    let output = "";
    let errorOutput = "";

    process.stdout.on("data", (data) => {
      output += data.toString();
    });

    process.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    process.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`Python script exited with code ${code}: ${errorOutput}`));
      }

      try {
        const jsonOutput = JSON.parse(output);
        resolve(jsonOutput);
      } catch (error) {
        reject(new Error(`Failed to parse Python script output: ${error.message}`));
      }
    });
  });
}

// Get ETL job history
router.get("/jobs", async (req, res) => {
  try {
    const { limit } = req.query;
    const limitNum = limit ? parseInt(limit as string, 10) : undefined;
    
    const jobs = await storage.getEtlJobs(limitNum);
    res.json({ success: true, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific ETL job
router.get("/jobs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const job = await storage.getEtlJob(parseInt(id, 10));
    
    if (!job) {
      return res.status(404).json({ 
        success: false, 
        error: `ETL job with ID ${id} not found` 
      });
    }
    
    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create and run a new ETL job
router.post("/run", async (req, res) => {
  try {
    const { series_id, start_date, end_date } = req.body;
    
    if (!series_id) {
      return res.status(400).json({ 
        success: false, 
        error: "series_id is required" 
      });
    }
    
    // Create a new ETL job record
    const newJob = await storage.createEtlJob({
      task: `${series_id} Dataset Update`,
      status: "in_progress",
      startTime: new Date(),
      endTime: null,
      recordsProcessed: null,
      error: null,
      metadata: { series_id, start_date, end_date }
    });
    
    // Run the ETL pipeline asynchronously
    runETLPipeline(newJob.id, series_id, start_date, end_date).catch(console.error);
    
    res.json({ 
      success: true, 
      message: "ETL job started",
      data: { job_id: newJob.id } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function to run the ETL pipeline
async function runETLPipeline(jobId: number, seriesId: string, startDate?: string, endDate?: string) {
  try {
    // Prepare arguments for the ETL pipeline script
    const args = [seriesId];
    
    if (startDate) {
      args.push("--start_date", startDate);
    }
    
    if (endDate) {
      args.push("--end_date", endDate);
    }
    
    // Run the ETL pipeline
    const result = await runPythonScript("etl_pipeline.py", args);
    
    // Process the result
    const recordsProcessed = result.data?.length || 0;
    
    // Update the job status
    await storage.updateEtlJob(jobId, {
      status: "completed",
      endTime: new Date(),
      recordsProcessed,
      metadata: result
    });
    
    // If we have an indicator, update or create it
    if (result.metadata) {
      const existingIndicator = await storage.getIndicatorBySymbol(seriesId);
      
      if (existingIndicator) {
        await storage.updateIndicator(existingIndicator.id, {
          lastUpdated: new Date()
        });
      } else {
        await storage.createIndicator({
          symbol: seriesId,
          name: result.metadata.name || seriesId,
          description: result.metadata.description || "",
          frequency: result.metadata.frequency || "unknown",
          units: result.metadata.units || "",
          source: "FRED",
          lastUpdated: new Date()
        });
      }
    }
    
    console.log(`ETL job ${jobId} completed successfully`);
  } catch (error) {
    console.error(`ETL job ${jobId} failed:`, error);
    
    // Update the job with the error information
    await storage.updateEtlJob(jobId, {
      status: "failed",
      endTime: new Date(),
      error: error.message
    });
  }
}

// Schedule a new ETL job
router.post("/schedule", async (req, res) => {
  try {
    const scheduleSchema = z.object({
      task: z.string(),
      scheduledTime: z.string().refine(
        (val) => !isNaN(Date.parse(val)),
        { message: "Invalid date format for scheduledTime" }
      ),
      series_id: z.string(),
      start_date: z.string().optional(),
      end_date: z.string().optional()
    });
    
    const validatedData = scheduleSchema.parse(req.body);
    const scheduledTime = new Date(validatedData.scheduledTime);
    
    // Create a scheduled job record
    const newJob = await storage.createEtlJob({
      task: validatedData.task,
      status: "scheduled",
      startTime: scheduledTime,
      endTime: null,
      recordsProcessed: null,
      error: null,
      metadata: { 
        series_id: validatedData.series_id, 
        start_date: validatedData.start_date, 
        end_date: validatedData.end_date 
      }
    });
    
    res.json({ 
      success: true, 
      message: "ETL job scheduled",
      data: { job_id: newJob.id } 
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get pipeline status
router.get("/status", async (req, res) => {
  try {
    // Get recent jobs to determine overall status
    const recentJobs = await storage.getEtlJobs(5);
    
    // Check if any jobs are in progress
    const inProgressJobs = recentJobs.filter(job => job.status === "in_progress");
    const status = inProgressJobs.length > 0 ? "active" : "idle";
    
    // Get the most recent completed job
    const completedJobs = recentJobs.filter(job => job.status === "completed");
    const lastRun = completedJobs.length > 0 ? completedJobs[0].endTime : null;
    
    // Get counts of jobs by status
    const jobCounts = {
      completed: recentJobs.filter(job => job.status === "completed").length,
      failed: recentJobs.filter(job => job.status === "failed").length,
      inProgress: inProgressJobs.length,
      scheduled: recentJobs.filter(job => job.status === "scheduled").length
    };
    
    res.json({
      success: true,
      data: {
        status,
        lastRun,
        jobCounts,
        recentJobs
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
