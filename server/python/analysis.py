#!/usr/bin/env python3
"""
Financial Data Analysis Module

This script provides time series analysis and statistical computations for financial data.
"""

import os
import sys
import json
from datetime import datetime
import pandas as pd
import numpy as np
from scipy import stats
import statsmodels.api as sm
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from fred_api import FredApiClient

class FinancialAnalysis:
    """Class for analyzing financial market data"""
    
    def __init__(self):
        """Initialize the analysis module"""
        self.fred_client = FredApiClient()
    
    def get_data(self, series_ids, start_date=None, end_date=None):
        """Fetch data for multiple series and align them by date"""
        data_frames = {}
        
        for series_id in series_ids:
            observations = self.fred_client.get_series_data(
                series_id, 
                start_date, 
                end_date
            )
            
            if observations:
                df = pd.DataFrame(observations)
                df['date'] = pd.to_datetime(df['date'])
                df['value'] = pd.to_numeric(df['value'], errors='coerce')
                df = df.rename(columns={'value': series_id})
                df = df.set_index('date')
                data_frames[series_id] = df[[series_id]]
        
        # Merge all data frames on date index
        if data_frames:
            combined_df = pd.concat(data_frames.values(), axis=1)
            return combined_df
        
        return pd.DataFrame()
    
    def compute_descriptive_statistics(self, data):
        """Compute basic descriptive statistics for each series"""
        if data.empty:
            return {}
        
        stats = {}
        for column in data.columns:
            series_stats = {
                'mean': float(data[column].mean()),
                'median': float(data[column].median()),
                'std': float(data[column].std()),
                'min': float(data[column].min()),
                'max': float(data[column].max()),
                'count': int(data[column].count())
            }
            stats[column] = series_stats
        
        return stats
    
    def compute_correlation_matrix(self, data):
        """Compute correlation matrix between different financial indicators"""
        if data.empty:
            return {}
        
        # Drop rows with any missing values
        clean_data = data.dropna()
        
        if clean_data.shape[1] < 2:
            return {"error": "Need at least two series for correlation analysis"}
        
        # Compute correlation matrix
        corr_matrix = clean_data.corr().round(2)
        
        # Convert to nested dict for JSON serialization
        result = {}
        for idx, row in corr_matrix.iterrows():
            result[idx] = row.to_dict()
        
        return result
    
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
        # Get historical data
        observations = self.fred_client.get_series_data(
            series_id, 
            start_date, 
            end_date
        )
        
        if not observations:
            return {"error": f"No data found for series {series_id}"}
        
        # Convert to dataframe and prepare for forecasting
        df = pd.DataFrame(observations)
        df['date'] = pd.to_datetime(df['date'])
        df['value'] = pd.to_numeric(df['value'], errors='coerce')
        
        # Handle missing values
        df['value'] = df['value'].fillna(method='ffill')
        
        # Set date as index
        df = df.set_index('date')
        
        # Extract the time series
        ts = df['value']
        
        # Perform forecasting based on selected model
        forecast_results = {}
        
        try:
            if model_type == 'arima':
                # Fit ARIMA model (p,d,q)=(1,1,1) as a default
                model = ARIMA(ts, order=(1,1,1))
                fitted_model = model.fit()
                
                # Generate forecast
                forecast = fitted_model.forecast(steps=forecast_periods)
                forecast_idx = pd.date_range(
                    start=ts.index[-1] + pd.Timedelta(days=1),
                    periods=forecast_periods,
                    freq=pd.infer_freq(ts.index)
                )
                
                # Prepare results
                forecast_results = {
                    'model': 'ARIMA(1,1,1)',
                    'historical_data': df.reset_index().to_dict(orient='records'),
                    'forecast_data': pd.DataFrame({
                        'date': forecast_idx,
                        'value': forecast.values
                    }).to_dict(orient='records'),
                    'model_metrics': {
                        'aic': fitted_model.aic,
                        'bic': fitted_model.bic
                    }
                }
                
            elif model_type == 'sarima':
                # Fit SARIMA model with seasonal component
                model = SARIMAX(ts, order=(1,1,1), seasonal_order=(1,1,1,12))
                fitted_model = model.fit(disp=False)
                
                # Generate forecast
                forecast = fitted_model.forecast(steps=forecast_periods)
                forecast_idx = pd.date_range(
                    start=ts.index[-1] + pd.Timedelta(days=1),
                    periods=forecast_periods,
                    freq=pd.infer_freq(ts.index)
                )
                
                # Prepare results
                forecast_results = {
                    'model': 'SARIMA(1,1,1)(1,1,1,12)',
                    'historical_data': df.reset_index().to_dict(orient='records'),
                    'forecast_data': pd.DataFrame({
                        'date': forecast_idx,
                        'value': forecast.values
                    }).to_dict(orient='records'),
                    'model_metrics': {
                        'aic': fitted_model.aic,
                        'bic': fitted_model.bic
                    }
                }
                
            elif model_type == 'exponential_smoothing':
                # Fit Exponential Smoothing model
                model = ExponentialSmoothing(
                    ts,
                    trend='add',
                    seasonal='add',
                    seasonal_periods=12
                )
                fitted_model = model.fit()
                
                # Generate forecast
                forecast = fitted_model.forecast(forecast_periods)
                forecast_idx = pd.date_range(
                    start=ts.index[-1] + pd.Timedelta(days=1),
                    periods=forecast_periods,
                    freq=pd.infer_freq(ts.index)
                )
                
                # Prepare results
                forecast_results = {
                    'model': 'Exponential Smoothing',
                    'historical_data': df.reset_index().to_dict(orient='records'),
                    'forecast_data': pd.DataFrame({
                        'date': forecast_idx,
                        'value': forecast.values
                    }).to_dict(orient='records'),
                    'model_metrics': {
                        'sse': fitted_model.sse
                    }
                }
                
            else:
                return {"error": f"Unsupported model type: {model_type}"}
                
        except Exception as e:
            return {"error": f"Forecasting failed: {str(e)}"}
        
        return forecast_results
    
    def moving_averages(self, series_id, start_date=None, end_date=None, windows=[5, 20, 50]):
        """Calculate moving averages for a time series"""
        observations = self.fred_client.get_series_data(
            series_id, 
            start_date, 
            end_date
        )
        
        if not observations:
            return {"error": f"No data found for series {series_id}"}
        
        # Convert to dataframe
        df = pd.DataFrame(observations)
        df['date'] = pd.to_datetime(df['date'])
        df['value'] = pd.to_numeric(df['value'], errors='coerce')
        
        # Calculate moving averages
        for window in windows:
            df[f'ma_{window}'] = df['value'].rolling(window=window).mean()
        
        return df.to_dict(orient='records')
    
    def volatility_analysis(self, series_id, start_date=None, end_date=None, window=30):
        """Calculate rolling volatility (standard deviation) for a time series"""
        observations = self.fred_client.get_series_data(
            series_id, 
            start_date, 
            end_date
        )
        
        if not observations:
            return {"error": f"No data found for series {series_id}"}
        
        # Convert to dataframe
        df = pd.DataFrame(observations)
        df['date'] = pd.to_datetime(df['date'])
        df['value'] = pd.to_numeric(df['value'], errors='coerce')
        
        # Calculate daily returns
        df['returns'] = df['value'].pct_change() * 100
        
        # Calculate rolling volatility (std dev of returns)
        df['volatility'] = df['returns'].rolling(window=window).std()
        
        return df.to_dict(orient='records')

