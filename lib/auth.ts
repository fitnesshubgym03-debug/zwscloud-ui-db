/**
 * Authentication utilities for unified user/admin auth
 */

import { cookies } from "next/headers"
import { SignJWT, jwtVerify, type JWTPayload } from "jose"

// JWT_SECRET must be set in environment variables - never hardcode
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || ""
)

const TOKEN_NAME = "auth_token"
const TOKEN_MAX_AGE = 60 * 60 * 24 // 24 hours

export interface AuthUser {
  id: string
  email: string
  name: string | null
  role: "user" | "admin" | "super_admin"
}

export interface AuthPayload extends JWTPayload {
  id: string
  email: string
  name: string | null
  role: "user" | "admin" | "super_admin"
}

/**
 * Create a JWT token for a user
 */
export async function createToken(user: AuthUser): Promise<string> {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not configured")
  }

  return new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET)
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<AuthPayload | null> {
  if (!process.env.JWT_SECRET) {
    console.error("[AUTH] JWT_SECRET not configured - cannot verify token")
    return null
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as AuthPayload
  } catch {
    return null
  }
}

/**
 * Set auth cookie
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    // Don't set secure flag in development/localhost to allow cookies over HTTP
    secure: process.env.NODE_ENV === "production" && !process.env.VERCEL_DEV,
    sameSite: "lax",
    maxAge: TOKEN_MAX_AGE,
    path: "/",
  })
}

/**
 * Clear auth cookie
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(TOKEN_NAME)
  // Also clear legacy admin token if exists
  cookieStore.delete("admin_token")
}

/**
 * Get current session from cookies
 */
export async function getSession(): Promise<AuthPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(TOKEN_NAME)?.value
  
  // Also check legacy admin token for backward compatibility
  const legacyToken = cookieStore.get("admin_token")?.value
  
  const tokenToVerify = token || legacyToken
  
  if (!tokenToVerify) {
    return null
  }
  
  return verifyToken(tokenToVerify)
}

/**
 * Check if user has admin privileges
 */
export function isAdmin(user: AuthPayload | null): boolean {
  return user?.role === "admin" || user?.role === "super_admin"
}

/**
 * Check if user has super admin privileges
 */
export function isSuperAdmin(user: AuthPayload | null): boolean {
  return user?.role === "super_admin"
}
