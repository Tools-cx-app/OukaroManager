#!/bin/sh

# OukaroManager Utility Functions
# Provides common functions used across the module

MODDIR=${0%/*}
LOG_FILE="$MODDIR/logs/util.log"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [UTIL] $1" >> "$LOG_FILE"
}

# Get the installation path of a package in /data/app
# Usage: get_package_path <package_name>
# Returns: /data/app path or empty string if not found
get_package_path() {
    local pkg_name="$1"
    if [ -z "$pkg_name" ]; then
        echo ""
        return 1
    fi
    
    # Get the full path and extract only /data/app paths
    local full_path=$(pm list packages -f "$pkg_name" 2>/dev/null | head -1 | sed -e 's/package://' -e 's/=.*//' | tr -d '\r')
    
    # Only return if it's in /data/app (user app)
    if echo "$full_path" | grep -q "^/data/app/"; then
        echo "$full_path"
        return 0
    else
        echo ""
        return 1
    fi
}

# Get the current mount state of a package
# Usage: get_mount_state <package_name>
# Returns: user, system, priv, or unknown
get_mount_state() {
    local pkg_name="$1"
    if [ -z "$pkg_name" ]; then
        echo "unknown"
        return 1
    fi
    
    # Check if mounted in system locations
    if mount | grep -q "/system/priv-app/.*$pkg_name.*bind"; then
        echo "priv"
    elif mount | grep -q "/system/app/.*$pkg_name.*bind"; then
        echo "system"
    else
        # Check original installation location
        local app_path=$(pm list packages -f "$pkg_name" 2>/dev/null | head -1 | sed -e 's/package://' -e 's/=.*//' | tr -d '\r')
        if echo "$app_path" | grep -q "^/system/priv-app/"; then
            echo "priv"
        elif echo "$app_path" | grep -q "^/system/app/"; then
            echo "system"
        elif echo "$app_path" | grep -q "^/data/app/"; then
            echo "user"
        else
            echo "unknown"
        fi
    fi
}

# Read apps.json into a variable
# Usage: read_json
# Sets: APPS_JSON_CONTENT variable with the content
read_json() {
    local json_file="$MODDIR/apps.json"
    
    if [ -f "$json_file" ]; then
        APPS_JSON_CONTENT=$(cat "$json_file")
        log "Successfully read apps.json ($(echo "$APPS_JSON_CONTENT" | wc -c) bytes)"
        return 0
    else
        APPS_JSON_CONTENT=""
        log "Warning: apps.json not found"
        return 1
    fi
}

# Write apps.json from variable
# Usage: write_json
# Reads: APPS_JSON_CONTENT variable
write_json() {
    local json_file="$MODDIR/apps.json"
    local backup_file="$json_file.backup.$(date +%s)"
    
    if [ -z "$APPS_JSON_CONTENT" ]; then
        log "Error: APPS_JSON_CONTENT variable is empty"
        return 1
    fi
    
    # Create backup if original exists
    if [ -f "$json_file" ]; then
        cp "$json_file" "$backup_file"
        log "Created backup: $backup_file"
    fi
    
    # Write new content
    echo "$APPS_JSON_CONTENT" > "$json_file"
    
    # Verify the write was successful
    if [ -f "$json_file" ] && [ -s "$json_file" ]; then
        log "Successfully wrote apps.json ($(wc -c < "$json_file") bytes)"
        # Clean up old backups (keep only last 5)
        ls -t "$MODDIR"/apps.json.backup.* 2>/dev/null | tail -n +6 | xargs rm -f
        return 0
    else
        log "Error: Failed to write apps.json"
        # Restore from backup if available
        if [ -f "$backup_file" ]; then
            mv "$backup_file" "$json_file"
            log "Restored from backup due to write failure"
        fi
        return 1
    fi
}

# Determine app status based on its installation path
# Usage: get_app_status <app_path>
# Returns: user, system, or priv
get_app_status() {
    local app_path="$1"
    
    if echo "$app_path" | grep -q "^/system/priv-app/"; then
        echo "priv"
    elif echo "$app_path" | grep -q "^/system/app/"; then
        echo "system"
    else
        echo "user"
    fi
}

# Check if an app is currently mounted by our module
# Usage: is_app_mounted <package_name>
# Returns: 0 if mounted, 1 if not mounted
is_app_mounted() {
    local pkg_name="$1"
    mount | grep -q "/system/.*/.*$pkg_name.*bind"
}

# Get the mount target path for a package
# Usage: get_mount_target <package_name>
get_mount_target() {
    local pkg_name="$1"
    mount | grep "/system/.*/.*$pkg_name.*bind" | awk '{print $2}' | head -1
}

# Read configuration for a package
# Usage: read_config <package_name> <config_key>
read_config() {
    local pkg_name="$1"
    local config_key="$2"
    local config_file="$MODDIR/configs/$pkg_name"
    
    if [ -f "$config_file" ]; then
        grep "^$config_key=" "$config_file" 2>/dev/null | cut -d'=' -f2
    else
        echo ""
    fi
}

