from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config.settings import settings
import os

# Create engine
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {}
)

# Create sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize database
def init_db():
    """Initialize database tables."""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create data directories if they don't exist
    os.makedirs(settings.data_path, exist_ok=True)
    os.makedirs(settings.processed_data_path, exist_ok=True)
    os.makedirs(settings.cache_path, exist_ok=True)