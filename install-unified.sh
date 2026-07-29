#!/bin/bash

###############################################################################
# ZWS Cloud - Fully Automated Unified Installer
# Usage: bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install-unified.sh)
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

detect_os() {
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if [ -f /etc/os-release ]; then
      . /etc/os-release
      if [[ "$ID" == "ubuntu" ]] || [[ "$ID" == "debian" ]]; then
        OS="ubuntu"
      elif [[ "$ID" == "centos" ]] || [[ "$ID" == "rhel" ]] || [[ "$ID" == "fedora" ]]; then
        OS="centos"
      fi
    fi
  else
    OS="unsupported"
  fi
}

# Install system dependencies
install_system_deps() {
  print_header "Installing System Dependencies"
  
  if [ "$OS" = "ubuntu" ]; then
    print_step "Updating package manager..."
    sudo apt-get update -qq > /dev/null 2>&1
    
    print_step "Installing dependencies..."
    sudo apt-get install -y -qq \
      curl wget git build-essential python3 \
      postgresql postgresql-contrib \
      > /dev/null 2>&1
    
    print_step "Installing Node.js LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
    sudo apt-get install -y -qq nodejs > /dev/null 2>&1
    
  elif [ "$OS" = "centos" ]; then
    print_step "Installing dependencies via yum..."
    sudo yum install -y \
      curl wget git make gcc gcc-c++ python3 \
      postgresql-server postgresql-contrib \
      > /dev/null 2>&1
    
    print_step "Installing Node.js LTS..."
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - > /dev/null 2>&1
    sudo yum install -y nodejs > /dev/null 2>&1
  fi
  
  print_success "System dependencies installed"
}

# Setup PostgreSQL
setup_postgres() {
  print_header "Setting Up PostgreSQL"
  
  if [ "$OS" = "ubuntu" ]; then
    print_step "Starting PostgreSQL service..."
    sudo systemctl start postgresql > /dev/null 2>&1
    sudo systemctl enable postgresql > /dev/null 2>&1
    
  elif [ "$OS" = "centos" ]; then
    print_step "Initializing PostgreSQL..."
    sudo postgresql-setup initdb > /dev/null 2>&1 || true
    print_step "Starting PostgreSQL service..."
    sudo systemctl start postgresql > /dev/null 2>&1
    sudo systemctl enable postgresql > /dev/null 2>&1
  fi
  
  # Generate random credentials
  DB_USER="zwscloud_user"
  DB_NAME="zwscloud"
  DB_PASS=$(openssl rand -base64 32 | tr -d '=' | tr '+/' '-_')
  DB_HOST="localhost"
  DB_PORT="5432"
  
  print_step "Creating database user and database..."
  sudo -u postgres psql << PSQL_EOF > /dev/null 2>&1
DROP DATABASE IF EXISTS $DB_NAME;
DROP USER IF EXISTS $DB_USER;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS' CREATEDB;
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT CONNECT ON DATABASE $DB_NAME TO $DB_USER;
GRANT USAGE ON SCHEMA public TO $DB_USER;
GRANT CREATE ON SCHEMA public TO $DB_USER;
PSQL_EOF
  
  print_success "PostgreSQL configured"
  print_info "Database: $DB_NAME"
  print_info "User: $DB_USER"
}

# Setup application
setup_application() {
  print_header "Setting Up ZWS Cloud"
  
  INSTALL_DIR="${HOME}/zwscloud"
  
  if [ -d "$INSTALL_DIR" ]; then
    print_step "Updating existing installation..."
    cd "$INSTALL_DIR"
    git pull origin main > /dev/null 2>&1 || git fetch && git reset --hard origin/main > /dev/null 2>&1
  else
    print_step "Cloning repository..."
    git clone https://github.com/fitnesshubgym03-debug/zwscloud-ui-db.git "$INSTALL_DIR" > /dev/null 2>&1
    cd "$INSTALL_DIR"
  fi
  
  print_success "Repository ready"
}

# Setup environment
setup_environment() {
  print_header "Configuring Environment"
  
  cd "${HOME}/zwscloud"
  
  # Generate secrets
  JWT_SECRET=$(openssl rand -base64 32)
  ADMIN_EMAIL="admin@zwscloud.local"
  ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -d '=' | tr '+/' '-_')
  DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
  
  # Create .env.local
  cat > .env.local << EOF
# Database
DATABASE_URL="${DATABASE_URL}"

# Admin
ADMIN_EMAIL="${ADMIN_EMAIL}"
ADMIN_PASSWORD="${ADMIN_PASSWORD}"
ADMIN_DISPLAY_NAME="Administrator"

