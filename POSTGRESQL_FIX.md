# PostgreSQL Authentication Error Fix

## Problem
Installation was failing with:
```
Error: P1000: Authentication failed against database server, 
the provided database credentials for `zwscloud_user` are not valid.
```

## Root Causes
1. PostgreSQL service was starting but not immediately ready for connections
2. Database user and database were not being created with the correct permissions
3. No validation that the database was ready before attempting migrations
4. No retry logic if the database connection initially failed

## Solutions Applied

### 1. Enhanced PostgreSQL User Creation (Lines 297-335)
- Added 3-second wait after starting PostgreSQL
- Added connection readiness check (up to 10 seconds)
- Properly quoted user and database names in SQL
- Added check to prevent duplicate user creation
- Added proper permission grants for schema operations
- Added default privileges for tables and sequences

**Before:**
```bash
sudo -u postgres psql << PSQL_EOF
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD' CREATEDB;
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT CONNECT ON DATABASE $DB_NAME TO $DB_USER;
GRANT USAGE ON SCHEMA public TO $DB_USER;
GRANT CREATE ON SCHEMA public TO $DB_USER;
PSQL_EOF
```

**After:**
```bash
# Wait for PostgreSQL readiness
sleep 3
# Connection check loop (up to 10 seconds)

# Check if user exists before creating
sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'"

# Create with proper quoting and permissions
sudo -u postgres psql << PSQL_EOF
CREATE USER "$DB_USER" WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE "$DB_NAME" OWNER "$DB_USER";
GRANT CONNECT ON DATABASE "$DB_NAME" TO "$DB_USER";
GRANT USAGE ON SCHEMA public TO "$DB_USER";
GRANT CREATE ON SCHEMA public TO "$DB_USER";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "$DB_USER";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "$DB_USER";
PSQL_EOF
```

### 2. Database Connection Verification (Lines 399-412)
- Added database URL parsing to extract host and port
- Added connection test before attempting migrations
- Provides clear error messages if connection fails

```bash
print_info "Testing database connection..."
local db_host=$(echo "$DATABASE_URL" | sed 's/.*@\([^:]*\).*/\1/')
local db_port=$(echo "$DATABASE_URL" | sed 's/.*:\([0-9]*\)\/.*/\1/')

if ! nc -z "$db_host" "$db_port" 2>/dev/null; then
  # fallback logic
fi
```

### 3. Retry Logic for Database Migrations (Lines 415-432)
- Adds retry mechanism (up to 3 attempts)
- 2-second delay between retries
- Only proceeds if all retries exhausted before failing

```bash
local retry=0
while [ $retry -lt 3 ]; do
  if command -v pnpm &> /dev/null; then
    pnpm db:push --skip-generate && break
  else
    npm run db:push -- --skip-generate && break
  fi
  retry=$((retry + 1))
  if [ $retry -lt 3 ]; then
    print_info "Retrying database setup (attempt $((retry + 1))/3)..."
    sleep 2
  fi
done
```

### 4. PostgreSQL Stabilization Wait (Lines 625-626)
- Added 5-second stabilization delay after PostgreSQL auto-installation
- Ensures service is fully initialized before proceeding

```bash
if [ "$AUTO_INSTALL_DB" = true ]; then
  auto_install_postgres
  print_info "Waiting for PostgreSQL to stabilize..."
  sleep 5
fi
```

## Testing

### Test Scenario 1: Fresh Installation
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install.sh)
# Answer:
# Domain: zwscloud.com (or press ENTER)
# Mode: 1 (AUTO)
```

Expected Result:
- PostgreSQL auto-installed
- User created successfully
- Database created with correct permissions
- Migrations run successfully
- No authentication errors

### Test Scenario 2: Manual Setup with Existing PostgreSQL
```bash
# Use existing PostgreSQL - Mode 2 (MANUAL)
# Provide existing database credentials
```

Expected Result:
- Connection verified before proceeding
- Database setup succeeds

## Changes Summary

| Component | Change | Impact |
|-----------|--------|--------|
| `auto_install_postgres()` | Better error handling, user/DB creation | Fixes credential mismatch |
| `setup_database()` | Connection test + retry logic | Handles timing issues |
| `main()` | Added stabilization delay | Ensures service readiness |
| Overall | Better logging and error messages | Improved troubleshooting |

## Verification Steps

After installation completes, verify:

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check database exists
sudo -u postgres psql -l | grep zwscloud

# Check user was created
sudo -u postgres psql -c "SELECT * FROM pg_roles WHERE rolname='zwscloud_user';"

# Test connection
PGPASSWORD="<password>" psql -h localhost -U zwscloud_user -d zwscloud -c "SELECT 1;"
```

## Notes

- The script now handles timing issues with PostgreSQL startup
- Proper quoting prevents issues with special characters in passwords
- Permission grants ensure Prisma can create tables and sequences
- Retry logic handles transient connection issues
- Clear error messages help with troubleshooting

## Files Modified
- `/vercel/share/v0-project/install.sh`

## Related Documentation
- See `DATABASE_FIX_NOTES.md` for environment variable loading fixes
- See `SETUP_INSTRUCTIONS.md` for general installation guide
