import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const themePath = path.resolve(__dirname, "server/theme.json");

console.log("Resolved theme.json path:", themePath);

const plugins = [
  react(),
  // ✅ Removed fastRefresh as it's not a valid option
  themePlugin({
    themeJsonPath: themePath, // Ensuring correct path resolution
  }),
];

// ✅ Conditionally add cartographer() without using `await import()`
if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
  import("@replit/vite-plugin-cartographer").then((m) => {
    plugins.push(m.cartographer());
  });
}

export default defineConfig({
  define: {
    "process.env": {},
  },
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5002', // Replace with your API server
        changeOrigin: true,
      },
    },
    
    hmr: {
      overlay: false, // ✅ Disable runtime error overlay
    },
  },
});