# Authentication
JWT_SECRET="${JWT_SECRET}"

# Payment Gateway (configure in admin panel)
DEFAULT_PAYMENT_GATEWAY="razorpay"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="production"
EOF
  
  print_success "Environment configured"
  print_info "Admin Email: $ADMIN_EMAIL"
  print_info "Admin Password: $ADMIN_PASSWORD"
}

# Install dependencies and build
build_application() {
  print_header "Building Application"
  
  cd "${HOME}/zwscloud"
  
  print_step "Installing dependencies (this may take a few minutes)..."
  npm install > /dev/null 2>&1
  print_success "Dependencies installed"
  
  print_step "Running database migrations..."
  npm run migrate > /dev/null 2>&1 || true
  print_success "Database migrations complete"
  
  print_step "Building application..."
  npm run build > /dev/null 2>&1
  print_success "Application built successfully"
}

# Setup systemd service
setup_systemd() {
  print_header "Setting Up Service"
  
  print_step "Creating systemd service..."
  sudo tee /etc/systemd/system/zwscloud.service > /dev/null << EOF
[Unit]
Description=ZWS Cloud Application
After=network.target postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=${HOME}/zwscloud
ExecStart=$(which node) ${HOME}/zwscloud/.next/standalone/server.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
  
  sudo systemctl daemon-reload > /dev/null 2>&1
  sudo systemctl enable zwscloud > /dev/null 2>&1
  
  print_success "Service created and enabled"
}

# Start application
start_application() {
  print_header "Starting Application"
  
  print_step "Starting ZWS Cloud service..."
  sudo systemctl start zwscloud > /dev/null 2>&1
  
  sleep 3
  
  if sudo systemctl is-active --quiet zwscloud; then
    print_success "Application started successfully"
  else
    print_error "Failed to start application"
    print_info "Check logs with: sudo journalctl -u zwscloud -f"
    return 1
  fi
}

# Print summary
print_summary() {
  print_header "Installation Complete!"
  
  echo -e "${CYAN}Your ZWS Cloud installation is ready!${NC}\n"
  
  echo -e "${GREEN}Access Information:${NC}"
  echo -e "  URL: ${CYAN}http://$(hostname -I | awk '{print $1}'):3000${NC}"
  echo -e "  Admin Email: ${CYAN}${ADMIN_EMAIL}${NC}"
  echo -e "  Admin Password: ${CYAN}${ADMIN_PASSWORD}${NC}"
  
  echo -e "\n${GREEN}Database Information:${NC}"
  echo -e "  Host: ${CYAN}${DB_HOST}${NC}"
  echo -e "  Port: ${CYAN}${DB_PORT}${NC}"
  echo -e "  Database: ${CYAN}${DB_NAME}${NC}"
  echo -e "  User: ${CYAN}${DB_USER}${NC}"
  
  echo -e "\n${GREEN}Useful Commands:${NC}"
  echo -e "  View logs: ${CYAN}sudo journalctl -u zwscloud -f${NC}"
  echo -e "  Stop service: ${CYAN}sudo systemctl stop zwscloud${NC}"
  echo -e "  Start service: ${CYAN}sudo systemctl start zwscloud${NC}"
  echo -e "  Restart service: ${CYAN}sudo systemctl restart zwscloud${NC}"
  echo -e "  Update application: ${CYAN}bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/update.sh)${NC}"
  
  echo -e "\n${YELLOW}⚠ Important:${NC}"
  echo -e "  • Save your admin credentials in a secure location"
  echo -e "  • Configure payment gateway in admin panel"
  echo -e "  • Set up SSL certificate for production use"
  echo -e "  • Update domain in application settings\n"
}

# Main flow
main() {
  clear
  
  print_header "ZWS Cloud - Fully Automated Installer"
  echo -e "${CYAN}This script will automatically:${NC}"
  echo "  ✓ Install system dependencies"
  echo "  ✓ Setup PostgreSQL with random credentials"
  echo "  ✓ Clone/update repository"
  echo "  ✓ Configure environment"
  echo "  ✓ Build application"
  echo "  ✓ Setup systemd service"
  echo "  ✓ Start the application"
  echo ""
  
  read -p "$(echo -e ${YELLOW}Continue with installation? [y/n]${NC}: )" -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Installation cancelled"
    exit 1
  fi
  
  detect_os
  
  if [ "$OS" = "unsupported" ]; then
    print_error "Unsupported operating system"
    exit 1
  fi
  
  print_success "Detected OS: $OS"
  echo ""
  
  install_system_deps
  setup_postgres
  setup_application
  setup_environment
  build_application
  setup_systemd
  start_application
  print_summary
}

main
