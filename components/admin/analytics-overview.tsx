"use client"

import { Activity, Eye, Calendar, Clock, MousePointerClick } from "lucide-react"

interface AnalyticsEvent {
  id: string
  event_type: string
  event_name: string
  page_path: string | null
  created_at: string
  properties: Record<string, unknown>
}

interface AnalyticsData {
  stats: {
    total: number
    today: number
    week: number
  }
  recentEvents: AnalyticsEvent[]
  topPages: Array<{ path: string; count: number }>
  eventDistribution: Array<{ type: string; count: number }>
}

export function AnalyticsOverview({ data }: { data: AnalyticsData }) {
  function formatTime(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function getEventTypeColor(type: string) {
    switch (type) {
      case "page_view":
        return "text-blue-400 bg-blue-400/10"
      case "interaction":
        return "text-emerald-400 bg-emerald-400/10"
      case "auth":
        return "text-amber-400 bg-amber-400/10"
      case "payment":
        return "text-accent bg-accent/10"
      default:
        return "text-muted-foreground bg-muted/30"
    }
  }

  const statItems = [
    {
      label: "Total Events",
      value: data.stats.total.toLocaleString(),
      icon: Activity,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Today",
      value: data.stats.today.toLocaleString(),
      icon: Calendar,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
    },
    {
      label: "This Week",
      value: data.stats.week.toLocaleString(),
      icon: Clock,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statItems.map((item) => (
          <div
            key={item.label}
            className="glass rounded-xl p-5 transition-all hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <div className={`rounded-lg p-2 ${item.bgColor}`}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-semibold tabular-nums">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Top Pages */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold">Top Pages</h2>
          </div>
          <div className="space-y-2">
            {data.topPages.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No page views recorded yet
              </p>
            ) : (
              data.topPages.map((page, index) => (
                <div
                  key={page.path}
                  className="flex items-center justify-between rounded-lg bg-muted/20 p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted/30 text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="font-mono text-sm truncate max-w-[200px]">
                      {page.path}
                    </span>
                  </div>
                  <span className="text-sm font-medium tabular-nums">
                    {page.count.toLocaleString()} views
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Event Distribution */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <MousePointerClick className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold">Event Types</h2>
          </div>
          <div className="space-y-3">
            {data.eventDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No events recorded yet
              </p>
            ) : (
              data.eventDistribution.map((item) => {
                const total = data.eventDistribution.reduce((sum, e) => sum + e.count, 0)
                const percentage = total > 0 ? (item.count / total) * 100 : 0

                return (
                  <div key={item.type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm capitalize">{item.type.replace(/_/g, " ")}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.count.toLocaleString()} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted/20">
                      <div
                        className="h-full rounded-full bg-accent/80 transition-[width] duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold">Recent Events</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40">
                <th className="pb-3 text-left font-medium text-muted-foreground">Type</th>
                <th className="pb-3 text-left font-medium text-muted-foreground">Event</th>
                <th className="pb-3 text-left font-medium text-muted-foreground">Page</th>
                <th className="pb-3 text-right font-medium text-muted-foreground">Time</th>
              </tr>
            </thead>
            <tbody>
              {data.recentEvents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    No events recorded yet
                  </td>
                </tr>
              ) : (
                data.recentEvents.map((event) => (
                  <tr key={event.id} className="border-b border-border/20">
                    <td className="py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] uppercase ${getEventTypeColor(
                          event.event_type
                        )}`}
                      >
                        {event.event_type}
                      </span>
                    </td>
                    <td className="py-3 font-medium">
                      {event.event_name.replace(/_/g, " ")}
                    </td>
                    <td className="py-3 font-mono text-xs text-muted-foreground">
                      {event.page_path || "-"}
                    </td>
                    <td className="py-3 text-right text-muted-foreground">
                      {formatTime(event.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
