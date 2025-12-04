from pydantic import BaseSettings, validator
from typing import Optional, List
import os

class Settings(BaseSettings):
    # Application settings
    app_name: str = "Tenggeli Desert Monitoring API"
    debug: bool = True
    secret_key: str = "dev-secret-key-change-in-production"
    log_level: str = "INFO"
    
    # Data paths - support environment variable with fallback
    raw_data_path: str = os.getenv("NDVI_RAW_DATA_PATH", "/mnt/g/tenggeli_data")
    data_path: str = os.getenv("NDVI_DATA_PATH", "../data")
    processed_data_path: str = os.getenv("NDVI_PROCESSED_DATA_PATH", "../data/processed")
    cache_path: str = os.getenv("NDVI_CACHE_PATH", "../data/cache")
    
    # Database settings
    database_url: str = "sqlite:///./tenggeli_monitoring.db"
    redis_url: Optional[str] = None
    
    # Region bounds (Tenggeli Desert area)
    region_west: float = 103.0
    region_east: float = 106.0
    region_south: float = 37.0
    region_north: float = 40.0
    
    # CORS settings - use string to avoid Pydantic JSON parsing issues
    # Will be converted to list in get_cors_origins()
    cors_origins_raw: str = ""
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        # Map the environment variable name
        fields = {
            "cors_origins_raw": {"env": "CORS_ORIGINS"}
        }
    
    @property
    def cors_origins(self) -> List[str]:
        """Parse CORS origins from raw string."""
        raw = self.cors_origins_raw.strip()
        if not raw:
            return ["*"]  # Default to allow all in development
        if raw == "*":
            return ["*"]
        if "," in raw:
            return [origin.strip() for origin in raw.split(",") if origin.strip()]
        return [raw]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        # Convert relative paths to absolute paths
        if not os.path.isabs(self.data_path):
            self.data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", self.data_path))
        if not os.path.isabs(self.processed_data_path):
            self.processed_data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", self.processed_data_path))
        if not os.path.isabs(self.cache_path):
            self.cache_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", self.cache_path))

settings = Settings()