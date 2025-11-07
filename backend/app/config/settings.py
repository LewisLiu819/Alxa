from pydantic import BaseSettings
from typing import Optional, List
import os

class Settings(BaseSettings):
    # Application settings
    app_name: str = "Tenggeli Desert Monitoring API"
    debug: bool = True
    secret_key: str = "dev-secret-key-change-in-production"
    log_level: str = "INFO"
    
    # Data paths - support environment variable with fallback to Google Drive
    raw_data_path: str = os.getenv("NDVI_RAW_DATA_PATH", "/mnt/g/我的云端硬盘/tenggeli_data")
    data_path: str = "../data"
    processed_data_path: str = "../data/processed"
    cache_path: str = "../data/cache"
    
    # Database settings
    database_url: str = "sqlite:///./tenggeli_monitoring.db"
    redis_url: Optional[str] = None
    
    # CORS settings - parse from environment variable or use defaults
    cors_origins: List[str] = []
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Parse CORS_ORIGINS from environment variable if provided
        cors_env = os.getenv("CORS_ORIGINS")
        if cors_env:
            self.cors_origins = [origin.strip() for origin in cors_env.split(",")]
        elif not self.cors_origins:
            # Default CORS origins for development
            self.cors_origins = ["http://localhost:3000", "http://localhost:5173"]
    
    # Region bounds (Tenggeli Desert)
    region_west: float = 103.0
    region_south: float = 37.5
    region_east: float = 105.2
    region_north: float = 39.0
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
    
    def parse_cors_origins(self):
        """Parse CORS origins after initialization"""
        cors_env = os.getenv("CORS_ORIGINS")
        if cors_env:
            self.cors_origins = [origin.strip() for origin in cors_env.split(",")]
        elif not self.cors_origins:
            self.cors_origins = ["http://localhost:3000", "http://localhost:5173"]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Parse CORS origins
        self.parse_cors_origins()
        # Convert relative paths to absolute paths
        if not os.path.isabs(self.data_path):
            self.data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", self.data_path))
        if not os.path.isabs(self.processed_data_path):
            self.processed_data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", self.processed_data_path))
        if not os.path.isabs(self.cache_path):
            self.cache_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", self.cache_path))

settings = Settings()