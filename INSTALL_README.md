# ZWS Cloud Installation

Choose the right installer for your needs:

## Quick Start (Recommended)

```bash
bash install-clean.sh
```

Perfect for:
- Local development
- Fresh server installations
- Clean database setup
- Ubuntu, Debian, CentOS, RHEL, macOS

**What it does:**
- Auto-detects OS
- Installs Node.js
- Installs PostgreSQL  
- Creates database with secure credentials
- Installs dependencies
- Runs migrations
- Builds application
- Shows admin credentials

## Interactive Setup

```bash
bash install-auto.sh
```

Perfect for:
- Custom configurations
- Choosing between auto/existing PostgreSQL
- Setting specific admin credentials
- Learning what each step does

**Prompts you for:**
- Admin email & password
- Database choice
- Database host (if using existing)

## Production Deployment

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/install-unified.sh)
```

Perfect for:
- Production servers
- Automatic everything
- Systemd service setup
- One-command deployment

## Advanced Configuration

```bash
bash install.sh
```

For users who need:
- Full control over configuration
- SSL/domain setup
- Custom paths
- Step-by-step control

---

## After Installation

### Development
```bash
npm run dev
# Visit http://localhost:3000
```

### Production  
```bash
sudo systemctl start zwscloud
# Or with install-unified.sh
```

### Managing Service
```bash
sudo systemctl status zwscloud
sudo systemctl restart zwscloud
sudo journalctl -u zwscloud -f
```

---

## Troubleshooting

### PostgreSQL Connection Fails
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify database credentials in .env.local
cat .env.local | grep DATABASE_URL
```

### Dependencies Won't Install
```bash
npm cache clean --force
rm -rf node_modules
npm install
```

### Database Migrations Fail
```bash
npm run db:push --skip-generate
```

### Build Errors
```bash
npm run db:generate
npm run build 2>&1 | tail -50
```

---

## Environment Variables

All installers create `.env.local`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/zwscloud
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=auto_generated
JWT_SECRET=auto_generated
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## System Requirements

- **CPU:** 2+ cores
- **RAM:** 2GB+  
- **Disk:** 10GB+
- **OS:** Ubuntu 20.04+, Debian 11+, CentOS 8+, RHEL 8+, macOS 12+

---

## Support

1. Check INSTALL_GUIDE.md for detailed troubleshooting
2. Review installation logs: `npm run dev` or `sudo journalctl -u zwscloud -f`
3. Check database: `npm run db:studio`
4. Visit GitHub: https://github.com/fitnesshubgym03-debug/zwscloud-ui-db

---

## Next Steps

1. ✓ Run installer
2. ✓ Save admin credentials
3. ⬜ Start development server
4. ⬜ Login to admin panel
5. ⬜ Configure payment gateway
6. ⬜ Set up SSL (production)

Enjoy! 🚀
