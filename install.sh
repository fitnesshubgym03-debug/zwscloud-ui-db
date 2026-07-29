#!/bin/bash

###############################################################################
# ZWS Cloud - One-Line Installer Script
# Usage: bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install.sh)
# Or:    curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install.sh | bash
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
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

prompt_password() {
  local prompt="$1"
  local input
  
  read -sp "$(echo -e ${YELLOW}${prompt}${NC}): " input
  echo ""
  echo "$input"
}

prompt_yn() {
  local prompt="$1"
  local response
  
  while true; do
    read -p "$(echo -e ${YELLOW}${prompt} [y/n]${NC}): " response
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
  
  local missing=0
  
  if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    missing=1
  else
    print_success "Node.js $(node -v)"
  fi
  
  if ! command -v pnpm &> /dev/null; then
    if ! command -v npm &> /dev/null; then
      print_error "npm/pnpm is not installed"
      missing=1
    else
      print_success "npm $(npm -v)"
    fi
  else
    print_success "pnpm $(pnpm -v)"
  fi
  
  if ! command -v git &> /dev/null; then
    print_error "git is not installed"
    missing=1
  else
    print_success "git $(git -v | awk '{print $3}')"
  fi
  
  if [ $missing -eq 1 ]; then
    print_error "Please install missing dependencies and try again"
    exit 1
  fi
}

# Clone or use existing repo
setup_repo() {
  print_header "Repository Setup"
  
  if [ -d "zwscloud-ui-db" ]; then
    print_info "Repository already exists at ./zwscloud-ui-db"
    if ! prompt_yn "Use existing repository?"; then
      print_info "Removing existing repository..."
      rm -rf zwscloud-ui-db
      print_success "Repository removed"
    else
      cd zwscloud-ui-db
      print_success "Using existing repository"
      return
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
  
  DOMAIN=$(prompt_input "Domain/IP address" "")
  
  # Validate domain is not empty
  while [ -z "$DOMAIN" ]; then
    print_error "Domain/IP cannot be empty"
    DOMAIN=$(prompt_input "Domain/IP address" "")
  done
  
  print_success "Domain set to: $DOMAIN"
}

# Ask for setup mode (auto or manual)
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

# Get configuration (AFTER domain is set)
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

# Create .env file
create_env_file() {
  print_header "Creating Environment File"
  
  cat > .env.local << EOF
# Admin Credentials
ADMIN_EMAIL="${ADMIN_EMAIL}"
ADMIN_PASSWORD="${ADMIN_PASSWORD}"
ADMIN_DISPLAY_NAME="${ADMIN_DISPLAY_NAME}"

# Database
DATABASE_URL="${DATABASE_URL}"

# JWT
JWT_SECRET="${JWT_SECRET}"

# Payment Gateway (configure in admin panel)
DEFAULT_PAYMENT_GATEWAY="razorpay"

# Application
NEXT_PUBLIC_APP_URL="https://${DOMAIN}"
NEXT_PUBLIC_DOMAIN="${DOMAIN}"
NODE_ENV="production"
EOF

  print_success "Environment file created at .env.local"
}

# Auto-install PostgreSQL
auto_install_postgres() {
  print_header "Auto-Installing PostgreSQL"
  
  if command -v psql &> /dev/null; then
    print_info "PostgreSQL already installed"
    return
  fi
  
  print_info "Installing PostgreSQL..."
  
  if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
    sudo apt-get update > /dev/null 2>&1
    sudo apt-get install -y postgresql postgresql-contrib > /dev/null 2>&1
    print_success "PostgreSQL installed"
  elif [[ "$OS" == "centos" ]] || [[ "$OS" == "fedora" ]]; then
    sudo yum install -y postgresql-server postgresql-contrib > /dev/null 2>&1
    sudo postgresql-setup initdb || true
    print_success "PostgreSQL installed"
  else
    print_info "Please install PostgreSQL manually"
    return
  fi
  
  # Start PostgreSQL service
  if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
  elif [[ "$OS" == "centos" ]] || [[ "$OS" == "fedora" ]]; then
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
  fi
  
  print_success "PostgreSQL service started"
  
  # Create database and user
  print_info "Creating database and user..."
  sudo -u postgres psql << PSQL_EOF
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD' CREATEDB;
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT CONNECT ON DATABASE $DB_NAME TO $DB_USER;
GRANT USAGE ON SCHEMA public TO $DB_USER;
GRANT CREATE ON SCHEMA public TO $DB_USER;
PSQL_EOF
  
  print_success "Database '$DB_NAME' and user '$DB_USER' created"
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
  fi
  
  print_success "Dependencies installed"
}

# Setup database
setup_database() {
  print_header "Setting Up Database"
  
  print_info "Running database migrations..."
  if command -v pnpm &> /dev/null; then
    pnpm db:push --skip-generate
  else
    npm run db:push -- --skip-generate
  fi
  
  print_success "Database migrations completed"
}

