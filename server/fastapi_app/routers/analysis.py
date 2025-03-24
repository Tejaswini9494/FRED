from fastapi import APIRouter, HTTPException, Query
from typing import Dict, List, Any, Optional
from datetime import datetime
import json
from ..storage import storage
from ..utils import run_python_script
from ..models import InsertAnalysisResult

router = APIRouter()

@router.get("/correlation")
async def get_correlation_analysis(
    series: str = Query(..., description="Comma-separated list of series IDs"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
) -> Dict[str, Any]:
    """
    Get correlation matrix between economic indicators
    """
    try:
        if not series:
            raise HTTPException(
                status_code=400,
                detail="series parameter is required (comma-separated list of series IDs)"
            )
        
        # Convert comma-separated string to list
        series_ids = series.split(",")
        
        # Prepare arguments for the correlation analysis
        args = ["correlation", "--series", series]
        
        if start_date:
            args.extend(["--start_date", start_date])
        
        if end_date:
            args.extend(["--end_date", end_date])
        
        # Run the correlation analysis
        correlation_data = await run_python_script("analysis.py", args)
        
        # Store the analysis result
        storage.create_analysis_result(InsertAnalysisResult(
            type="correlation",
            indicators=series_ids,
            parameters={"start_date": start_date, "end_date": end_date},
            results=correlation_data,
            createdAt=datetime.now()
        ))
        
        return {"success": True, "data": correlation_data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/forecast")
async def get_time_series_forecast(
    series: str = Query(..., description="Comma-separated list of series IDs (only first will be used)"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    model: str = Query("arima", description="Forecasting model to use"),
    periods: int = Query(10, description="Number of periods to forecast")
) -> Dict[str, Any]:
    """
    Get time series forecasts
    """
    try:
        if not series:
            raise HTTPException(
                status_code=400,
                detail="series parameter is required"
            )
        
        # Use the first series ID for forecasting
        series_id = series.split(",")[0]
        
        # Prepare arguments for the forecasting analysis
        args = [
            "forecast",
            "--series", series_id,
            "--model", model,
            "--periods", str(periods)
        ]
        
        if start_date:
            args.extend(["--start_date", start_date])
        
        if end_date:
            args.extend(["--end_date", end_date])
        
        # Run the forecasting analysis
        forecast_data = await run_python_script("analysis.py", args)
        
        # Store the analysis result if there's no error
        if not forecast_data.get("error"):
            storage.create_analysis_result(InsertAnalysisResult(
                type="forecast",
                indicators=[series_id],
                parameters={
                    "start_date": start_date,
                    "end_date": end_date,
                    "model": model,
                    "periods": periods
                },
                results=forecast_data,
                createdAt=datetime.now()
            ))
        
        return {"success": True, "data": forecast_data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/moving-averages")
async def get_moving_averages(
    series: str = Query(..., description="Comma-separated list of series IDs (only first will be used)"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
) -> Dict[str, Any]:
    """
    Get moving averages
    """
    try:
        if not series:
            raise HTTPException(
                status_code=400,
                detail="series parameter is required"
            )
        
        # Use the first series ID for moving averages
        series_id = series.split(",")[0]
        
        # Prepare arguments for the moving averages analysis
        args = ["moving_averages", "--series", series_id]
        
        if start_date:
            args.extend(["--start_date", start_date])
        
        if end_date:
            args.extend(["--end_date", end_date])
        
        # Run the moving averages analysis
        moving_averages_data = await run_python_script("analysis.py", args)
        
        return {"success": True, "data": moving_averages_data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/volatility")
async def get_volatility_analysis(
    series: str = Query(..., description="Comma-separated list of series IDs (only first will be used)"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    window: int = Query(30, description="Window size for rolling volatility")
) -> Dict[str, Any]:
    """
    Get volatility analysis
    """
    try:
        if not series:
            raise HTTPException(
                status_code=400,
                detail="series parameter is required"
            )
        
        # Use the first series ID for volatility analysis
        series_id = series.split(",")[0]
        
        # Prepare arguments for the volatility analysis
        args = [
            "volatility",
            "--series", series_id,
            "--window", str(window)
        ]
        
        if start_date:
            args.extend(["--start_date", start_date])
        
        if end_date:
            args.extend(["--end_date", end_date])
        
        # Run the volatility analysis
        volatility_data = await run_python_script("analysis.py", args)
        
        return {"success": True, "data": volatility_data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/results")
async def get_all_analysis_results(
    type: Optional[str] = Query(None, description="Filter by analysis type")
) -> Dict[str, Any]:
    """
    Get all previous analysis results
    """
    try:
        results = storage.get_analysis_results(type)
        return {"success": True, "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/results/{result_id}")
async def get_analysis_result(result_id: int) -> Dict[str, Any]:
    """
    Get specific analysis result
    """
    try:
        result = storage.get_analysis_result(result_id)
        
        if not result:
            raise HTTPException(
                status_code=404,
                detail=f"Analysis result with ID {result_id} not found"
            )
        
        return {"success": True, "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))