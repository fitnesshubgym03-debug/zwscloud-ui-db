# Admin User Setup Guide

## Overview
Admin credentials are managed via environment variables. When you deploy or run the app, the admin user can be automatically created in the database.

## Step 1: Environment Variables
Add these to your `.env.local` (or Vercel project settings under "Settings > Environment Variables"):

```
ADMIN_EMAIL=samvpslio@gmail.com
ADMIN_PASSWORD=Sam@00000
ADMIN_DISPLAY_NAME=Sam
JWT_SECRET=your-secure-random-string-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 2: Initialize Admin User (Choose One Method)

### Method 1: API Call (Simplest for Deployment)
Once your app is running, call this endpoint:

```bash
curl -X POST https://your-domain.com/api/admin/init
```

Response:
```json
{
  "success": true,
  "message": "Admin user created successfully",
  "email": "samvpslio@gmail.com",
  "displayName": "Sam"
}
```

### Method 2: Manual Script
Run locally during development:

```bash
pnpm seed:admin
```

This requires `SUPABASE_SERVICE_ROLE_KEY` in your `.env.local`

### Method 3: Manual Supabase Setup
1. Go to Supabase Dashboard → SQL Editor
2. Execute:
```sql
INSERT INTO public.admin_profiles (email, username, display_name, hashed_password, created_at, updated_at)
VALUES ('samvpslio@gmail.com', 'sam', 'Sam', '$2a$10$...', NOW(), NOW());
```
3. Note: You need to hash the password with bcrypt first

## Step 3: Login
Navigate to `/zwsloginsam` and login with:
- Email: `samvpslio@gmail.com`
- Password: `Sam@00000`

## Admin Dashboard
After logging in, you'll have access to:
- `/admin` - Dashboard with stats and activity
- `/admin/analytics` - Event tracking and analytics
- Full user and payment management

## Changing Admin Password
To change the admin password:
1. Update `ADMIN_PASSWORD` in environment variables
2. Call `/api/admin/init` again (it will update the existing user)

## Important Security Notes
- Never commit `.env` files to version control
- Use strong, unique passwords in production
- The `JWT_SECRET` should be a cryptographically secure random string
- Session tokens expire after 24 hours
- All login attempts are tracked in analytics
