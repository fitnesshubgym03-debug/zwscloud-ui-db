import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Get date ranges
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Fetch analytics data
    const [totalEvents, todayEvents, weekEvents, recentEvents, pageViews, eventsByType] = await Promise.all([
      prisma.analyticsEvent.count(),
      prisma.analyticsEvent.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.analyticsEvent.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      prisma.analyticsEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.analyticsEvent.findMany({
        where: {
          eventType: 'page_view',
          createdAt: { gte: monthAgo },
        },
        select: { pagePath: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.analyticsEvent.findMany({
        where: {
          createdAt: { gte: monthAgo },
        },
        select: { eventType: true, eventName: true },
      }),
    ])

    // Calculate top pages
    const pageViewCounts: Record<string, number> = {}
    pageViews.forEach((pv) => {
      if (pv.pagePath) {
        pageViewCounts[pv.pagePath] = (pageViewCounts[pv.pagePath] || 0) + 1
      }
    })
    const topPages = Object.entries(pageViewCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }))

    // Calculate event type distribution
    const eventTypeCounts: Record<string, number> = {}
    eventsByType.forEach((e) => {
      eventTypeCounts[e.eventType] = (eventTypeCounts[e.eventType] || 0) + 1
    })
    const eventDistribution = Object.entries(eventTypeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({
      stats: {
        total: totalEvents,
        today: todayEvents,
        week: weekEvents,
      },
      recentEvents,
      topPages,
      eventDistribution,
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}
