from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from app.config.settings import settings
import os
import zipfile
import tarfile
import shutil
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Simple auth token for upload protection (set via environment variable)
UPLOAD_TOKEN = os.getenv("UPLOAD_TOKEN", "temporary-upload-token-change-me")

def extract_archive(filepath: str, extract_to: str):
    """Extract zip or tar.gz file"""
    try:
        if filepath.endswith('.zip'):
            with zipfile.ZipFile(filepath, 'r') as zip_ref:
                zip_ref.extractall(extract_to)
        elif filepath.endswith('.tar.gz') or filepath.endswith('.tgz'):
            with tarfile.open(filepath, 'r:gz') as tar_ref:
                tar_ref.extractall(extract_to)
        
        # Rename original file after extraction
        os.rename(filepath, filepath + '.extracted')
        logger.info(f"Successfully extracted {filepath}")
    except Exception as e:
        logger.error(f"Failed to extract {filepath}: {e}")

@router.post("/upload")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    token: str = ""
):
    """
    Upload a file to the data directory.
    Supports .zip and .tar.gz files which will be automatically extracted.
    """
    # Simple token authentication
    if token != UPLOAD_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid upload token")
    
    # Validate file extension
    allowed_extensions = ['.zip', '.tar.gz', '.tgz']
    is_archive = any(file.filename.endswith(ext) for ext in allowed_extensions)
    
    # Create data directory if not exists
    os.makedirs(settings.data_path, exist_ok=True)
    
    # Save file
    filepath = os.path.join(settings.data_path, file.filename)
    
    try:
        with open(filepath, "wb") as buffer:
            # Read in chunks for large files
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                buffer.write(chunk)
        
        file_size = os.path.getsize(filepath)
        logger.info(f"Uploaded file: {file.filename}, size: {file_size} bytes")
        
        # Auto-extract archives in background
        if is_archive:
            background_tasks.add_task(extract_archive, filepath, settings.data_path)
            return JSONResponse({
                "status": "success",
                "message": f"File uploaded and extraction started",
                "filename": file.filename,
                "size": file_size,
                "extracting": True
            })
        
        return JSONResponse({
            "status": "success", 
            "message": "File uploaded successfully",
            "filename": file.filename,
            "size": file_size
        })
        
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/files")
async def list_files(token: str = ""):
    """List all files in the data directory"""
    if token != UPLOAD_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    try:
        files = []
        for root, dirs, filenames in os.walk(settings.data_path):
            for filename in filenames:
                filepath = os.path.join(root, filename)
                rel_path = os.path.relpath(filepath, settings.data_path)
                files.append({
                    "path": rel_path,
                    "size": os.path.getsize(filepath)
                })
        
        return {
            "data_path": settings.data_path,
            "files": files[:100],  # Limit to first 100 files
            "total_count": len(files)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

