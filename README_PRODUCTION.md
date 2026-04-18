# ZWS Cloud - Production Deployment Guide

## Project Status: MySQL Migration Complete & Production-Ready

This project has been completely migrated from Supabase/PostgreSQL to MySQL/Prisma ORM with full admin authentication, payment processing, and analytics. The application is now production-ready with proper environment validation and initialization.

## Architecture Overview

**Database Layer:** MySQL with Prisma ORM v6
**Authentication:** JWT-based admin auth with bcrypt password hashing
**Payment Gateway:** Cashfree integration for INR payments
**Cache:** Optional Redis support (graceful degradation if not configured)
**Email:** Optional SMTP support for invoices and notifications
**Migrations:** Automatic on startup via Prisma

## Quick Start - Local Development

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)
- MySQL 8.0 running locally (or Docker)
- Cashfree merchant account (for payments)

### 1. Clone & Install
```bash
git clone <repo>
cd zws-cloud
pnpm install
```

### 2. Setup MySQL Database
Option A: Using Docker Compose (Recommended)
```bash
pnpm docker:up
# MySQL will be available at localhost:3306
# phpMyAdmin at http://localhost:8081
```

Option B: Using existing MySQL server
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE zws_cloud;"
```

### 3. Configure Environment Variables
```bash
cp .env.example .env.local
```

Edit `.env.local` with your settings:
```env
# Required
DATABASE_URL="mysql://root:root@localhost:3306/zws_cloud"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="SecurePassword123"
JWT_SECRET="$(openssl rand -hex 32)"

# Cashfree (get from dashboard.cashfree.com)
CASHFREE_APP_ID="your-app-id"
CASHFREE_SECRET_KEY="your-secret-key"
CASHFREE_WEBHOOK_SECRET="your-webhook-secret"

# Optional
REDIS_URL="redis://localhost:6379"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Initialize Database
```bash
# Generate Prisma client
pnpm prisma generate

# Push schema to database (auto-creates tables)
pnpm prisma db push

# Seed admin user automatically on first startup
pnpm dev
```

### 5. Login to Admin
- URL: `http://localhost:3000/zwsloginsam` (login page)
- Email: Use the `ADMIN_EMAIL` from .env.local
- Password: Use the `ADMIN_PASSWORD` from .env.local
- Dashboard: `http://localhost:3000/admin`

## Database Schema

Tables created automatically on first startup:

1. **admin_profiles** - Admin users with JWT sessions
2. **products** - VPS/hosting products with pricing tiers
3. **custom_configs** - User-created custom server configurations
4. **customers** - Customer information
5. **orders** - Purchase orders
6. **payments** - Payment records from Cashfree
7. **invoices** - Generated invoices
8. **analytics_events** - User interaction tracking

## Environment Variables - Complete Reference

### REQUIRED Variables
```
DATABASE_URL          MySQL connection string (mysql://user:pass@host:3306/db)
ADMIN_EMAIL          Initial admin email
ADMIN_PASSWORD       Initial admin password (auto-hashed with bcrypt)
JWT_SECRET           Session token secret (min 32 chars in production)
CASHFREE_APP_ID      Cashfree merchant ID
CASHFREE_SECRET_KEY  Cashfree API secret
CASHFREE_WEBHOOK_SECRET  Cashfree webhook verification key
```

### OPTIONAL Variables
```
REDIS_URL            Redis connection (caching disabled if not set)
SMTP_HOST            Email server hostname
SMTP_PORT            Email server port
SMTP_USER            Email authentication user
SMTP_PASS            Email authentication password
```

### Configuration Variables
```
ADMIN_DISPLAY_NAME             Admin display name (default: "Administrator")
NEXT_PUBLIC_APP_URL            Public app URL for links in emails
COMPANY_NAME                   Business name
COMPANY_EMAIL                  Support email
COMPANY_PHONE                  Support phone
COMPANY_ADDRESS                Physical address
COMPANY_GST_IN                 GST registration number (India)
DEFAULT_CURRENCY               Pricing currency (default: "INR")
DEFAULT_TAX_RATE               Tax percentage (default: 18)
DISCOUNT_3M/6M/12M/24M         Term-based discounts
```

## API Routes

