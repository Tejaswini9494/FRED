#!/usr/bin/env python3
"""
FastAPI Server for Financial Market Data Pipeline

This module serves as the entry point for the FastAPI application,
replacing the Express.js server previously used.
"""

import os
import uvicorn
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

# Import FastAPI app
from fastapi_app.main import app

# Set port from environment or default
PORT = int(os.environ.get("PORT", 5000))

# Main entry point
if __name__ == "__main__":
    print(f"Starting FastAPI server on port {PORT}")
    uvicorn.run("fastapi_app.main:app", host="0.0.0.0", port=PORT, reload=True)