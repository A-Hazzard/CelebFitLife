import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy function for Next.js 16+
 * Handles route protection and redirects
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API requests & public assets
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(
      /\.(png|jpg|jpeg|gif|svg|ico|webp|bmp|tiff|pdf|txt|css|js|woff|woff2|ttf|eot)$/i
    )
  ) {
    return NextResponse.next();
  }

  // Handle admin routes
  if (pathname.startsWith('/admin')) {
    const adminSession = request.cookies.get('admin_session');
    const isAuthenticated = adminSession?.value === 'true';

    // Protect /admin routes, but exclude /admin/login
    if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        const loginUrl = new URL('/admin/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
    }

    // If accessing login page and already authenticated, redirect to dashboard
    if (pathname === '/admin/login' && isAuthenticated) {
      const dashboardUrl = new URL('/admin/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Protect /onboarding routes - require email verification
  // Note: Actual verification check is done client-side in the pages
  // This proxy only blocks if no email parameter is present
  // The pages themselves will check verification status via API
  if (pathname.startsWith('/onboarding')) {
    const email = request.nextUrl.searchParams.get('email');
    
    // Allow /api/verify-email to work (it redirects internally)
    if (pathname === '/api/verify-email') {
      return NextResponse.next();
    }
    
    // If no email param, redirect to landing
    // Pages will handle verification status check via API
    if (!email && pathname !== '/onboarding/options') {
      const landingUrl = new URL('/', request.url);
      landingUrl.searchParams.set('error', 'verification_required');
      landingUrl.searchParams.set('message', 'Please verify your email to access this page.');
      return NextResponse.redirect(landingUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.|api/).*)'],
};
