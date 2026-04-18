'use client'

import { useEffect, useState } from 'react'
import { AdminDashboardStats } from "@/components/admin/admin-dashboard-stats"
import { AdminRecentActivity } from "@/components/admin/admin-recent-activity"
import { AdminQuickActions } from "@/components/admin/admin-quick-actions"

interface DashboardData {
  stats: {
    customers: number
    orders: number
    payments: number
    revenue: number
  }
  recentOrders: any[]
  recentPayments: any[]
  analyticsEvents: any[]
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch('/api/admin/dashboard')
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data')
        }
        const dashboardData = await response.json()
        setData(dashboardData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (error || !data) {
    return <div className="p-8 text-red-500">Error: {error || 'Failed to load dashboard'}</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back. Here&apos;s an overview of your ZWS Cloud business.
        </p>
      </div>

      <AdminDashboardStats stats={data.stats} />

      <div className="grid gap-8 lg:grid-cols-2">
        <AdminRecentActivity 
          orders={data.recentOrders} 
          payments={data.recentPayments}
          events={data.analyticsEvents}
        />
        <AdminQuickActions />
      </div>
    </div>
  )
}
