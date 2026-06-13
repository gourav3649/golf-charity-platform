import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get('auth_token')?.value;

  const authRoutes = ['/login', '/signup'];
  const isDashboard = pathname.startsWith('/dashboard');
  const isAdmin = pathname.startsWith('/admin');
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // Decode JWT payload without verification (verification happens in API routes)
  let decoded: any = null;
  if (authToken) {
    try {
      const payload = authToken.split('.')[1];
      decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
      // Check token expiry
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        decoded = null;
      }
    } catch {
      decoded = null;
    }
  }

  // Redirect logged-in users away from auth routes
  if (isAuthRoute && decoded) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protect dashboard routes
  if (isDashboard && !decoded) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protect admin routes
  if (isAdmin) {
    if (!decoded) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (decoded.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/login',
    '/signup',
  ],
};
