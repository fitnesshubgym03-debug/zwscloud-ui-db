import { NextResponse } from "next/server"
import { sql } from "@/lib/neon"

export async function GET() {
  try {
    const orders = await sql`
      SELECT 
        o.id, 
        o.order_number, 
        o.term_months, 
        o.total_amount, 
        o.status, 
        o.created_at,
        c.email as customer_email,
        c.name as customer_name,
        p.name as product_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN products p ON o.product_id = p.id
      ORDER BY o.created_at DESC
      LIMIT 100
    `

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("Failed to fetch orders:", error)
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    )
  }
}
