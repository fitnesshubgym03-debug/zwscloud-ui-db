/**
 * Seed Script - Creates sample VPS products
 * Run with: pnpm exec tsx --env-file-if-exists=/vercel/share/.env.project scripts/004-seed-products.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

const products = [
  {
    slug: 'starter-vps',
    name: 'Starter VPS',
    description: 'Perfect for personal projects and small websites',
    category: 'vps',
    cpu_cores: 1,
    ram_gb: 2,
    storage_gb: 40,
    storage_type: 'nvme',
    bandwidth_tb: 2,
    price_1m: 499,
    price_3m: 449,
    price_6m: 399,
    price_12m: 349,
    price_24m: 299,
    is_featured: false,
    sort_order: 1,
    features: JSON.stringify(['1 vCPU Core', '2 GB RAM', '40 GB NVMe SSD', '2 TB Bandwidth', '24/7 Support']),
  },
  {
    slug: 'basic-vps',
    name: 'Basic VPS',
    description: 'Great for small businesses and growing websites',
    category: 'vps',
    cpu_cores: 2,
    ram_gb: 4,
    storage_gb: 80,
    storage_type: 'nvme',
    bandwidth_tb: 4,
    price_1m: 999,
    price_3m: 899,
    price_6m: 799,
    price_12m: 699,
    price_24m: 599,
    is_featured: true,
    sort_order: 2,
    features: JSON.stringify(['2 vCPU Cores', '4 GB RAM', '80 GB NVMe SSD', '4 TB Bandwidth', '24/7 Priority Support']),
  },
  {
    slug: 'standard-vps',
    name: 'Standard VPS',
    description: 'Ideal for medium-sized applications and databases',
    category: 'vps',
    cpu_cores: 4,
    ram_gb: 8,
    storage_gb: 160,
    storage_type: 'nvme',
    bandwidth_tb: 6,
    price_1m: 1999,
    price_3m: 1799,
    price_6m: 1599,
    price_12m: 1399,
    price_24m: 1199,
    is_featured: true,
    sort_order: 3,
    features: JSON.stringify(['4 vCPU Cores', '8 GB RAM', '160 GB NVMe SSD', '6 TB Bandwidth', 'Free Backups', '24/7 Priority Support']),
  },
  {
    slug: 'professional-vps',
    name: 'Professional VPS',
    description: 'For demanding applications and high-traffic sites',
    category: 'vps',
    cpu_cores: 6,
    ram_gb: 16,
    storage_gb: 320,
    storage_type: 'nvme',
    bandwidth_tb: 8,
    price_1m: 3499,
    price_3m: 3149,
    price_6m: 2799,
    price_12m: 2449,
    price_24m: 2099,
    is_featured: false,
    sort_order: 4,
    features: JSON.stringify(['6 vCPU Cores', '16 GB RAM', '320 GB NVMe SSD', '8 TB Bandwidth', 'Free Backups', 'Free SSL', '24/7 Priority Support']),
  },
  {
    slug: 'enterprise-vps',
    name: 'Enterprise VPS',
    description: 'Maximum performance for enterprise workloads',
    category: 'vps',
    cpu_cores: 8,
    ram_gb: 32,
    storage_gb: 640,
    storage_type: 'nvme',
    bandwidth_tb: 10,
    price_1m: 5999,
    price_3m: 5399,
    price_6m: 4799,
    price_12m: 4199,
    price_24m: 3599,
    is_featured: false,
    sort_order: 5,
    features: JSON.stringify(['8 vCPU Cores', '32 GB RAM', '640 GB NVMe SSD', '10 TB Bandwidth', 'Free Backups', 'Free SSL', 'DDoS Protection', '24/7 Dedicated Support']),
  },
]

async function seedProducts() {
  console.log('[DB] Seeding products...')

  for (const product of products) {
    // Check if product exists
    const existing = await sql`SELECT id FROM products WHERE slug = ${product.slug}`

    if (existing.length > 0) {
      console.log(`[DB] Product "${product.name}" already exists, skipping...`)
      continue
    }

    await sql`
      INSERT INTO products (
        slug, name, description, category, cpu_cores, ram_gb, storage_gb, storage_type,
        bandwidth_tb, price_1m, price_3m, price_6m, price_12m, price_24m,
        is_featured, sort_order, features
      ) VALUES (
        ${product.slug}, ${product.name}, ${product.description}, ${product.category},
        ${product.cpu_cores}, ${product.ram_gb}, ${product.storage_gb}, ${product.storage_type},
        ${product.bandwidth_tb}, ${product.price_1m}, ${product.price_3m}, ${product.price_6m},
        ${product.price_12m}, ${product.price_24m}, ${product.is_featured}, ${product.sort_order},
        ${product.features}
      )
    `
    console.log(`[DB] Created product: ${product.name}`)
  }

  console.log('[DB] Products seeding complete!')
}

seedProducts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[DB] Error:', error)
    process.exit(1)
  })
