# Local Development Setup

This document provides instructions for running this project locally without encountering the React HMR issues or path resolution problems.

## Quick Start

The project has been set up with custom scripts to make local development easier:

### Option 1: Run client and server separately (RECOMMENDED)

Open two terminal windows:

**Terminal 1 (Server):**
```bash
node run-server.js
```

**Terminal 2 (Client):**
```bash
node run-client.js
```

Then access:
- Client: http://localhost:5173
- Server API: http://localhost:5002/api

### Option 2: Run everything with a single command

If you have concurrently installed:
```bash
node run-dev.js
```

## What These Scripts Do

1. **run-client.js** - Starts just the React frontend with a special Vite configuration that:
   - Disables Fast Refresh to avoid HMR conflicts
   - Sets up proper path aliases for `@/` imports
   - Configures a proxy to forward API requests to the backend

2. **run-server.js** - Starts just the Express backend server on port 5002

3. **run-dev.js** - Uses concurrently to run both client and server scripts

## Troubleshooting Common Issues

### Path Resolution Issues

If you still see errors with `@/` imports not being resolved:

1. Make sure you're using the provided scripts and not `npm run dev`
2. Check that jsconfig.json is in your project root
3. Try restarting your IDE to pick up the path configuration changes

### React HMR Errors

The scripts are designed to avoid HMR issues, but if they persist:

1. Delete the .vite cache in your project
2. Clear browser cache and hard reload (Ctrl+Shift+R)
3. Try running with an additional environment variable:
   ```
   VITE_FORCE_OPTIMIZE=true node run-client.js
   ```

### Port Conflicts

If ports 5173 or 5002 are already in use:

1. For the client port (5173), edit run-client.js and add `--port 3000` to the Vite command
2. For the server port (5002), edit run-server.js and change the PORT value

### Other Issues

If you encounter other problems:

1. Check the terminal output for specific error messages
2. Try clearing and reinstalling node_modules:
   ```
   rm -rf node_modules
   npm cache clean --force
   npm install
   ```

## Project Structure

- `/client` - React frontend
- `/server` - Express backend
- `/shared` - Shared types and utilities
- Custom scripts in project root for local development