# ZWS Cloud Installer Reference

## One-Line Installation Commands

### For Production Setup (Interactive)
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install.sh)
```

### For Development Setup (Quick)
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/quick-setup.sh)
```

### Local Installation
```bash
git clone https://github.com/fitnesshubgym03-debug/zwscloud-ui-db.git
cd zwscloud-ui-db
bash install.sh          # Interactive setup
# or
bash quick-setup.sh      # Quick setup with defaults
```

---

## What the Installer Does

### 1. Checks Prerequisites
- Node.js v18+
- npm/pnpm
- git
- curl

### 2. Clones Repository
- Downloads latest code from GitHub
- Or uses existing local copy if available

### 3. Gathers Configuration
- Admin email and password
- Payment gateway (Razorpay or Cashfree)
- Domain name (or uses IP address)
- Database type (PostgreSQL or MySQL)
- Database connection details

### 4. Creates Environment File
- Generates `.env.local` with all settings
- Creates secure JWT secret
- Sets up payment gateway credentials

### 5. Installs Dependencies
- Runs `pnpm install` (or `npm install`)
- Downloads all required packages

### 6. Sets Up Database
- Creates database tables
- Runs migrations
- Initializes schema

### 7. Creates Admin User
- Creates super_admin user with your credentials
- Sets up role-based access control

### 8. Builds Application
- Builds Next.js application
- Optimizes for production
- Generates static files

### 9. Sets Up SSL (Optional)
- Generates SSL certificate (if domain provided)
- Configures HTTPS
- Sets up auto-renewal

### 10. Creates Startup Script
- Generates `start.sh` for easy startup
- Loads environment variables
- Starts the application

---

## Default Credentials After Installation

| Item | Value |
|------|-------|
| Admin Email | admin@example.com |
| Admin Password | Admin@12345 |
| Database Host | localhost |
| Payment Mode | test |

**⚠️ Change these in production!**

---

## Configuration Prompts Explained

### Admin Email
Your administrator login email address.

### Admin Password
Must be at least 8 characters. Use strong password in production.

### Admin Display Name
Name shown in admin panel (default: Administrator).

### Payment Gateway
- **Razorpay** (recommended): Automatic recurring billing with e-mandates
- **Cashfree**: Traditional payment gateway

### API Credentials
- For Razorpay: Key ID and Secret from https://dashboard.razorpay.com
- For Cashfree: App ID and Secret Key from https://merchant.cashfree.com

### Domain Configuration
- Enter your domain (e.g., cloud.example.com)
- Or press Enter to use server IP address
- SSL will be automatically configured if domain is provided

### Database Selection
- **PostgreSQL** (recommended): More robust, better for large datasets
- **MySQL**: Compatible, lightweight alternative

### Database Connection
- Host: Database server hostname/IP
- Port: Default 5432 (PostgreSQL) or 3306 (MySQL)
- Name: Database name to create
- User: Database user with creation privileges
- Password: User password

---

## Files Created by Installer

| File | Purpose |
|------|---------|
| `.env.local` | Environment variables and secrets |
| `start.sh` | Script to start application |
| `node_modules/` | Installed dependencies |
| `.next/` | Built application files |

---

## Starting the Application

### Using Startup Script
```bash
./start.sh
```

### Using pnpm
```bash
pnpm start      # Production
pnpm dev        # Development
```

### Using npm
```bash
npm start       # Production
npm run dev     # Development
```

---

## Accessing Your Application

After startup completes:

### Application URL
- If domain configured: https://your-domain.com
- If using IP: https://your-server-ip

### Admin Dashboard
- URL: https://your-domain.com/admin
- Email: admin@example.com
- Password: (the password you set)

### API Endpoints
- Payments: https://your-domain.com/api/payments
- Admin: https://your-domain.com/api/admin
- Auth: https://your-domain.com/api/auth

---

## Post-Installation Steps

### 1. Verify Installation
```bash
curl https://your-domain.com
curl https://your-domain.com/api/auth/session
```

### 2. Check Application Logs
```bash
# See what's running
ps aux | grep node

# Check recent logs
tail -f /var/log/zws-cloud.log  # if using systemd
```

### 3. Update Payment Gateway

For production payments:

1. Get live API keys from payment provider
2. Update `.env.local`:
   ```bash
   nano .env.local
   ```
3. Change `RAZORPAY_MODE` or `CASHFREE_MODE` to `live`
4. Restart application: `./start.sh`

### 4. Configure Domain DNS

If you provided a domain:

1. Log into DNS provider
2. Point A record to server IP
3. Wait for DNS to propagate (5-30 minutes)
4. Visit https://your-domain.com

### 5. Setup Proxmox (Optional)

For automatic VM provisioning:

1. Get Proxmox API token
2. Update `.env.local`:
   ```
   PROXMOX_HOST=proxmox.example.com
   PROXMOX_API_TOKEN=root@pam!terraform=xxxxx
   ```
3. Restart application

### 6. Setup Payment Webhooks

**For Razorpay:**
1. Go to https://dashboard.razorpay.com/app/settings/webhooks
2. Add webhook URL: `https://your-domain.com/api/payments/razorpay-webhook`
3. Subscribe to events

**For Cashfree:**
1. Go to Cashfree dashboard
2. Configure webhook endpoint for payment updates

---

## Troubleshooting

### "Command not found: node"
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### "Cannot connect to database"
```bash
# Check database is running
sudo systemctl status postgresql  # or mysql

# Verify connection string in .env.local
cat .env.local | grep DATABASE_URL
```

### "Admin login fails"
```bash
# Check admin user exists
pnpm db:query "SELECT * FROM users WHERE role='super_admin'"

# Re-create admin user
pnpm seed:admin
```

### "Port 3000 already in use"
```bash
# Change port in .env.local
echo "PORT=3001" >> .env.local

# Or kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

### "SSL certificate error"
```bash
# Verify certificate exists
sudo ls -la /etc/letsencrypt/live/your-domain.com/

# Renew certificate
sudo certbot renew

# Force renewal
sudo certbot certonly --force-renewal -d your-domain.com
```

---

## Environment Variables Quick Reference

```env
# Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=YourPassword@123

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Security
JWT_SECRET=your-secret-key-here

# Payment (Razorpay)
DEFAULT_PAYMENT_GATEWAY=razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_MODE=test

# Payment (Cashfree)
CASHFREE_APP_ID=xxxxx
CASHFREE_SECRET_KEY=xxxxx
CASHFREE_MODE=test

# Domain
NEXT_PUBLIC_DOMAIN=example.com
NODE_ENV=production

# Proxmox (Optional)
PROXMOX_HOST=proxmox.example.com
PROXMOX_API_TOKEN=root@pam!terraform=xxxxx
```

---

## Getting Help

- **Documentation**: See `INSTALL.md` and `INTEGRATION_SETUP.md`
- **GitHub Issues**: https://github.com/fitnesshubgym03-debug/zwscloud-ui-db/issues
- **Discord Community**: (Link in repository)

---

## Next Steps

1. Run the installer with one command
2. Answer configuration prompts
3. Start the application
4. Access admin dashboard
5. Configure payment gateway
6. Deploy to production

**Your ZWS Cloud is ready to serve!** 🚀
