# ZWS Cloud - Quick Start Guide

## 🚀 Installation (One Command - Fully Automatic)

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install-unified.sh)
```

**That's it!** The installer will:
- ✅ Detect your OS
- ✅ Install all dependencies
- ✅ Auto-install PostgreSQL
- ✅ Setup the application
- ✅ Start the service

**Time**: 5-15 minutes (depending on internet speed)

---

## 📱 After Installation

You'll receive your credentials:
```
Access URL: http://YOUR_IP:3000
Admin Email: admin@zwscloud.local
Admin Password: YOUR_SECURE_PASSWORD
```

**Save your admin password!**

---

## 🔄 Update & Live Testing

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/update.sh)
```

Then choose:
1. **Full Update** - Pull latest code + rebuild + restart
2. **Quick Update** - Just pull and restart
3. **Dev Mode** - Watch for changes and auto-rebuild
4. **Check Status** - See if app is running
5. **View Logs** - Stream real-time logs

---

## 🛠️ Manual Service Commands

```bash
# Check if running
sudo systemctl status zwscloud

# Start/Stop/Restart
sudo systemctl start zwscloud
sudo systemctl stop zwscloud
sudo systemctl restart zwscloud

# View logs
sudo journalctl -u zwscloud -f

# Last 50 log lines
sudo journalctl -u zwscloud -n 50
```

---

## 🆘 Troubleshooting

### Not Working?
```bash
# View full logs
sudo journalctl -u zwscloud -f

# Check PostgreSQL
sudo systemctl status postgresql

# Restart everything
sudo systemctl restart postgresql
sudo systemctl restart zwscloud
```

### Port 3000 Already in Use?
```bash
# Find what's using port 3000
sudo lsof -i :3000

# Kill it (if needed)
sudo kill -9 <PID>

# Restart service
sudo systemctl restart zwscloud
```

### Out of Space?
```bash
# Check disk usage
df -h

# Check app folder size
du -sh ~/zwscloud/
```

---

## 📊 Current Specs

- **Download Speed**: 1.80 Tbps
- **Upload Speed**: 1.80 Tbps
- **Latency**: 1-3 ms
- **Ping**: 0.5-2 ms
- **Uptime**: Live counter
- **Customer Reviews**: 6 verified testimonials

---

## 📚 More Information

- **Full Guide**: Read `INSTALL_GUIDE.md`
- **Summary**: Read `INSTALLATION_SUMMARY.md`
- **GitHub**: https://github.com/fitnesshubgym03-debug/zwscloud-ui-db

---

## ⚡ Useful Tips

### Backup Your Database
```bash
sudo -u postgres pg_dump -Fc zwscloud > ~/backup.sql
```

### Update Admin Password
1. Go to admin panel
2. Click Settings
3. Change password

### Enable HTTPS
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com
```

### Auto-backup Daily at 2 AM
```bash
sudo crontab -e
# Add: 0 2 * * * sudo -u postgres pg_dump -Fc zwscloud > /home/backups/zwscloud_$(date +\%Y\%m\%d).sql
```

---

## 🎯 Next Steps

1. ✅ Run the installer
2. ✅ Login with admin credentials
3. ✅ Configure payment gateway (admin panel)
4. ✅ Set up your domain
5. ✅ Enable SSL certificate
6. ✅ Setup backups
7. ✅ Monitor logs regularly

---

## 💬 Support

Need help?
1. Check logs: `sudo journalctl -u zwscloud -f`
2. Read the full guide: `INSTALL_GUIDE.md`
3. Visit: https://github.com/fitnesshubgym03-debug/zwscloud-ui-db/issues

---

**Ready?** Run this now:
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install-unified.sh)
```

