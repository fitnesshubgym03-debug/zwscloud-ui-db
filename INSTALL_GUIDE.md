# ZWS Cloud Installation Guide

## Installation Scripts Overview

This project includes four installation scripts optimized for different use cases. Choose based on your needs:

| Script | Best For | Complexity | Customization |
|--------|----------|-----------|---------------|
| `install-clean.sh` | Local dev / Fresh installs | Low | Minimal |
| `install-auto.sh` | Interactive setup | Medium | High |
| `install-unified.sh` | Production deployment | Medium | Low |
| `install.sh` | Advanced configuration | High | Very High |

---

## Quick Start - Clean Install (Recommended for Development)

Perfect for getting started locally or on a fresh server:

```bash
bash install-clean.sh
```

### What it does:
✓ Auto-detects your OS (Ubuntu, Debian, CentOS, RHEL, macOS)  
✓ Installs Node.js and npm  
✓ Installs and starts PostgreSQL  
✓ Creates database with secure random credentials  
✓ Installs all project dependencies  
✓ Runs database migrations  
✓ Builds the application  
✓ Generates `.env.local` with all required config  

### System Requirements:
- CPU: 2+ cores
- RAM: 2GB+
- Disk: 10GB+
- Supported: Ubuntu 20.04+, Debian 11+, CentOS 8+, RHEL 8+, macOS 12+

### After Installation:
```bash
npm run dev
# Visit http://localhost:3000
```

Output will show:
- ✓ Installation complete message
- Admin email: `admin@example.com`
- Admin password: (saved in `.env.local`)
- Database connection details

---

## Automated Installation with Customization

For interactive setup with configuration options:

```bash
bash install-auto.sh
```

### Features:
✓ Interactive prompts for all settings  
✓ Choose between auto-install or existing PostgreSQL  
✓ Custom admin email/password  
✓ Domain configuration  
✓ Creates systemd service (optional)  
✓ Better for production environments  

### Setup Flow:
1. Detects OS and installs dependencies
2. Prompts for admin credentials
3. Chooses database option (auto or existing)
4. Configures environment
5. Installs project
6. Creates service

---

## Production Installation (One-Command)

For production servers with automatic everything:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install-unified.sh)
```

### Features:
✓ Full automation - no prompts  
✓ Creates systemd service for auto-start  
✓ Installs to `~/zwscloud` directory  
✓ Generates all passwords automatically  
✓ Ready for immediate production use  

### Post-Installation Commands:
```bash
# Start service
sudo systemctl start zwscloud

# View status
sudo systemctl status zwscloud

# View logs
sudo journalctl -u zwscloud -f
```

---

## Troubleshooting Installation

### PostgreSQL Connection Errors

**Problem:** `FATAL: password authentication failed`

**Solutions:**
```bash
# 1. Check PostgreSQL is running
sudo systemctl status postgresql

# 2. Verify database exists
sudo -u postgres psql -l | grep zwscloud

# 3. Reset credentials
sudo -u postgres psql << PSQL_EOF
ALTER USER zwscloud_user WITH PASSWORD 'newpassword';
PSQL_EOF

# 4. Update .env.local with new password
```

### Node.js Installation Issues

**Problem:** `command not found: node`

**Solutions:**
```bash
# Clear NodeSource cache
sudo rm -rf /etc/apt/sources.list.d/nodesource.list
sudo apt update

# Reinstall Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v && npm -v
```

### Dependencies Installation Fails

**Problem:** `npm ERR!` or `pnpm ERR!`

**Solutions:**
```bash
# Clear cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules package-lock.json

# Reinstall with retries
npm install --legacy-peer-deps --prefer-offline

# Or use pnpm if available
pnpm install
```

### Database Migrations Fail

**Problem:** `db:push` command fails

**Solutions:**
```bash
# 1. Generate Prisma client
npm run db:generate

# 2. Test connection
psql $DATABASE_URL -c "SELECT 1"

# 3. Push with skip-generate
npm run db:push --skip-generate

# 4. If still failing, check DATABASE_URL
echo $DATABASE_URL
```

### Build Fails

**Problem:** `npm run build` fails

**Solutions:**
```bash
# 1. Ensure environment variables are set
set -a
source .env.local
set +a

# 2. Clean build cache
rm -rf .next
npm cache clean --force

# 3. Regenerate Prisma
npm run db:generate

# 4. Try build again
npm run build 2>&1 | tail -50  # See last 50 lines
```

---

## Environment Configuration

The installation creates `.env.local` or `.env.production.local`:

```env
# Database
DATABASE_URL="postgresql://zwscloud_user:password@localhost:5432/zwscloud"

