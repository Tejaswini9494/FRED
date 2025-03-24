"""
In-memory storage implementation for FastAPI.

This module provides a simplified storage interface for the FastAPI application.
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
from .models import (
    User, InsertUser, 
    Indicator, InsertIndicator,
    Value, InsertValue,
    EtlJob, InsertEtlJob,
    AnalysisResult, InsertAnalysisResult
)

class MemStorage:
    """In-memory storage implementation for FastAPI"""
    
    def __init__(self):
        """Initialize in-memory storage"""
        self.users: Dict[int, User] = {}
        self.indicators: Dict[int, Indicator] = {}
        self.values: Dict[int, Value] = {}
        self.etl_jobs: Dict[int, EtlJob] = {}
        self.analysis_results: Dict[int, AnalysisResult] = {}
        
        # Counters for auto-increment IDs
        self.user_id_counter = 1
        self.indicator_id_counter = 1
        self.value_id_counter = 1
        self.etl_job_id_counter = 1
        self.analysis_result_id_counter = 1
        
        # Add some initial sample data
        self._add_sample_data()
    
    def _add_sample_data(self):
        """Add sample data for testing"""
        # Add a sample user
        self.create_user(InsertUser(
            username="admin",
            password="password"  # In production, this would be hashed
        ))
        
        # Add sample indicators
        sample_indicators = [
            {
                "symbol": "GDP",
                "name": "Gross Domestic Product",
                "description": "Real Gross Domestic Product",
                "frequency": "quarterly",
                "units": "Billions of Dollars",
                "source": "FRED",
                "lastUpdated": datetime.now()
            },
            {
                "symbol": "UNRATE",
                "name": "Unemployment Rate",
                "description": "Civilian Unemployment Rate",
                "frequency": "monthly",
                "units": "Percent",
                "source": "FRED",
                "lastUpdated": datetime.now()
            },
            {
                "symbol": "CPIAUCSL",
                "name": "Consumer Price Index",
                "description": "Consumer Price Index for All Urban Consumers: All Items",
                "frequency": "monthly",
                "units": "Index 1982-1984=100",
                "source": "FRED",
                "lastUpdated": datetime.now()
            },
            {
                "symbol": "DGS10",
                "name": "10-Year Treasury Rate",
                "description": "10-Year Treasury Constant Maturity Rate",
                "frequency": "daily",
                "units": "Percent",
                "source": "FRED",
                "lastUpdated": datetime.now()
            },
            {
                "symbol": "SP500",
                "name": "S&P 500",
                "description": "S&P 500 Stock Market Index",
                "frequency": "daily",
                "units": "Index",
                "source": "FRED",
                "lastUpdated": datetime.now()
            }
        ]
        
        for indicator_data in sample_indicators:
            self.create_indicator(InsertIndicator(**indicator_data))
        
        # Add sample ETL jobs
        sample_jobs = [
            {
                "task": "GDP Data Update",
                "status": "completed",
                "startTime": datetime(2024, 3, 1, 10, 0, 0),
                "endTime": datetime(2024, 3, 1, 10, 2, 30),
                "recordsProcessed": 80,
                "error": None,
                "metadata": {"series_id": "GDP"}
            },
            {
                "task": "Unemployment Rate Update",
                "status": "completed",
                "startTime": datetime(2024, 3, 2, 9, 0, 0),
                "endTime": datetime(2024, 3, 2, 9, 1, 45),
                "recordsProcessed": 120,
                "error": None,
                "metadata": {"series_id": "UNRATE"}
            },
            {
                "task": "CPI Update",
                "status": "failed",
                "startTime": datetime(2024, 3, 3, 11, 0, 0),
                "endTime": datetime(2024, 3, 3, 11, 0, 30),
                "recordsProcessed": 0,
                "error": "API rate limit exceeded",
                "metadata": {"series_id": "CPIAUCSL"}
            },
            {
                "task": "Treasury Yield Update",
                "status": "in_progress",
                "startTime": datetime(2024, 3, 4, 14, 0, 0),
                "endTime": None,
                "recordsProcessed": None,
                "error": None,
                "metadata": {"series_id": "DGS10"}
            },
            {
                "task": "S&P 500 Update",
                "status": "scheduled",
                "startTime": datetime(2024, 3, 5, 16, 0, 0),
                "endTime": None,
                "recordsProcessed": None,
                "error": None,
                "metadata": {"series_id": "SP500"}
            }
        ]
        
        for job_data in sample_jobs:
            self.create_etl_job(InsertEtlJob(**job_data))
        
        # Add sample analysis results
        sample_results = [
            {
                "type": "correlation",
                "indicators": ["GDP", "UNRATE"],
                "parameters": {"start_date": "2010-01-01", "end_date": "2023-12-31"},
                "results": {
                    "correlation": -0.75,
                    "p_value": 0.001
                },
                "createdAt": datetime(2024, 3, 1, 15, 0, 0)
            },
            {
                "type": "forecast",
                "indicators": ["CPIAUCSL"],
                "parameters": {
                    "start_date": "2015-01-01", 
                    "end_date": "2023-12-31",
                    "model": "arima",
                    "periods": 12
                },
                "results": {
                    "forecast": [300.1, 301.2, 302.3, 303.1, 304.0, 305.2, 306.1, 307.2, 308.3, 309.1, 310.0, 311.2],
                    "lower_bound": [298.1, 299.0, 300.0, 300.7, 301.5, 302.5, 303.3, 304.2, 305.1, 305.8, 306.5, 307.5],
                    "upper_bound": [302.1, 303.4, 304.6, 305.5, 306.5, 307.9, 308.9, 310.2, 311.5, 312.4, 313.5, 314.9]
                },
                "createdAt": datetime(2024, 3, 2, 11, 30, 0)
            }
        ]
        
        for result_data in sample_results:
            self.create_analysis_result(InsertAnalysisResult(**result_data))
    
    # User Methods
    def get_user(self, id: int) -> Optional[User]:
        """Get user by ID"""
        return self.users.get(id)
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username"""
        for user in self.users.values():
            if user.username == username:
                return user
        return None
    
    def create_user(self, user: InsertUser) -> User:
        """Create a new user"""
        user_id = self.user_id_counter
        self.user_id_counter += 1
        
        new_user = User(
            id=user_id,
            username=user.username,
            password=user.password
        )
        
        self.users[user_id] = new_user
        return new_user
    
    # Indicator Methods
    def get_indicators(self) -> List[Indicator]:
        """Get all indicators"""
        return list(self.indicators.values())
    
    def get_indicator(self, id: int) -> Optional[Indicator]:
        """Get indicator by ID"""
        return self.indicators.get(id)
    
    def get_indicator_by_symbol(self, symbol: str) -> Optional[Indicator]:
        """Get indicator by symbol"""
        for indicator in self.indicators.values():
            if indicator.symbol == symbol:
                return indicator
        return None
    
    def create_indicator(self, indicator: InsertIndicator) -> Indicator:
        """Create a new indicator"""
        indicator_id = self.indicator_id_counter
        self.indicator_id_counter += 1
        
        new_indicator = Indicator(
            id=indicator_id,
            symbol=indicator.symbol,
            name=indicator.name,
            description=indicator.description,
            frequency=indicator.frequency,
            units=indicator.units,
            source=indicator.source,
            lastUpdated=indicator.lastUpdated
        )
        
        self.indicators[indicator_id] = new_indicator
        return new_indicator
    
    def update_indicator(self, id: int, indicator_update: dict) -> Optional[Indicator]:
        """Update an existing indicator"""
        indicator = self.get_indicator(id)
        if not indicator:
            return None
        
        for key, value in indicator_update.items():
            if hasattr(indicator, key):
                setattr(indicator, key, value)
        
        self.indicators[id] = indicator
        return indicator
    
    # Value Methods
    def get_values(self, indicator_id: int, start_date: Optional[datetime] = None, 
                  end_date: Optional[datetime] = None) -> List[Value]:
        """Get values for an indicator"""
        values = [v for v in self.values.values() if v.indicatorId == indicator_id]
        
        if start_date:
            values = [v for v in values if v.date >= start_date]
        
        if end_date:
            values = [v for v in values if v.date <= end_date]
        
        return sorted(values, key=lambda v: v.date)
    
    def create_value(self, value: InsertValue) -> Value:
        """Create a new value"""
        value_id = self.value_id_counter
        self.value_id_counter += 1
        
        new_value = Value(
            id=value_id,
            indicatorId=value.indicatorId,
            date=value.date,
            value=value.value
        )
        
        self.values[value_id] = new_value
        return new_value
    
    def bulk_create_values(self, values: List[InsertValue]) -> List[Value]:
        """Create multiple values at once"""
        created_values = []
        
        for value in values:
            created_values.append(self.create_value(value))
        
        return created_values
    
    # ETL Job Methods
    def get_etl_jobs(self, limit: Optional[int] = None) -> List[EtlJob]:
        """Get ETL jobs with optional limit"""
        jobs = list(self.etl_jobs.values())
        jobs.sort(key=lambda j: j.startTime if j.startTime else datetime.max, reverse=True)
        
        if limit:
            return jobs[:limit]
        
        return jobs
    
    def get_etl_job(self, id: int) -> Optional[EtlJob]:
        """Get ETL job by ID"""
        return self.etl_jobs.get(id)
    
    def create_etl_job(self, job: InsertEtlJob) -> EtlJob:
        """Create a new ETL job"""
        job_id = self.etl_job_id_counter
        self.etl_job_id_counter += 1
        
        new_job = EtlJob(
            id=job_id,
            task=job.task,
            status=job.status,
            startTime=job.startTime,
            endTime=job.endTime,
            recordsProcessed=job.recordsProcessed,
            error=job.error,
            metadata=job.metadata
        )
        
        self.etl_jobs[job_id] = new_job
        return new_job
    
    def update_etl_job(self, id: int, job_update: dict) -> Optional[EtlJob]:
        """Update an existing ETL job"""
        job = self.get_etl_job(id)
        if not job:
            return None
        
        for key, value in job_update.items():
            if hasattr(job, key):
                setattr(job, key, value)
        
        self.etl_jobs[id] = job
        return job
    
    # Analysis Result Methods
    def get_analysis_results(self, type: Optional[str] = None) -> List[AnalysisResult]:
        """Get analysis results with optional type filter"""
        results = list(self.analysis_results.values())
        
        if type:
            results = [r for r in results if r.type == type]
        
        results.sort(key=lambda r: r.createdAt, reverse=True)
        return results
    
    def get_analysis_result(self, id: int) -> Optional[AnalysisResult]:
        """Get analysis result by ID"""
        return self.analysis_results.get(id)
    
    def create_analysis_result(self, result: InsertAnalysisResult) -> AnalysisResult:
        """Create a new analysis result"""
        result_id = self.analysis_result_id_counter
        self.analysis_result_id_counter += 1
        
        new_result = AnalysisResult(
            id=result_id,
            type=result.type,
            indicators=result.indicators,
            parameters=result.parameters,
            results=result.results,
            createdAt=result.createdAt
        )
        
        self.analysis_results[result_id] = new_result
        return new_result


# Create a singleton instance of the storage
storage = MemStorage()