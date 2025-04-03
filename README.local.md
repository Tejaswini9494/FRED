# Financial Market Data Pipeline

## Quick Start for Local Development

This project has a specialized setup for local development to avoid common issues with React HMR and path resolution.

### Option 1 (Unix-based systems - Mac, Linux)

```bash
# Make the script executable if it isn't already
chmod +x start-dev.sh

# Run the script
./start-dev.sh
```

### Option 2 (All systems)

Run the client and server separately in two terminal windows:

**Terminal 1 (Server):**
```bash
node run-server.js
```

**Terminal 2 (Client):**
```bash
node run-client.js
```

### Option 3 (If you have concurrently installed)

```bash
node run-dev.js
```

## Access the Application

- Client: http://localhost:5173
- API: http://localhost:5002/api

## Detailed Documentation

For more detailed information on local development, troubleshooting, and project structure, see [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md).