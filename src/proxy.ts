import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/cart',
  '/checkout',
  '/orders',
  '/messages',
  '/profile',
  '/settings',
  '/wishlist',
  '/notifications',
  '/products/create',
  '/subscription',
  '/change-password',
]

// Routes that require admin role
const adminRoutes = ['/admin']

// Routes that require farmer role
const farmerRoutes = ['/dashboard', '/products/create']

// Routes only for unauthenticated users
const authRoutes = ['/login', '/signup']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  // Redirect authenticated users away from auth pages
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (token) {
      return NextResponse.redirect(new URL('/feed', request.url))
    }
    return NextResponse.next()
  }

  // Check protected routes
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route))
  const isAdmin = adminRoutes.some(route => pathname.startsWith(route))
  const isFarmer = farmerRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))

  if (isProtected || isAdmin) {
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Admin route check
    if (isAdmin && token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/feed', request.url))
    }

    // Farmer route check
    if (isFarmer && token.role !== 'FARMER' && token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/feed', request.url))
    }
  }

  // Rate limiting headers for API routes
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (uploads, icons, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|uploads|icons|screenshots|manifest.json).*)',
  ],
}
