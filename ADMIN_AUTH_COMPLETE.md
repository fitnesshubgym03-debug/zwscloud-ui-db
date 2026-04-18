Admin Authentication Setup Complete
====================================

STATUS: Production Ready

Admin Credentials Configuration
-------------------------------
Email: samvpslio@gmail.com
Password: Sam@00000
Display Name: Sam (optional)

How It Works
-----------
1. Admin credentials are read from environment variables:
   - ADMIN_EMAIL
   - ADMIN_PASSWORD
   - ADMIN_DISPLAY_NAME (optional)

2. On first access to /zwsloginsam:
   - User enters credentials
   - API checks admin_profiles table in Supabase
   - Password verified with bcrypt
   - JWT token issued for 24-hour session
   - Login attempt logged in analytics

3. Admin user is created automatically via:
   - POST /api/admin/init endpoint
   - pnpm seed:admin script
   - Or manually in Supabase

Admin Access URLs
-----------------
Login: /zwsloginsam
Dashboard: /admin
Analytics: /admin/analytics

Initialize Admin User (Choose One)
----------------------------------

Option 1 - API Call (Recommended for Deployment)
curl -X POST https://your-domain.com/api/admin/init

Option 2 - NPM Script (Development)
pnpm seed:admin
(requires SUPABASE_SERVICE_ROLE_KEY in .env)

Option 3 - Manual (Supabase Dashboard)
Use Supabase SQL Editor to insert admin user

Database Schema
---------------
admin_profiles table includes:
- id (UUID primary key)
- email (TEXT unique)
- username (TEXT)
- display_name (TEXT)
- hashed_password (TEXT, bcrypt)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
- last_login (TIMESTAMPTZ)

Security Features
-----------------
✓ Passwords hashed with bcrypt (10 rounds)
✓ JWT tokens with 24-hour expiration
✓ HTTP-only secure cookies
✓ Login attempts tracked in analytics
✓ CSRF protection via middleware
✓ Session validation on every request

Files Modified/Created
---------------------
- app/api/admin/auth/login/route.ts - Updated with bcrypt verification
- app/api/admin/init/route.ts - New endpoint to initialize admin
- lib/admin-setup.ts - Admin setup utility
- scripts/seed-admin-user.mjs - Node script for seeding
- scripts/004_update_admin_profiles.sql - Database migration
- ADMIN_SETUP_GUIDE.md - Complete setup documentation

Next Steps
----------
1. Add environment variables to Vercel project
2. Deploy the application
3. Call /api/admin/init to create admin user
4. Login at /zwsloginsam with provided credentials
5. Access admin dashboard at /admin
