import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function middleware(req) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  console.log('[Middleware] Incoming URL:', pathname);

  /* =====================
     PUBLIC ROUTES
  ====================== */
  const publicPaths = ['/login', '/forgotpass'];

  if (publicPaths.some(path => pathname.startsWith(path))) {
    const sessionCookie = req.cookies.get('session')?.value;

    if (!sessionCookie) return NextResponse.next();

    try {
      const decoded = await admin.auth().verifySessionCookie(sessionCookie, true);

      url.pathname =
        decoded.role === 'MDRRMC-Admin' ? '/household' : '/dashboard';

      return NextResponse.redirect(url);
    } catch {
      return NextResponse.next();
    }
  }

  /* =====================
     PROTECTED ROUTES
  ====================== */
  const sessionCookie = req.cookies.get('session')?.value;

  if (!sessionCookie) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  try {
    const decoded = await admin.auth().verifySessionCookie(sessionCookie, true);
    const role = decoded.role;
    console.log('Decoded token:', decoded);
    console.log('Decoded role:', decoded.role);


    /* =====================
       ADMIN-ONLY ROUTES
    ====================== */
    const adminOnly = ['/users', '/hazards'];

    if (
      adminOnly.some(path => pathname.startsWith(path)) &&
      role !== 'MDRRMC-Admin'
    ) {
      url.pathname = '/unauthorized';
      return NextResponse.redirect(url);
    }

    /* =====================
       BLOCK ADMIN FROM THESE
    ====================== */
    const adminBlocked = ['/dashboard', '/reports'];

    if (
      adminBlocked.some(path => pathname.startsWith(path)) &&
      role === 'MDRRMC-Admin'
    ) {
      url.pathname = '/household';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch {
    url.pathname = '/login';
    return NextResponse.redirect(url);
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
