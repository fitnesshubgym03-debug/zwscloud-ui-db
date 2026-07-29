# ZWS Cloud - Complete Installation & Setup

## ⚡ Quick Installation (Choose Your Path)

Get ZWS Cloud up and running - pick the installer that fits your needs:

### 🎯 Local Development (Recommended) ⭐
**Perfect for getting started quickly:**
```bash
bash install-clean.sh
```
- ✅ Auto-detects OS (Ubuntu, Debian, CentOS, RHEL, macOS)
- ✅ Installs Node.js & PostgreSQL
- ✅ Creates database automatically
- ✅ Generates .env.local with all config
- ✅ Runs migrations & builds app
- ✅ Ready in ~10 minutes

**See [INSTALL_README.md](./INSTALL_README.md) for quick start**

### ⚙️ Interactive Configuration
**Need more control? Use interactive prompts:**
```bash
bash install-auto.sh
```
- ✅ Choose between auto/existing PostgreSQL
- ✅ Custom admin credentials
- ✅ Configure all settings interactively
- ✅ Optional systemd service setup

### 🚀 Production Deployment (One Command)
**Fully automated production setup:**
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install-unified.sh)
```
- ✅ Complete automation (no prompts)
- ✅ Creates systemd service for auto-start
- ✅ Generates all credentials automatically
- ✅ Production-ready configuration
- ✅ Works on Ubuntu, Debian, CentOS, RHEL

### 🔧 Advanced Setup
**Full control over every step:**
```bash
bash install.sh
```
- ✅ Step-by-step configuration
- ✅ SSL/domain setup
- ✅ Custom paths and settings
- ✅ For experienced users

**For detailed setup options, see [INSTALL_GUIDE.md](./INSTALL_GUIDE.md)**

### 🐳 Docker Setup (Optional)
**Deploy using Docker for complete isolation:**
```bash
docker compose up -d
```
See [DOCKER_README.md](./DOCKER_README.md) for Docker-specific instructions.

---

## Table of Contents

### Installation
1. [Quick Installation](#-quick-installation-choose-your-path)
2. [Installation Resources](#installation-resources)
3. [Server Requirements](#server-requirements)

### Setup & Configuration
4. [Download from GitHub](#download-from-github)
5. [System Package Installation](#system-package-installation)
6. [Environment Configuration](#environment-configuration)
7. [Database Setup](#database-setup)

### Build & Deploy
8. [Install Dependencies](#install-dependencies)
9. [Build Application](#build-application)
10. [Start Application](#start-application)
11. [Nginx Reverse Proxy](#nginx-reverse-proxy)
12. [SSL Certificate Setup](#ssl-certificate-setup)

### Operations
13. [Set Permissions](#set-permissions)
14. [First Run Verification](#first-run-verification)
15. [Update and Redeploy](#update-and-redeploy)
16. [Logs and Debugging](#logs-and-debugging)
17. [Troubleshooting](#troubleshooting)

---

## Installation Resources

Quick reference for all installation methods:

| Use Case | Script | Difficulty | Time |
|----------|--------|-----------|------|
| **Local Dev** | `bash install-clean.sh` | Easy | ~10 min |
| **Interactive** | `bash install-auto.sh` | Medium | ~15 min |
| **Production** | `bash <(curl ... install-unified.sh)` | Medium | ~15 min |
| **Advanced** | `bash install.sh` | Hard | ~20 min |

For detailed guides:
- **Development**: [INSTALL_README.md](./INSTALL_README.md) - Quick reference
- **Complete Guide**: [INSTALL_GUIDE.md](./INSTALL_GUIDE.md) - Comprehensive troubleshooting
- **Updates**: [README_UPDATES.md](./README_UPDATES.md) - Update procedures
- **Production**: [README_PRODUCTION.md](./README_PRODUCTION.md) - Production deployment

---

---

## Server Requirements

Before starting, ensure your server has:

- **OS**: Ubuntu 22.04 LTS or newer
- **Node.js**: 20.x LTS or newer
- **RAM**: Minimum 2 GB (4 GB recommended)
- **Disk**: Minimum 10 GB free space
- **CPU**: 2 cores minimum (4+ recommended)
- **Internet**: Public IP or domain name
- **Root/Sudo**: Full administrator access

Optional but recommended:
- **Redis**: For caching and sessions
- **Certbot**: For automatic SSL (requires domain)

---

## Download from GitHub

### 1. Create Installation Directory

```bash
sudo mkdir -p /var/www/zws
cd /var/www/zws
```

### 2. Clone Repository

Replace `GITHUB_REPO_URL` with your actual GitHub repository URL:

```bash
sudo git clone https://github.com/fitnesshubgym03-debug/zwscloud-ui-db.git .
```

If you need to update later:

```bash
cd /var/www/zws
sudo git pull origin main
```

---

## System Package Installation

### 1. Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install Required Packages

```bash
sudo apt install -y \
  curl \
  wget \
  git \
  build-essential \
  python3 \
  unzip \
  nginx \
  mysql-server \
  certbot \
  python3-certbot-nginx
