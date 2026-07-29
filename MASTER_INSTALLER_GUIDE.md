# ZWS Cloud - Master Installer Guide

## One Command Installation

The master installer (`installer.sh`) is the **easiest way to get ZWS Cloud running**. It's a fully automated setup that handles everything in one go.

## Quick Start

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/installer.sh)
```

**That's it!** The installer will:
- ✅ Detect your OS automatically
- ✅ Install Node.js & PostgreSQL
- ✅ Clone the repository
- ✅ Ask about domain/IP configuration
- ✅ Generate secure random credentials
- ✅ Create the database
- ✅ Build the application
- ✅ Create admin user
- ✅ Show you all access details

## What Gets Installed

### System Dependencies
- Node.js 20 LTS
- npm / pnpm
- PostgreSQL 12+
- Git, curl, openssl
- Build tools

### Application
- ZWS Cloud codebase
- Project dependencies
- Database schema
- Admin user account

### Configuration
- `.env.local` with all settings
- Random secure passwords
- Database connection string
- JWT secrets

## Installation Steps

### 1. Start Installation
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/installer.sh)
```

### 2. Confirm Installation
When prompted, confirm that you want to continue with the installation.

### 3. Choose Access Method

You'll be asked how you want to access ZWS Cloud:

**Option 1: Custom Domain** (Recommended for production)
```
Select option (1 or 2) [default: 1]: 1
Enter domain name [default: zwscloud]: yourdomain.com
```

This will make ZWS Cloud accessible at `http://yourdomain.com`

**Option 2: Server IP Address** (Quick testing)
```
Select option (1 or 2) [default: 1]: 2
```

This will automatically detect your server's public IP and make ZWS Cloud accessible at `http://YOUR_IP:3000`

### 4. Installation Runs Automatically

The installer will:
- Install all dependencies (~5-10 minutes)
- Setup PostgreSQL database
- Configure environment variables
- Run database migrations
- Create admin user with random password
- Build the application

### 5. Get Your Credentials

After installation completes, you'll see:
```
═══════════════════════════════════════════════════════════
                 Installation Complete!
═══════════════════════════════════════════════════════════

🌐 Access Information:
  Application URL:    http://yourdomain.com

🔐 Admin Credentials:
  Email:     admin@zwscloud.local
  Password:  RANDOM_PASSWORD_HERE

📖 Next Steps:
  1. Start the application: npm run dev
  2. Open browser: http://yourdomain.com
  3. Login with credentials above
  4. Change admin password immediately!
```

**IMPORTANT:** Save these credentials in a secure location!

## Starting Your Application

### Development Mode
```bash
npm run dev
```
- Hot reload enabled
- Debug logs visible
- Slower performance

### Production Mode
```bash
npm run build
npm start
```
- Optimized build
- Better performance
- No debug output

## Environment Configuration

The installer creates `.env.local` with:

```env
# Database
DATABASE_URL="postgresql://zwscloud_user:PASSWORD@localhost:5432/zwscloud"

# Admin Account
ADMIN_EMAIL="admin@zwscloud.local"
ADMIN_PASSWORD="auto_generated_password"

# Application
NEXT_PUBLIC_APP_URL="http://yourdomain.com"
NODE_ENV="production"
JWT_SECRET="auto_generated_secret"
```

To modify settings:
1. Edit `.env.local`
2. Restart the application

## First Login

### Access the Application
1. Open your browser
2. Go to the URL shown in installation (e.g., http://yourdomain.com)
3. You should see the login page

### Login with Admin Credentials
- **Email:** admin@zwscloud.local
- **Password:** (shown in installation output)

### Change Admin Password
1. Log in with the admin credentials
2. Go to Admin Dashboard → Settings → Profile
3. Change password immediately
4. Log out and log back in with new password

## Troubleshooting

### Installation Failed

**Option 1:** Re-run the installer
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/fitnesshubgym03-debug/zwscloud-ui-db/main/installer.sh)
```
The installer is designed to be re-runnable and will pick up where it left off.

**Option 2:** Manual steps
```bash
# Navigate to project
cd ~/zwscloud

