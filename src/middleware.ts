import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const path = req.nextUrl.pathname;

    if (path.startsWith('/admin-dashboard')) {
      if (token?.role !== 'Admin') {
        return NextResponse.redirect(new URL('/user-dashboard', req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/user-dashboard/:path*', '/admin-dashboard/:path*'],
};
