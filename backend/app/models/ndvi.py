from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class NDVIDataPoint(BaseModel):
    year: int
    month: int
    date: str
    ndvi_value: float
    latitude: float
    longitude: float

class NDVITimeSeriesRequest(BaseModel):
    latitude: float
    longitude: float
    start_year: int = 2015
    end_year: int = 2023

class NDVITimeSeriesResponse(BaseModel):
    latitude: float
    longitude: float
    data: List[NDVIDataPoint]
    statistics: Dict[str, float]

class NDVIMapRequest(BaseModel):
    year: int
    month: int
    bbox: Optional[List[float]] = None

class NDVIMapResponse(BaseModel):
    year: int
    month: int
    data_url: str
    statistics: Dict[str, Any]

class NDVIValueResponse(BaseModel):
    year: int
    month: int
    latitude: float
    longitude: float
    ndvi_value: Optional[float]