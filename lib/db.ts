/**
 * Database client singleton for Prisma
 * Ensures single connection throughout the application lifecycle
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient | null }

function getPrismaInstance(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
  }

  return client
}

// Export the Prisma client instance directly
export const prisma = getPrismaInstance()

// Helper to check if database is available
export function isDatabaseAvailable(): boolean {
  return !!process.env.DATABASE_URL
}

export default prisma
