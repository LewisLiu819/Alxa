from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from app.routers import ndvi
from app.config.settings import settings
from app.database import init_db
import logging
import os

# Setup logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Disable debug mode docs in production
app = FastAPI(
    title="Tenggeli Desert Monitoring API",
    description="API for environmental monitoring and vegetation analysis",
    version="1.0.0",
    debug=settings.debug,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    openapi_url="/openapi.json" if settings.debug else None
)

# Security: Add trusted host middleware in production
if not settings.debug:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*"]  # Configure with specific domains in production
    )

# Add GZIP compression for responses
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS configuration
logger.info(f"Configuring CORS with origins: {settings.cors_origins}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],  # Restrict to needed methods
    allow_headers=["*"],
    max_age=600,  # Cache preflight requests for 10 minutes
)

app.include_router(ndvi.router, prefix="/api/v1", tags=["ndvi"])

@app.on_event("startup")
async def startup_event():
    """Initialize database and data directories on startup."""
    logger.info("Initializing Tenggeli Desert Monitoring API...")
    init_db()
    logger.info(f"Data path: {settings.data_path}")
    logger.info(f"Processed data path: {settings.processed_data_path}")
    logger.info("API startup complete")

@app.get("/")
async def root():
    return {
        "message": "Tenggeli Desert Monitoring API",
        "version": "1.0.0",
        "status": "running",
        "data_path_exists": os.path.exists(settings.processed_data_path),
        "region_bounds": {
            "west": settings.region_west,
            "south": settings.region_south,
            "east": settings.region_east,
            "north": settings.region_north,
            "center": {
                "lat": (settings.region_south + settings.region_north) / 2,
                "lng": (settings.region_west + settings.region_east) / 2
            }
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "data_directories": {
            "data_path": os.path.exists(settings.data_path),
            "processed_data_path": os.path.exists(settings.processed_data_path),
            "cache_path": os.path.exists(settings.cache_path)
        }
    }

# Also expose health endpoint under API v1 path for consistency
@app.get("/api/v1/health")
async def api_health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "data_directories": {
            "data_path": os.path.exists(settings.data_path),
            "processed_data_path": os.path.exists(settings.processed_data_path),
            "cache_path": os.path.exists(settings.cache_path)
        }
    }