# Command line interface
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Financial data analysis')
    parser.add_argument('action', choices=[
        'correlation', 'forecast', 'moving_averages', 'volatility'
    ], help='Analysis to perform')
    parser.add_argument('--series', help='Comma-separated list of FRED series IDs')
    parser.add_argument('--start_date', help='Start date (YYYY-MM-DD)')
    parser.add_argument('--end_date', help='End date (YYYY-MM-DD)')
    parser.add_argument('--model', default='arima', help='Forecasting model type')
    parser.add_argument('--periods', type=int, default=10, help='Forecast periods')
    parser.add_argument('--window', type=int, default=30, help='Window size for rolling calculations')
    parser.add_argument('--output', help='Output file path (default: stdout)')
    
    args = parser.parse_args()
    analysis = FinancialAnalysis()
    
    result = {}
    
    if args.action == 'correlation' and args.series:
        series_ids = args.series.split(',')
        data = analysis.get_data(series_ids, args.start_date, args.end_date)
        result = analysis.compute_correlation_matrix(data)
        
    elif args.action == 'forecast' and args.series:
        series_id = args.series.split(',')[0]  # Use first series for forecasting
        result = analysis.time_series_forecast(
            series_id, 
            args.start_date, 
            args.end_date,
            args.model,
            args.periods
        )
        
    elif args.action == 'moving_averages' and args.series:
        series_id = args.series.split(',')[0]
        result = analysis.moving_averages(
            series_id,
            args.start_date,
            args.end_date
        )
        
    elif args.action == 'volatility' and args.series:
        series_id = args.series.split(',')[0]
        result = analysis.volatility_analysis(
            series_id,
            args.start_date,
            args.end_date,
            args.window
        )
        
    else:
        parser.print_help()
        sys.exit(1)
    
    # Output results
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(result, f, indent=2)
    else:
        print(json.dumps(result, indent=2))
