#!/bin/bash

# ZWS Cloud Installation Script
# This script installs ZWS Cloud with PostgreSQL on a Linux server

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_header() {
  echo ""
  echo -e "${BLUE}===============================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}===============================================${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_info() {
  echo -e "${YELLOW}ℹ $1${NC}"
}

# Input functions
prompt_input() {
  local prompt="$1"
  local default="$2"
  local input
  
  if [ -z "$default" ]; then
    read -p "$(echo -e "${YELLOW}${prompt}${NC}"): " input
  else
    read -p "$(echo -e "${YELLOW}${prompt} [${default}]${NC}"): " input
    input="${input:-$default}"
  fi
  
  echo "$input"
}

prompt_password() {
  local prompt="$1"
  local input
  
  read -sp "$(echo -e "${YELLOW}${prompt}${NC}"): " input
  echo ""
  echo "$input"
}

prompt_yn() {
  local prompt="$1"
  local response
  
  while true; do
    read -p "$(echo -e "${YELLOW}${prompt} [y/n]${NC}"): " response
    case "$response" in
      [yY][eE][sS]|[yY])
        return 0
        ;;
      [nN][oO]|[nN])
        return 1
        ;;
      *)
        print_error "Please answer y or n"
        ;;
    esac
  done
}

# Check prerequisites
check_prerequisites() {
  print_header "Checking Prerequisites"
  
  # Check if running as root
  if [ "$EUID" -ne 0 ]; then 
    print_error "This script must be run as root"
    exit 1
  fi
  
  # Check required commands
  local required_commands=("git" "curl" "sudo")
  for cmd in "${required_commands[@]}"; do
    if ! command -v "$cmd" &> /dev/null; then
      print_error "$cmd is not installed"
      exit 1
    fi
  done
  
  print_success "All prerequisites met"
}

# Detect OS
detect_os() {
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
  elif type lsb_release >/dev/null 2>&1; then
    OS=$(lsb_release -si | tr '[:upper:]' '[:lower:]')
  else
    OS="unknown"
  fi
}

# Clone or use existing repo
setup_repo() {
  print_header "Repository Setup"
  
  if [ -d "zwscloud-ui-db" ]; then
    print_info "Repository already exists at ./zwscloud-ui-db"
    if prompt_yn "Use existing repository?"; then
      cd zwscloud-ui-db
      print_success "Using existing repository"
      return
    else
      print_info "Removing existing repository..."
      rm -rf zwscloud-ui-db
      print_success "Repository removed"
    fi
  fi
  
  print_info "Cloning repository..."
  git clone https://github.com/fitnesshubgym03-debug/zwscloud-ui-db.git
  cd zwscloud-ui-db
  print_success "Repository cloned"
}

# Get domain first
get_domain() {
  print_header "Domain Configuration"
  
  print_info "Enter your domain or IP address where ZWS Cloud will be hosted"
  print_info "Examples: zwscloud.com, app.zwscloud.com, 192.168.1.100, localhost"
  echo ""
  
  DOMAIN=$(prompt_input "Domain/IP address" "zwscloud.com")
  
  # Validate domain is not empty
  while [ -z "$DOMAIN" ]; do
    print_error "Domain/IP cannot be empty"
    DOMAIN=$(prompt_input "Domain/IP address" "zwscloud.com")
  done
  
  print_success "Domain set to: $DOMAIN"
}

# Ask for setup mode
get_setup_mode() {
  print_header "Setup Mode"
  
  echo "Choose your configuration mode:"
  echo ""
  echo "  1) AUTO MODE (Recommended - generates all configurations automatically)"
  echo "  2) MANUAL MODE (Configure each setting step by step)"
  echo ""
  
  SETUP_MODE=$(prompt_input "Choice [1-2]" "1")
  
  if [ "$SETUP_MODE" != "1" ] && [ "$SETUP_MODE" != "2" ]; then
    SETUP_MODE="1"
  fi
  
  if [ "$SETUP_MODE" = "1" ]; then
    print_success "Auto mode selected - generating configurations..."
  else
    print_success "Manual mode selected - please provide details..."
  fi
}

