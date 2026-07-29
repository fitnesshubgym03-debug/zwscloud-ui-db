# ZWS Cloud - Setup Instructions

## Overview

ZWS Cloud now uses **TWO SEPARATE COMMANDS** for installation and updates:

1. **install.sh** - For initial setup (run ONCE)
2. **update-app.sh** - For updates and live testing (run anytime after installation)

---

## Installation (First Time Only)

### Command

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install.sh)
```

### Installation Flow

The installer will ask you these questions in this order:

#### Step 1: Domain Configuration
```
Enter your domain or IP address where ZWS Cloud will be hosted
Examples: zwscloud.com, app.zwscloud.com, 192.168.1.100, localhost
```

**Enter:**
- Your domain name (e.g., `zwscloud.com`)
- Your subdomain (e.g., `app.zwscloud.com`)
- Your IP address (e.g., `192.168.1.100`)
- Or `localhost` for local testing

#### Step 2: Setup Mode
```
Choose your configuration mode:
  1) AUTO MODE (Recommended - generates all configurations automatically)
  2) MANUAL MODE (Configure each setting step by step)
```

**Choose:**
- **Option 1 (AUTO)** - Fastest option, generates all credentials randomly
  - Admin email: `admin@zwscloud`
  - Admin password: Auto-generated and shown
  - Database: Auto-installed with random credentials
  - JWT Secret: Auto-generated
  
- **Option 2 (MANUAL)** - Full control over all settings
  - Enter admin email
  - Enter admin password
  - Enter database host/port/name/user/password
  - Choose auto-install or use existing database

#### Step 3: Automatic Setup
The installer will then automatically:
1. Check prerequisites (Node.js, git, pnpm)
2. Clone the repository
3. Install PostgreSQL (if auto mode or option 1 selected)
4. Create environment files
5. Install dependencies
6. Setup database
7. Build application
8. Create systemd service
9. Verify installation

### Example AUTO Installation

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install.sh)

# When prompted:
# Domain: zwscloud.com
# Setup Mode: 1 (AUTO)
# Then wait... it does everything automatically
```

### Example MANUAL Installation

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install.sh)

# When prompted:
# Domain: app.zwscloud.com
# Setup Mode: 2 (MANUAL)
# Admin Email: admin@example.com
# Admin Password: MySecurePassword123
# Admin Name: John Admin
# Database Host: localhost
# Database Port: 5432
# Database Name: zwscloud
# Database User: postgres
# Database Password: postgres_password
# Choose: 1 (Auto-install PostgreSQL)
```

---

## After Installation

Once installation is complete, you will see:

```
📊 Installation Summary:

  Domain:             zwscloud.com
  App URL:            https://zwscloud.com
  Admin Email:        admin@zwscloud
  Admin Password:     xxxxxxxxxxxxxxxx
  Database:           zwscloud (postgresql://zwscloud_user:**@localhost:5432)
  Install Location:   /root/zwscloud
  Service:            zwscloud (systemd)

🚀 Your application is ready!
Access: https://zwscloud.com
```

---

## Updates & Live Testing

### Command

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/update-app.sh)
```

### Interactive Menu Options

```
Choose an option:

  1) Full update (pull + rebuild + restart)
     - Gets latest code
     - Rebuilds application
     - Restarts service
     - Use when major changes made

  2) Quick update (pull + restart only)
     - Gets latest code
     - Restarts service
     - Faster, for minor changes

  3) Development mode (hot reload)
     - Starts dev server with live reload
     - Perfect for live testing
     - Press Ctrl+C to exit

  4) Check service status
     - Shows if service is running
     - Shows uptime and stats

  5) View logs
     - Shows real-time application logs
     - Press Ctrl+C to exit

  6) Restart service
     - Restarts the application
     - Keep it running

  7) Stop service
     - Stops the application
     - Service is not running

  8) Start service
     - Starts the application
     - Service will run

  9) Exit
     - Exit the menu
```

### Usage Examples

#### Update from latest code and restart

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/update-app.sh)
# Choose: 1 (Full update)
```

#### Quick restart

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/update-app.sh)
# Choose: 2 (Quick update)
```

