/**
 * Verify Database Setup Script
 * Run with: pnpm exec tsx --env-file-if-exists=/vercel/share/.env.project scripts/003-verify-db.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

async function verifyDatabase() {
  console.log('[DB] Verifying database setup...\n')

  // Check all tables exist
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `
  
  console.log('[DB] Tables found:')
  tables.forEach((t: { table_name: string }) => console.log(`  - ${t.table_name}`))
  
  // Check admin user
  console.log('\n[DB] Checking admin user...')
  const admins = await sql`SELECT id, email, username, display_name, role FROM admin_profiles`
  
  if (admins.length > 0) {
    console.log('[DB] Admin user found:')
    admins.forEach((admin: any) => {
      console.log(`  - Email: ${admin.email}`)
      console.log(`  - Username: ${admin.username}`)
      console.log(`  - Display Name: ${admin.display_name}`)
      console.log(`  - Role: ${admin.role}`)
    })
  } else {
    console.log('[DB] No admin users found!')
  }

  // Check table counts
  console.log('\n[DB] Table row counts:')
  const counts = await Promise.all([
    sql`SELECT COUNT(*) as count FROM customers`,
    sql`SELECT COUNT(*) as count FROM products`,
    sql`SELECT COUNT(*) as count FROM orders`,
    sql`SELECT COUNT(*) as count FROM analytics_events`,
  ])
  
  console.log(`  - Customers: ${counts[0][0].count}`)
  console.log(`  - Products: ${counts[1][0].count}`)
  console.log(`  - Orders: ${counts[2][0].count}`)
  console.log(`  - Analytics Events: ${counts[3][0].count}`)

  console.log('\n[DB] Database verification complete!')
}

verifyDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[DB] Error:', error)
    process.exit(1)
  })