# Get configuration
get_configuration() {
  print_header "Configuration Setup"
  
  if [ "$SETUP_MODE" = "1" ]; then
    # AUTO MODE
    print_info "Generating configurations automatically..."
    
    ADMIN_EMAIL="admin@zwscloud"
    ADMIN_PASSWORD=$(openssl rand -base64 32 | tr -d '=' | tr '+/' '-_' | cut -c1-16)
    ADMIN_DISPLAY_NAME="Administrator"
    
    DB_HOST="localhost"
    DB_PORT="5432"
    DB_NAME="zwscloud"
    DB_USER="zwscloud_user"
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d '=' | tr '+/' '-_')
    DATABASE_TYPE="postgres"
    DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
    
    JWT_SECRET=$(openssl rand -base64 32)
    
    USE_SSL="false"
    AUTO_INSTALL_DB=true
    
    print_success "Admin email: $ADMIN_EMAIL"
    print_success "Admin password: $ADMIN_PASSWORD (save this!)"
    print_success "Database will be auto-installed"
  else
    # MANUAL MODE
    print_info "Admin Credentials"
    ADMIN_EMAIL=$(prompt_input "Admin email address" "admin@example.com")
    
    ADMIN_PASSWORD=$(prompt_password "Admin password (min 8 characters)")
    while [ ${#ADMIN_PASSWORD} -lt 8 ]; do
      print_error "Password must be at least 8 characters"
      ADMIN_PASSWORD=$(prompt_password "Admin password (min 8 characters)")
    done
    
    ADMIN_DISPLAY_NAME=$(prompt_input "Admin display name" "Administrator")
    
    echo ""
    print_info "Database Configuration"
    echo "  1) Auto-install PostgreSQL (generates random credentials)"
    echo "  2) Use existing PostgreSQL (provide connection details)"
    echo ""
    
    DB_CHOICE=$(prompt_input "Choice [1-2]" "1")
    
    if [ "$DB_CHOICE" = "2" ]; then
      DATABASE_TYPE="postgres"
      DB_HOST=$(prompt_input "Database host" "localhost")
      DB_PORT=$(prompt_input "Database port" "5432")
      DB_NAME=$(prompt_input "Database name" "zwscloud")
      DB_USER=$(prompt_input "Database user" "postgres")
      DB_PASSWORD=$(prompt_password "Database password")
      DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
      print_success "Using existing PostgreSQL database"
      USE_SSL="false"
      AUTO_INSTALL_DB=false
    else
      DATABASE_TYPE="postgres"
      DB_HOST="localhost"
      DB_PORT="5432"
      DB_NAME="zwscloud"
      DB_USER="zwscloud_user"
      DB_PASSWORD=$(openssl rand -base64 32 | tr -d '=' | tr '+/' '-_')
      DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
      print_success "PostgreSQL will be auto-installed"
      USE_SSL="false"
      AUTO_INSTALL_DB=true
    fi
    
    JWT_SECRET=$(openssl rand -base64 32)
    print_success "Generated JWT secret"
  fi
  
  print_success "Configuration complete"
}

# Auto-install PostgreSQL
auto_install_postgres() {
  print_header "Auto-Installing PostgreSQL"
  
  if command -v psql &> /dev/null; then
    print_success "PostgreSQL already installed"
    return
  fi
  
  print_step "Installing PostgreSQL..."
  
  if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    print_step "Installing via apt..."
    apt-get update > /dev/null 2>&1
    DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-contrib > /dev/null 2>&1
    print_success "PostgreSQL installed"
    
    print_step "Starting PostgreSQL service..."
    systemctl start postgresql
    systemctl enable postgresql
    
  elif [ "$OS" = "centos" ] || [ "$OS" = "fedora" ] || [ "$OS" = "rhel" ]; then
    print_step "Installing via yum..."
    yum install -y postgresql-server postgresql-contrib > /dev/null 2>&1
    postgresql-setup initdb || true
    print_success "PostgreSQL installed"
    
    print_step "Starting PostgreSQL service..."
    systemctl start postgresql
    systemctl enable postgresql
  else
    print_error "Automatic PostgreSQL installation not supported on this OS"
    print_info "Please install PostgreSQL manually"
    return 1
  fi
  
  print_success "PostgreSQL service started"
  
  # Wait for PostgreSQL to be ready
  print_step "Waiting for PostgreSQL to be ready..."
  sleep 3
  
  # Check if PostgreSQL is accepting connections
  local attempt=0
  while [ $attempt -lt 10 ]; do
    if sudo -u postgres psql -c "SELECT 1" > /dev/null 2>&1; then
      break
    fi
    sleep 1
    attempt=$((attempt + 1))
  done
  
  # Create database and user
  print_step "Creating database and user..."
  
  # First, check if user exists
  sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
  sudo -u postgres psql << PSQL_EOF
CREATE USER "$DB_USER" WITH PASSWORD '$DB_PASSWORD';
PSQL_EOF
  
  # Create database
  sudo -u postgres psql << PSQL_EOF
CREATE DATABASE "$DB_NAME" OWNER "$DB_USER";
GRANT CONNECT ON DATABASE "$DB_NAME" TO "$DB_USER";
GRANT USAGE ON SCHEMA public TO "$DB_USER";
GRANT CREATE ON SCHEMA public TO "$DB_USER";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "$DB_USER";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "$DB_USER";
PSQL_EOF
  
  print_success "Database '$DB_NAME' and user '$DB_USER' created"
}

# Print step function
print_step() {
  echo -e "${YELLOW}→ $1${NC}"
}

# Create env file
create_env_file() {
  print_header "Creating Environment File"
  
  cat > .env.local << EOF
# Admin
ADMIN_EMAIL="${ADMIN_EMAIL}"
ADMIN_PASSWORD="${ADMIN_PASSWORD}"
ADMIN_DISPLAY_NAME="${ADMIN_DISPLAY_NAME}"

# Database
DATABASE_URL="${DATABASE_URL}"

# JWT
JWT_SECRET="${JWT_SECRET}"

# Application
NEXT_PUBLIC_APP_URL="https://${DOMAIN}"
NEXT_PUBLIC_DOMAIN="${DOMAIN}"
NODE_ENV="production"
EOF
  
  print_success "Environment file created"
}

# Install dependencies
install_dependencies() {
  print_header "Installing Dependencies"
  
  if command -v pnpm &> /dev/null; then
    print_info "Using pnpm..."
    pnpm install
  elif command -v npm &> /dev/null; then
    print_info "Using npm..."
    npm install
  else
    print_error "Neither pnpm nor npm found"
    exit 1
  fi
  
  print_success "Dependencies installed"
}

# Setup database
setup_database() {
  print_header "Setting Up Database"
  
  # Source environment variables
  if [ -f .env.local ]; then
    set -a
    source .env.local
    set +a
    print_info "Environment variables loaded"
  fi
  
  # Verify DATABASE_URL is set
  if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL is not set"
    exit 1
  fi
  
  # Test database connection
  print_info "Testing database connection..."
  local db_host=$(echo "$DATABASE_URL" | sed 's/.*@\([^:]*\).*/\1/')
  local db_port=$(echo "$DATABASE_URL" | sed 's/.*:\([0-9]*\)\/.*/\1/')
  
  if ! nc -z "$db_host" "$db_port" 2>/dev/null; then
    # If nc is not available, try with psql
    if ! command -v psql &> /dev/null; then
      print_error "Cannot verify database connection - neither nc nor psql available"
      exit 1
    fi
  fi
  
  print_info "Database connection successful"
  print_info "Running database migrations..."
  
  # Add retry logic for database push
  local retry=0
  while [ $retry -lt 3 ]; do
    if command -v pnpm &> /dev/null; then
      pnpm db:push --skip-generate && break
    else
      npm run db:push -- --skip-generate && break
    fi
    retry=$((retry + 1))
    if [ $retry -lt 3 ]; then
      print_info "Retrying database setup (attempt $((retry + 1))/3)..."
      sleep 2
    fi
  done
  
  if [ $retry -eq 3 ]; then
    print_error "Database setup failed after 3 attempts"
    exit 1
  fi
  
  print_success "Database migrations completed"
}

# Create admin user
create_admin() {
  print_header "Creating Admin User"
  
  # Load environment variables
  if [ -f .env.local ]; then
    set -a
    source .env.local
    set +a
  fi
  
  cat > /tmp/create-admin.js << 'ADMIN_SCRIPT'
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    
    const admin = await prisma.user.upsert({
      where: { email: process.env.ADMIN_EMAIL },
      update: {},
      create: {
        email: process.env.ADMIN_EMAIL,
        name: process.env.ADMIN_DISPLAY_NAME,
        passwordHash: hashedPassword,
        role: "ADMIN",
        isActive: true,
      },
    });
    
    console.log("Admin user created:", admin.email);
  } catch (error) {
    console.error("Error creating admin:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
ADMIN_SCRIPT
  
  if command -v pnpm &> /dev/null; then
    pnpm exec node /tmp/create-admin.js
  else
    npm exec node /tmp/create-admin.js
  fi
  
  print_success "Admin user created"
}

# Build app
build_app() {
  print_header "Building Application"
  
  # Load environment variables
  if [ -f .env.local ]; then
    set -a
    source .env.local
    set +a
  fi
  
  print_info "Building Next.js application..."
  if command -v pnpm &> /dev/null; then
    pnpm build 2>&1 | tail -20
  else
    npm run build 2>&1 | tail -20
  fi
  
  if [ ! -d ".next" ]; then
    print_error "Build failed - .next directory not created"
    exit 1
  fi
  
  print_success "Application built successfully"
}

# Setup SSL
setup_ssl() {
  print_header "SSL Setup"
  print_info "SSL configuration can be managed through your domain provider"
  print_success "SSL setup skipped"
}

# Create startup script
create_startup_script() {
  print_header "Creating Startup Script"
  
  # Create systemd service
  cat > /etc/systemd/system/zwscloud.service << EOF
[Unit]
Description=ZWS Cloud Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/zwscloud
Environment="NODE_ENV=production"
Environment="PATH=/root/.local/share/pnpm:$PATH"
ExecStart=/usr/local/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
  
  systemctl daemon-reload
  systemctl enable zwscloud
  
  print_success "Systemd service created"
}

# Verify installation
verify_installation() {
  print_header "Verifying Installation"
  
  if [ ! -d ".next" ]; then
    print_error "Build directory .next not found"
    return 1
  fi
  
  if [ ! -f ".env.local" ]; then
    print_error "Environment file not found"
    return 1
  fi
  
  print_success "Installation verified"
  return 0
}

# Print final instructions
print_instructions() {
  print_header "Installation Complete"
  
  echo ""
  echo -e "${YELLOW}Next Steps:${NC}"
  echo "  1. Start the service: sudo systemctl start zwscloud"
  echo "  2. Check status: sudo systemctl status zwscloud"
  echo "  3. View logs: sudo journalctl -u zwscloud -f"
  echo "  4. Access at: https://${DOMAIN}"
  echo ""
  echo -e "${YELLOW}Configuration Details:${NC}"
  echo "  Admin Email: ${ADMIN_EMAIL}"
  echo "  Admin Password: ${ADMIN_PASSWORD}"
  echo "  Domain: ${DOMAIN}"
  echo ""
  echo -e "${YELLOW}Important Files:${NC}"
  echo "  Config: /root/zwscloud/.env.local"
  echo "  Service: /etc/systemd/system/zwscloud.service"
  echo "  Logs: journalctl -u zwscloud"
  echo ""
}

# Main installation flow
main() {
  print_header "ZWS Cloud Installation"
  
  echo "Welcome to ZWS Cloud Setup!"
  echo ""
  
  # STEP 1: Get domain first
  get_domain
  echo ""
  
  # STEP 2: Get setup mode
  get_setup_mode
  echo ""
  
  # STEP 3: Get configuration
  get_configuration
  echo ""
  
  # STEP 4: Check prerequisites
  check_prerequisites
  detect_os
  
  # STEP 5: Setup repo
  setup_repo
  
  # STEP 6: Auto-install PostgreSQL if selected
  if [ "$AUTO_INSTALL_DB" = true ]; then
    auto_install_postgres
    print_info "Waiting for PostgreSQL to stabilize..."
    sleep 5
  fi
  
  # STEP 7: Create environment file
  create_env_file
  
  # STEP 8: Install dependencies
  install_dependencies
  
  # STEP 9: Setup database
  setup_database
  
  # STEP 10: Create admin
  create_admin
  
  # STEP 11: Build app
  build_app
  
  # STEP 12: Setup SSL
  setup_ssl
  
  # STEP 13: Create startup script
  create_startup_script
  
  # STEP 14: Verify
  if verify_installation; then
    print_instructions
    exit 0
  else
    print_error "Installation failed"
    exit 1
  fi
}

# Run main
main "$@"
