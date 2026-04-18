import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'zws-app',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[HEALTH] Database check failed:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Database connection failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
