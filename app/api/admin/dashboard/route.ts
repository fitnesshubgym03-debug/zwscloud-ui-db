import { NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

export async function GET() {
  try {
    // Fetch all stats in parallel
    const [
      customersResult,
      ordersResult,
      completedPaymentsResult,
      recentOrders,
      recentPayments,
      analyticsEvents,
      completedPaymentRecords
    ] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM customers`,
      sql`SELECT COUNT(*) as count FROM orders`,
      sql`SELECT COUNT(*) as count FROM payments WHERE status = 'completed'`,
      sql`SELECT * FROM orders ORDER BY created_at DESC LIMIT 5`,
      sql`SELECT * FROM payments ORDER BY created_at DESC LIMIT 5`,
      sql`SELECT * FROM analytics_events ORDER BY created_at DESC LIMIT 10`,
      sql`SELECT amount FROM payments WHERE status = 'completed'`,
    ])

    const totalRevenue = completedPaymentRecords.reduce(
      (sum: number, p: { amount: string }) => sum + Number(p.amount),
      0
    )

    return NextResponse.json({
      stats: {
        customers: Number(customersResult[0]?.count || 0),
        orders: Number(ordersResult[0]?.count || 0),
        payments: Number(completedPaymentsResult[0]?.count || 0),
        revenue: totalRevenue,
      },
      recentOrders,
      recentPayments,
      analyticsEvents,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
