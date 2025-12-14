import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Handle admin routes
  if (path.startsWith('/admin')) {
    const adminSession = request.cookies.get('admin_session');
    const isAuthenticated = adminSession?.value === 'true';

    // Protect /admin routes, but exclude /admin/login
    if (path.startsWith('/admin') && !path.startsWith('/admin/login')) {
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        const loginUrl = new URL('/admin/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
    }

    // If accessing login page and already authenticated, redirect to dashboard
    if (path === '/admin/login' && isAuthenticated) {
      const dashboardUrl = new URL('/admin/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Protect /onboarding routes - require email verification
  // Note: Actual verification check is done client-side in the pages
  // This middleware only blocks if no email parameter is present
  // The pages themselves will check verification status via API
  if (path.startsWith('/onboarding')) {
    const email = request.nextUrl.searchParams.get('email');
    
    // Allow /api/verify-email to work (it redirects internally)
    if (path === '/api/verify-email') {
      return NextResponse.next();
    }
    
    // If no email param, redirect to landing
    // Pages will handle verification status check via API
    if (!email && path !== '/onboarding/options') {
      const landingUrl = new URL('/', request.url);
      landingUrl.searchParams.set('error', 'verification_required');
      landingUrl.searchParams.set('message', 'Please verify your email to access this page.');
      return NextResponse.redirect(landingUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/onboarding/:path*', '/api/verify-email'],
};
