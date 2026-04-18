# MySQL Migration & Setup Guide

## Quick Start (Local Development with Docker)

### 1. Start Docker Services
```bash
pnpm docker:up
```

This starts:
- MySQL 8.0 on localhost:3306
- Redis on localhost:6379
- phpMyAdmin on localhost:8080
- Redis Commander on localhost:8081

### 2. Setup Environment
```bash
cp .env.example .env.local
```

Update `.env.local` with your configuration:
```env
DATABASE_URL="mysql://root:root@localhost:3306/zws_cloud"
REDIS_URL="redis://localhost:6379"
ADMIN_EMAIL="samvpslio@gmail.com"
ADMIN_PASSWORD="Sam@00000"
JWT_SECRET="your-super-secret-jwt-key-change-in-production-32chars"
```

### 3. Generate Prisma Client & Run Migrations
```bash
pnpm db:generate
pnpm db:push
```

### 4. Start Development Server
```bash
pnpm dev
```

Admin initialization happens automatically on first run. Login at `/zwsloginsam`

---

## Database Schema Overview

### Core Tables

#### admin_profiles
- Stores admin user accounts
- Fields: email, username, displayName, hashedPassword, role, lastLogin
- Auto-created on first startup with env credentials

#### customers
- Customer information for invoicing and orders
- Relationships: Orders, Invoices, Payments

#### products
- VPS package offerings (9 pre-seeded products: 2GB-128GB RAM)
- Term-based pricing (1m, 3m, 6m, 12m, 24m)
- Pre-populated with default products

#### custom_configs
- Custom VPS configurations for quotes
- Supports up to 256GB RAM and 64 vCPUs

#### orders
- Purchase orders linking customers to products/configs
- Tracks term, pricing, status, and metadata

#### invoices
- Professional invoices with tax calculation
- Links to orders and payments

#### payments
- Cashfree payment tracking
- Gateway response and error logging

#### analytics_events
- Page views and user interactions
- Indexed by event type and timestamp

#### admin_settings
- Key-value store for pricing config, company info, payment settings

---

## Environment Variables

### Required for Production
```
DATABASE_URL - MySQL connection string
ADMIN_EMAIL - Default admin email
ADMIN_PASSWORD - Default admin password (hashed on startup)
JWT_SECRET - 32-char random string for JWT signing
```

### Optional (with Defaults)
```
CASHFREE_APP_ID - Payment gateway app ID
CASHFREE_SECRET_KEY - Payment gateway secret
CASHFREE_MODE - test or production
REDIS_URL - Redis connection (defaults to localhost)
MAIL_SMTP_* - Email configuration
```

See `.env.example` for complete list with descriptions.

---

## Database Management

### View Database (phpMyAdmin)
Open http://localhost:8080
- User: root
- Password: root
- Database: zws_cloud

### View Redis (Redis Commander)
Open http://localhost:8081

### Prisma Studio
```bash
pnpm db:studio
```
Opens interactive database GUI at localhost:5555

### Reset Database (Local Only)
```bash
docker-compose down -v
docker-compose up -d
pnpm db:push
```

---

## Deployment

### 1. Update .env on Production Server
Set all required environment variables on your hosting platform (Vercel, AWS, etc.)

### 2. Run Database Migrations
```bash
pnpm db:push
```

### 3. Deploy Application
Standard Next.js deployment - no special steps needed.
Admin initialization runs automatically on first request.

### 4. Verify Setup
```bash
curl https://your-domain.com/api/health
```

---

## Troubleshooting

### "Connection refused" on MySQL
- Check Docker is running: `docker ps`
- Restart services: `pnpm docker:down && pnpm docker:up`
- Wait 30 seconds for MySQL to be ready

### "Admin user not created"
- Check DATABASE_URL is correct
- Verify MySQL is accessible
- Check logs: `docker-compose logs mysql`

### "Prisma client not found"
- Run: `pnpm db:generate`

### Admin login fails
- Verify ADMIN_EMAIL and ADMIN_PASSWORD env vars are set
- Check admin_profiles table has the user: Visit phpMyAdmin

---

## Architecture

The MySQL setup uses:
- **Prisma ORM** - Type-safe database queries
- **MySQL 8.0** - Relational database
- **Redis** - Caching and sessions
- **Bcrypt** - Password hashing
- **JWT** - Admin session tokens

All database queries go through Prisma with automatic SQL injection protection.
Admin credentials are hashed with bcrypt (10 rounds) on creation.
JWT tokens expire after 24 hours.

---

## Migration from Supabase (If Applicable)

If you were previously using Supabase:

1. Export Supabase data as SQL
2. Convert to MySQL-compatible syntax
3. Import via phpMyAdmin or mysql CLI
4. Run: `pnpm db:push` to sync with Prisma schema

---

## Next Steps

1. Start Docker: `pnpm docker:up`
2. Setup .env: `cp .env.example .env.local`
3. Run migrations: `pnpm db:push`
4. Start dev: `pnpm dev`
5. Login at `/zwsloginsam` with your credentials
