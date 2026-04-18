-- ZWS Cloud Complete Database Schema
-- Version 1.0

-- =============================================================================
-- ADMIN USERS TABLE
-- =============================================================================
-- Note: Admin authentication uses Supabase Auth with is_admin metadata flag
-- This table stores additional admin profile information

CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Only admins can read admin profiles
CREATE POLICY "admin_profiles_select" ON public.admin_profiles 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- Only admins can update their own profile
CREATE POLICY "admin_profiles_update" ON public.admin_profiles 
  FOR UPDATE USING (auth.uid() = id);

-- =============================================================================
-- CUSTOMERS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  company TEXT,
  address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Admins can manage customers
CREATE POLICY "customers_admin_all" ON public.customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- =============================================================================
-- PRODUCTS TABLE (VPS Packages)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'vps', -- vps, dedicated, cloud, addon
  
  -- Resource specifications
  cpu_cores INTEGER NOT NULL,
  ram_gb INTEGER NOT NULL,
  storage_gb INTEGER NOT NULL,
  storage_type TEXT NOT NULL DEFAULT 'nvme', -- nvme, ssd
  bandwidth_tb DECIMAL(10,2),
  
  -- Base pricing (monthly in INR)
  price_1m DECIMAL(10,2) NOT NULL,
  price_3m DECIMAL(10,2),
  price_6m DECIMAL(10,2),
  price_12m DECIMAL(10,2),
  price_24m DECIMAL(10,2),
  
  -- Hourly pricing
  price_hourly DECIMAL(10,4),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  
  -- Metadata
  features JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Anyone can read active products
CREATE POLICY "products_public_read" ON public.products
  FOR SELECT USING (is_active = TRUE);

-- Admins can manage products
CREATE POLICY "products_admin_all" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- =============================================================================
-- CUSTOM CONFIGURATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.custom_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id),
  
  -- Configuration details
  cpu_cores INTEGER NOT NULL,
  ram_gb INTEGER NOT NULL,
  storage_gb INTEGER NOT NULL,
  storage_type TEXT NOT NULL DEFAULT 'nvme',
  bandwidth_tb DECIMAL(10,2),
  
  -- Selected term and pricing
  term_months INTEGER NOT NULL DEFAULT 1,
  monthly_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft', -- draft, pending, approved, active, cancelled
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.custom_configs ENABLE ROW LEVEL SECURITY;

-- Admins can manage configs
CREATE POLICY "custom_configs_admin_all" ON public.custom_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- =============================================================================
-- ORDERS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  
  -- Order details
  product_id UUID REFERENCES public.products(id),
  custom_config_id UUID REFERENCES public.custom_configs(id),
  
  -- Pricing
  term_months INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, cancelled, refunded
  
  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Admins can manage orders
CREATE POLICY "orders_admin_all" ON public.orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- =============================================================================
-- INVOICES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  order_id UUID REFERENCES public.orders(id),
  customer_id UUID REFERENCES public.customers(id),
  
  -- Invoice details
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  
  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 18.00, -- GST
  tax_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, paid, overdue, cancelled
  
  -- Line items stored as JSONB
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Company details
  billing_address JSONB,
  
  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Admins can manage invoices
CREATE POLICY "invoices_admin_all" ON public.invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- =============================================================================
-- PAYMENTS TABLE (Cashfree Integration)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id),
  invoice_id UUID REFERENCES public.invoices(id),
  customer_id UUID REFERENCES public.customers(id),
  
  -- Payment gateway details
  gateway TEXT NOT NULL DEFAULT 'cashfree',
  gateway_order_id TEXT, -- Cashfree order_id
  gateway_payment_id TEXT, -- Cashfree cf_payment_id
  gateway_session_id TEXT, -- Payment session ID
  
  -- Amount
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, success, failed, cancelled, refunded
  
  -- Payment method
  payment_method TEXT, -- upi, card, netbanking, wallet
  payment_method_details JSONB,
  
  -- Response data
  gateway_response JSONB,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Admins can manage payments
CREATE POLICY "payments_admin_all" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- =============================================================================
-- ANALYTICS EVENTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event details
  event_type TEXT NOT NULL, -- page_view, metric_click, package_view, login_attempt, etc.
  event_name TEXT NOT NULL,
  
  -- Context
  page_path TEXT,
  referrer TEXT,
  
  -- User/Session info
  session_id TEXT,
  user_agent TEXT,
  ip_address INET,
  country TEXT,
  city TEXT,
  
  -- Event data
  properties JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert analytics events (for tracking)
CREATE POLICY "analytics_events_insert" ON public.analytics_events
  FOR INSERT WITH CHECK (TRUE);

-- Only admins can read analytics
CREATE POLICY "analytics_events_admin_read" ON public.analytics_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- =============================================================================
-- ADMIN SETTINGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage settings
CREATE POLICY "admin_settings_admin_all" ON public.admin_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events(created_at);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
BEGIN
  SELECT 'ZWS-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
  INTO new_number;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  year_month TEXT;
  seq_num INTEGER;
BEGIN
  year_month := TO_CHAR(NOW(), 'YYYYMM');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-\d{6}-(\d+)') AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.invoices
  WHERE invoice_number LIKE 'INV-' || year_month || '-%';
  
  new_number := 'INV-' || year_month || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_order_number ON public.orders;
CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Trigger to auto-generate invoice number
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_invoice_number ON public.invoices;
CREATE TRIGGER trigger_set_invoice_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_invoice_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['admin_profiles', 'customers', 'products', 'custom_configs', 'orders', 'invoices', 'payments', 'admin_settings'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trigger_updated_at ON public.%I', t);
    EXECUTE format('CREATE TRIGGER trigger_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t);
  END LOOP;
END;
$$;
