# 🚀 ZWS Cloud Docker Deployment Guide

## Overview

ZWS Cloud is now a complete Docker-based production system with:
- **Next.js Frontend** (main app with client area)
- **Paymenter Integration** (billing & checkout)
- **MySQL Database** (Prisma ORM)
- **Redis Cache** (session & caching)
- **Nginx Reverse Proxy** (SSL/TLS, load balancing)

---

## 📋 Prerequisites

- Docker & Docker Compose (v20.10+)
- 4GB RAM minimum
- 2+ CPU cores
- 20GB disk space
- Domain name (for production SSL)

---

## 🔧 Installation & Setup

### Step 1: Clone & Configure

```bash
git clone <your-repo> zws-cloud
cd zws-cloud
cp .env.production .env
```

### Step 2: Update .env Variables

Edit `.env` with your configuration:

```env
# Domain
APP_URL=https://your-domain.com

# Database
DB_DATABASE=zwsvercel
DB_USERNAME=zwsvercel
DB_PASSWORD=n8BtT2D3KdpTPPks

# JWT
JWT_SECRET=$(openssl rand -hex 32)

# Admin
ADMIN_EMAIL=admin@your-domain.com
ADMIN_PASSWORD=YourSecurePassword123!

# Stripe (optional)
STRIPE_PUBLIC_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
```

### Step 3: Generate SSL Certificates

For self-signed certs (development):
```bash
mkdir -p docker/nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/nginx/ssl/zws.key \
  -out docker/nginx/ssl/zws.crt
```

For production, use Let's Encrypt:
```bash
certbot certonly --standalone -d your-domain.com
# Copy to docker/nginx/ssl/
```

### Step 4: Start the System

```bash
docker compose up -d

# Watch startup progress
docker compose logs -f

# Wait for all services to be healthy (~60 seconds)
```

### Step 5: Verify Installation

```bash
# Check all containers
docker compose ps

# Test endpoints
curl http://localhost/health
curl http://localhost/billing/health

# Access services
# Main app: http://localhost
# PhpMyAdmin: http://localhost:8888
# Paymenter: http://localhost/billing
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│          Nginx (Reverse Proxy)          │
│  Handles SSL, rate limiting, caching    │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
┌───────▼────┐  ┌────▼──────────┐
│ Next.js    │  │  Paymenter    │
│ (3000)     │  │  (8080)       │
└───────┬────┘  └────┬──────────┘
        │            │
        └──────┬─────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼──────┐      ┌──────▼────┐
│ MySQL    │      │  Redis    │
│ (3306)   │      │  (6379)   │
└──────────┘      └───────────┘
```

---

## 🔐 Security

### SSL/TLS Configuration
- Automatic HTTP → HTTPS redirect
- TLS 1.2 & 1.3 support
- Strong cipher suites
- HSTS headers (1 year)

### Network Security
- Services only communicate internally
- Rate limiting: 10 req/s (general), 30 req/s (API)
- CORS configured for billing integration
- Admin panel protected with authentication

### Database Security
- Separate DB user with limited permissions
- No root password exposed
- All credentials in `.env`
- Automatic backups (configure with `docker-compose-backup.yml`)

---

## 🛠️ Management Commands

### Start/Stop
```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Restart specific service
docker compose restart app
```

### Logs & Monitoring
```bash
# View all logs
docker compose logs -f

# View specific service
docker compose logs -f app
docker compose logs -f paymenter

# View only errors
docker compose logs -f app 2>&1 | grep -i error
```

### Database Management
```bash
# Access MySQL CLI
docker compose exec mysql mysql -u zwsvercel -p zwsvercel

# Run migrations
docker compose exec app npm run db:push

# Generate Prisma client
docker compose exec app npm run db:generate

# Seed test data
docker compose exec app npm run seed:admin
```

### Backup & Restore
```bash
# Backup database
docker compose exec mysql mysqldump -u zwsvercel -p zwsvercel > backup.sql

# Restore database
docker compose exec -T mysql mysql -u zwsvercel -p zwsvercel < backup.sql

# Backup volumes
docker run --rm -v zws-cloud_mysql_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/mysql-backup.tar.gz -C /data .
```

