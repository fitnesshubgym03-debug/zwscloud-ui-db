/**
 * Razorpay Payment Gateway Integration with Mandate Support
 *
 * Documentation: https://razorpay.com/docs/api/
 * Mandates: https://razorpay.com/docs/payments/mandates/
 *
 * Test Credentials (sandbox mode):
 * - Key ID: Set via RAZORPAY_KEY_ID env var
 * - Key Secret: Set via RAZORPAY_KEY_SECRET env var
 *
 * Test Cards:
 * - Success (4111 1111 1111 1111): Any future expiry, any CVV
 * - Failure (4111 1111 1111 1234): Declined
 */

import crypto from "crypto"

type RazorpayMode = "test" | "live"

interface RazorpayConfig {
  keyId: string
  keySecret: string
  mode: RazorpayMode
}

interface CreateOrderParams {
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

interface CreateMandateParams {
  customerId: string
  customerEmail: string
  customerPhone: string
  customerName?: string
  maxAmount: number
  amount: number
  currency?: string
  method: "emandate" | "nach" | "netbanking" | "card"
  interval: "monthly" | "quarterly" | "halfyearly" | "yearly"
  period: "daily" | "weekly" | "monthly" | "quarterly" | "halfyearly" | "yearly"
  startAt: number
  endAt?: number
  description?: string
  returnUrl?: string
  notifyUrl?: string
}

interface RazorpayOrderResponse {
  id: string
  entity: string
  amount: number
  amount_paid: number
  amount_due: number
  currency: string
  receipt: string
  status: string
  attempts: number
  notes: Record<string, unknown>
  created_at: number
  offer_id?: string
}

interface RazorpayMandateResponse {
  id: string
  entity: string
  interval: string
  period: string
  status: string
  description: string
  max_amount: number
  amount: number
  currency: string
  method: string
  customer_id: number
  token_id?: string
  short_url?: string
  expire_by?: number
  created_at: number
  notes: Record<string, unknown>
}

interface RazorpayPaymentResponse {
  id: string
  entity: string
  amount: number
  currency: string
  status: string
  method: string
  order_id?: string
  customer_id?: string
  token_id?: string
  mandate_id?: string
  description: string
  captured: boolean
  email: string
  contact: string
  card_id?: string
  bank?: string
  wallet?: string
  vpa?: string
  notes: Record<string, unknown>
  created_at: number
}

interface RecurringPaymentParams {
  mandateId: string
  customerId: string
  amount: number
  currency?: string
  description?: string
  email: string
  contact: string
}

function getConfig(): RazorpayConfig {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  const mode = (process.env.RAZORPAY_MODE || "test") as RazorpayMode

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables."
    )
  }

  return { keyId, keySecret, mode }
}

function getApiUrl(): string {
  return "https://api.razorpay.com/v1"
}

function getAuthHeader(config: RazorpayConfig): string {
  const credentials = `${config.keyId}:${config.keySecret}`
  return "Basic " + Buffer.from(credentials).toString("base64")
}

async function razorpayRequest<T>(
  endpoint: string,
  method: "GET" | "POST" | "PATCH",
  body?: Record<string, unknown>
): Promise<T> {
  const config = getConfig()
  const apiUrl = getApiUrl()

  const response = await fetch(`${apiUrl}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(config),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json()

  if (!response.ok) {
    const error = data.error || data
    throw new Error(
      error.description || error.message || `Razorpay API error: ${response.status}`
    )
  }

  return data as T
}

/**
 * Create a new payment order with Razorpay
 */
export async function createOrder(
  params: CreateOrderParams
): Promise<RazorpayOrderResponse> {
  const payload: Record<string, unknown> = {
    amount: Math.round(params.amount * 100), // Convert to paise
    currency: params.currency || "INR",
    receipt: params.orderId,
    customer_id: params.customerId,
    description: params.description || "VPS Order",
    notes: {
      customer_email: params.customerEmail,
      customer_name: params.customerName || "",
    },
  }

  return razorpayRequest<RazorpayOrderResponse>("/orders", "POST", payload)
}

/**
 * Get order details
 */
export async function getOrder(orderId: string): Promise<RazorpayOrderResponse> {
  return razorpayRequest<RazorpayOrderResponse>(`/orders/${orderId}`, "GET")
}

/**
 * Create an e-mandate for recurring payments
 */
export async function createMandate(
  params: CreateMandateParams
): Promise<RazorpayMandateResponse> {
  const payload: Record<string, unknown> = {
    customer_id: params.customerId,
    type: "emandate",
    amount: Math.round(params.amount * 100), // Convert to paise
    max_amount: Math.round(params.maxAmount * 100), // Convert to paise
    currency: params.currency || "INR",
    method: params.method,
    interval: params.interval,
    period: params.period,
    start_at: params.startAt,
    description: params.description || "Recurring VPS Subscription",
    notify_soft: 1,
    short_url: params.returnUrl,
    notes: {
      customer_email: params.customerEmail,
      customer_name: params.customerName || "",
    },
  }

  if (params.endAt) {
    payload.end_at = params.endAt
  }

  return razorpayRequest<RazorpayMandateResponse>("/emandate", "POST", payload)
}

/**
 * Get mandate details
 */
export async function getMandate(
  mandateId: string
): Promise<RazorpayMandateResponse> {
  return razorpayRequest<RazorpayMandateResponse>(
    `/emandate/${mandateId}`,
    "GET"
  )
}

/**
 * Create a recurring payment using mandate
 */
export async function createRecurringPayment(
  params: RecurringPaymentParams
): Promise<RazorpayPaymentResponse> {
  const payload: Record<string, unknown> = {
    customer_id: params.customerId,
    token: params.mandateId,
    amount: Math.round(params.amount * 100), // Convert to paise
    currency: params.currency || "INR",
    recurring: "1",
    method: "emandate",
    email: params.email,
    contact: params.contact,
    description: params.description || "Recurring VPS Payment",
    notes: {
      recurring: "true",
      mandate_id: params.mandateId,
    },
  }

  return razorpayRequest<RazorpayPaymentResponse>("/payments/create/recurring", "POST", payload)
}

/**
 * Get payment details
 */
export async function getPayment(
  paymentId: string
): Promise<RazorpayPaymentResponse> {
  return razorpayRequest<RazorpayPaymentResponse>(`/payments/${paymentId}`, "GET")
}

/**
 * Verify payment signature
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const config = getConfig()
  const message = `${orderId}|${paymentId}`
  const expectedSignature = crypto
    .createHmac("sha256", config.keySecret)
    .update(message)
    .digest("hex")

  return signature === expectedSignature
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const config = getConfig()
  const expectedSignature = crypto
    .createHmac("sha256", config.keySecret)
    .update(payload)
    .digest("hex")

  return signature === expectedSignature
}

/**
 * Cancel a mandate
 */
export async function cancelMandate(mandateId: string): Promise<void> {
  await razorpayRequest(`/emandate/${mandateId}/cancel`, "POST", {})
}

/**
 * Create a customer
 */
export async function createCustomer(
  email: string,
  name: string,
  contact: string
): Promise<{ id: number }> {
  return razorpayRequest<{ id: number }>("/customers", "POST", {
    email,
    name,
    contact,
  })
}

/**
 * Get Razorpay checkout script URL
 */
export function getCheckoutScriptUrl(): string {
  return "https://checkout.razorpay.com/v1/checkout.js"
}

/**
 * Generate mandate URL for hosted mandate creation
 */
export async function generateMandateUrl(
  params: CreateMandateParams
): Promise<string> {
  const mandate = await createMandate(params)
  return mandate.short_url || ""
}
