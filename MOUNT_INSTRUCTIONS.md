# Google Drive Mount Instructions for WSL

## One-Time Manual Mount Setup

Since the mount script requires sudo privileges, you'll need to run it manually once:

```bash
# Open a WSL terminal and run:
sudo mkdir -p /mnt/g
sudo mount -t drvfs G: /mnt/g
```

After entering your password, verify the mount:

```bash
ls -la "/mnt/g/我的云端硬盘/tenggeli_data"
```

You should see your NDVI TIFF files listed.

## Automatic Mount on WSL Startup (Optional)

To automatically mount the drive when WSL starts, you can configure `/etc/wsl.conf`:

1. Create or edit `/etc/wsl.conf`:
   ```bash
   sudo nano /etc/wsl.conf
   ```

2. Add the following content:
   ```ini
   [automount]
   enabled = true
   options = "metadata"
   mountFsTab = true
   
   [boot]
   systemd = false
   ```

3. Create `/etc/fstab` entry:
   ```bash
   sudo nano /etc/fstab
   ```

4. Add this line:
   ```
   G: /mnt/g drvfs defaults 0 0
   ```

5. Restart WSL:
   ```powershell
   # In Windows PowerShell:
   wsl --shutdown
   # Then start WSL again
   ```

## Alternative: Using Windows Path Directly

If mounting doesn't work, you can also access the files directly using the Windows path in WSL:

```bash
# The path translates to:
/mnt/g/我的云端硬盘/tenggeli_data
# Or if G: is not mounted:
# You may need to check where Google Drive is mounted in Windows
```

## Verifying Data Access

Once mounted, run:

```bash
cd /home/lewis/Alxa
./validate_data.sh
```

This will validate all TIFF files in the Google Drive directory.

## Troubleshooting

### Drive Letter Issues
- Verify G: is the correct drive letter in Windows
- Check in Windows File Explorer what drive letter Google Drive uses
- Update `mount_drive.sh` if using a different drive letter

### Permission Issues
- Ensure you have read access to the Google Drive files
- Make sure Google Drive Desktop is running and syncing

### Path with Chinese Characters
- WSL should handle UTF-8 paths correctly
- If you see issues, verify your WSL locale: `locale`
- Should show UTF-8 encoding (e.g., `en_US.UTF-8`)