---

## 📊 Services Details

### Frontend (Next.js)
- **Port:** 3000 (internal), 80/443 (via Nginx)
- **Endpoints:**
  - `/` - Homepage
  - `/login` - User login
  - `/client-area` - Dashboard (authenticated)
  - `/admin` - Admin panel (admin only)
  - `/api/*` - Backend APIs

### Billing (Paymenter)
- **Port:** 8080 (internal), `/billing` (via Nginx)
- **Features:**
  - Client dashboard
  - Invoice management
  - Payment processing
  - ZWS dark theme applied

### Database (MySQL)
- **Port:** 3306
- **Credentials:** See `.env`
- **Persistence:** `/var/lib/mysql` volume

### Cache (Redis)
- **Port:** 6379
- **Purpose:** Session storage, caching
- **Persistence:** `/data` volume with AOF

### Reverse Proxy (Nginx)
- **Ports:** 80, 443
- **Functions:**
  - Route requests to services
  - SSL termination
  - Compression (gzip)
  - Rate limiting

---

## 🚨 Troubleshooting

### Services won't start
```bash
# Check logs
docker compose logs app

# Ensure ports are free
lsof -i :3000
lsof -i :8080
lsof -i :3306
```

### Database connection errors
```bash
# Test MySQL connection
docker compose exec app mysql -h mysql -u zwsvercel -p zwsvercel -e "SELECT 1;"

# Migrate database
docker compose exec app npm run db:push
```

### SSL certificate errors
```bash
# Regenerate self-signed cert
rm docker/nginx/ssl/zws.*
# Run Step 3 from Installation again
```

### High memory usage
```bash
# Check container stats
docker stats

# Limit memory in docker-compose.yml
# Add under service: resources: limits: memory: 1G
```

---

## 📈 Performance Optimization

### Enable Caching
```env
REDIS_URL=redis://redis:6379
SESSION_DRIVER=redis
```

### Database Connection Pooling
```env
DATABASE_URL="mysql://user:pass@mysql:3306/db?schema=public&pool_size=5"
```

### Nginx Compression
Already configured. Monitor:
```bash
curl -I -H "Accept-Encoding: gzip" http://localhost
# Should see: Content-Encoding: gzip
```

---

## 📝 Maintenance

### Update Services
```bash
# Pull latest images
docker compose pull

# Rebuild app
docker compose up -d --build

# No downtime during rolling updates
```

### Monitor Disk Usage
```bash
# Docker volumes
docker system df

# Clean unused resources
docker system prune -a
```

### Regular Tasks
- Weekly: Check logs for errors
- Monthly: Update security patches
- Quarterly: Review and optimize queries
- Annually: Renew SSL certificates

---

## 🔑 First Time Login

After installation:

1. Access main app: `http://localhost`
2. Login with admin credentials from `.env`:
   - Email: `ADMIN_EMAIL`
   - Password: `ADMIN_PASSWORD`
3. Access billing panel: `http://localhost/billing`
4. Paymenter theme "ZWS" is automatically applied

---

## 📞 Support

### Debug Mode
Enable debug logging:
```env
APP_DEBUG=true
LOG_LEVEL=debug
```

### Health Checks
```bash
# App health
curl http://localhost/health

# Paymenter health
curl http://localhost/billing/health

# Database connectivity
docker compose exec app npm run db:push
```

---

## 🎉 Next Steps

1. **Configure Stripe** (optional)
   - Add `STRIPE_PUBLIC_KEY` and `STRIPE_SECRET_KEY` to `.env`
   - Update payment gateway in Paymenter admin

2. **Setup Email** (optional)
   - Configure SMTP in `.env`
   - Use for notifications and password resets

3. **Custom Domain**
   - Update DNS: `A record → your-server-ip`
   - Generate Let's Encrypt certificate
   - Update `APP_URL` in `.env`

4. **Backup Strategy**
   - Implement automated backups
   - Test restore procedures
   - Store backups offsite

---

**ZWS Cloud is now production-ready! 🚀**
