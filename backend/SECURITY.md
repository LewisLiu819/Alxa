# Security Guidelines

## Overview

This document outlines security best practices and configurations for the Tenggeli Desert Monitoring API.

## Production Security Checklist

### 1. Environment Variables

- [ ] Set `DEBUG=false` in production
- [ ] Generate and set a strong `SECRET_KEY`
- [ ] Configure `CORS_ORIGINS` with specific domains (no wildcards)
- [ ] Use strong database credentials
- [ ] Never commit `.env` files to version control

### 2. CORS Configuration

**Current Configuration:**
```python
allow_origins=settings.cors_origins  # Set via CORS_ORIGINS env var
allow_credentials=True
allow_methods=["GET", "POST", "OPTIONS"]  # Restricted to needed methods
allow_headers=["*"]
max_age=600  # Cache preflight requests
```

**Best Practices:**
- Only allow specific trusted domains
- Use HTTPS URLs in production
- Don't use wildcard `*` for origins in production
- Regularly review and update allowed origins

**Example Production CORS:**
```bash
CORS_ORIGINS=https://your-app.com,https://www.your-app.com
```

### 3. HTTPS/TLS

**Required for Production:**
- Always use HTTPS in production
- Use platform-provided SSL (Vercel, Railway, Render)
- For custom servers, use Let's Encrypt

**Configuration:**
- Platform hosting (Railway/Render): Automatic HTTPS
- Custom domain: Configure DNS properly
- Local testing: Use `localhost` (HTTP acceptable for dev)

### 4. API Documentation

**Production Configuration:**
```python
docs_url="/docs" if settings.debug else None
redoc_url="/redoc" if settings.debug else None
openapi_url="/openapi.json" if settings.debug else None
```

- Automatically disabled in production (`DEBUG=false`)
- Prevents API schema exposure
- Enable only for internal/authenticated access if needed

### 5. Rate Limiting

**Recommended Implementation:**

Install slowapi:
```bash
pip install slowapi
```

Add to `main.py`:
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Apply to routes:
@limiter.limit("100/minute")
@app.get("/api/v1/ndvi/timeseries")
async def get_timeseries(...):
    ...
```

**Recommended Limits:**
- General API: 100 requests/minute
- Time series queries: 30 requests/minute
- Health checks: No limit

### 6. Database Security

**SQLite (Development/Small Scale):**
- Acceptable for MVP/low traffic
- Regular backups
- File permissions: `chmod 600 tenggeli_monitoring.db`

**PostgreSQL (Production Recommended):**
```bash
DATABASE_URL=postgresql://user:password@host:5432/tenggeli_monitoring?sslmode=require
```

- Use SSL connections
- Strong passwords (20+ characters)
- Separate database user with limited permissions
- Regular automated backups
- Connection pooling

### 7. Input Validation

**Current Implementation:**
- Pydantic models for request validation
- Type checking on all parameters
- Coordinate bounds validation

**Additional Recommendations:**
```python
from fastapi import HTTPException

def validate_coordinates(lat: float, lon: float):
    if not (37.5 <= lat <= 39.0):
        raise HTTPException(400, "Latitude out of bounds")
    if not (103.0 <= lon <= 105.2):
        raise HTTPException(400, "Longitude out of bounds")
```

### 8. Logging and Monitoring

**Current Logging:**
```python
LOG_LEVEL=INFO  # Set to WARNING or ERROR in production
```

**What to Log:**
- ✅ API access patterns
- ✅ Errors and exceptions
- ✅ Security events (authentication failures, etc.)
- ❌ Never log sensitive data (passwords, tokens)
- ❌ Never log full request bodies

**Monitoring Tools:**
- **Sentry**: Error tracking and monitoring
- **Prometheus**: Metrics collection
- **Grafana**: Metrics visualization
- **Platform built-in**: Railway/Render logs

### 9. Dependency Security

**Regular Updates:**
```bash
# Check for security vulnerabilities
pip install safety
safety check

