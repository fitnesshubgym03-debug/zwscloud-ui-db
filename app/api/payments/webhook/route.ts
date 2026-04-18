import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { verifyWebhookSignature } from "@/lib/cashfree"

interface WebhookPayload {
  type: string
  data: {
    order: {
      order_id: string
      order_amount: number
      order_currency: string
      order_status: string
    }
    payment: {
      cf_payment_id: string
      payment_status: string
      payment_amount: number
      payment_currency: string
      payment_message: string
      payment_time: string
      payment_method: {
        card?: { card_network: string; card_type: string; card_bank_name: string }
        upi?: { upi_id: string }
        netbanking?: { netbanking_bank_name: string }
      }
      bank_reference: string | null
    }
    customer_details: {
      customer_id: string
      customer_email: string
      customer_phone: string
      customer_name: string | null
    }
  }
  event_time: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-webhook-signature") || ""
    const timestamp = request.headers.get("x-webhook-timestamp") || ""

    // Verify signature
    if (process.env.CASHFREE_WEBHOOK_SECRET) {
      const isValid = verifyWebhookSignature(body, timestamp, signature)
      if (!isValid) {
        console.error("Invalid webhook signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const payload: WebhookPayload = JSON.parse(body)

    if (payload.type === "PAYMENT_SUCCESS_WEBHOOK" || payload.type === "PAYMENT_FAILED_WEBHOOK") {
      const { order, payment } = payload.data
      const isSuccess = payload.type === "PAYMENT_SUCCESS_WEBHOOK"

      // Find the order by order_number
      const orders = await sql`SELECT * FROM orders WHERE order_number = ${order.order_id}`

      if (orders.length === 0) {
        console.error("Order not found:", order.order_id)
        return NextResponse.json({ success: true })
      }

      const orderData = orders[0] as { id: string; customer_id: string; subtotal: string; tax_amount: string; total_amount: string; term_months: number }
      const paymentStatus = isSuccess ? "completed" : "failed"

      // Update payment record
      await sql`
        UPDATE payments SET 
          gateway_payment_id = ${payment.cf_payment_id},
          status = ${paymentStatus},
          payment_method = ${getPaymentMethodType(payment.payment_method)},
          payment_method_details = ${JSON.stringify(payment.payment_method)},
          gateway_response = ${JSON.stringify(payload.data)},
          error_message = ${isSuccess ? null : payment.payment_message},
          completed_at = ${isSuccess ? new Date().toISOString() : null},
          updated_at = NOW()
        WHERE order_id = ${orderData.id}
      `

      // Update order status
      await sql`
        UPDATE orders SET 
          status = ${isSuccess ? "paid" : "payment_failed"},
          updated_at = NOW()
        WHERE id = ${orderData.id}
      `

      // If payment successful, create invoice
      if (isSuccess) {
        await createInvoice(orderData)
      }

      // Log analytics event
      await sql`
        INSERT INTO analytics_events (event_type, event_name, properties)
        VALUES ('payment', ${isSuccess ? 'payment_success' : 'payment_failed'}, ${JSON.stringify({
          orderId: order.order_id,
          amount: payment.payment_amount,
          paymentMethod: getPaymentMethodType(payment.payment_method),
          cfPaymentId: payment.cf_payment_id,
        })})
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ success: true })
  }
}

function getPaymentMethodType(paymentMethod: WebhookPayload["data"]["payment"]["payment_method"]): string {
  if (paymentMethod.card) return "card"
  if (paymentMethod.upi) return "upi"
  if (paymentMethod.netbanking) return "netbanking"
  return "unknown"
}

async function createInvoice(order: { id: string; customer_id: string; subtotal: string; tax_amount: string; total_amount: string; term_months: number }) {
  // Get order details
  const products = await sql`
    SELECT p.name FROM orders o 
    LEFT JOIN products p ON o.product_id = p.id 
    WHERE o.id = ${order.id}
  `
  const configs = await sql`
    SELECT cc.cpu_cores, cc.ram_gb, cc.disks FROM orders o 
    LEFT JOIN custom_configs cc ON o.custom_config_id = cc.id 
    WHERE o.id = ${order.id}
  `

  const productName = (products[0] as { name: string } | undefined)?.name
  const configData = configs[0] as { cpu_cores: number; ram_gb: number; disks: unknown[] } | undefined

  // Generate invoice number
  const orderResult = await sql`SELECT order_number FROM orders WHERE id = ${order.id}`
  const orderNumber = (orderResult[0] as { order_number: string }).order_number
  const invoiceNumber = `INV-${orderNumber.replace("ZWS-", "")}`

  const description = productName || 
    (configData ? `Custom VPS (${configData.cpu_cores} vCPU, ${configData.ram_gb}GB RAM)` : "Custom VPS Configuration")

  const lineItems = [
    {
      description,
      quantity: 1,
      unitPrice: parseFloat(order.subtotal) / order.term_months,
      termMonths: order.term_months,
      total: parseFloat(order.subtotal),
    },
  ]

  const issueDate = new Date()
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 7)

  await sql`
    INSERT INTO invoices (invoice_number, order_id, customer_id, issue_date, due_date, subtotal, tax_rate, tax_amount, total_amount, currency, status, line_items, paid_at)
    VALUES (${invoiceNumber}, ${order.id}, ${order.customer_id}, ${issueDate.toISOString().split('T')[0]}, ${dueDate.toISOString().split('T')[0]}, ${order.subtotal}, 18, ${order.tax_amount}, ${order.total_amount}, 'INR', 'paid', ${JSON.stringify(lineItems)}, ${new Date().toISOString()})
  `
}
