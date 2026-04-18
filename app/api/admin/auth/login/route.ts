import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { SignJWT } from "jose"
import bcrypt from "bcryptjs"
import { getAdminByEmail, updateAdminLastLogin, logAnalyticsEvent } from "@/lib/neon"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "zws-cloud-admin-secret-key-change-in-production"
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Get admin from database
    const adminUser = await getAdminByEmail(email)

    if (!adminUser) {
      await logLoginAttempt(email, false, request)
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Verify password with bcrypt
    const isValid = await bcrypt.compare(password, adminUser.hashed_password)

    if (!isValid) {
      await logLoginAttempt(email, false, request)
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Log successful attempt
    await logLoginAttempt(email, true, request)

    // Update last login
    await updateAdminLastLogin(adminUser.id)

    // Create JWT token
    const token = await new SignJWT({
      email: adminUser.email,
      displayName: adminUser.display_name,
      role: "super_admin",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(JWT_SECRET)

    // Set HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    })

    return NextResponse.json({
      success: true,
      user: {
        email: adminUser.email,
        displayName: adminUser.display_name,
        role: "super_admin",
      },
    })
  } catch (error) {
    console.error("Admin login error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function logLoginAttempt(
  email: string,
  success: boolean,
  request: NextRequest
) {
  try {
    const userAgent = request.headers.get("user-agent") || ""
    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIp || null

    await logAnalyticsEvent(
      "auth",
      success ? "admin_login_success" : "admin_login_failed",
      { email },
      userAgent,
      ipAddress
    )
  } catch {
    // Silent fail - don't break login for analytics
  }
}
