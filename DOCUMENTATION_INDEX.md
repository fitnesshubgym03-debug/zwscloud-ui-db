# ZWS Cloud Documentation Index

Complete reference guide to all ZWS Cloud documentation and resources.

---

## 🚀 Getting Started

### Quick Start (Recommended First Read)
- **[QUICK_START.txt](./QUICK_START.txt)** - Visual guide with one-line commands
- **[README.md](./README.md)** - Project overview and quick installation

### Installation
- **[INSTALL.md](./INSTALL.md)** - Complete step-by-step installation guide
- **[INSTALLER_REFERENCE.md](./INSTALLER_REFERENCE.md)** - Detailed installer reference
- **[DEPLOYMENT_READY.md](./DEPLOYMENT_READY.md)** - Deployment checklist

---

## 📋 Feature Documentation

### Admin & Authentication
- Admin authentication system with JWT + secure cookies
- Role-based access control (user/admin/super_admin)
- Automatic admin user creation during setup
- Session management and token validation

**Files**: 
- `app/api/admin/auth/login/route.ts` - Admin login endpoint
- `app/api/admin/init/route.ts` - Admin initialization
- `lib/auth.ts` - Auth utilities

### Payment Gateway Integration
- **[INTEGRATION_SETUP.md](./INTEGRATION_SETUP.md)** - Payment setup guide
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Technical implementation

#### Razorpay Features
- Automatic recurring billing with e-mandates
- Monthly, quarterly, yearly subscription cycles
- Webhook-based automatic payments
- Test and production modes
- Mandate lifecycle management

**Files**:
- `lib/razorpay.ts` - Razorpay SDK (354 lines)
- `app/api/payments/razorpay-webhook/route.ts` - Webhook handler

#### Cashfree Support
- Traditional payment processing
- One-time and recurring payments
- Redirect-based checkout

**Files**:
- `lib/cashfree.ts` - Cashfree SDK

#### Multi-Gateway Pattern
- Flexible gateway selection
- Unified payment API
- Gateway factory pattern

**Files**:
- `lib/payment-gateway.ts` - Gateway abstraction (352 lines)
- `app/api/payments/create/route.ts` - Payment creation

### Infrastructure Automation

#### Proxmox Integration
- Automatic VM provisioning on payment success
- VM lifecycle management (start, stop, reboot, delete)
- Resource quota tracking per customer
- Status monitoring and health checks

**Files**:
- `lib/proxmox.ts` - Proxmox SDK (361 lines)

#### Database Models
- `RazorpayMandate` - Recurring payment mandates
- `ProxmoxVM` - Infrastructure instances
- `ProxmoxAccount` - Customer Proxmox credentials

---

## 💾 Database & Schema

### Prisma Models
- **User** - Unified authentication
- **Customer** - Customer information
- **Order** - Customer orders
- **Payment** - Payment records
- **Invoice** - Invoice tracking
- **RazorpayMandate** - Recurring payment mandates
- **ProxmoxVM** - Virtual machine instances
- **ProxmoxAccount** - Proxmox connections

### Database Support
- PostgreSQL (recommended)
- MySQL (compatible)

**File**: `prisma/schema.prisma`

---

## 🔧 Installation Scripts

### Production Setup
**[install.sh](./install.sh)** (523 lines)
- Interactive configuration prompts
- Admin credential setup
- Payment gateway configuration
- Domain and SSL setup
- Database migration
- Installation verification

Usage:
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install.sh)
```

### Quick Setup
**[quick-setup.sh](./quick-setup.sh)** (108 lines)
- Sensible default configuration
- Fast deployment
- Development-friendly
- Customizable

Usage:
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/quick-setup.sh)
```

---

## 📚 API Documentation

### Admin Authentication
- **POST** `/api/admin/auth/login` - Admin login
- **POST** `/api/admin/init` - Initialize admin user
- **GET** `/api/auth/session` - Check session

### Payments
- **POST** `/api/payments/create` - Create payment
- **POST** `/api/payments/razorpay-webhook` - Razorpay webhook
- **GET** `/api/payments/status` - Check payment status

### Infrastructure
- **POST** `/api/infrastructure/proxmox/create-vm` - Create VM
- **GET** `/api/infrastructure/proxmox/vm/:vmid` - Get VM status
- **POST** `/api/infrastructure/proxmox/vm/:vmid/stop` - Stop VM
- **POST** `/api/infrastructure/proxmox/vm/:vmid/reboot` - Reboot VM
- **POST** `/api/infrastructure/proxmox/vm/:vmid/delete` - Delete VM

---

## 🔐 Security & Compliance

