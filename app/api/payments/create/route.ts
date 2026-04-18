import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createPaymentOrder } from "@/lib/cashfree"
import { calculateTax } from "@/lib/pricing"

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ZWS-${timestamp}-${random}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, customConfigId, term = 1, customerDetails } = body

    if (!customerDetails?.email || !customerDetails?.phone) {
      return NextResponse.json(
        { error: "Customer email and phone are required" },
        { status: 400 }
      )
    }

    let unitPrice: number
    let productData = null
    let customConfigData = null

    // Get pricing from product or custom config
    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
      })

      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        )
      }

      // Get price for term
      const termPriceField = (`price${term}m` as any) as keyof typeof product
      unitPrice = product[termPriceField] || product.price1m
      productData = product
    } else if (customConfigId) {
      const config = await prisma.customConfig.findUnique({
        where: { id: customConfigId },
      })

      if (!config) {
        return NextResponse.json(
          { error: "Custom configuration not found" },
          { status: 404 }
        )
      }

      unitPrice = config.monthlyPrice
      customConfigData = config
    } else {
      return NextResponse.json(
        { error: "Product ID or Custom Config ID is required" },
        { status: 400 }
      )
    }

    // Calculate amounts
    const subtotal = unitPrice * term
    const taxAmount = calculateTax(subtotal)
    const totalAmount = subtotal + taxAmount

    // Create or get customer
    let customer = await prisma.customer.findUnique({
      where: { email: customerDetails.email },
    })

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          email: customerDetails.email,
          name: customerDetails.name || null,
          phone: customerDetails.phone,
        },
      })
    }

    // Create order record
    const orderNumber = generateOrderNumber()
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        productId: productId || undefined,
        customConfigId: customConfigId || undefined,
        termMonths: term,
        unitPrice,
        quantity: 1,
        subtotal,
        taxAmount,
        totalAmount,
        currency: "INR",
        status: "pending",
        metadata: {
          productName: productData?.name || "Custom VPS Configuration",
          customerDetails,
        },
      },
    })

    // Create Cashfree payment order
    try {
      const paymentOrder = await createPaymentOrder({
        orderId: orderNumber,
        orderAmount: totalAmount,
        customerDetails: {
          customerId: customer.id,
          customerEmail: customerDetails.email,
          customerPhone: customerDetails.phone,
          customerName: customerDetails.name,
        },
        orderNote: productData?.name || "Custom VPS Configuration",
      })

      // Create payment record
      await prisma.payment.create({
        data: {
          orderId: order.id,
          customerId: customer.id,
          gateway: "cashfree",
          gatewayOrderId: paymentOrder.cfOrderId,
          gatewaySessionId: paymentOrder.paymentSessionId,
          amount: totalAmount,
          currency: "INR",
          status: "pending",
        },
      })

      return NextResponse.json({
        success: true,
        orderNumber,
        orderId: order.id,
        paymentSessionId: paymentOrder.paymentSessionId,
        paymentUrl: paymentOrder.payments.url,
        amount: totalAmount,
      })
    } catch (paymentError) {
      // Update order status to failed
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "payment_failed" },
      })

      console.error("Cashfree payment error:", paymentError)
      return NextResponse.json(
        { error: "Failed to initialize payment. Please try again." },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Payment creation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
