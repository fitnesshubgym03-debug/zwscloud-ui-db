# ZWS Cloud - Docker Production Setup

## Quick Start

```bash
# 1. Clone the repository
git clone <repo> zws-cloud
cd zws-cloud

# 2. Copy environment config
cp .env.production .env

# 3. Edit .env with your settings
nano .env

# 4. Generate SSL certificates (dev)
mkdir -p docker/nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/nginx/ssl/zws.key \
  -out docker/nginx/ssl/zws.crt

# 5. Start the system
docker compose up -d

# 6. Wait for initialization (~60 seconds)
docker compose logs -f

# 7. Access your system
# Main app: http://localhost
# Billing: http://localhost/billing
# Admin: http://localhost/admin
```

## System Architecture

### Services Running

1. **Nginx** (Port 80, 443)
   - Reverse proxy, SSL termination, load balancing
   - Handles routing to app and billing

2. **Next.js App** (Port 3000 internal)
   - Main frontend and backend APIs
   - Client area, admin panel
   - Prisma ORM with MySQL

3. **Paymenter** (Port 8080 internal)
   - Billing system with ZWS theme
   - Invoice management, payment processing
   - Integrated with app database

4. **MySQL** (Port 3306)
   - Primary database for users, orders, invoices
   - Automatic initialization with seed data

5. **Redis** (Port 6379)
   - Session storage
   - Cache layer
   - Queue support

6. **PhpMyAdmin** (Port 8888)
   - Web-based database management tool

## Configuration

### Environment Variables (.env)

```env
# Domain Configuration
APP_NAME=zws
APP_URL=https://your-domain.com

# Database
DB_DATABASE=zwsvercel
DB_USERNAME=zwsvercel
DB_PASSWORD=n8BtT2D3KdpTPPks

# Security
JWT_SECRET=your-secure-key-here

# Admin Account
ADMIN_EMAIL=admin@your-domain.com
ADMIN_PASSWORD=YourSecurePassword123!

# Paymenter Theme
PAYMENTER_THEME=zws
```

## Managing the System

### View Logs
```bash
docker compose logs -f                    # All services
docker compose logs -f app                # Just the app
docker compose logs -f paymenter          # Just Paymenter
```

### Access Database
```bash
# MySQL CLI
docker compose exec mysql mysql -u zwsvercel -p zwsvercel

# PhpMyAdmin Web UI
# Navigate to: http://localhost:8888
```

### Restart Services
```bash
docker compose restart                    # Restart all
docker compose restart app                # Restart specific service
```

### Stop System
```bash
docker compose down                       # Stops all containers
docker compose down -v                    # Also removes volumes (data loss!)
```

## Security

- All services communicate over internal Docker network
- SSL/TLS encryption on public endpoints
- Rate limiting enabled (10 req/s general, 30 req/s API)
- Admin panel requires authentication
- Database passwords stored in `.env` (add to `.gitignore`)

## SSL Certificates

### Development (Self-signed)
Already generated in Quick Start (valid for 365 days)

### Production (Let's Encrypt)
```bash
# Generate certificate
certbot certonly --standalone -d your-domain.com

# Copy to Docker
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem docker/nginx/ssl/zws.crt
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem docker/nginx/ssl/zws.key

# Auto-renewal
# Add to crontab: 0 3 * * * /usr/bin/certbot renew --quiet && cp /etc/letsencrypt/live/*/fullchain.pem docker/nginx/ssl/zws.crt
```

## Troubleshooting

### Containers won't start
```bash
# Check logs
docker compose logs app

# Ensure ports are free
sudo lsof -i :80 :443 :3000 :8080 :3306 :6379
```

### Database connection errors
```bash
# Test connection
docker compose exec app mysql -h mysql -u zwsvercel -p zwsvercel -e "SELECT 1;"

# Run migrations manually
docker compose exec app npm run db:push
```

### Permission denied errors
```bash
# Fix file ownership
sudo chown -R $USER:$USER .

# Rebuild containers
docker compose up -d --build
```

## Backup & Restore

### Backup
```bash
# Database backup
docker compose exec mysql mysqldump -u zwsvercel -p zwsvercel > backup-$(date +%Y%m%d).sql

# Volume backup
docker run --rm -v zws-cloud_mysql_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/volumes-$(date +%Y%m%d).tar.gz -C /data .
```

### Restore
```bash
# Restore database
docker compose exec -T mysql mysql -u zwsvercel -p zwsvercel < backup-*.sql

# Restore volumes
docker run --rm -v zws-cloud_mysql_data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/volumes-*.tar.gz -C /data
```

## First Login

1. Access: `http://localhost` (or your domain)
2. Click "Admin Panel" or go to `/admin`
3. Login with credentials from `.env`:
   - Email: `ADMIN_EMAIL`
   - Password: `ADMIN_PASSWORD`
4. Change password in settings

## Next Steps

1. **Update Domain**
   - Configure DNS A record to your server IP
   - Update `APP_URL` in `.env`
   - Regenerate SSL certificate for Let's Encrypt

2. **Configure Payment Gateway**
   - Add Stripe keys to `.env`
   - Configure in Paymenter admin panel

3. **Setup Email**
   - Configure SMTP in `.env`
   - Test email delivery

4. **Monitor Performance**
   - Check `docker stats` regularly
   - Monitor disk usage: `docker system df`
   - Review logs for errors

## Performance Tips

- Enable caching in Redis settings
- Configure database connection pooling
- Use CDN for static files
- Monitor container resource usage
- Regular database optimization

## Support & Documentation

- **Paymenter Docs:** https://paymenter.org
- **Next.js Docs:** https://nextjs.org
- **Prisma Docs:** https://prisma.io
- **Docker Docs:** https://docs.docker.com

---

**Your ZWS Cloud system is ready! 🚀**

For detailed deployment instructions, see `DOCKER_DEPLOYMENT.md`