### Authentication
- Password hashing with bcryptjs
- JWT token with configurable expiry
- HTTP-only secure cookies
- Role-based access control
- Admin verification on protected routes

### Data Protection
- Parameterized SQL queries (SQL injection prevention)
- Input validation and sanitization
- CORS protection
- HTTPS/TLS encryption with auto-renewal
- Payment signature verification
- Webhook signature validation

---

## 🌍 Environment Variables

### Required
```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=YourPassword@123
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-secret-key
DEFAULT_PAYMENT_GATEWAY=razorpay
```

### Payment Gateway
```env
# Razorpay
RAZORPAY_KEY_ID=key_id
RAZORPAY_KEY_SECRET=secret_key
RAZORPAY_MODE=test

# Cashfree
CASHFREE_APP_ID=app_id
CASHFREE_SECRET_KEY=secret_key
CASHFREE_MODE=test
```

### Optional
```env
PROXMOX_HOST=proxmox.example.com
PROXMOX_API_TOKEN=root@pam!token=secret
NEXT_PUBLIC_DOMAIN=example.com
NODE_ENV=production
```

---

## 🆘 Troubleshooting

### Common Issues

**Admin login not working**
- See: INSTALL.md > Troubleshooting section
- Run: `pnpm seed:admin`

**Database connection error**
- Verify DATABASE_URL format
- Check database is running
- Ensure user has permissions

**Payment not processing**
- Verify API credentials
- Check payment mode (test vs live)
- Enable webhooks

**SSL certificate error**
- Run: `sudo certbot renew`
- Force renewal if needed

See **[INSTALLER_REFERENCE.md](./INSTALLER_REFERENCE.md#-troubleshooting)** for detailed troubleshooting.

---

## 📝 File Navigation

### Core Application
- `app/` - Next.js application
- `components/` - React components
- `lib/` - Utility libraries
- `prisma/` - Database schema

### Integration Libraries
- `lib/razorpay.ts` - Razorpay API (354 lines)
- `lib/proxmox.ts` - Proxmox API (361 lines)
- `lib/payment-gateway.ts` - Payment factory (352 lines)
- `lib/cashfree.ts` - Cashfree API

### API Routes
- `app/api/admin/` - Admin endpoints
- `app/api/payments/` - Payment endpoints
- `app/api/auth/` - Authentication endpoints

### Installation & Configuration
- `install.sh` - Full setup script
- `quick-setup.sh` - Quick setup script
- `.env.example` - Environment template
- `package.json` - Dependencies

---

## 🎯 Implementation Summary

### What Was Built
- ✅ Fixed admin authentication
- ✅ Razorpay with automatic recurring billing
- ✅ Cashfree payment support
- ✅ Proxmox infrastructure automation
- ✅ Multi-gateway payment system
- ✅ Complete installation automation
- ✅ Production-ready deployment scripts
- ✅ Comprehensive documentation

### Commits
- 10 total commits on `payment-gateway-integration` branch
- 3 feature commits
- 2 bug fix commits
- 5 documentation commits

---

## 🚀 Deployment

### Quick Deployment
1. Run installer: `bash <(curl -fsSL ...)`
2. Answer configuration prompts
3. Start application: `./start.sh`
4. Access dashboard: `https://your-domain.com/admin`

### Production Checklist
- [ ] Change admin password
- [ ] Update payment credentials to live mode
- [ ] Configure payment webhooks
- [ ] Setup Proxmox credentials (optional)
- [ ] Enable SSL auto-renewal
- [ ] Configure monitoring/logging
- [ ] Create backup plan

---

## 📞 Support

- **GitHub**: https://github.com/fitnesshubgym03-debug/zwscloud-ui-db
- **Issues**: https://github.com/fitnesshubgym03-debug/zwscloud-ui-db/issues
- **Documentation**: See files listed above

---

## 📖 Reading Guide

### For First-Time Users
1. Start with **[QUICK_START.txt](./QUICK_START.txt)**
2. Read **[README.md](./README.md)**
3. Follow **[INSTALL.md](./INSTALL.md)**
4. Run the installer

### For Developers
1. Read **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)**
2. Review **[INTEGRATION_SETUP.md](./INTEGRATION_SETUP.md)**
3. Explore `lib/` for integration code
4. Check `app/api/` for endpoints

### For DevOps/Deployment
1. Check **[DEPLOYMENT_READY.md](./DEPLOYMENT_READY.md)**
2. Review **[INSTALLER_REFERENCE.md](./INSTALLER_REFERENCE.md)**
3. Follow deployment checklist
4. Configure monitoring/alerting

---

**Status**: ✅ Production Ready  
**Last Updated**: July 29, 2026  
**Version**: 1.0.0