# Install dependencies manually
npm install

# Run migrations
npm run db:push

# Build
npm run build

# Start
npm start
```

### Can't Connect to PostgreSQL

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL if needed
sudo systemctl start postgresql

# Verify connection
psql postgresql://zwscloud_user:password@localhost:5432/zwscloud
```

### Port Already in Use

If port 3000 is already in use:

```bash
# Find what's using it
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Or use a different port
PORT=3001 npm start
```

### Admin User Not Created

The admin user is created automatically during installation. If it fails:

```bash
# Navigate to project
cd ~/zwscloud

# Create admin manually
npm run db:studio
# Go to User table and create manually
# Or run db command from logs
```

## After Installation

### Recommended Setup

1. **Change Admin Password**
   - Log in immediately
   - Go to Settings → Profile
   - Change password to something secure

2. **Setup SSL/HTTPS** (for production)
   ```bash
   sudo apt-get install certbot
   sudo certbot certonly --standalone -d yourdomain.com
   ```
   Then update `.env.local` with `NEXT_PUBLIC_APP_URL=https://yourdomain.com`

3. **Configure Payment Gateway**
   - Log in to admin panel
   - Go to Settings → Payment Gateway
   - Add your Razorpay/Stripe keys

4. **Setup Email** (optional)
   - In `.env.local`, add SMTP settings
   - Restart application

5. **Backup Database**
   ```bash
   sudo -u postgres pg_dump zwscloud > backup.sql
   ```

6. **Setup Automated Backups**
   ```bash
   sudo crontab -e
   # Add: 0 2 * * * sudo -u postgres pg_dump -Fc zwscloud > /backups/zwscloud_$(date +\%Y\%m\%d).sql
   ```

### Database Commands

```bash
# Open Prisma Studio (visual database editor)
npm run db:studio

# Sync schema (if you modify models)
npm run db:push

# Generate Prisma client
npm run db:generate

# View logs
npm run logs

# Check health
curl http://localhost:3000/api/health
```

### Monitoring

```bash
# View application logs
tail -f ~/.pm2/logs/*.log

# Check resource usage
top -p $(pgrep -f "node.*next")

# Check database
sudo -u postgres psql -c "\l"
```

## Uninstall / Clean Up

If you want to remove everything:

```bash
# Stop application
npm stop  # or Ctrl+C if running directly

# Remove project directory
rm -rf ~/zwscloud

# Drop database (optional)
sudo -u postgres psql -c "DROP DATABASE zwscloud;"

# Drop database user (optional)
sudo -u postgres psql -c "DROP USER zwscloud_user;"
```

## Support

- **GitHub Issues:** https://github.com/fitnesshubgym03-debug/zwscloud-ui-db/issues
- **Docs:** See `INSTALL_GUIDE.md` and `README.md`
- **Database Docs:** See `INSTALL_README.md`

## FAQ

**Q: Can I run installer multiple times?**
A: Yes! It's safe to re-run. It will update the repository and reinstall dependencies.

**Q: Does it handle existing installations?**
A: Yes! If you already have ZWS Cloud installed, it will pull the latest changes and rebuild.

**Q: Can I customize the domain after installation?**
A: Yes! Edit `.env.local` and update `NEXT_PUBLIC_APP_URL`, then restart.

**Q: Is my data lost if I re-run the installer?**
A: No! Database data is preserved. The installer only updates code and dependencies.

**Q: What if I forget the admin password?**
A: You can reset it by running database commands or re-creating the admin user via `npm run db:studio`.

**Q: Can I use a different database?**
A: Currently, PostgreSQL is required. You would need to modify the installer for other databases.

---

**Happy installing! 🚀**
