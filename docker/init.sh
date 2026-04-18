#!/bin/bash
set -e

echo "🚀 ZWS Cloud - Docker initialization script"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}ℹ️  .env file not found. Using .env.production as template...${NC}"
    cp .env.production .env
fi

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci

echo -e "${YELLOW}🗄️  Waiting for database to be ready...${NC}"
until npm run db:push 2>/dev/null; do
    echo "Waiting for MySQL..."
    sleep 2
done

echo -e "${YELLOW}🌱 Seeding database...${NC}"
npm run seed:admin 2>/dev/null || echo "Admin seed already exists"

echo -e "${YELLOW}🏗️  Building Next.js application...${NC}"
npm run build

echo -e "${GREEN}✅ Initialization complete!${NC}"
echo -e "${GREEN}📱 App available at: ${APP_URL:-http://localhost}${NC}"
echo -e "${GREEN}💳 Billing available at: ${APP_URL:-http://localhost}/billing${NC}"
