# Backend Deployment Guide

## Overview

The Tenggeli Desert Monitoring backend is a FastAPI application that serves NDVI data through a REST API. It can be deployed using Docker or directly to cloud platforms.

## Prerequisites

- Python 3.11+
- Docker (for containerized deployment)
- Processed NDVI data files
- Cloud platform account (Railway, Render, or similar)

## Environment Configuration

### Required Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `APP_NAME` | No | "Tenggeli Desert Monitoring API" | Application name |
| `DEBUG` | No | `false` | Debug mode (set to `false` in production) |
| `SECRET_KEY` | Yes | - | Secret key for sessions/JWT (generate random) |
| `LOG_LEVEL` | No | `INFO` | Logging level (DEBUG, INFO, WARNING, ERROR) |
| `DATA_PATH` | No | `/app/data` | Base data directory |
| `PROCESSED_DATA_PATH` | Yes | `/app/data/processed` | Processed NDVI files location |
| `CACHE_PATH` | No | `/app/data/cache` | Cache directory |
| `DATABASE_URL` | No | `sqlite:///./tenggeli_monitoring.db` | Database connection string |
| `REDIS_URL` | No | - | Redis connection (optional) |
| `CORS_ORIGINS` | Yes | - | Comma-separated list of allowed frontend origins |

### Generate Secret Key

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Deployment Options

### Option 1: Docker Deployment (Recommended)

#### Local Testing with Docker Compose

1. **Ensure processed data is available:**
   ```bash
   # Make sure ./data/processed contains your NDVI files
   ls -la ./data/processed
   ```

2. **Update docker-compose.yml:**
   - Set `CORS_ORIGINS` to include your frontend URL
   - Verify volume mounts

3. **Build and run:**
   ```bash
   docker-compose up -d
   ```

4. **Check logs:**
   ```bash
   docker-compose logs -f backend
   ```

5. **Access API:**
   - API: http://localhost:8000
   - Docs: http://localhost:8000/docs
   - Health: http://localhost:8000/health

6. **Stop services:**
   ```bash
   docker-compose down
   ```

#### Deploy to Docker Host

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
     -v /path/to/processed/data:/app/data/processed:ro \
     -e DEBUG=false \
     -e CORS_ORIGINS=https://your-frontend.com \
     tenggeli-backend:latest
   ```

3. **Verify deployment:**
   ```bash
   curl http://localhost:8000/health
   ```

### Option 2: Railway Deployment

Railway provides easy Docker-based deployment with automatic SSL and scaling.

#### Deploy Steps

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login:**
   ```bash
   railway login
   ```

3. **Initialize project:**
   ```bash
   cd backend
   railway init
   ```

4. **Set environment variables:**
   ```bash
   railway variables set DEBUG=false
   railway variables set CORS_ORIGINS=https://your-frontend.com
   railway variables set SECRET_KEY=your-generated-secret-key
   ```

5. **Deploy:**
   ```bash
   railway up
   ```

6. **Get deployment URL:**
   ```bash
   railway status
   ```

#### Railway Dashboard Configuration

1. Go to project settings
2. Add environment variables
3. Configure volume for data (if needed)
4. Set up custom domain (optional)

**Note:** Railway includes `railway.json` configuration for build settings.

### Option 3: Render Deployment

Render provides simple Python app deployment with managed services.

#### Deploy via GitHub

1. **Push code to GitHub**

2. **Create new Web Service on Render:**
   - Connect your GitHub repository
   - Select the backend directory
   - Set build command: `pip install -r requirements.txt`
   - Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

3. **Configure Environment Variables in Render Dashboard:**
   ```
   DEBUG=false
   SECRET_KEY=your-generated-secret-key
   CORS_ORIGINS=https://your-frontend.com
   PROCESSED_DATA_PATH=/opt/render/project/src/data/processed
   ```

4. **Deploy:** Render will automatically build and deploy

**Note:** Render includes `render.yaml` configuration.

### Option 4: Manual Deployment (VPS/Linux Server)

For deployment to a VPS or dedicated server:

#### Setup Steps

1. **Install system dependencies:**
   ```bash
   sudo apt-get update
   sudo apt-get install -y python3.11 python3.11-venv gdal-bin libgdal-dev
   ```

2. **Clone repository:**
   ```bash
   git clone <your-repo-url>
   cd Alxa/backend
   ```

3. **Create virtual environment:**
   ```bash
   python3.11 -m venv venv
   source venv/bin/activate
   ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Configure environment:**
   ```bash
   cp env.production.example .env
   nano .env  # Edit with your settings
   ```

6. **Run with Gunicorn (production ASGI server):**
   ```bash
   pip install gunicorn
   gunicorn app.main:app \
     --workers 4 \
     --worker-class uvicorn.workers.UvicornWorker \
     --bind 0.0.0.0:8000 \
     --access-logfile - \
     --error-logfile -
   ```

