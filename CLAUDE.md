# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Alxa project, focused on developing a **Tenggeli Desert Environmental Monitoring and Tree Planting Analysis System**. The project aims to create an MVP for monitoring vegetation changes in the Tenggeli Desert using satellite data from 2020-2025.

## Project Status

This repository currently contains **planning documentation only** - no code has been implemented yet. The repository consists of:

- Planning documents for MVP implementation
- Technical architecture specifications  
- Dataset recommendations and analysis requirements
- UI/UX design specifications

## Planned Architecture

Based on the planning documents, the system will be implemented with:

### Frontend (React + TypeScript)
- Interactive map dashboard with time navigation (2020-2025)
- Components: MapContainer, TimeSlider, LayerControl, TimeSeriesChart
- Technology: React 18, TypeScript, Tailwind CSS, Leaflet, Chart.js
- Responsive design optimized for both desktop and mobile

### Backend (Python FastAPI) 
- REST APIs for NDVI data and location-based queries
- Google Earth Engine integration for satellite data processing
- Technology: FastAPI, Google Earth Engine, Redis caching, Pydantic
- Endpoints for NDVI time series, location analysis, and data export

### Data Pipeline
- Automated satellite data processing (Landsat 8/9, Sentinel-2)
- NDVI calculation and monthly composite generation
- Integration with weather data (ERA5, CHIRPS)
- Storage: PostgreSQL with PostGIS for spatial-temporal data

## Key Features to Implement

### Core MVP Features
1. **Interactive Map Dashboard** - Single-page web application with time slider
2. **Historical Vegetation Analysis** - NDVI time series and trend visualization  
3. **Data Processing Pipeline** - Automated satellite data processing and change detection

### Data Processing Requirements
- **Geographic Coverage**: Tenggeli Desert area (103.0°-105.2°E, 37.5°-39.0°N) - 2.2° x 1.5° coverage
- **Temporal Range**: Monthly composites from 2015-2024 (full historical data available)
- **Resolution**: 30m (Landsat) for balance of detail and processing speed
- **Indices**: NDVI, EVI, SAVI vegetation indices

## Development Workflow

### Project Setup Commands
*Note: No package.json or requirements.txt files exist yet. These will need to be created when implementation begins.*

**Frontend Setup (when implemented):**
```bash
npm install
npm run dev        # Start development server
npm run build      # Build for production
npm run lint       # Run ESLint
npm run test       # Run tests
```

**Backend Setup (when implemented):**
```bash
pip install -r requirements.txt
uvicorn main:app --reload    # Start development server
pytest                       # Run tests
```

### Data Processing
```bash
python scripts/download_data.py     # Download satellite data
python scripts/process_ndvi.py      # Calculate NDVI 
python scripts/generate_composites.py  # Generate monthly composites
```

## Technology Stack Decisions

### Frontend Stack
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for consistent styling
- **Leaflet** for interactive mapping capabilities
- **Chart.js** for time series visualization
- **React Query** for data fetching and caching

### Backend Stack  
- **FastAPI** for high-performance Python API
- **Google Earth Engine** for satellite data processing
- **PostgreSQL + PostGIS** for spatial-temporal data storage
- **Redis** for caching (optional for MVP)

### Deployment Strategy
- **Frontend**: Vercel or Netlify 
- **Backend**: Railway, Render, or Heroku
- **Database**: SQLite for MVP (upgrade to PostgreSQL later)

## External Dependencies

### Required API Access
- **Google Earth Engine** account and authentication
- **NASA Earthdata** API for MODIS/SMAP data
- **ESA Copernicus Hub** for Sentinel data access
- **USGS Earth Explorer** for Landsat archives

### Data Sources
- Landsat 8/9 for 30m resolution multispectral imagery
- Sentinel-2 for high-resolution vegetation analysis  
- ERA5 reanalysis for historical climate data
- CHIRPS for precipitation data

## File Structure (Planned)

```
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map/           # Map components
│   │   │   ├── Analysis/      # Analysis tools
│   │   │   └── UI/           # Shared UI components
│   │   ├── services/         # API and utility services
│   │   └── styles/          # CSS and styling
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── routers/         # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── models/          # Data models
│   │   └── config/          # Settings
│   ├── scripts/             # Data processing scripts
│   └── requirements.txt
└── data/
    ├── raw/                 # Downloaded satellite data
    ├── processed/           # Processed NDVI composites  
    └── cache/              # Cached analysis results
```

## Development Timeline

The MVP is planned for **6-week development cycle**:
- **Weeks 1-2**: Data foundation and Google Earth Engine setup
- **Weeks 3-4**: Backend development with FastAPI  
- **Weeks 5-6**: Frontend development with React

## Performance Requirements

- **Load Time**: < 3 seconds for initial map load
- **Responsiveness**: Smooth interaction on mobile and desktop  
- **Data Coverage**: 100% cloud-free monthly composites
- **Time to Insight**: < 30 seconds to view vegetation trends

## Future Extensions

### Planned Features (Post-MVP)
- Weather data integration (precipitation, temperature)
- AI-powered planting site recommendations using ML models
- Advanced change detection algorithms
- Multiple vegetation indices support
- User accounts and saved analyses