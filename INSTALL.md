# ZWS Cloud - Installation Guide

## Quick Start (1 Command)

### Option 1: Interactive Full Setup
This will prompt you for all configuration options (recommended for first-time setup):

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install.sh)
```

### Option 2: Quick Setup with Defaults
This will use default values and only ask for critical settings:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/quick-setup.sh)
```

### Option 3: Manual Clone and Setup

```bash
git clone https://github.com/fitnesshubgym03-debug/zwscloud-ui-db.git
cd zwscloud-ui-db
bash install.sh
```

---

## Prerequisites

Before running the installer, ensure you have:

- **Node.js** v18 or higher
- **npm** or **pnpm**
- **git**
- **PostgreSQL** or **MySQL** database (optional - installer will prompt)
- **curl** (for one-line installation)

### Install Prerequisites

**On Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git postgresql-client
npm install -g pnpm
```

**On macOS:**
```bash
brew install node git postgresql
npm install -g pnpm
```

**On Windows:**
- Download Node.js from https://nodejs.org
- Download Git from https://git-scm.com
- Download PostgreSQL from https://www.postgresql.org

---

## Installation Steps

### Step 1: Run Installer

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install.sh)
```

### Step 2: Answer Configuration Prompts

The installer will ask for:

1. **Admin Email** (default: admin@example.com)
2. **Admin Password** (min 8 characters)
3. **Admin Display Name** (default: Administrator)
4. **Payment Gateway** (Razorpay or Cashfree)
5. **Domain** (your domain or IP address)
6. **Database** (PostgreSQL or MySQL)

### Step 3: Provide API Credentials

If you choose Razorpay or Cashfree:
- Get API credentials from your payment gateway dashboard
- Enter them when prompted

If you don't have credentials yet:
- The installer will create a working setup with test credentials
- You can update them later in `.env.local`

### Step 4: Start Application

```bash
./start.sh
```

Or manually:

```bash
pnpm start
```

---

## Configuration Options

### Admin User
```env
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="YourPassword@123"
ADMIN_DISPLAY_NAME="Administrator"
```

### Payment Gateway

**Razorpay** (Recommended - Automatic Recurring Payments):
```env
DEFAULT_PAYMENT_GATEWAY="razorpay"
RAZORPAY_KEY_ID="rzp_test_xxxxx"
RAZORPAY_KEY_SECRET="xxxxx"
RAZORPAY_MODE="test"  # Change to "live" for production
```

**Cashfree**:
```env
DEFAULT_PAYMENT_GATEWAY="cashfree"
CASHFREE_APP_ID="xxxxx"
CASHFREE_SECRET_KEY="xxxxx"
CASHFREE_MODE="test"
```

### Database

**PostgreSQL**:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/zwscloud"
```

**MySQL**:
```env
DATABASE_URL="mysql://user:password@localhost:3306/zwscloud"
```

### Domain & SSL

```env
NEXT_PUBLIC_DOMAIN="example.com"
NODE_ENV="production"
```

The installer automatically:
- Generates SSL certificate (if domain is provided)
- Configures HTTPS
- Sets up auto-renewal

---

## Default Credentials

After installation, you can log in with:

**Email:** admin@example.com  
**Password:** Admin@12345

**⚠️ Change these credentials immediately in production!**

---

## Post-Installation

### 1. Update Payment Gateway Credentials

For production use:

1. Get live API keys from your payment provider
2. Update `.env.local`:
   ```bash
   nano .env.local
   ```
3. Change mode from `test` to `live`
4. Restart application

### 2. Configure Domain

If you used an IP address:

1. Purchase a domain
2. Point domain DNS to your server IP
3. Update `NEXT_PUBLIC_DOMAIN` in `.env.local`
4. Install SSL certificate:
   ```bash
   sudo certbot certonly --standalone -d your-domain.com
   ```
5. Restart application

### 3. Setup Proxmox (Optional)

For automatic VM provisioning:

1. Get Proxmox API token from your Proxmox server
2. Update `.env.local`:
   ```env
   PROXMOX_HOST="proxmox.example.com"
   PROXMOX_API_TOKEN="root@pam!terraform=xxxxx"
   ```
3. Restart application

---

## Accessing the Application

### Development
```bash
pnpm dev
```
- URL: http://localhost:3000

### Production
```bash
pnpm start
```
- URL: https://your-domain.com

### Admin Dashboard
- URL: https://your-domain.com/admin
- Email: admin@example.com
- Password: (the password you set)

---

## Environment Variables Reference

See `.env.example` for all available options:

```bash
# Copy example to local
cp .env.example .env.local

# Edit with your values
nano .env.local
```

---

## Database Migrations

To apply database schema changes:

```bash
pnpm db:push
```

To generate database client:

```bash
pnpm db:generate
```

---

## Troubleshooting

### Admin Login Not Working

1. Verify admin user exists:
   ```bash
   pnpm db:query "SELECT * FROM users WHERE role='super_admin'"
   ```

2. Reset admin password:
   ```bash
   pnpm seed:admin
   ```

3. Check `.env.local` has valid `DATABASE_URL`

### Database Connection Error

1. Verify database is running
2. Check `DATABASE_URL` format
3. Ensure user has correct permissions

### Payment Gateway Not Working

1. Verify API credentials in `.env.local`
2. Ensure mode is set to `test` for testing
3. Check API logs in payment dashboard

### SSL Certificate Issues

```bash
# Renew certificate
sudo certbot renew

# Force renew
sudo certbot renew --force-renewal
```

---

## Support & Documentation

- **Setup Guide**: `INTEGRATION_SETUP.md`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`
- **Repository**: https://github.com/fitnesshubgym03-debug/zwscloud-ui-db

---

## Next Steps

1. ✅ Run installer
2. ✅ Access admin dashboard
3. ✅ Configure payment gateway
4. ✅ Add Proxmox credentials (optional)
5. ✅ Deploy to production

**Installation complete! Your ZWS Cloud is ready.** 🚀
