import { Router } from "express";
import { storage } from "../storage";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

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

// Get correlation matrix between economic indicators
router.get("/correlation", async (req, res) => {
  try {
    const { series, start_date, end_date } = req.query;
    
    if (!series) {
      return res.status(400).json({ 
        success: false, 
        error: "series parameter is required (comma-separated list of series IDs)" 
      });
    }
    
    // Use the DEFAULT_INDICATORS if no series provided
    const seriesIds = (series as string).split(",");
    
    // Prepare arguments for the correlation analysis
    const args = ["correlation", "--series", series as string];
    
    if (start_date) {
      args.push("--start_date", start_date as string);
    }
    
    if (end_date) {
      args.push("--end_date", end_date as string);
    }
    
    // Run the correlation analysis
    const correlationData = await runPythonScript("analysis.py", args);
    
    // Store the analysis result
    await storage.createAnalysisResult({
      type: "correlation",
      indicators: seriesIds,
      parameters: { start_date, end_date },
      results: correlationData,
      createdAt: new Date()
    });
    
    res.json({ success: true, data: correlationData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get time series forecasts
router.get("/forecast", async (req, res) => {
  try {
    const { series, start_date, end_date, model = "arima", periods = "10" } = req.query;
    
    if (!series) {
      return res.status(400).json({ 
        success: false, 
        error: "series parameter is required" 
      });
    }
    
    // Use the first series ID for forecasting
    const seriesId = (series as string).split(",")[0];
    
    // Prepare arguments for the forecasting analysis
    const args = [
      "forecast", 
      "--series", seriesId,
      "--model", model as string,
      "--periods", periods as string
    ];
    
    if (start_date) {
      args.push("--start_date", start_date as string);
    }
    
    if (end_date) {
      args.push("--end_date", end_date as string);
    }
    
    // Run the forecasting analysis
    const forecastData = await runPythonScript("analysis.py", args);
    
    // Store the analysis result if there's no error
    if (!forecastData.error) {
      await storage.createAnalysisResult({
        type: "forecast",
        indicators: [seriesId],
        parameters: { start_date, end_date, model, periods },
        results: forecastData,
        createdAt: new Date()
      });
    }
    
    res.json({ success: true, data: forecastData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get moving averages
router.get("/moving-averages", async (req, res) => {
  try {
    const { series, start_date, end_date } = req.query;
    
    if (!series) {
      return res.status(400).json({ 
        success: false, 
        error: "series parameter is required" 
      });
    }
    
    // Use the first series ID for moving averages
    const seriesId = (series as string).split(",")[0];
    
    // Prepare arguments for the moving averages analysis
    const args = ["moving_averages", "--series", seriesId];
    
    if (start_date) {
      args.push("--start_date", start_date as string);
    }
    
    if (end_date) {
      args.push("--end_date", end_date as string);
    }
    
    // Run the moving averages analysis
    const movingAveragesData = await runPythonScript("analysis.py", args);
    
    res.json({ success: true, data: movingAveragesData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get volatility analysis
router.get("/volatility", async (req, res) => {
  try {
    const { series, start_date, end_date, window = "30" } = req.query;
    
    if (!series) {
      return res.status(400).json({ 
        success: false, 
        error: "series parameter is required" 
      });
    }
    
    // Use the first series ID for volatility analysis
    const seriesId = (series as string).split(",")[0];
    
    // Prepare arguments for the volatility analysis
    const args = [
      "volatility", 
      "--series", seriesId,
      "--window", window as string
    ];
    
    if (start_date) {
      args.push("--start_date", start_date as string);
    }
    
    if (end_date) {
      args.push("--end_date", end_date as string);
    }
    
    // Run the volatility analysis
    const volatilityData = await runPythonScript("analysis.py", args);
    
    res.json({ success: true, data: volatilityData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all previous analysis results
router.get("/results", async (req, res) => {
  try {
    const { type } = req.query;
    const results = await storage.getAnalysisResults(type as string | undefined);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific analysis result
router.get("/results/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await storage.getAnalysisResult(parseInt(id, 10));
    
    if (!result) {
      return res.status(404).json({ 
        success: false, 
        error: `Analysis result with ID ${id} not found` 
      });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
