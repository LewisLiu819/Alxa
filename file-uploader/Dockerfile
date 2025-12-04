# Simple file server with web UI for uploading files to Railway Volume
FROM filebrowser/filebrowser:latest

# Switch to root to create directories
USER root

# Create directories with proper permissions
RUN mkdir -p /config /data && chmod 777 /config /data

# Expose port
EXPOSE 8080

# Start filebrowser with Railway's PORT
CMD ["/bin/sh", "-c", "/filebrowser --database /config/filebrowser.db --root /data --address 0.0.0.0 --port ${PORT:-8080}"]

