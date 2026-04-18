/**
 * Database client singleton for Prisma
 * Ensures single connection throughout the application lifecycle
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient | null; dbError: Error | null }

let initError: Error | null = null

function getPrismaInstance(): PrismaClient | null {
  if (globalForPrisma.prisma) return globalForPrisma.prisma
  if (globalForPrisma.dbError) return null

  try {
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
  } catch (error) {
    initError = error instanceof Error ? error : new Error('Failed to initialize Prisma client')
    globalForPrisma.dbError = initError
    console.error('[DB] Prisma initialization error:', initError.message)
    return null
  }
}

// Helper to check if database is available
export function isDatabaseAvailable(): boolean {
  return !!process.env.DATABASE_URL
}

// Helper to get database error if initialization failed
export function getDatabaseError(): Error | null {
  if (globalForPrisma.dbError) return globalForPrisma.dbError
  return initError
}

// Create a safe proxy that will handle errors
const dbProxy = new Proxy(
  {},
  {
    get(target, prop: string | symbol) {
      const client = getPrismaInstance()
      if (!client) {
        const error = getDatabaseError()
        throw error || new Error('Database not configured. Please set DATABASE_URL environment variable.')
      }
      return (client as any)[prop]
    },
  }
) as PrismaClient

export const prisma = dbProxy

export default prisma
