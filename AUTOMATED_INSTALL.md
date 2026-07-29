# ZWS Cloud - Fully Automated Installation Guide

## Quick Start (One Command)

The automated installer will install **everything** - including Node.js, npm, git, and all project dependencies:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install-auto.sh)
```

That's it! No prerequisites needed.

---

## What Gets Installed Automatically

The installer automatically detects your OS and installs:

### System Dependencies
- **Node.js 20 LTS** - JavaScript runtime
- **npm** - Node package manager
- **pnpm** - Fast package manager (recommended)
- **git** - Version control
- **curl** - Data transfer tool
- **openssl** - SSL/TLS library

### Project Setup
- Clones the repository
- Installs all project dependencies
- Creates environment configuration
- Sets up database schema
- Creates admin user
- Builds the application

### Configuration Prompts
During installation, you'll be asked for:
- Admin email and password
- Payment gateway (Razorpay or Cashfree)
- Domain name (optional)
- Database type (PostgreSQL or MySQL)
- Database credentials

---

## Supported Operating Systems

### Linux
- ✅ Ubuntu 20.04+ LTS
- ✅ Debian 10+
- ✅ CentOS 7+
- ✅ Fedora 30+
- ✅ RHEL 7+

### macOS
- ✅ macOS 10.15+ (Catalina)
- ✅ All newer versions

### Other
- Windows WSL (Windows Subsystem for Linux)
- Docker/Container Linux

---

## Installation Steps

### Step 1: Run the Installer
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install-auto.sh)
```

### Step 2: Answer Configuration Questions

#### Admin User
```
Admin email address [admin@example.com]: your-email@example.com
Admin password (min 8 characters): YourSecurePassword@123
Admin display name [Administrator]: Your Name
```

#### Payment Gateway
```
1) Razorpay (recommended for automatic recurring billing)
2) Cashfree
Choice [1-2]: 1
```

If Razorpay:
```
Razorpay Key ID (optional, can add later): rzp_test_xxxxx
Razorpay Key Secret: xxxxxxxxxxxxxxxx
```

#### Domain Configuration
```
Do you have a domain name? [y/n]: n
Generate self-signed SSL certificate? [y/n]: y
```

#### Database Setup
```
1) PostgreSQL (recommended)
2) MySQL
Choice [1-2]: 1

PostgreSQL Host [localhost]: localhost
PostgreSQL Port [5432]: 5432
PostgreSQL User [postgres]: postgres
PostgreSQL Password: your-db-password
Database Name [zwscloud]: zwscloud
```

### Step 3: Wait for Installation
The installer will:
- Install dependencies (5-10 minutes depending on internet speed)
- Clone repository (1-2 minutes)
- Install project packages (2-5 minutes)
- Set up database (1 minute)
- Build application (3-5 minutes)

### Step 4: Start the Application
```bash
./start.sh
```

Or manually:
```bash
pnpm start
```

Access your application at: `http://localhost:3000`

---

## Default Configuration After Installation

### Admin Login
```
Email: (as you entered)
Password: (as you entered)
```

### Database
```
Type: PostgreSQL or MySQL (as you chose)
Host: localhost (or custom)
Database: zwscloud (or custom)
```

### Payment Gateway
```
Provider: Razorpay or Cashfree (as you chose)
Mode: test (for testing)
```

### Access URLs
- **Frontend**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin
- **API**: http://localhost:3000/api

---

## Troubleshooting

### "Command not found: bash"
You need to install bash first:
```bash
# Ubuntu/Debian
sudo apt-get install bash

# CentOS/Fedora
sudo yum install bash

# macOS
brew install bash
```

### "curl: command not found"
The installer will try to install curl automatically. If it fails:
```bash
# Ubuntu/Debian
sudo apt-get install curl

# CentOS/Fedora
sudo yum install curl

# macOS
brew install curl
```

### "Permission denied" on install.sh
Make the script executable first:
```bash
chmod +x install-auto.sh
bash install-auto.sh
```

### Database Connection Error
Make sure your database server is running:
```bash
# Check PostgreSQL (default port 5432)
psql -h localhost -U postgres -d zwscloud

# Check MySQL (default port 3306)
mysql -h localhost -u root -p zwscloud
```

### Node.js Installation Failed
Try installing manually:
```bash
# macOS with Homebrew
brew install node

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/Fedora
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

### Port 3000 Already in Use
The application uses port 3000 by default. To use a different port:
```bash
PORT=3001 pnpm start
```

---

## Environment File

After installation, edit `.env.production.local` to update settings:

```bash
nano .env.production.local
```

Key variables:
- `DATABASE_URL` - Database connection string
- `ADMIN_EMAIL` - Admin login email
- `ADMIN_PASSWORD` - Admin login password
- `JWT_SECRET` - Token signing secret
- `RAZORPAY_KEY_ID` - Payment gateway key
- `DEFAULT_PAYMENT_GATEWAY` - "razorpay" or "cashfree"

---

## Post-Installation

### 1. Change Admin Password
Log in with your admin credentials and change the password immediately.

### 2. Configure Payment Webhooks
If using Razorpay:
1. Go to Razorpay Dashboard
2. Settings → Webhooks
3. Add webhook URL: `https://your-domain/api/payments/razorpay-webhook`

### 3. Set Up Production Domain
If you want to use a custom domain:
1. Update `.env.production.local` with your domain
2. Configure SSL certificate
3. Set up reverse proxy (nginx, Apache, etc.)

### 4. Database Backups
Create regular backups of your database:
```bash
# PostgreSQL
pg_dump -U postgres zwscloud > backup.sql

# MySQL
mysqldump -u root -p zwscloud > backup.sql
```

---

## Uninstallation

To remove ZWS Cloud:

```bash
# Stop the application
pkill -f "pnpm start"

# Remove the directory
rm -rf ~/zwscloud-ui-db

# Remove database (optional)
# PostgreSQL
dropdb -U postgres zwscloud

# MySQL
mysql -u root -p -e "DROP DATABASE zwscloud;"

# Remove system packages (optional)
# Ubuntu/Debian
sudo apt-get autoremove nodejs npm pnpm

# CentOS/Fedora
sudo yum autoremove nodejs npm pnpm
```

---

## Getting Help

- **Documentation**: See `DOCUMENTATION_INDEX.md` for all guides
- **Issues**: https://github.com/fitnesshubgym03-debug/zwscloud-ui-db/issues
- **Discussions**: https://github.com/fitnesshubgym03-debug/zwscloud-ui-db/discussions

---

## Version Information

This installer is for:
- **ZWS Cloud**: Latest version
- **Node.js**: 20 LTS
- **npm/pnpm**: Latest
- **Database**: PostgreSQL 12+ or MySQL 8.0+

**Last Updated**: 2026-07-29
