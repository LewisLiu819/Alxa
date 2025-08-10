# Tenggeli Desert Environmental Monitoring System

A web-based application for monitoring vegetation changes in the Tenggeli Desert using satellite NDVI data from 2015-2023.

## Project Overview

This system provides an interactive dashboard for analyzing vegetation trends in the Tenggeli Desert restoration areas. It processes satellite NDVI (Normalized Difference Vegetation Index) data and presents it through an intuitive map-based interface with time-series analysis capabilities.

## Features

- **Interactive Map Dashboard**: Click anywhere to analyze NDVI data at specific locations
- **Time Navigation**: Browse through monthly NDVI data from 2015-2023
- **Time Series Analysis**: View vegetation trends over time with statistical summaries
- **Real-time Data Processing**: Access to pre-processed satellite imagery data
- **Responsive Design**: Works on both desktop and mobile devices

## Architecture

### Frontend (React + TypeScript)
- Interactive map using Leaflet
- Time-series charts with Chart.js
- Real-time data fetching with React Query
- Responsive UI with Tailwind CSS

### Backend (Python FastAPI)
- REST API for NDVI data access
- Rasterio for geospatial data processing
- Statistical analysis and data validation
- CORS support for cross-origin requests

### Data Processing
- Automated validation of TIFF files
- NDVI data extraction and processing
- Statistical analysis and metadata generation

## Quick Start

### Prerequisites

- Python 3.8+ with pip
- Node.js 16+ with npm
- Your NDVI data should be in `/mnt/g/我的云端硬盘/tenggeli_data/`

### 1. Data Validation (Optional but Recommended)

First, validate your data to ensure everything is working correctly:

```bash
./validate_data.sh
```

This will create a validation report showing data quality and coverage.

### 2. Start the Backend

```bash
./start_backend.sh
```

The backend will be available at http://localhost:8000
- API documentation: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### 3. Start the Frontend

In a new terminal:

```bash
./start_frontend.sh
```

The frontend will be available at http://localhost:3000

### 4. Process Data (Optional)

For advanced use, you can process raw data into web-optimized formats:

```bash
./process_data.sh
```

## Usage

1. **Open the Application**: Navigate to http://localhost:3000
2. **Navigate Time**: Use the time slider at the bottom to select year and month
3. **Analyze Locations**: Click anywhere on the map to view NDVI time series
4. **View Statistics**: Check the side panel for detailed analysis and statistics
5. **Interpret Results**: Use the NDVI color scale and interpretation guide

## API Endpoints

### GET /api/v1/ndvi/timeseries
Get NDVI time series for a specific location.

**Parameters:**
- `lat`: Latitude (required)
- `lon`: Longitude (required)  
- `start_year`: Start year (default: 2015)
- `end_year`: End year (default: 2023)

**Example:**
```bash
curl "http://localhost:8000/api/v1/ndvi/timeseries?lat=39.8&lon=106.5&start_year=2020&end_year=2023"
```

### GET /api/v1/ndvi/files
Get list of available NDVI data files.

### GET /api/v1/ndvi/statistics
Get statistics for a specific month's NDVI data.

**Parameters:**
- `year`: Year (required)
- `month`: Month 1-12 (required)

## Data Structure

Your NDVI data should follow this naming convention:
```
tenggeli_ndvi_YYYY_MM.tif
```

Example files:
- `tenggeli_ndvi_2020_01.tif` (January 2020)
- `tenggeli_ndvi_2020_02.tif` (February 2020)

## Development

### Backend Development

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Data Processing Scripts

Located in the `scripts/` directory:
- `data_validation.py`: Validate TIFF file integrity and coverage
- `process_ndvi.py`: Process raw TIFF files for web application

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── routers/          # API endpoints
│   │   ├── services/         # Business logic
│   │   ├── models/           # Data models
│   │   └── config/           # Settings
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── services/         # API services
│   │   ├── hooks/           # Custom React hooks
│   │   └── types/           # TypeScript types
│   └── package.json
├── scripts/                  # Data processing scripts
├── data/
│   ├── raw/                 # Raw NDVI TIFF files (symlinked)
│   ├── processed/           # Processed data
│   └── cache/              # Cached results
└── CLAUDE.md               # Project instructions
```

## NDVI Interpretation

- **< 0.2**: Bare soil, rock, sand, or water
- **0.2-0.4**: Sparse vegetation or stressed plants
- **0.4-0.7**: Moderate vegetation health
- **> 0.7**: Dense, healthy vegetation

## Troubleshooting

### Backend Issues

1. **Import errors**: Make sure virtual environment is activated
2. **Data not found**: Check that data symlink exists in `data/raw/tenggeli_data`
3. **Permission errors**: Ensure TIFF files are readable

### Frontend Issues

1. **Network errors**: Ensure backend is running on port 8000
2. **CORS errors**: Backend includes CORS middleware for localhost
3. **Build errors**: Run `npm install` to ensure all dependencies are installed

### Data Issues

1. **No data available**: Check data validation report
2. **Invalid coordinates**: Ensure coordinates are within the dataset bounds
3. **Missing files**: Verify TIFF files follow naming convention

## Performance Notes

- Initial load may take a few seconds to process data
- Time series queries are cached for better performance
- Large coordinate ranges may take longer to process

## Contributing

This is a research/monitoring tool. For feature requests or bug reports, please document them clearly with steps to reproduce.

## License

This project is for research and environmental monitoring purposes.