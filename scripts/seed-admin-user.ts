#!/usr/bin/env node

/**
 * Admin User Seeding Script
 * This script creates the admin user in MySQL with the credentials from environment variables
 * Run with: pnpm seed:admin
 * 
 * Required environment variables:
 * - DATABASE_URL: MySQL connection string
 * - ADMIN_EMAIL: Admin user email (e.g., samvpslio@gmail.com)
 * - ADMIN_PASSWORD: Admin user password
 * - ADMIN_DISPLAY_NAME: Display name for admin (optional, defaults to "Admin")
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const adminEmail = process.env.ADMIN_EMAIL
const adminPassword = process.env.ADMIN_PASSWORD
const adminDisplayName = process.env.ADMIN_DISPLAY_NAME || 'Admin'

// Validate required environment variables
if (!adminEmail) {
  console.error('❌ Missing environment variable: ADMIN_EMAIL')
  console.error('   Example: ADMIN_EMAIL=samvpslio@gmail.com')
  process.exit(1)
}

if (!adminPassword) {
  console.error('❌ Missing environment variable: ADMIN_PASSWORD')
  console.error('   Example: ADMIN_PASSWORD=Sam@00000')
  process.exit(1)
}

const prisma = new PrismaClient()

async function seedAdmin() {
  try {
    console.log(`\n🔐 Starting admin user setup for: ${adminEmail}\n`)

    // Check if admin user already exists
    console.log('🔍 Checking for existing admin user...')
    const existingAdmin = await prisma.adminProfile.findUnique({
      where: { email: adminEmail.toLowerCase() },
    })

    if (existingAdmin) {
      console.log(`✓ Admin user already exists: ${existingAdmin.email}`)
      console.log('  Updating password...\n')

      // Update password
      const hashedPassword = await bcrypt.hash(adminPassword, 10)
      await prisma.adminProfile.update({
        where: { id: existingAdmin.id },
        data: { hashedPassword },
      })

      console.log('✓ Password updated successfully\n')
      printLoginInfo()
      return
    }

    // Create new admin user
    console.log('✓ Admin user not found, creating new user...')
    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    const newAdmin = await prisma.adminProfile.create({
      data: {
        email: adminEmail.toLowerCase(),
        username: adminEmail.split('@')[0],
        displayName: adminDisplayName,
        hashedPassword,
      },
    })

    console.log('✓ Admin user created successfully!\n')
    printLoginInfo()
  } catch (error) {
    console.error('❌ Unexpected error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

function printLoginInfo() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ Admin credentials ready for login:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📧 Email:    ${adminEmail}`)
  console.log(`🔑 Password: ${adminPassword}`)
  console.log(`📍 Login URL: http://localhost:3000/zwsloginsam`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

// Run the seed function
seedAdmin()
