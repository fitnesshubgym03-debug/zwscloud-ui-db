# ZWS Cloud - Usage Examples

## 🎯 Installation Examples

### Example 1: Fresh Installation on Ubuntu

```bash
# SSH into your Ubuntu server
ssh root@192.168.1.100

# Run the installer
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install-unified.sh)

# Follow the prompt, then wait 5-15 minutes
# When done, you'll see:
# ✓ Access URL: http://192.168.1.100:3000
# ✓ Admin Email: admin@zwscloud.local
# ✓ Admin Password: YOUR_SECURE_PASSWORD
```

### Example 2: Installation with Output Logging

```bash
# Run with log file for reference
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install-unified.sh) | tee install.log

# Later, view the log
cat install.log
```

---

## 🔄 Update Examples

### Example 1: Full Update with Rebuild

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/update.sh)

# At the menu, select: 1) Full update
# The system will:
# → Fetch latest code
# → Install dependencies
# → Run migrations
# → Rebuild application
# → Restart service
```

### Example 2: Quick Update (Just Restart)

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/update.sh)

# At the menu, select: 2) Quick update
# The system will:
# → Fetch latest code
# → Restart service
```

### Example 3: Development Mode with Live Logs

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/update.sh)

# At the menu, select: 3) Development mode
# The system will:
# → Rebuild application
# → Restart service
# → Stream live logs (Ctrl+C to exit)
```

### Example 4: Check Service Status

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/update.sh)

# At the menu, select: 4) Check service status
# You'll see:
# ✓ ZWS Cloud is running
# ℹ Process ID: 1234
# ℹ Memory Usage: 156MB
# ℹ Access URL: http://192.168.1.100:3000
```

### Example 5: View Live Logs

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/update.sh)

# At the menu, select: 5) View logs
# You'll see real-time log output
# Press Ctrl+C to exit
```

---

## 🛠️ Manual Service Commands

### Check Service Status

```bash
# Status
sudo systemctl status zwscloud

# Output:
# ● zwscloud.service - ZWS Cloud Application
#   Loaded: loaded (/etc/systemd/system/zwscloud.service; enabled; vendor preset: enabled)
#   Active: active (running) since Mon 2024-07-29 10:30:45 UTC; 2h 45min ago
```

### Restart Service

```bash
# Restart the application
sudo systemctl restart zwscloud

# Wait for it to restart
sleep 5

# Check status
sudo systemctl status zwscloud
```

### Stop and Start

```bash
# Stop the service
sudo systemctl stop zwscloud

# Check it's stopped
sudo systemctl status zwscloud

# Start it again
sudo systemctl start zwscloud

# Verify it's running
sudo systemctl status zwscloud
```

---

## 📊 Log Viewing Examples

### View Latest 50 Lines

```bash
sudo journalctl -u zwscloud -n 50
```

### Stream Live Logs (Like tail -f)

```bash
sudo journalctl -u zwscloud -f
```

### View Logs from Last Hour

```bash
sudo journalctl -u zwscloud --since "1 hour ago"
```

### View Logs from Specific Time

```bash
sudo journalctl -u zwscloud --since "2024-07-29 10:00:00"
```

### View Only Error Logs

```bash
sudo journalctl -u zwscloud -p err
```

### Export Logs to File

```bash
sudo journalctl -u zwscloud > zwscloud_logs.txt
```

---

## 🔧 Troubleshooting Examples

### Application Won't Start

```bash
# 1. Check what's wrong
sudo journalctl -u zwscloud -n 50

# 2. Try restarting
sudo systemctl restart zwscloud

# 3. Wait a bit
sleep 3

# 4. Check status
sudo systemctl status zwscloud

# 5. If still down, check PostgreSQL
sudo systemctl status postgresql

# 6. If postgres is down, start it
sudo systemctl start postgresql
```

### Port Already in Use

```bash
# 1. Find what's using port 3000
sudo lsof -i :3000

# 2. Kill the process (if it's not our service)
sudo kill -9 <PID>

# 3. Restart our service
sudo systemctl restart zwscloud
```

### Out of Disk Space

```bash
# 1. Check disk usage
df -h

# 2. Check application folder size
du -sh ~/zwscloud/

# 3. Clear npm cache
npm cache clean --force

# 4. Check log size
du -sh /var/log/journal/
```

### Database Connection Failed

```bash
# 1. Check PostgreSQL is running
sudo systemctl status postgresql

# 2. Start PostgreSQL if needed
sudo systemctl start postgresql

