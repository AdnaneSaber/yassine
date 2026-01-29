import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin routes - require ADMIN or SUPER_ADMIN role
    if (path.startsWith('/admin')) {
      if (token?.role !== 'ADMIN' && token?.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/auth/signin?error=unauthorized', req.url));
      }
    }

    // Student routes - require STUDENT role or admin
    if (path.startsWith('/demandes')) {
      if (!token?.role) {
        return NextResponse.redirect(new URL('/auth/signin', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
);

export const config = {
  matcher: [
    '/demandes/:path*',
    '/admin/:path*',
    '/dashboard/:path*',
  ],
};
