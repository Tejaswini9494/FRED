#!/usr/bin/env node

/**
 * This script runs only the client-side of the application,
 * using a fixed Vite configuration to avoid HMR issues.
 */
import { spawn } from 'child_process';

import os from 'os';


// Determine platform-appropriate command
const isWindows = os.platform() === 'win32';
const npx = isWindows ? 'npx.cmd' : 'npx';

// Set environment variables to control Vite behavior
process.env.VITE_HMR_FORCE_SERVER = 'true';
process.env.VITE_DISABLE_OVERLAY = 'true';
process.env.VITE_SKIP_REACT_HMR = 'true';

// Log startup
console.log('Starting client application with fixed configuration...');
console.log('Client will be available at: http://localhost:5173');
console.log('API requests will be proxied to: http://localhost:5002');

// Start Vite with local config
const client = spawn(npx, ['vite', 'client', '--config', 'vite.config.local.js'], {
  stdio: 'inherit',
  env: process.env
});

client.on('close', (code) => {
  console.log(`Client process exited with code ${code}`);
});