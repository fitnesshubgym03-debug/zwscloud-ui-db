-- ZWS Cloud Seed Data - Products and Settings
-- Version 1.0

-- =============================================================================
-- VPS PRODUCTS - Standard Packages
-- =============================================================================

INSERT INTO public.products (
  slug, name, description, category,
  cpu_cores, ram_gb, storage_gb, storage_type, bandwidth_tb,
  price_1m, price_3m, price_6m, price_12m, price_24m, price_hourly,
  is_active, is_featured, sort_order, features
) VALUES 
-- Starter Plans
(
  'vps-starter-1', 'Starter 1', 'Perfect for small projects and testing',
  'vps', 1, 1, 25, 'nvme', 1,
  299, 269, 254, 239, 224, 0.42,
  TRUE, FALSE, 1,
  '["1 vCPU Core", "1 GB RAM", "25 GB NVMe", "1 TB Bandwidth", "DDoS Protection"]'::jsonb
),
(
  'vps-starter-2', 'Starter 2', 'Great for personal websites and blogs',
  'vps', 1, 2, 50, 'nvme', 2,
  499, 449, 424, 399, 374, 0.69,
  TRUE, FALSE, 2,
  '["1 vCPU Core", "2 GB RAM", "50 GB NVMe", "2 TB Bandwidth", "DDoS Protection"]'::jsonb
),
(
  'vps-starter-4', 'Starter 4', 'Ideal for growing applications',
  'vps', 2, 4, 80, 'nvme', 3,
  899, 809, 764, 719, 674, 1.25,
  TRUE, TRUE, 3,
  '["2 vCPU Cores", "4 GB RAM", "80 GB NVMe", "3 TB Bandwidth", "DDoS Protection", "Free SSL"]'::jsonb
),

-- Pro Plans
(
  'vps-pro-8', 'Pro 8', 'For professional applications and APIs',
  'vps', 4, 8, 160, 'nvme', 5,
  1699, 1529, 1444, 1359, 1274, 2.36,
  TRUE, TRUE, 4,
  '["4 vCPU Cores", "8 GB RAM", "160 GB NVMe", "5 TB Bandwidth", "DDoS Protection", "Free SSL", "Priority Support"]'::jsonb
),
(
  'vps-pro-16', 'Pro 16', 'High performance for demanding workloads',
  'vps', 6, 16, 320, 'nvme', 8,
  3199, 2879, 2719, 2559, 2399, 4.44,
  TRUE, TRUE, 5,
  '["6 vCPU Cores", "16 GB RAM", "320 GB NVMe", "8 TB Bandwidth", "DDoS Protection", "Free SSL", "Priority Support"]'::jsonb
),
(
  'vps-pro-32', 'Pro 32', 'Enterprise-grade performance',
  'vps', 8, 32, 640, 'nvme', 12,
  5999, 5399, 5099, 4799, 4499, 8.33,
  TRUE, FALSE, 6,
  '["8 vCPU Cores", "32 GB RAM", "640 GB NVMe", "12 TB Bandwidth", "DDoS Protection", "Free SSL", "Priority Support", "Dedicated IP"]'::jsonb
),

-- Enterprise Plans
(
  'vps-enterprise-48', 'Enterprise 48', 'For large-scale deployments',
  'vps', 12, 48, 800, 'nvme', 16,
  8499, 7649, 7224, 6799, 6374, 11.80,
  TRUE, FALSE, 7,
  '["12 vCPU Cores", "48 GB RAM", "800 GB NVMe", "16 TB Bandwidth", "DDoS Protection", "Free SSL", "24/7 Support", "Dedicated IP"]'::jsonb
),
(
  'vps-enterprise-64', 'Enterprise 64', 'Maximum performance',
  'vps', 16, 64, 1000, 'nvme', 20,
  10999, 9899, 9349, 8799, 8249, 15.28,
  TRUE, FALSE, 8,
  '["16 vCPU Cores", "64 GB RAM", "1 TB NVMe", "20 TB Bandwidth", "DDoS Protection", "Free SSL", "24/7 Support", "Dedicated IP"]'::jsonb
),
(
  'vps-enterprise-96', 'Enterprise 96', 'High-memory workloads',
  'vps', 24, 96, 1500, 'nvme', 25,
  15999, 14399, 13599, 12799, 11999, 22.22,
  TRUE, FALSE, 9,
  '["24 vCPU Cores", "96 GB RAM", "1.5 TB NVMe", "25 TB Bandwidth", "DDoS Protection", "Free SSL", "24/7 Support", "Dedicated IP", "Custom Firewall"]'::jsonb
),
(
  'vps-enterprise-128', 'Enterprise 128', 'Ultimate power',
  'vps', 32, 128, 2000, 'nvme', 30,
  20999, 18899, 17849, 16799, 15749, 29.17,
  TRUE, TRUE, 10,
  '["32 vCPU Cores", "128 GB RAM", "2 TB NVMe", "30 TB Bandwidth", "DDoS Protection", "Free SSL", "24/7 Support", "Dedicated IP", "Custom Firewall", "SLA 99.99%"]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  cpu_cores = EXCLUDED.cpu_cores,
  ram_gb = EXCLUDED.ram_gb,
  storage_gb = EXCLUDED.storage_gb,
  price_1m = EXCLUDED.price_1m,
  price_3m = EXCLUDED.price_3m,
  price_6m = EXCLUDED.price_6m,
  price_12m = EXCLUDED.price_12m,
  price_24m = EXCLUDED.price_24m,
  price_hourly = EXCLUDED.price_hourly,
  features = EXCLUDED.features,
  updated_at = NOW();

-- =============================================================================
-- ADMIN SETTINGS
-- =============================================================================

INSERT INTO public.admin_settings (key, value, description) VALUES
(
  'pricing_config',
  '{
    "currency": "INR",
    "tax_rate": 18,
    "discount_terms": {
      "3m": 10,
      "6m": 15,
      "12m": 20,
      "24m": 25
    },
    "custom_config_limits": {
      "max_cpu": 64,
      "max_ram": 256,
      "max_storage_nvme": 4000,
      "max_storage_ssd": 8000,
      "max_bandwidth": 100
    },
    "custom_config_pricing": {
      "cpu_per_core": 150,
      "ram_per_gb": 75,
      "storage_nvme_per_gb": 2.5,
      "storage_ssd_per_gb": 1.5,
      "bandwidth_per_tb": 100
    }
  }'::jsonb,
  'Global pricing configuration'
),
(
  'cashfree_config',
  '{
    "enabled": true,
    "test_mode": true,
    "return_url": "/payment/status",
    "notify_url": "/api/webhooks/cashfree"
  }'::jsonb,
  'Cashfree payment gateway configuration'
),
(
  'site_config',
  '{
    "company_name": "ZWS Cloud",
    "company_email": "support@zws.cloud",
    "company_phone": "+91 98765 43210",
    "company_address": {
      "line1": "123 Tech Park",
      "line2": "Cyber City",
      "city": "Bangalore",
      "state": "Karnataka",
      "pincode": "560001",
      "country": "India"
    },
    "gstin": "29ABCDE1234F1Z5",
    "support_hours": "24/7"
  }'::jsonb,
  'Site and company configuration'
),
(
  'analytics_config',
  '{
    "enabled": true,
    "track_page_views": true,
    "track_clicks": true,
    "track_conversions": true,
    "retention_days": 365
  }'::jsonb,
  'Analytics tracking configuration'
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();
