#!/bin/sh

# OukaroManager Unmount Script
# Unmounts specified app from /system/app or /system/priv-app, restoring it to user app

MODDIR=${0%/*}
LOG_FILE="$MODDIR/logs/unmount.log"

# Source utility functions
. "$MODDIR/util.sh"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Usage information
usage() {
    echo "Usage: $0 <package_name>"
    echo "  package_name: The package name to unmount (e.g., com.example.app)"
    exit 1
}

# Check arguments
if [ $# -ne 1 ]; then
    log "Error: Invalid number of arguments"
    usage
fi

PKG_NAME="$1"

# Validate arguments
if [ -z "$PKG_NAME" ]; then
    log "Error: Package name cannot be empty"
    exit 1
fi

log "Attempting to unmount $PKG_NAME"

# Validate that the package exists
if ! validate_package "$PKG_NAME"; then
    log "Error: Package $PKG_NAME not found on system"
    exit 1
fi

# Check if the app is actually mounted
if ! is_app_mounted "$PKG_NAME"; then
    log "Info: $PKG_NAME is not currently mounted by this module"
    # Still update apps.json to ensure correct status
    update_apps_json_after_unmount "$PKG_NAME"
    echo "$PKG_NAME is not currently mounted"
    exit 0
fi

# Get the mount point
MOUNT_POINT=$(get_mount_target "$PKG_NAME")
if [ -z "$MOUNT_POINT" ]; then
    log "Error: Could not determine mount point for $PKG_NAME"
    exit 1
fi

log "Unmounting $PKG_NAME from $MOUNT_POINT"

# Perform the unmount
umount "$MOUNT_POINT"
UNMOUNT_RESULT=$?

if [ $UNMOUNT_RESULT -eq 0 ]; then
    log "Successfully unmounted $PKG_NAME from $MOUNT_POINT"
    
    # Note: We don't remove the mount point directory as per user requirements
    # The directory structure remains intact, only the bind mount is removed
    log "Mount point directory $MOUNT_POINT preserved (not deleted)"
    
    # Remove configuration
    remove_config "$PKG_NAME"
    log "Configuration removed for $PKG_NAME"
    
    # Update apps.json to reflect the unmount
    update_apps_json_after_unmount "$PKG_NAME"
    log "Updated apps.json status for $PKG_NAME"
    
    echo "Successfully unmounted $PKG_NAME"
    exit 0
else
    log "Error: Failed to unmount $PKG_NAME (exit code: $UNMOUNT_RESULT)"
    echo "Failed to unmount $PKG_NAME"
    exit 1
fi

# Function to update apps.json after unmounting
update_apps_json_after_unmount() {
    local pkg_name="$1"
    local apps_json="$MODDIR/apps.json"
    
    if [ ! -f "$apps_json" ]; then
        log "Warning: apps.json not found, regenerating configuration"
        "$MODDIR/generate-config.sh"
        return
    fi
    
    # Create temporary file for JSON update
    local temp_file="$apps_json.tmp"
    
    # Use sed to update the specific package entry
    # This updates permissionMode to "user" and clears targetPath
    sed "
        /\"package\": \"$pkg_name\"/,/}/ {
            s/\"permissionMode\": \"[^\"]*\"/\"permissionMode\": \"user\"/
            s/\"targetPath\": \"[^\"]*\"/\"targetPath\": \"\"/
        }
    " "$apps_json" > "$temp_file"
    
    # Verify the temporary file is valid JSON (basic check)
    if grep -q "\"package\": \"$pkg_name\"" "$temp_file"; then
        mv "$temp_file" "$apps_json"
        log "Successfully updated apps.json for package $pkg_name"
    else
        log "Warning: JSON update failed, regenerating full configuration"
        rm -f "$temp_file"
        "$MODDIR/generate-config.sh"
    fi
}