7. **Set up systemd service:**
   ```bash
   sudo nano /etc/systemd/system/tenggeli-backend.service
   ```

   ```ini
   [Unit]
   Description=Tenggeli Backend API
   After=network.target

   [Service]
   Type=notify
   User=your-user
   WorkingDirectory=/path/to/Alxa/backend
   Environment="PATH=/path/to/Alxa/backend/venv/bin"
   ExecStart=/path/to/Alxa/backend/venv/bin/gunicorn app.main:app \
     --workers 4 \
     --worker-class uvicorn.workers.UvicornWorker \
     --bind 0.0.0.0:8000
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

8. **Enable and start service:**
   ```bash
   sudo systemctl enable tenggeli-backend
   sudo systemctl start tenggeli-backend
   sudo systemctl status tenggeli-backend
   ```

9. **Configure Nginx reverse proxy:**
   ```bash
   sudo nano /etc/nginx/sites-available/tenggeli-backend
   ```

   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

10. **Enable site and restart Nginx:**
    ```bash
    sudo ln -s /etc/nginx/sites-available/tenggeli-backend /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

11. **Set up SSL with Let's Encrypt:**
    ```bash
    sudo apt-get install certbot python3-certbot-nginx
    sudo certbot --nginx -d api.yourdomain.com
    ```

## Data Management

### Uploading Processed Data

Your processed NDVI data needs to be accessible to the backend. Options:

#### Option 1: Include in Docker Image (Small datasets <500MB)

Uncomment in Dockerfile:
```dockerfile
COPY --chown=appuser:appuser ../data/processed ./data/processed
```

#### Option 2: Volume Mount (Recommended)

Use Docker volumes or bind mounts:
```bash
docker run -v /host/path/data/processed:/app/data/processed:ro ...
```

#### Option 3: Cloud Storage (Best for production)

1. Upload processed data to AWS S3, Google Cloud Storage, or similar
2. Modify backend to read from cloud storage
3. Benefits: Scalable, no container size limits, CDN acceleration

### Data Sync Strategy

For regular data updates:

1. **Process data locally:**
   ```bash
   ./mount_drive.sh
   ./process_data.sh
   ```

2. **Upload to deployment:**
   - Docker: Rebuild image or update volume
   - Cloud storage: Upload new files
   - VPS: rsync to server

## Post-Deployment

### 1. Verify Deployment

```bash
# Check health endpoint
curl https://your-backend-url.com/health

# Check API docs
open https://your-backend-url.com/docs

# Test NDVI endpoint
curl "https://your-backend-url.com/api/v1/ndvi/files"
```

### 2. Update Frontend

Update frontend environment variable:
```bash
VITE_API_BASE_URL=https://your-backend-url.com
```

### 3. Configure CORS

Ensure backend CORS settings include your frontend domain:
```python
CORS_ORIGINS=https://your-frontend.com,https://www.your-frontend.com
```

### 4. Monitor Application

#### Logs

**Docker:**
```bash
docker logs -f tenggeli-backend
```

**Railway:**
```bash
railway logs
```

**Render:**
Check logs in dashboard

**VPS:**
```bash
sudo journalctl -u tenggeli-backend -f
```

#### Health Checks

Set up monitoring for `/health` endpoint using:
- UptimeRobot
- Pingdom
- Built-in platform monitoring

## Troubleshooting

### API Returns 500 Errors

1. Check logs for error details
2. Verify processed data files exist and are readable
3. Check database connectivity
4. Verify all environment variables are set

### CORS Errors

1. Verify `CORS_ORIGINS` includes frontend domain
2. Check for trailing slashes
3. Ensure protocol (http/https) matches

### Data Not Found

1. Check `PROCESSED_DATA_PATH` is correct
2. Verify volume mounts (Docker)
3. Check file permissions
4. Ensure processed data structure matches expected format

### Performance Issues

1. Check data file sizes
2. Consider Redis for caching
3. Increase worker count
4. Use CDN for static data
5. Optimize database queries

### Docker Build Fails

1. Check Dockerfile syntax
2. Verify base image availability
3. Ensure GDAL dependencies install correctly
4. Try building without cache: `docker build --no-cache`

## Security Considerations

1. **Secret Key:** Always use a strong, randomly generated secret key
2. **HTTPS:** Always use HTTPS in production (automatic on Railway/Render)
3. **CORS:** Restrict CORS to specific domains, don't use wildcards
4. **Environment Variables:** Never commit secrets to git
5. **Database:** Use PostgreSQL for production, not SQLite
6. **Updates:** Keep dependencies updated: `pip install --upgrade -r requirements.txt`

## Scaling

### Horizontal Scaling

- Deploy multiple instances behind a load balancer
- Use shared database (PostgreSQL)
- Use Redis for distributed caching
- Store processed data in cloud storage

### Vertical Scaling

- Increase worker count
- Upgrade server resources
- Optimize data processing

## Cost Optimization

- **Railway:** Free tier available, pay for usage
- **Render:** Free tier with limitations
- **Docker + VPS:** Most cost-effective for consistent load
- **Serverless:** Consider AWS Lambda for very low traffic

## Support

For deployment issues:
- **Docker:** https://docs.docker.com
- **Railway:** https://docs.railway.app
- **Render:** https://render.com/docs
- **FastAPI:** https://fastapi.tiangolo.com

