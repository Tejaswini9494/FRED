#!/usr/bin/env python3
"""
ETL Pipeline for Financial Market Data

This script handles the extraction, transformation, and loading of financial data
from the FRED API to our storage system.
"""

import os
import sys
import json
import argparse
from datetime import datetime, timedelta
import random
from typing import Dict, List, Any, Optional

# Import the FRED API client
from fred_api import FredApiClient

class ETLPipeline:
    """Pipeline for extracting, transforming, and loading financial data"""
    
    def __init__(self):
        """Initialize the ETL pipeline"""
        self.fred_client = FredApiClient()
    
    def extract(self, series_id, start_date=None, end_date=None):
        """Extract data from FRED API"""
        print(f"Extracting data for {series_id} from FRED API")
        
        # Get series data
        raw_data = self.fred_client.get_series_data(series_id, start_date, end_date)
        
        # Get series metadata
        metadata = self.fred_client.get_series_info(series_id)
        
        return {"data": raw_data, "metadata": metadata}
    
    def transform(self, data):
        """Transform the extracted data"""
        print("Transforming data")
        
        if not data or not data.get("data"):
            return data
        
        transformed_data = []
        
        # Process each data point
        for item in data["data"]:
            # Convert date string to datetime
            date_str = item["date"]
            value_str = item["value"]
            
            # Parse the value (could add more transformations here)
            try:
                value = float(value_str)
                # Apply any transformations as needed
                transformed_data.append({
                    "date": date_str,
                    "value": str(value)
                })
            except ValueError:
                # Skip invalid values
                print(f"Skipping invalid value: {value_str}")
        
        # Update the data with transformed values
        data["data"] = transformed_data
        
        return data
    
    def load(self, series_id, transformed_data):
        """Load transformed data (simulated - would write to database in production)"""
        print(f"Loading transformed data for {series_id}")
        
        # In a real implementation, this would write to a database
        # For now, just return the data
        
        # Add a processing summary
        if transformed_data and "data" in transformed_data:
            transformed_data["processed"] = {
                "count": len(transformed_data["data"]),
                "timestamp": datetime.now().isoformat()
            }
        
        return transformed_data
    
    def run_pipeline(self, series_id, start_date=None, end_date=None):
        """Run the full ETL pipeline for a given series"""
        print(f"Running ETL pipeline for {series_id}")
        
        try:
            # Extract
            extracted_data = self.extract(series_id, start_date, end_date)
            
            # Transform
            transformed_data = self.transform(extracted_data)
            
            # Load
            result = self.load(series_id, transformed_data)
            
            print(f"ETL pipeline completed for {series_id}")
            
            return result
        
        except Exception as e:
            print(f"Error in ETL pipeline: {str(e)}")
            return {"error": str(e)}


def main():
    """Main function for command-line use"""
    parser = argparse.ArgumentParser(description="Financial Data ETL Pipeline")
    parser.add_argument("series_id", help="FRED series ID to process")
    parser.add_argument("--start_date", help="Start date (YYYY-MM-DD)")
    parser.add_argument("--end_date", help="End date (YYYY-MM-DD)")
    
    args = parser.parse_args()
    
    # Create and run the pipeline
    pipeline = ETLPipeline()
    result = pipeline.run_pipeline(args.series_id, args.start_date, args.end_date)
    
    # Output the result as JSON
    print(json.dumps(result))


if __name__ == "__main__":
    main()