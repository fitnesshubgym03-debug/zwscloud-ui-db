#!/usr/bin/env node

/**
 * User Seeding Script
 * Creates admin and test users in the unified users table
 * Run with: pnpm tsx scripts/seed-users.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedUsers() {
  console.log('\n🔐 Starting user seeding...\n')

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@zws.cloud'
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!'
  const adminName = process.env.ADMIN_DISPLAY_NAME || 'Admin User'

  try {
    // Check and create admin user
    console.log('🔍 Checking for existing admin user...')
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail.toLowerCase() },
    })

    if (existingAdmin) {
      console.log(`✓ Admin user already exists: ${existingAdmin.email}`)
      
      // Update password if provided
      if (process.env.ADMIN_PASSWORD) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10)
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: { hashedPassword },
        })
        console.log('✓ Admin password updated')
      }
    } else {
      // Create new admin user
      console.log('Creating admin user...')
      const hashedPassword = await bcrypt.hash(adminPassword, 10)

      await prisma.user.create({
        data: {
          email: adminEmail.toLowerCase(),
          name: adminName,
          hashedPassword,
          role: 'admin',
        },
      })
      console.log(`✓ Admin user created: ${adminEmail}`)
    }

    // Create a demo regular user for testing
    const demoEmail = 'demo@zws.cloud'
    const demoPassword = 'Demo123!'
    
    const existingDemo = await prisma.user.findUnique({
      where: { email: demoEmail },
    })

    if (!existingDemo) {
      const hashedPassword = await bcrypt.hash(demoPassword, 10)
      await prisma.user.create({
        data: {
          email: demoEmail,
          name: 'Demo User',
          hashedPassword,
          role: 'user',
        },
      })
      console.log(`✓ Demo user created: ${demoEmail}`)
    } else {
      console.log(`✓ Demo user already exists: ${demoEmail}`)
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ User seeding complete!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📧 Admin:    ${adminEmail} / ${adminPassword}`)
    console.log(`📧 Demo:     ${demoEmail} / ${demoPassword}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  } catch (error) {
    console.error('❌ Error seeding users:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seedUsers()
