#!/bin/sh

# OukaroManager Generate Config Script
# Core script that generates apps.json with all app statuses and permissions

MODDIR=${0%/*}
LOG_FILE="$MODDIR/logs/generate-config.log"
APPS_JSON_PATH="$MODDIR/apps.json"

# Source utility functions
. "$MODDIR/util.sh"

# Ensure directories exist
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$MODDIR/configs"

# Generate the complete apps.json file
generate_apps_json() {
    log "Generating app status JSON at $APPS_JSON_PATH"
    
    # Start JSON array
    echo "[" > "$APPS_JSON_PATH"
    
    local first_entry=true
    local temp_file="/tmp/apps_list_$$"
    local processed_count=0
    
    # Get all packages with their paths using pm list packages -f
    log "Fetching package list with paths..."
    pm list packages -f > "$temp_file" 2>/dev/null
    
    if [ ! -s "$temp_file" ]; then
        log "Warning: No packages found or pm command failed"
        echo "]" >> "$APPS_JSON_PATH"
        rm -f "$temp_file"
        return 1
    fi
    
    log "Processing package list..."
    
    while IFS= read -r line; do
        # Skip empty lines
        [ -z "$line" ] && continue
        
        # Parse package path and name
        # Format: package:/path/to/apk.apk=pkg_name
        source_dir=$(echo "$line" | sed 's/package://' | sed 's/=.*//' | tr -d '\r\n')
        pkg_name=$(echo "$line" | sed 's/.*=//' | tr -d '\r\n')
        
        # Skip if we couldn't parse the package name or path
        if [ -z "$pkg_name" ] || [ -z "$source_dir" ]; then
            continue
        fi
        
        # Determine install type based on source directory path
        install_type="user"
        if echo "$source_dir" | grep -q "^/system/priv-app/"; then
            install_type="priv"
        elif echo "$source_dir" | grep -q "^/system/app/"; then
            install_type="system"
        fi
        
        # Check if the app is currently mounted by checking mount points
        is_mounted="false"
        target_path=""
        
        # Look for bind mounts that include this package name
        mount_info=$(mount | grep "bind" | grep "$pkg_name" 2>/dev/null | head -1)
        if [ -n "$mount_info" ]; then
            is_mounted="true"
            # Extract the full mount target path
            target_path=$(echo "$mount_info" | awk '{print $3}')
        fi
        
        # Read app-specific permission mode configuration
        permission_mode=$(read_config "$pkg_name" "permission_mode")
        if [ -z "$permission_mode" ]; then
            permission_mode="default"
        fi
        
        # Try to get app label (display name) using utility function
        app_label=$(get_package_label "$pkg_name")
        if [ -z "$app_label" ]; then
            app_label="$pkg_name"
        fi
        
        # Escape any quotes in strings for JSON safety
        safe_pkg_name=$(echo "$pkg_name" | sed 's/"/\\"/g')
        safe_app_label=$(echo "$app_label" | sed 's/"/\\"/g')
        safe_source_dir=$(echo "$source_dir" | sed 's/"/\\"/g')
        safe_target_path=$(echo "$target_path" | sed 's/"/\\"/g')
        
        # Build JSON entry according to the specified format
        json_entry="{\"package\":\"$safe_pkg_name\",\"label\":\"$safe_app_label\",\"sourceDir\":\"$safe_source_dir\",\"installType\":\"$install_type\",\"permissionMode\":\"$permission_mode\",\"targetPath\":\"$safe_target_path\"}"
        
        # Add comma separator if not the first entry
        if [ "$first_entry" = "false" ]; then
            echo "," >> "$APPS_JSON_PATH"
        fi
        
        # Write the JSON entry with proper indentation
        echo "  $json_entry" >> "$APPS_JSON_PATH"
        first_entry=false
        processed_count=$((processed_count + 1))
        
        # Log progress every 50 packages
        if [ $((processed_count % 50)) -eq 0 ]; then
            log "Processed $processed_count packages..."
        fi
        
    done < "$temp_file"
    
    # Clean up temp file
    rm -f "$temp_file"
    
    # End JSON array
    echo "]" >> "$APPS_JSON_PATH"
    
    log "App status JSON generation completed. Total packages processed: $processed_count"
}

# Main execution
log "Starting apps.json generation..."

# Generate the JSON file
generate_apps_json

# Set proper permissions
chmod 644 "$APPS_JSON_PATH"

log "Apps.json generation completed successfully."

exit 0
