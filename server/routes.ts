import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import marketRouter from "./api/market";
import etlRouter from "./api/etl";
import analysisRouter from "./api/analysis";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  app.use("/api/market", marketRouter);
  app.use("/api/etl", etlRouter);
  app.use("/api/analysis", analysisRouter);

  // System status endpoint
  app.get("/api/status", async (req, res) => {
    try {
      const indicators = await storage.getIndicators();
      const recentJobs = await storage.getEtlJobs(5);

      // Check pipeline status
      const inProgressJobs = recentJobs.filter(job => job.status === "in_progress");
      const pipelineStatus = inProgressJobs.length > 0 ? "active" : "idle";

      // Get most recent job
      const completedJobs = recentJobs.filter(job => job.status === "completed");
      const lastRun = completedJobs.length > 0 ? completedJobs[0].endTime : null;

      // API status
      const apiStatus = indicators.length > 0 ? "connected" : "disconnected";
      const apiCalls = Math.floor(Math.random() * 400) + 100; // Simulated API call count

      res.json({
        success: true,
        data: {
          pipeline: {
            status: pipelineStatus,
            lastRun
          },
          api: {
            status: apiStatus,
            callCount: apiCalls,
            limit: 500
          },
          database: {
            status: "healthy",
            storageUsed: 42 // Simulated storage percentage
          },
          cache: {
            status: "operational",
            hitRate: 89 // Simulated cache hit rate
          }
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
