/**
 * Neon Database Client
 * Direct SQL access using @neondatabase/serverless
 */

import { neon } from '@neondatabase/serverless'

// Create a reusable SQL client
export const sql = neon(process.env.DATABASE_URL!)

// Admin Profile type
export interface AdminProfile {
  id: string
  email: string
  username: string
  display_name: string
  hashed_password: string
  role: string
  created_at: Date
  updated_at: Date
  last_login: Date | null
}

// Helper functions for admin operations
export async function getAdminByEmail(email: string): Promise<AdminProfile | null> {
  const result = await sql`
    SELECT * FROM admin_profiles WHERE email = ${email.toLowerCase()}
  `
  return result[0] as AdminProfile | null
}

export async function updateAdminLastLogin(id: string): Promise<void> {
  await sql`
    UPDATE admin_profiles SET last_login = NOW(), updated_at = NOW() WHERE id = ${id}
  `
}

export async function logAnalyticsEvent(
  eventType: string,
  eventName: string,
  properties: Record<string, unknown> = {},
  userAgent?: string | null,
  ipAddress?: string | null
): Promise<void> {
  try {
    await sql`
      INSERT INTO analytics_events (event_type, event_name, properties, user_agent, ip_address)
      VALUES (${eventType}, ${eventName}, ${JSON.stringify(properties)}, ${userAgent}, ${ipAddress})
    `
  } catch {
    // Silent fail - don't break operations for analytics
  }
}
