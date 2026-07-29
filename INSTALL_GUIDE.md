# ZWS Cloud Installation Guide

## Quick Start - Unified Installer (Recommended)

The new unified installer handles everything automatically with a single command:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install-unified.sh)
```

### What the installer does:
✓ Detects your operating system  
✓ Installs all system dependencies (Node.js, PostgreSQL, git, etc.)  
✓ Auto-installs PostgreSQL with random secure credentials  
✓ Clones/updates the repository  
✓ Configures environment variables automatically  
✓ Builds the application  
✓ Sets up a systemd service for auto-startup  
✓ Starts the application  

### Supported Systems:
- Ubuntu 18.04+
- Debian 9+
- CentOS 7+
- RHEL 7+
- Fedora 30+

### After Installation:
Once the installer completes, you'll see:
- **Access URL**: Your application URL (e.g., `http://192.168.1.100:3000`)
- **Admin Email**: Your admin login email
- **Admin Password**: Your randomly generated admin password (save this!)
- **Database Info**: Connection details

---

## Managing Your Installation

### Update Your Application (Live Testing)

Use the update script to pull latest changes and test live:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/update.sh)
```

The update script provides:
1. **Full Update** - Pull changes + install deps + rebuild + restart (recommended)
2. **Quick Update** - Pull changes + restart only
3. **Development Mode** - Rebuild + restart + watch logs
4. **Check Status** - View service status and resource usage
5. **View Logs** - Stream live application logs
6. **Restart Service** - Restart the application
7. **Stop Service** - Stop the application
8. **Start Service** - Start the application

---

## Service Management

Once installed, manage your application with systemd:

### View Application Status
```bash
sudo systemctl status zwscloud
```

### Start/Stop/Restart
```bash
sudo systemctl start zwscloud
sudo systemctl stop zwscloud
sudo systemctl restart zwscloud
```

### View Live Logs
```bash
sudo journalctl -u zwscloud -f
```

### View Recent Logs
```bash
sudo journalctl -u zwscloud -n 50
```

### Enable Auto-startup on Boot
```bash
sudo systemctl enable zwscloud
```

---

## Environment Configuration

After installation, edit the environment file if needed:

```bash
nano ~/zwscloud/.env.local
```

### Available Variables:
```
DATABASE_URL=postgresql://user:password@host:port/database
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_password
JWT_SECRET=random_jwt_secret
NEXT_PUBLIC_APP_URL=http://your-domain.com
DEFAULT_PAYMENT_GATEWAY=razorpay
NODE_ENV=production
```

### After Changes:
```bash
sudo systemctl restart zwscloud
```

---

## SSL/HTTPS Setup

For production, set up SSL with Let's Encrypt:

### Using Certbot (Recommended)
```bash
sudo apt-get install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# The certificates will be at:
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

### Auto-renewal
```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## Troubleshooting

### Application won't start
```bash
# Check service status
sudo systemctl status zwscloud

# View detailed logs
sudo journalctl -u zwscloud -n 100 -v

# Restart service
sudo systemctl restart zwscloud
```

### Database connection issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Connect to database
sudo -u postgres psql -c "SELECT version();"

# Check database exists
sudo -u postgres psql -l | grep zwscloud
```

### Out of disk space
```bash
# Check disk usage
df -h

# Clear npm cache
npm cache clean --force

# Check application logs size
du -sh ~/zwscloud/
```

### Port 3000 already in use
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process (if needed)
sudo kill -9 <PID>

# Restart service
sudo systemctl restart zwscloud
```

---

## Performance Monitoring

### Check Memory/CPU Usage
```bash
# Real-time monitoring
top -p $(pgrep -f zwscloud)

# One-time check
ps aux | grep zwscloud | grep -v grep
```

### Check Disk I/O
```bash
iostat -x 1 5
```

### Monitor Network
```bash
netstat -an | grep :3000
ss -tuln | grep 3000
```

---

## Upgrading

To upgrade to the latest version:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/update.sh)
# Select option 1: Full update
```

Or manually:
```bash
cd ~/zwscloud
git pull origin main
npm install
npm run migrate
npm run build
sudo systemctl restart zwscloud
```

---

## Backing Up Your Data

### Database Backup
```bash
sudo -u postgres pg_dump -Fc zwscloud > ~/zwscloud_backup_$(date +%Y%m%d).sql
```

### Full Backup
```bash
tar -czf ~/zwscloud_full_backup_$(date +%Y%m%d).tar.gz ~/zwscloud/
```

### Automated Daily Backup
```bash
# Add to crontab
sudo crontab -e

# Add this line for daily 2 AM backup:
0 2 * * * sudo -u postgres pg_dump -Fc zwscloud > /home/backups/zwscloud_$(date \+\%Y\%m\%d).sql
```

---

## Security Best Practices

1. **Change Admin Password** - Done in admin panel after login
2. **Use Strong Database Password** - Auto-generated, stored in `.env.local`
3. **Enable Firewall** - Restrict access to your application
4. **Update Regularly** - Use the update script weekly
5. **Monitor Logs** - Review logs for suspicious activity
6. **Backup Data** - Daily backups are essential
7. **Use HTTPS** - Set up SSL certificate (see SSL Setup section)
8. **Disable Root SSH** - Use key-based authentication

---

## Support

For issues or questions:
- Check logs: `sudo journalctl -u zwscloud -f`
- Review the troubleshooting section above
- Visit: https://github.com/fitnesshubgym03-debug/zwscloud-ui-db

---

## Version Information

- **Installer**: Unified Installer v2.0
- **Last Updated**: 2024
- **Supported Node**: 20.x LTS
- **Supported PostgreSQL**: 12+

