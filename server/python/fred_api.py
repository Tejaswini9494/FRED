#!/usr/bin/env python3
"""
FRED API Client for the Financial Market Data Pipeline

This script handles retrieving data from the Federal Reserve Economic Data (FRED) API.
"""

import os
import json
import sys
import requests
from datetime import datetime
import pandas as pd

# Set API key from environment or use default
FRED_API_KEY = os.environ.get('FRED_API_KEY', 'your_api_key')
BASE_URL = "https://api.stlouisfed.org/fred/series"

class FredApiClient:
    """Client for interacting with the FRED API"""
    
    def __init__(self, api_key=None):
        """Initialize with API key"""
        self.api_key = api_key or FRED_API_KEY
        self.base_url = BASE_URL
        
    def get_series_data(self, series_id, start_date=None, end_date=None, frequency=None):
        """Get time series data for a specific FRED series ID"""
        params = {
            'series_id': series_id,
            'api_key': self.api_key,
            'file_type': 'json'
        }
        
        if start_date:
            params['observation_start'] = start_date
        if end_date:
            params['observation_end'] = end_date
        if frequency:
            params['frequency'] = frequency
            
        try:
            response = requests.get(f"{self.base_url}/observations", params=params)
            response.raise_for_status()
            data = response.json()
            return data.get('observations', [])
        except requests.RequestException as e:
            print(f"Error fetching data for series {series_id}: {e}", file=sys.stderr)
            return []
    
    def get_series_info(self, series_id):
        """Get metadata for a specific FRED series ID"""
        params = {
            'series_id': series_id,
            'api_key': self.api_key,
            'file_type': 'json'
        }
        
        try:
            response = requests.get(f"{self.base_url}", params=params)
            response.raise_for_status()
            data = response.json()
            return data.get('seriess', [])[0] if data.get('seriess') else None
        except requests.RequestException as e:
            print(f"Error fetching metadata for series {series_id}: {e}", file=sys.stderr)
            return None
    
    def search_series(self, search_text, limit=10):
        """Search for series matching the given text"""
        params = {
            'search_text': search_text,
            'api_key': self.api_key,
            'file_type': 'json',
            'limit': limit
        }
        
        try:
            response = requests.get(f"{self.base_url}/search", params=params)
            response.raise_for_status()
            data = response.json()
            return data.get('seriess', [])
        except requests.RequestException as e:
            print(f"Error searching for series with text '{search_text}': {e}", file=sys.stderr)
            return []
            
    def to_dataframe(self, observations):
        """Convert FRED observations to a pandas DataFrame"""
        if not observations:
            return pd.DataFrame()
            
        df = pd.DataFrame(observations)
        df['date'] = pd.to_datetime(df['date'])
        df['value'] = pd.to_numeric(df['value'], errors='coerce')
        return df.sort_values('date')

# Command line interface
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Fetch data from FRED API')
    parser.add_argument('action', choices=['get_series', 'get_info', 'search'], help='Action to perform')
    parser.add_argument('--series_id', help='FRED series ID (e.g., GDP, UNRATE)')
    parser.add_argument('--search_text', help='Text to search for series')
    parser.add_argument('--start_date', help='Start date (YYYY-MM-DD)')
    parser.add_argument('--end_date', help='End date (YYYY-MM-DD)')
    parser.add_argument('--frequency', help='Data frequency (e.g., monthly, quarterly)')
    parser.add_argument('--limit', type=int, default=10, help='Limit search results')
    
    args = parser.parse_args()
    client = FredApiClient()
    
    if args.action == 'get_series' and args.series_id:
        observations = client.get_series_data(
            args.series_id, 
            args.start_date, 
            args.end_date, 
            args.frequency
        )
        print(json.dumps(observations, indent=2))
    elif args.action == 'get_info' and args.series_id:
        info = client.get_series_info(args.series_id)
        print(json.dumps(info, indent=2))
    elif args.action == 'search' and args.search_text:
        results = client.search_series(args.search_text, args.limit)
        print(json.dumps(results, indent=2))
    else:
        parser.print_help()
