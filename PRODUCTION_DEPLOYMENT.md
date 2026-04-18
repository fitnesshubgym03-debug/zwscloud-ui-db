# Production Deployment Guide

## Database Configuration ✅

Your Neon PostgreSQL database is now configured and ready:
- **Database**: `neondb` at `ep-steep-cloud-am7fve70-pooler.c-5.us-east-1.aws.neon.tech`
- **Schema**: Fully migrated and synced with Prisma
- **Provider**: PostgreSQL (changed from MySQL)
- **Status**: ✅ Live and operational

## Environment Variables

### Required for Production (Set in Vercel)

**CRITICAL - Must be set before deployment:**

1. **DATABASE_URL** - Your Neon PostgreSQL connection string
   ```
   postgresql://neondb_owner:npg_Nqm1KbstpZu6@ep-steep-cloud-am7fve70-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```

2. **JWT_SECRET** - MUST be a secure random string (minimum 32 characters)
   - Generate using: `openssl rand -base64 32`
   - Example format: `aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5z`
   - Store ONLY in Vercel environment variables, NEVER in code or version control

### Optional Configuration

- **ADMIN_EMAIL** - Default: `admin@example.com`
- **ADMIN_PASSWORD** - Default: `AdminPassword123!`
- **SESSION_TIMEOUT_MINUTES** - Default: 1440 (24 hours)
- **NODE_ENV** - Set to `production` for Vercel

## Security Checklist

✅ **JWT_SECRET Hardcoding**: FIXED
- All files now read JWT_SECRET from environment only
- No defaults or fallbacks in code
- Middleware, auth routes, and utilities updated

✅ **Database Credentials**: SECURED
- DATABASE_URL only in .env.local (not committed to git)
- Connection string uses SSL/TLS (sslmode=require)

✅ **.gitignore Configuration**: COMPREHENSIVE
- Excludes .env files
- Excludes backup and archive files
- Excludes cryptographic files (.pem, .key, .crt, etc.)
- Excludes secrets/ and backups/ directories

✅ **Route Protection**: IMPLEMENTED
- Admin routes require admin role
- Protected routes require authentication
- Middleware redirects unauthenticated users

## Database Tables Created

1. **users** - Unified user authentication
2. **admin_profiles** - Legacy admin users (backward compatible)
3. **customers** - Customer records with user relationships
4. **orders** - Order management
5. **custom_configs** - Configuration storage
6. **invoices** - Invoice tracking
7. **payments** - Payment records
8. **analytics_events** - Event tracking
9. **subscription_plans** - Subscription management

## Deployment Steps

### 1. Set Environment Variables in Vercel

Go to Vercel Project Settings → Environment Variables and add:

```
DATABASE_URL=postgresql://neondb_owner:npg_Nqm1KbstpZu6@ep-steep-cloud-am7fve70-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

JWT_SECRET=<your-generated-32-char-secret>

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<secure-password>

NODE_ENV=production
```

### 2. Push to GitHub

```bash
git add .
git commit -m "chore: configure unified auth with Neon PostgreSQL"
git push origin main
```

### 3. Deploy to Vercel

Vercel will automatically:
1. Install dependencies
2. Run build process
3. Deploy with environment variables

### 4. Initialize Admin User (Optional)

To create an admin account, run this script locally:

```bash
export DATABASE_URL="your-connection-string"
pnpm seed:users
```

## Testing the Authentication Flow

1. **Register a new user**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password123","name":"John"}'
   ```

2. **Login**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password123"}'
   ```

3. **Check session**:
   ```bash
   curl -X GET http://localhost:3000/api/auth/session \
     -H "Cookie: auth_token=<token-from-login>"
   ```

## Monitoring & Maintenance

### Check Database Connection

```bash
pnpm prisma studio  # Opens Prisma database viewer
```

### View Logs

```bash
# Local development
pnpm dev  # Logs appear in terminal

# Production (Vercel)
# Go to Vercel → Deployments → Logs
```

### Backup Data

```bash
./backup-sensitive.sh  # Creates encrypted backup
```

### Update Schema

```bash
pnpm prisma migrate dev --name add_new_table
```

## Troubleshooting

### "Database error. Please try again later"
- Check that DATABASE_URL is set correctly in Vercel
- Verify Neon database is running
- Check Vercel logs for connection errors

### "JWT_SECRET not configured"
- Ensure JWT_SECRET is set in Vercel environment variables
- JWT_SECRET must be at least 32 characters
- Redeploy after setting the variable

### "Cannot read properties of undefined (reading 'findUnique')"
- This means DATABASE_URL or JWT_SECRET is not configured
- Check Vercel environment variables
- Local development: ensure .env.local is set

## Support & Resources

- **Neon Documentation**: https://neon.tech/docs
- **Prisma Documentation**: https://www.prisma.io/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **JWT Best Practices**: https://tools.ietf.org/html/rfc7519

---

**Last Updated**: April 2026  
**Status**: Production Ready  
**Database**: Neon PostgreSQL  
**Auth**: JWT + HTTP-only Cookies
