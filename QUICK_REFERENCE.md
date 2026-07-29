# ZWS Cloud - Quick Reference

## 🚀 ONE COMMAND INSTALLATION

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install.sh)
```

**Then answer 2 simple questions:**
1. **Domain**: `zwscloud.com` (or your IP/domain)
2. **Setup Mode**: `1` for AUTO (easiest) or `2` for MANUAL

**That's it!** Everything else is automatic.

---

## 🔄 UPDATES & LIVE TESTING

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/update-app.sh)
```

**Then choose:**
- `1` - Full update (get latest code + rebuild)
- `2` - Quick update (just pull + restart)
- `3` - Development mode (hot reload for testing)
- `4` - Check status
- `5` - View logs
- `6` - Restart
- `7` - Stop
- `8` - Start
- `9` - Exit

---

## 📋 WHAT GETS ASKED

### During Installation

#### Question 1: Domain
```
Enter your domain or IP address:
Examples: zwscloud.com, app.zwscloud.com, 192.168.1.100, localhost
```

#### Question 2: Setup Mode
```
1) AUTO MODE - Generates everything automatically (RECOMMENDED)
2) MANUAL MODE - Configure each setting manually
```

**That's all for AUTO mode!** Everything else runs automatically.

For MANUAL mode, you'll also answer:
- Admin email
- Admin password
- Database details

---

## 📊 AUTO MODE GENERATES

```
✓ Admin Email: admin@zwscloud
✓ Admin Password: RandomSecurePassword123 (saved and shown)
✓ Database: Auto-installed with random password
✓ JWT Secret: Auto-generated
✓ Service: Created and running
```

---

## 🛠️ COMMON COMMANDS

| Task | Command |
|------|---------|
| Check if running | `sudo systemctl status zwscloud` |
| View logs | `sudo journalctl -u zwscloud -f` |
| Restart | `sudo systemctl restart zwscloud` |
| Stop | `sudo systemctl stop zwscloud` |
| Start | `sudo systemctl start zwscloud` |
| Edit config | `nano /root/zwscloud/.env.local` |

---

## 🐛 TROUBLESHOOTING

### Service won't start
```bash
# Check logs
sudo journalctl -u zwscloud -n 50

# Try restart
sudo systemctl restart zwscloud
```

### Database error
```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Restart it
sudo systemctl restart postgresql
```

### Need to rebuild
```bash
# Run update script and choose option 1
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/update-app.sh)
# Then choose: 1 (Full update)
```

---

## 📖 FULL GUIDE

For detailed setup instructions, troubleshooting, and advanced options:

📄 **SETUP_INSTRUCTIONS.md** - Complete guide (450 lines)

---

## ⚡ QUICK START EXAMPLES

### Example 1: Simple Setup (AUTO)
```bash
# Run installer
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install.sh)

# When asked:
# Domain: localhost
# Mode: 1

# Wait 5-15 minutes... Done!
```

### Example 2: Custom Domain (AUTO)
```bash
# Run installer
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install.sh)

# When asked:
# Domain: my-domain.com
# Mode: 1

# Wait 5-15 minutes... Done!
```

### Example 3: Custom Setup (MANUAL)
```bash
# Run installer
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install.sh)

# When asked:
# Domain: my-domain.com
# Mode: 2
# Admin email: john@example.com
# Admin password: MyPassword123
# Admin name: John Admin
# Database host: localhost
# Database port: 5432
# Database name: zwscloud
# Database user: postgres
# Database password: postgrespass
# DB choice: 1 (auto-install PostgreSQL)

# Wait 5-15 minutes... Done!
```

### Example 4: Update After Installation
```bash
# Run update tool
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/update-app.sh)

# Choose: 1 (Full update)
# Or: 2 (Quick update)
# Or: 3 (Development mode for live testing)
```

---

## 📍 KEY DIFFERENCES (OLD vs NEW)

### OLD WAY (Before)
- ❌ Multiple confusing commands
- ❌ Questions mixed up
- ❌ No clear flow
- ❌ Hard to update

### NEW WAY (Now)
- ✅ Single installation command
- ✅ Domain asked FIRST
- ✅ Setup mode choice (auto/manual)
- ✅ Easy updates anytime

---

## 🎯 INSTALLATION CHECKLIST

```
Before running installer:
☐ You have a domain or IP address
☐ You have SSH access to your server
☐ You're logged in as root or have sudo access

During installation:
☐ Terminal stays connected (don't close)
☐ Answer 2 questions (domain + mode)
☐ Wait for completion (5-15 minutes)

After installation:
☐ Note your admin password
☐ Check status: sudo systemctl status zwscloud
☐ Access at your domain: https://youromain.com
☐ Login with admin email and password

For updates:
☐ Use update-app.sh command
☐ Choose desired option
☐ Wait for completion
```

---

## 🔐 SAVE THIS INFORMATION

After installation, you'll receive:

```
Admin Email: admin@zwscloud
Admin Password: [AUTO-GENERATED - SAVE THIS!]
Database URL: postgresql://zwscloud_user:***@localhost:5432/zwscloud
App URL: https://your-domain.com
Service: zwscloud (systemd)
```

**Save these credentials in a safe place!**

---

## 📞 NEED HELP?

Check logs:
```bash
sudo journalctl -u zwscloud -n 100
```

Full documentation:
```bash
cat SETUP_INSTRUCTIONS.md
cat FIX_SUMMARY.md
```

Restart service:
```bash
sudo systemctl restart zwscloud
```

---

**Version**: 2.1  
**Last Updated**: July 29, 2024  
**Status**: Production Ready ✅