# Admin
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="auto_generated_password"
ADMIN_DISPLAY_NAME="Administrator"

# Auth
JWT_SECRET="auto_generated_jwt_secret"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### For Production:
```bash
# 1. Update app URL
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# 2. Change NODE_ENV
NODE_ENV="production"

# 3. Use strong passwords (not auto-generated)
ADMIN_PASSWORD="YourVerySecurePassword123!"

# 4. Store in vault (don't commit to git)
```

---

## Service Management (Production)

After `install-unified.sh` or when using systemd:

```bash
# View status
sudo systemctl status zwscloud

# Start/Stop/Restart
sudo systemctl start zwscloud
sudo systemctl stop zwscloud
sudo systemctl restart zwscloud

# Enable auto-start on boot
sudo systemctl enable zwscloud

# View live logs
sudo journalctl -u zwscloud -f

# View last 50 lines
sudo journalctl -u zwscloud -n 50

# Follow with grep filter
sudo journalctl -u zwscloud -f | grep ERROR
```

---

## SSL/HTTPS Setup (Production)

Using Let's Encrypt with Certbot:

```bash
# 1. Install Certbot
sudo apt-get install certbot python3-certbot-nginx -y

# 2. Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# 3. Configure in .env.local
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# 4. Update reverse proxy (nginx/Apache) to forward to :3000
# 5. Restart service
sudo systemctl restart zwscloud
```

---

## Post-Installation Steps

### 1. Change Admin Password
```bash
# Login to admin panel at http://localhost:3000/admin
# Use credentials from installation
# Change password immediately
```

### 2. Configure Payment Gateway
- Visit Admin Dashboard → Settings → Payment Gateway
- Configure Razorpay or your preferred gateway

### 3. Backup Database
```bash
# Manual backup
sudo -u postgres pg_dump zwscloud > backup.sql

# Scheduled daily backup
sudo crontab -e
# Add: 0 2 * * * sudo -u postgres pg_dump -Fc zwscloud > /backups/zwscloud_$(date +\%Y\%m\%d).sql
```

### 4. Monitor Logs
```bash
# Development
npm run dev  # Logs in terminal

# Production
sudo journalctl -u zwscloud -f
```

---

## Quick Commands Reference

```bash
# Development
npm run dev        # Start dev server
npm run build      # Build for production
npm start          # Start prod server

# Database
npm run db:push    # Sync schema
npm run db:studio  # Open database UI
npm run db:generate  # Regenerate Prisma client

# Maintenance
npm run lint       # Check code quality
npm cache clean --force  # Clear npm cache

# Production (systemd)
sudo systemctl start zwscloud
sudo systemctl restart zwscloud
sudo journalctl -u zwscloud -f
```

---

## Upgrading the Application

### Development:
```bash
git pull origin main
npm install
npm run db:push
npm run build
npm start
```

### Production (with systemd):
```bash
cd ~/zwscloud
git pull origin main
npm install
npm run db:push
npm run build
sudo systemctl restart zwscloud
```

---

## Security Best Practices

1. **Passwords**: Change admin password immediately after install
2. **Environment**: Never commit `.env.local` to git
3. **Backups**: Daily database backups to secure location
4. **Updates**: Keep Node.js and PostgreSQL updated
5. **Firewall**: Restrict access to port 3000
6. **HTTPS**: Use SSL in production
7. **Monitoring**: Review logs regularly
8. **Secrets**: Store API keys in `.env.local`, not code

---

## Cleanup / Rollback

If you need to start fresh:

```bash
# Stop service (if running)
sudo systemctl stop zwscloud 2>/dev/null || true

# Remove project files
rm -rf ~/zwscloud zwscloud-ui-db

# Remove database
sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS zwscloud;
DROP USER IF EXISTS zwscloud_user;
EOF

# Remove service file (if created)
sudo rm -f /etc/systemd/system/zwscloud.service
sudo systemctl daemon-reload

# Now run installer again
bash install-clean.sh
```

---

## Support & Resources

- **Logs**: `sudo journalctl -u zwscloud -f` or `npm run dev`
- **Database**: `npm run db:studio`
- **GitHub**: https://github.com/fitnesshubgym03-debug/zwscloud-ui-db
- **Issues**: File issues on GitHub with error logs

---

## Version Information

- **Last Updated**: July 2024
- **Node.js**: 20.x LTS
- **PostgreSQL**: 12+
- **Supported OS**: Ubuntu 20.04+, Debian 11+, CentOS 8+, RHEL 8+, macOS 12+

