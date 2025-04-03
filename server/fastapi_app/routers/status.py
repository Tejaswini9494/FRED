from fastapi import APIRouter, HTTPException
from ..storage import storage
import random
from typing import Dict, Any

router = APIRouter()

@router.get("/")
async def get_system_status() -> Dict[str, Any]:
    """
    Get system status including pipeline, API, database, and cache information
    """
    try:
        indicators = storage.get_indicators()
        recent_jobs = storage.get_etl_jobs(5)
        
        # Check pipeline status
        in_progress_jobs = [job for job in recent_jobs if job.status == "in_progress"]
        pipeline_status = "active" if in_progress_jobs else "idle"
        
        # Get most recent job
        completed_jobs = [job for job in recent_jobs if job.status == "completed"]
        last_run = completed_jobs[0].endTime if completed_jobs else None
        
        # API status
        api_status = "connected" if indicators else "disconnected"
        api_calls = random.randint(100, 500)  # Simulated API call count
        
        return {
            "success": True, 
            "data": {
                "pipeline": {
                    "status": pipeline_status,
                    "lastRun": last_run
                },
                "api": {
                    "status": api_status,
                    "callCount": api_calls,
                    "limit": 500
                },
                "database": {
                    "status": "healthy",
                    "storageUsed": 42  # Simulated storage percentage
                },
                "cache": {
                    "status": "operational",
                    "hitRate": 89  # Simulated cache hit rate
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))