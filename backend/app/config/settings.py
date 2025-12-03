from pydantic import BaseSettings
from typing import Optional, List, Any
import os

class Settings(BaseSettings):
    # Application settings
    app_name: str = "Tenggeli Desert Monitoring API"
    debug: bool = True
    secret_key: str = "dev-secret-key-change-in-production"
    log_level: str = "INFO"
    
    # Data paths - support environment variable with fallback
    raw_data_path: str = os.getenv("NDVI_RAW_DATA_PATH", "/mnt/g/我的云端硬盘/tenggeli_data")
    data_path: str = os.getenv("NDVI_DATA_PATH", "../data")
    processed_data_path: str = os.getenv("NDVI_PROCESSED_DATA_PATH", "../data/processed")
    cache_path: str = os.getenv("NDVI_CACHE_PATH", "../data/cache")
    
    # Database settings
    database_url: str = "sqlite:///./tenggeli_monitoring.db"
    redis_url: Optional[str] = None
    
    # CORS settings - parse from environment variable or use defaults
    cors_origins: List[str] = []
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    def __init__(self, **kwargs):
        # Check if CORS_ORIGINS is in env and handle it BEFORE calling super().__init__
        # This bypasses Pydantic's automatic JSON parsing which fails on simple strings like "*"
        env_cors = os.getenv("CORS_ORIGINS")
        if env_cors:
            if env_cors.strip() == "*":
                kwargs["cors_origins"] = ["*"]
            elif "," in env_cors:
                kwargs["cors_origins"] = [origin.strip() for origin in env_cors.split(",")]
            else:
                kwargs["cors_origins"] = [env_cors.strip()]
        
        super().__init__(**kwargs)
        
        # Fallback if empty
        if not self.cors_origins:
             self.cors_origins = ["http://localhost:3000", "http://localhost:5173"]

        # Convert relative paths to absolute paths
        if not os.path.isabs(self.data_path):
            self.data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", self.data_path))
        if not os.path.isabs(self.processed_data_path):
            self.processed_data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", self.processed_data_path))
        if not os.path.isabs(self.cache_path):
            self.cache_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", self.cache_path))

settings = Settings()