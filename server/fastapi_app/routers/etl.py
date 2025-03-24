from fastapi import APIRouter, HTTPException, Query, BackgroundTasks, Body
from typing import Dict, List, Any, Optional
from datetime import datetime
import json
from pydantic import BaseModel, validator
from ..storage import storage
from ..utils import run_python_script
from ..models import InsertEtlJob

router = APIRouter()

# Request Models
class RunEtlRequest(BaseModel):
    series_id: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class ScheduleEtlRequest(BaseModel):
    task: str
    scheduled_time: str
    series_id: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    
    @validator('scheduled_time')
    def validate_scheduled_time(cls, v):
        try:
            datetime.fromisoformat(v)
            return v
        except ValueError:
            raise ValueError("Invalid date format for scheduled_time")

# Helper function to run the ETL pipeline
async def run_etl_pipeline(job_id: int, series_id: str, start_date: Optional[str] = None, end_date: Optional[str] = None):
    try:
        # Prepare arguments for the ETL pipeline script
        args = [series_id]
        
        if start_date:
            args.extend(["--start_date", start_date])
        
        if end_date:
            args.extend(["--end_date", end_date])
        
        # Run the ETL pipeline
        result = await run_python_script("etl_pipeline.py", args)
        
        # Process the result
        records_processed = len(result.get("data", [])) if result.get("data") else 0
        
        # Update the job status
        storage.update_etl_job(job_id, {
            "status": "completed",
            "endTime": datetime.now(),
            "recordsProcessed": records_processed,
            "metadata": result
        })
        
        # If we have indicator metadata, update or create it
        if result.get("metadata"):
            existing_indicator = storage.get_indicator_by_symbol(series_id)
            
            if existing_indicator:
                storage.update_indicator(existing_indicator.id, {
                    "lastUpdated": datetime.now()
                })
            else:
                storage.create_indicator({
                    "symbol": series_id,
                    "name": result["metadata"].get("name", series_id),
                    "description": result["metadata"].get("description", ""),
                    "frequency": result["metadata"].get("frequency", "unknown"),
                    "units": result["metadata"].get("units", ""),
                    "source": "FRED",
                    "lastUpdated": datetime.now()
                })
        
        print(f"ETL job {job_id} completed successfully")
    except Exception as e:
        print(f"ETL job {job_id} failed: {e}")
        
        # Update the job with the error information
        storage.update_etl_job(job_id, {
            "status": "failed",
            "endTime": datetime.now(),
            "error": str(e)
        })

@router.get("/jobs")
async def get_etl_jobs(
    limit: Optional[int] = Query(None, description="Maximum number of jobs to return")
) -> Dict[str, Any]:
    """
    Get ETL job history
    """
    try:
        jobs = storage.get_etl_jobs(limit)
        return {"success": True, "data": jobs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/jobs/{job_id}")
async def get_etl_job(job_id: int) -> Dict[str, Any]:
    """
    Get specific ETL job
    """
    try:
        job = storage.get_etl_job(job_id)
        
        if not job:
            raise HTTPException(
                status_code=404,
                detail=f"ETL job with ID {job_id} not found"
            )
        
        return {"success": True, "data": job}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/run")
async def create_run_etl_job(
    request: RunEtlRequest,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """
    Create and run a new ETL job
    """
    try:
        if not request.series_id:
            raise HTTPException(
                status_code=400,
                detail="series_id is required"
            )
        
        # Create a new ETL job record
        new_job = storage.create_etl_job(InsertEtlJob(
            task=f"{request.series_id} Dataset Update",
            status="in_progress",
            startTime=datetime.now(),
            endTime=None,
            recordsProcessed=None,
            error=None,
            metadata={
                "series_id": request.series_id,
                "start_date": request.start_date,
                "end_date": request.end_date
            }
        ))
        
        # Run the ETL pipeline asynchronously
        background_tasks.add_task(
            run_etl_pipeline, 
            new_job.id, 
            request.series_id, 
            request.start_date, 
            request.end_date
        )
        
        return {
            "success": True,
            "message": "ETL job started",
            "data": {"job_id": new_job.id}
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/schedule")
async def schedule_etl_job(
    request: ScheduleEtlRequest
) -> Dict[str, Any]:
    """
    Schedule a new ETL job
    """
    try:
        scheduled_time = datetime.fromisoformat(request.scheduled_time)
        
        # Create a scheduled job record
        new_job = storage.create_etl_job(InsertEtlJob(
            task=request.task,
            status="scheduled",
            startTime=scheduled_time,
            endTime=None,
            recordsProcessed=None,
            error=None,
            metadata={
                "series_id": request.series_id,
                "start_date": request.start_date,
                "end_date": request.end_date
            }
        ))
        
        return {
            "success": True,
            "message": "ETL job scheduled",
            "data": {"job_id": new_job.id}
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_pipeline_status() -> Dict[str, Any]:
    """
    Get pipeline status
    """
    try:
        # Get recent jobs to determine overall status
        recent_jobs = storage.get_etl_jobs(5)
        
        # Check if any jobs are in progress
        in_progress_jobs = [job for job in recent_jobs if job.status == "in_progress"]
        status = "active" if in_progress_jobs else "idle"
        
        # Get the most recent completed job
        completed_jobs = [job for job in recent_jobs if job.status == "completed"]
        last_run = completed_jobs[0].endTime if completed_jobs else None
        
        # Get counts of jobs by status
        job_counts = {
            "completed": len([job for job in recent_jobs if job.status == "completed"]),
            "failed": len([job for job in recent_jobs if job.status == "failed"]),
            "inProgress": len(in_progress_jobs),
            "scheduled": len([job for job in recent_jobs if job.status == "scheduled"])
        }
        
        return {
            "success": True,
            "data": {
                "status": status,
                "lastRun": last_run,
                "jobCounts": job_counts,
                "recentJobs": recent_jobs
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))