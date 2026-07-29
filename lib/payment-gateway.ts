/**
 * Payment Gateway Factory
 * Supports multiple payment gateways: Cashfree, Razorpay
 */

import * as cashfree from "./cashfree"
import * as razorpay from "./razorpay"

export type PaymentGateway = "cashfree" | "razorpay"

export interface PaymentOrder {
  orderId: string
  amount: number
  currency?: string
  customerId: string
  customerEmail: string
  customerPhone: string
  customerName?: string
  description?: string
  returnUrl?: string
  notifyUrl?: string
}

export interface PaymentOrderResponse {
  id: string
  status: string
  paymentUrl?: string
  sessionId?: string
  amount: number
  currency: string
}

export interface MandateParams {
  customerId: string
  customerEmail: string
  customerPhone: string
  customerName?: string
  maxAmount: number
  amount: number
  currency?: string
  interval: "monthly" | "quarterly" | "halfyearly" | "yearly"
  description?: string
  returnUrl?: string
  notifyUrl?: string
}

export interface MandateResponse {
  id: string
  status: string
  amount: number
  currency: string
  url?: string
}

export interface RecurringPaymentParams {
  mandateId: string
  customerId: string
  amount: number
  currency?: string
  description?: string
  email: string
  contact: string
}

export interface RecurringPaymentResponse {
  id: string
  status: string
  amount: number
}

export interface SignatureVerification {
  orderId: string
  paymentId: string
  signature: string
}

export interface WebhookSignatureVerification {
  payload: string
  signature: string
}

/**
 * Get default payment gateway
 */
export function getDefaultGateway(): PaymentGateway {
  return (process.env.DEFAULT_PAYMENT_GATEWAY as PaymentGateway) || "razorpay"
}

/**
 * Create payment order with selected gateway
 */
export async function createPaymentOrder(
  params: PaymentOrder,
  gateway?: PaymentGateway
): Promise<PaymentOrderResponse> {
  const selectedGateway = gateway || getDefaultGateway()

  switch (selectedGateway) {
    case "cashfree": {
      const response = await cashfree.createPaymentOrder({
        orderId: params.orderId,
        orderAmount: params.amount,
        orderCurrency: params.currency,
        customerDetails: {
          customerId: params.customerId,
          customerEmail: params.customerEmail,
          customerPhone: params.customerPhone,
          customerName: params.customerName,
        },
        orderMeta: {
          returnUrl: params.returnUrl,
          notifyUrl: params.notifyUrl,
        },
        orderNote: params.description,
      })

      return {
        id: response.cfOrderId,
        status: response.orderStatus,
        paymentUrl: response.payments.url,
        sessionId: response.paymentSessionId,
        amount: Number(response.orderAmount),
        currency: response.orderCurrency,
      }
    }

    case "razorpay": {
      const response = await razorpay.createOrder({
        orderId: params.orderId,
        amount: params.amount,
        currency: params.currency,
        customerId: params.customerId,
        customerEmail: params.customerEmail,
        customerPhone: params.customerPhone,
        customerName: params.customerName,
        description: params.description,
      })

      return {
        id: response.id,
        status: response.status,
        amount: Number(response.amount) / 100, // Convert from paise
        currency: response.currency,
      }
    }

    default:
      throw new Error(`Unsupported payment gateway: ${selectedGateway}`)
  }
}

/**
 * Create mandate for recurring payments
 */