#### Live testing with hot reload

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/update-app.sh)
# Choose: 3 (Development mode)
# Code changes will reload in real-time
```

#### View live logs

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/update-app.sh)
# Choose: 5 (View logs)
# Watch logs in real-time
```

---

## Service Management (Manual Commands)

### Check Status

```bash
sudo systemctl status zwscloud
```

### View Logs

```bash
# Last 50 lines
sudo journalctl -u zwscloud -n 50

# Real-time logs
sudo journalctl -u zwscloud -f

# Specific time period
sudo journalctl -u zwscloud --since "10 minutes ago"
```

### Restart Service

```bash
sudo systemctl restart zwscloud
```

### Stop Service

```bash
sudo systemctl stop zwscloud
```

### Start Service

```bash
sudo systemctl start zwscloud
```

### View Service Info

```bash
systemctl show zwscloud
```

---

## Troubleshooting

### Application won't start

```bash
# Check logs
sudo journalctl -u zwscloud -n 50

# Check if port is in use
sudo lsof -i :3000

# Restart
sudo systemctl restart zwscloud
```

### Database connection error

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check database exists
sudo -u postgres psql -l

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Build failed

```bash
# Clear build cache
rm -rf .next node_modules

# Rebuild
pnpm install
pnpm build
```

### Port already in use

```bash
# Find what's using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Or use different port in .env.local
# PORT=3001
```

---

## Configuration

### Edit Settings

After installation, you can edit `/root/zwscloud/.env.local`:

```bash
# View config
cat /root/zwscloud/.env.local

# Edit config
nano /root/zwscloud/.env.local

# Restart to apply changes
sudo systemctl restart zwscloud
```

### Update Admin Password

1. Connect to database:
```bash
sudo -u postgres psql zwscloud
```

2. Update password (requires hash):
```sql
UPDATE users SET password_hash = '<new_hash>' WHERE email = 'admin@zwscloud';
```

### Change Domain

1. Edit `.env.local`:
```bash
NEXT_PUBLIC_APP_URL="https://new-domain.com"
NEXT_PUBLIC_DOMAIN="new-domain.com"
```

2. Restart:
```bash
sudo systemctl restart zwscloud
```

---

## Backup & Restore

### Backup Database

```bash
sudo -u postgres pg_dump zwscloud > zwscloud_backup.sql
```

### Restore Database

```bash
sudo -u postgres psql zwscloud < zwscloud_backup.sql
```

### Backup Application

```bash
tar -czf zwscloud_backup.tar.gz /root/zwscloud
```

---

## Monitoring

### Check Disk Space

```bash
df -h
```

### Check Memory Usage

```bash
free -h
```

### Check CPU Usage

```bash
top -b -n 1
```

### Monitor Real-time

```bash
# Open update tool
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/update-app.sh)
# Choose: 5 (View logs)
```

---

## Key Differences

### Before (Old Way)
- Two separate commands needed
- Manual prompts scattered throughout
- Everything combined into one flow
- Confusing for updates

### After (New Way)
- **install.sh** - Separate installation command
- **update-app.sh** - Separate update/testing command
- Domain asked FIRST (most important)
- Setup mode second (auto or manual)
- Clear separation of concerns
- Easy to run updates repeatedly

---

## Summary

| Task | Command |
|------|---------|
| **Initial Setup** | `bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install.sh)` |
| **Update & Test** | `bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/update-app.sh)` |
| **Check Status** | `sudo systemctl status zwscloud` |
| **View Logs** | `sudo journalctl -u zwscloud -f` |
| **Restart** | `sudo systemctl restart zwscloud` |
| **Edit Config** | `nano /root/zwscloud/.env.local` |

---

## Support

If you encounter any issues:

1. Check logs: `sudo journalctl -u zwscloud -n 100`
2. Try full update: Run update-app.sh and choose option 1
3. Restart service: `sudo systemctl restart zwscloud`
4. Check prerequisites: Node.js, PostgreSQL, git

---

**Version**: 2.0  
**Last Updated**: July 29, 2024  
**Status**: Production Ready
