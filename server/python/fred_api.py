#!/usr/bin/env python3
"""
FRED API Client for the Financial Market Data Pipeline

This script handles retrieving data from the Federal Reserve Economic Data (FRED) API.
"""

import os
import sys
import json
import argparse
from datetime import datetime, timedelta
import random
from typing import Dict, List, Any, Optional

class FredApiClient:
    """Client for interacting with the FRED API"""
    
    def __init__(self, api_key=None):
        """Initialize with API key"""
        self.api_key = api_key or os.environ.get("FRED_API_KEY", "")
        
    def get_series_data(self, series_id, start_date=None, end_date=None, frequency=None):
        """Get time series data for a specific FRED series ID"""
        print(f"Fetching data for {series_id} from FRED API")
        
        # For testing purposes, generate simulated data
        data = self._generate_sample_data(series_id, start_date, end_date)
        
        return data
    
    def get_series_info(self, series_id):
        """Get metadata for a specific FRED series ID"""
        series_metadata = {
            "GDP": {
                "id": "GDP",
                "title": "Gross Domestic Product",
                "units": "Billions of Dollars",
                "frequency": "Quarterly",
                "notes": "Inflation-adjusted annual rate"
            },
            "UNRATE": {
                "id": "UNRATE",
                "title": "Unemployment Rate",
                "units": "Percent",
                "frequency": "Monthly",
                "notes": "Seasonally adjusted"
            },
            "CPIAUCSL": {
                "id": "CPIAUCSL",
                "title": "Consumer Price Index for All Urban Consumers: All Items",
                "units": "Index 1982-1984=100",
                "frequency": "Monthly",
                "notes": "Seasonally adjusted"
            },
            "DGS10": {
                "id": "DGS10",
                "title": "10-Year Treasury Constant Maturity Rate",
                "units": "Percent",
                "frequency": "Daily",
                "notes": "Not seasonally adjusted"
            },
            "SP500": {
                "id": "SP500",
                "title": "S&P 500",
                "units": "Index",
                "frequency": "Daily",
                "notes": "Not seasonally adjusted"
            }
        }
        
        return series_metadata.get(series_id, {
            "id": series_id,
            "title": f"Unknown Series: {series_id}",
            "units": "Unknown",
            "frequency": "Unknown",
            "notes": "Metadata not available"
        })
    
    def search_series(self, search_text, limit=10):
        """Search for series matching the given text"""
        common_series = [
            {
                "id": "GDP",
                "title": "Gross Domestic Product",
                "units": "Billions of Dollars",
                "frequency": "Quarterly"
            },
            {
                "id": "UNRATE",
                "title": "Unemployment Rate",
                "units": "Percent",
                "frequency": "Monthly"
            },
            {
                "id": "CPIAUCSL",
                "title": "Consumer Price Index for All Urban Consumers: All Items",
                "units": "Index 1982-1984=100",
                "frequency": "Monthly"
            },
            {
                "id": "DGS10",
                "title": "10-Year Treasury Constant Maturity Rate",
                "units": "Percent",
                "frequency": "Daily"
            },
            {
                "id": "SP500",
                "title": "S&P 500",
                "units": "Index",
                "frequency": "Daily"
            },
            {
                "id": "MORTGAGE30US",
                "title": "30-Year Fixed Rate Mortgage Average in the United States",
                "units": "Percent",
                "frequency": "Weekly"
            },
            {
                "id": "PCE",
                "title": "Personal Consumption Expenditures",
                "units": "Billions of Dollars",
                "frequency": "Monthly"
            },
            {
                "id": "INDPRO",
                "title": "Industrial Production Index",
                "units": "Index 2017=100",
                "frequency": "Monthly"
            },
            {
                "id": "HOUST",
                "title": "Housing Starts: Total New Privately Owned",
                "units": "Thousands of Units",
                "frequency": "Monthly"
            },
            {
                "id": "GS2",
                "title": "2-Year Treasury Constant Maturity Rate",
                "units": "Percent",
                "frequency": "Daily"
            }
        ]
        
        # Filter based on search text
        if search_text:
            search_text = search_text.lower()
            results = [
                s for s in common_series 
                if search_text in s["id"].lower() or search_text in s["title"].lower()
            ]
        else:
            results = common_series
        
        # Apply limit
        return results[:min(limit, len(results))]
    
    def to_dataframe(self, observations):
        """Convert FRED observations to a pandas DataFrame"""
        # In a real implementation, this would convert to pandas DataFrame
        return observations
    
    def _generate_sample_data(self, series_id, start_date=None, end_date=None):
        """Generate simulated data for testing"""
        # Set default date range if not provided
        if not end_date:
            end_date = datetime.now().strftime("%Y-%m-%d")
        
        end_date_obj = datetime.strptime(end_date, "%Y-%m-%d") if end_date else datetime.now()
        
        if not start_date:
            # Default to 1 year of data
            start_date_obj = end_date_obj - timedelta(days=365)
            start_date = start_date_obj.strftime("%Y-%m-%d")
        else:
            start_date_obj = datetime.strptime(start_date, "%Y-%m-%d")
        
        # Generate appropriate frequency based on series
        if series_id in ["DGS10", "SP500"]:
            # Daily data
            date_points = self._generate_daily_dates(start_date_obj, end_date_obj)
        elif series_id in ["UNRATE", "CPIAUCSL"]:
            # Monthly data
            date_points = self._generate_monthly_dates(start_date_obj, end_date_obj)
        elif series_id == "GDP":
            # Quarterly data
            date_points = self._generate_quarterly_dates(start_date_obj, end_date_obj)
        else:
            # Default to monthly
            date_points = self._generate_monthly_dates(start_date_obj, end_date_obj)
        
        # Generate appropriate values based on series
        values = []
        
        if series_id == "GDP":
            # GDP: Around 21-25 trillion with slight growth
            base = 21000
            for i, _ in enumerate(date_points):
                values.append(round(base + (i * 50) + random.uniform(-20, 30), 1))
        
        elif series_id == "UNRATE":
            # Unemployment rate: Around 3-6%
            base = 4.0
            for i, _ in enumerate(date_points):
                values.append(round(base + random.uniform(-1.0, 1.0), 1))
        
        elif series_id == "CPIAUCSL":
            # CPI: Around 250-300 with growth
            base = 280
            for i, _ in enumerate(date_points):
                values.append(round(base + (i * 0.5) + random.uniform(-0.5, 1.0), 1))
        
        elif series_id == "DGS10":
            # 10-Year Treasury: Around 3-5%
            base = 4.0
            for i, _ in enumerate(date_points):
                values.append(round(base + random.uniform(-0.5, 0.5), 2))
        
        elif series_id == "SP500":
            # S&P 500: Around 4000-5000
            base = 4500
            for i, _ in enumerate(date_points):
                # More volatility for stock market
                values.append(round(base + (i * 2) + random.uniform(-100, 100), 2))
        
        else:
            # Generic data
            base = 100
            for i, _ in enumerate(date_points):
                values.append(round(base + (i * 0.1) + random.uniform(-5, 5), 2))
        
        # Combine dates and values
        data = [
            {"date": date, "value": str(value)}
            for date, value in zip(date_points, values)
        ]
        
        return data
    
    def _generate_daily_dates(self, start_date, end_date):
        """Generate a list of daily dates between start and end"""
        dates = []
        current = start_date
        while current <= end_date:
            # Skip weekends
            if current.weekday() < 5:  # Monday to Friday
                dates.append(current.strftime("%Y-%m-%d"))
            current += timedelta(days=1)
        return dates
    
    def _generate_monthly_dates(self, start_date, end_date):
        """Generate a list of monthly dates between start and end"""
        dates = []
        current = start_date.replace(day=1)  # First day of month
        while current <= end_date:
            dates.append(current.strftime("%Y-%m-%d"))
            # Move to next month
            if current.month == 12:
                current = current.replace(year=current.year + 1, month=1)
            else:
                current = current.replace(month=current.month + 1)
        return dates
    
    def _generate_quarterly_dates(self, start_date, end_date):
        """Generate a list of quarterly dates between start and end"""
        dates = []
        # Start at beginning of quarter
        quarter_month = (start_date.month - 1) // 3 * 3 + 1
        current = start_date.replace(month=quarter_month, day=1)
        
        while current <= end_date:
            dates.append(current.strftime("%Y-%m-%d"))
            # Move to next quarter
            if current.month >= 10:  # Q4
                current = current.replace(year=current.year + 1, month=1)
            else:
                current = current.replace(month=current.month + 3)
        return dates


