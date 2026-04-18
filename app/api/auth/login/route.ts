import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { createToken, setAuthCookie, type AuthUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Verify database is configured
    if (!process.env.DATABASE_URL) {
      console.error(
        "[AUTH] DATABASE_URL not configured. Configure DATABASE_URL in environment variables."
      )
      return NextResponse.json(
        { error: "Database configuration error. Please contact administrator." },
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

    // Find user in unified users table
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // If not found in users table, try legacy admin_profiles table
    if (!user) {
      const adminProfile = await prisma.adminProfile.findUnique({
        where: { email: email.toLowerCase() },
      })

        if (adminProfile) {
        // Verify password
        const isValid = await bcrypt.compare(password, adminProfile.hashedPassword)
        if (!isValid) {
          return NextResponse.json(
            { error: "Invalid credentials" },
            { status: 401 }
          )
        }

        // Create session for legacy admin
        const authUser: AuthUser = {
          id: adminProfile.id,
          email: adminProfile.email,
          name: adminProfile.displayName,
          role: adminProfile.role === "super_admin" ? "super_admin" : "admin",
        }

        const token = await createToken(authUser)
        await setAuthCookie(token)

        // Update last login
        await prisma.adminProfile.update({
          where: { id: adminProfile.id },
          data: { lastLogin: new Date() },
        })

        return NextResponse.json({
          success: true,
          user: authUser,
          redirectTo: "/client-area",
        })
      }

      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.hashedPassword)

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Create auth user object
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "user" | "admin" | "super_admin",
    }

    // Create and set JWT token
    const token = await createToken(authUser)
    await setAuthCookie(token)

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    return NextResponse.json({
      success: true,
      user: authUser,
      redirectTo: "/client-area",
    })
  } catch (error) {
    console.error("[AUTH] Login error:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// Remove the old logLoginAttempt function since we're not using analytics in login

