'use client'

import { useEffect, useState } from 'react'
import { Server, Calendar, IndianRupee } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Order {
  id: string
  order_number: string
  customer_email: string
  customer_name: string | null
  product_name: string | null
  term_months: number
  total_amount: number
  status: string
  created_at: string
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  confirmed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  completed: 'bg-green-500/10 text-green-500 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch('/api/admin/orders')
        if (response.ok) {
          const data = await response.json()
          setOrders(data.orders || [])
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
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
          <h1 className="text-3xl font-semibold">Orders</h1>
          <p className="mt-1 text-muted-foreground">
            View and manage customer orders.
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {orders.length} orders
        </Badge>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Server className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No orders yet</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Orders will appear here when customers make purchases.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-mono">
                      {order.order_number}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {order.customer_name || order.customer_email}
                    </p>
                  </div>
                  <Badge className={statusColors[order.status] || ''}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm">
                  {order.product_name && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Server className="h-3.5 w-3.5" />
                      {order.product_name}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {order.term_months} month{order.term_months > 1 ? 's' : ''}
                  </div>
                  <div className="flex items-center gap-1 font-medium">
                    <IndianRupee className="h-3.5 w-3.5" />
                    {Number(order.total_amount).toLocaleString()}
                  </div>
                  <div className="text-muted-foreground ml-auto">
                    {new Date(order.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
