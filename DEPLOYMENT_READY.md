# ZWS Cloud - Deployment Ready ✅

Your ZWS Cloud application is fully configured and ready for deployment with automatic setup scripts.

---

## 🚀 Installation (Choose One)

### Option 1: Interactive Full Setup
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install.sh)
```
**Best for:** Production servers, first-time setup, custom configuration

### Option 2: Quick Setup with Defaults
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/quick-setup.sh)
```
**Best for:** Development, testing, quick deployments

### Option 3: Manual Setup
```bash
git clone https://github.com/fitnesshubgym03-debug/zwscloud-ui-db.git
cd zwscloud-ui-db
bash install.sh          # or quick-setup.sh
```

---

## 📋 What's Included

### Features
- ✅ Admin authentication system (unified User model)
- ✅ Razorpay payment gateway with automatic recurring billing (e-mandates)
- ✅ Cashfree payment gateway support
- ✅ Proxmox VE integration for automatic VM provisioning
- ✅ Multi-gateway payment factory pattern
- ✅ SSL/HTTPS support with auto-renewal
- ✅ PostgreSQL and MySQL support
- ✅ Admin dashboard with role-based access control

### Installers
- ✅ `install.sh` - Interactive setup with configuration prompts
- ✅ `quick-setup.sh` - Quick setup with sensible defaults
- ✅ Automatic admin user creation
- ✅ Environment variable generation
- ✅ SSL certificate setup
- ✅ Database migrations
- ✅ Build verification

### Documentation
- ✅ `INSTALL.md` - Complete installation guide
- ✅ `INSTALLER_REFERENCE.md` - Detailed installer reference
- ✅ `INTEGRATION_SETUP.md` - Integration setup guide
- ✅ `IMPLEMENTATION_SUMMARY.md` - Feature overview
- ✅ `README.md` - Quick start guide

---

## 📊 System Requirements

| Component | Requirement |
|-----------|-------------|
| **OS** | Ubuntu 22.04+, Debian 11+, CentOS 8+, or macOS |
| **Node.js** | v18.0+ or v20.0+ |
| **npm/pnpm** | Latest version |
| **git** | Latest version |
| **RAM** | 2GB minimum (4GB recommended) |
| **Disk** | 10GB minimum free space |
| **CPU** | 2 cores minimum (4+ recommended) |

### Optional
- **PostgreSQL** v12+ or **MySQL** v8+
- **Certbot** for SSL certificate management
- **Proxmox VE** for infrastructure automation

---

## 🔐 Default Credentials

After installation, log in with:

| Field | Value |
|-------|-------|
| **Email** | admin@example.com |
| **Password** | Admin@12345 |

⚠️ **Change these immediately in production!**

---

## 🎯 Installer Process Flow

```
1. Check Prerequisites
   ├─ Node.js, npm/pnpm, git, curl
   
2. Repository Setup
   ├─ Clone from GitHub or use existing
   
3. Configuration Gathering
   ├─ Admin credentials
   ├─ Payment gateway selection
   ├─ Domain/IP configuration
   ├─ Database selection
   
4. Environment Setup
   ├─ Create .env.local
   ├─ Generate JWT secret
   ├─ Configure payment credentials
   
5. Installation
   ├─ Install dependencies
   ├─ Run database migrations
   ├─ Create admin user
   
6. Build & Verify
   ├─ Build Next.js application
   ├─ Verify installation
   ├─ Generate startup script
   
7. SSL Setup (if domain provided)
   ├─ Generate certificate
   ├─ Configure HTTPS
   ├─ Setup auto-renewal
   
8. Final Instructions
   ├─ Print access URLs
   ├─ Display credentials
   ├─ Show next steps
```

---

## 🔧 Configuration Options

### Payment Gateway

**Razorpay (Recommended)**
- Automatic recurring billing with e-mandates
- Monthly, quarterly, yearly billing cycles
- Webhook-based automatic payments
- Test and production modes

**Cashfree**
- Traditional payment processing
- One-time and recurring options
- Redirect-based checkout

### Database