# Write configuration for a package
# Usage: write_config <package_name> <config_key> <config_value>
write_config() {
    local pkg_name="$1"
    local config_key="$2"
    local config_value="$3"
    local config_file="$MODDIR/configs/$pkg_name"
    
    mkdir -p "$MODDIR/configs"
    
    # Remove existing key if present
    if [ -f "$config_file" ]; then
        grep -v "^$config_key=" "$config_file" > "$config_file.tmp" 2>/dev/null
        mv "$config_file.tmp" "$config_file"
    fi
    
    # Add new key-value pair
    echo "$config_key=$config_value" >> "$config_file"
}

# Remove configuration file for a package
# Usage: remove_config <package_name>
remove_config() {
    local pkg_name="$1"
    local config_file="$MODDIR/configs/$pkg_name"
    
    if [ -f "$config_file" ]; then
        rm "$config_file"
        log "Removed config for $pkg_name"
    fi
}

# Validate package name exists
# Usage: validate_package <package_name>
# Returns: 0 if valid, 1 if invalid
validate_package() {
    local pkg_name="$1"
    pm list packages | grep -q ":$pkg_name$"
}

# Create directory with proper permissions
# Usage: ensure_dir <directory_path>
ensure_dir() {
    local dir_path="$1"
    if [ ! -d "$dir_path" ]; then
        mkdir -p "$dir_path"
        chmod 755 "$dir_path"
    fi
}

# Get package label (display name)
# Usage: get_package_label <package_name>
get_package_label() {
    local pkg_name="$1"
    # Try to get the label from dumpsys
    dumpsys package "$pkg_name" 2>/dev/null | grep -o 'applicationInfo=.*' | sed 's/.*labelRes=0x[0-9a-f]* nonLocalizedLabel=\([^}]*\).*/\1/' | head -1
}

# Check if system is ready for operations
# Usage: wait_for_boot_complete
wait_for_boot_complete() {
    local timeout=60
    local count=0
    
    while [ "$(getprop sys.boot_completed)" != "1" ] && [ $count -lt $timeout ]; do
        sleep 1
        count=$((count + 1))
    done
    
    if [ $count -eq $timeout ]; then
        log "Warning: Boot completion timeout reached"
        return 1
    fi
    
    return 0
}

# Export functions for sourcing
# Note: In shell scripts, functions are available after sourcing this file

# Helper function to update package permission in JSON content
# Usage: update_package_permission_in_json <package_name> <new_permission>
# Modifies: APPS_JSON_CONTENT variable
update_package_permission_in_json() {
    local pkg_name="$1"
    local new_permission="$2"
    
    if [ -z "$APPS_JSON_CONTENT" ]; then
        log "Error: APPS_JSON_CONTENT not loaded, call read_json first"
        return 1
    fi
    
    # Create temporary file for sed operation
    local temp_file="/tmp/json_update_$$.tmp"
    echo "$APPS_JSON_CONTENT" > "$temp_file"
    
    # Update the specific package's permissionMode
    sed -i "
        /\"package\": \"$pkg_name\"/,/}/ {
            s/\"permissionMode\": \"[^\"]*\"/\"permissionMode\": \"$new_permission\"/
        }
    " "$temp_file"
    
    # Read back the modified content
    APPS_JSON_CONTENT=$(cat "$temp_file")
    rm -f "$temp_file"
    
    log "Updated permissionMode for $pkg_name to $new_permission in JSON content"
    return 0
}

# Helper function to update package target path in JSON content
# Usage: update_package_target_path_in_json <package_name> <new_target_path>
# Modifies: APPS_JSON_CONTENT variable
update_package_target_path_in_json() {
    local pkg_name="$1"
    local new_target_path="$2"
    
    if [ -z "$APPS_JSON_CONTENT" ]; then
        log "Error: APPS_JSON_CONTENT not loaded, call read_json first"
        return 1
    fi
    
    # Create temporary file for sed operation
    local temp_file="/tmp/json_update_$$.tmp"
    echo "$APPS_JSON_CONTENT" > "$temp_file"
    
    # Update the specific package's targetPath
    sed -i "
        /\"package\": \"$pkg_name\"/,/}/ {
            s|\"targetPath\": \"[^\"]*\"|\"targetPath\": \"$new_target_path\"|
        }
    " "$temp_file"
    
    # Read back the modified content
    APPS_JSON_CONTENT=$(cat "$temp_file")
    rm -f "$temp_file"
    
    log "Updated targetPath for $pkg_name to $new_target_path in JSON content"
    return 0
}

# Helper function to get package info from JSON content
# Usage: get_package_info_from_json <package_name> <field_name>
# Returns: field value or empty string if not found
get_package_info_from_json() {
    local pkg_name="$1"
    local field_name="$2"
    
    if [ -z "$APPS_JSON_CONTENT" ]; then
        log "Error: APPS_JSON_CONTENT not loaded, call read_json first"
        return 1
    fi
    
    # Extract the specific field value for the package
    echo "$APPS_JSON_CONTENT" | sed -n "
        /\"package\": \"$pkg_name\"/,/}/ {
            /\"$field_name\": \"/ {
                s/.*\"$field_name\": \"\([^\"]*\)\".*/\1/p
            }
        }
    "
}

# Initialize JSON content variable
APPS_JSON_CONTENT=""
