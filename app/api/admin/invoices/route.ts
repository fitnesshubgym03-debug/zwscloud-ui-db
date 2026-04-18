import { NextResponse } from "next/server"
import { sql } from "@/lib/neon"

export async function GET() {
  try {
    const invoices = await sql`
      SELECT 
        i.id, 
        i.invoice_number, 
        i.issue_date, 
        i.due_date, 
        i.total_amount, 
        i.status,
        c.email as customer_email,
        c.name as customer_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      ORDER BY i.created_at DESC
      LIMIT 100
    `

    return NextResponse.json({ invoices })
  } catch (error) {
    console.error("Failed to fetch invoices:", error)
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    )
  }
}
