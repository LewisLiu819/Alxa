import rasterio
from rasterio.windows import Window
from rasterio.crs import CRS
from rasterio.warp import transform as rio_transform
import numpy as np
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple
from app.config.settings import settings
from app.models.ndvi import NDVIDataPoint, NDVITimeSeriesResponse
import os

class NDVIService:
    def __init__(self):
        self.data_path = Path(settings.data_path)
        self.processed_data_path = Path(settings.processed_data_path)
        self._file_cache = None
    
    def _to_dataset_crs(self, dataset: rasterio.io.DatasetReader, lon: float, lat: float) -> Tuple[float, float]:
        """Transform WGS84 lon/lat to dataset CRS coordinates when needed."""
        try:
            if dataset.crs is None:
                return lon, lat
            # If dataset is already geographic (WGS84-like), pass through
            try:
                if getattr(dataset.crs, "is_geographic", False) or dataset.crs.to_epsg() == 4326:
                    return lon, lat
            except Exception:
                pass
            xs, ys = rio_transform(CRS.from_epsg(4326), dataset.crs, [lon], [lat])
            return xs[0], ys[0]
        except Exception:
            # Fail safe: return original
            return lon, lat
        
    def get_available_files(self) -> List[Tuple[int, int, str]]:
        """Get list of available NDVI files with year, month, and filepath.

        Accept a directory as available if either a processed GeoTIFF exists
        or a metadata.json exists. Prefer returning the path to processed.tif
        when present. This enables frontend timeline even if raster is missing.
        """
        if self._file_cache is not None:
            return self._file_cache
            
        files = []
        if not self.processed_data_path.exists():
            print(f"Processed data path does not exist: {self.processed_data_path}")
            return files
            
        # Look for processed directories like 2020_01, 2020_02, etc.
        for dir_path in self.processed_data_path.iterdir():
            if dir_path.is_dir():
                dir_name = dir_path.name
                if '_' in dir_name:
                    try:
                        year_str, month_str = dir_name.split('_')
                        year = int(year_str)
                        month = int(month_str)
                        
                        # Check resources within this directory
                        tif_path = dir_path / "processed.tif"
                        metadata_path = dir_path / "metadata.json"
                        if tif_path.exists():
                            files.append((year, month, str(tif_path)))
                        elif metadata_path.exists():
                            # No TIFF but metadata exists; include entry with empty path
                            files.append((year, month, ""))
                    except ValueError:
                        continue
        
        self._file_cache = sorted(files)
        print(f"Found {len(self._file_cache)} processed NDVI files")
        return self._file_cache
    
    def extract_point_value(self, file_path: str, lat: float, lon: float) -> Optional[float]:
        """Extract NDVI value at specific coordinates.

        Supports both float NDVI in [-1, 1] and uint8 normalized (0..255) rasters.
        For uint8 rasters, treat 0 as nodata (from our processing pipeline) and
        map value back to NDVI with: ndvi = value / 255 * 2 - 1.
        """
        try:
            if not file_path or not os.path.exists(file_path):
                return None
            with rasterio.open(file_path) as dataset:
                # Ensure input lon/lat are converted to dataset CRS before indexing
                x, y = self._to_dataset_crs(dataset, lon, lat)
                row, col = dataset.index(x, y)
                
                if 0 <= row < dataset.height and 0 <= col < dataset.width:
                    # Read only a small window around the point instead of entire file
                    window = Window(col, row, 1, 1)
                    data = dataset.read(1, window=window, masked=True)
                    dtype = dataset.dtypes[0].lower() if dataset.dtypes else ""
                    
                    if data.size > 0:
                        # Handle nodata/masked values
                        if hasattr(data, "mask") and data.mask.size > 0:
                            # Handle scalar mask (single pixel) vs array mask
                            mask_val = data.mask if np.isscalar(data.mask) else data.mask[0, 0] if data.mask.ndim > 0 else False
                            if bool(mask_val):
                                return None
                        nodata = dataset.nodata
                        raw_value = float(data[0, 0])
                        if nodata is not None and not np.isnan(nodata) and raw_value == float(nodata):
                            return None
                        
                        # Normalize depending on dtype
                        if dtype in ("uint8", "uint16", "int16") or np.issubdtype(np.dtype(dataset.dtypes[0]), np.integer):
                            # Our pipeline writes uint8 [0,255]; treat 0 as nodata unless explicitly defined otherwise
                            if (nodata is None and raw_value == 0.0) or (nodata is not None and raw_value == float(nodata)):
                                return None
                            ndvi_value = raw_value / 255.0 * 2.0 - 1.0
                        else:
                            ndvi_value = float(raw_value)
                        
                        if np.isnan(ndvi_value) or ndvi_value < -1.0 or ndvi_value > 1.0:
                            return None
                        return ndvi_value
                return None
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
            return None

    def get_value(self, year: int, month: int, lat: float, lon: float) -> Optional[float]:
        """Get NDVI value for a specific year-month at a given coordinate."""
        file_path = self.processed_data_path / f"{year}_{month:02d}" / "processed.tif"
        if not file_path.exists():
            return None
        return self.extract_point_value(str(file_path), lat, lon)
    
    def get_time_series(self, lat: float, lon: float, start_year: int = 2020, end_year: int = 2023) -> NDVITimeSeriesResponse:
        """Get NDVI time series for a specific location"""
        data_points = []
        files = self.get_available_files()
        
        # Filter files for the requested time range
        filtered_files = [(year, month, path) for year, month, path in files 
                         if start_year <= year <= end_year]
        
        print(f"Processing {len(filtered_files)} files for time series ({start_year}-{end_year})")
        
        for i, (year, month, file_path) in enumerate(filtered_files):
            if i % 12 == 0:  # Progress logging every 12 files (1 year)
                print(f"Processing year {year}...")
                
            ndvi_value = self.extract_point_value(file_path, lat, lon)
            if ndvi_value is not None:
                data_points.append(NDVIDataPoint(
                    year=year,
                    month=month,
                    date=f"{year}-{month:02d}-01",
                    ndvi_value=ndvi_value,
                    latitude=lat,
                    longitude=lon
                ))
        
        print(f"Successfully extracted {len(data_points)} data points")
        statistics = self._calculate_statistics(data_points)
        
        return NDVITimeSeriesResponse(
            latitude=lat,
            longitude=lon,
            data=data_points,
            statistics=statistics
        )
    
    def get_map_statistics(self, year: int, month: int) -> Dict[str, Any]:
        """Get statistics for a specific month's NDVI data using sampling for performance.

        Supports both float NDVI [-1,1] rasters and uint8 normalized rasters.
        """
        file_path = self.processed_data_path / f"{year}_{month:02d}" / "processed.tif"
        
        if not file_path.exists():
            return {}
        
        try:
            with rasterio.open(file_path) as dataset:
                # Sample the data instead of reading entire file for performance
                height, width = dataset.height, dataset.width
                step = max(1, min(height, width) // 1000)  # Sample every nth pixel
                
                sample_data = dataset.read(1, masked=True)[::step, ::step]
                dtype = dataset.dtypes[0].lower() if dataset.dtypes else ""
                
                # Map to NDVI depending on dtype
                if dtype in ("uint8", "uint16", "int16") or np.issubdtype(np.dtype(dataset.dtypes[0]), np.integer):
                    # Treat zeros (or masked) as nodata
                    if hasattr(sample_data, "mask"):
                        mask_valid = ~sample_data.mask
                        mapped = sample_data.filled(0).astype(np.float32)
                    else:
                        mask_valid = (sample_data != 0)
                        mapped = sample_data.astype(np.float32)
                    mapped = mapped / 255.0 * 2.0 - 1.0
                    valid_data = mapped[mask_valid]
                else:
                    arr = sample_data.filled(np.nan) if hasattr(sample_data, "filled") else sample_data
                    valid_data = arr[(arr >= -1) & (arr <= 1) & (~np.isnan(arr))]
                
                if len(valid_data) == 0:
                    return {}
                
                return {
                    "min": float(np.min(valid_data)),
                    "max": float(np.max(valid_data)),
                    "mean": float(np.mean(valid_data)),
                    "std": float(np.std(valid_data)),
                    "count": int(len(valid_data)),
                    "sampled": True,
                    "sample_step": step
                }
        except Exception as e:
            print(f"Error calculating statistics for {file_path}: {e}")
            return {}
    
    def _calculate_statistics(self, data_points: List[NDVIDataPoint]) -> Dict[str, float]:
        """Calculate statistics from NDVI data points"""
        if not data_points:
            return {}
        
        values = [dp.ndvi_value for dp in data_points]
        
        return {
            "min": min(values),
            "max": max(values),
            "mean": sum(values) / len(values),
            "count": len(values)
        }