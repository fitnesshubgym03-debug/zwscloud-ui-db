import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event_type, event_name, properties = {} } = body

    if (!event_type || !event_name) {
      return NextResponse.json(
        { error: "event_type and event_name are required" },
        { status: 400 }
      )
    }

    // Get request metadata
    const userAgent = request.headers.get("user-agent") || ""
    const referer = request.headers.get("referer") || ""
    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIp || null

    // Generate or get session ID from cookie
    const sessionId = request.cookies.get("zws_session_id")?.value || crypto.randomUUID()

    // Get page path
    let pagePath = properties.page_path || null
    if (!pagePath && referer) {
      try {
        pagePath = new URL(referer).pathname
      } catch {
        pagePath = null
      }
    }

    // Insert analytics event
    await sql`
      INSERT INTO analytics_events (event_type, event_name, page_path, referrer, session_id, user_agent, ip_address, properties)
      VALUES (${event_type}, ${event_name}, ${pagePath}, ${referer}, ${sessionId}, ${userAgent}, ${ipAddress}, ${JSON.stringify({ ...properties, timestamp: new Date().toISOString() })})
    `

    const response = NextResponse.json({ success: true })
    
    // Set session cookie if not exists
    if (!request.cookies.get("zws_session_id")) {
      response.cookies.set("zws_session_id", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
      })
    }

    return response
  } catch (error) {
    console.error("Analytics tracking error:", error)
    // Silent fail - analytics should not break UX
    return NextResponse.json({ success: true })
  }
}
