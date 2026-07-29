#!/bin/bash

###############################################################################
# ZWS Cloud - Automated Interactive Installer
# Usage: bash install-auto.sh
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

prompt_input() {
  local prompt="$1"
  local default="$2"
  local input
  
  if [ -z "$default" ]; then
    read -p "$(echo -e ${YELLOW}${prompt}${NC}): " input
  else
    read -p "$(echo -e ${YELLOW}${prompt} [${default}]${NC}): " input
    input=${input:-$default}
  fi
  
  echo "$input"
}

prompt_yn() {
  local prompt="$1"
  local response
  
  while true; do
    read -p "$(echo -e ${YELLOW}${prompt} [y/n]${NC}): " response
    case "$response" in
      [yY][eE][sS]|[yY]) return 0 ;;
      [nN][oO]|[nN]) return 1 ;;
      *) print_error "Please answer y or n" ;;
    esac
  done
}

# Detect OS
detect_os() {
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if [ -f /etc/os-release ]; then
      . /etc/os-release
      if [[ "$ID" == "ubuntu" ]] || [[ "$ID" == "debian" ]]; then
        OS="debian"
      elif [[ "$ID" == "centos" ]] || [[ "$ID" == "rhel" ]] || [[ "$ID" == "fedora" ]]; then
        OS="rhel"
      fi
    fi
  fi
  [ -n "$OS" ] && print_success "Detected OS: $OS" || print_error "Unsupported OS"
}

# Install Node.js
install_nodejs() {
  print_header "Installing Node.js"
  
  if command -v node &> /dev/null; then
    print_success "Node.js already installed: $(node -v)"
    return 0
  fi
  
  if [ "$OS" = "debian" ]; then
    sudo apt-get update -qq > /dev/null 2>&1
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
    sudo apt-get install -y nodejs > /dev/null 2>&1
  elif [ "$OS" = "rhel" ]; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - > /dev/null 2>&1
    sudo yum install -y nodejs > /dev/null 2>&1
  fi
  
  print_success "Node.js $(node -v) installed"
}

# Install PostgreSQL
install_postgres() {
  print_header "Installing PostgreSQL"
  
  if command -v psql &> /dev/null; then
    print_success "PostgreSQL already installed"
    return 0
  fi
  
  if [ "$OS" = "debian" ]; then
    sudo apt-get install -y postgresql postgresql-contrib > /dev/null 2>&1
  elif [ "$OS" = "rhel" ]; then
    sudo yum install -y postgresql-server postgresql-contrib > /dev/null 2>&1
    sudo postgresql-setup initdb 2>/dev/null || true
  fi
  
  sudo systemctl start postgresql 2>/dev/null || sudo systemctl start postgres 2>/dev/null || true
  sudo systemctl enable postgresql 2>/dev/null || true
  
  sleep 2
  print_success "PostgreSQL started"
}

