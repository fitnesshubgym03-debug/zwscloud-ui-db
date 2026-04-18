'use client'

import { useEffect, useState } from 'react'
import { AnalyticsOverview } from "@/components/admin/analytics-overview"

interface AnalyticsData {
  stats: {
    total: number
    today: number
    week: number
  }
  recentEvents: any[]
  topPages: Array<{ path: string; count: number }>
  eventDistribution: Array<{ type: string; count: number }>
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnalyticsData() {
      try {
        const response = await fetch('/api/admin/analytics')
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data')
        }
        const analyticsData = await response.json()
        setData(analyticsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (error || !data) {
    return <div className="p-8 text-red-500">Error: {error || 'Failed to load analytics'}</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Analytics</h1>
        <p className="mt-1 text-muted-foreground">
          Track user interactions and site performance.
        </p>
      </div>

      <AnalyticsOverview data={data} />
    </div>
  )
}
