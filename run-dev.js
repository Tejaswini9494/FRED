#!/usr/bin/env node

/**
 * Combined development script that runs both client and server
 * in separate processes, using concurrently.
 */
const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

// Determine platform-appropriate command
const isWindows = os.platform() === 'win32';
const node = isWindows ? 'node.exe' : 'node';

// Set environment variables to control Vite behavior
process.env.VITE_HMR_FORCE_SERVER = 'true';
process.env.VITE_DISABLE_OVERLAY = 'true';
process.env.VITE_SKIP_REACT_HMR = 'true';

// Check if we have concurrently available
const hasConcurrently = fs.existsSync(path.join('node_modules', '.bin', isWindows ? 'concurrently.cmd' : 'concurrently'));

// Log startup
console.log('Starting development environment...');

let devProcess;

if (hasConcurrently) {
  // Use concurrently to run both processes
  const concurrently = path.join('node_modules', '.bin', isWindows ? 'concurrently.cmd' : 'concurrently');
  
  devProcess = spawn(concurrently, [
    `"${node} run-server.js"`,
    `"${node} run-client.js"`
  ], {
    stdio: 'inherit',
    env: process.env,
    shell: true
  });
} else {
  console.log('Concurrently not found. Please run the client and server in separate terminals:');
  console.log(`Terminal 1: ${node} run-client.js`);
  console.log(`Terminal 2: ${node} run-server.js`);
  process.exit(1);
}

// Handle exit
process.on('SIGINT', () => {
  console.log('Shutting down development environment...');
  devProcess.kill('SIGINT');
  process.exit(0);
});