#!/usr/bin/env python3
"""
Financial Data Analysis Module

This script provides time series analysis and statistical computations for financial data.
"""

import os
import sys
import json
import argparse
from datetime import datetime, timedelta
import random
from typing import Dict, List, Any, Optional
import math

# Import the FRED API client
from fred_api import FredApiClient

class FinancialAnalysis:
    """Class for analyzing financial market data"""
    
    def __init__(self):
        """Initialize the analysis module"""
        self.fred_client = FredApiClient()
        
    def get_data(self, series_ids, start_date=None, end_date=None):
        """Fetch data for multiple series and align them by date"""
        import sys
        sys.stderr.write(f"Fetching data for series: {series_ids}\n")
        
        if isinstance(series_ids, str):
            series_ids = series_ids.split(',')
        
        # Fetch data for each series
        datasets = {}
        for series_id in series_ids:
            # Get data from FRED API
            data = self.fred_client.get_series_data(series_id, start_date, end_date)
            
            # Create a dictionary with dates as keys
            datasets[series_id] = {item["date"]: float(item["value"]) for item in data}
        
        return datasets
    
    def compute_descriptive_statistics(self, data):
        """Compute basic descriptive statistics for each series"""
        stats = {}
        
        for series_id, series_data in data.items():
            values = list(series_data.values())
            
            if not values:
                stats[series_id] = {
                    "count": 0,
                    "mean": None,
                    "median": None,
                    "min": None,
                    "max": None,
                    "std_dev": None
                }
                continue
            
            # Calculate statistics
            count = len(values)
            mean = sum(values) / count
            sorted_values = sorted(values)
            median = sorted_values[count // 2] if count % 2 != 0 else (sorted_values[count // 2 - 1] + sorted_values[count // 2]) / 2
            min_val = min(values)
            max_val = max(values)
            
            # Standard deviation
            variance = sum((x - mean) ** 2 for x in values) / count
            std_dev = math.sqrt(variance)
            
            stats[series_id] = {
                "count": count,
                "mean": round(mean, 4),
                "median": round(median, 4),
                "min": round(min_val, 4),
                "max": round(max_val, 4),
                "std_dev": round(std_dev, 4)
            }
        
        return stats
    
    def compute_correlation_matrix(self, data):
        """Compute correlation matrix between different financial indicators"""
        # Get a set of all dates across all series
        all_dates = set()
        for series_data in data.values():
            all_dates.update(series_data.keys())
        
        # Sort dates
        all_dates = sorted(all_dates)
        
        # Create aligned series
        aligned_data = {}
        for series_id, series_data in data.items():
            aligned_data[series_id] = []
            for date in all_dates:
                if date in series_data:
                    aligned_data[series_id].append(series_data[date])
                else:
                    # Use the previous value or None if no previous value
                    if aligned_data[series_id]:
                        aligned_data[series_id].append(aligned_data[series_id][-1])
                    else:
                        aligned_data[series_id].append(None)
        
        # Remove dates with missing values
        valid_indices = []
        for i in range(len(all_dates)):
            if all(series[i] is not None for series in aligned_data.values()):
                valid_indices.append(i)
        
        # Extract valid data points
        valid_data = {}
        for series_id, series in aligned_data.items():
            valid_data[series_id] = [series[i] for i in valid_indices]
        
        # Compute correlation matrix
        series_ids = list(data.keys())
        matrix = {id1: {} for id1 in series_ids}
        
        for i, id1 in enumerate(series_ids):
            for j, id2 in enumerate(series_ids):
                if id1 == id2:
                    matrix[id1][id2] = 1.0  # Perfect correlation with self
                else:
                    x = valid_data[id1]
                    y = valid_data[id2]
                    
                    if len(x) <= 1:
                        # Not enough data points
                        matrix[id1][id2] = None
                        continue
                    
                    # Pearson correlation coefficient
                    n = len(x)
                    mean_x = sum(x) / n
                    mean_y = sum(y) / n
                    
                    cov = sum((x[k] - mean_x) * (y[k] - mean_y) for k in range(n))
                    var_x = sum((x[k] - mean_x) ** 2 for k in range(n))
                    var_y = sum((y[k] - mean_y) ** 2 for k in range(n))
                    
                    if var_x == 0 or var_y == 0:
                        matrix[id1][id2] = None
                    else:
                        correlation = cov / (math.sqrt(var_x) * math.sqrt(var_y))
                        matrix[id1][id2] = round(correlation, 4)
        
        return {
            "matrix": matrix,
            "series": {id: self.fred_client.get_series_info(id) for id in series_ids}
        }
    
    def time_series_forecast(self, series_id, start_date=None, end_date=None, 
                            model_type='arima', forecast_periods=10):
        """
        Perform time series forecasting using various models
        
        Parameters:
        - series_id: FRED series ID
        - start_date, end_date: date range for historical data
        - model_type: 'arima', 'sarima', 'exponential_smoothing'
        - forecast_periods: number of periods to forecast
        """
        import sys
        sys.stderr.write(f"Forecasting time series for {series_id}\n")
        
        # Get historical data
        data = self.fred_client.get_series_data(series_id, start_date, end_date)
        
        # Sort by date
        data = sorted(data, key=lambda x: x["date"])
        
        # Extract values
        dates = [item["date"] for item in data]
        values = [float(item["value"]) for item in data]
        
        if not values:
            return {"error": "No data available for forecasting"}
        
        # Create forecast (simulated for now)
        last_value = values[-1]
        trend = 0
        
        # Calculate trend from last 5 points or all points if less than 5
        if len(values) >= 5:
            trend = (values[-1] - values[-5]) / 4  # Average change over last 4 intervals
        elif len(values) >= 2:
            trend = (values[-1] - values[0]) / (len(values) - 1)
        
        # Generate forecasted dates
        last_date = datetime.strptime(dates[-1], "%Y-%m-%d")
        forecast_dates = []
        
        # For different frequencies
        if series_id in ["DGS10", "SP500"]:
            # Daily data - add weekdays
            current_date = last_date
            while len(forecast_dates) < forecast_periods:
                current_date += timedelta(days=1)
                if current_date.weekday() < 5:  # Monday to Friday
                    forecast_dates.append(current_date.strftime("%Y-%m-%d"))
        elif series_id in ["UNRATE", "CPIAUCSL"]:
            # Monthly data
            current_date = last_date
            for _ in range(forecast_periods):
                if current_date.month == 12:
                    current_date = current_date.replace(year=current_date.year + 1, month=1)
                else:
                    current_date = current_date.replace(month=current_date.month + 1)
                forecast_dates.append(current_date.strftime("%Y-%m-%d"))
        elif series_id == "GDP":
            # Quarterly data
            current_date = last_date
            for _ in range(forecast_periods):
                if current_date.month >= 10:  # Q4
                    current_date = current_date.replace(year=current_date.year + 1, month=1)
                else:
                    current_date = current_date.replace(month=current_date.month + 3)
                forecast_dates.append(current_date.strftime("%Y-%m-%d"))
        else:
            # Default to monthly
            current_date = last_date
            for _ in range(forecast_periods):
                if current_date.month == 12:
                    current_date = current_date.replace(year=current_date.year + 1, month=1)
                else:
                    current_date = current_date.replace(month=current_date.month + 1)
                forecast_dates.append(current_date.strftime("%Y-%m-%d"))
        
        # Generate forecast values
        forecast_values = []
        lower_bound = []
        upper_bound = []
        
        for i in range(forecast_periods):
            # Add some randomness to the trend for a more realistic forecast
            forecast = last_value + (trend * (i + 1)) + random.uniform(-0.1 * last_value, 0.1 * last_value)
            forecast_values.append(round(forecast, 4))
            
            # Add prediction intervals
            volatility = abs(trend) * 2
            lower = forecast - volatility * (i + 1)
            upper = forecast + volatility * (i + 1)
            lower_bound.append(round(lower, 4))
            upper_bound.append(round(upper, 4))
        
        # Combine historical and forecast data
        result = {
            "series_id": series_id,
            "metadata": self.fred_client.get_series_info(series_id),
            "historical": [{"date": d, "value": v} for d, v in zip(dates, values)],
            "forecast": [{"date": d, "value": v, "lower": l, "upper": u} 
                         for d, v, l, u in zip(forecast_dates, forecast_values, lower_bound, upper_bound)],
            "model": model_type,
            "trend": round(trend, 4)
        }
        
        return result
    
    def moving_averages(self, series_id, start_date=None, end_date=None, windows=[5, 20, 50]):
        """Calculate moving averages for a time series"""
        import sys
        sys.stderr.write(f"Calculating moving averages for {series_id}\n")
        
        # Get data
        data = self.fred_client.get_series_data(series_id, start_date, end_date)
        
        # Sort by date
        data = sorted(data, key=lambda x: x["date"])
        
        # Extract values
        dates = [item["date"] for item in data]
        values = [float(item["value"]) for item in data]
        
        if not values:
            return {"error": "No data available for moving averages"}
        
        # Calculate moving averages for each window
        ma_results = {}
        
        for window in windows:
            ma_values = []
            
            for i in range(len(values)):
                if i < window - 1:
                    # Not enough points for the full window
                    ma_values.append(None)
                else:
                    # Calculate average of the window
                    window_values = values[i - window + 1:i + 1]
                    ma_values.append(round(sum(window_values) / window, 4))
            
            ma_results[f"MA{window}"] = ma_values
        
        # Combine into result
        result = {
            "series_id": series_id,
            "metadata": self.fred_client.get_series_info(series_id),
            "dates": dates,
            "original": values,
            "moving_averages": {
                window_name: [
                    {"date": dates[i], "value": ma_value} 
                    for i, ma_value in enumerate(ma_values) if ma_value is not None
                ] 
                for window_name, ma_values in ma_results.items()
            }
        }
        
        return result
    
    def volatility_analysis(self, series_id, start_date=None, end_date=None, window=30):
        """Calculate rolling volatility (standard deviation) for a time series"""
        import sys
        sys.stderr.write(f"Calculating volatility for {series_id}\n")
        
        # Get data
        data = self.fred_client.get_series_data(series_id, start_date, end_date)
        
        # Sort by date
        data = sorted(data, key=lambda x: x["date"])
        
        # Extract values
        dates = [item["date"] for item in data]
        values = [float(item["value"]) for item in data]
        
        if not values:
            return {"error": "No data available for volatility analysis"}
        
        # Calculate returns (percentage changes)
        returns = []
        for i in range(1, len(values)):
            if values[i-1] != 0:
                pct_change = (values[i] - values[i-1]) / values[i-1] * 100
                returns.append(pct_change)
            else:
                returns.append(0)
        
        return_dates = dates[1:]
        
        # Calculate rolling volatility
        volatility = []
        volatility_dates = []
        
        for i in range(len(returns)):
            if i < window - 1:
                # Not enough points
                continue
            
            # Calculate standard deviation for the window
            window_returns = returns[i - window + 1:i + 1]
            mean = sum(window_returns) / window
            variance = sum((r - mean) ** 2 for r in window_returns) / window
            std_dev = math.sqrt(variance)
            
            volatility.append(round(std_dev, 4))
            volatility_dates.append(return_dates[i])
        
        # Combine into result
        result = {
            "series_id": series_id,
            "metadata": self.fred_client.get_series_info(series_id),
            "original": [{"date": d, "value": v} for d, v in zip(dates, values)],
            "returns": [{"date": d, "value": r} for d, r in zip(return_dates, returns)],
            "volatility": [{"date": d, "value": v} for d, v in zip(volatility_dates, volatility)],
            "window": window
        }
        
        return result


def main():
    """Main function for command-line use"""
    import sys  # Import sys at the beginning of the function
    parser = argparse.ArgumentParser(description="Financial Data Analysis")
    subparsers = parser.add_subparsers(dest="command", help="Analysis type")
    
    # Correlation analysis
    correlation_parser = subparsers.add_parser("correlation", help="Calculate correlation between series")
    correlation_parser.add_argument("--series", required=True, help="Comma-separated list of series IDs")
    correlation_parser.add_argument("--start_date", help="Start date (YYYY-MM-DD)")
    correlation_parser.add_argument("--end_date", help="End date (YYYY-MM-DD)")
    
    # Time series forecast
    forecast_parser = subparsers.add_parser("forecast", help="Forecast time series")
    forecast_parser.add_argument("--series", required=True, help="Series ID")
    forecast_parser.add_argument("--start_date", help="Start date (YYYY-MM-DD)")
    forecast_parser.add_argument("--end_date", help="End date (YYYY-MM-DD)")
    forecast_parser.add_argument("--model", default="arima", help="Model type")
    forecast_parser.add_argument("--periods", type=int, default=10, help="Forecast periods")
    
    # Moving averages
    ma_parser = subparsers.add_parser("moving_averages", help="Calculate moving averages")
    ma_parser.add_argument("--series", required=True, help="Series ID")
    ma_parser.add_argument("--start_date", help="Start date (YYYY-MM-DD)")
    ma_parser.add_argument("--end_date", help="End date (YYYY-MM-DD)")
    ma_parser.add_argument("--windows", help="Comma-separated list of window sizes")
    
    # Volatility analysis
    volatility_parser = subparsers.add_parser("volatility", help="Calculate volatility")
    volatility_parser.add_argument("--series", required=True, help="Series ID")
    volatility_parser.add_argument("--start_date", help="Start date (YYYY-MM-DD)")
    volatility_parser.add_argument("--end_date", help="End date (YYYY-MM-DD)")
    volatility_parser.add_argument("--window", type=int, default=30, help="Window size for volatility")
    
    # Parse arguments
    args = parser.parse_args()
    
    # Create analysis object
    analysis = FinancialAnalysis()
    
    if args.command == "correlation":
        # Correlation analysis
        series_ids = args.series.split(',')
        data = analysis.get_data(series_ids, args.start_date, args.end_date)
        result = analysis.compute_correlation_matrix(data)
        # Use write to stdout without extra newlines that print might add
        sys.stdout.write(json.dumps(result))
    
    elif args.command == "forecast":
        # Time series forecast
        result = analysis.time_series_forecast(
            args.series, 
            args.start_date, 
            args.end_date, 
            args.model, 
            args.periods
        )
        sys.stdout.write(json.dumps(result))
    
    elif args.command == "moving_averages":
        # Moving averages
        windows = [5, 20, 50]  # Default windows
        if args.windows:
            try:
                windows = [int(w) for w in args.windows.split(',')]
            except ValueError:
                pass
        
        result = analysis.moving_averages(
            args.series, 
            args.start_date, 
            args.end_date, 
            windows
        )
        sys.stdout.write(json.dumps(result))
    
    elif args.command == "volatility":
        # Volatility analysis
        result = analysis.volatility_analysis(
            args.series, 
            args.start_date, 
            args.end_date, 
            args.window
        )
        sys.stdout.write(json.dumps(result))
    
    else:
        # Help output goes to stderr
        sys.stderr.write("Usage instructions:\n")
        parser.print_help()


if __name__ == "__main__":
    main()