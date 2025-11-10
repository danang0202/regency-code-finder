import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't require authentication
  const publicRoutes = ['/auth', '/login'];
  
  // API routes that don't require authentication
  const publicApiRoutes = ['/v2/api/auth/'];
  
  // Check if it's a public route
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }
  
  // Check if it's a public API route
  if (publicApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Check for session cookie
  const sessionCookie = request.cookies.get('session');
  
  if (!sessionCookie) {
    // No session, redirect to login
    return NextResponse.redirect(new URL('/auth', request.url));
  }
  
  // For now, just check if session cookie exists
  // In a real app, you'd validate the session with your auth system
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};