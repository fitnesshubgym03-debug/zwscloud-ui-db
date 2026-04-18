## Admin Setup Guide

### Quick Start

The admin system is fully automated. Here's what you need to do:

#### 1. Set Environment Variables

Add these to your `.env.local` file (for local development) or Vercel project settings:

```bash
# Required: Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Required: Admin Credentials
ADMIN_EMAIL=samvpslio@gmail.com
ADMIN_PASSWORD=Sam@00000
ADMIN_DISPLAY_NAME=Sam
```

**How to find Supabase keys:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **Settings** → **API**
4. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this SECRET)

#### 2. Install Dependencies

```bash
pnpm install
```

This will install `ts-node`, `tsx`, and `dotenv` needed for the seed script.

#### 3. Seed the Admin User

```bash
pnpm seed:admin
```

**Output example:**
```
🔐 Starting admin user setup for: samvpslio@gmail.com

📊 Checking database schema...
✓ Database schema ready
🔍 Checking for existing admin user...
✓ Admin user not found, creating new user...
✓ Admin user created successfully!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Admin credentials ready for login:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email:    samvpslio@gmail.com
🔑 Password: Sam@00000
📍 Login URL: http://localhost:3000/zwsloginsam
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 4. Start Development Server

```bash
pnpm dev
```

#### 5. Login to Admin

1. Go to `http://localhost:3000/zwsloginsam`
2. Enter:
   - Email: `samvpslio@gmail.com`
   - Password: `Sam@00000`
3. Access admin dashboard at `http://localhost:3000/admin`

---

### How It Works

#### Environment Variables

| Variable | Type | Where Used | Required |
|----------|------|-----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Frontend & Backend | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Frontend & Backend | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Backend + Seed Script | Yes |
| `ADMIN_EMAIL` | Secret | Seed Script + Auth | Yes |
| `ADMIN_PASSWORD` | Secret | Seed Script + Auth | Yes |
| `ADMIN_DISPLAY_NAME` | Optional | Seed Script | No |
| `JWT_SECRET` | Secret | Backend (optional) | No |

**Key Security Notes:**
- `SUPABASE_SERVICE_ROLE_KEY` should **never** be exposed in client-side code or frontend bundles
- It's only used server-side for seeding and admin operations
- `ADMIN_PASSWORD` is hashed with bcrypt (10 rounds) before storage
- JWT tokens expire after 24 hours

#### Seed Process

1. **Validates env vars** - Checks that all required variables are set
2. **Checks schema** - Ensures `admin_profiles` table has `email` and `hashed_password` columns
3. **Checks existing user** - If admin exists, updates password; otherwise creates new user
4. **Hashes password** - Uses bcrypt to hash the password before storing
5. **Creates profile** - Stores admin user in `admin_profiles` table

The seed is **idempotent** - running it multiple times is safe.

#### Login Flow

1. User submits email + password at `/zwsloginsam`
2. Backend looks up admin in `admin_profiles` table
3. Bcrypt compares submitted password with stored hash
4. If valid, JWT token is created and stored in HTTP-only cookie
5. User redirected to `/admin` dashboard

#### Database Schema

The `admin_profiles` table stores:
- `id` (UUID, primary key)
- `email` (TEXT, unique) - Used for login
- `username` (TEXT) - Display purpose
- `display_name` (TEXT) - Full display name
- `hashed_password` (TEXT) - Bcrypt hashed password
- `last_login` (TIMESTAMPTZ) - Last successful login timestamp
- `created_at`, `updated_at` - Timestamps

---

### Troubleshooting

#### "Missing Supabase environment variables"

**Error:** 
```
❌ Missing environment variable: NEXT_PUBLIC_SUPABASE_URL
```

**Solution:**
1. Check that `.env.local` exists in the project root
2. Ensure variables are set correctly with no extra spaces
3. For Vercel deployment, add variables in **Settings → Environment Variables**

#### "Service role key invalid"

**Error:**
```
❌ Missing environment variable: SUPABASE_SERVICE_ROLE_KEY
```

**Solution:**
1. Go to Supabase Dashboard
2. Project → Settings → API
3. Copy the exact value of `service_role secret` (includes "eyJ..." format)
4. Paste into `.env.local` or Vercel settings

#### "Admin user already exists"

If running `pnpm seed:admin` multiple times, the script will:
- Skip creation if user exists
- Update password if you changed `ADMIN_PASSWORD`

To change the admin password:
1. Update `ADMIN_PASSWORD` in `.env.local`
2. Run `pnpm seed:admin` again

#### "Invalid credentials" on login

1. Verify the email/password are correct in `.env.local`
2. Check that the seed command ran successfully
3. In Supabase Dashboard, query the `admin_profiles` table:
   ```sql
   SELECT email, display_name, created_at FROM admin_profiles;
   ```
4. If no row exists, run `pnpm seed:admin` again

---

### Production Deployment

#### Vercel

1. **Set Environment Variables:**
   - Go to **Project Settings → Environment Variables**
   - Add all required variables (marked as "Production")
   - Never commit `.env.local` to git

2. **Initial Deployment:**
   - The seed script runs locally before deployment
   - After deploying to Vercel, call the API to initialize:
     ```bash
     curl -X POST https://your-domain.vercel.app/api/admin/init
     ```
   - Or log in immediately - the admin should already exist

3. **Database Connection:**
   - Vercel app will use `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from environment
   - Supabase RLS policies protect data access

---

### Files Changed / Created

| File | Purpose |
|------|---------|
| `scripts/seed-admin-user.ts` | Main admin seeding script |
| `app/api/admin/auth/login/route.ts` | Admin login endpoint |
| `app/api/admin/init/route.ts` | Admin initialization API |
| `app/admin/layout.tsx` | Admin dashboard layout with auth check |
| `app/zwsloginsam/page.tsx` | Admin login page |
| `package.json` | Updated with ts-node, tsx, dotenv |

---

### Next Steps

After admin setup:

1. **Create more admins** - Use the same seed process with different `ADMIN_EMAIL` and `ADMIN_PASSWORD`
2. **Manage users** - Admin dashboard at `/admin` shows users and analytics
3. **View logs** - Check analytics at `/admin/analytics`
4. **Customize** - Edit admin pages in `app/admin/` folder
