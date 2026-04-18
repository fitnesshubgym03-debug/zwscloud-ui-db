/**
 * Database client singleton for Prisma
 * Ensures single connection throughout the application lifecycle
 * Handles missing DATABASE_URL gracefully for build-time and preview deployments
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient | null }

// Check if DATABASE_URL is configured
const isDatabaseConfigured = !!process.env.DATABASE_URL

let prismaClient: PrismaClient | null = null

function getPrismaClient(): PrismaClient {
  if (prismaClient) return prismaClient
  if (globalForPrisma.prisma) return globalForPrisma.prisma
  
  if (!isDatabaseConfigured) {
    console.error('[DB] DATABASE_URL not configured - cannot create database connection')
    throw new Error('DATABASE_URL environment variable is not configured')
  }

  prismaClient = new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })
  
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaClient
  }
  
  return prismaClient
}

// Export getter function that will throw if DB is not configured
export function getDb(): PrismaClient {
  return getPrismaClient()
}

// Export helper to check if database is available
export function isDatabaseAvailable(): boolean {
  return isDatabaseConfigured
}

// Default export - throws if database not configured
export const prisma = {
  get user() {
    return getPrismaClient().user
  },
  get adminProfile() {
    return getPrismaClient().adminProfile
  },
  get customer() {
    return getPrismaClient().customer
  },
  get analyticsEvent() {
    return getPrismaClient().analyticsEvent
  },
  // Add other models as needed
} as PrismaClient

export default prisma
