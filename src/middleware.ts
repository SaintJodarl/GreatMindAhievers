import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = process.env.JWT_SECRET;

if (!secret && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production.');
}

const JWT_SECRET = new TextEncoder().encode(secret || 'gma-dev-secret-key-change-in-development');

function withNoIndex(response: NextResponse) {
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

export async function middleware(req: NextRequest) {
  // Redirect Vercel Preview environments to Production
  // if (process.env.VERCEL_ENV === 'preview') {
  //   return NextResponse.redirect(new URL(req.nextUrl.pathname, 'https://app.greatmindachievers.org'));
  // }

  const path = req.nextUrl.pathname;

  // Skip static assets
  if (path.startsWith('/_next') || path.startsWith('/assets') || path.startsWith('/favicon.ico')) {
    return NextResponse.next();
  }

  const isAdminRoute = path.startsWith('/admin-dashboard') || path.startsWith('/api/admin');
  const isMemberRoute =
    path.startsWith('/user-dashboard') ||
    path.startsWith('/activate') ||
    path.startsWith('/api/user') ||
    path.startsWith('/api/network') ||
    path.startsWith('/api/wallet');
  const isApiRequest = path.startsWith('/api/');

  if (!isAdminRoute && !isMemberRoute) {
    if (isApiRequest) {
      return withNoIndex(NextResponse.next());
    }

    return NextResponse.next();
  }

  const token = req.cookies.get('accessToken')?.value;

  if (!token) {
    if (isApiRequest) {
      return withNoIndex(
        NextResponse.json({ message: 'Unauthorized: Missing session token' }, { status: 401 })
      );
    }
    return withNoIndex(NextResponse.redirect(new URL('/sign-up-login-screen', req.url)));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload.status === 'SUSPENDED') {
      if (isApiRequest) {
        return withNoIndex(
          NextResponse.json({ message: 'Forbidden: Account suspended' }, { status: 403 })
        );
      }
      return withNoIndex(
        NextResponse.redirect(new URL('/sign-up-login-screen?error=suspended', req.url))
      );
    }

    const isAdminUser = payload.role === 'ADMIN' || payload.role === 'SUPER_ADMIN';

    // PASSWORD TEMPORARY ENFORCEMENT: Block all non-admin users with temporary passwords.
    const isTemporary = payload.isPasswordTemporary === true;
    if (isTemporary && !isAdminUser) {
      const allowedTempApis = ['/api/user/account/force-password-change', '/api/auth/logout'];
      const allowedTempPages = ['/user-dashboard/force-password-change', '/sign-up-login-screen'];

      if (isApiRequest) {
        if (!allowedTempApis.some((p) => path.startsWith(p))) {
          return withNoIndex(
            NextResponse.json(
              { message: 'Forbidden: Password reset change required.', code: 'PASSWORD_TEMPORARY' },
              { status: 403 }
            )
          );
        }
      } else {
        if (!allowedTempPages.some((p) => path === p || path.startsWith(p + '/'))) {
          return withNoIndex(
            NextResponse.redirect(new URL('/user-dashboard/force-password-change', req.url))
          );
        }
      }
    }

    // ACTIVATION ENFORCEMENT: Block ALL non-ACTIVE member users from protected routes.
    if (!isAdminUser && payload.status !== 'ACTIVE') {
      const allowedInactiveApis = [
        '/api/user/dashboard-summary',
        '/api/user/activation/submit',
        '/api/auth',
        '/api/user/account/profile',
      ];
      const allowedInactivePages = ['/activate'];

      if (isApiRequest) {
        if (!allowedInactiveApis.some((p) => path.startsWith(p))) {
          return withNoIndex(
            NextResponse.json(
              { message: 'Forbidden: Account not activated. Please submit an activation code.' },
              { status: 403 }
            )
          );
        }
      } else {
        // Redirect inactive users to /activate
        if (!allowedInactivePages.some((p) => path === p || path.startsWith(p + '/'))) {
          return withNoIndex(NextResponse.redirect(new URL('/activate', req.url)));
        }
      }
    }

    const onboardingStatus = (payload.onboardingStatus as string) || 'INCOMPLETE';

    if (!isAdminUser && onboardingStatus !== 'COMPLETE' && path.startsWith('/user-dashboard')) {
      if (isApiRequest) {
        return withNoIndex(
          NextResponse.json({ message: 'Forbidden: Registration incomplete.' }, { status: 403 })
        );
      }
      return withNoIndex(
        NextResponse.redirect(new URL('/sign-up-login-screen?error=incomplete', req.url))
      );
    }

    // Role-Based Access Control (RBAC) Checks
    if (isAdminRoute) {
      if (payload.role !== 'ADMIN' && payload.role !== 'SUPER_ADMIN') {
        if (isApiRequest) {
          return withNoIndex(
            NextResponse.json({ message: 'Forbidden: Admin access only' }, { status: 403 })
          );
        }
        return withNoIndex(NextResponse.redirect(new URL('/user-dashboard', req.url)));
      }
    }

    // Admins accessing member dashboard should be redirected back to the back office
    if (path.startsWith('/user-dashboard') && payload.role === 'ADMIN') {
      return withNoIndex(NextResponse.redirect(new URL('/admin-dashboard', req.url)));
    }

    // Propagate authenticated user context inside request headers
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', payload.sub as string);
    requestHeaders.set('x-user-role', payload.role as string);
    requestHeaders.set('x-user-status', payload.status as string);
    requestHeaders.set('x-user-onboarding-status', onboardingStatus);

    return withNoIndex(
      NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    );
  } catch (err) {
    console.error(`[MW] JWT verification FAILED for path=${path}:`, err);
    if (isApiRequest) {
      return withNoIndex(
        NextResponse.json({ message: 'Unauthorized: Session expired or invalid' }, { status: 401 })
      );
    }
    const response = NextResponse.redirect(new URL('/sign-up-login-screen', req.url));
    response.cookies.delete('accessToken');
    return withNoIndex(response);
  }
}

export const config = {
  matcher: ['/user-dashboard/:path*', '/activate', '/admin-dashboard/:path*', '/api/:path*'],
};
