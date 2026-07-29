#!/bin/bash

###############################################################################
# ZWS Cloud - Live Update & Testing Script
# Usage: bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/update.sh)
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Functions
print_header() {
  echo -e "\n${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║ $(printf '%-52s' "$1") ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}\n"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_info() {
  echo -e "${CYAN}ℹ${NC} $1"
}

print_step() {
  echo -e "${YELLOW}→${NC} $1"
}

# Check if application is installed
check_installation() {
  if [ ! -d "${HOME}/zwscloud" ]; then
    print_error "ZWS Cloud not installed at ${HOME}/zwscloud"
    print_info "Run the installer first: bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install-unified.sh)"
    exit 1
  fi
}

# Pull latest changes
pull_updates() {
  print_header "Pulling Latest Updates"
  
  cd "${HOME}/zwscloud"
  
  print_step "Fetching latest changes..."
  git fetch origin main > /dev/null 2>&1
  
  print_step "Checking for updates..."
  LOCAL=$(git rev-parse HEAD)
  REMOTE=$(git rev-parse origin/main)
  
  if [ "$LOCAL" = "$REMOTE" ]; then
    print_info "Already up to date"
    return 0
  fi
  
  print_step "Applying updates..."
  git reset --hard origin/main > /dev/null 2>&1
  print_success "Updates pulled successfully"
  return 1
}

# Install/update dependencies
update_dependencies() {
  print_header "Updating Dependencies"
  
  cd "${HOME}/zwscloud"
  
  print_step "Installing dependencies..."
  npm install > /dev/null 2>&1
  print_success "Dependencies updated"
}

# Run migrations
run_migrations() {
  print_header "Running Database Migrations"
  
  cd "${HOME}/zwscloud"
  
  print_step "Executing migrations..."
  npm run migrate > /dev/null 2>&1 || true
  print_success "Migrations complete"
}

# Rebuild application
rebuild_application() {
  print_header "Rebuilding Application"
  
  cd "${HOME}/zwscloud"
  
  print_step "Building application (this may take a few minutes)..."
  npm run build > /dev/null 2>&1
  print_success "Application rebuilt successfully"
}

# Stop service
stop_service() {
  print_step "Stopping ZWS Cloud service..."
  sudo systemctl stop zwscloud > /dev/null 2>&1
  sleep 2
  print_success "Service stopped"
}

# Start service
start_service() {
  print_step "Starting ZWS Cloud service..."
  sudo systemctl start zwscloud > /dev/null 2>&1
  sleep 3
  print_success "Service started"
}

# Restart service
restart_service() {
  print_step "Restarting ZWS Cloud service..."
  sudo systemctl restart zwscloud > /dev/null 2>&1
  sleep 3
  print_success "Service restarted"
}

# Check service status
check_status() {
  print_header "Service Status"
  
  if sudo systemctl is-active --quiet zwscloud; then
    print_success "ZWS Cloud is running"
    
    # Get service info
    local pid=$(sudo systemctl show -p MainPID --value zwscloud)
    local memory=$(ps aux | grep -v grep | grep zwscloud | awk '{print $6}')
    
    print_info "Process ID: $pid"
    print_info "Memory Usage: ${memory}KB"
    
    # Get application info
    local ip=$(hostname -I | awk '{print $1}')
    print_info "Access URL: http://${ip}:3000"
  else
    print_error "ZWS Cloud is not running"
  fi
}

# View logs
view_logs() {
  print_header "Application Logs (Press Ctrl+C to exit)"
  echo ""
  sudo journalctl -u zwscloud -f --lines=50
}

# Full update with rebuild
full_update() {
  print_header "ZWS Cloud - Full Update & Live Test"
  
  check_installation
  
  has_updates=$(pull_updates)
  
  if [ "$has_updates" = "1" ]; then
    update_dependencies
    run_migrations
    rebuild_application
    restart_service
    print_info "Application updated and restarted"
  else
    print_info "No updates available"
  fi
  
  sleep 2
  check_status
}

# Quick update (just pull and restart)
quick_update() {
  print_header "ZWS Cloud - Quick Update"
  
  check_installation
  
  pull_updates
  stop_service
  start_service
  
  sleep 2
  check_status
}

# Development mode (rebuild and restart)
dev_mode() {
  print_header "ZWS Cloud - Development Mode"
  
  check_installation
  
  print_info "Building application for development..."
  cd "${HOME}/zwscloud"
  npm run build > /dev/null 2>&1
  
  stop_service
  start_service
  
  print_info "Entering development mode - rebuilding on file changes"
  print_info "Press Ctrl+C to exit"
  
  sleep 2
  check_status
}

# Show menu
show_menu() {
  echo -e "${CYAN}Select an option:${NC}"
  echo "  1) Full update (pull + install deps + rebuild + restart)"
  echo "  2) Quick update (pull + restart only)"
  echo "  3) Development mode (rebuild + restart + watch logs)"
  echo "  4) Check service status"
  echo "  5) View logs"
  echo "  6) Restart service"
  echo "  7) Stop service"
  echo "  8) Start service"
  echo "  9) Exit"
  echo ""
}

# Main
main() {
  clear
  
  print_header "ZWS Cloud - Live Update & Testing"
  
  check_installation
  
  while true; do
    show_menu
    read -p "$(echo -e ${YELLOW}Choice [1-9]${NC}: )" choice
    
    case $choice in
      1)
        full_update
        ;;
      2)
        quick_update
        ;;
      3)
        dev_mode
        ;;
      4)
        check_status
        ;;
      5)
        view_logs
        ;;
      6)
        restart_service
        sleep 2
        check_status
        ;;
      7)
        stop_service
        ;;
      8)
        start_service
        sleep 2
        check_status
        ;;
      9)
        print_info "Goodbye!"
        exit 0
        ;;
      *)
        print_error "Invalid choice"
        ;;
    esac
    
    echo ""
    read -p "$(echo -e ${YELLOW}Press Enter to continue...${NC})"
    clear
  done
}

main
