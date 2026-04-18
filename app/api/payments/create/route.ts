import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
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
    let productData: { name: string } | null = null
    let customConfigData: { cpu_cores: number; ram_gb: number; storage_gb?: number } | null = null

    // Get pricing from product or custom config
    if (productId) {
      const products = await sql`SELECT * FROM products WHERE id = ${productId}`

      if (products.length === 0) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        )
      }

      const product = products[0] as {
        name: string
        price_1m: string
        price_3m: string | null
        price_6m: string | null
        price_12m: string | null
        price_24m: string | null
      }

      // Get price for term
      const termPrices: Record<number, string | null> = {
        1: product.price_1m,
        3: product.price_3m,
        6: product.price_6m,
        12: product.price_12m,
        24: product.price_24m,
      }
      unitPrice = parseFloat(termPrices[term] || product.price_1m)
      productData = { name: product.name }
    } else if (customConfigId) {
      const configs = await sql`SELECT * FROM custom_configs WHERE id = ${customConfigId}`

      if (configs.length === 0) {
        return NextResponse.json(
          { error: "Custom configuration not found" },
          { status: 404 }
        )
      }

      const config = configs[0] as { monthly_price: string; cpu_cores: number; ram_gb: number }
      unitPrice = parseFloat(config.monthly_price)
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
    let customers = await sql`SELECT * FROM customers WHERE email = ${customerDetails.email}`
    let customerId: string

    if (customers.length === 0) {
      const newCustomer = await sql`
        INSERT INTO customers (email, name, phone) 
        VALUES (${customerDetails.email}, ${customerDetails.name || null}, ${customerDetails.phone})
        RETURNING id
      `
      customerId = (newCustomer[0] as { id: string }).id
    } else {
      customerId = (customers[0] as { id: string }).id
    }

    // Create order record
    const orderNumber = generateOrderNumber()
    const orderResult = await sql`
      INSERT INTO orders (order_number, customer_id, product_id, custom_config_id, term_months, unit_price, quantity, subtotal, tax_amount, total_amount, currency, status, metadata)
      VALUES (${orderNumber}, ${customerId}, ${productId || null}, ${customConfigId || null}, ${term}, ${unitPrice}, 1, ${subtotal}, ${taxAmount}, ${totalAmount}, 'INR', 'pending', ${JSON.stringify({
        productName: productData?.name || "Custom VPS Configuration",
        customerDetails,
      })})
      RETURNING id
    `
    const orderId = (orderResult[0] as { id: string }).id

    // Create Cashfree payment order
    try {
      const paymentOrder = await createPaymentOrder({
        orderId: orderNumber,
        orderAmount: totalAmount,
        customerDetails: {
          customerId,
          customerEmail: customerDetails.email,
          customerPhone: customerDetails.phone,
          customerName: customerDetails.name,
        },
        orderNote: productData?.name || "Custom VPS Configuration",
      })

      // Create payment record
      await sql`
        INSERT INTO payments (order_id, customer_id, gateway, gateway_order_id, gateway_session_id, amount, currency, status)
        VALUES (${orderId}, ${customerId}, 'cashfree', ${paymentOrder.cfOrderId}, ${paymentOrder.paymentSessionId}, ${totalAmount}, 'INR', 'pending')
      `

      return NextResponse.json({
        success: true,
        orderNumber,
        orderId,
        paymentSessionId: paymentOrder.paymentSessionId,
        paymentUrl: paymentOrder.payments.url,
        amount: totalAmount,
      })
    } catch (paymentError) {
      // Update order status to failed
      await sql`UPDATE orders SET status = 'payment_failed' WHERE id = ${orderId}`

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
