#!/bin/bash

###############################################################################
# ZWS Cloud - Update & Live Testing Script
# COMPLETELY SEPARATE FROM INSTALLATION
# Usage: bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/update-app.sh)
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

check_zwscloud_dir() {
  if [ ! -d "zwscloud-ui-db" ] && [ ! -f "package.json" ]; then
    print_error "ZWS Cloud application not found"
    print_info "Please run the installer first:"
    print_info "bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install.sh)"
    exit 1
  fi
  
  if [ -d "zwscloud-ui-db" ]; then
    cd zwscloud-ui-db
  fi
}

check_service_status() {
  if systemctl is-active --quiet zwscloud.service 2>/dev/null; then
    print_success "ZWS Cloud service is running"
    return 0
  else
    print_info "ZWS Cloud service is not running"
    return 1
  fi
}

view_service_status() {
  print_header "Service Status"
  systemctl status zwscloud.service --no-pager || true
}

view_logs() {
  print_header "Application Logs (Ctrl+C to exit)"
  echo ""
  sudo journalctl -u zwscloud.service -f --no-pager || journalctl -u zwscloud.service -f --no-pager || true
}

restart_service() {
  print_header "Restarting Service"
  print_step "Restarting ZWS Cloud..."
  sudo systemctl restart zwscloud.service || systemctl restart zwscloud.service || true
  sleep 2
  
  if systemctl is-active --quiet zwscloud.service 2>/dev/null; then
    print_success "Service restarted successfully"
  else
    print_error "Service failed to restart"
    return 1
  fi
}

stop_service() {
  print_header "Stopping Service"
  print_step "Stopping ZWS Cloud..."
  sudo systemctl stop zwscloud.service || systemctl stop zwscloud.service || true
  sleep 1
  print_success "Service stopped"
}

start_service() {
  print_header "Starting Service"
  print_step "Starting ZWS Cloud..."
  sudo systemctl start zwscloud.service || systemctl start zwscloud.service || true
  sleep 2
  
  if systemctl is-active --quiet zwscloud.service 2>/dev/null; then
    print_success "Service started successfully"
  else
    print_error "Service failed to start"
    print_info "Check logs with: sudo journalctl -u zwscloud -n 50"
    return 1
  fi
}

quick_update() {
  print_header "Quick Update (Pull + Restart)"
  
  check_service_status
  
  print_step "Pulling latest changes from repository..."
  git pull origin main
  
  print_step "Restarting service..."
  restart_service
  
  print_success "Quick update completed"
}

full_update() {
  print_header "Full Update (Pull + Rebuild + Restart)"
  
  print_step "Pulling latest changes from repository..."
  git pull origin main
  
  print_step "Installing dependencies..."
  if command -v pnpm &> /dev/null; then
    pnpm install --frozen-lockfile 2>&1 | tail -5
  else
    npm install 2>&1 | tail -5
  fi
  
  print_step "Building application..."
  if command -v pnpm &> /dev/null; then
    pnpm build 2>&1 | tail -10
  else
    npm run build 2>&1 | tail -10
  fi
  
  if [ ! -d ".next" ]; then
    print_error "Build failed"
    return 1
  fi
  
  print_step "Restarting service..."
  restart_service
  
  print_success "Full update completed"
}

dev_mode() {
  print_header "Development Mode"
  
  print_info "Starting development server with hot reload..."
  print_info "Press Ctrl+C to exit"
  echo ""
  
  if command -v pnpm &> /dev/null; then
    pnpm dev
  else
    npm run dev
  fi
}

show_menu() {
  echo ""
  echo "Choose an option:"
  echo ""
  echo "  1) Full update (pull + rebuild + restart)"
  echo "  2) Quick update (pull + restart only)"
  echo "  3) Development mode (hot reload)"
  echo "  4) Check service status"
  echo "  5) View logs"
  echo "  6) Restart service"
  echo "  7) Stop service"
  echo "  8) Start service"
  echo "  9) Exit"
  echo ""
  read -p "$(echo -e ${CYAN}?${NC}) Choice [1-9]: " choice
}

# Main menu loop
main() {
  print_header "ZWS Cloud - Update & Testing Tool"
  
  check_zwscloud_dir
  
  while true; do
    show_menu
    
    case $choice in
      1)
        full_update
        ;;
      2)
        quick_update
        ;;
      3)
        dev_mode
        break
        ;;
      4)
        view_service_status
        ;;
      5)
        view_logs
        ;;
      6)
        restart_service
        ;;
      7)
        stop_service
        ;;
      8)
        start_service
        ;;
      9)
        print_success "Exiting"
        exit 0
        ;;
      *)
        print_error "Invalid choice"
        ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
  done
}

# Run main
main "$@"
