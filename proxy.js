import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function proxy(req) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  // Skip Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/assets')
  ) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get('session')?.value;

  console.log('[Proxy] Incoming URL:', pathname);

  const redirect = (path) => {
    url.pathname = path;
    return NextResponse.redirect(url);
  };

  /* =====================
     PUBLIC ROUTES
  ====================== */
  const publicPaths = ['/login', '/forgotpass'];

  if (publicPaths.some(path => pathname.startsWith(path))) {
    if (!sessionCookie) return NextResponse.next();

    try {
      const decoded = await admin
        .auth()
        .verifySessionCookie(sessionCookie, true);

      return redirect(
        decoded.role === 'MDRRMC-Admin'
          ? '/household'
          : '/dashboard'
      );
    } catch {
      return NextResponse.next();
    }
  }

  /* =====================
     PROTECTED ROUTES
  ====================== */
  if (!sessionCookie) {
    return redirect('/login');
  }

  try {
    const decoded = await admin
      .auth()
      .verifySessionCookie(sessionCookie, true);

    const role = decoded.role ?? 'user';

    /* =====================
       ADMIN-ONLY ROUTES
    ====================== */
    const adminOnly = ['/users', '/hazards'];

    if (
      adminOnly.some(path => pathname.startsWith(path)) &&
      role !== 'MDRRMC-Admin'
    ) {
      return redirect('/unauthorized');
    }

    /* =====================
       BLOCK ADMIN FROM THESE
    ====================== */
    const adminBlocked = ['/dashboard', '/reports'];

    if (
      adminBlocked.some(path => pathname.startsWith(path)) &&
      role === 'MDRRMC-Admin'
    ) {
      return redirect('/household');
    }

    return NextResponse.next();
  } catch {
    return redirect('/login');
  }
}

export const config = {
  runtime: 'nodejs',
  matcher: [
    '/dashboard/:path*',
    '/maps/:path*',
    '/users/:path*',
    '/hazards/:path*',
    '/household/:path*',
    '/reports/:path*',
    '/profile/:path*',
    '/login',
    '/forgotpass',
    '/unauthorized',
  ],
};
