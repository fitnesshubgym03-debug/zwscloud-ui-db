import { NextResponse } from "next/server"
import { getSession, isAdmin } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.id,
        email: session.email,
        name: session.name,
        role: session.role,
        isAdmin: isAdmin(session),
      },
    })
  } catch {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    )
  }
}
