import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { sql } from "@/lib/neon"

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

    // Check if admin user already exists
    const existingAdmin = await sql`
      SELECT id FROM admin_profiles WHERE email = ${adminEmail.toLowerCase()}
    `

    if (existingAdmin.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Admin user already exists",
        email: adminEmail,
      })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    // Create admin profile
    await sql`
      INSERT INTO admin_profiles (email, username, display_name, hashed_password, role)
      VALUES (${adminEmail.toLowerCase()}, ${adminEmail.split("@")[0]}, ${adminDisplayName}, ${hashedPassword}, 'admin')
    `

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      email: adminEmail,
      displayName: adminDisplayName,
    })
  } catch (error) {
    console.error("Admin init error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    )
  }
}
