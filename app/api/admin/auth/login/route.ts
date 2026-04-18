import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { SignJWT } from "jose"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

// JWT_SECRET must be set in environment variables - never hardcode
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || ""
)

export async function POST(request: NextRequest) {
  try {
    if (!process.env.JWT_SECRET) {
      console.error("[AUTH] JWT_SECRET not configured")
      return NextResponse.json(
        { error: "Authentication system not configured. Please contact administrator." },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Get admin from database using Prisma
    const adminUser = await prisma.adminProfile.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!adminUser) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Verify password with bcrypt
    const isValid = await bcrypt.compare(password, adminUser.hashedPassword)

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Update last login
    await prisma.adminProfile.update({
      where: { id: adminUser.id },
      data: { lastLogin: new Date() },
    })

    // Create JWT token
    const token = await new SignJWT({
      email: adminUser.email,
      displayName: adminUser.displayName,
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
        displayName: adminUser.displayName,
        role: "super_admin",
      },
    })
  } catch (error) {
    console.error("[AUTH] Admin login error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
