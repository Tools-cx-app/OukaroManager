#!/bin/sh

# OukaroManager Service Script
# Runs in background to maintain apps.json accuracy
# Auto-generates configuration on boot and periodically updates

MODDIR=${0%/*}
SERVICE_LOG="$MODDIR/logs/service.log"
PID_FILE="$MODDIR/service.pid"

# Source utility functions
. "$MODDIR/util.sh"

# Ensure log directory exists
mkdir -p "$(dirname "$SERVICE_LOG")"

# Service logging function
service_log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [SERVICE] $1" >> "$SERVICE_LOG"
    echo "[SERVICE] $1"
}

# Check if service is already running
check_service_running() {
    if [ -f "$PID_FILE" ]; then
        local existing_pid=$(cat "$PID_FILE")
        if kill -0 "$existing_pid" 2>/dev/null; then
            service_log "Service already running with PID: $existing_pid"
            return 0
        else
            service_log "Removing stale PID file"
            rm -f "$PID_FILE"
        fi
    fi
    return 1
}

# Create PID file
create_pid_file() {
    echo $$ > "$PID_FILE"
    service_log "Service started with PID: $$"
}

# Cleanup function
cleanup() {
    service_log "Service stopping, cleaning up..."
    rm -f "$PID_FILE"
    exit 0
}

# Signal handlers
trap cleanup INT TERM EXIT

# Wait for system to be ready
wait_for_system_ready() {
    service_log "Waiting for system to be ready..."
    
    # Wait for boot completion
    local timeout=120
    local count=0
    
    while [ "$(getprop sys.boot_completed)" != "1" ] && [ $count -lt $timeout ]; do
        sleep 2
        count=$((count + 2))
    done
    
    if [ $count -ge $timeout ]; then
        service_log "Warning: Boot completion timeout reached"
    else
        service_log "System boot completed"
    fi
    
    # Additional wait for package manager to be ready
    local pm_ready=0
    count=0
    timeout=60
    
    while [ $pm_ready -eq 0 ] && [ $count -lt $timeout ]; do
        if pm list packages > /dev/null 2>&1; then
            pm_ready=1
            service_log "Package manager ready"
        else
            sleep 2
            count=$((count + 2))
        fi
    done
    
    if [ $pm_ready -eq 0 ]; then
        service_log "Warning: Package manager not ready, continuing anyway"
    fi
    
    # Final delay to ensure system stability
    sleep 5
}

# Generate or update configuration
update_configuration() {
    service_log "Updating configuration..."
    
    if [ -f "$MODDIR/generate-config.sh" ]; then
        if chmod +x "$MODDIR/generate-config.sh" && "$MODDIR/generate-config.sh"; then
            service_log "Configuration updated successfully"
            
            # Set correct permissions for web files if they exist
            if [ -d "$MODDIR/webroot" ]; then
                chmod -R 755 "$MODDIR/webroot"
            fi
            
            # Ensure apps.json has correct permissions
            if [ -f "$MODDIR/apps.json" ]; then
                chmod 644 "$MODDIR/apps.json"
            fi
            
            return 0
        else
            service_log "Error: Failed to update configuration"
            return 1
        fi
    else
        service_log "Warning: generate-config.sh not found"
        return 1
    fi
}

# Check if configuration needs update
needs_config_update() {
    local json_file="$MODDIR/apps.json"
    local config_age=0
    
    if [ -f "$json_file" ]; then
        # Get file age in seconds (simplified check)
        local current_time=$(date +%s)
        local file_time=$(stat -c %Y "$json_file" 2>/dev/null || echo 0)
        config_age=$((current_time - file_time))
    else
        service_log "apps.json not found, needs initial generation"
        return 0
    fi
    
    # Update if older than 1 hour (3600 seconds) or if forced
    if [ $config_age -gt 3600 ]; then
        service_log "Configuration is $config_age seconds old, needs update"
        return 0
    fi
    
    return 1
}

# Monitor system changes
monitor_system_changes() {
    local last_package_count=0
    local current_package_count=0
    
    # Get current package count
    current_package_count=$(pm list packages 2>/dev/null | wc -l)
    
    if [ $current_package_count -ne $last_package_count ]; then
        if [ $last_package_count -ne 0 ]; then
            service_log "Package count changed: $last_package_count -> $current_package_count"
            return 0
        fi
        last_package_count=$current_package_count
    fi
    
    return 1
}

# Main service function
run_service() {
    service_log "OukaroManager background service starting..."
    
    # Wait for system to be ready
    wait_for_system_ready
    
    # Initial configuration generation
    service_log "Performing initial configuration generation..."
    update_configuration
    
    # Service loop parameters
    local loop_count=0
    local short_interval=30    # 30 seconds for quick checks
    local long_interval=300    # 5 minutes for full updates
    local force_update_interval=3600  # 1 hour for forced updates
    
    service_log "Starting background monitoring loop..."
    
    while true; do
        loop_count=$((loop_count + 1))
        
        # Every 30 seconds: Quick system monitoring
        if monitor_system_changes; then
            service_log "System changes detected, updating configuration..."
            update_configuration
        fi
        
        # Every 5 minutes: Check if configuration needs update
        if [ $((loop_count % 10)) -eq 0 ]; then
            if needs_config_update; then
                service_log "Periodic configuration update needed"
                update_configuration
            fi
        fi
        
        # Every hour: Force configuration update
        if [ $((loop_count % 120)) -eq 0 ]; then
            service_log "Performing hourly forced configuration update"
            update_configuration
            
            # Log service status
            local uptime_seconds=$((loop_count * short_interval))
            local uptime_hours=$((uptime_seconds / 3600))
            local uptime_minutes=$(((uptime_seconds % 3600) / 60))
            service_log "Service uptime: ${uptime_hours}h ${uptime_minutes}m"
        fi
        
        # Sleep for short interval
        sleep $short_interval
    done
}

# Service management functions
start_service() {
    if check_service_running; then
        echo "Service is already running"
        return 1
    fi
    
    create_pid_file
    service_log "=== OukaroManager Service Starting ==="
    
    # Run service in background
    run_service &
    
    return 0
}

stop_service() {
    if [ -f "$PID_FILE" ]; then
        local service_pid=$(cat "$PID_FILE")
        if kill -0 "$service_pid" 2>/dev/null; then
            service_log "Stopping service with PID: $service_pid"
            kill -TERM "$service_pid" 2>/dev/null
            
            # Wait for graceful shutdown
            local count=0
            while kill -0 "$service_pid" 2>/dev/null && [ $count -lt 10 ]; do
                sleep 1
                count=$((count + 1))
            done
            
            # Force kill if necessary
            if kill -0 "$service_pid" 2>/dev/null; then
                service_log "Force killing service"
                kill -KILL "$service_pid" 2>/dev/null
            fi
            
            rm -f "$PID_FILE"
            service_log "Service stopped"
            return 0
        else
            service_log "Service not running, removing stale PID file"
            rm -f "$PID_FILE"
            return 1
        fi
    else
        echo "Service is not running"
        return 1
    fi
}

status_service() {
    if [ -f "$PID_FILE" ]; then
        local service_pid=$(cat "$PID_FILE")
        if kill -0 "$service_pid" 2>/dev/null; then
            echo "Service is running with PID: $service_pid"
            
            # Show recent logs
            if [ -f "$SERVICE_LOG" ]; then
                echo ""
                echo "Recent log entries:"
                tail -n 5 "$SERVICE_LOG"
            fi
            return 0
        else
            echo "Service PID file exists but process is not running"
            return 1
        fi
    else
        echo "Service is not running"
        return 1
    fi
}

# Main execution
case "${1:-start}" in
    "start")
        start_service
        ;;
    "stop")
        stop_service
        ;;
    "restart")
        stop_service
        sleep 2
        start_service
        ;;
    "status")
        status_service
        ;;
    "run")
        # Run in foreground for debugging
        if check_service_running; then
            echo "Service is already running in background"
            exit 1
        fi
        create_pid_file
        run_service
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|run}"
        echo ""
        echo "Commands:"
        echo "  start   - Start service in background"
        echo "  stop    - Stop running service"
        echo "  restart - Restart service"
        echo "  status  - Show service status"
        echo "  run     - Run service in foreground (for debugging)"
        exit 1
        ;;
esac
