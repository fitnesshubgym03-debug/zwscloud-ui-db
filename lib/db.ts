/**
 * Database client singleton for Prisma
 * Ensures single connection throughout the application lifecycle
 * Handles missing DATABASE_URL gracefully for build-time and preview deployments
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient | null }

// Check if DATABASE_URL is configured
const isDatabaseConfigured = !!process.env.DATABASE_URL

// Only create PrismaClient if DATABASE_URL exists
function createPrismaClient(): PrismaClient | null {
  if (!isDatabaseConfigured) {
    console.warn('[DB] DATABASE_URL not configured - database operations will be disabled')
    return null
  }

  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })
}

// Lazy initialization - only create client when accessed
let prismaClient: PrismaClient | null = null

function getPrismaClient(): PrismaClient | null {
  if (prismaClient) return prismaClient
  if (globalForPrisma.prisma) return globalForPrisma.prisma
  
  prismaClient = createPrismaClient()
  
  if (prismaClient && process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaClient
  }
  
  return prismaClient
}

// Export a proxy that lazily initializes the client
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = getPrismaClient()
    if (!client) {
      // Return a no-op for methods when database is not configured
      if (typeof prop === 'string') {
        return new Proxy({}, {
          get() {
            return async () => {
              console.warn(`[DB] Skipping database operation - DATABASE_URL not configured`)
              return null
            }
          }
        })
      }
      return undefined
    }
    return (client as any)[prop]
  }
})

export default prisma

// Helper to check if database is available
export function isDatabaseAvailable(): boolean {
  return isDatabaseConfigured
}
