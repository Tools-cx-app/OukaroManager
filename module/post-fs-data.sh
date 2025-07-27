#!/bin/sh

# OukaroManager Post-FS-Data Script
# Automatically mounts apps defined in apps.json during boot

MODDIR=${0%/*}
LOG_FILE="$MODDIR/logs/post-fs-data.log"
APPS_JSON_PATH="$MODDIR/apps.json"

# Source utility functions
. "$MODDIR/util.sh"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

log "OukaroManager post-fs-data starting..."

# Check if apps.json exists and is not empty
if [ ! -f "$APPS_JSON_PATH" ]; then
    log "Warning: apps.json not found. Skipping auto-mount."
    # Start background service for future configuration generation
    if [ -f "$MODDIR/service.sh" ]; then
        chmod +x "$MODDIR/service.sh"
        "$MODDIR/service.sh" start
        log "Background service started for configuration generation."
    fi
    exit 0
fi

# Check if apps.json is empty or just contains empty array
if [ ! -s "$APPS_JSON_PATH" ] || [ "$(cat "$APPS_JSON_PATH" | tr -d '[:space:]')" = "[]" ]; then
    log "Warning: apps.json is empty. Skipping auto-mount."
    # Start background service
    if [ -f "$MODDIR/service.sh" ]; then
        chmod +x "$MODDIR/service.sh"
        "$MODDIR/service.sh" start
        log "Background service started."
    fi
    exit 0
fi

# Function to auto-mount apps that should be mounted
auto_mount_apps() {
    log "Auto-mounting apps with installType system/priv..."
    
    # Use util.sh functions to read and parse JSON
    if ! read_json; then
        log "Error: Failed to read apps.json"
        return 1
    fi
    
    # Extract packages that need mounting (installType = system or priv)
    local temp_file="/tmp/mount_list_$$"
    echo "$APPS_JSON_CONTENT" | grep -A 10 -B 2 '"installType": "system"' > "$temp_file.system"
    echo "$APPS_JSON_CONTENT" | grep -A 10 -B 2 '"installType": "priv"' > "$temp_file.priv"
    
    # Process system apps
    if [ -s "$temp_file.system" ]; then
        log "Found system apps to mount..."
        cat "$temp_file.system" | grep '"package":' | sed 's/.*"package": "\([^"]*\)".*/\1/' | while read -r pkg_name; do
            if [ -n "$pkg_name" ]; then
                log "Mounting $pkg_name as system app..."
                if [ -f "$MODDIR/mount.sh" ]; then
                    chmod +x "$MODDIR/mount.sh"
                    sh "$MODDIR/mount.sh" "$pkg_name" "system"
                    if [ $? -eq 0 ]; then
                        log "Successfully mounted $pkg_name to /system/app"
                    else
                        log "Warning: Failed to mount $pkg_name as system app"
                    fi
                else
                    log "Error: mount.sh not found"
                fi
            fi
        done
    fi
    
    # Process priv apps
    if [ -s "$temp_file.priv" ]; then
        log "Found priv apps to mount..."
        cat "$temp_file.priv" | grep '"package":' | sed 's/.*"package": "\([^"]*\)".*/\1/' | while read -r pkg_name; do
            if [ -n "$pkg_name" ]; then
                log "Mounting $pkg_name as priv app..."
                if [ -f "$MODDIR/mount.sh" ]; then
                    chmod +x "$MODDIR/mount.sh"
                    sh "$MODDIR/mount.sh" "$pkg_name" "priv"
                    if [ $? -eq 0 ]; then
                        log "Successfully mounted $pkg_name to /system/priv-app"
                    else
                        log "Warning: Failed to mount $pkg_name as priv app"
                    fi
                else
                    log "Error: mount.sh not found"
                fi
            fi
        done
    fi
    
    # Clean up temp files
    rm -f "$temp_file"*
    
    log "Auto-mounting completed."
}

# Create necessary directories with proper permissions
ensure_dir "/system/app"
ensure_dir "/system/priv-app"

# Perform auto-mounting
auto_mount_apps

# Start background service for continuous monitoring
if [ -f "$MODDIR/service.sh" ]; then
    chmod +x "$MODDIR/service.sh"
    "$MODDIR/service.sh" start
    log "Background service started for continuous monitoring."
fi

log "OukaroManager post-fs-data completed successfully."

exit 0
