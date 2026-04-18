"use client"

import { useRef } from "react"
import { Download, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { SiteShell } from "@/components/layout/site-shell"

interface LineItem {
  description: string
  quantity: number
  unit_price: number
  term_months: number
  total: number
}

interface Invoice {
  id: string
  invoice_number: string
  issue_date: string
  due_date: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  currency: string
  status: string
  line_items: LineItem[]
  notes: string | null
  paid_at: string | null
  customers: {
    id: string
    email: string
    name: string | null
    phone: string | null
    company: string | null
    address: Record<string, string> | null
  }
  orders: {
    order_number: string
    term_months: number
    products: {
      name: string
      description: string
      cpu_cores: number
      ram_gb: number
      storage_gb: number
      storage_type: string
    } | null
    custom_configs: {
      cpu_cores: number
      ram_gb: number
      storage_gb: number
      storage_type: string
    } | null
  }
}

// Company details
const COMPANY = {
  name: "ZWS Cloud",
  legalName: "ZWS Cloud Services Pvt. Ltd.",
  address: "123 Tech Park, Bangalore, Karnataka 560001",
  gstin: "29XXXXX1234X1ZX",
  email: "billing@zws.cloud",
  phone: "+91 80 1234 5678",
  website: "https://zws.cloud",
}

export function InvoiceView({ invoice }: { invoice: Invoice }) {
  const invoiceRef = useRef<HTMLDivElement>(null)

  function handlePrint() {
    window.print()
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  function formatCurrency(amount: number) {
    return `₹${Number(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  const statusColors: Record<string, string> = {
    paid: "bg-emerald-400/10 text-emerald-400",
    draft: "bg-muted/30 text-muted-foreground",
    sent: "bg-blue-400/10 text-blue-400",
    overdue: "bg-red-400/10 text-red-400",
  }

  return (
    <SiteShell>
      <Container className="py-12">
        {/* Actions bar - hidden in print */}
        <div className="mb-6 flex items-center justify-between print:hidden">
          <h1 className="text-2xl font-semibold">Invoice {invoice.invoice_number}</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button onClick={handlePrint}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Invoice document */}
        <div
          ref={invoiceRef}
          className="glass rounded-2xl p-8 print:bg-white print:rounded-none print:shadow-none"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-accent">{COMPANY.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{COMPANY.legalName}</p>
              <p className="mt-2 text-sm text-muted-foreground">{COMPANY.address}</p>
              <p className="text-sm text-muted-foreground">GSTIN: {COMPANY.gstin}</p>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold tracking-tight">INVOICE</h1>
              <p className="mt-2 font-mono text-lg">{invoice.invoice_number}</p>
              <span
                className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium uppercase ${
                  statusColors[invoice.status] || statusColors.draft
                }`}
              >
                {invoice.status}
              </span>
            </div>
          </div>

          {/* Dates and customer info */}
          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Bill To
              </h3>
              <div className="mt-2">
                <p className="font-medium">{invoice.customers.name || "Customer"}</p>
                {invoice.customers.company && (
                  <p className="text-sm text-muted-foreground">{invoice.customers.company}</p>
                )}
                <p className="text-sm text-muted-foreground">{invoice.customers.email}</p>
                {invoice.customers.phone && (
                  <p className="text-sm text-muted-foreground">{invoice.customers.phone}</p>
                )}
              </div>
            </div>
            <div className="sm:text-right">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between sm:justify-end sm:gap-8">
                  <span className="text-muted-foreground">Invoice Date:</span>
                  <span className="font-medium">{formatDate(invoice.issue_date)}</span>
                </div>
                <div className="flex justify-between sm:justify-end sm:gap-8">
                  <span className="text-muted-foreground">Due Date:</span>
                  <span className="font-medium">{formatDate(invoice.due_date)}</span>
                </div>
                <div className="flex justify-between sm:justify-end sm:gap-8">
                  <span className="text-muted-foreground">Order:</span>
                  <span className="font-mono">{invoice.orders.order_number}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Line items table */}
          <div className="mt-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="pb-3 text-left font-medium text-muted-foreground">Description</th>
                  <th className="pb-3 text-center font-medium text-muted-foreground">Term</th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">Unit Price</th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.line_items.map((item, index) => (
                  <tr key={index} className="border-b border-border/20">
                    <td className="py-4">
                      <p className="font-medium">{item.description}</p>
                      {invoice.orders.products && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {invoice.orders.products.cpu_cores} vCPU · {invoice.orders.products.ram_gb}GB RAM · {invoice.orders.products.storage_gb}GB {invoice.orders.products.storage_type.toUpperCase()}
                        </p>
                      )}
                      {invoice.orders.custom_configs && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {invoice.orders.custom_configs.cpu_cores} vCPU · {invoice.orders.custom_configs.ram_gb}GB RAM · {invoice.orders.custom_configs.storage_gb}GB {invoice.orders.custom_configs.storage_type.toUpperCase()}
                        </p>
                      )}
                    </td>
                    <td className="py-4 text-center">
                      {item.term_months} {item.term_months === 1 ? "month" : "months"}
                    </td>
                    <td className="py-4 text-right font-mono">
                      {formatCurrency(item.unit_price)}/mo
                    </td>
                    <td className="py-4 text-right font-mono font-medium">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST ({invoice.tax_rate}%)</span>
                <span className="font-mono">{formatCurrency(invoice.tax_amount)}</span>
              </div>
              {Number(invoice.discount_amount) > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount</span>
                  <span className="font-mono">-{formatCurrency(invoice.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border/40 pt-2 text-lg font-semibold">
                <span>Total</span>
                <span className="font-mono">{formatCurrency(invoice.total_amount)}</span>
              </div>
              {invoice.paid_at && (
                <div className="flex justify-between text-emerald-400">
                  <span>Paid on</span>
                  <span>{formatDate(invoice.paid_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-8 rounded-lg bg-muted/20 p-4">
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Notes
              </h4>
              <p className="mt-2 text-sm">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 border-t border-border/40 pt-6 text-center text-xs text-muted-foreground">
            <p>Thank you for your business!</p>
            <p className="mt-2">
              Questions? Contact us at {COMPANY.email} or {COMPANY.phone}
            </p>
            <p className="mt-1">{COMPANY.website}</p>
          </div>
        </div>
      </Container>
    </SiteShell>
  )
}
