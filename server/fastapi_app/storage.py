from typing import Dict, List, Optional, Any, Type, TypeVar, Generic
from datetime import datetime
import json
from .models import (
    User, InsertUser,
    Indicator, InsertIndicator,
    Value, InsertValue,
    EtlJob, InsertEtlJob,
    AnalysisResult, InsertAnalysisResult
)

# Define a generic type for the models
T = TypeVar('T')
InsertT = TypeVar('InsertT')

class MemStorage:
    """In-memory storage implementation for FastAPI"""
    
    def __init__(self):
        self.users: Dict[int, User] = {}
        self.indicators: Dict[int, Indicator] = {}
        self.values: Dict[int, Value] = {}
        self.etl_jobs: Dict[int, EtlJob] = {}
        self.analysis_results: Dict[int, AnalysisResult] = {}
        
        self.user_current_id = 1
        self.indicator_current_id = 1
        self.value_current_id = 1
        self.etl_job_current_id = 1
        self.analysis_result_current_id = 1
        
        # Initialize with some sample indicators
        self.create_indicator(InsertIndicator(
            symbol="GDP",
            name="Gross Domestic Product",
            description="Quarterly measure of US economic output",
            frequency="quarterly",
            units="billions_usd",
            source="FRED",
            lastUpdated=datetime.now()
        ))
        
        self.create_indicator(InsertIndicator(
            symbol="UNRATE",
            name="Unemployment Rate",
            description="Monthly unemployment rate in the US",
            frequency="monthly",
            units="percent",
            source="FRED",
            lastUpdated=datetime.now()
        ))
        
        self.create_indicator(InsertIndicator(
            symbol="CPIAUCSL",
            name="Consumer Price Index",
            description="Monthly consumer price index for all urban consumers",
            frequency="monthly",
            units="index",
            source="FRED",
            lastUpdated=datetime.now()
        ))
        
        # Add sample ETL jobs
        current_time = datetime.now()
        
        self.create_etl_job(InsertEtlJob(
            task="GDP Dataset Update",
            status="completed",
            startTime=datetime.fromtimestamp(current_time.timestamp() - 35),  # 35 seconds ago
            endTime=current_time,
            recordsProcessed=125,
            error=None,
            metadata=None
        ))
        
        self.create_etl_job(InsertEtlJob(
            task="CPI Dataset Update",
            status="completed",
            startTime=datetime.fromtimestamp(current_time.timestamp() - 28),  # 28 seconds ago
            endTime=current_time,
            recordsProcessed=87,
            error=None,
            metadata=None
        ))
        
        self.create_etl_job(InsertEtlJob(
            task="Unemployment Data",
            status="in_progress",
            startTime=current_time,
            endTime=None,
            recordsProcessed=None,
            error=None,
            metadata=None
        ))
        
        # Schedule for today at 4 PM
        scheduled_time_4pm = datetime.now().replace(hour=16, minute=0, second=0, microsecond=0)
        self.create_etl_job(InsertEtlJob(
            task="S&P 500 Daily Update",
            status="scheduled",
            startTime=scheduled_time_4pm,
            endTime=None,
            recordsProcessed=None,
            error=None,
            metadata=None
        ))
        
        # Schedule for today at 5 PM
        scheduled_time_5pm = datetime.now().replace(hour=17, minute=0, second=0, microsecond=0)
        self.create_etl_job(InsertEtlJob(
            task="Treasury Yield Update",
            status="scheduled",
            startTime=scheduled_time_5pm,
            endTime=None,
            recordsProcessed=None,
            error=None,
            metadata=None
        ))

    # User methods
    def get_user(self, id: int) -> Optional[User]:
        return self.users.get(id)

    def get_user_by_username(self, username: str) -> Optional[User]:
        for user in self.users.values():
            if user.username == username:
                return user
        return None

    def create_user(self, user: InsertUser) -> User:
        id = self.user_current_id
        self.user_current_id += 1
        new_user = User(id=id, **user.dict())
        self.users[id] = new_user
        return new_user
    
    # Indicator methods
    def get_indicators(self) -> List[Indicator]:
        return list(self.indicators.values())
    
    def get_indicator(self, id: int) -> Optional[Indicator]:
        return self.indicators.get(id)
    
    def get_indicator_by_symbol(self, symbol: str) -> Optional[Indicator]:
        for indicator in self.indicators.values():
            if indicator.symbol == symbol:
                return indicator
        return None
    
    def create_indicator(self, indicator: InsertIndicator) -> Indicator:
        id = self.indicator_current_id
        self.indicator_current_id += 1
        new_indicator = Indicator(id=id, **indicator.dict())
        self.indicators[id] = new_indicator
        return new_indicator
    
    def update_indicator(self, id: int, indicator_update: dict) -> Optional[Indicator]:
        current_indicator = self.indicators.get(id)
        if not current_indicator:
            return None
        
        # Update fields
        updated_data = current_indicator.dict()
        updated_data.update(indicator_update)
        
        # Create updated indicator
        updated_indicator = Indicator(**updated_data)
        self.indicators[id] = updated_indicator
        return updated_indicator
    
    # Values methods
    def get_values(self, indicator_id: int, start_date: Optional[datetime] = None, 
                  end_date: Optional[datetime] = None) -> List[Value]:
        filtered_values = [v for v in self.values.values() if v.indicatorId == indicator_id]
        
        if start_date:
            filtered_values = [v for v in filtered_values if v.date >= start_date]
        
        if end_date:
            filtered_values = [v for v in filtered_values if v.date <= end_date]
        
        # Sort by date
        return sorted(filtered_values, key=lambda v: v.date)
    
    def create_value(self, value: InsertValue) -> Value:
        id = self.value_current_id
        self.value_current_id += 1
        new_value = Value(id=id, **value.dict())
        self.values[id] = new_value
        return new_value
    
    def bulk_create_values(self, values: List[InsertValue]) -> List[Value]:
        created_values = []
        
        for value in values:
            id = self.value_current_id
            self.value_current_id += 1
            new_value = Value(id=id, **value.dict())
            self.values[id] = new_value
            created_values.append(new_value)
        
        return created_values
    
    # ETL Job methods
    def get_etl_jobs(self, limit: Optional[int] = None) -> List[EtlJob]:
        # Sort by start_time descending
        sorted_jobs = sorted(
            self.etl_jobs.values(), 
            key=lambda j: j.startTime.timestamp() if j.startTime else 0, 
            reverse=True
        )
        
        if limit:
            return sorted_jobs[:limit]
        return sorted_jobs
    
    def get_etl_job(self, id: int) -> Optional[EtlJob]:
        return self.etl_jobs.get(id)
    
    def create_etl_job(self, job: InsertEtlJob) -> EtlJob:
        id = self.etl_job_current_id
        self.etl_job_current_id += 1
        new_job = EtlJob(id=id, **job.dict())
        self.etl_jobs[id] = new_job
        return new_job
    
    def update_etl_job(self, id: int, job_update: dict) -> Optional[EtlJob]:
        current_job = self.etl_jobs.get(id)
        if not current_job:
            return None
        
        # Update fields
        updated_data = current_job.dict()
        updated_data.update(job_update)
        
        # Create updated job
        updated_job = EtlJob(**updated_data)
        self.etl_jobs[id] = updated_job
        return updated_job
    
    # Analysis Result methods
    def get_analysis_results(self, type: Optional[str] = None) -> List[AnalysisResult]:
        if type:
            filtered_results = [r for r in self.analysis_results.values() if r.type == type]
        else:
            filtered_results = list(self.analysis_results.values())
        
        # Sort by created_at descending
        return sorted(filtered_results, key=lambda r: r.createdAt.timestamp(), reverse=True)
    
    def get_analysis_result(self, id: int) -> Optional[AnalysisResult]:
        return self.analysis_results.get(id)
    
    def create_analysis_result(self, result: InsertAnalysisResult) -> AnalysisResult:
        id = self.analysis_result_current_id
        self.analysis_result_current_id += 1
        new_result = AnalysisResult(id=id, **result.dict())
        self.analysis_results[id] = new_result
        return new_result


# Create a singleton instance
storage = MemStorage()