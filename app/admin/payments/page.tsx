'use client'

import { useEffect, useState } from 'react'
import { CreditCard, IndianRupee, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Payment {
  id: string
  order_number: string | null
  customer_email: string
  gateway: string
  gateway_payment_id: string | null
  amount: number
  currency: string
  status: string
  payment_method: string | null
  created_at: string
  completed_at: string | null
}

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  completed: { color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle2 },
  pending: { color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Clock },
  failed: { color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle },
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPayments() {
      try {
        const response = await fetch('/api/admin/payments')
        if (response.ok) {
          const data = await response.json()
          setPayments(data.payments || [])
        }
      } catch (err) {
        console.error('Failed to fetch payments:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPayments()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Payments</h1>
          <p className="mt-1 text-muted-foreground">
            Track payment transactions and status.
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {payments.length} transactions
        </Badge>
      </div>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No payments yet</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Payment transactions will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {payments.map((payment) => {
            const config = statusConfig[payment.status] || statusConfig.pending
            const StatusIcon = config.icon

            return (
              <Card key={payment.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <IndianRupee className="h-4 w-4" />
                        {Number(payment.amount).toLocaleString()}
                        <span className="text-sm font-normal text-muted-foreground">
                          {payment.currency}
                        </span>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {payment.customer_email}
                      </p>
                    </div>
                    <Badge className={config.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {payment.order_number && (
                      <div>Order: <span className="font-mono">{payment.order_number}</span></div>
                    )}
                    <div>Gateway: {payment.gateway}</div>
                    {payment.payment_method && (
                      <div>Method: {payment.payment_method}</div>
                    )}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(payment.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
