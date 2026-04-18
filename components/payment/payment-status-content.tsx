"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, XCircle, Clock, ArrowRight, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

type PaymentStatus = "success" | "failed" | "pending" | "loading" | "error"

interface PaymentData {
  orderNumber: string
  amount: number
  status: string
  paymentMethod?: string
  invoiceNumber?: string
}

export function PaymentStatusContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order_id")
  const [status, setStatus] = useState<PaymentStatus>("loading")
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) {
      setStatus("error")
      setError("Order ID not found")
      return
    }

    async function checkStatus() {
      try {
        const response = await fetch(`/api/payments/status?order_id=${orderId}`)
        const data = await response.json()

        if (!response.ok) {
          setStatus("error")
          setError(data.error || "Failed to fetch payment status")
          return
        }

        setPaymentData(data)
        
        if (data.status === "completed" || data.status === "paid") {
          setStatus("success")
        } else if (data.status === "failed" || data.status === "payment_failed") {
          setStatus("failed")
        } else {
          setStatus("pending")
          // Poll for updates if still pending
          setTimeout(checkStatus, 3000)
        }
      } catch {
        setStatus("error")
        setError("Failed to connect to server")
      }
    }

    checkStatus()
  }, [orderId])

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="glass glass-strong rounded-2xl p-8">
          <Spinner className="mx-auto mb-4 h-12 w-12 text-accent" />
          <h1 className="text-xl font-semibold">Checking Payment Status</h1>
          <p className="mt-2 text-muted-foreground">Please wait while we verify your payment...</p>
        </div>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="glass glass-strong rounded-2xl p-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold">Error</h1>
          <p className="mt-2 text-muted-foreground">{error}</p>
          <Button asChild className="mt-6">
            <Link href="/configure">Try Again</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (status === "pending") {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="glass glass-strong rounded-2xl p-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/10">
            <Clock className="h-8 w-8 text-amber-400" />
          </div>
          <h1 className="text-xl font-semibold">Payment Pending</h1>
          <p className="mt-2 text-muted-foreground">
            Your payment is being processed. This page will update automatically.
          </p>
          {paymentData && (
            <div className="mt-6 rounded-lg bg-muted/20 p-4 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order</span>
                <span className="font-mono">{paymentData.orderNumber}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">₹{paymentData.amount.toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}
          <div className="mt-6">
            <Spinner className="mx-auto h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </div>
    )
  }

  if (status === "failed") {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="glass glass-strong rounded-2xl p-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold">Payment Failed</h1>
          <p className="mt-2 text-muted-foreground">
            Unfortunately, your payment could not be processed.
          </p>
          {paymentData && (
            <div className="mt-6 rounded-lg bg-muted/20 p-4 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order</span>
                <span className="font-mono">{paymentData.orderNumber}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">₹{paymentData.amount.toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href="/configure">
                Try Again
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/support">Contact Support</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="glass glass-strong rounded-2xl p-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/10">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </div>
        <h1 className="text-xl font-semibold">Payment Successful!</h1>
        <p className="mt-2 text-muted-foreground">
          Thank you for your purchase. Your VPS is being provisioned.
        </p>
        
        {paymentData && (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg bg-muted/20 p-4 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order</span>
                <span className="font-mono">{paymentData.orderNumber}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-semibold text-emerald-400">
                  ₹{paymentData.amount.toLocaleString("en-IN")}
                </span>
              </div>
              {paymentData.paymentMethod && (
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="capitalize">{paymentData.paymentMethod}</span>
                </div>
              )}
              {paymentData.invoiceNumber && (
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Invoice</span>
                  <span className="font-mono">{paymentData.invoiceNumber}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/dashboard">
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          {paymentData?.invoiceNumber && (
            <Button variant="outline" asChild>
              <Link href={`/invoice/${paymentData.invoiceNumber}`}>
                <Download className="mr-2 h-4 w-4" />
                Download Invoice
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
