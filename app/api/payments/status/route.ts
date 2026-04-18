import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

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
    const order = await prisma.order.findUnique({
      where: { orderNumber: orderId },
      include: {
        payments: {
          select: {
            status: true,
            paymentMethod: true,
            completedAt: true,
          },
        },
        invoices: {
          select: {
            invoiceNumber: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    const payment = order.payments?.[0]
    const invoice = order.invoices?.[0]

    return NextResponse.json({
      orderNumber: order.orderNumber,
      amount: order.totalAmount,
      status: payment?.status || order.status,
      paymentMethod: payment?.paymentMethod || null,
      invoiceNumber: invoice?.invoiceNumber || null,
      completedAt: payment?.completedAt || null,
    })
  } catch (error) {
    console.error("Payment status error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
