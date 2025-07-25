#!/system/bin/sh

# OukaroManager Post-FS-Data Script
# This script runs in post-fs-data mode (blocking)

MODDIR=${0%/*}
LOG_FILE="$MODDIR/logs/post-fs-data.log"

# Ensure log directory exists
mkdir -p "$MODDIR/logs"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "OukaroManager post-fs-data started"

# Check if module is properly installed
if [ ! -f "$MODDIR/module.prop" ]; then
    log "Error: module.prop not found"
    exit 1
fi

# Create necessary directories if they don't exist
mkdir -p "$MODDIR/system/app"
mkdir -p "$MODDIR/system/priv-app"
mkdir -p "$MODDIR/webroot/locales"
mkdir -p "$MODDIR/webroot/assets"
mkdir -p "$MODDIR/common"

# Setup aapt binary for app name extraction (inspired by KOWX712's approach)
if [ -f "$MODDIR/setup_aapt.sh" ]; then
    log "Setting up aapt binary..."
    sh "$MODDIR/setup_aapt.sh"
fi

# Set proper permissions for webroot
chmod -R 755 "$MODDIR/webroot"

# Restore previously converted apps from backup
if [ -f "$MODDIR/converted_apps.txt" ]; then
    log "Restoring converted apps from backup..."
    
    while IFS='|' read -r package_name mode app_name apk_path; do
        if [ -n "$package_name" ] && [ -n "$mode" ] && [ -n "$app_name" ] && [ -n "$apk_path" ]; then
            if [ -f "$apk_path" ]; then
                target_dir="$MODDIR/system/$mode/$app_name"
                mkdir -p "$target_dir"
                
                # Copy APK to system location
                cp "$apk_path" "$target_dir/"
                
                # Set proper permissions
                chmod 644 "$target_dir"/*.apk
                chown 0:0 "$target_dir"/*.apk
                
                log "Restored $package_name to /$mode/$app_name"
            else
                log "Warning: APK not found for $package_name at $apk_path"
            fi
        fi
    done < "$MODDIR/converted_apps.txt"
fi

log "OukaroManager post-fs-data completed"
