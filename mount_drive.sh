#!/bin/bash

# Mount Google Drive in WSL
# This script mounts the G: drive to /mnt/g for accessing Google Drive data

MOUNT_POINT="/mnt/g"
DRIVE_LETTER="G:"

echo "Checking Google Drive mount status..."

# Check if already mounted
if mountpoint -q "$MOUNT_POINT"; then
    echo "✓ G: drive is already mounted at $MOUNT_POINT"
    exit 0
fi

# Create mount point if it doesn't exist
if [ ! -d "$MOUNT_POINT" ]; then
    echo "Creating mount point at $MOUNT_POINT..."
    sudo mkdir -p "$MOUNT_POINT"
fi

# Mount the drive
echo "Mounting $DRIVE_LETTER to $MOUNT_POINT..."
sudo mount -t drvfs "$DRIVE_LETTER" "$MOUNT_POINT"

# Verify mount was successful
if mountpoint -q "$MOUNT_POINT"; then
    echo "✓ Successfully mounted $DRIVE_LETTER to $MOUNT_POINT"
    
    # Check if data directory exists
    DATA_PATH="$MOUNT_POINT/我的云端硬盘/tenggeli_data"
    if [ -d "$DATA_PATH" ]; then
        echo "✓ Found data directory: $DATA_PATH"
        # List first few files
        file_count=$(find "$DATA_PATH" -name "*.tif" 2>/dev/null | wc -l)
        echo "  Found $file_count TIFF files in data directory"
    else
        echo "⚠ Warning: Data directory not found at $DATA_PATH"
        echo "  Please verify your Google Drive sync status"
    fi
else
    echo "✗ Failed to mount $DRIVE_LETTER"
    exit 1
fi

