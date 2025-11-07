# Pre-Deployment Checklist

Use this checklist before deploying to production.

## Data Preparation

- [ ] Google Drive G: is mounted in WSL
  ```bash
  ./mount_drive.sh
  ```

- [ ] Data validation completed successfully
  ```bash
  ./validate_data.sh
  # Review data_validation_report.csv
  ```

- [ ] Data processing completed
  ```bash
  ./process_data.sh
  # Check data/processed/ directory
  ```

- [ ] Processed data verified (check file count and sizes)
  ```bash
  find data/processed -name "*.tif" | wc -l
  du -sh data/processed
  ```

## Local Testing

- [ ] Backend runs locally without errors
  ```bash
  ./start_backend.sh
  # Visit http://localhost:8000/docs
  ```

- [ ] Frontend runs locally without errors
  ```bash
  ./start_frontend.sh
  # Visit http://localhost:3000
  ```

- [ ] API endpoints respond correctly
  ```bash
  curl http://localhost:8000/health
  curl http://localhost:8000/api/v1/ndvi/files
  ```

- [ ] Frontend connects to backend successfully
  - Open browser console, check for errors
  - Click on map, verify NDVI data loads
  - Test time slider functionality

## Frontend Configuration

- [ ] `frontend/env.example` reviewed and updated
- [ ] Production environment variables documented
- [ ] `vercel.json` or `netlify.toml` configured correctly
- [ ] Frontend builds successfully
  ```bash
  cd frontend
  npm install
  npm run build
  ```

- [ ] Build output verified (check `dist/` directory)

## Backend Configuration

- [ ] `backend/env.example` reviewed and updated
- [ ] Secret key generated for production
  ```bash
  python -c "import secrets; print(secrets.token_urlsafe(32))"
  ```

- [ ] `backend/Dockerfile` reviewed
- [ ] `docker-compose.yml` reviewed and CORS origins updated
- [ ] Backend Docker image builds successfully
  ```bash
  cd backend
  docker build -t tenggeli-backend:test .
  ```

## Security

- [ ] `DEBUG` will be set to `false` in production
- [ ] Strong `SECRET_KEY` generated (not using example key)
- [ ] `CORS_ORIGINS` configured with actual frontend domain
- [ ] No sensitive data in git repository
- [ ] `.gitignore` includes `.env` files
- [ ] Security guidelines reviewed (`backend/SECURITY.md`)

## Deployment Configuration

- [ ] Frontend deployment platform chosen (Vercel/Netlify)
- [ ] Backend deployment platform chosen (Railway/Render/Docker)
- [ ] GitHub repository ready (if using Git-based deployment)
- [ ] Domain names prepared (if using custom domains)

## Documentation

- [ ] `DEPLOYMENT.md` reviewed
- [ ] `frontend/README_DEPLOYMENT.md` reviewed
- [ ] `backend/README_DEPLOYMENT.md` reviewed
- [ ] Team members familiar with deployment process

## Production Test Plan

- [ ] Health check endpoint tested
  ```bash
  curl https://your-backend-url.com/health
  ```

- [ ] CORS configured correctly
  - Frontend can reach backend
  - No CORS errors in browser console

- [ ] API endpoints functional
  ```bash
  curl "https://your-backend-url.com/api/v1/ndvi/files"
  ```

- [ ] Frontend accessible
  - Page loads correctly
  - Map displays
  - Data loads when clicking
  - Time slider works

- [ ] Error handling works
  - Test invalid coordinates
  - Test missing data
  - Check error messages

## Monitoring Setup

- [ ] Uptime monitoring configured (UptimeRobot, etc.)
- [ ] Error tracking set up (optional - Sentry)
- [ ] Log aggregation configured (platform-specific)
- [ ] Alert notifications configured

## Backup Plan

- [ ] Processed data backed up
  ```bash
  tar -czf data-backup-$(date +%Y%m%d).tar.gz data/processed
  ```

- [ ] Configuration files documented
- [ ] Rollback procedure documented
- [ ] Database backup strategy defined (if using PostgreSQL)

## Post-Deployment

- [ ] Frontend URL documented
- [ ] Backend URL documented
- [ ] Admin access credentials secured
- [ ] Team notified of deployment
- [ ] Monitoring verified

## Quick Test

Run the automated test script:
```bash
./test_production_build.sh
```

This will verify:
- Build environments
- Dependencies
- Configuration files
- Build processes
- Docker functionality

## Ready to Deploy?

If all items are checked:

1. **Deploy Backend First:**
   - Follow `backend/README_DEPLOYMENT.md`
   - Note the backend URL

2. **Update Frontend Configuration:**
   - Set `VITE_API_BASE_URL` to backend URL

3. **Deploy Frontend:**
   - Follow `frontend/README_DEPLOYMENT.md`

4. **Verify Deployment:**
   - Test all functionality
   - Check monitoring
   - Document URLs

5. **Celebrate! 🎉**

## If Something Goes Wrong

1. Check logs (platform-specific)
2. Verify environment variables
3. Test locally with production settings
4. Review troubleshooting section in `DEPLOYMENT.md`
5. Rollback if necessary

## Support

- Deployment Guide: `DEPLOYMENT.md`
- Security Guide: `backend/SECURITY.md`
- Mount Instructions: `MOUNT_INSTRUCTIONS.md`

---

**Last Updated**: November 2025

