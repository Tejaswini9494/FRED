from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import traceback
from typing import Dict, Any
import os
from pathlib import Path

# Import routers
from .routers import market, etl, analysis, status

# Create FastAPI app
app = FastAPI(title="Financial Market Data Pipeline API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(market.router, prefix="/api/market", tags=["Market Data"])
app.include_router(etl.router, prefix="/api/etl", tags=["ETL Pipeline"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(status.router, prefix="/api/status", tags=["System Status"])

# Handle exceptions
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for all uncaught exceptions
    """
    error_detail = str(exc)
    status_code = 500
    
    if isinstance(exc, HTTPException):
        status_code = exc.status_code
        error_detail = exc.detail
    
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": error_detail
        }
    )

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check() -> Dict[str, Any]:
    """
    Simple health check endpoint
    """
    return {"status": "ok"}

# Mount static files for production
client_build_dir = Path(__file__).parent.parent.parent / "client" / "dist"
if client_build_dir.exists():
    app.mount("/", StaticFiles(directory=str(client_build_dir), html=True), name="static")