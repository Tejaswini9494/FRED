import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { UserConfig } from "vite";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const viteLogger = createLogger();

const themeJsonPath = path.resolve(__dirname, "theme.json");

if (!fs.existsSync(themeJsonPath)) {
  console.error(`Error: theme.json not found at ${themeJsonPath}`);
  process.exit(1);
}

let themeData;
try {
  themeData = JSON.parse(fs.readFileSync(themeJsonPath, "utf-8"));
} catch (error) {
  console.error("Failed to read theme.json:", error);
  process.exit(1);
}
console.log("Successfully loaded theme.json", themeData);



export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions: UserConfig["server"] = {
    middlewareMode: true,
    hmr: true, // Fixes the issue by setting it to `true`
    cors: { origin: "*" },
  };
  

  const vite = await createViteServer({
    ...viteConfig,
    configFile: path.resolve(__dirname, "../vite.config.ts"), // Load vite.config.ts
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions, // Use fixed server options
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path.resolve(__dirname, "..", "client", "index.html");
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      if (vite.ssrFixStacktrace) {
        vite.ssrFixStacktrace(e as Error);
      }
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
