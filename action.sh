#!/system/bin/sh

# OukaroManager Action Script
# This script provides actions for KernelSU Manager's action button

MODDIR=${0%/*}
WEBUI_DIR="$MODDIR/webroot"

case "$1" in
    "open_webui")
        # Check if KSU Manager supports WebUI
        if [ -f "/data/adb/ksu/bin/ksud" ]; then
            echo "Opening WebUI via KernelSU Manager..."
            am start -a android.intent.action.VIEW -d "http://localhost:6080" >/dev/null 2>&1
        else
            echo "Please open WebUI manually via KernelSU Manager"
        fi
        ;;
    "convert_to_system")
        # Convert selected apps to system apps
        if [ -f "$MODDIR/convert_queue.txt" ]; then
            "$MODDIR/scripts/convert_apps.sh"
        else
            echo "No apps selected for conversion"
        fi
        ;;
    "revert_apps")
        # Revert system apps back to user apps
        if [ -f "$MODDIR/converted_apps.txt" ]; then
            "$MODDIR/scripts/revert_apps.sh"
        else
            echo "No converted apps to revert"
        fi
        ;;
    "status")
        # Show module status
        echo "OukaroManager Status:"
        echo "WebUI: Available at http://localhost:6080"
        
        if [ -f "$MODDIR/converted_apps.txt" ]; then
            echo "Converted apps: $(wc -l < "$MODDIR/converted_apps.txt")"
        else
            echo "Converted apps: 0"
        fi
        ;;
    *)
        echo "OukaroManager v1.0.0"
        echo "Available actions:"
        echo "  open_webui     - Open WebUI interface"
        echo "  convert_to_system - Convert queued apps to system"
        echo "  revert_apps    - Revert converted apps"
        echo "  status         - Show module status"
        ;;
esac
