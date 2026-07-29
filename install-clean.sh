#!/bin/bash

###############################################################################
# ZWS Cloud - Clean Installation Script
# For fresh, production-ready installs with proper error handling
# Usage: bash install-clean.sh
###############################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Logging functions
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

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

print_step() {
  echo -e "${YELLOW}→${NC} $1"
}

# Error handler
handle_error() {
  local line=$1
  print_error "Error on line $line - installation failed"
  exit 1
}

trap 'handle_error ${LINENO}' ERR

# Check if running in project directory
check_environment() {
  print_header "Checking Environment"
  
  if [ ! -f "package.json" ]; then
    print_error "package.json not found - please run this script from the project root"
    exit 1
  fi
  
  print_success "Running from project root"
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
      else
        OS="$ID"
      fi
    fi
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
  else
    print_error "Unsupported OS: $OSTYPE"
    exit 1
  fi
  
  print_success "Detected OS: $OS"
}

# Install Node.js and npm
install_nodejs() {
  print_header "Installing Node.js & npm"
  
  if command -v node &> /dev/null; then
    print_success "Node.js already installed: $(node -v)"
    return 0
  fi
  
  if [ "$OS" = "debian" ]; then
    print_step "Installing Node.js via NodeSource..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - 2>&1 | grep -v "^$" | tail -3
    sudo apt-get install -y nodejs > /dev/null 2>&1 || {
      print_error "Failed to install Node.js"
      return 1
    }
    
  elif [ "$OS" = "rhel" ]; then
    print_step "Installing Node.js via NodeSource..."
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - 2>&1 | grep -v "^$" | tail -3
    sudo yum install -y nodejs > /dev/null 2>&1 || {
      print_error "Failed to install Node.js"
      return 1
    }
    
  elif [ "$OS" = "macos" ]; then
    if ! command -v brew &> /dev/null; then
      print_step "Installing Homebrew..."
      /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    print_step "Installing Node.js..."
    brew install node > /dev/null 2>&1
  fi
  
  print_success "Node.js $(node -v) installed"
  print_success "npm $(npm -v) installed"
}

# Install PostgreSQL
install_postgresql() {
  print_header "Installing PostgreSQL"
  
  if command -v psql &> /dev/null; then
    print_success "PostgreSQL already installed: $(psql --version | awk '{print $3}')"
    return 0
  fi
  
  if [ "$OS" = "debian" ]; then
    print_step "Installing PostgreSQL via apt..."
    sudo apt-get update > /dev/null 2>&1
    sudo apt-get install -y postgresql postgresql-contrib > /dev/null 2>&1
    
  elif [ "$OS" = "rhel" ]; then
    print_step "Installing PostgreSQL via yum..."
    sudo yum install -y postgresql-server postgresql-contrib > /dev/null 2>&1
    sudo postgresql-setup initdb 2>/dev/null || true
    
  elif [ "$OS" = "macos" ]; then
    print_step "Installing PostgreSQL via Homebrew..."
    brew install postgresql > /dev/null 2>&1
    brew services start postgresql 2>/dev/null || true
    sleep 2
    return 0
  fi
  
  print_success "PostgreSQL installed"
}

# Start PostgreSQL service
start_postgresql() {
  print_step "Starting PostgreSQL service..."
  
  if ! sudo systemctl start postgresql 2>/dev/null; then
    sudo systemctl start postgres 2>/dev/null || true
  fi
  
  sudo systemctl enable postgresql 2>/dev/null || sudo systemctl enable postgres 2>/dev/null || true
  
  # Wait for PostgreSQL to be ready
  local attempt=0
  while [ $attempt -lt 30 ]; do
    if sudo -u postgres psql -c "SELECT 1" > /dev/null 2>&1; then
      print_success "PostgreSQL is ready"
      return 0
    fi
    sleep 1
    attempt=$((attempt + 1))
  done
  
  print_error "PostgreSQL failed to start within 30 seconds"
  return 1
}

