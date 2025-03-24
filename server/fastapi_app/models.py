from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Union
from datetime import datetime


class User(BaseModel):
    id: int
    username: str
    password: str


class InsertUser(BaseModel):
    username: str
    password: str


class Indicator(BaseModel):
    id: int
    symbol: str
    name: str
    description: Optional[str] = None
    frequency: str
    units: Optional[str] = None
    source: str
    lastUpdated: datetime


class InsertIndicator(BaseModel):
    symbol: str
    name: str
    description: Optional[str] = None
    frequency: str
    units: Optional[str] = None
    source: str
    lastUpdated: datetime


class Value(BaseModel):
    id: int
    indicatorId: int
    date: datetime
    value: str


class InsertValue(BaseModel):
    indicatorId: int
    date: datetime
    value: str


class EtlJob(BaseModel):
    id: int
    task: str
    status: str  # 'completed', 'failed', 'in_progress', 'scheduled'
    startTime: Optional[datetime] = None
    endTime: Optional[datetime] = None
    recordsProcessed: Optional[int] = None
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class InsertEtlJob(BaseModel):
    task: str
    status: str
    startTime: Optional[datetime] = None
    endTime: Optional[datetime] = None
    recordsProcessed: Optional[int] = None
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class AnalysisResult(BaseModel):
    id: int
    type: str  # 'correlation', 'forecast', etc.
    indicators: List[str]
    parameters: Dict[str, Any]
    results: Dict[str, Any]
    createdAt: datetime


class InsertAnalysisResult(BaseModel):
    type: str
    indicators: List[str]
    parameters: Dict[str, Any]
    results: Dict[str, Any]
    createdAt: datetime


class ApiResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None