/**
 * Special Vite configuration for local development to avoid HMR issues
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      // Disable Fast Refresh (React Refresh) to avoid HMR issues
      fastRefresh: false
    })
  ],
  root: './client',
  define: {
    // Provide polyfills for globals if needed
    global: 'window',
  },
  resolve: {
    alias: {
      // Set up path aliases to match the ones in the main configuration
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
      '@components': path.resolve(__dirname, './client/src/components'),
      '@lib': path.resolve(__dirname, './client/src/lib')
    }
  },
  server: {
    // Force optimization to avoid HMR issues
    force: true,
    host: true,
    port: 5173,
    strictPort: true,
    // Add allowed host
    hmr: {
      host: '5b13b98c-b461-4ae0-a637-9b440340453f-00-2vmnehdxb25fq.kirk.replit.dev'
    },
    // Proxy API requests to the backend
    proxy: {
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        secure: false
      }
    }
  },
  // Disable HMR websocket to prevent issues
  experimental: {
    hmrPartialAccept: false
  }
});