def main():
    """Main function for command-line use"""
    parser = argparse.ArgumentParser(description="FRED API Client")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # Get series data command
    get_series_parser = subparsers.add_parser("get_series", help="Get time series data")
    get_series_parser.add_argument("--series_id", required=True, help="FRED series ID")
    get_series_parser.add_argument("--start_date", help="Start date (YYYY-MM-DD)")
    get_series_parser.add_argument("--end_date", help="End date (YYYY-MM-DD)")
    get_series_parser.add_argument("--frequency", help="Frequency")
    
    # Search command
    search_parser = subparsers.add_parser("search", help="Search for series")
    search_parser.add_argument("--search_text", required=True, help="Search text")
    search_parser.add_argument("--limit", type=int, default=10, help="Maximum results")
    
    # Parse arguments
    args = parser.parse_args()
    
    # Create client
    client = FredApiClient()
    
    if args.command == "get_series":
        # Get series data
        data = client.get_series_data(
            args.series_id, 
            args.start_date, 
            args.end_date, 
            args.frequency
        )
        print(json.dumps(data))
    
    elif args.command == "search":
        # Search for series
        results = client.search_series(args.search_text, args.limit)
        print(json.dumps(results))
    
    else:
        parser.print_help()


if __name__ == "__main__":
    main()