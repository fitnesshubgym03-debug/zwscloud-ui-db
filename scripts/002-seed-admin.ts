/**
 * Seed Script - Creates initial admin user
 * Run with: node --env-file-if-exists=/vercel/share/.env.project scripts/002-seed-admin.ts
 */

import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'

const sql = neon(process.env.DATABASE_URL!)

async function seedAdmin() {
  console.log('[DB] Seeding admin user...')

  // Default admin credentials (change password after first login!)
  const adminEmail = 'samvpslio@gmail.com'
  const adminUsername = 'admin'
  const adminDisplayName = 'ZWS Admin'
  const adminPassword = 'Admin@123' // Default password - should be changed after first login

  // Hash the password
  const hashedPassword = await bcrypt.hash(adminPassword, 12)

  // Check if admin already exists
  const existing = await sql`
    SELECT id FROM admin_profiles WHERE email = ${adminEmail}
  `

  if (existing.length > 0) {
    console.log('[DB] Admin user already exists, updating password...')
    await sql`
      UPDATE admin_profiles 
      SET hashed_password = ${hashedPassword}, updated_at = NOW()
      WHERE email = ${adminEmail}
    `
    console.log('[DB] Admin password updated!')
  } else {
    // Create admin user
    await sql`
      INSERT INTO admin_profiles (email, username, display_name, hashed_password, role)
      VALUES (${adminEmail}, ${adminUsername}, ${adminDisplayName}, ${hashedPassword}, 'super_admin')
    `
    console.log('[DB] Admin user created!')
  }

  console.log('[DB] Admin credentials:')
  console.log(`    Email: ${adminEmail}`)
  console.log(`    Password: ${adminPassword}`)
  console.log('[DB] Please change the password after first login!')
}

seedAdmin()
  .then(() => {
    console.log('[DB] Seeding complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('[DB] Error seeding:', error)
    process.exit(1)
  })
