import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

/**
 * This endpoint initializes the admin user from environment variables
 * Call POST /api/admin/init to create the admin user
 */

export async function POST() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD
    const adminDisplayName = process.env.ADMIN_DISPLAY_NAME || "Admin"

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: "Admin credentials not configured in environment" },
        { status: 400 }
      )
    }

    // Check if admin user already exists in User table
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail.toLowerCase() },
    })

    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: "Admin user already exists",
        email: adminEmail,
      })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    // Create admin user in unified User table
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail.toLowerCase(),
        name: adminDisplayName,
        hashedPassword,
        role: "super_admin",
      },
    })

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      email: adminEmail,
      name: adminDisplayName,
      id: adminUser.id,
    })
  } catch (error) {
    console.error("Admin init error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    )
  }
}
