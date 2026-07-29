import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import * as paymentGateway from "@/lib/payment-gateway"
import { calculateTax } from "@/lib/pricing"

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ZWS-${timestamp}-${random}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      productId,
      customConfigId,
      term = 1,
      customerDetails,
      gateway, // Optional: "cashfree" or "razorpay"
      setupMandate = false, // For recurring payments with Razorpay
    } = body

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

    // Create payment order with selected gateway
    try {
      const selectedGateway = (gateway || paymentGateway.getDefaultGateway()) as
        | "cashfree"
        | "razorpay"

      // For Razorpay with mandate setup
      if (selectedGateway === "razorpay" && setupMandate) {
        // Create mandate for recurring billing
        const mandateResponse = await paymentGateway.createMandate(
          {
            customerId: customer.id,
            customerEmail: customerDetails.email,
            customerPhone: customerDetails.phone,
            customerName: customerDetails.name,
            maxAmount: totalAmount * 1.2, // Allow 20% variance
            amount: totalAmount,
            currency: "INR",
            interval: "monthly",
            description: productData?.name || "VPS Subscription",
          },
          selectedGateway
        )

        // Create mandate record
        const mandate = await prisma.razorpayMandate.create({
          data: {
            customerId: customer.id,
            mandateId: mandateResponse.id,
            status: "pending",
            maxAmount: totalAmount * 1.2,
            amount: totalAmount,
            currency: "INR",
            method: "emandate",
            interval: "monthly",
            period: "monthly",
            startAt: new Date(),
            description: productData?.name || "VPS Subscription",
          },
        })

        return NextResponse.json({
          success: true,
          orderNumber,
          orderId: order.id,
          mandateId: mandate.id,
          mandateUrl: mandateResponse.url,
          mandateStatus: mandateResponse.status,
          amount: totalAmount,
          setupMandate: true,
        })
      }

      // Regular one-time payment
      const paymentOrder = await paymentGateway.createPaymentOrder(
        {
          orderId: orderNumber,
          amount: totalAmount,
          currency: "INR",
          customerId: customer.id,
          customerEmail: customerDetails.email,
          customerPhone: customerDetails.phone,
          customerName: customerDetails.name,
          description: productData?.name || "Custom VPS Configuration",
        },
        selectedGateway
      )

      // Create payment record
      const paymentRecord = await prisma.payment.create({
        data: {
          orderId: order.id,
          customerId: customer.id,
          gateway: selectedGateway,
          gatewayOrderId: paymentOrder.id,
          gatewaySessionId: paymentOrder.sessionId,
          amount: totalAmount,
          currency: "INR",
          status: "pending",
        },
      })

      return NextResponse.json({
        success: true,
        orderNumber,
        orderId: order.id,
        paymentId: paymentRecord.id,
        paymentSessionId: paymentOrder.sessionId || paymentOrder.id,
        paymentUrl: paymentOrder.paymentUrl,
        amount: totalAmount,
        gateway: selectedGateway,
      })
    } catch (paymentError) {
      // Update order status to failed
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "payment_failed" },
      })

      console.error("Payment creation error:", paymentError)
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
