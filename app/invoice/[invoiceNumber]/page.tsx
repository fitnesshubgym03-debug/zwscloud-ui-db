import { Metadata } from "next"
import { notFound } from "next/navigation"
import { InvoiceView } from "@/components/invoice/invoice-view"

type Props = {
  params: Promise<{ invoiceNumber: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: "Invoice | ZWS Cloud",
    description: "View your invoice",
  }
}

export default async function InvoicePage({ params }: Props) {
  const { invoiceNumber } = await params

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/invoices/${invoiceNumber}`,
      { cache: 'no-store' }
    )

    if (!response.ok) {
      notFound()
    }

    const invoice = await response.json()
    return <InvoiceView invoice={invoice} />
  } catch (error) {
    console.error('Error fetching invoice:', error)
    notFound()
  }
}
