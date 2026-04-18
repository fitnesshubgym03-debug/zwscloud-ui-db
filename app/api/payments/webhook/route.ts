import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
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
      const orderData = await prisma.order.findUnique({
        where: { orderNumber: order.order_id },
      })

      if (!orderData) {
        console.error("Order not found:", order.order_id)
        return NextResponse.json({ success: true })
      }

      // Update payment record
      const paymentStatus = isSuccess ? "completed" : "failed"

      await prisma.payment.updateMany({
        where: { orderId: orderData.id },
        data: {
          gatewayPaymentId: payment.cf_payment_id,
          status: paymentStatus,
          paymentMethod: getPaymentMethodType(payment.payment_method),
          paymentMethodDetails: payment.payment_method as any,
          gatewayResponse: payload.data as any,
          errorMessage: isSuccess ? null : payment.payment_message,
          completedAt: isSuccess ? new Date() : null,
        },
      })

      // Update order status
      await prisma.order.update({
        where: { id: orderData.id },
        data: {
          status: isSuccess ? "paid" : "payment_failed",
        },
      })

      // If payment successful, create invoice
      if (isSuccess) {
        const orderDetails = await prisma.order.findUnique({
          where: { id: orderData.id },
          include: {
            product: true,
            customConfig: true,
          },
        })

        if (orderDetails) {
          await createInvoice(orderDetails)
        }
      }

      // Log analytics event
      await prisma.analyticsEvent.create({
        data: {
          eventType: "payment",
          eventName: isSuccess ? "payment_success" : "payment_failed",
          properties: {
            orderId: order.order_id,
            amount: payment.payment_amount,
            paymentMethod: getPaymentMethodType(payment.payment_method),
            cfPaymentId: payment.cf_payment_id,
          },
        },
      })
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

async function createInvoice(order: any) {
  const invoiceNumber = `INV-${order.orderNumber.replace("ZWS-", "")}`

  const lineItems = [
    {
      description:
        order.product?.name ||
        `Custom VPS (${order.customConfig?.cpuCores} vCPU, ${order.customConfig?.ramGb}GB RAM, ${order.customConfig?.storageGb}GB Storage)`,
      quantity: 1,
      unitPrice: order.subtotal / order.termMonths,
      termMonths: order.termMonths,
      total: order.subtotal,
    },
  ]

  const issueDate = new Date()
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 7)

  await prisma.invoice.create({
    data: {
      invoiceNumber,
      orderId: order.id,
      customerId: order.customerId,
      issueDate,
      dueDate,
      subtotal: order.subtotal,
      taxRate: 18,
      taxAmount: order.taxAmount,
      totalAmount: order.totalAmount,
      currency: "INR",
      status: "paid",
      lineItems: lineItems as any,
      paidAt: new Date(),
    },
  })
}
