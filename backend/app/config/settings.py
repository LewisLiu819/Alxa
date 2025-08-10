from pydantic import BaseSettings
from typing import Optional, List
import os

class Settings(BaseSettings):
    # Application settings
    app_name: str = "Tenggeli Desert Monitoring API"
    debug: bool = True
    secret_key: str = "dev-secret-key-change-in-production"
    log_level: str = "INFO"
    
    # Data paths
    data_path: str = "../data"
    processed_data_path: str = "../data/processed"
    cache_path: str = "../data/cache"
    
    # Database settings
    database_url: str = "sqlite:///./tenggeli_monitoring.db"
    redis_url: Optional[str] = None
    
    # CORS settings
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    # Region bounds (Tenggeli Desert)
    region_west: float = 103.0
    region_south: float = 37.5
    region_east: float = 105.2
    region_north: float = 39.0
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

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