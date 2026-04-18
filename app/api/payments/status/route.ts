import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get("order_id")

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      )
    }

    // Find order by order_number
    const orders = await sql`
      SELECT * FROM orders WHERE order_number = ${orderId}
    `

    if (orders.length === 0) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    const order = orders[0] as {
      id: string
      order_number: string
      total_amount: string
      status: string
    }

    // Get payment info
    const payments = await sql`
      SELECT status, payment_method, completed_at FROM payments WHERE order_id = ${order.id} LIMIT 1
    `
    const payment = payments[0] as {
      status: string
      payment_method: string | null
      completed_at: string | null
    } | undefined

    // Get invoice info
    const invoices = await sql`
      SELECT invoice_number FROM invoices WHERE order_id = ${order.id} LIMIT 1
    `
    const invoice = invoices[0] as { invoice_number: string } | undefined

    return NextResponse.json({
      orderNumber: order.order_number,
      amount: parseFloat(order.total_amount),
      status: payment?.status || order.status,
      paymentMethod: payment?.payment_method || null,
      invoiceNumber: invoice?.invoice_number || null,
      completedAt: payment?.completed_at || null,
    })
  } catch (error) {
    console.error("Payment status error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