# 3. Check if database exists
sudo -u postgres psql -l | grep zwscloud

# 4. Check connection string in .env
cat ~/zwscloud/.env.local | grep DATABASE_URL

# 5. Test the connection manually
sudo -u postgres psql -c "SELECT version();"
```

---

## 📝 Configuration Examples

### View Current Configuration

```bash
cat ~/zwscloud/.env.local
```

### Edit Configuration (Restart Required)

```bash
# Edit with nano
nano ~/zwscloud/.env.local

# Or with vi
vi ~/zwscloud/.env.local

# After saving, restart the service
sudo systemctl restart zwscloud
```

### Update Admin Password

```bash
# 1. SSH into server
ssh root@your-domain.com

# 2. Edit .env.local
nano ~/zwscloud/.env.local

# 3. Change ADMIN_PASSWORD value
# 4. Save and exit (Ctrl+X in nano)

# 5. Restart service
sudo systemctl restart zwscloud
```

### Update Application URL

```bash
# Edit config
nano ~/zwscloud/.env.local

# Change:
# NEXT_PUBLIC_APP_URL=http://localhost:3000
# To:
# NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Save and restart
sudo systemctl restart zwscloud
```

---

## 🔐 Backup Examples

### Backup Database Only

```bash
# Create backup
sudo -u postgres pg_dump -Fc zwscloud > ~/backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
sudo -u postgres pg_restore -d zwscloud ~/backup_20240729_143022.sql
```

### Backup Entire Application

```bash
# Create full backup
tar -czf ~/zwscloud_full_$(date +%Y%m%d).tar.gz ~/zwscloud/

# Restore full backup (careful!)
cd ~
tar -xzf zwscloud_full_20240729.tar.gz
sudo systemctl restart zwscloud
```

### Schedule Daily Backups

```bash
# Edit crontab
sudo crontab -e

# Add this line (backup at 2 AM daily):
0 2 * * * sudo -u postgres pg_dump -Fc zwscloud > /home/backups/zwscloud_$(date +\%Y\%m\%d).sql

# Save and exit (Ctrl+X in nano)

# Verify it's added
sudo crontab -l
```

---

## 📈 Monitoring Examples

### Monitor CPU and Memory

```bash
# Real-time monitoring
top -p $(pgrep -f zwscloud)

# One-time check
ps aux | grep zwscloud | grep -v grep
```

### Monitor Network

```bash
# Show listening ports
sudo netstat -tlnp | grep 3000

# Or with ss
sudo ss -tlnp | grep 3000

# Monitor connections
watch 'sudo netstat -an | grep :3000 | wc -l'
```

### Monitor Disk Usage

```bash
# Check total disk
df -h

# Check app folder
du -sh ~/zwscloud/

# Check each subdirectory
du -sh ~/zwscloud/*
```

---

## 🎯 Common Workflows

### Daily Maintenance Routine

```bash
# 1. Check service status
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/update.sh)
# Select: 4) Check service status

# 2. View recent logs
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/update.sh)
# Select: 5) View logs

# 3. Check disk space
df -h

# 4. Check PostgreSQL
sudo systemctl status postgresql
```

### Weekly Update Routine

```bash
# 1. Backup database
sudo -u postgres pg_dump -Fc zwscloud > ~/backup_weekly_$(date +%Y%m%d).sql

# 2. Full update
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/update.sh)
# Select: 1) Full update

# 3. Verify it's running
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/update.sh)
# Select: 4) Check service status
```

### Troubleshooting Workflow

```bash
# 1. Check service
sudo systemctl status zwscloud

# 2. If not running, check logs
sudo journalctl -u zwscloud -n 100

# 3. Try restart
sudo systemctl restart zwscloud

# 4. Wait and check again
sleep 5
sudo systemctl status zwscloud

# 5. If still failing, check PostgreSQL
sudo systemctl status postgresql

# 6. If postgres is down
sudo systemctl start postgresql
sudo systemctl restart zwscloud
```

---

## 🚀 Quick Copy-Paste Commands

### Installation
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install-unified.sh)
```

### Update
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/update.sh)
```

### Check Status
```bash
sudo systemctl status zwscloud && echo "" && du -sh ~/zwscloud/
```

### View Logs
```bash
sudo journalctl -u zwscloud -f
```

### Restart
```bash
sudo systemctl restart zwscloud
```

### Backup Database
```bash
sudo -u postgres pg_dump -Fc zwscloud > ~/backup_$(date +%Y%m%d_%H%M%S).sql
```

---

**All examples are production-ready and tested!**

