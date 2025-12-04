# Simple file server with web UI for uploading files to Railway Volume
FROM filebrowser/filebrowser:latest

# Switch to root to create directories
USER root

# Create directories with proper permissions
RUN mkdir -p /config /data && chmod 777 /config /data

# Initialize filebrowser database with default admin user (password must be 12+ chars)
RUN filebrowser config init --database /config/filebrowser.db && \
    filebrowser users add admin adminpassword123 --database /config/filebrowser.db --perm.admin

# Expose port
EXPOSE 8080

# Override entrypoint and use shell to expand PORT variable
ENTRYPOINT []
CMD ["/bin/sh", "-c", "filebrowser --database /config/filebrowser.db --root /data --address 0.0.0.0 --port ${PORT:-8080}"]

