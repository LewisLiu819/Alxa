#!/bin/bash

# sudo mount -t drvfs G: /mnt/g

echo "Processing Tenggeli NDVI Data for Web Application..."

# Check if virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo "Backend virtual environment not found. Please run ./start_backend.sh first."
    exit 1
fi

# Activate virtual environment
source backend/venv/bin/activate

# Run data processing
python scripts/process_ndvi.py --input-dir "data/raw/tenggeli_data" --output-dir "data/processed"

echo "Data processing complete. Processed files are in data/processed/"