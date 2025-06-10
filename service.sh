#!/system/bin/sh

# OukaroManager Service Script
# This script runs in late_start service mode

MODDIR=${0%/*}
WEBUI_DIR="$MODDIR/webroot"
LOG_FILE="$MODDIR/logs/service.log"

# Ensure log directory exists
mkdir -p "$MODDIR/logs"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "OukaroManager service starting..."

# Check if converted apps list exists and apply conversions
if [ -f "$MODDIR/converted_apps.txt" ]; then
    log "Applying previously converted apps..."
    while IFS='|' read -r package_name mode app_name apk_path; do
        if [ -n "$package_name" ] && [ -n "$mode" ] && [ -n "$app_name" ]; then
            # Create directory and copy APK for converted app
            if [ "$mode" = "system" ]; then
                mkdir -p "$MODDIR/system/app/$app_name"
                if [ -f "$apk_path" ]; then
                    cp "$apk_path" "$MODDIR/system/app/$app_name/"
                    chmod 644 "$MODDIR/system/app/$app_name"/*.apk
                fi
                log "Applied system app: $package_name -> /system/app/$app_name"
            elif [ "$mode" = "priv-app" ]; then
                mkdir -p "$MODDIR/system/priv-app/$app_name"
                if [ -f "$apk_path" ]; then
                    cp "$apk_path" "$MODDIR/system/priv-app/$app_name/"
                    chmod 644 "$MODDIR/system/priv-app/$app_name"/*.apk
                fi
                log "Applied priv-app: $package_name -> /system/priv-app/$app_name"
            fi
        fi
    done < "$MODDIR/converted_apps.txt"
fi

# Set proper permissions for webroot
chmod -R 755 "$WEBUI_DIR"

# Create API endpoint files for WebUI communication
mkdir -p "$MODDIR/api"
touch "$MODDIR/api/status"
echo "active" > "$MODDIR/api/ksu_status"

log "OukaroManager service initialized successfully"
