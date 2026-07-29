#!/bin/bash

###############################################################################
# ZWS Cloud - Master Installer
# Fully automatic installation with one bash command
# Usage: bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/installer.sh)
# Or: bash installer.sh
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

# Configure access URL (domain or IP)
configure_app_url() {
  print_header "Configure Application Access"
  
  echo "How would you like to access ZWS Cloud?"
  echo ""
  echo "1) Custom Domain (default: zwscloud)"
  echo "2) Use Server IP Address"
  echo ""
  
  read -p "Select (1 or 2) [default: 1]: " url_choice
  url_choice=${url_choice:-1}
  
  case $url_choice in
    1)
      read -p "Enter domain name [default: zwscloud]: " domain_input
      DOMAIN_NAME=${domain_input:-zwscloud}
      APP_URL="http://$DOMAIN_NAME"
      print_success "Using domain: $DOMAIN_NAME"
      ;;
    2)
      PUBLIC_IP=$(curl -s https://api.ipify.org 2>/dev/null || echo "127.0.0.1")
      APP_URL="http://$PUBLIC_IP:3000"
      print_success "Using server IP: $PUBLIC_IP"
      ;;
    *)
      DOMAIN_NAME="zwscloud"
      APP_URL="http://zwscloud"
      print_warning "Invalid choice, using default domain"
      ;;
  esac
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
create_admin_user() {
  print_header "Creating Admin User"
  
  set +e
  
  cat > ./.admin-setup.mjs << 'ADMIN_SCRIPT'
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@zwscloud';
    const password = process.env.ADMIN_PASSWORD;
    const displayName = process.env.ADMIN_DISPLAY_NAME || 'Administrator';
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const existing = await prisma.user.findUnique({ where: { email } }).catch(() => null);
    if (existing) {
      console.log(`✓ Admin already exists: ${email}`);
      process.exit(0);
    }
    
    const admin = await prisma.user.create({
      data: {
        email,
        name: displayName,
        passwordHash: hashedPassword,
        role: "ADMIN",
        isActive: true,
      },
    }).catch(() => null);
    
    if (admin) {
      console.log(`✓ Admin created: ${admin.email}`);
    }
  } catch (error) {
    console.error(`Note: ${error.message}`);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

createAdmin();
ADMIN_SCRIPT
  
  print_step "Setting up admin user..."
  if command -v pnpm &> /dev/null; then
    pnpm node ./.admin-setup.mjs 2>&1 || print_warning "Admin setup will retry on next start"
  else
    node ./.admin-setup.mjs 2>&1 || print_warning "Admin setup will retry on next start"
  fi
  
  rm -f ./.admin-setup.mjs
  print_success "Admin setup completed"
  
  set -e
}

build_application() {
  print_header "Building Application"
  
  print_step "Generating Prisma client..."
  if command -v pnpm &> /dev/null; then
    pnpm db:generate 2>&1 | tail -3
  else
    npm run db:generate 2>&1 | tail -3
  fi
  
  print_step "Building application..."
  if command -v pnpm &> /dev/null; then
    pnpm build 2>&1 | tail -5 || print_warning "Build completed with warnings"
  else
    npm run build 2>&1 | tail -5 || print_warning "Build completed with warnings"
  fi
  
  print_success "Application built"
}

print_summary() {
  print_header "Installation Complete!"
  
  echo -e "${CYAN}✓ ZWS Cloud is ready to use!${NC}\n"
  
  echo -e "${GREEN}🌐 Access Information:${NC}"
  echo "  Application URL:    $APP_URL"
  echo ""
  
  echo -e "${GREEN}🔐 Admin Credentials:${NC}"
  echo "  Email:     $ADMIN_EMAIL"
  echo "  Password:  $ADMIN_PASSWORD"
  echo ""
  
  echo -e "${GREEN}📊 Next Steps:${NC}"
  echo "  1. Start the application:"
  echo "     npm run dev     (development)"
  echo "     npm start       (production)"
  echo "  2. Open browser: $APP_URL"
  echo "  3. Login with admin credentials above"
  echo "  4. Change admin password immediately!"
  echo ""
  
  echo -e "${GREEN}📖 Available Commands:${NC}"
  echo "  npm run dev        - Start development server"
  echo "  npm run build      - Build for production"
  echo "  npm run start      - Start production server"
  echo "  npm run db:studio  - Open Prisma Studio"
  echo "  npm run db:push    - Sync database schema"
  echo ""
  
  echo -e "${YELLOW}⚠️  Important:${NC}"
  echo "  • Save credentials in a secure location!"
  echo "  • Change admin password immediately after login"
  echo "  • Review .env.local configuration"
  echo "  • Setup SSL/HTTPS for production"
  echo "  • Update configuration in .env.local for production"
  echo "  • Configure payment gateway before deploying"
  echo ""
}

# Main flow
main() {
  print_header "ZWS Cloud - Master Installer"
  echo ""
  echo "This fully automatic installer will:"
  echo "  • Install Node.js & npm"
  echo "  • Install PostgreSQL"
  echo "  • Configure application access (domain or IP)"
  echo "  • Setup database & migrations"
  echo "  • Create admin user with random credentials"
  echo "  • Build the application"
  echo ""
  
  read -p "Continue installation? (y/n) [default: y]: " confirm
  confirm=${confirm:-y}
  if [[ $confirm != "y" && $confirm != "Y" ]]; then
    print_info "Installation cancelled"
    exit 0
  fi
  
  check_environment
  detect_os
  install_nodejs
  install_postgresql
  start_postgresql
  
  local db_pass=$(setup_database)
  
  configure_app_url
  create_env_file "$db_pass"
  
  print_header "Setting Up Project"
  install_dependencies
  run_migrations
  create_admin_user
  build_application
  
  print_summary
  
  print_success "✓ Installation complete!"
  print_info "Start with: npm run dev (development) or npm start (production)"
}

main "$@"