```

### 3. Install Node.js (20.x LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 4. Install pnpm Package Manager

```bash
sudo npm install -g pnpm
```

Verify installations:

```bash
node --version        # Should be v20.x or higher
pnpm --version        # Should be 8.x or higher
npm --version         # Should be 10.x or higher
```

### 5. Install Redis (Optional but Recommended)

```bash
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

---

## Environment Configuration

### 1. Copy Environment Template

```bash
cd /var/www/zws
sudo cp .env.example .env
```

### 2. Edit Environment Variables

```bash
sudo nano .env
```

Configure the following required variables:

```env
# Application Environment
NODE_ENV=production
APP_URL=https://yourdomain.com
APP_ENV=production

# Database Connection (MySQL)
DATABASE_URL=mysql://zwsvercel:your_secure_password@127.0.0.1:3306/zwsvercel

# Admin Credentials (Change these!)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_secure_admin_password

# JWT Secret (Generate a strong random string)
JWT_SECRET=your_jwt_secret_here_min_32_chars

# Optional: Email Configuration (for password resets, notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password
MAIL_FROM=noreply@yourdomain.com

# Optional: Redis Configuration (if using Redis)
REDIS_URL=redis://127.0.0.1:6379

# Optional: Payment Gateway (Cashfree)
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_MODE=test
```

**IMPORTANT - APP_URL and SSL:**

The `APP_URL` in your `.env` file is the source of truth for your application domain.

- If you change your domain later, you MUST:
  1. Update `APP_URL` in `.env`
  2. Rebuild the application: `pnpm build`
  3. Restart the application: `pm2 restart zws`
  4. Reconfigure SSL: Run certbot again with your new domain

Mismatched `APP_URL` and domain can cause:
- Broken redirects
- Authentication failures
- CORS errors
- SSL mismatches

---

## Database Setup

### 1. Start MySQL Service

```bash
sudo systemctl start mysql-server
sudo systemctl enable mysql-server
```

### 2. Create Database and User

```bash
sudo mysql -u root -p
```

When prompted for password, press Enter if no password is set (default for fresh installation):

