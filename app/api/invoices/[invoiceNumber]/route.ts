import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceNumber: string }> }
) {
  try {
    const { invoiceNumber } = await params

    // Get invoice
    const invoices = await sql`
      SELECT * FROM invoices WHERE invoice_number = ${invoiceNumber}
    `

    if (invoices.length === 0) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    const invoice = invoices[0] as {
      id: string
      invoice_number: string
      order_id: string | null
      customer_id: string
      issue_date: string
      due_date: string
      subtotal: string
      tax_rate: string
      tax_amount: string
      total_amount: string
      currency: string
      status: string
      line_items: unknown[]
      billing_address: unknown | null
      notes: string | null
      paid_at: string | null
    }

    // Get customer
    const customers = await sql`
      SELECT id, email, name, phone FROM customers WHERE id = ${invoice.customer_id}
    `
    const customer = customers[0] as { id: string; email: string; name: string | null; phone: string | null } | undefined

    // Get order with product/custom config if exists
    let order = null
    if (invoice.order_id) {
      const orders = await sql`SELECT * FROM orders WHERE id = ${invoice.order_id}`
      if (orders.length > 0) {
        const orderData = orders[0] as { id: string; product_id: string | null; custom_config_id: string | null }
        order = orderData

        // Get product if exists
        if (orderData.product_id) {
          const products = await sql`SELECT * FROM products WHERE id = ${orderData.product_id}`
          if (products.length > 0) {
            (order as any).product = products[0]
          }
        }

        // Get custom config if exists
        if (orderData.custom_config_id) {
          const configs = await sql`SELECT * FROM custom_configs WHERE id = ${orderData.custom_config_id}`
          if (configs.length > 0) {
            (order as any).customConfig = configs[0]
          }
        }
      }
    }

    return NextResponse.json({
      ...invoice,
      customer,
      order,
    })
  } catch (error) {
    console.error('Invoice API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}
