#!/system/bin/sh

# OukaroManager Customization Script
# This script runs during module installation to set up the module

MODPATH="$1"
TMPDIR="$2"

ui_print "                        .-. .-')   ('-.    _  .-')             _   .-')     ('-.        .-') _   ('-.                 ('-. _  .-')   "
ui_print "                        \  ( OO ) ( OO ).-( \( -O )           ( '.( OO )_  ( OO ).-.   ( OO ) ) ( OO ).-.           _(  OO( \( -O )  "
ui_print " .-'),-----. ,--. ,--.  ,--. ,--. / . --. /,------. .-'),-----.,--.   ,--.)/ . --. ,--./ ,--,'  / . --. / ,----.   (,------,------.  "
ui_print "( OO'  .-.  '|  | |  |  |  .'   / | \-.  \ |   /`. ( OO'  .-.  |   \`.'   | | \-.  \|   \ |  |\  | \-.  \ '  .-./-') |  .---|   /`. ' "
ui_print "/   |  | |  ||  | | .-')|      /.-'-'  |  ||  /  | /   |  | |  |         .-'-'  |  |    \|  | .-'-'  |  ||  |_( O- )|  |   |  /  | | "
ui_print "\_) |  |\|  ||  |_|( OO |     ' _\| |_.'  ||  |_.' \_) |  |\|  |  |'.'|  |\| |_.'  |  .     |/ \| |_.'  ||  | .--, (|  '--.|  |_.' | "
ui_print "  \ |  | |  ||  | | \`-' |  .   \  |  .-.  ||  .  '.' \ |  | |  |  |   |  | |  .-.  |  |\    |   |  .-.  (|  | '. (_/|  .--'|  .  '.' "
ui_print "   \`'  '-'  ('  '-'(_.-'|  |\   \ |  | |  ||  |\  \   \`'  '-'  |  |   |  | |  | |  |  | \   |   |  | |  ||  '--'  | |  \`---|  |\  \  "
ui_print "     \`-----'  \`-----'   \`--' '--' \`--' \`--'\`--' '--'    \`-----'\`--'   \`--' \`--' \`--\`--'  \`--'   \`--' \`--' \`------'  \`------\`--' '--' "
ui_print " "
ui_print "************************************************"
ui_print "  Convert regular apps to system apps easily"
ui_print "  with WebUI interface"
ui_print "************************************************"

# Check KernelSU environment
if [ "$KSU" != "true" ]; then
    ui_print "! This module requires KernelSU"
    abort "! Please install KernelSU first"
fi

ui_print "- KernelSU detected: $KSU_VER ($KSU_VER_CODE)"

# Check Android API level
if [ "$API" -lt "21" ]; then
    ui_print "! Android 5.0+ (API 21+) is required"
    abort "! Your Android version is not supported"
fi

ui_print "- Android API: $API"
ui_print "- Architecture: $ARCH"

# Create necessary directories
ui_print "- Creating module directories..."
mkdir -p "$MODPATH/scripts"
mkdir -p "$MODPATH/webroot"
mkdir -p "$MODPATH/webroot/assets"
mkdir -p "$MODPATH/webroot/locales"
mkdir -p "$MODPATH/logs"

# Set permissions for scripts
ui_print "- Setting permissions..."
set_perm_recursive "$MODPATH/scripts" 0 0 0755 0755
set_perm "$MODPATH/action.sh" 0 0 0755
set_perm "$MODPATH/service.sh" 0 0 0755

ui_print "- Installation completed!"
ui_print "- Access WebUI via KernelSU Manager"
ui_print "- Or use action button for quick actions"
ui_print "************************************************"