```sql
CREATE DATABASE zwsvercel;
CREATE USER 'zwsvercel'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON zwsvercel.* TO 'zwsvercel'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**Security Note:** Replace `your_secure_password` with a strong password. Use this same password in the `DATABASE_URL` in `.env`.

### 3. Verify Connection

```bash
mysql -u zwsvercel -p -h 127.0.0.1 -D zwsvercel -e "SELECT 1"
```

---

## Install Dependencies

### 1. Install Node Modules

```bash
cd /var/www/zws
sudo pnpm install
```

This may take 2-5 minutes. Wait for completion.

### 2. Generate Prisma Client

```bash
sudo pnpm prisma generate
```

### 3. Run Database Migrations

```bash
sudo pnpm prisma migrate deploy
```

If this is your first installation, Prisma will create all required tables.

---

## Build Application

### 1. Build for Production

```bash
cd /var/www/zws
sudo pnpm build
```

The build must complete without errors. You should see:
- `✓ Compiled successfully`
- `Routes compiled: 49/49`
- `Build completed in X seconds`

If the build fails, check:
- All environment variables are set correctly
- Database is running and accessible
- All dependencies installed successfully

---

## Start Application

### 1. Install PM2 Globally

```bash
sudo npm install -g pm2
```

### 2. Start Application with PM2

```bash
cd /var/www/zws
sudo pm2 start "pnpm start" --name zws
```

### 3. Save PM2 Configuration

```bash
sudo pm2 save
sudo pm2 startup
```

Follow the on-screen instructions to complete PM2 startup setup.

### 4. Verify Application is Running

```bash
sudo pm2 status
```

You should see the `zws` app with status `online`.

---

## Nginx Reverse Proxy

### 1. Create Nginx Configuration File

```bash
sudo nano /etc/nginx/sites-available/zws
```

Paste the following configuration:

```nginx
upstream zws_backend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates will be added by Certbot

    # Reverse proxy to Node.js application
    location / {
        proxy_pass http://zws_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
```

Replace `yourdomain.com` with your actual domain name.

### 2. Enable the Configuration

```bash
sudo ln -s /etc/nginx/sites-available/zws /etc/nginx/sites-enabled/zws
```

### 3. Remove Default Configuration

```bash
sudo rm -f /etc/nginx/sites-enabled/default
```

### 4. Test Nginx Configuration

```bash
sudo nginx -t
```

You should see:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration will be successful
```

### 5. Start Nginx

```bash
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## SSL Certificate Setup

### Important Prerequisites

Before setting up SSL, ensure:

1. **Domain Name**: You must have a registered domain name (NOT just an IP address)
2. **DNS Configured**: Your domain must point to this server's IP address
3. **APP_URL Set**: Your `.env` file must have the correct `APP_URL`

### SSL Setup Options

#### Option A: Automatic SSL with Certbot (Recommended)

**Do you want AutoSSL setup?** Yes - use Certbot for automatic certificate management.

### 1. Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obtain SSL Certificate

Replace `yourdomain.com` with your actual domain:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com --email admin@yourdomain.com
```

Follow the prompts:
- Agree to Terms of Service (A)
- Share email for important notices (Y)
- No redirect to HTTPS yet (we'll configure Nginx for this)

### 3. Verify Certificate Installation

```bash
sudo ssl-cert-verify yourdomain.com
```

Your certificate should be valid for 90 days.

### 4. Automatic Renewal

Certbot automatically renews certificates. Verify renewal is working:

```bash
sudo certbot renew --dry-run
```

---

### If Your Domain Changes Later

If you need to change your domain:

**Step 1:** Update the application

```bash
sudo nano .env
# Change APP_URL to your new domain
```

**Step 2:** Rebuild and restart

```bash
cd /var/www/zws
sudo pnpm build
sudo pm2 restart zws
```

**Step 3:** Update Nginx configuration

```bash
sudo nano /etc/nginx/sites-available/zws
# Change server_name to your new domain
```

**Step 4:** Get new SSL certificate

```bash
sudo certbot --nginx -d newdomain.com -d www.newdomain.com
```

**Step 5:** Test and restart

```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

### Troubleshooting SSL

**Certificate request fails:**
- Verify domain is pointing to this server: `nslookup yourdomain.com`
- Check Nginx is running: `sudo systemctl status nginx`
- Check port 80 is accessible: `sudo ss -tulpn | grep :80`

**Certificate validation errors:**
- Ensure 60+ seconds have passed since DNS update
- Try again: `sudo certbot --nginx -d yourdomain.com`

**Renewal fails:**
- Check logs: `sudo certbot renew --verbose`
- Ensure domain still points to server
- Ensure Nginx is running

---

## Set Permissions

### 1. Set Directory Owner

```bash
sudo chown -R www-data:www-data /var/www/zws
```

### 2. Set Directory Permissions

```bash
sudo chmod -R 755 /var/www/zws
chmod -R 775 /var/www/zws/.next
```

### 3. Set PM2 Permissions

```bash
sudo pm2 delete zws
sudo pm2 start "pnpm start" --name zws --user www-data
sudo pm2 save
```

---

## First Run Verification

### 1. Verify All Services Running

```bash
# Check PM2
sudo pm2 status

# Check Nginx
sudo systemctl status nginx

# Check MySQL
sudo systemctl status mysql-server

# Check Redis (if installed)
sudo systemctl status redis-server
```

All should show `active (running)` in green.

### 2. Verify Application Access

From your local computer:

```bash
curl https://yourdomain.com
```

You should receive the HTML homepage.

### 3. Verify Domain SSL

Visit: `https://yourdomain.com`

Check for:
- Green lock icon
- No SSL warnings
- Page loads without errors

### 4. Check Application Logs

```bash
sudo pm2 logs zws --lines 50
```

Look for:
- `Server running on port 3000`
- `Database connected`
- No error messages

---

## Update and Redeploy

When you push new code to GitHub:

### 1. Pull Latest Changes

```bash
cd /var/www/zws
sudo git pull origin main
```

### 2. Install New Dependencies

```bash
sudo pnpm install
```

### 3. Run Migrations (if database changed)

```bash
sudo pnpm prisma generate
sudo pnpm prisma migrate deploy
```

### 4. Rebuild Application

```bash
sudo pnpm build
```

### 5. Restart Application

```bash
sudo pm2 restart zws
```

### 6. Verify Update

```bash
sudo pm2 logs zws --lines 20
```

---

## Logs and Debugging

### View Application Logs

```bash
# Last 50 lines
sudo pm2 logs zws --lines 50

# Follow live logs (Ctrl+C to exit)
sudo pm2 logs zws --follow

# Last 24 hours
sudo pm2 logs zws --since "2024-01-01 00:00:00"
```

### View Nginx Logs

```bash
# Error log
sudo tail -f /var/log/nginx/error.log

# Access log
sudo tail -f /var/log/nginx/access.log
```

### View MySQL Logs

```bash
sudo tail -f /var/log/mysql/error.log
```

### Check Service Status

```bash
# PM2 status
sudo pm2 status

# Nginx status
sudo systemctl status nginx

# MySQL status
sudo systemctl status mysql-server

# Open ports
sudo ss -tulpn
```

### Check Application Port

```bash
# Is port 3000 open?
sudo ss -tulpn | grep :3000

# Is port 443 open?
sudo ss -tulpn | grep :443
```

---

## Troubleshooting

### Build Fails with "missing DATABASE_URL"

**Problem:** Build fails even though `.env` exists.

**Solution:**
1. Verify `.env` exists: `sudo cat /var/www/zws/.env | grep DATABASE_URL`
2. Ensure MySQL is running: `sudo systemctl status mysql-server`
3. Verify database exists: `sudo mysql -u zwsvercel -p -e "USE zwsvercel; SELECT 1"`
4. Run build again: `cd /var/www/zws && sudo pnpm build`

---

### Application Shows "Bad Gateway" Error

**Problem:** Nginx returns 502 Bad Gateway.

**Solution:**
1. Check application is running: `sudo pm2 status`
2. Check logs: `sudo pm2 logs zws --lines 50`
3. Verify port 3000 is open: `sudo ss -tulpn | grep :3000`
4. Restart application: `sudo pm2 restart zws`
5. Verify Nginx config: `sudo nginx -t`

---

### Database Connection Error

**Problem:** "Can't connect to MySQL server" or "Database error".

**Solution:**
1. Verify MySQL is running: `sudo systemctl status mysql-server`
2. Test connection manually: `mysql -u zwsvercel -p -h 127.0.0.1 -D zwsvercel -e "SELECT 1"`
3. Check DATABASE_URL in `.env`: `sudo cat /var/www/zws/.env | grep DATABASE_URL`
4. Verify database exists: `sudo mysql -u root -p -e "SHOW DATABASES"`
5. Verify user permissions: `sudo mysql -u root -p -e "SHOW GRANTS FOR 'zwsvercel'@'localhost'"`

---

### Prisma Migration Error

**Problem:** `prisma migrate deploy` fails.

**Solution:**
1. Check database connection: `mysql -u zwsvercel -p -h 127.0.0.1 -D zwsvercel -e "SELECT 1"`
2. Review migration: `sudo cat ./prisma/schema.prisma`
3. Reset migrations (WARNING - data loss): `sudo pnpm prisma migrate reset`
4. Try migration again: `sudo pnpm prisma migrate deploy`

---

### SSL Certificate Won't Renew

**Problem:** Certificate renewal fails automatically.

**Solution:**
1. Check renewal status: `sudo certbot renew --verbose`
2. Verify domain still points to server: `nslookup yourdomain.com`
3. Ensure Nginx is running: `sudo systemctl status nginx`
4. Manually renew: `sudo certbot renew --force-renewal`

---

### Environment Changes Not Taking Effect

**Problem:** Changed `.env` but application still uses old values.

**Solution:**
1. Verify `.env` is readable by www-data: `sudo ls -la /var/www/zws/.env`
2. Rebuild application: `sudo pnpm build`
3. Restart application: `sudo pm2 restart zws`
4. Check new values: `sudo pm2 logs zws --lines 20`

---

### Domain Changed but App Still Shows Old Domain

**Problem:** Updated `.env` with new domain but app redirects to old domain.

**Solution:**
1. Verify `.env` has correct `APP_URL`: `sudo cat /var/www/zws/.env | grep APP_URL`
2. Rebuild application: `cd /var/www/zws && sudo pnpm build`
3. Restart application: `sudo pm2 restart zws`
4. Update Nginx config: `sudo nano /etc/nginx/sites-available/zws`
5. Test Nginx: `sudo nginx -t`
6. Restart Nginx: `sudo systemctl restart nginx`
7. Update SSL certificate: `sudo certbot --nginx -d newdomain.com`

---

### High Memory Usage

**Problem:** Application consuming too much memory.

**Solution:**
1. Check memory usage: `sudo pm2 monit`
2. View detailed logs: `sudo pm2 logs zws`
3. Increase PM2 max memory: `sudo pm2 delete zws && sudo pm2 start "pnpm start" --name zws --max-memory-restart 1G`
4. Check for memory leaks in logs
5. Restart application: `sudo pm2 restart zws`

---

### Port 3000 Already in Use

**Problem:** "Port 3000 already in use" error.

**Solution:**
1. Find process using port 3000: `sudo ss -tulpn | grep :3000` or `sudo lsof -i :3000`
2. Kill the process: `sudo kill -9 <PID>`
3. Or change port in Nginx config and `.env`
4. Restart PM2: `sudo pm2 restart zws`

---

### CORS or Cross-Origin Errors

**Problem:** "CORS error" or "Cross-Origin Request Blocked".

**Solution:**
1. Verify `APP_URL` in `.env` matches your domain
2. Rebuild application: `cd /var/www/zws && sudo pnpm build`
3. Restart application: `sudo pm2 restart zws`
4. Clear browser cache and try again
5. Check Nginx headers: `sudo cat /etc/nginx/sites-available/zws`

---

## Uninstall / Clean Up

If you need to completely remove ZWS Cloud:

```bash
# Stop application
sudo pm2 delete zws

# Stop services
sudo systemctl stop nginx
sudo systemctl stop mysql-server

# Remove files
sudo rm -rf /var/www/zws

# Remove database
sudo mysql -u root -p -e "DROP DATABASE zwsvercel;"

# Remove Nginx config
sudo rm /etc/nginx/sites-available/zws
sudo rm /etc/nginx/sites-enabled/zws
sudo systemctl restart nginx

# Remove SSL certificate
sudo certbot delete --cert-name yourdomain.com
```

---

## Getting Help

For additional support:

1. Check logs: `sudo pm2 logs zws`
2. Review this guide's troubleshooting section
3. Check GitHub issues: https://github.com/fitnesshubgym03-debug/v0-sam/issues
4. Contact support: support@zws.cloud

---

## Notes

- Always keep backups of your database before major updates
- Monitor disk space regularly: `df -h`
- Monitor system resources: `top` or `htop`
- Review logs periodically for errors
- Update system packages regularly: `sudo apt update && sudo apt upgrade`
- Keep your domain renewal current (don't let it expire)
- Test SSL renewal monthly: `sudo certbot renew --dry-run`

---

**Last Updated:** 2024
**Version:** 1.0
**Next.js:** 16+
**Node.js:** 20+
**Database:** MySQL 8+
