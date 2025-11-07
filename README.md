# Tenggeli Desert Environmental Monitoring System

A comprehensive web-based application for monitoring vegetation changes in the Tenggeli Desert using satellite NDVI (Normalized Difference Vegetation Index) data from 2015-2024.

## 🌟 Features

- **Interactive Map Dashboard**: Click anywhere to analyze NDVI data at specific locations
- **Time Series Analysis**: View vegetation trends over time with statistical summaries
- **Historical Data**: Browse monthly NDVI data from 2015-2024
- **Real-time Processing**: Access pre-processed satellite imagery data
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🏗️ Architecture

### Frontend
- **Tech Stack**: React 18, TypeScript, Vite, Tailwind CSS
- **Mapping**: Leaflet for interactive maps
- **Charts**: Chart.js for time-series visualization
- **State Management**: React Query for data fetching and caching

### Backend
- **Framework**: FastAPI (Python)
- **Geospatial**: Rasterio for TIFF processing
- **API**: RESTful endpoints for NDVI data
- **Performance**: Caching and optimized data queries

### Data Pipeline
- **Source**: Google Drive mounted NDVI satellite data
- **Processing**: Automated validation and web optimization
- **Format**: GeoTIFF files converted to uint8 compressed format
- **Storage**: Local processed data with metadata indexing

## 🚀 Quick Start

### Prerequisites

- **WSL** (Windows Subsystem for Linux) or Linux environment
- **Node.js** 18+ and npm
- **Python** 3.11+ with pip
- **Google Drive** data mounted at G: drive
- **5GB+** free disk space for data processing

### 1. Initial Setup

```bash
# Clone or navigate to the project directory
cd /home/lewis/Alxa

# Mount Google Drive (requires sudo password)
./mount_drive.sh

# Verify data is accessible
ls -la "/mnt/g/我的云端硬盘/tenggeli_data"
```

### 2. Process Data

```bash
# Validate data integrity (recommended first time)
./validate_data.sh

# Process raw TIFF files to web-optimized format
./process_data.sh
```

This will:
- Read TIFF files from Google Drive
- Convert to web-optimized format
- Generate monthly composites
- Create metadata and index files
- Output to `data/processed/`

### 3. Start Development Servers

**Backend:**
```bash
./start_backend.sh
```
- API: http://localhost:8000
- Interactive Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

**Frontend** (in a new terminal):
```bash
./start_frontend.sh
```
- Application: http://localhost:3000

### 4. Use the Application

1. Open http://localhost:3000 in your browser
2. Use the time slider to select a year and month
3. Click anywhere on the map to view NDVI time series
4. Check the side panel for detailed statistics
5. Interpret results using the NDVI color scale

## 📊 Understanding NDVI Values

- **< 0.2**: Bare soil, rock, sand, or water
- **0.2-0.4**: Sparse vegetation or stressed plants
- **0.4-0.7**: Moderate vegetation health
- **> 0.7**: Dense, healthy vegetation

## 🔄 API Endpoints

### Get Time Series
```bash
GET /api/v1/ndvi/timeseries?lat=38.5&lon=104.5&start_year=2020&end_year=2023
```

### Get Available Files
```bash
GET /api/v1/ndvi/files
```

### Get Statistics
```bash
GET /api/v1/ndvi/statistics?year=2023&month=6
```

### Get Single Value
```bash
GET /api/v1/ndvi/value?lat=38.5&lon=104.5&year=2023&month=6
```

### Health Check
```bash
GET /health
```

## 🌐 Deployment

### Quick Deployment

1. **Run pre-deployment tests:**
   ```bash
   ./test_production_build.sh
   ```

2. **Review checklist:**
   - See [PRE_DEPLOYMENT_CHECKLIST.md](./PRE_DEPLOYMENT_CHECKLIST.md)

3. **Deploy:**
   - Frontend: Vercel or Netlify
   - Backend: Railway, Render, or Docker
   - See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions

### Recommended Platforms

**Frontend:**
- ✅ Vercel (recommended for Vite)
- ✅ Netlify

**Backend:**
- ✅ Railway (easiest Docker deployment)
- ✅ Render (simple Python deployment)
- ✅ Docker on VPS (most flexible)

## 📁 Project Structure

```
Alxa/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API services
│   │   ├── hooks/          # Custom React hooks
│   │   └── types/          # TypeScript types
│   ├── vercel.json         # Vercel configuration
│   ├── netlify.toml        # Netlify configuration
│   └── README_DEPLOYMENT.md
├── backend/                 # FastAPI backend application
│   ├── app/
│   │   ├── routers/        # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── models/         # Data models
│   │   └── config/         # Settings
│   ├── Dockerfile          # Docker configuration
│   ├── railway.json        # Railway configuration
│   ├── render.yaml         # Render configuration
│   ├── SECURITY.md         # Security guidelines
│   └── README_DEPLOYMENT.md
├── scripts/                # Data processing scripts
│   ├── data_validation.py  # Validate TIFF files
│   └── process_ndvi.py     # Process for web
├── data/
│   ├── processed/          # Web-optimized data
│   └── cache/             # Cached results
├── docker-compose.yml     # Docker Compose configuration
├── DEPLOYMENT.md          # Deployment guide
├── MOUNT_INSTRUCTIONS.md  # Google Drive mount guide
├── PRE_DEPLOYMENT_CHECKLIST.md
└── test_production_build.sh
```

