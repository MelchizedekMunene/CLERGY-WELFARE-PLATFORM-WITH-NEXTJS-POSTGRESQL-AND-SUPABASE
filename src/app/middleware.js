//Role Based Protection Middleware
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export const middleware = withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Protect /dashboard/admin - only ADMIN role
    if (path.startsWith('/dashboard/admin')) {
      if (token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/auth/signin', req.url));
      }
    }

    // Protect /dashboard/member - only MEMBER role
    if (path.startsWith('/dashboard/member')) {
      if (token?.role !== 'MEMBER') {
        return NextResponse.redirect(new URL('/auth/signin', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Protected routes require token
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/auth/admin/:path*'],
};
