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

// Get list of available indicators
router.get("/indicators", async (req, res) => {
  try {
    const indicators = await storage.getIndicators();
    res.json({ success: true, data: indicators });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific indicator by symbol
router.get("/indicators/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const { start_date, end_date, frequency } = req.query;

    const indicator = await storage.getIndicatorBySymbol(symbol);
    
    if (!indicator) {
      return res.status(404).json({ 
        success: false, 
        error: `Indicator with symbol ${symbol} not found` 
      });
    }

    // Get data from FRED API
    const args = ["get_series", "--series_id", symbol];
    
    if (start_date) {
      args.push("--start_date", start_date as string);
    }
    
    if (end_date) {
      args.push("--end_date", end_date as string);
    }
    
    if (frequency) {
      args.push("--frequency", frequency as string);
    }

    const data = await runPythonScript("fred_api.py", args);

    res.json({
      success: true,
      data: {
        indicator: symbol,
        frequency: indicator.frequency,
        unit: indicator.units,
        values: data.map((item: any) => ({
          date: item.date,
          value: parseFloat(item.value)
        })),
        metadata: {
          source: indicator.source,
          last_updated: indicator.lastUpdated,
          notes: indicator.description
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search for indicators
router.get("/search", async (req, res) => {
  try {
    const { query, limit = "10" } = req.query;
    
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        error: "Search query parameter is required" 
      });
    }

    const args = ["search", "--search_text", query as string, "--limit", limit as string];
    const results = await runPythonScript("fred_api.py", args);

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get market overview data (multiple indicators for dashboard)
router.get("/overview", async (req, res) => {
  try {
    // These are common indicators for the dashboard overview
    const indicators = ["GDP", "UNRATE", "CPIAUCSL", "DGS10", "SP500"];
    const result: any = {};

    for (const symbol of indicators) {
      try {
        const args = ["get_series", "--series_id", symbol];
        const data = await runPythonScript("fred_api.py", args);

        if (data && data.length) {
          // Just get the most recent value
          const latestData = data.sort((a: any, b: any) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0];

          // Calculate percentage change from previous value
          const previousData = data[data.length - 2];
          let percentChange = 0;
          
          if (previousData && previousData.value) {
            const current = parseFloat(latestData.value);
            const previous = parseFloat(previousData.value);
            
            if (previous !== 0) {
              percentChange = ((current - previous) / previous) * 100;
            }
          }

          // Store in result
          result[symbol] = {
            value: parseFloat(latestData.value),
            date: latestData.date,
            percentChange: percentChange.toFixed(2)
          };
        }
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        // Continue with other indicators even if one fails
      }
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
