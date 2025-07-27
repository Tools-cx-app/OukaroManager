#!/bin/sh

# OukaroManager Action Script
# This script handles API calls from the WebUI frontend

MODDIR=${0%/*}
LOG_FILE="$MODDIR/logs/action.log"

# Source utility functions
. "$MODDIR/util.sh"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# --- Main Execution Logic ---

ACTION="$1"
PKG_NAME="$2"
EXTRA_ARG="$3"

log "Action called: $ACTION for package: $PKG_NAME with arg: $EXTRA_ARG"

case "$ACTION" in
    mount)
        if [ -z "$PKG_NAME" ] || [ -z "$EXTRA_ARG" ]; then
            echo "Error: Missing package name or target status"
            exit 1
        fi
        sh "$MODDIR/mount.sh" "$PKG_NAME" "$EXTRA_ARG"
        ;;
    unmount)
        if [ -z "$PKG_NAME" ]; then
            echo "Error: Missing package name"
            exit 1
        fi
        sh "$MODDIR/unmount.sh" "$PKG_NAME"
        ;;
    set_permission|set_mode)
        if [ -z "$PKG_NAME" ] || [ -z "$EXTRA_ARG" ]; then
            echo "Error: Missing package name or permission mode"
            exit 1
        fi
        sh "$MODDIR/set-permission.sh" "$PKG_NAME" "$EXTRA_ARG"
        ;;
    refresh)
        log "Refreshing app list..."
        sh "$MODDIR/generate-config.sh"
        echo "App list refreshed"
        ;;
    status)
        if [ -z "$PKG_NAME" ]; then
            echo "Error: Missing package name"
            exit 1
        fi
        # Return status information for a specific package
        if validate_package "$PKG_NAME"; then
            MOUNTED=$(is_app_mounted "$PKG_NAME" && echo "true" || echo "false")
            MODE=$(read_config "$PKG_NAME" "permission_mode")
            [ -z "$MODE" ] && MODE="default"
            echo "Package: $PKG_NAME, Mounted: $MOUNTED, Mode: $MODE"
        else
            echo "Package $PKG_NAME not found"
            exit 1
        fi
        ;;
    list)
        # List all configured packages
        if [ -d "$MODDIR/configs" ]; then
            ls "$MODDIR/configs" 2>/dev/null || echo "No configured packages"
        else
            echo "No configured packages"
        fi
        ;;
    *)
        log "Error: Invalid action '$ACTION'"
        echo "Usage: $0 {mount|unmount|set_permission|refresh|status|list} <package_name> [extra_arg]"
        echo ""
        echo "Actions:"
        echo "  mount <pkg> <system|priv>  - Mount package to system location"
        echo "  unmount <pkg>              - Unmount package from system"
        echo "  set_permission <pkg> <mode> - Set permission mode (default|root|umount|custom)"
        echo "  refresh                    - Refresh apps.json cache"
        echo "  status <pkg>               - Get package status"
        echo "  list                       - List all configured packages"
        exit 1
        ;;
esac

# After successful action, regenerate the JSON for the frontend (except for status and list)
if [ "$ACTION" != "status" ] && [ "$ACTION" != "list" ]; then
    log "Action '$ACTION' completed. Refreshing app status..."
    sh "$MODDIR/generate-config.sh" >/dev/null 2>&1
fi

exit 0