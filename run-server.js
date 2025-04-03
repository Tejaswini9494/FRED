#!/usr/bin/env node

/**
 * This script runs only the server-side of the application.
 */
import { spawn } from 'child_process';

import os from 'os';


// Determine platform-appropriate command
const isWindows = os.platform() === 'win32';
const npx = isWindows ? 'npx.cmd' : 'npx';

// Log startup
console.log('Starting server on port 5002...');
console.log('API will be available at: http://localhost:5002/api');

// Start the server with tsx
const server = spawn(npx, ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    // Force PORT to 5002 to match proxy settings in client
    PORT: '5002'
  }
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});