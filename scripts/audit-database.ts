import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('[Seed] Starting database audit...')

  // Check existing data
  const userCount = await prisma.user.count()
  const adminCount = await prisma.adminProfile.count()

  console.log(`[Seed] Users in database: ${userCount}`)
  console.log(`[Seed] Admin profiles in database: ${adminCount}`)

  // List all admins
  const admins = await prisma.adminProfile.findMany()
  console.log(`[Seed] Admin accounts:`)
  admins.forEach(admin => {
    console.log(`  - Email: ${admin.email}, Role: ${admin.role}`)
  })

  // Create a test admin if none exists
  if (adminCount === 0) {
    console.log('[Seed] No admin accounts found. Creating test admin...')
    const hashedPassword = await bcrypt.hash('Admin123!', 10)
    
    const admin = await prisma.adminProfile.create({
      data: {
        email: 'admin@example.com',
        username: 'admin',
        displayName: 'Administrator',
        hashedPassword,
        role: 'admin',
      },
    })
    
    console.log(`[Seed] ✓ Created admin: ${admin.email}`)
  }

  // List all users
  const users = await prisma.user.findMany()
  console.log(`[Seed] User accounts (${users.length}):`)
  users.forEach(user => {
    console.log(`  - Email: ${user.email}, Role: ${user.role}`)
  })

  console.log('[Seed] Audit complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
