from fastapi import APIRouter, HTTPException, Query
from datetime import datetime
from typing import List, Dict, Any, Optional
import json
from ..storage import storage
from ..utils import run_python_script

router = APIRouter()

@router.get("/indicators")
async def get_indicators() -> Dict[str, Any]:
    """
    Get list of available indicators
    """
    try:
        indicators = storage.get_indicators()
        return {"success": True, "data": indicators}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/indicators/{symbol}")
async def get_indicator(
    symbol: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    frequency: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get specific indicator by symbol
    """
    try:
        indicator = storage.get_indicator_by_symbol(symbol)
        
        if not indicator:
            raise HTTPException(
                status_code=404, 
                detail=f"Indicator with symbol {symbol} not found"
            )
        
        # Get data from FRED API
        args = ["get_series", "--series_id", symbol]
        
        if start_date:
            args.extend(["--start_date", start_date])
        
        if end_date:
            args.extend(["--end_date", end_date])
        
        if frequency:
            args.extend(["--frequency", frequency])
        
        data = await run_python_script("fred_api.py", args)
        
        return {
            "success": True,
            "data": {
                "indicator": symbol,
                "frequency": indicator.frequency,
                "unit": indicator.units,
                "values": [
                    {"date": item["date"], "value": float(item["value"])}
                    for item in data
                ],
                "metadata": {
                    "source": indicator.source,
                    "last_updated": indicator.lastUpdated,
                    "notes": indicator.description
                }
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
async def search_indicators(
    query: str = Query(..., description="Search text for indicators"),
    limit: int = Query(10, description="Maximum number of results to return")
) -> Dict[str, Any]:
    """
    Search for indicators
    """
    try:
        if not query:
            raise HTTPException(
                status_code=400, 
                detail="Search query parameter is required"
            )
        
        args = ["search", "--search_text", query, "--limit", str(limit)]
        results = await run_python_script("fred_api.py", args)
        
        return {"success": True, "data": results}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/overview")
async def get_market_overview() -> Dict[str, Any]:
    """
    Get market overview data (multiple indicators for dashboard)
    """
    try:
        # These are common indicators for the dashboard overview
        indicators = ["GDP", "UNRATE", "CPIAUCSL", "DGS10", "SP500"]
        result = {}
        
        for symbol in indicators:
            try:
                args = ["get_series", "--series_id", symbol]
                data = await run_python_script("fred_api.py", args)
                
                if data and len(data) > 0:
                    # Sort by date, newest first
                    sorted_data = sorted(
                        data, 
                        key=lambda x: datetime.strptime(x["date"], "%Y-%m-%d"), 
                        reverse=True
                    )
                    latest_data = sorted_data[0]
                    
                    # Calculate percentage change from previous value
                    percent_change = 0
                    if len(data) > 1:
                        previous_data = sorted_data[1]
                        current = float(latest_data["value"])
                        previous = float(previous_data["value"])
                        
                        if previous != 0:
                            percent_change = ((current - previous) / previous) * 100
                    
                    # Store in result
                    result[symbol] = {
                        "value": float(latest_data["value"]),
                        "date": latest_data["date"],
                        "percentChange": round(percent_change, 2)
                    }
            except Exception as e:
                # Continue with other indicators even if one fails
                print(f"Error fetching data for {symbol}: {e}")
        
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))