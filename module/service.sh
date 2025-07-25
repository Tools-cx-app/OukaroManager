#!/system/bin/sh

# OukaroManager Service Script
# This script runs in late_start service mode
# References and optimizations inspired by KOWX712/Tricky-Addon-Update-Target-List
# Original author: KOWX712 (https://github.com/KOWX712/Tricky-Addon-Update-Target-List)

MODDIR=${0%/*}
WEBUI_DIR="$MODDIR/webroot"
LOG_FILE="$MODDIR/logs/service.log"
OUTPUT_APP="$MODDIR/webroot/applist.json"
OUTPUT_SYSTEM="$MODDIR/webroot/systemlist.json"

# Ensure directories exist
mkdir -p "$MODDIR/logs"
mkdir -p "$MODDIR/webroot"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "OukaroManager service starting..."

# Wait for system boot completion (inspired by KOWX712's implementation)
until [ "$(getprop sys.boot_completed)" = "1" ]; do
    sleep 1
done

log "System boot completed, generating app lists..."

# Generate cached app lists for WebUI (inspired by KOWX712's applist.json optimization)
generate_app_lists() {
    log "Generating user app list cache..."
    
    # Initialize JSON files
    echo "[" > "$OUTPUT_APP"
    echo "[" > "$OUTPUT_SYSTEM"
    
    # Get user installed apps (third-party packages)
    pm list packages -3 2>/dev/null | awk -F: '{print $2}' | while read -r PACKAGE; do
        # Get APK path for the package
        APK_PATH=$(pm path "$PACKAGE" 2>/dev/null | head -n1 | awk -F: '{print $2}')
        
        if [ -n "$APK_PATH" ] && [ -f "$APK_PATH" ]; then
            # Get app name using aapt (fallback to package name)
            APP_NAME=$(aapt dump badging "$APK_PATH" 2>/dev/null | grep "application-label:" | sed "s/application-label://g; s/'//g")
            [ -z "$APP_NAME" ] && APP_NAME="$PACKAGE"
            
            # Get version info
            VERSION_NAME=$(aapt dump badging "$APK_PATH" 2>/dev/null | grep "versionName" | sed "s/.*versionName='\([^']*\)'.*/\1/")
            VERSION_CODE=$(aapt dump badging "$APK_PATH" 2>/dev/null | grep "versionCode" | sed "s/.*versionCode='\([^']*\)'.*/\1/")
            
            # Get app size
            APP_SIZE=$(stat -c%s "$APK_PATH" 2>/dev/null || echo "0")
            APP_SIZE_MB=$(echo "scale=2; $APP_SIZE / 1048576" | bc 2>/dev/null || echo "0")
            
            # Write to JSON
            echo "  {" >> "$OUTPUT_APP"
            echo "    \"app_name\": \"$APP_NAME\"," >> "$OUTPUT_APP"
            echo "    \"package_name\": \"$PACKAGE\"," >> "$OUTPUT_APP"
            echo "    \"version_name\": \"${VERSION_NAME:-Unknown}\"," >> "$OUTPUT_APP"
            echo "    \"version_code\": \"${VERSION_CODE:-0}\"," >> "$OUTPUT_APP"
            echo "    \"apk_path\": \"$APK_PATH\"," >> "$OUTPUT_APP"
            echo "    \"size_mb\": \"${APP_SIZE_MB:-0}\"," >> "$OUTPUT_APP"
            echo "    \"type\": \"user\"" >> "$OUTPUT_APP"
            echo "  }," >> "$OUTPUT_APP"
        fi
    done
    
    log "Generating system app list cache..."
    
    # Get system apps (important ones only)
    IMPORTANT_SYSTEM_APPS="com.android.chrome|com.google.android.gms|com.google.android.gsf|com.android.vending|com.google.android.webview"
    
    pm list packages -s 2>/dev/null | grep -E "$IMPORTANT_SYSTEM_APPS" | awk -F: '{print $2}' | while read -r PACKAGE; do
        APK_PATH=$(pm path "$PACKAGE" 2>/dev/null | head -n1 | awk -F: '{print $2}')
        
        if [ -n "$APK_PATH" ] && [ -f "$APK_PATH" ]; then
            APP_NAME=$(aapt dump badging "$APK_PATH" 2>/dev/null | grep "application-label:" | sed "s/application-label://g; s/'//g")
            [ -z "$APP_NAME" ] && APP_NAME="$PACKAGE"
            
            VERSION_NAME=$(aapt dump badging "$APK_PATH" 2>/dev/null | grep "versionName" | sed "s/.*versionName='\([^']*\)'.*/\1/")
            
            echo "  {" >> "$OUTPUT_SYSTEM"
            echo "    \"app_name\": \"$APP_NAME\"," >> "$OUTPUT_SYSTEM"
            echo "    \"package_name\": \"$PACKAGE\"," >> "$OUTPUT_SYSTEM"
            echo "    \"version_name\": \"${VERSION_NAME:-Unknown}\"," >> "$OUTPUT_SYSTEM"
            echo "    \"apk_path\": \"$APK_PATH\"," >> "$OUTPUT_SYSTEM"
            echo "    \"type\": \"system\"" >> "$OUTPUT_SYSTEM"
            echo "  }," >> "$OUTPUT_SYSTEM"
        fi
    done
    
    # Remove trailing commas and close JSON arrays
    sed -i '$ s/,$//' "$OUTPUT_APP" 2>/dev/null || true
    sed -i '$ s/,$//' "$OUTPUT_SYSTEM" 2>/dev/null || true
    echo "]" >> "$OUTPUT_APP"
    echo "]" >> "$OUTPUT_SYSTEM"
    
    log "App list cache generation completed"
}

# Copy aapt binary if it doesn't exist (for app name extraction)
AAPT_PATH="$MODDIR/common/aapt"
if [ ! -f "$AAPT_PATH" ]; then
    log "Warning: aapt binary not found, running setup..."
    sh "$MODDIR/setup_aapt.sh" 2>/dev/null || log "Failed to setup aapt"
fi

# Function to safely call aapt
aapt() {
    if [ -f "$AAPT_PATH" ] && [ -x "$AAPT_PATH" ]; then
        "$AAPT_PATH" "$@"
    else
        # Fallback: return empty for unknown fields
        case "$2" in
            "badging") echo "package: name='unknown'" ;;
            *) echo "" ;;
        esac
    fi
}

# Generate app lists cache
generate_app_lists &

# Set proper permissions for webroot
chmod -R 755 "$WEBUI_DIR"

# Create API endpoint files for WebUI communication
mkdir -p "$MODDIR/api"
touch "$MODDIR/api/status"
echo "active" > "$MODDIR/api/ksu_status"

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
                    chown 0:0 "$MODDIR/system/app/$app_name"/*.apk
                fi
                log "Applied system app: $package_name -> /system/app/$app_name"
            elif [ "$mode" = "priv-app" ]; then
                mkdir -p "$MODDIR/system/priv-app/$app_name"
                if [ -f "$apk_path" ]; then
                    cp "$apk_path" "$MODDIR/system/priv-app/$app_name/"
                    chmod 644 "$MODDIR/system/priv-app/$app_name"/*.apk
                    chown 0:0 "$MODDIR/system/priv-app/$app_name"/*.apk
                fi
                log "Applied priv-app: $package_name -> /system/priv-app/$app_name"
            fi
        fi
    done < "$MODDIR/converted_apps.txt"
fi

log "OukaroManager service initialized successfully"
