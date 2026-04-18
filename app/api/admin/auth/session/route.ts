import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "zws-cloud-admin-secret-key-change-in-production"
)

export async function GET() {
  try {
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
