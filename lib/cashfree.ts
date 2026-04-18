/**
 * Cashfree Payment Gateway Integration
 * 
 * Test Credentials (sandbox mode):
 * - App ID: Set via CASHFREE_APP_ID env var
 * - Secret Key: Set via CASHFREE_SECRET_KEY env var
 * 
 * Test Cards:
 * - Success: 4111 1111 1111 1111 (any expiry, any CVV)
 * - Failure: 4111 1111 1111 1234
 */

const CASHFREE_API_VERSION = "2023-08-01"
const SANDBOX_URL = "https://sandbox.cashfree.com/pg"
const PRODUCTION_URL = "https://api.cashfree.com/pg"

export type CashfreeMode = "test" | "production"

interface CashfreeConfig {
  appId: string
  secretKey: string
  mode: CashfreeMode
}

interface CreateOrderParams {
  orderId: string
  orderAmount: number
  orderCurrency?: string
  customerDetails: {
    customerId: string
    customerEmail: string
    customerPhone: string
    customerName?: string
  }
  orderMeta?: {
    returnUrl?: string
    notifyUrl?: string
    paymentMethods?: string
  }
  orderNote?: string
}

interface CashfreeOrderResponse {
  cfOrderId: string
  orderId: string
  entity: string
  orderCurrency: string
  orderAmount: number
  orderStatus: string
  paymentSessionId: string
  orderExpiryTime: string
  orderNote: string | null
  createdAt: string
  customerDetails: {
    customerId: string
    customerName: string | null
    customerEmail: string
    customerPhone: string
  }
  payments: {
    url: string
  }
}

interface PaymentStatus {
  orderId: string
  cfOrderId: string
  orderStatus: string
  orderAmount: number
  gatewayName: string | null
  paymentTime: string | null
  paymentMethod: string | null
  paymentStatus: string | null
  bankReference: string | null
}

function getConfig(): CashfreeConfig {
  const appId = process.env.CASHFREE_APP_ID
  const secretKey = process.env.CASHFREE_SECRET_KEY
  const mode = (process.env.CASHFREE_MODE || "test") as CashfreeMode

  if (!appId || !secretKey) {
    throw new Error("Cashfree credentials not configured. Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY environment variables.")
  }

  return { appId, secretKey, mode }
}

function getBaseUrl(mode: CashfreeMode): string {
  return mode === "production" ? PRODUCTION_URL : SANDBOX_URL
}

async function cashfreeRequest<T>(
  endpoint: string,
  method: "GET" | "POST",
  body?: Record<string, unknown>
): Promise<T> {
  const config = getConfig()
  const baseUrl = getBaseUrl(config.mode)

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-client-id": config.appId,
      "x-client-secret": config.secretKey,
      "x-api-version": CASHFREE_API_VERSION,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || `Cashfree API error: ${response.status}`)
  }

  return data as T
}

/**
 * Create a new payment order with Cashfree
 */
export async function createPaymentOrder(
  params: CreateOrderParams
): Promise<CashfreeOrderResponse> {
  const config = getConfig()
  
  const payload = {
    order_id: params.orderId,
    order_amount: params.orderAmount,
    order_currency: params.orderCurrency || "INR",
    customer_details: {
      customer_id: params.customerDetails.customerId,
      customer_email: params.customerDetails.customerEmail,
      customer_phone: params.customerDetails.customerPhone,
      customer_name: params.customerDetails.customerName || "",
    },
    order_meta: {
      return_url: params.orderMeta?.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/status?order_id={order_id}`,
      notify_url: params.orderMeta?.notifyUrl || `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
      payment_methods: params.orderMeta?.paymentMethods,
    },
    order_note: params.orderNote || "",
  }

  const response = await cashfreeRequest<{
    cf_order_id: string
    order_id: string
    entity: string
    order_currency: string
    order_amount: number
    order_status: string
    payment_session_id: string
    order_expiry_time: string
    order_note: string | null
    created_at: string
    customer_details: {
      customer_id: string
      customer_name: string | null
      customer_email: string
      customer_phone: string
    }
    payments: {
      url: string
    }
  }>("/orders", "POST", payload)

  return {
    cfOrderId: response.cf_order_id,
    orderId: response.order_id,
    entity: response.entity,
    orderCurrency: response.order_currency,
    orderAmount: response.order_amount,
    orderStatus: response.order_status,
    paymentSessionId: response.payment_session_id,
    orderExpiryTime: response.order_expiry_time,
    orderNote: response.order_note,
    createdAt: response.created_at,
    customerDetails: {
      customerId: response.customer_details.customer_id,
      customerName: response.customer_details.customer_name,
      customerEmail: response.customer_details.customer_email,
      customerPhone: response.customer_details.customer_phone,
    },
    payments: {
      url: response.payments.url,
    },
  }
}

/**
 * Get payment status for an order
 */
export async function getPaymentStatus(orderId: string): Promise<PaymentStatus> {
  const response = await cashfreeRequest<{
    order_id: string
    cf_order_id: string
    order_status: string
    order_amount: number
    gateway_name: string | null
    payment_time: string | null
    payment_method: string | null
    payment_status: string | null
    bank_reference: string | null
  }>(`/orders/${orderId}`, "GET")

  return {
    orderId: response.order_id,
    cfOrderId: response.cf_order_id,
    orderStatus: response.order_status,
    orderAmount: response.order_amount,
    gatewayName: response.gateway_name,
    paymentTime: response.payment_time,
    paymentMethod: response.payment_method,
    paymentStatus: response.payment_status,
    bankReference: response.bank_reference,
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  timestamp: string,
  signature: string
): boolean {
  const config = getConfig()
  const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET || config.secretKey

  // Compute expected signature
  const message = `${timestamp}${payload}`
  const crypto = require("crypto")
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(message)
    .digest("base64")

  return signature === expectedSignature
}

/**
 * Get Cashfree checkout SDK URL based on mode
 */
export function getCashfreeSdkUrl(): string {
  const config = getConfig()
  return config.mode === "production"
    ? "https://sdk.cashfree.com/js/v3/cashfree.js"
    : "https://sdk.cashfree.com/js/v3/cashfree-sandbox.js"
}
