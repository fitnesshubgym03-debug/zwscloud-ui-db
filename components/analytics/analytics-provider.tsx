"use client"

import { useEffect, useCallback, createContext, useContext, ReactNode, Suspense } from "react"
import { usePathname, useSearchParams } from "next/navigation"

interface AnalyticsContextType {
  track: (eventName: string, properties?: Record<string, unknown>) => Promise<void>
  trackPageView: () => Promise<void>
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null)

export function useAnalytics() {
  const context = useContext(AnalyticsContext)
  if (!context) {
    throw new Error("useAnalytics must be used within AnalyticsProvider")
  }
  return context
}

interface AnalyticsProviderProps {
  children: ReactNode
}

function AnalyticsProviderInner({ children }: AnalyticsProviderProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const track = useCallback(async (eventName: string, properties: Record<string, unknown> = {}) => {
    try {
      await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "custom",
          event_name: eventName,
          properties: {
            ...properties,
            page_path: pathname,
            timestamp: new Date().toISOString(),
          },
        }),
      })
    } catch {
      // Silent fail - analytics should not break UX
    }
  }, [pathname])

  const trackPageView = useCallback(async () => {
    try {
      await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "page_view",
          event_name: "page_view",
          properties: {
            page_path: pathname,
            search_params: Object.fromEntries(searchParams.entries()),
            timestamp: new Date().toISOString(),
          },
        }),
      })
    } catch {
      // Silent fail
    }
  }, [pathname, searchParams])

  // Track page views on route changes
  useEffect(() => {
    trackPageView()
  }, [trackPageView])

  return (
    <AnalyticsContext.Provider value={{ track, trackPageView }}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  return (
    <Suspense fallback={<>{children}</>}>
      <AnalyticsProviderInner>{children}</AnalyticsProviderInner>
    </Suspense>
  )
}