# Update dependencies
pip install --upgrade -r requirements.txt
```

**Automated Scanning:**
- Enable Dependabot on GitHub
- Use Snyk for vulnerability scanning
- Review dependency updates regularly

### 10. Data Access Control

**File Permissions:**
```bash
# Processed data should be read-only
chmod -R 755 /app/data/processed
# Cache can be read-write
chmod -R 755 /app/data/cache
```

**Docker Volumes:**
```yaml
volumes:
  - ./data/processed:/app/data/processed:ro  # Read-only mount
```

## Security Headers

**Recommended Headers (Nginx/Reverse Proxy):**
```nginx
add_header X-Frame-Options "DENY";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
```

**FastAPI Middleware Implementation:**
```python
from fastapi import Response

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response
```

## Authentication (Future Enhancement)

For public data, authentication may not be required. However, for administrative features:

**Options:**
1. **API Keys:** Simple, suitable for machine-to-machine
2. **OAuth 2.0:** Best for user authentication
3. **JWT Tokens:** Stateless authentication

**Example API Key Implementation:**
```python
from fastapi import Security, HTTPException
from fastapi.security import APIKeyHeader

api_key_header = APIKeyHeader(name="X-API-Key")

def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key != settings.api_key:
        raise HTTPException(403, "Invalid API key")
    return api_key
```

## Incident Response

**If Security Breach Suspected:**

1. **Immediate Actions:**
   - Rotate all secrets and API keys
   - Review access logs
   - Identify compromised data
   - Block suspicious IPs

2. **Investigation:**
   - Check application logs
   - Review database access logs
   - Analyze network traffic
   - Identify attack vector

3. **Recovery:**
   - Patch vulnerabilities
   - Update dependencies
   - Reset user credentials
   - Restore from backup if needed

4. **Prevention:**
   - Document incident
   - Update security procedures
   - Implement additional monitoring
   - Train team on lessons learned

## Compliance Considerations

**Data Privacy:**
- NDVI data is generally public satellite imagery
- No personal user data collected (current implementation)
- If adding user accounts: Consider GDPR/privacy laws

**Data Retention:**
- Define retention policy for logs
- Automatic log rotation
- Secure deletion of old data

## Security Contacts

**Reporting Security Issues:**
- For security vulnerabilities, contact: [your-security-email]
- Use encrypted communication when possible
- Allow reasonable time for fixes before public disclosure

## Regular Security Reviews

**Monthly:**
- [ ] Review access logs
- [ ] Check for unusual traffic patterns
- [ ] Update dependencies

**Quarterly:**
- [ ] Full security audit
- [ ] Penetration testing (if budget allows)
- [ ] Review and update security policies

**Annually:**
- [ ] Comprehensive security assessment
- [ ] Third-party security audit
- [ ] Disaster recovery testing

## Resources

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **FastAPI Security**: https://fastapi.tiangolo.com/tutorial/security/
- **Python Security**: https://python.readthedocs.io/en/stable/library/security_warnings.html
- **Docker Security**: https://docs.docker.com/engine/security/

## Quick Security Wins

1. **Enable HTTPS:** Automatic on most platforms
2. **Set DEBUG=false:** One environment variable
3. **Restrict CORS:** Specific domains only
4. **Update dependencies:** Regular `pip install --upgrade`
5. **Add rate limiting:** Prevent abuse
6. **Monitor logs:** Catch issues early
7. **Backup data:** Regular automated backups
8. **Use strong secrets:** Generate with `secrets.token_urlsafe(32)`

## Security Testing

**Before Deployment:**
```bash
# Test with security headers
curl -I https://your-api.com/health

# Test CORS
curl -H "Origin: https://malicious-site.com" \
  -I https://your-api.com/api/v1/ndvi/files

# Test rate limiting (if implemented)
for i in {1..150}; do curl https://your-api.com/health; done
```

**Expected Results:**
- Security headers present
- CORS blocks unauthorized origins
- Rate limiting triggers after threshold