**PostgreSQL** (Recommended)
- More robust and scalable
- Better for large datasets
- Superior JSON support

**MySQL**
- Lightweight and fast
- Compatible with most hosting providers
- Adequate for small to medium deployments

### Domain Configuration

**With Domain**
- Automatic SSL certificate generation
- HTTPS support
- Production-ready

**With IP Address**
- Self-signed SSL option
- Development-friendly
- Can be upgraded to domain later

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Quick start and overview |
| `INSTALL.md` | Complete installation guide |
| `INSTALLER_REFERENCE.md` | Detailed installer reference |
| `INTEGRATION_SETUP.md` | Payment & Proxmox setup |
| `IMPLEMENTATION_SUMMARY.md` | Feature implementation details |
| `DEPLOYMENT_READY.md` | This file |

---

## 🏃 Quick Start

### 1. Run Installer
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install.sh)
```

### 2. Follow Prompts
Answer questions about:
- Admin email and password
- Payment gateway
- Domain name
- Database type

### 3. Start Application
```bash
./start.sh
# or
pnpm start
```

### 4. Access Dashboard
- URL: https://your-domain.com
- Admin: https://your-domain.com/admin

---

## ⚙️ Environment Variables

### Required
```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=YourPassword@123
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-secret-key-here
DEFAULT_PAYMENT_GATEWAY=razorpay
```

### Payment Gateway (Choose One)
```env
# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_MODE=test

# Or Cashfree
CASHFREE_APP_ID=xxxxx
CASHFREE_SECRET_KEY=xxxxx
CASHFREE_MODE=test
```

### Optional
```env
PROXMOX_HOST=proxmox.example.com
PROXMOX_API_TOKEN=root@pam!terraform=xxxxx
NEXT_PUBLIC_DOMAIN=example.com
NODE_ENV=production
```

---

## 🧪 Post-Installation Checklist

- [ ] Run installer successfully
- [ ] Verify admin login works
- [ ] Test payment gateway (test mode)
- [ ] Configure domain (if applicable)
- [ ] Setup SSL certificate
- [ ] Update payment credentials for production
- [ ] Configure payment webhook endpoints
- [ ] Add Proxmox credentials (optional)
- [ ] Setup monitoring/logging
- [ ] Create backup plan

---

## 🔍 Verification Steps

### Check Application Status
```bash
ps aux | grep node         # See running process
curl https://localhost     # Test local connection
```

### Check Database Connection
```bash
# PostgreSQL
psql -U postgres -d zwscloud -c "SELECT COUNT(*) FROM users;"

# MySQL
mysql -u root -p zwscloud -e "SELECT COUNT(*) FROM users;"
```

### Check Admin User
```bash
# Query database for admin user
pnpm db:query "SELECT email, role FROM users WHERE role='super_admin';"
```

---

## 🆘 Troubleshooting

### Installer Won't Run
```bash
# Make executable
chmod +x install.sh quick-setup.sh

# Run with bash explicitly
bash install.sh
```

### Admin Login Fails
```bash
# Verify admin exists
pnpm db:query "SELECT * FROM users WHERE role='super_admin';"

# Re-create admin
pnpm seed:admin
```

### Database Connection Error
```bash
# Verify DATABASE_URL in .env.local
cat .env.local | grep DATABASE_URL

# Test connection manually
psql "$DATABASE_URL"
```

### SSL Certificate Error
```bash
# Renew certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

---

## 📞 Support Resources

- **GitHub Repository**: https://github.com/fitnesshubgym03-debug/zwscloud-ui-db
- **Issues & Feature Requests**: https://github.com/fitnesshubgym03-debug/zwscloud-ui-db/issues
- **Documentation**: See docs folder
- **Email Support**: (to be configured)

---

## 🎉 You're All Set!

Your ZWS Cloud application is ready for deployment. Choose your installation method and get started:

```bash
# Production setup (interactive)
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install.sh)

# Or quick development setup
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/quick-setup.sh)
```

---

**Status**: ✅ Production Ready  
**Last Updated**: July 29, 2026  
**Version**: 1.0.0