# Get user configuration
get_config() {
  print_header "Configuration"
  
  ADMIN_EMAIL=$(prompt_input "Admin email" "admin@example.com")
  ADMIN_PASSWORD=$(prompt_input "Admin password (min 8 chars)" "Admin@123")
  
  while [ ${#ADMIN_PASSWORD} -lt 8 ]; do
    print_error "Password must be at least 8 characters"
    ADMIN_PASSWORD=$(prompt_input "Admin password (min 8 chars)" "Admin@123")
  done
  
  ADMIN_DISPLAY_NAME=$(prompt_input "Admin display name" "Administrator")
  
  # Database choice
  echo ""
  print_info "Database options:"
  echo "  1) Auto-install PostgreSQL (recommended)"
  echo "  2) Use existing PostgreSQL"
  
  DB_CHOICE=$(prompt_input "Choice [1-2]" "1")
  
  if [ "$DB_CHOICE" = "2" ]; then
    DB_HOST=$(prompt_input "Database host" "localhost")
    DB_PORT=$(prompt_input "Database port" "5432")
    DB_USER=$(prompt_input "Database user" "postgres")
    DB_PASS=$(prompt_input "Database password" "")
    DB_NAME=$(prompt_input "Database name" "zwscloud")
    AUTO_INSTALL_DB=false
  else
    DB_HOST="localhost"
    DB_PORT="5432"
    DB_USER="zwscloud_user"
    DB_PASS=$(openssl rand -base64 24 | tr -d '=' | tr '+/' '0-' | tr -d '+/=')
    DB_NAME="zwscloud"
    AUTO_INSTALL_DB=true
  fi
  
  JWT_SECRET=$(openssl rand -base64 32)
}

# Create database
setup_db() {
  if [ "$AUTO_INSTALL_DB" = true ]; then
    print_header "Setting Up Database"
    
    # Drop existing
    sudo -u postgres psql << PSQL_EOF 2>/dev/null || true
DROP USER IF EXISTS "$DB_USER";
DROP DATABASE IF EXISTS "$DB_NAME";
PSQL_EOF
    
    # Create user
    sudo -u postgres psql << PSQL_EOF 2>/dev/null
CREATE USER "$DB_USER" WITH PASSWORD '$DB_PASS' CREATEDB;
PSQL_EOF
    
    # Create database
    sudo -u postgres psql << PSQL_EOF 2>/dev/null
CREATE DATABASE "$DB_NAME" OWNER "$DB_USER";
GRANT CONNECT ON DATABASE "$DB_NAME" TO "$DB_USER";
GRANT USAGE ON SCHEMA public TO "$DB_USER";
GRANT CREATE ON SCHEMA public TO "$DB_USER";
PSQL_EOF
    
    print_success "Database created"
  fi
}

# Create env file
create_env() {
  print_header "Creating Environment File"
  
  DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
  
  cat > .env.local << EOF
DATABASE_URL="$DATABASE_URL"
ADMIN_EMAIL="$ADMIN_EMAIL"
ADMIN_PASSWORD="$ADMIN_PASSWORD"
ADMIN_DISPLAY_NAME="$ADMIN_DISPLAY_NAME"
JWT_SECRET="$JWT_SECRET"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
EOF
  
  print_success "Environment file created"
}

# Install dependencies
install_deps() {
  print_header "Installing Dependencies"
  
  npm cache clean --force 2>/dev/null || true
  
  if command -v pnpm &> /dev/null; then
    pnpm install --prefer-offline 2>&1 | tail -5
  else
    npm install --prefer-offline 2>&1 | tail -5
  fi
  
  print_success "Dependencies installed"
}

# Setup database
db_setup() {
  print_header "Running Database Migrations"
  
  sleep 2
  
  if command -v pnpm &> /dev/null; then
    pnpm db:push --skip-generate 2>&1 | tail -10
  else
    npm run db:push -- --skip-generate 2>&1 | tail -10
  fi
  
  print_success "Database schema synced"
}

# Build app
build() {
  print_header "Building Application"
  
  if command -v pnpm &> /dev/null; then
    pnpm db:generate 2>&1 | tail -3
    pnpm build 2>&1 | tail -10
  else
    npm run db:generate 2>&1 | tail -3
    npm run build 2>&1 | tail -10
  fi
  
  print_success "Application built"
}

# Summary
show_summary() {
  print_header "Installation Complete!"
  
  echo -e "${CYAN}Your ZWS Cloud is ready!${NC}\n"
  
  echo -e "${GREEN}Next Steps:${NC}"
  echo "  npm run dev          # Start development server"
  echo "  npm run build        # Build for production"
  echo "  npm start            # Start production server"
  echo ""
  echo -e "${GREEN}Admin Credentials:${NC}"
  echo "  Email: $ADMIN_EMAIL"
  echo "  Password: $ADMIN_PASSWORD"
  echo ""
  echo -e "${GREEN}Database:${NC}"
  echo "  Host: $DB_HOST:$DB_PORT"
  echo "  Database: $DB_NAME"
  echo "  User: $DB_USER"
  echo ""
  echo -e "${YELLOW}Save these credentials in a secure location!${NC}"
}

# Main
main() {
  print_header "ZWS Cloud - Interactive Installer"
  
  if ! prompt_yn "Continue with installation?"; then
    print_info "Installation cancelled"
    exit 0
  fi
  
  detect_os
  install_nodejs
  install_postgres
  get_config
  setup_db
  create_env
  install_deps
  db_setup
  build
  show_summary
  
  print_success "Done! Run 'npm run dev' to start"
}

main "$@"
