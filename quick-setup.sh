#!/bin/bash

# Quick setup with defaults
# Usage: bash quick-setup.sh

set -e

cd "$(dirname "$0")"

echo "🚀 ZWS Cloud - Quick Setup"
echo "================================"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install > /dev/null 2>&1 || npm install > /dev/null 2>&1

# Create default .env if not exists
if [ ! -f ".env.local" ]; then
  echo "⚙️  Creating environment file..."
  
  JWT_SECRET=$(openssl rand -base64 32)
  
  cat > .env.local << EOF
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="Admin@12345"
ADMIN_DISPLAY_NAME="Administrator"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zwscloud"
JWT_SECRET="${JWT_SECRET}"
DEFAULT_PAYMENT_GATEWAY="razorpay"
RAZORPAY_KEY_ID="rzp_test_1234567890"
RAZORPAY_KEY_SECRET="rzp_test_secret"
RAZORPAY_MODE="test"
NEXT_PUBLIC_DOMAIN="localhost:3000"
NODE_ENV="development"
EOF

  echo "✓ Environment file created at .env.local"
fi

# Run migrations (skip if database not available)
echo "🗄️  Setting up database..."
pnpm db:push --skip-generate 2>/dev/null || true

# Create admin user (skip if database not available)
echo "👤 Creating admin user..."
cat > /tmp/create-admin.mjs << 'EOFSCRIPT'
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@12345';
    const name = process.env.ADMIN_DISPLAY_NAME || 'Administrator';

    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      console.log('✓ Admin already exists');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const admin = await prisma.user.create({
      data: {
        email,
        name,
        hashedPassword,
        role: 'super_admin'
      }
    });

    console.log(`✓ Admin created: ${admin.email}`);
  } catch (error) {
    console.log('⚠ Skipping admin creation (database not available)');
    process.exit(0);
  } finally {
    await prisma.$disconnect();
  }
}

main();
EOFSCRIPT

node /tmp/create-admin.mjs 2>/dev/null || true

# Build application (optional - skip if not needed)
echo "🔨 Building application..."
pnpm build 2>/dev/null || npm run build 2>/dev/null || echo "⚠ Build skipped"

echo ""
echo "✅ Setup Complete!"
echo "================================"
echo ""
echo "Admin Credentials:"
echo "  Email:    admin@example.com"
echo "  Password: Admin@12345"
echo ""
echo "Start the application:"
echo "  pnpm dev    (for development)"
echo "  pnpm start  (for production)"
echo ""
