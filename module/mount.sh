#!/bin/sh

# OukaroManager Mount Script
# Mounts user apps to system/priv-app directories for privilege elevation

MODDIR=${0%/*}
LOG_FILE="$MODDIR/logs/mount.log"

# Source utility functions
. "$MODDIR/util.sh"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Usage function
usage() {
    echo "Usage: $0 <package_name> [target_location]"
    echo ""
    echo "Parameters:"
    echo "  package_name     - The package name to mount (e.g., com.example.app)"
    echo "  target_location  - Where to mount: 'system' or 'priv' (default: system)"
    echo ""
    echo "Examples:"
    echo "  $0 com.tencent.mm system    # Mount to /system/app"
    echo "  $0 com.taobao.taobao priv   # Mount to /system/priv-app"
    echo "  $0 com.example.app          # Mount to /system/app (default)"
}

# Check parameters
if [ $# -lt 1 ]; then
    echo "Error: Package name is required"
    usage
    exit 1
fi

PACKAGE_NAME="$1"
TARGET_TYPE="${2:-system}"  # Default to system if not specified

log "Mount request: $PACKAGE_NAME to $TARGET_TYPE"

# Validate target type
if [ "$TARGET_TYPE" != "system" ] && [ "$TARGET_TYPE" != "priv" ]; then
    echo "Error: Invalid target location '$TARGET_TYPE'. Must be 'system' or 'priv'"
    log "Error: Invalid target type: $TARGET_TYPE"
    exit 1
fi

# Validate package name exists
if ! validate_package "$PACKAGE_NAME"; then
    echo "Error: Package '$PACKAGE_NAME' not found"
    log "Error: Package not found: $PACKAGE_NAME"
    exit 1
fi

# Get package source path (must be in /data/app for user apps)
PACKAGE_PATH=$(get_package_path "$PACKAGE_NAME")
if [ -z "$PACKAGE_PATH" ]; then
    echo "Error: Package '$PACKAGE_NAME' is not a user app or not found in /data/app"
    log "Error: Package not in /data/app: $PACKAGE_NAME"
    exit 1
fi

log "Source path: $PACKAGE_PATH"

# Check if already mounted
CURRENT_STATE=$(get_mount_state "$PACKAGE_NAME")
if [ "$CURRENT_STATE" = "$TARGET_TYPE" ]; then
    echo "Package '$PACKAGE_NAME' is already mounted as $TARGET_TYPE app"
    log "Already mounted: $PACKAGE_NAME as $TARGET_TYPE"
    exit 0
elif [ "$CURRENT_STATE" != "user" ]; then
    echo "Warning: Package '$PACKAGE_NAME' is currently mounted as $CURRENT_STATE app"
    echo "Unmounting first..."
    log "Unmounting existing mount: $PACKAGE_NAME from $CURRENT_STATE"
    
    # Call unmount script first
    if [ -f "$MODDIR/unmount.sh" ]; then
        sh "$MODDIR/unmount.sh" "$PACKAGE_NAME"
        if [ $? -ne 0 ]; then
            echo "Error: Failed to unmount existing mount"
            log "Error: Failed to unmount existing mount for $PACKAGE_NAME"
            exit 1
        fi
    else
        echo "Error: unmount.sh not found"
        log "Error: unmount.sh not found"
        exit 1
    fi
fi

# Set target directory based on type
if [ "$TARGET_TYPE" = "priv" ]; then
    TARGET_DIR="/system/priv-app/$PACKAGE_NAME"
else
    TARGET_DIR="/system/app/$PACKAGE_NAME"
fi

log "Target directory: $TARGET_DIR"

# Create target directory
ensure_dir "$TARGET_DIR"

# Perform bind mount
log "Executing bind mount: $PACKAGE_PATH -> $TARGET_DIR"
if mount --bind "$PACKAGE_PATH" "$TARGET_DIR"; then
    echo "Successfully mounted '$PACKAGE_NAME' to $TARGET_DIR"
    log "Mount successful: $PACKAGE_NAME -> $TARGET_DIR"
    
    # Update apps.json if it exists
    if [ -f "$MODDIR/apps.json" ]; then
        log "Updating apps.json configuration..."
        
        # Read current JSON
        if read_json; then
            # Update package configuration
            update_package_permission_in_json "$PACKAGE_NAME" "superuser"
            update_package_target_path_in_json "$PACKAGE_NAME" "$TARGET_DIR"
            
            # Save changes
            if write_json; then
                log "Apps.json updated successfully"
            else
                log "Warning: Failed to update apps.json"
            fi
        else
            log "Warning: Failed to read apps.json for update"
        fi
    else
        log "Note: apps.json not found, skipping configuration update"
    fi
    
    exit 0
else
    echo "Error: Failed to mount '$PACKAGE_NAME'"
    log "Mount failed: $PACKAGE_NAME -> $TARGET_DIR"
    
    # Clean up target directory if empty
    if [ -d "$TARGET_DIR" ] && [ -z "$(ls -A "$TARGET_DIR" 2>/dev/null)" ]; then
        rmdir "$TARGET_DIR" 2>/dev/null
        log "Cleaned up empty target directory: $TARGET_DIR"
    fi
    
    exit 1
fi
