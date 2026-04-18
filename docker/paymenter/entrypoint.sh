#!/bin/bash
set -e

# Wait for database to be ready
echo "Waiting for database to be ready..."
while ! mysqladmin ping -h"$DB_HOST" -u"$DB_USERNAME" -p"$DB_PASSWORD" --silent; do
  echo 'waiting for mysql...'
  sleep 1
done

# Run migrations
php artisan migrate --force

# Seed database if needed
php artisan db:seed --force --class=DatabaseSeeder 2>/dev/null || true

# Cache config and routes
php artisan config:cache
php artisan route:cache

# Build theme assets
cd /app/themes/zws && npm install && npm run build 2>/dev/null || true

# Start application
exec "$@"
