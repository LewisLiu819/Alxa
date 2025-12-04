# Simple file server with web UI for uploading files to Railway Volume
FROM filebrowser/filebrowser:latest

# Set environment variables
ENV FB_DATABASE=/config/filebrowser.db
ENV FB_ROOT=/data
ENV FB_PORT=8080

# Create directories
RUN mkdir -p /config /data

# Expose port (Railway uses PORT env var)
EXPOSE 8080

# Start filebrowser with Railway's PORT
CMD filebrowser --database /config/filebrowser.db --root /data --address 0.0.0.0 --port ${PORT:-8080}

