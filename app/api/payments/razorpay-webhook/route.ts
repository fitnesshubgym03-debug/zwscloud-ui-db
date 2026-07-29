import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import * as razorpay from "@/lib/razorpay"
import * as proxmox from "@/lib/proxmox"

/**
 * Handle Razorpay webhooks
 * Supported events:
 * - payment.authorized
 * - payment.failed
 * - payment.captured
 * - mandate.active
 * - mandate.failed
 * - recurring.created
 * - recurring.failed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-razorpay-signature")

    if (!signature || !razorpay.verifyWebhookSignature(body, signature)) {
      console.error("[RAZORPAY WEBHOOK] Invalid signature")
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      )
    }

    const event = JSON.parse(body)
    console.log(`[RAZORPAY WEBHOOK] Event: ${event.event}`)

    switch (event.event) {
      case "payment.authorized":
      case "payment.captured": {
        return handlePaymentSuccess(event)
      }

      case "payment.failed": {
        return handlePaymentFailed(event)
      }

      case "mandate.active": {
        return handleMandateActive(event)
      }

      case "mandate.failed": {
        return handleMandateFailed(event)
      }

      case "recurring.created": {
        return handleRecurringPaymentCreated(event)
      }

      case "recurring.failed": {
        return handleRecurringPaymentFailed(event)
      }

      default: {
        console.log(`[RAZORPAY WEBHOOK] Unhandled event: ${event.event}`)
        return NextResponse.json({ success: true })
      }
    }
  } catch (error) {
    console.error("[RAZORPAY WEBHOOK] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function handlePaymentSuccess(event: any) {
  const { payment } = event
  const { id: paymentId, order_id: orderId, customer_id: customerId } = payment

  try {
    // Update payment record
    const payment_record = await prisma.payment.findFirst({
      where: { gatewayPaymentId: paymentId },
    })

    if (payment_record) {
      await prisma.payment.update({
        where: { id: payment_record.id },
        data: {
          status: "captured",
          completedAt: new Date(),
          gatewayResponse: payment,
        },
      })

      // Get order and update its status
      if (payment_record.orderId) {
        const order = await prisma.order.findUnique({
          where: { id: payment_record.orderId },
          include: { customer: true },
        })

        if (order && order.status === "pending") {
          // Update order to active
          await prisma.order.update({
            where: { id: payment_record.orderId },
            data: { status: "active" },
          })

          // Provision VM on Proxmox if needed
          if (order.productId || order.customConfigId) {
            await provisionVM(order, payment_record.customerId!)
          }
        }
      }

      console.log(
        `[RAZORPAY WEBHOOK] Payment ${paymentId} captured for order ${orderId}`
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[RAZORPAY WEBHOOK] Error handling payment success:", error)
    throw error
  }
}

async function handlePaymentFailed(event: any) {
  const { payment } = event
  const { id: paymentId } = payment

  try {
    const payment_record = await prisma.payment.findFirst({
      where: { gatewayPaymentId: paymentId },
    })

    if (payment_record) {
      await prisma.payment.update({
        where: { id: payment_record.id },
        data: {
          status: "failed",
          errorMessage: payment.error_description,
          gatewayResponse: payment,
        },
      })

      console.log(
        `[RAZORPAY WEBHOOK] Payment ${paymentId} failed: ${payment.error_description}`
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[RAZORPAY WEBHOOK] Error handling payment failure:", error)
    throw error
  }
}

async function handleMandateActive(event: any) {
  const { mandate } = event
  const { id: mandateId, customer_id: customerId } = mandate

  try {
    // Update mandate status
    const mandateRecord = await prisma.razorpayMandate.findUnique({
      where: { mandateId },
    })

    if (mandateRecord) {
      await prisma.razorpayMandate.update({
        where: { id: mandateRecord.id },
        data: {
          status: "active",
          tokenId: mandate.token_id,
          nextPaymentAt: new Date(mandate.start_at * 1000),
        },
      })

      console.log(
        `[RAZORPAY WEBHOOK] Mandate ${mandateId} activated for customer ${customerId}`
      )

      // Trigger first automatic payment after mandate activation
      await triggerAutomaticPayment(mandateRecord.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[RAZORPAY WEBHOOK] Error handling mandate active:", error)
    throw error
  }
}

async function handleMandateFailed(event: any) {
  const { mandate } = event
  const { id: mandateId } = mandate

  try {
    const mandateRecord = await prisma.razorpayMandate.findUnique({
      where: { mandateId },
    })

    if (mandateRecord) {
      await prisma.razorpayMandate.update({
        where: { id: mandateRecord.id },
        data: {
          status: "failed",
        },
      })

      console.log(`[RAZORPAY WEBHOOK] Mandate ${mandateId} failed`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[RAZORPAY WEBHOOK] Error handling mandate failed:", error)
    throw error
  }
}

async function handleRecurringPaymentCreated(event: any) {
  const { payment } = event
  const { id: paymentId, mandate_id: mandateId } = payment

  try {
    // Recurring payment initiated - update mandate's next payment date
    const mandateRecord = await prisma.razorpayMandate.findUnique({
      where: { mandateId },
    })

    if (mandateRecord) {
      await prisma.razorpayMandate.update({
        where: { id: mandateRecord.id },
        data: {
          nextPaymentAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next month
        },
      })

      console.log(
        `[RAZORPAY WEBHOOK] Recurring payment ${paymentId} created for mandate ${mandateId}`
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(
      "[RAZORPAY WEBHOOK] Error handling recurring payment created:",
      error
    )
    throw error
  }
}

async function handleRecurringPaymentFailed(event: any) {
  const { payment } = event
  const { id: paymentId, mandate_id: mandateId } = payment

  try {
    console.log(
      `[RAZORPAY WEBHOOK] Recurring payment ${paymentId} failed for mandate ${mandateId}`
    )

    // Could trigger retry or notification here

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(
      "[RAZORPAY WEBHOOK] Error handling recurring payment failed:",
      error
    )
    throw error
  }
}

async function triggerAutomaticPayment(mandateId: string) {
  try {
    const mandate = await prisma.razorpayMandate.findUnique({
      where: { id: mandateId },
      include: { customer: true },
    })

    if (!mandate || !mandate.customer) {
      return
    }

    // Create automatic payment order
    const paymentOrder = await prisma.payment.create({
      data: {
        customerId: mandate.customerId,
        gateway: "razorpay",
        mandateId: mandate.mandateId,
        amount: mandate.amount,
        currency: mandate.currency,
        status: "pending",
        isRecurring: true,
      },
    })

    console.log(
      `[RAZORPAY] Automatic payment triggered: ${paymentOrder.id}`
    )
  } catch (error) {
    console.error(
      "[RAZORPAY WEBHOOK] Error triggering automatic payment:",
      error
    )
  }
}

async function provisionVM(order: any, customerId: string) {
  try {
    // Get customer's Proxmox account
    const proxmoxAccount = await prisma.proxmoxAccount.findUnique({
      where: { customerId },
    })

    if (!proxmoxAccount) {
      console.log(
        `[PROVISIONING] No Proxmox account for customer ${customerId}`
      )
      return
    }

    // TODO: Implement VM provisioning logic
    // This would integrate with Proxmox to create VMs based on order specs

    console.log(`[PROVISIONING] Starting VM provisioning for order ${order.id}`)
  } catch (error) {
    console.error("[PROVISIONING] Error provisioning VM:", error)
  }
}
