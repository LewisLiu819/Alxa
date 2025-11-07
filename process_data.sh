#!/bin/bash

echo "Processing Tenggeli NDVI Data for Web Application..."

# Check and mount Google Drive if needed
echo "📂 Checking Google Drive mount..."
if [ -f "./mount_drive.sh" ]; then
    ./mount_drive.sh
else
    echo "⚠️  mount_drive.sh not found, skipping drive check"
fi
echo ""

# Check if virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo "Backend virtual environment not found. Please run ./start_backend.sh first."
    exit 1
fi

# Activate virtual environment
source backend/venv/bin/activate

# Run data processing (uses default Google Drive path from settings)
echo "Running data processing from Google Drive..."
python scripts/process_ndvi.py --output-dir "data/processed"

echo "Data processing complete. Processed files are in data/processed/"