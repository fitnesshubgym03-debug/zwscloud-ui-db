import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

// JWT_SECRET must be set in environment variables - never hardcode
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || ""
)

export async function GET() {
  try {
    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { authenticated: false, error: "Auth system not configured" },
        { status: 503 }
      )
    }

    const cookieStore = await cookies()
    const token = cookieStore.get("admin_token")?.value

    if (!token) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)

    return NextResponse.json({
      authenticated: true,
      user: {
        email: payload.email,
        displayName: payload.displayName,
        role: payload.role,
      },
    })
  } catch {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    )
  }
}
