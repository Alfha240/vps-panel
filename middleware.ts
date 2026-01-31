import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from './lib/auth'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/signup']
    const isPublicRoute = publicRoutes.includes(pathname)

    // Get session
    const session = await auth()

    // Redirect to login if not authenticated and trying to access protected route
    if (!session && !isPublicRoute) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // If authenticated and on login/signup page, redirect to appropriate dashboard
    if (session && (pathname === '/login' || pathname === '/signup')) {
        if (session.user.isAdmin) {
            return NextResponse.redirect(new URL('/admin', request.url))
        } else {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    // Admin-only routes protection
    if (pathname.startsWith('/admin')) {
        if (!session || !session.user.isAdmin) {
            // Redirect non-admin users trying to access admin panel
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    // User routes protection (root and other user pages)
    // Prevent admins from accessing user panel if they should be in admin panel
    if (session && session.user.isAdmin && pathname === '/') {
        return NextResponse.redirect(new URL('/admin', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
