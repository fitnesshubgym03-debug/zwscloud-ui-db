import { NextResponse } from "next/server"
import { sql } from "@/lib/neon"

export async function GET() {
  try {
    const payments = await sql`
      SELECT 
        p.id, 
        p.gateway, 
        p.gateway_payment_id, 
        p.amount, 
        p.currency, 
        p.status, 
        p.payment_method,
        p.created_at,
        p.completed_at,
        c.email as customer_email,
        o.order_number
      FROM payments p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN orders o ON p.order_id = o.id
      ORDER BY p.created_at DESC
      LIMIT 100
    `

    return NextResponse.json({ payments })
  } catch (error) {
    console.error("Failed to fetch payments:", error)
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    )
  }
}
