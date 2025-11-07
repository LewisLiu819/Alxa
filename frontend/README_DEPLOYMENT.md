# Frontend Deployment Guide

## Overview

The Tenggeli Desert Monitoring frontend is a React + TypeScript + Vite application that can be deployed to static hosting platforms like Vercel or Netlify.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Backend API deployed and accessible

## Environment Configuration

### Development

For local development, the application uses Vite's proxy to connect to the backend:

```bash
# No environment file needed for development
npm run dev
```

The dev server runs on `http://localhost:3000` and proxies API requests to `http://localhost:8000`.

### Production

For production deployment, you need to configure the backend API URL:

1. **Copy the example environment file:**
   ```bash
   cp env.example .env.production
   ```

2. **Edit `.env.production`:**
   ```bash
   VITE_API_BASE_URL=https://your-backend-url.com
   VITE_APP_ENV=production
   ```

## Deployment Options

### Option 1: Vercel Deployment

Vercel is the recommended platform for Vite applications.

#### Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   cd frontend
   vercel
   ```

4. **Configure Environment Variables in Vercel Dashboard:**
   - Go to your project settings
   - Add environment variable: `VITE_API_BASE_URL` with your backend URL
   - Redeploy

#### Deploy via GitHub Integration

1. Push your code to GitHub
2. Import project in Vercel dashboard
3. Configure environment variables:
   - `VITE_API_BASE_URL`: Your backend URL
4. Deploy automatically on every push

**Vercel Configuration:** The `vercel.json` file is already configured with:
- Build command and output directory
- SPA routing redirects
- Static asset caching headers

### Option 2: Netlify Deployment

#### Deploy via Netlify CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Initialize and deploy:**
   ```bash
   cd frontend
   netlify init
   netlify deploy --prod
   ```

#### Deploy via GitHub Integration

1. Push your code to GitHub
2. New site from Git in Netlify dashboard
3. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Environment variables: `VITE_API_BASE_URL`

**Netlify Configuration:** The `netlify.toml` file includes:
- Build settings
- SPA routing redirects
- Security headers
- Asset caching

### Option 3: Static File Hosting

If you prefer traditional static hosting (AWS S3, Azure Static Web Apps, etc.):

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Upload the `dist/` directory** to your hosting provider

3. **Configure:**
   - Enable SPA routing (all routes → index.html)
   - Set appropriate cache headers for `/assets/*`
   - Configure HTTPS

## Build Process

### Local Build

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview production build locally
npm run preview
```

The build output will be in the `dist/` directory.

### Build Optimization

The production build includes:
- **Code splitting:** Automatic chunking for optimal loading
- **Asset optimization:** Minified CSS and JS
- **Tree shaking:** Unused code removal
- **Cache busting:** Hashed filenames for cache invalidation

## Environment Variables

All environment variables must be prefixed with `VITE_` to be exposed to the client.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | Yes | - | Backend API base URL (e.g., `https://api.example.com`) |
| `VITE_APP_ENV` | No | `production` | Application environment |
| `VITE_MAP_DEFAULT_LAT` | No | `38.25` | Default map latitude |
| `VITE_MAP_DEFAULT_LON` | No | `104.1` | Default map longitude |
| `VITE_MAP_DEFAULT_ZOOM` | No | `9` | Default map zoom level |
| `VITE_DATA_START_YEAR` | No | `2015` | Data time range start |
| `VITE_DATA_END_YEAR` | No | `2024` | Data time range end |

## Post-Deployment

### 1. Verify Deployment

After deployment, verify:

```bash
# Check if site is accessible
curl -I https://your-frontend-url.com

# Test API connectivity from browser console:
# Open browser dev tools and run:
fetch('https://your-frontend-url.com/api/v1/health')
  .then(r => r.json())
  .then(console.log)
```

### 2. Update Backend CORS

Make sure your backend allows requests from your frontend domain:

```python
# backend/app/config/settings.py
cors_origins: List[str] = [
    "https://your-frontend-url.com",
    "http://localhost:3000",  # Keep for local development
]
```

### 3. Configure Custom Domain (Optional)

#### Vercel
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

#### Netlify
1. Go to Site Settings → Domain Management
2. Add custom domain
3. Configure DNS

## Monitoring and Maintenance

### Performance Monitoring

Consider integrating:
- **Vercel Analytics** (if using Vercel)
- **Google Analytics** for user tracking
- **Sentry** for error tracking

### Updates

To deploy updates:

```bash
# Make your changes
git add .
git commit -m "Your update message"
git push

# If using CLI deployment:
vercel --prod
# or
netlify deploy --prod
```

## Troubleshooting

### Build Fails

**Issue:** Build fails with TypeScript errors
```bash
# Check types locally
npm run type-check

# Fix errors and rebuild
npm run build
```

**Issue:** Out of memory during build
```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### API Connection Issues

**Issue:** Cannot connect to backend API

1. Check `VITE_API_BASE_URL` is set correctly
2. Verify backend CORS settings include your frontend domain
3. Check browser console for CORS errors
4. Test backend health endpoint directly

**Issue:** 404 errors on page refresh

- Ensure SPA routing is configured (redirects in place)
- Check `vercel.json` or `netlify.toml` redirects

### Deployment Platform Issues

**Vercel:**
- Check deployment logs in dashboard
- Verify environment variables are set
- Check build output directory is `dist`

**Netlify:**
- Review deploy logs
- Ensure `netlify.toml` is in repository root
- Check build command matches `package.json`

## Security Considerations

1. **API Keys:** Never commit API keys to repository
2. **Environment Variables:** Set sensitive data in platform dashboard, not in code
3. **HTTPS:** Always use HTTPS for production
4. **CORS:** Restrict backend CORS to your specific domains
5. **Headers:** Security headers are configured in `netlify.toml` and `vercel.json`

## Performance Tips

1. **CDN:** Both Vercel and Netlify provide global CDN automatically
2. **Caching:** Static assets are cached with immutable headers
3. **Compression:** Gzip/Brotli enabled by default on both platforms
4. **Lazy Loading:** Consider code-splitting for large components

## Support

For deployment issues:
- **Vercel:** https://vercel.com/docs
- **Netlify:** https://docs.netlify.com
- **Vite:** https://vitejs.dev/guide/

