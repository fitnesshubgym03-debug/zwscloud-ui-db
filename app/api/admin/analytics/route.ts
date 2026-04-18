import { NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

export async function GET() {
  try {
    // Get date ranges
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Fetch analytics data in parallel
    const [
      totalEventsResult,
      todayEventsResult,
      weekEventsResult,
      recentEvents,
      pageViews,
      eventsByType
    ] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM analytics_events`,
      sql`SELECT COUNT(*) as count FROM analytics_events WHERE created_at >= ${today.toISOString()}`,
      sql`SELECT COUNT(*) as count FROM analytics_events WHERE created_at >= ${weekAgo.toISOString()}`,
      sql`SELECT * FROM analytics_events ORDER BY created_at DESC LIMIT 50`,
      sql`SELECT page_path, created_at FROM analytics_events WHERE event_type = 'page_view' AND created_at >= ${monthAgo.toISOString()} ORDER BY created_at DESC`,
      sql`SELECT event_type, event_name FROM analytics_events WHERE created_at >= ${monthAgo.toISOString()}`,
    ])

    // Calculate top pages
    const pageViewCounts: Record<string, number> = {}
    pageViews.forEach((pv: { page_path: string | null }) => {
      if (pv.page_path) {
        pageViewCounts[pv.page_path] = (pageViewCounts[pv.page_path] || 0) + 1
      }
    })
    const topPages = Object.entries(pageViewCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }))

    // Calculate event type distribution
    const eventTypeCounts: Record<string, number> = {}
    eventsByType.forEach((e: { event_type: string }) => {
      eventTypeCounts[e.event_type] = (eventTypeCounts[e.event_type] || 0) + 1
    })
    const eventDistribution = Object.entries(eventTypeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({
      stats: {
        total: Number(totalEventsResult[0]?.count || 0),
        today: Number(todayEventsResult[0]?.count || 0),
        week: Number(weekEventsResult[0]?.count || 0),
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
