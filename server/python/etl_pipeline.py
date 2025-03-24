#!/usr/bin/env python3
"""
ETL Pipeline for Financial Market Data

This script handles the extraction, transformation, and loading of financial data
from the FRED API to our storage system.
"""

import os
import sys
import json
from datetime import datetime
import pandas as pd
import numpy as np
from fred_api import FredApiClient

# Dictionary mapping FRED series IDs to indicator metadata
INDICATOR_MAPPING = {
    "GDP": {
        "name": "Gross Domestic Product",
        "description": "Quarterly measure of US economic output",
        "frequency": "quarterly",
        "units": "billions_usd"
    },
    "UNRATE": {
        "name": "Unemployment Rate",
        "description": "Monthly unemployment rate in the US",
        "frequency": "monthly",
        "units": "percent"
    },
    "CPIAUCSL": {
        "name": "Consumer Price Index",
        "description": "Monthly consumer price index for all urban consumers",
        "frequency": "monthly",
        "units": "index"
    },
    "DGS10": {
        "name": "10-Year Treasury Yield",
        "description": "Market yield on U.S. Treasury securities at 10-year constant maturity",
        "frequency": "daily",
        "units": "percent"
    },
    "SP500": {
        "name": "S&P 500 Index",
        "description": "Standard & Poor's 500 index",
        "frequency": "daily",
        "units": "index"
    },
    "FEDFUNDS": {
        "name": "Federal Funds Rate",
        "description": "Interest rate at which depository institutions trade federal funds",
        "frequency": "monthly",
        "units": "percent"
    }
}

class ETLPipeline:
    """Pipeline for extracting, transforming, and loading financial data"""
    
    def __init__(self):
        """Initialize the ETL pipeline"""
        self.fred_client = FredApiClient()
        
    def extract(self, series_id, start_date=None, end_date=None):
        """Extract data from FRED API"""
        print(f"Extracting data for {series_id}...")
        
        # Get series info if not already in our mapping
        series_info = INDICATOR_MAPPING.get(series_id, None)
        if not series_info:
            metadata = self.fred_client.get_series_info(series_id)
            if metadata:
                series_info = {
                    "name": metadata.get("title", ""),
                    "description": metadata.get("notes", ""),
                    "frequency": metadata.get("frequency_short", ""),
                    "units": metadata.get("units_short", "")
                }
        
        # Get series data
        observations = self.fred_client.get_series_data(
            series_id,
            start_date,
            end_date
        )
        
        return {
            "metadata": series_info or {},
            "observations": observations
        }
    
    def transform(self, data):
        """Transform the extracted data"""
        print("Transforming data...")
        
        if not data or "observations" not in data:
            return {"metadata": data.get("metadata", {}), "transformed_data": []}
        
        # Convert to DataFrame for easier manipulation
        df = pd.DataFrame(data["observations"])
        
        # Convert date and value columns
        df["date"] = pd.to_datetime(df["date"])
        df["value"] = pd.to_numeric(df["value"], errors="coerce")
        
        # Handle missing values
        df["value"] = df["value"].fillna(method="ffill")
        
        # Calculate additional metrics (e.g., moving averages)
        if len(df) > 5:
            df["ma_5"] = df["value"].rolling(window=5).mean()
            df["ma_20"] = df["value"].rolling(window=20).mean()
        
        # Calculate percent changes
        df["pct_change"] = df["value"].pct_change() * 100
        
        # Convert back to records for storage
        transformed_data = df.to_dict(orient="records")
        
        return {
            "metadata": data.get("metadata", {}),
            "transformed_data": transformed_data
        }
    
    def load(self, series_id, transformed_data):
        """Load transformed data (simulated - would write to database in production)"""
        print(f"Loading data for {series_id}...")
        
        output = {
            "indicator": series_id,
            "metadata": transformed_data.get("metadata", {}),
            "data": transformed_data.get("transformed_data", []),
            "timestamp": datetime.now().isoformat()
        }
        
        # In a real implementation, we would store this data in a database
        # For now, we'll return the data to be handled by the calling function
        return output
    
    def run_pipeline(self, series_id, start_date=None, end_date=None):
        """Run the full ETL pipeline for a given series"""
        print(f"Running ETL pipeline for {series_id}...")
        
        # Extract
        extracted_data = self.extract(series_id, start_date, end_date)
        
        # Transform
        transformed_data = self.transform(extracted_data)
        
        # Load
        loaded_data = self.load(series_id, transformed_data)
        
        print(f"ETL pipeline completed for {series_id}")
        return loaded_data

# Command line interface
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Run ETL pipeline for financial data')
    parser.add_argument('series_id', help='FRED series ID (e.g., GDP, UNRATE)')
    parser.add_argument('--start_date', help='Start date (YYYY-MM-DD)')
    parser.add_argument('--end_date', help='End date (YYYY-MM-DD)')
    parser.add_argument('--output', help='Output file path (default: stdout)')
    
    args = parser.parse_args()
    pipeline = ETLPipeline()
    
    result = pipeline.run_pipeline(args.series_id, args.start_date, args.end_date)
    
    # Output results
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(result, f, indent=2)
    else:
        print(json.dumps(result, indent=2))
