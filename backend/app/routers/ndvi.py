from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.models.ndvi import NDVITimeSeriesResponse, NDVIMapResponse, NDVIValueResponse
from app.services.ndvi_service import NDVIService

router = APIRouter()
ndvi_service = NDVIService()

@router.get("/ndvi/timeseries", response_model=NDVITimeSeriesResponse)
async def get_ndvi_timeseries(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"), 
    start_year: int = Query(2020, description="Start year"),
    end_year: int = Query(2023, description="End year")
):
    """Get NDVI time series for a specific location"""
    if not (-90 <= lat <= 90):
        raise HTTPException(status_code=400, detail="Latitude must be between -90 and 90")
    if not (-180 <= lon <= 180):
        raise HTTPException(status_code=400, detail="Longitude must be between -180 and 180")
    if start_year > end_year:
        raise HTTPException(status_code=400, detail="Start year must be <= end year")
    
    try:
        result = ndvi_service.get_time_series(lat, lon, start_year, end_year)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@router.get("/ndvi/files")
async def get_available_files():
    """Get list of available NDVI data files"""
    try:
        files = ndvi_service.get_available_files()
        return {
            "files": [{"year": year, "month": month} for year, month, _ in files],
            "count": len(files)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving files: {str(e)}")

@router.get("/ndvi/statistics")
async def get_ndvi_statistics(
    year: int = Query(..., description="Year"),
    month: int = Query(..., description="Month (1-12)")
):
    """Get statistics for NDVI data for a specific month"""
    if not (1 <= month <= 12):
        raise HTTPException(status_code=400, detail="Month must be between 1 and 12")
    
    try:
        stats = ndvi_service.get_map_statistics(year, month)
        if not stats:
            raise HTTPException(status_code=404, detail=f"No data found for {year}-{month:02d}")
        
        return {
            "year": year,
            "month": month,
            "statistics": stats
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating statistics: {str(e)}")

@router.get("/ndvi/value", response_model=NDVIValueResponse)
async def get_ndvi_value(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    year: int = Query(..., description="Year"),
    month: int = Query(..., description="Month (1-12)")
):
    """Return NDVI value at a point for a specific month."""
    if not (1 <= month <= 12):
        raise HTTPException(status_code=400, detail="Month must be between 1 and 12")
    if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
        raise HTTPException(status_code=400, detail="Invalid coordinates")
    try:
        value = ndvi_service.get_value(year, month, lat, lon)
        return NDVIValueResponse(year=year, month=month, latitude=lat, longitude=lon, ndvi_value=value)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting value: {str(e)}")

@router.get("/test")
async def test_extraction():
    """Test single point extraction"""
    try:
        files = ndvi_service.get_available_files()
        if files:
            year, month, file_path = files[0]
            value = ndvi_service.extract_point_value(file_path, 38.2, 104.0)
            return {
                "test_file": f"{year}-{month:02d}",
                "test_location": {"lat": 38.2, "lon": 104.0},
                "ndvi_value": value,
                "status": "success",
                "total_files": len(files)
            }
        return {"status": "no_files", "files_found": 0}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ndvi"}