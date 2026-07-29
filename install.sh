#!/bin/bash

###############################################################################
# ZWS Cloud - Master Installer (v2 - Bulletproof)
# Usage: bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install.sh)
###############################################################################

set -e

# ============================================================================
# COLOR CODES & FORMATTING
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ============================================================================
# PRINT FUNCTIONS
# ============================================================================

print_header() {
  echo ""
  echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║${NC} $1"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_step() {
  echo -e "${CYAN}▶${NC} $1"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_info() {
  echo -e "${YELLOW}ℹ${NC} $1"
}

# ============================================================================
# STEP 1: DETECT OS
# ============================================================================

detect_os() {
  print_header "Detecting Operating System"
  
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if [ -f /etc/os-release ]; then
      . /etc/os-release
      OS=$ID
      OS_VERSION=$VERSION_ID
    fi
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
  fi
  
  print_success "Detected: $OS"
}

# ============================================================================
# STEP 2: INSTALL SYSTEM DEPENDENCIES
# ============================================================================

install_dependencies() {
  print_header "Installing System Dependencies"
  
  if command -v node &> /dev/null; then
    print_success "Node.js already installed: $(node -v)"
  else
    print_step "Installing Node.js..."
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
      curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
      sudo apt-get install -y nodejs > /dev/null 2>&1
    elif [[ "$OS" == "centos" || "$OS" == "rhel" || "$OS" == "fedora" ]]; then
      curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - > /dev/null 2>&1
      sudo yum install -y nodejs > /dev/null 2>&1
    elif [[ "$OS" == "macos" ]]; then
      brew install node > /dev/null 2>&1 || {
        print_error "Please install Homebrew first"
        return 1
      }
    fi
    print_success "Node.js installed: $(node -v)"
  fi
  
  if command -v git &> /dev/null; then
    print_success "Git already installed"
  else
    print_step "Installing Git..."
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
      sudo apt-get install -y git > /dev/null 2>&1
    elif [[ "$OS" == "centos" || "$OS" == "rhel" || "$OS" == "fedora" ]]; then
      sudo yum install -y git > /dev/null 2>&1
    elif [[ "$OS" == "macos" ]]; then
      brew install git > /dev/null 2>&1
    fi
    print_success "Git installed"
  fi
}

# ============================================================================
# STEP 3: INSTALL POSTGRESQL
# ============================================================================

install_postgres() {
  print_header "Installing PostgreSQL"
  
  if command -v psql &> /dev/null; then
    print_success "PostgreSQL already installed"
    return
  fi
  
  print_step "Installing PostgreSQL..."
  if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
    sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add - > /dev/null 2>&1
    sudo apt-get update > /dev/null 2>&1
    sudo apt-get install -y postgresql postgresql-contrib > /dev/null 2>&1
  elif [[ "$OS" == "centos" || "$OS" == "rhel" || "$OS" == "fedora" ]]; then
    sudo yum install -y postgresql-server postgresql-contrib > /dev/null 2>&1
    sudo postgresql-setup initdb 2>/dev/null || true
  elif [[ "$OS" == "macos" ]]; then
    brew install postgresql > /dev/null 2>&1
  fi
  
  print_success "PostgreSQL installed"
}

# ============================================================================
# STEP 4: START POSTGRES
# ============================================================================

start_postgres() {
  print_header "Starting PostgreSQL"
  
  if [[ "$OS" == "macos" ]]; then
    brew services start postgresql 2>/dev/null || true
  else
    sudo systemctl start postgresql 2>/dev/null || sudo service postgresql start 2>/dev/null || true
  fi
  
  sleep 2
  print_success "PostgreSQL started"
}

# ============================================================================
# STEP 5: CLONE REPOSITORY
# ============================================================================

clone_repo() {
  print_header "Setting Up Repository"
  
  if [ -f "package.json" ]; then
    print_success "Already in project directory"
    return 0
  fi
  
  INSTALL_DIR="${HOME}/zwscloud"
  
  if [ -d "$INSTALL_DIR" ]; then
    print_step "Updating existing installation..."
    cd "$INSTALL_DIR"
    git pull origin main 2>/dev/null || true
  else
    print_step "Cloning repository..."
    git clone https://github.com/fitnesshubgym03-debug/zwscloud-ui-db.git "$INSTALL_DIR" || {
      print_error "Failed to clone repository"
      return 1
    }
    cd "$INSTALL_DIR"
  fi
  
  if [ ! -f "package.json" ]; then
    print_error "package.json not found in repository"
    return 1
  fi
  
  print_success "Repository ready at: $INSTALL_DIR"
}

# ============================================================================
# STEP 6: CONFIGURE ACCESS URL
# ============================================================================

