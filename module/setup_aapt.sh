#!/system/bin/sh

# Script to obtain aapt binary for app name extraction
# Part of OukaroManager optimization (inspired by KOWX712's approach)

MODDIR=${0%/*}
AAPT_DIR="$MODDIR/common"
AAPT_PATH="$AAPT_DIR/aapt"

# Create common directory if it doesn't exist
mkdir -p "$AAPT_DIR"

# Function to copy aapt from system
copy_system_aapt() {
    # Try different possible locations for aapt
    POSSIBLE_LOCATIONS="
        /system/bin/aapt
        /system/xbin/aapt
        /data/adb/magisk/aapt
        /data/adb/ksu/bin/aapt
        /data/adb/ap/bin/aapt
    "
    
    for location in $POSSIBLE_LOCATIONS; do
        if [ -f "$location" ] && [ -x "$location" ]; then
            cp "$location" "$AAPT_PATH"
            chmod 755 "$AAPT_PATH"
            echo "Found and copied aapt from: $location"
            return 0
        fi
    done
    
    return 1
}

# Function to create a simple aapt alternative
create_aapt_alternative() {
    cat > "$AAPT_PATH" << 'EOF'
#!/system/bin/sh
# Simple aapt alternative for basic app info extraction
# This is a fallback when real aapt is not available

if [ "$1" = "dump" ] && [ "$2" = "badging" ] && [ -n "$3" ]; then
    APK_FILE="$3"
    
    # Try to extract package name using simple methods
    if command -v unzip >/dev/null 2>&1; then
        # Try to extract AndroidManifest.xml info
        PACKAGE=$(unzip -p "$APK_FILE" AndroidManifest.xml 2>/dev/null | strings | grep -o 'package="[^"]*"' | head -1 | sed 's/package="//;s/"//')
        [ -n "$PACKAGE" ] && echo "package: name='$PACKAGE'"
        
        # Try to get version info
        VERSION=$(unzip -p "$APK_FILE" AndroidManifest.xml 2>/dev/null | strings | grep -o 'versionName="[^"]*"' | head -1)
        [ -n "$VERSION" ] && echo "$VERSION"
        
        VERSION_CODE=$(unzip -p "$APK_FILE" AndroidManifest.xml 2>/dev/null | strings | grep -o 'versionCode="[^"]*"' | head -1)
        [ -n "$VERSION_CODE" ] && echo "$VERSION_CODE"
    fi
else
    echo "Usage: aapt dump badging <apk_file>"
    exit 1
fi
EOF
    
    chmod 755 "$AAPT_PATH"
    echo "Created fallback aapt alternative"
}

# Main execution
if [ ! -f "$AAPT_PATH" ]; then
    echo "Setting up aapt for OukaroManager..."
    
    if ! copy_system_aapt; then
        echo "System aapt not found, creating alternative..."
        create_aapt_alternative
    fi
    
    if [ -f "$AAPT_PATH" ]; then
        echo "aapt setup completed: $AAPT_PATH"
    else
        echo "Failed to setup aapt"
        exit 1
    fi
else
    echo "aapt already exists: $AAPT_PATH"
fi
