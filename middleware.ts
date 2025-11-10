import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Check if the route requires authentication
  const protectedPaths = ['/proses'];
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath) {
    // Get session from cookie
    const sessionId = request.cookies.get('session')?.value;
    
    if (!sessionId) {
      // Redirect to login if no session
      const loginUrl = new URL('/auth', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // For now, just check if session exists in cookie
    // The actual session validation will be done in API routes
    const response = NextResponse.next();
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
};