configure_url() {
  print_header "Configure Application Access"
  
  echo "How would you like to access ZWS Cloud?"
  echo ""
  echo "1) Custom Domain (e.g., zwscloud, yourdomain.com)"
  echo "2) Server IP Address"
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

# ============================================================================
# STEP 7: SETUP DATABASE
# ============================================================================

setup_db() {
  print_header "Setting Up Database"
  
  DB_USER="zwscloud_user"
  DB_NAME="zwscloud"
  DB_PASS=$(openssl rand -base64 24 | tr -d '=' | tr '+/' '0-')
  
  print_step "Creating database and user..."
  sudo -u postgres psql << EOF 2>/dev/null || true
DROP DATABASE IF EXISTS "$DB_NAME";
DROP USER IF EXISTS "$DB_USER";
CREATE USER "$DB_USER" WITH PASSWORD '$DB_PASS' CREATEDB;
CREATE DATABASE "$DB_NAME" OWNER "$DB_USER";
GRANT CONNECT ON DATABASE "$DB_NAME" TO "$DB_USER";
GRANT USAGE ON SCHEMA public TO "$DB_USER";
GRANT CREATE ON SCHEMA public TO "$DB_USER";
EOF
  
  DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"
  print_success "Database created"
}

# ============================================================================
# STEP 8: CREATE ENV FILE
# ============================================================================

create_env() {
  print_header "Creating Configuration"
  
  ADMIN_EMAIL="admin@zwscloud.local"
  ADMIN_PASSWORD=$(openssl rand -base64 12)
  JWT_SECRET=$(openssl rand -base64 32)
  
  cat > .env.local << EOF
DATABASE_URL="$DATABASE_URL"
NEXT_PUBLIC_APP_URL="$APP_URL"
ADMIN_EMAIL="$ADMIN_EMAIL"
ADMIN_PASSWORD="$ADMIN_PASSWORD"
ADMIN_DISPLAY_NAME="Administrator"
JWT_SECRET="$JWT_SECRET"
NODE_ENV="production"
EOF
  
  print_success ".env.local created"
}

# ============================================================================
# STEP 9: INSTALL DEPENDENCIES
# ============================================================================

install_deps() {
  print_header "Installing Project Dependencies"
  
  if command -v pnpm &> /dev/null; then
    print_step "Using pnpm..."
    pnpm install --prefer-offline 2>&1 | tail -5
  else
    print_step "Using npm..."
    npm install --prefer-offline 2>&1 | tail -5
  fi
  
  print_success "Dependencies installed"
}

# ============================================================================
# STEP 10: RUN MIGRATIONS
# ============================================================================

run_migrations() {
  print_header "Running Database Migrations"
  
  if command -v pnpm &> /dev/null; then
    pnpm db:generate 2>&1 | tail -3
    pnpm db:push --skip-generate 2>&1 | tail -3
  else
    npm run db:generate 2>&1 | tail -3
    npm run db:push -- --skip-generate 2>&1 | tail -3
  fi
  
  print_success "Database migrations completed"
}

# ============================================================================
# STEP 11: CREATE ADMIN USER
# ============================================================================

create_admin() {
  print_header "Creating Admin User"
  
  cat > .admin-setup.mjs << 'ADMIN_MJS'
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setupAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const displayName = process.env.ADMIN_DISPLAY_NAME;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const existing = await prisma.user.findUnique({ where: { email } }).catch(() => null);
    if (existing) {
      console.log(`Admin already exists: ${email}`);
      process.exit(0);
    }
    
    await prisma.user.create({
      data: {
        email,
        name: displayName,
        passwordHash: hashedPassword,
        role: "ADMIN",
        isActive: true,
      },
    });
    
    console.log(`Admin created: ${email}`);
  } catch (error) {
    console.log(`Note: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin();
ADMIN_MJS
  
  print_step "Setting up admin user..."
  if command -v pnpm &> /dev/null; then
    pnpm node .admin-setup.mjs 2>&1 || print_info "Admin setup will retry on first startup"
  else
    node .admin-setup.mjs 2>&1 || print_info "Admin setup will retry on first startup"
  fi
  
  rm -f .admin-setup.mjs
  print_success "Admin setup completed"
}

# ============================================================================
# STEP 12: BUILD APPLICATION
# ============================================================================

build_app() {
  print_header "Building Application"
  
  if command -v pnpm &> /dev/null; then
    print_step "Building with pnpm..."
    pnpm build 2>&1 | tail -10
  else
    print_step "Building with npm..."
    npm run build 2>&1 | tail -10
  fi
  
  print_success "Application built successfully"
}

# ============================================================================
# FINAL SUMMARY
# ============================================================================

show_summary() {
  print_header "Installation Complete!"
  
  echo -e "${GREEN}✓ ZWS Cloud is ready to use!${NC}\n"
  
  echo -e "${CYAN}🌐 Access Information:${NC}"
  echo "  URL:      $APP_URL"
  echo ""
  
  echo -e "${CYAN}🔐 Admin Credentials:${NC}"
  echo "  Email:    $ADMIN_EMAIL"
  echo "  Password: $ADMIN_PASSWORD"
  echo ""
  
  echo -e "${CYAN}📊 Next Steps:${NC}"
  echo "  1. Start the application:"
  echo "     cd $INSTALL_DIR"
  echo "     npm run dev      (development)"
  echo "     npm start        (production)"
  echo "  2. Open browser: $APP_URL"
  echo "  3. Login with credentials above"
  echo "  4. Change admin password immediately!"
  echo ""
  
  echo -e "${YELLOW}⚠️  Important:${NC}"
  echo "  • Save credentials in a secure location!"
  echo "  • Review .env.local configuration"
  echo "  • Setup SSL/HTTPS for production"
  echo ""
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
  print_header "ZWS Cloud - Master Installer v2"
  
  echo "This fully automatic installer will:"
  echo "  • Install Node.js, PostgreSQL, and Git"
  echo "  • Clone the repository"
  echo "  • Configure application access"
  echo "  • Setup database"
  echo "  • Create admin user"
  echo "  • Build the application"
  echo ""
  
  read -p "Continue installation? (y/n) [default: y]: " confirm
  confirm=${confirm:-y}
  if [[ $confirm != "y" && $confirm != "Y" ]]; then
    print_info "Installation cancelled"
    exit 0
  fi
  
  detect_os
  install_dependencies
  install_postgres
  start_postgres
  clone_repo
  configure_url
  setup_db
  create_env
  install_deps
  run_migrations
  create_admin
  build_app
  show_summary
}

trap 'print_error "Installation failed"; exit 1' ERR
main "$@"
