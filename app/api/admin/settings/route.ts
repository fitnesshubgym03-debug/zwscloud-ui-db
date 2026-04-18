import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"

export async function GET() {
  try {
    const settings = await sql`
      SELECT key, value
      FROM admin_settings
      WHERE key IN ('cashfree_app_id', 'cashfree_secret_key', 'cashfree_mode', 'payment_gateway')
    `

    const settingsMap: Record<string, unknown> = {}
    ;(settings as Array<{ key: string; value: unknown }>).forEach((s) => {
      settingsMap[s.key] = s.value
    })

    return NextResponse.json(settingsMap)
  } catch (error) {
    console.error("Failed to fetch settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cashfree_app_id, cashfree_secret_key, cashfree_mode } = body

    // Update each setting
    const updates = [
      { key: 'cashfree_app_id', value: { id: cashfree_app_id } },
      { key: 'cashfree_secret_key', value: { key: cashfree_secret_key } },
      { key: 'cashfree_mode', value: { mode: cashfree_mode } },
    ]

    for (const update of updates) {
      await sql`
        INSERT INTO admin_settings (key, value, description)
        VALUES (${update.key}, ${JSON.stringify(update.value)}, ${`Cashfree ${update.key.replace('cashfree_', '')}`})
        ON CONFLICT (key)
        DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to save settings:", error)
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    )
  }
}
