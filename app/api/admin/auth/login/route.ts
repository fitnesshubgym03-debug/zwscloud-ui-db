import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { createToken, setAuthCookie } from "@/lib/auth"

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

    // First try to find user in User table
    let adminUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // If not found, check legacy AdminProfile for backward compatibility
    if (!adminUser) {
      const legacyAdmin = await prisma.adminProfile.findUnique({
        where: { email: email.toLowerCase() },
      })

      if (legacyAdmin) {
        // Migrate legacy admin to new User table
        const hashedPassword = await bcrypt.hash(
          Buffer.from(legacyAdmin.hashedPassword, 'base64').toString('utf-8'),
          10
        ).catch(() => legacyAdmin.hashedPassword)

        adminUser = await prisma.user.create({
          data: {
            email: legacyAdmin.email.toLowerCase(),
            name: legacyAdmin.displayName,
            hashedPassword: hashedPassword,
            role: "super_admin",
          },
        })
      }
    }

    if (!adminUser) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Verify user is admin
    if (adminUser.role !== "admin" && adminUser.role !== "super_admin") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
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
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { lastLogin: new Date() },
    })

    // Create JWT token using unified auth utility
    const token = await createToken({
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role as "user" | "admin" | "super_admin",
    })

    // Set auth cookie
    await setAuthCookie(token)

    return NextResponse.json({
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
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