# Create admin user
create_admin() {
  print_header "Creating Admin User"
  
  print_info "Creating admin account..."
  
  # Direct database insertion using Node script
  cat > /tmp/create-admin.js << 'EOFADMIN'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const prisma = new PrismaClient();
  
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_DISPLAY_NAME;
    
    // Check if admin already exists
    const existing = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (existing) {
      console.log('Admin user already exists');
      process.exit(0);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Create admin
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        hashedPassword: hashedPassword,
        role: 'super_admin'
      }
    });
    
    console.log('✓ Admin user created successfully');
    console.log('  Email:', admin.email);
    console.log('  Name:', admin.name);
    process.exit(0);
  } catch (error) {
    console.error('✗ Failed to create admin:', error.message);
    process.exit(1);
  }
}

createAdmin();
EOFADMIN

  if command -v pnpm &> /dev/null; then
    pnpm exec node /tmp/create-admin.js
  else
    npm exec node /tmp/create-admin.js
  fi
  
  print_success "Admin user created"
}

# Build application
build_app() {
  print_header "Building Application"
  
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

# Setup SSL (optional)
setup_ssl() {
  if [ "$USE_SSL" = "true" ] && [[ "$DOMAIN" == *.*.* ]]; then
    print_header "Setting Up SSL Certificate"
    
    if ! command -v certbot &> /dev/null; then
      print_info "certbot not found, skipping SSL setup"
      print_info "To setup SSL later, run: sudo certbot certonly --standalone -d $DOMAIN"
      return
    fi
    
    print_info "Generating SSL certificate for $DOMAIN..."
    sudo certbot certonly --standalone -d "$DOMAIN" --non-interactive --agree-tos --email "${ADMIN_EMAIL}"
    
    if [ $? -eq 0 ]; then
      print_success "SSL certificate created successfully"
      print_info "Certificate location: /etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
      print_info "Key location: /etc/letsencrypt/live/${DOMAIN}/privkey.pem"
    fi
  fi
}

# Create startup script
create_startup_script() {
  print_header "Creating Startup Script"
  
  cat > start.sh << 'EOF'
#!/bin/bash

# Load environment
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Start Next.js in production
if command -v pnpm &> /dev/null; then
  pnpm start
else
  npm start
fi
EOF

  chmod +x start.sh
  print_success "Startup script created"
}

# Verify installation
verify_installation() {
  print_header "Verifying Installation"
  
  print_info "Checking files..."
  
  local files_ok=true
  
  if [ ! -f "package.json" ]; then
    print_error "package.json not found"
    files_ok=false
  else
    print_success "package.json found"
  fi
  
  if [ ! -f ".env.local" ]; then
    print_error ".env.local not found"
    files_ok=false
  else
    print_success ".env.local configured"
  fi
  
  if [ ! -d "node_modules" ]; then
    print_error "node_modules not found"
    files_ok=false
  else
    print_success "Dependencies installed"
  fi
  
  if [ ! -d ".next" ]; then
    print_error "Application not built"
    files_ok=false
  else
    print_success "Application built"
  fi
  
  if [ "$files_ok" = false ]; then
    print_error "Installation verification failed"
    return 1
  fi
  
  print_success "Installation verification passed"
  return 0
}

# Print startup instructions
print_instructions() {
  print_header "Installation Complete!"
  
  echo ""
  echo -e "${GREEN}Your ZWS Cloud application is ready to start!${NC}"
  echo ""
  echo -e "${YELLOW}Next Steps:${NC}"
  echo ""
  echo "1. Start the application:"
  echo -e "   ${BLUE}./start.sh${NC}"
  echo "   or"
  echo -e "   ${BLUE}pnpm start${NC}"
  echo ""
  echo "2. Access the application:"
  echo -e "   ${BLUE}https://${DOMAIN}${NC}"
  echo ""
  echo "3. Admin Login Credentials:"
  echo -e "   ${BLUE}Email:    ${ADMIN_EMAIL}${NC}"
  echo -e "   ${BLUE}Password: (the password you entered)${NC}"
  echo ""
  echo -e "${YELLOW}Configuration Details:${NC}"
  echo -e "   Domain:          ${BLUE}${DOMAIN}${NC}"
  echo -e "   Payment Gateway: ${BLUE}${PAYMENT_GATEWAY}${NC}"
  echo -e "   Database Type:   ${BLUE}${DATABASE_TYPE}${NC}"
  echo ""
  echo -e "${YELLOW}Important Files:${NC}"
  echo -e "   .env.local       - Environment configuration"
  echo -e "   start.sh         - Startup script"
  echo ""
  echo -e "${YELLOW}Documentation:${NC}"
  echo -e "   INTEGRATION_SETUP.md - Integration setup guide"
  echo -e "   IMPLEMENTATION_SUMMARY.md - Feature overview"
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
  
  # STEP 3: Get other configuration
  get_configuration
  echo ""
  
  # STEP 4: Prerequisites
  check_prerequisites
  
  # STEP 5: Setup repo
  setup_repo
  
  # STEP 6: Auto-install PostgreSQL if selected
  if [ "$AUTO_INSTALL_DB" = true ]; then
    auto_install_postgres
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

# Run main if not sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
