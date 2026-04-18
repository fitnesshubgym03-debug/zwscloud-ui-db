import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Fetch all stats in parallel
    const [customersCount, ordersCount, completedPayments, recentOrders, recentPayments, analyticsEvents] =
      await Promise.all([
        prisma.customer.count(),
        prisma.order.count(),
        prisma.payment.count({ where: { status: 'completed' } }),
        prisma.order.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        prisma.payment.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        prisma.analyticsEvent.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ])

    // Calculate revenue from completed payments
    const completedPaymentRecords = await prisma.payment.findMany({
      where: { status: 'completed' },
      select: { amount: true },
    })

    const totalRevenue = completedPaymentRecords.reduce((sum, p) => sum + Number(p.amount), 0)

    return NextResponse.json({
      stats: {
        customers: customersCount,
        orders: ordersCount,
        payments: completedPayments,
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
