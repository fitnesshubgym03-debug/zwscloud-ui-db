import { NextResponse } from "next/server"
import { sql } from "@/lib/neon"

export async function GET() {
  try {
    const customers = await sql`
      SELECT id, email, name, phone, company, metadata, created_at, updated_at
      FROM customers
      ORDER BY created_at DESC
      LIMIT 100
    `

    return NextResponse.json({ customers })
  } catch (error) {
    console.error("Failed to fetch customers:", error)
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    )
  }
}
