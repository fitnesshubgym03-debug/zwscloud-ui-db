# Database Environment Variable Fix

## Problem Found
The installation was failing with:
```
Error: Environment variable not found: DATABASE_URL
```

This occurred when `prisma db push` tried to run migrations.

## Root Causes

1. **Missing DATABASE_URL in AUTO mode**: The `get_configuration()` function in AUTO mode was not constructing the `DATABASE_URL` variable
2. **Environment variables not loaded**: Functions like `setup_database()`, `create_admin()`, and `build_app()` were not sourcing the `.env.local` file before running commands that needed `DATABASE_URL`

## Fixes Applied

### 1. Added DATABASE_URL to AUTO Mode
**File**: `install.sh` (line ~201)

Before:
```bash
DB_PASSWORD=$(openssl rand -base64 32 | tr -d '=' | tr '+/' '-_')
DATABASE_TYPE="postgres"

JWT_SECRET=$(openssl rand -base64 32)
```

After:
```bash
DB_PASSWORD=$(openssl rand -base64 32 | tr -d '=' | tr '+/' '-_')
DATABASE_TYPE="postgres"
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

JWT_SECRET=$(openssl rand -base64 32)
```

### 2. Load Environment in setup_database()
**File**: `install.sh` (line ~355)

Added environment variable sourcing:
```bash
# Source environment variables
if [ -f .env.local ]; then
  set -a
  source .env.local
  set +a
  print_info "Environment variables loaded"
fi

# Verify DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  print_error "DATABASE_URL is not set"
  exit 1
fi
```

### 3. Load Environment in create_admin()
**File**: `install.sh` (line ~438)

Added before running Node script:
```bash
# Load environment variables for admin creation
if [ -f .env.local ]; then
  set -a
  source .env.local
  set +a
fi
```

### 4. Load Environment in build_app()
**File**: `install.sh` (line ~458)

Added before running build:
```bash
# Load environment variables for build
if [ -f .env.local ]; then
  set -a
  source .env.local
  set +a
fi
```

## How It Works Now

1. **create_env_file()** creates `.env.local` with all variables including `DATABASE_URL`
2. **setup_database()** sources `.env.local` before running Prisma migrations
3. **create_admin()** sources `.env.local` before running admin creation script
4. **build_app()** sources `.env.local` before building Next.js app

## Installation Flow (Fixed)

```
1. User runs install.sh
2. Question 1: Enter domain
3. Question 2: Choose AUTO or MANUAL
4. Configuration is generated (including DATABASE_URL)
5. .env.local file is created with all variables
6. setup_database() sources .env.local → DATABASE_URL available ✓
7. create_admin() sources .env.local → env variables available ✓
8. build_app() sources .env.local → env variables available ✓
9. Installation completes successfully ✓
```

## Testing the Fix

After applying these fixes, run:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install.sh)
```

Choose:
- Domain: `localhost` or your domain
- Mode: `1` (AUTO)

The installation should now proceed without the "DATABASE_URL not found" error.

## Files Modified

- `/vercel/share/v0-project/install.sh`
  - Line 201: Added `DATABASE_URL` construction in AUTO mode
  - Lines 359-373: Added env loading in `setup_database()`
  - Lines 438-444: Added env loading in `create_admin()`
  - Lines 458-464: Added env loading in `build_app()`

## Verification

To verify the fixes are in place:

```bash
# Check if DATABASE_URL is set in AUTO mode
grep -n "DATABASE_URL=" install.sh | head -5

# Check if env loading exists in setup_database
grep -A 5 "set -a" install.sh | head -20
```

All environment variables should now be properly loaded and available for all commands.