# Setup database
setup_database() {
  print_header "Setting Up Database"
  
  # Generate secure password without special characters
  local db_pass=$(openssl rand -base64 24 | tr -d '=' | tr '+/' '0-' | tr -d '+/=')
  local db_user="zwscloud_user"
  local db_name="zwscloud"
  
  print_step "Creating database user and database..."
  
  # Drop existing to ensure clean state
  sudo -u postgres psql << PSQL_EOF 2>/dev/null || true
DROP USER IF EXISTS "$db_user";
PSQL_EOF
  
  sudo -u postgres psql << PSQL_EOF 2>/dev/null || true
DROP DATABASE IF EXISTS "$db_name";
PSQL_EOF
  
  # Create user
  sudo -u postgres psql << PSQL_EOF 2>/dev/null
CREATE USER "$db_user" WITH PASSWORD '$db_pass' CREATEDB;
PSQL_EOF
  
  # Create database
  sudo -u postgres psql << PSQL_EOF 2>/dev/null
CREATE DATABASE "$db_name" OWNER "$db_user";
GRANT CONNECT ON DATABASE "$db_name" TO "$db_user";
GRANT USAGE ON SCHEMA public TO "$db_user";
GRANT CREATE ON SCHEMA public TO "$db_user";
PSQL_EOF
  
  print_success "Database created: $db_name"
  
  # Output connection string
  echo "$db_pass"
}

# Install project dependencies
install_dependencies() {
  print_header "Installing Dependencies"
  
  print_step "Clearing package manager cache..."
  npm cache clean --force 2>/dev/null || true
  
  print_step "Installing packages..."
  if command -v pnpm &> /dev/null; then
    pnpm install --prefer-offline 2>&1 | tail -5
  else
    npm install --prefer-offline 2>&1 | tail -5
  fi
  
  print_success "Dependencies installed"
}

# Run migrations
run_migrations() {
  print_header "Running Database Migrations"
  
  print_step "Waiting for database to be ready..."
  sleep 2
  
  print_step "Pushing schema..."
  if command -v pnpm &> /dev/null; then
    pnpm db:push --skip-generate 2>&1 | tail -10
  else
    npm run db:push -- --skip-generate 2>&1 | tail -10
  fi
  
  print_success "Database schema synced"
}

# Build application
build_application() {
  print_header "Building Application"
  
  print_step "Generating Prisma client..."
  if command -v pnpm &> /dev/null; then
    pnpm db:generate 2>&1 | tail -3
  else
    npm run db:generate 2>&1 | tail -3
  fi
  
  print_step "Building Next.js application..."
  if command -v pnpm &> /dev/null; then
    pnpm build 2>&1 | tail -10
  else
    npm run build 2>&1 | tail -10
  fi
  
  print_success "Application built successfully"
}

# Create environment file
create_env_file() {
  local db_pass=$1
  
  print_header "Creating Environment File"
  
  local jwt_secret=$(openssl rand -base64 32)
  local admin_password=$(openssl rand -base64 12 | tr -d '=' | tr '+/' '0-')
  
  cat > .env.local << EOF
# Database
DATABASE_URL="postgresql://zwscloud_user:${db_pass}@localhost:5432/zwscloud"

# Admin
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="${admin_password}"
ADMIN_DISPLAY_NAME="Administrator"

# Authentication
JWT_SECRET="${jwt_secret}"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
EOF
  
  print_success "Environment file created: .env.local"
  print_info "Admin password: $admin_password (save this securely)"
}

# Print summary
print_summary() {
  print_header "Installation Complete!"
  
  echo -e "${CYAN}Your ZWS Cloud environment is ready!${NC}\n"
  
  echo -e "${GREEN}Next Steps:${NC}"
  echo "  1. Review .env.local and update configuration"
  echo "  2. Start the development server: npm run dev"
  echo "  3. Access at: http://localhost:3000"
  echo ""
  echo -e "${GREEN}Available Commands:${NC}"
  echo "  npm run dev        - Start development server"
  echo "  npm run build      - Build for production"
  echo "  npm run start      - Start production server"
  echo "  npm run db:studio  - Open Prisma Studio"
  echo "  npm run db:push    - Sync database schema"
  echo ""
  echo -e "${YELLOW}Important:${NC}"
  echo "  • Save your admin password in a secure location"
  echo "  • Update configuration in .env.local for production"
  echo "  • Configure payment gateway before deploying"
  echo ""
}

# Main flow
main() {
  print_header "ZWS Cloud - Clean Installation"
  echo ""
  echo "This script will install:"
  echo "  • Node.js & npm"
  echo "  • PostgreSQL"
  echo "  • Project dependencies"
  echo "  • Database schema"
  echo ""
  
  check_environment
  detect_os
  install_nodejs
  install_postgresql
  start_postgresql
  
  local db_pass=$(setup_database)
  
  create_env_file "$db_pass"
  
  print_header "Setting Up Project"
  install_dependencies
  run_migrations
  build_application
  
  print_summary
  
  print_success "Installation complete! Run 'npm run dev' to start"
}

main "$@"
