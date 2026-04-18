# Quick Start - Admin Setup

## Your Admin Credentials
- **Email**: samvpslio@gmail.com
- **Password**: Sam@00000
- **Login URL**: `/zwsloginsam`

## How to Set Up Admin (3 Options)

### Option 1: Automatic via API (Best for Production)
Once deployed to Vercel, simply call:
```
POST https://your-domain.com/api/admin/init
```

This endpoint will automatically:
1. Create the admin_profiles table columns if they don't exist
2. Create or update the admin user in your Supabase database
3. Return success/error status

### Option 2: Using NPM Script (Development)
```bash
# Install dependencies
pnpm install

# Run seed script
pnpm seed:admin
```

This will prompt you for any missing environment variables and set up the admin user.

### Option 3: Manual via Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor
2. Run this query:
```sql
ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS hashed_password TEXT;

INSERT INTO public.admin_profiles (email, username, display_name, hashed_password)
VALUES (
  'samvpslio@gmail.com',
  'sam',
  'Sam',
  '$2a$10$...' -- bcrypt hash of Sam@00000
);
```

## Environment Variables Required

Make sure these are set in your `.env.local` or Vercel project settings:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Admin Credentials
ADMIN_EMAIL=samvpslio@gmail.com
ADMIN_PASSWORD=Sam@00000
ADMIN_DISPLAY_NAME=Sam

# Authentication
JWT_SECRET=your_secure_random_string

# Cashfree (optional, for payments)
CASHFREE_APP_ID=your_app_id
CASHFREE_SECRET_KEY=your_secret_key
CASHFREE_MODE=test
```

## Access Admin Dashboard

After setup, login at `/zwsloginsam`:
- **Dashboard**: `/admin` - View stats, orders, analytics
- **Analytics**: `/admin/analytics` - Track user events and interactions
- **Settings**: Coming soon

## What's Included

✓ Secure password hashing with bcrypt
✓ JWT-based session management
✓ 24-hour session expiry
✓ Login tracking and analytics
✓ Admin activity dashboard
✓ User and payment management
✓ Event analytics tracking

Build is complete and production-ready!