### Admin Authentication
- `POST /api/admin/auth/login` - Admin login (returns JWT)
- `POST /api/admin/init` - Initialize admin user
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/analytics` - Analytics data

### Products & Pricing
- `GET /api/products?term=1&category=vps` - List products with pricing

### Payments
- `POST /api/payments/create` - Create payment order
- `GET /api/payments/status?order_id=ORDER` - Check payment status
- `POST /api/payments/webhook` - Cashfree webhook (auto-updates orders)

### Data
- `GET /api/invoices/[invoiceNumber]` - View invoice
- `POST /api/analytics/track` - Track user events
- `GET /api/pricing/calculate` - Calculate final price

## Production Deployment

### Vercel Deployment
```bash
# 1. Connect GitHub repo to Vercel
# 2. Add environment variables in Vercel project settings
# 3. Deploy (automatic on push)
```

### Other Platforms (AWS, DigitalOcean, etc.)

1. Setup MySQL Database
   - AWS RDS: Create MySQL 8.0 instance
   - DigitalOcean: Create Managed Database
   - Get connection string

2. Configure Environment Variables
   ```bash
   export DATABASE_URL="mysql://user:pass@host/db"
   export ADMIN_EMAIL="prod-admin@company.com"
   export ADMIN_PASSWORD="$(openssl rand -base64 32)"
   export JWT_SECRET="$(openssl rand -hex 32)"
   export CASHFREE_APP_ID="prod-app-id"
   export CASHFREE_SECRET_KEY="prod-secret"
   export NEXT_PUBLIC_APP_URL="https://yourdomain.com"
   ```

3. Build & Deploy
   ```bash
   pnpm install
   pnpm prisma generate
   pnpm prisma db push
   pnpm build
   pnpm start
   ```

## Testing Checklist

### 1. Database Connection
```bash
pnpm prisma studio  # Opens database GUI at http://localhost:5555
```

### 2. Admin Bootstrap (Automatic on First Request)
- First request to `/admin` triggers:
  - Config validation
  - Database connection test
  - Admin user creation (if missing)
  - Initial settings setup
- Check logs: `[Startup] ✓ Admin user created`

### 3. Admin Login
```bash
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```
Expected: JWT token in response and `admin_token` cookie

### 4. Dashboard Access
- Navigate to `http://localhost:3000/admin`
- Should show statistics (0 initially)
- Admin JWT validation on every request

### 5. Analytics
```bash
curl -X POST http://localhost:3000/api/analytics/track \
  -H "Content-Type: application/json" \
  -d '{"event_type":"page_view","event_name":"home","properties":{"page_path":"/"}}'
```

### 6. Products Loading
```bash
curl http://localhost:3000/api/products
```

### 7. Payment Integration
- Configure Cashfree credentials
- Test webhook at: `/api/payments/webhook`
- Test order creation: `POST /api/payments/create`

## Troubleshooting

### "Missing required environment variable: DATABASE_URL"
- Check `.env.local` or system environment variables
- Ensure MySQL server is running: `mysql -u root -p`
- Verify connection string format

### "Database connection failed"
- Middleware error means Prisma can't connect
- Check MySQL is running: `docker-compose ps` or `service mysql status`
- Verify DATABASE_URL is correct

### "Admin login fails"
- Ensure admin was created: Check `admin_profiles` table
- Verify JWT_SECRET is set (not empty)
- Check password is correctly hashed: `pnpm prisma studio`

### "Cashfree payments not working"
- Verify CASHFREE_APP_ID and CASHFREE_SECRET_KEY in production
- Check webhook is properly configured in Cashfree dashboard
- Test webhook manually: `POST /api/payments/webhook`

### "Build fails with Prisma errors"
```bash
# Regenerate Prisma client
pnpm prisma generate

# Rebuild
pnpm build
```

## Admin Features

### Dashboard (`/admin`)
- Customer count
- Order statistics
- Revenue tracking
- Recent activity feed

### Analytics (`/admin/analytics`)
- User event tracking
- Page view statistics
- Event distribution
- Top pages

### Future Additions
- Order management
- Customer management
- Revenue reports
- Payment status tracking

## Security Best Practices

1. **JWT Secret:** Generate 32-char random string for production
   ```bash
   openssl rand -hex 32
   ```

2. **Password Security:** Passwords are hashed with bcrypt (10 rounds)
   - Stored securely in database
   - Never logged or exposed

3. **Environment Variables:** Never commit `.env.local` to git
   - Add to `.gitignore`
   - Use `.env.example` as template

4. **CORS:** Configure for your domain in production
   - Edit `next.config.js` if needed

5. **Admin Routes:** Protected with JWT middleware
   - All admin endpoints verify token
   - Token expires after 24 hours

## Monitoring & Logs

### Development Logs
```
[Config] ✓ All required environment variables validated
[Startup] Testing database connection...
[Startup] ✓ Database connection successful
[Startup] Creating default admin user...
[Startup] ✓ Admin user created: admin@example.com
```

### Production Logs
- All logs output to stdout/stderr
- Use Vercel logs or server logs
- Check error messages for failed initialization

## Maintenance

### Regular Backups
```bash
# MySQL backup
mysqldump -u root -p zws_cloud > backup-$(date +%Y%m%d).sql

# With Docker
docker-compose exec mysql mysqldump -uroot -proot zws_cloud > backup.sql
```

### Migrate to New Database
```bash
# 1. Set DATABASE_URL to new server
# 2. Run: pnpm prisma db push
# 3. Restart application
```

### Update Admin Password
```bash
# Login to Prisma Studio
pnpm prisma studio

# Edit admin_profiles table
# Manually update hashed password (requires bcrypt hash)
```

## Support & Resources

- **Prisma Docs:** https://www.prisma.io/docs/
- **Next.js Docs:** https://nextjs.org/docs
- **Cashfree Docs:** https://docs.cashfree.com/
- **MySQL Docs:** https://dev.mysql.com/doc/

## Migration Summary

This project was migrated from Supabase to MySQL with:
- ✓ All Supabase dependencies removed
- ✓ Prisma ORM fully integrated
- ✓ MySQL schema created and validated
- ✓ Admin authentication system rebuilt
- ✓ API routes refactored
- ✓ Dynamic data loading implemented
- ✓ Production-ready configuration
- ✓ Environment validation system
- ✓ Automatic admin initialization