## 🔧 Development

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

### Run Tests

```bash
# Full production build test
./test_production_build.sh

# Frontend tests
cd frontend
npm run lint
npm run type-check

# Backend tests (if implemented)
cd backend
pytest
```

## 🛠️ Configuration

### Environment Variables

**Frontend** (`frontend/.env.local`):
```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_ENV=development
```

**Backend** (`backend/.env`):
```bash
DEBUG=true
DATA_PATH=../data
PROCESSED_DATA_PATH=../data/processed
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
NDVI_RAW_DATA_PATH=/mnt/g/我的云端硬盘/tenggeli_data
```

See `env.example` files for complete configuration options.

## 📈 Data Management

### Data Sources

- **Raw Data**: Google Drive at `G:\我的云端硬盘\tenggeli_data`
- **Format**: GeoTIFF files named `tenggeli_ndvi_YYYY_MM.tif`
- **Coverage**: 2015-2024, monthly composites
- **Resolution**: 30m (Landsat)

### Processing Pipeline

1. **Mount Google Drive**: `./mount_drive.sh`
2. **Validate**: `./validate_data.sh` - Check integrity
3. **Process**: `./process_data.sh` - Convert to web format
4. **Serve**: Backend reads from `data/processed/`

### Updating Data

When new NDVI data is available:

```bash
# 1. Ensure Google Drive has new data
./mount_drive.sh

# 2. Process new data
./process_data.sh

# 3. Restart backend to pick up changes
# (or it will detect automatically on next request)
```

## 🔒 Security

- ✅ CORS configured for specific origins
- ✅ HTTPS enforced in production
- ✅ Input validation on all endpoints
- ✅ Rate limiting recommendations included
- ✅ No sensitive data in repository

See [backend/SECURITY.md](./backend/SECURITY.md) for comprehensive security guidelines.

## 🐛 Troubleshooting

### Common Issues

**Problem**: Mount drive fails
- **Solution**: Run with sudo: `sudo ./mount_drive.sh`
- See [MOUNT_INSTRUCTIONS.md](./MOUNT_INSTRUCTIONS.md)

**Problem**: No data found
- **Solution**: Check Google Drive path and run `./process_data.sh`

**Problem**: Frontend can't connect to backend
- **Solution**: Check CORS settings and verify backend is running

**Problem**: Map doesn't load
- **Solution**: Check browser console, verify Leaflet CSS loaded

See [DEPLOYMENT.md](./DEPLOYMENT.md) for more troubleshooting tips.

## 📚 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide
- **[PRE_DEPLOYMENT_CHECKLIST.md](./PRE_DEPLOYMENT_CHECKLIST.md)** - Pre-deployment checklist
- **[MOUNT_INSTRUCTIONS.md](./MOUNT_INSTRUCTIONS.md)** - Google Drive mounting
- **[frontend/README_DEPLOYMENT.md](./frontend/README_DEPLOYMENT.md)** - Frontend deployment
- **[backend/README_DEPLOYMENT.md](./backend/README_DEPLOYMENT.md)** - Backend deployment
- **[backend/SECURITY.md](./backend/SECURITY.md)** - Security guidelines

## 🤝 Contributing

This is a research/monitoring tool for the Tenggeli Desert restoration project. For feature requests or bug reports:

1. Document the issue clearly
2. Include steps to reproduce
3. Provide system information
4. Check existing documentation first

## 📄 License

This project is for research and environmental monitoring purposes.

## 🌍 About Tenggeli Desert

The Tenggeli Desert (腾格里沙漠) is located in Inner Mongolia, China. This monitoring system helps track vegetation changes and restoration efforts in the region using satellite-based NDVI analysis.

**Geographic Coverage:**
- Longitude: 103.0°E - 105.2°E
- Latitude: 37.5°N - 39.0°N
- Area: Approximately 2.2° × 1.5° coverage

## 💡 Tips

- **Performance**: First load may take a few seconds to process data
- **Data Quality**: Use validation report to identify any data gaps
- **Time Range**: Adjust year range in API calls to reduce response time
- **Caching**: Time series queries are cached for better performance

## 🎯 Roadmap

### Current (v1.0)
- ✅ Interactive map with NDVI visualization
- ✅ Time series analysis
- ✅ Historical data (2015-2024)
- ✅ Production deployment ready

### Future Enhancements
- Weather data integration (precipitation, temperature)
- Multiple vegetation indices (EVI, SAVI)
- AI-powered site recommendations
- Predictive modeling
- Mobile application
- Real-time alerts

## 📞 Support

For questions or issues:

1. Check the documentation
2. Review troubleshooting sections
3. Check platform status pages (if deployed)
4. Review application logs

## 🙏 Acknowledgments

- Satellite data from Landsat program
- Built with FastAPI, React, and Leaflet
- Deployment platforms: Vercel, Railway, Render

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Status**: Production Ready ✅
