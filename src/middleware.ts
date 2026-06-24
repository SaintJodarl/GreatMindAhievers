import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'gma-dev-secret-key-change-in-production-123456789';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export async function middleware(req: NextRequest) {
  // Redirect Vercel Preview environments to Production
  // if (process.env.VERCEL_ENV === 'preview') {
  //   return NextResponse.redirect(new URL(req.nextUrl.pathname, 'https://app.greatmindachievers.org'));
  // }

  const path = req.nextUrl.pathname;

  // Skip static assets
  if (
    path.startsWith('/_next') ||
    path.startsWith('/assets') ||
    path.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // Determine matcher targets
  const isOnboardingRoute = path.startsWith('/complete-profile');
  const isAdminRoute = path.startsWith('/admin-dashboard') || path.startsWith('/api/admin');
  const isMemberRoute = path.startsWith('/user-dashboard') || 
                        path.startsWith('/api/user') || 
                        path.startsWith('/api/network') || 
                        path.startsWith('/api/wallet') ||
                        isOnboardingRoute;

  if (!isAdminRoute && !isMemberRoute) {
    return NextResponse.next();
  }

  // Extract access token exclusively from cookie
  let token = req.cookies.get('accessToken')?.value;

  const isApiRequest = path.startsWith('/api/');

  if (!token) {
    if (isApiRequest) {
      return NextResponse.json({ message: 'Unauthorized: Missing session token' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/sign-up-login-screen', req.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload.status === 'SUSPENDED') {
      if (isApiRequest) {
        return NextResponse.json({ message: 'Forbidden: Account suspended' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/sign-up-login-screen?error=suspended', req.url));
    }

    // ACTIVATION ENFORCEMENT: Block ALL non-ACTIVE member users from protected routes.
    // Admin/SUPER_ADMIN users are exempt — they don't require activation codes.
    const isAdminUser = payload.role === 'ADMIN' || payload.role === 'SUPER_ADMIN';
    if (!isAdminUser && payload.status !== 'ACTIVE') {
      const allowedInactiveApis = [
        '/api/user/dashboard-summary',
        '/api/user/activation/submit',
        '/api/auth'
      ];
      const allowedInactivePages = [
        '/user-dashboard',
        '/user-dashboard/kyc',
        '/user-dashboard/account'
      ];

      if (isApiRequest) {
        if (!allowedInactiveApis.some(p => path.startsWith(p))) {
          return NextResponse.json(
            { message: 'Forbidden: Account not activated. Please submit an activation code.' },
            { status: 403 }
          );
        }
      } else {
        // Allow dashboard overview, KYC pages, and account pages for non-ACTIVE users
        if (!allowedInactivePages.some(p => path === p || path.startsWith(p + '/'))) {
          return NextResponse.redirect(new URL('/user-dashboard', req.url));
        }
      }
    }

    const onboardingStatus = (payload.onboardingStatus as string) || 'INCOMPLETE';

    // Users are allowed to access dashboard immediately. No hard-blocking redirect.
    // If they want to complete onboarding, they can visit /complete-profile voluntarily.

    // Role-Based Access Control (RBAC) Checks
    if (isAdminRoute) {
      if (payload.role !== 'ADMIN' && payload.role !== 'SUPER_ADMIN') {
        if (isApiRequest) {
          return NextResponse.json({ message: 'Forbidden: Admin access only' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/user-dashboard', req.url));
      }
    }

    // Admins accessing member dashboard should be redirected back to the back office
    if (path.startsWith('/user-dashboard') && payload.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin-dashboard', req.url));
    }

    // Propagate authenticated user context inside request headers
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', payload.sub as string);
    requestHeaders.set('x-user-role', payload.role as string);
    requestHeaders.set('x-user-status', payload.status as string);
    requestHeaders.set('x-user-onboarding-status', onboardingStatus);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (err) {
    if (isApiRequest) {
      return NextResponse.json({ message: 'Unauthorized: Session expired or invalid' }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL('/sign-up-login-screen', req.url));
    response.cookies.delete('accessToken');
    return response;
  }
}

export const config = {
  matcher: [
    '/user-dashboard/:path*', 
    '/admin-dashboard/:path*',
    '/complete-profile',
    '/api/admin/:path*',
    '/api/user/:path*',
    '/api/network/:path*',
    '/api/wallet/:path*'
  ],
};
