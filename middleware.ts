import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "zws-cloud-secret-key-change-in-production"
)

// Routes that require authentication
const PROTECTED_ROUTES = ['/client-area', '/admin']

// Routes that require admin role
const ADMIN_ROUTES = ['/admin']

// Routes accessible only when NOT authenticated
const AUTH_ROUTES = ['/login', '/register', '/zwsloginsam']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  // Get auth token from cookies
  const token = request.cookies.get('auth_token')?.value || 
                request.cookies.get('admin_token')?.value

  let user: { role?: string } | null = null

  // Verify token if exists
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      user = payload as { role?: string }
    } catch {
      // Token invalid or expired - clear it
      const response = NextResponse.next()
      response.cookies.delete('auth_token')
      response.cookies.delete('admin_token')
      user = null
    }
  }

  const isAuthenticated = !!user
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  // Check if current route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route))
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect non-admin users from admin routes to client area
  if (isAdminRoute && !isAdmin) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    // Authenticated but not admin
    return NextResponse.redirect(new URL('/client-area', request.url))
  }

  // Redirect authenticated users away from auth routes to client area
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/client-area', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
