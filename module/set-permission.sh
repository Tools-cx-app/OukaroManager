#!/bin/sh

# OukaroManager Set Permission Script
# Sets KernelSU app profile permission mode for a specific app

MODDIR=${0%/*}
LOG_FILE="$MODDIR/logs/set-permission.log"

# Source utility functions
. "$MODDIR/util.sh"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Usage information
usage() {
    echo "Usage: $0 <package_name> <permission_mode>"
    echo "  package_name: The package name (e.g., com.example.app)"
    echo "  permission_mode: One of: default, superuser, umount, custom"
    echo ""
    echo "KernelSU App Profile Permission modes:"
    echo "  default   - Normal user app permissions (no root access)"
    echo "  superuser - Grant superuser privileges to the app"
    echo "  umount    - Force unmount if currently mounted"
    echo "  custom    - Custom permission configuration"
    exit 1
}

# Check arguments
if [ $# -ne 2 ]; then
    log "Error: Invalid number of arguments"
    usage
fi

PKG_NAME="$1"
PERMISSION_MODE="$2"

# Validate arguments
if [ -z "$PKG_NAME" ]; then
    log "Error: Package name cannot be empty"
    exit 1
fi

# Validate permission mode
case "$PERMISSION_MODE" in
    "default"|"superuser"|"umount"|"custom")
        ;;
    *)
        log "Error: Invalid permission mode '$PERMISSION_MODE'"
        usage
        ;;
esac

log "Setting permission mode for $PKG_NAME to $PERMISSION_MODE"

# Update apps.json with the new permission mode
update_permission_in_json "$PKG_NAME" "$PERMISSION_MODE"

if [ $? -eq 0 ]; then
    log "Successfully updated permission mode for $PKG_NAME to $PERMISSION_MODE"
    echo "Successfully updated permission mode for $PKG_NAME to $PERMISSION_MODE"
else
    log "Error: Failed to update permission mode for $PKG_NAME"
    echo "Error: Failed to update permission mode for $PKG_NAME"
    exit 1
fi

# Function to update permission mode in apps.json
update_permission_in_json() {
    local pkg_name="$1"
    local new_permission="$2"
    local apps_json="$MODDIR/apps.json"
    
    if [ ! -f "$apps_json" ]; then
        log "Warning: apps.json not found, regenerating configuration"
        "$MODDIR/generate-config.sh"
        if [ ! -f "$apps_json" ]; then
            log "Error: Could not create apps.json"
            return 1
        fi
    fi
    
    # Create temporary file for JSON update
    local temp_file="$apps_json.tmp"
    
    # Use sed to update the specific package's permissionMode
    sed "
        /\"package\": \"$pkg_name\"/,/}/ {
            s/\"permissionMode\": \"[^\"]*\"/\"permissionMode\": \"$new_permission\"/
        }
    " "$apps_json" > "$temp_file"
    
    # Verify the update was successful
    if grep -q "\"package\": \"$pkg_name\"" "$temp_file" && \
       grep -A 10 "\"package\": \"$pkg_name\"" "$temp_file" | grep -q "\"permissionMode\": \"$new_permission\""; then
        mv "$temp_file" "$apps_json"
        log "Successfully updated permissionMode for $pkg_name to $new_permission in apps.json"
        return 0
    else
        log "Warning: JSON update failed, regenerating full configuration"
        rm -f "$temp_file"
        "$MODDIR/generate-config.sh"
        return 1
    fi
}

exit 0
