/**
 * Database Setup Script - Creates all tables for ZWS Cloud
 * Run with: node --env-file-if-exists=/vercel/share/.env.project scripts/001-create-tables.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

async function createTables() {
  console.log('[DB] Creating database tables...')

  // Admin Profiles table
  await sql`
    CREATE TABLE IF NOT EXISTS admin_profiles (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      hashed_password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      last_login TIMESTAMP
    )
  `
  console.log('[DB] Created admin_profiles table')

  // Create index on admin_profiles
  await sql`CREATE INDEX IF NOT EXISTS idx_admin_profiles_email ON admin_profiles(email)`

  // Customers table
  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      phone TEXT,
      company TEXT,
      address JSONB,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `
  console.log('[DB] Created customers table')
  await sql`CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)`

  // Products table
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'vps',
      cpu_cores INTEGER NOT NULL,
      ram_gb INTEGER NOT NULL,
      storage_gb INTEGER NOT NULL,
      storage_type TEXT DEFAULT 'nvme',
      bandwidth_tb DECIMAL(10, 2) NOT NULL,
      price_1m DECIMAL(10, 2) NOT NULL,
      price_3m DECIMAL(10, 2),
      price_6m DECIMAL(10, 2),
      price_12m DECIMAL(10, 2),
      price_24m DECIMAL(10, 2),
      price_hourly DECIMAL(10, 4),
      is_active BOOLEAN DEFAULT true,
      is_featured BOOLEAN DEFAULT false,
      sort_order INTEGER DEFAULT 0,
      features JSONB DEFAULT '[]',
      disks JSONB DEFAULT '[{"type":"nvme","sizeGb":160}]',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `
  console.log('[DB] Created products table')
  await sql`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`
  await sql`CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active)`

  // Custom Configs table
  await sql`
    CREATE TABLE IF NOT EXISTS custom_configs (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      customer_id TEXT REFERENCES customers(id),
      cpu_cores INTEGER NOT NULL,
      ram_gb INTEGER NOT NULL,
      disks JSONB DEFAULT '[{"type":"nvme","sizeGb":160,"label":"Disk 1"}]',
      bandwidth_tb DECIMAL(10, 2),
      term_months INTEGER DEFAULT 1,
      monthly_price DECIMAL(10, 2) NOT NULL,
      total_price DECIMAL(10, 2) NOT NULL,
      status TEXT DEFAULT 'draft',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `
  console.log('[DB] Created custom_configs table')
  await sql`CREATE INDEX IF NOT EXISTS idx_custom_configs_customer_id ON custom_configs(customer_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_custom_configs_status ON custom_configs(status)`

  // Orders table
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      order_number TEXT UNIQUE NOT NULL,
      customer_id TEXT REFERENCES customers(id),
      product_id TEXT REFERENCES products(id),
      custom_config_id TEXT REFERENCES custom_configs(id),
      term_months INTEGER DEFAULT 1,
      unit_price DECIMAL(10, 2) NOT NULL,
      quantity INTEGER DEFAULT 1,
      subtotal DECIMAL(10, 2) NOT NULL,
      tax_amount DECIMAL(10, 2) DEFAULT 0,
      discount_amount DECIMAL(10, 2) DEFAULT 0,
      total_amount DECIMAL(10, 2) NOT NULL,
      currency TEXT DEFAULT 'INR',
      status TEXT DEFAULT 'pending',
      notes TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `
  console.log('[DB] Created orders table')
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`

  // Invoices table
  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      invoice_number TEXT UNIQUE NOT NULL,
      order_id TEXT REFERENCES orders(id),
      customer_id TEXT NOT NULL REFERENCES customers(id),
      issue_date DATE DEFAULT CURRENT_DATE,
      due_date DATE NOT NULL,
      subtotal DECIMAL(10, 2) NOT NULL,
      tax_rate DECIMAL(5, 2) DEFAULT 18.00,
      tax_amount DECIMAL(10, 2) NOT NULL,
      discount_amount DECIMAL(10, 2) DEFAULT 0,
      total_amount DECIMAL(10, 2) NOT NULL,
      currency TEXT DEFAULT 'INR',
      status TEXT DEFAULT 'draft',
      line_items JSONB DEFAULT '[]',
      billing_address JSONB,
      notes TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      paid_at TIMESTAMP
    )
  `
  console.log('[DB] Created invoices table')
  await sql`CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)`

  // Payments table
  await sql`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      order_id TEXT REFERENCES orders(id),
      invoice_id TEXT REFERENCES invoices(id),
      customer_id TEXT REFERENCES customers(id),
      gateway TEXT DEFAULT 'cashfree',
      gateway_order_id TEXT,
      gateway_payment_id TEXT,
      gateway_session_id TEXT,
      amount DECIMAL(10, 2) NOT NULL,
      currency TEXT DEFAULT 'INR',
      status TEXT DEFAULT 'pending',
      payment_method TEXT,
      payment_method_details JSONB,
      gateway_response JSONB,
      error_message TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      completed_at TIMESTAMP
    )
  `
  console.log('[DB] Created payments table')
  await sql`CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)`

  // Analytics Events table
  await sql`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      event_type TEXT NOT NULL,
      event_name TEXT NOT NULL,
      page_path TEXT,
      referrer TEXT,
      session_id TEXT,
      user_agent TEXT,
      ip_address TEXT,
      country TEXT,
      city TEXT,
      properties JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
  console.log('[DB] Created analytics_events table')
  await sql`CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type)`
  await sql`CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at)`

  // Admin Settings table
  await sql`
    CREATE TABLE IF NOT EXISTS admin_settings (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      key TEXT UNIQUE NOT NULL,
      value JSONB NOT NULL,
      description TEXT,
      updated_by TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `
  console.log('[DB] Created admin_settings table')

  console.log('[DB] All tables created successfully!')
}

createTables()
  .then(() => {
    console.log('[DB] Database setup complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('[DB] Error creating tables:', error)
    process.exit(1)
  })