export async function createMandate(
  params: MandateParams,
  gateway?: PaymentGateway
): Promise<MandateResponse> {
  const selectedGateway = gateway || getDefaultGateway()

  switch (selectedGateway) {
    case "cashfree": {
      // Cashfree doesn't have direct mandate support like Razorpay
      // For now, we'll create a payment order
      const response = await cashfree.createPaymentOrder({
        orderId: `mandate-${params.customerId}-${Date.now()}`,
        orderAmount: params.amount,
        orderCurrency: params.currency,
        customerDetails: {
          customerId: params.customerId,
          customerEmail: params.customerEmail,
          customerPhone: params.customerPhone,
          customerName: params.customerName,
        },
        orderMeta: {
          returnUrl: params.returnUrl,
          notifyUrl: params.notifyUrl,
        },
        orderNote: params.description,
      })

      return {
        id: response.cfOrderId,
        status: response.orderStatus,
        amount: Number(response.orderAmount),
        currency: response.orderCurrency,
        url: response.payments.url,
      }
    }

    case "razorpay": {
      const today = Math.floor(Date.now() / 1000)
      const startAt = today + 60 // Start after 1 minute
      const endAt = startAt + 365 * 24 * 60 * 60 // 1 year mandate

      const response = await razorpay.createMandate({
        customerId: params.customerId,
        customerEmail: params.customerEmail,
        customerPhone: params.customerPhone,
        customerName: params.customerName,
        maxAmount: params.maxAmount,
        amount: params.amount,
        currency: params.currency,
        method: "emandate",
        interval: params.interval,
        period: params.interval,
        startAt,
        endAt,
        description: params.description,
        returnUrl: params.returnUrl,
        notifyUrl: params.notifyUrl,
      })

      return {
        id: response.id,
        status: response.status,
        amount: Number(response.amount) / 100, // Convert from paise
        currency: response.currency,
        url: response.short_url,
      }
    }

    default:
      throw new Error(`Unsupported payment gateway: ${selectedGateway}`)
  }
}

/**
 * Create recurring payment using mandate
 */
export async function createRecurringPayment(
  params: RecurringPaymentParams,
  gateway?: PaymentGateway
): Promise<RecurringPaymentResponse> {
  const selectedGateway = gateway || getDefaultGateway()

  switch (selectedGateway) {
    case "cashfree": {
      // For Cashfree, create a new payment order
      const response = await cashfree.createPaymentOrder({
        orderId: `recurring-${params.customerId}-${Date.now()}`,
        orderAmount: params.amount,
        orderCurrency: params.currency,
        customerDetails: {
          customerId: params.customerId,
          customerEmail: params.email,
          customerPhone: params.contact,
        },
        orderNote: params.description,
      })

      return {
        id: response.cfOrderId,
        status: response.orderStatus,
        amount: Number(response.orderAmount),
      }
    }

    case "razorpay": {
      const response = await razorpay.createRecurringPayment({
        mandateId: params.mandateId,
        customerId: params.customerId,
        amount: params.amount,
        currency: params.currency,
        description: params.description,
        email: params.email,
        contact: params.contact,
      })

      return {
        id: response.id,
        status: response.status,
        amount: Number(response.amount) / 100, // Convert from paise
      }
    }

    default:
      throw new Error(`Unsupported payment gateway: ${selectedGateway}`)
  }
}

/**
 * Verify payment signature
 */
export function verifyPaymentSignature(
  verification: SignatureVerification,
  gateway?: PaymentGateway
): boolean {
  const selectedGateway = gateway || getDefaultGateway()

  switch (selectedGateway) {
    case "cashfree": {
      // Cashfree uses webhook payload verification
      return true // Should be verified with webhook
    }

    case "razorpay": {
      return razorpay.verifyPaymentSignature(
        verification.orderId,
        verification.paymentId,
        verification.signature
      )
    }

    default:
      throw new Error(`Unsupported payment gateway: ${selectedGateway}`)
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  verification: WebhookSignatureVerification,
  gateway?: PaymentGateway
): boolean {
  const selectedGateway = gateway || getDefaultGateway()

  switch (selectedGateway) {
    case "cashfree": {
      // For Cashfree, implement based on their webhook format
      return true // Placeholder
    }

    case "razorpay": {
      return razorpay.verifyWebhookSignature(
        verification.payload,
        verification.signature
      )
    }

    default:
      throw new Error(`Unsupported payment gateway: ${selectedGateway}`)
  }
}

/**
 * Get checkout script URL
 */
export function getCheckoutScriptUrl(gateway?: PaymentGateway): string {
  const selectedGateway = gateway || getDefaultGateway()

  switch (selectedGateway) {
    case "cashfree":
      return cashfree.getCashfreeSdkUrl()
    case "razorpay":
      return razorpay.getCheckoutScriptUrl()
    default:
      throw new Error(`Unsupported payment gateway: ${selectedGateway}`)
  }
}
