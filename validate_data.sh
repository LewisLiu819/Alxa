#!/bin/bash

echo "Validating Tenggeli NDVI Data..."

# Check if virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo "Backend virtual environment not found. Please run ./start_backend.sh first."
    exit 1
fi

# Activate virtual environment
source backend/venv/bin/activate

# Run data validation
python scripts/data_validation.py --data-path "data/raw/tenggeli_data" --output "data_validation_report.csv"

echo "Validation complete. Check data_validation_report.csv for details."