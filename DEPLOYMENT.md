# Deployment Guide - Tenggeli Desert Monitoring System

## Overview

This guide provides comprehensive instructions for deploying the Tenggeli Desert Monitoring System to production. The system consists of:

- **Frontend**: React + TypeScript + Vite application
- **Backend**: FastAPI Python application
- **Data**: Processed NDVI satellite imagery (2015-2024)

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Data Preparation](#data-preparation)
4. [Frontend Deployment](#frontend-deployment)
5. [Backend Deployment](#backend-deployment)
6. [Post-Deployment](#post-deployment)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Accounts

- [ ] Cloud hosting account (Vercel/Netlify for frontend)
- [ ] Backend hosting account (Railway/Render/Docker host)
- [ ] GitHub account (for automated deployments)
- [ ] Domain name (optional but recommended)

### Local Setup

- [ ] WSL environment with G: drive mounted
- [ ] Node.js 18+ installed
- [ ] Python 3.11+ installed
- [ ] Docker installed (for containerized deployment)
- [ ] Git installed

### Data Requirements

- [ ] Google Drive with NDVI data accessible
- [ ] Processed data directory created
- [ ] At least 5GB free space for processing

## Quick Start

### 1. Initial Setup

```bash
# Clone or navigate to project
cd /home/lewis/Alxa

# Mount Google Drive (requires sudo password)
./mount_drive.sh

# Start backend (will create venv and install dependencies)
./start_backend.sh
# In another terminal:
./start_frontend.sh
```

### 2. Process Data

```bash
# Validate data integrity
./validate_data.sh

# Process raw TIFF files to web-optimized format
./process_data.sh
```

### 3. Test Locally

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Data Preparation

### Step 1: Mount Google Drive

See [MOUNT_INSTRUCTIONS.md](./MOUNT_INSTRUCTIONS.md) for detailed instructions.

```bash
sudo mkdir -p /mnt/g
sudo mount -t drvfs G: /mnt/g

# Verify mount
ls -la "/mnt/g/我的云端硬盘/tenggeli_data"
```

### Step 2: Validate Data

```bash
./validate_data.sh
```

This will:
- Check all TIFF files for integrity
- Verify data coverage (2015-2024)
- Generate validation report
- Identify any corrupted files

Review the `data_validation_report.csv` for any issues.

### Step 3: Process Data

```bash
./process_data.sh
```

This will:
- Read TIFF files from Google Drive
- Convert to web-optimized format (uint8, compressed)
- Generate monthly composites
- Create metadata and index files
- Output to `data/processed/`

**Processing Time**: Expect 1-5 minutes per year of data (depends on file sizes and CPU).

**Output Structure**:
```
data/processed/
├── 2015_01/
│   ├── processed.tif
│   └── metadata.json
├── 2015_02/
│   ├── processed.tif
│   └── metadata.json
...
└── index.json
```

## Frontend Deployment

The frontend is a static React application that can be deployed to Vercel or Netlify.

### Option A: Vercel (Recommended)

**Why Vercel:**
- Optimized for Vite applications
- Automatic deployments from Git
- Global CDN
- Free SSL certificates
- Generous free tier

**Deployment Steps:**

1. **Push code to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Deploy via Vercel Dashboard:**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Configure:
     - Framework Preset: Vite
     - Root Directory: `frontend`
     - Build Command: `npm run build`
     - Output Directory: `dist`

3. **Set Environment Variables:**
   ```
   VITE_API_BASE_URL=https://your-backend-url.com
   VITE_APP_ENV=production
   ```

4. **Deploy:** Click "Deploy" button

5. **Get URL:** Note your deployment URL (e.g., `https://your-app.vercel.app`)

**Detailed Guide**: See [frontend/README_DEPLOYMENT.md](./frontend/README_DEPLOYMENT.md)

### Option B: Netlify

**Deployment Steps:**

1. **Push to GitHub**

2. **Connect to Netlify:**
   - Go to https://app.netlify.com
   - Click "New site from Git"
   - Select repository
   - Configure:
     - Base directory: `frontend`
     - Build command: `npm run build`
     - Publish directory: `frontend/dist`

3. **Environment Variables:**
   ```
   VITE_API_BASE_URL=https://your-backend-url.com
   ```

4. **Deploy**

**Configuration File**: `frontend/netlify.toml` (already created)

## Backend Deployment

The backend is a Python FastAPI application. Multiple deployment options:

### Option A: Railway (Easiest)

**Why Railway:**
- Simple Docker deployment
- Automatic SSL
- Generous free tier ($5/month credit)
- PostgreSQL add-on available

**Deployment Steps:**

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Initialize project:**
   ```bash
   cd backend
   railway init
   ```

3. **Set environment variables:**
   ```bash
   railway variables set DEBUG=false
   railway variables set SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")
   railway variables set CORS_ORIGINS=https://your-frontend.vercel.app
   ```

4. **Deploy:**
   ```bash
   railway up
   ```

5. **Get deployment URL:**
   ```bash
   railway status
   ```

6. **Upload processed data:**
   - Option 1: Include in Docker image (if <500MB)
   - Option 2: Use Railway volume
   - Option 3: Cloud storage (S3/GCS)

**Configuration File**: `backend/railway.json` (already created)

**Detailed Guide**: See [backend/README_DEPLOYMENT.md](./backend/README_DEPLOYMENT.md)

### Option B: Render

**Deployment Steps:**

1. **Push to GitHub**

2. **Create new Web Service:**
   - Go to https://render.com
   - Click "New +" → "Web Service"
   - Connect repository
   - Select `backend` directory

3. **Configure:**
   - Environment: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

4. **Set environment variables** in dashboard

5. **Deploy**

**Configuration File**: `backend/render.yaml` (already created)

### Option C: Docker Container

**For VPS or custom hosting:**

1. **Build image:**
   ```bash
   cd backend
   docker build -t tenggeli-backend:latest .
   ```

2. **Run container:**
   ```bash
   docker run -d \
     --name tenggeli-backend \
     -p 8000:8000 \
     -v $(pwd)/../data/processed:/app/data/processed:ro \
     -e DEBUG=false \
     -e CORS_ORIGINS=https://your-frontend.com \
     -e SECRET_KEY=your-secret-key \
     tenggeli-backend:latest
   ```

3. **Or use docker-compose:**
   ```bash
   cd ..  # Project root
   docker-compose up -d
   ```

**Configuration Files**: 
- `backend/Dockerfile`
- `docker-compose.yml`

## Post-Deployment

### 1. Update Frontend with Backend URL

If you deployed backend first:

```bash
# Update Vercel environment variable
vercel env add VITE_API_BASE_URL production
# Enter: https://your-backend-url.com

# Redeploy
vercel --prod
```

If you deployed frontend first, update backend CORS:

```bash
# Railway
railway variables set CORS_ORIGINS=https://your-frontend.vercel.app

# Render - update in dashboard
```

### 2. Verify Deployment

**Test Backend:**
```bash
# Health check
curl https://your-backend-url.com/health

# API endpoint
curl "https://your-backend-url.com/api/v1/ndvi/files"

# CORS test (from browser console on frontend)
fetch('https://your-backend-url.com/health')
  .then(r => r.json())
  .then(console.log)
```

**Test Frontend:**
- Open https://your-frontend-url.com
- Check browser console for errors
- Try clicking on map
- Verify time slider works
- Check NDVI data loads

### 3. Configure Custom Domain (Optional)

**Frontend (Vercel):**
1. Go to project settings → Domains
2. Add custom domain
3. Update DNS records as instructed
4. Wait for SSL provisioning

**Backend (Railway):**
1. Go to project settings → Domains
2. Add custom domain
3. Update DNS A record
4. SSL automatic

### 4. Set Up Monitoring

**Uptime Monitoring:**
- UptimeRobot (free): https://uptimerobot.com
- Monitor health endpoint: `https://your-backend-url.com/health`
- Get alerts for downtime

**Error Tracking:**
```bash
# Optional: Add Sentry
pip install sentry-sdk[fastapi]
```

**Analytics:**
- Vercel Analytics (frontend)
- Google Analytics
- Plausible Analytics (privacy-friendly)

## Monitoring and Maintenance

### Regular Tasks

**Daily:**
- [ ] Check application uptime
- [ ] Review error logs

**Weekly:**
- [ ] Check disk space usage
- [ ] Review access patterns
- [ ] Check for dependency updates

**Monthly:**
- [ ] Update dependencies
- [ ] Review and rotate logs
- [ ] Check backup integrity
- [ ] Performance review

### Updating the Application

**Frontend Updates:**
```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push origin main

# Automatic deployment on Vercel/Netlify
```

**Backend Updates:**
```bash
# Make changes
git push origin main

# Railway: Automatic deployment

# Docker: Rebuild and redeploy
docker-compose up -d --build
```

### Data Updates

When new NDVI data is available:

1. **Process new data locally:**
   ```bash
   ./process_data.sh
   ```

2. **Upload to production:**
   - **Railway**: Use persistent volume or rebuild
   - **Docker**: Update volume mount
   - **Cloud Storage**: Upload to S3/GCS

3. **Verify new data:**
   ```bash
   curl "https://your-backend-url.com/api/v1/ndvi/files"
   ```

### Backup Strategy

**What to Backup:**
- Processed data directory
- Database (if using PostgreSQL)
- Environment variables (encrypted)
- Configuration files

**Backup Schedule:**
- Processed data: Weekly
- Database: Daily
- Configuration: On change

**Backup Tools:**
```bash
# Local backup
tar -czf backup-$(date +%Y%m%d).tar.gz data/processed

# Upload to cloud
aws s3 cp backup-$(date +%Y%m%d).tar.gz s3://your-bucket/backups/
```

## Troubleshooting

### Frontend Issues

**Problem**: White screen / no content
- Check browser console for errors
- Verify `VITE_API_BASE_URL` is set correctly
- Check network tab for failed requests

**Problem**: API connection errors
- Verify backend is running: `curl https://backend-url/health`
- Check CORS settings on backend
- Verify firewall rules

**Problem**: Map not loading
- Check Leaflet CSS is loaded
- Verify internet connection (external dependencies)
- Check browser console for errors

### Backend Issues

**Problem**: 500 errors
- Check logs: `railway logs` or `docker logs tenggeli-backend`
- Verify processed data directory exists
- Check database connectivity

**Problem**: CORS errors
- Verify `CORS_ORIGINS` includes frontend URL
- Check for trailing slashes
- Verify protocol (http vs https)

**Problem**: Data not found
- Check `PROCESSED_DATA_PATH` environment variable
- Verify volume mounts (Docker)
- Check file permissions

### Deployment Issues

**Problem**: Build fails
- Check build logs
- Verify all dependencies in `requirements.txt` / `package.json`
- Check for syntax errors

**Problem**: Out of memory
- Increase memory limits (platform-specific)
- Optimize data processing
- Use smaller Docker base image

## Cost Estimates

### Free Tier (Suitable for MVP/Demo)

- **Frontend** (Vercel): Free for personal projects
- **Backend** (Railway): $5/month credit (free)
- **Domain**: $10-15/year (optional)
- **Total**: $0-2/month

### Production (Low-Medium Traffic)

- **Frontend** (Vercel Pro): $20/month
- **Backend** (Railway/Render): $5-20/month
- **Database** (Managed PostgreSQL): $7-25/month
- **Storage** (Cloud): $1-10/month
- **Domain**: $10-15/year
- **Total**: $35-75/month

### Scaling (High Traffic)

- **Frontend** (Vercel Enterprise): $150+/month
- **Backend** (Multiple instances): $50-200/month
- **Database** (Managed, replicated): $50-200/month
- **CDN/Storage**: $20-100/month
- **Total**: $270-650/month

## Security Checklist

- [ ] `DEBUG=false` in production
- [ ] Strong `SECRET_KEY` generated
- [ ] CORS restricted to specific domains
- [ ] HTTPS enabled (automatic on platforms)
- [ ] API documentation disabled in production
- [ ] Environment variables secured
- [ ] Regular dependency updates
- [ ] Monitoring and alerting configured

See [backend/SECURITY.md](./backend/SECURITY.md) for comprehensive security guidelines.

## Support and Resources

### Documentation

- [Frontend Deployment](./frontend/README_DEPLOYMENT.md)
- [Backend Deployment](./backend/README_DEPLOYMENT.md)
- [Security Guidelines](./backend/SECURITY.md)
- [Mount Instructions](./MOUNT_INSTRUCTIONS.md)

### Platform Documentation

- **Vercel**: https://vercel.com/docs
- **Netlify**: https://docs.netlify.com
- **Railway**: https://docs.railway.app
- **Render**: https://render.com/docs
- **FastAPI**: https://fastapi.tiangolo.com
- **React**: https://react.dev
- **Docker**: https://docs.docker.com

### Community

- FastAPI Discord: https://discord.com/invite/fastapi
- React Community: https://react.dev/community

## Quick Reference

### Environment Variables

**Frontend:**
```bash
VITE_API_BASE_URL=https://your-backend.com
VITE_APP_ENV=production
```

**Backend:**
```bash
DEBUG=false
SECRET_KEY=<generated-secret>
CORS_ORIGINS=https://your-frontend.com
PROCESSED_DATA_PATH=/app/data/processed
```

### Useful Commands

```bash
# Local development
./start_backend.sh
./start_frontend.sh

# Data processing
./mount_drive.sh
./validate_data.sh
./process_data.sh

# Docker
docker-compose up -d
docker-compose logs -f
docker-compose down

# Railway
railway login
railway up
railway logs
railway variables set KEY=VALUE

# Vercel
vercel
vercel --prod
vercel env add
```

## Next Steps

After successful deployment:

1. **Test thoroughly** - Click through all features
2. **Set up monitoring** - UptimeRobot + error tracking
3. **Document** - Note your URLs, credentials (encrypted)
4. **Share** - Provide access to stakeholders
5. **Iterate** - Gather feedback and improve

## Getting Help

If you encounter issues:

1. Check this documentation
2. Review platform-specific guides
3. Check application logs
4. Search for error messages
5. Review security guidelines

For urgent issues, check platform status pages:
- Vercel: https://www.vercel-status.com
- Railway: https://status.railway.app
- Render: https://status.render.com

---

**Last Updated**: November 2025
**Deployment Version**: 1.0.0

