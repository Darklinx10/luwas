// src/middleware.js
import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

const PUBLIC_ONLY_PATHS = ['/login', '/forgotpass'];
const ADMIN_ONLY_PATHS = ['/users', '/hazards'];
const ADMIN_BLOCKED_PATHS = ['/dashboard', '/reports'];

function getHomeByRole(role) {
  return role === 'MDRRMC-Admin' ? '/household' : '/dashboard';
}

export async function middleware(req) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  const redirect = (path) => {
    url.pathname = path;
    return NextResponse.redirect(url);
  };

  // Ignore Next internals and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get('session')?.value;
  const sessionToken = req.cookies.get('sessionToken')?.value;

  async function verifyActiveSession() {
    if (!sessionCookie || !sessionToken) return null;

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const uid = decoded.uid;

    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) return null;

    const userData = userSnap.data() || {};

    if (!userData.activeSessionToken) return null;
    if (userData.activeSessionToken !== sessionToken) return null;

    return {
      uid,
      role: userData.role || decoded.role || null,
    };
  }

  let session = null;

  try {
    session = await verifyActiveSession();
  } catch {
    session = null;
  }

  // 1. Public-only pages: login / forgotpass
  if (PUBLIC_ONLY_PATHS.some((path) => pathname.startsWith(path))) {
    if (!session) {
      return NextResponse.next();
    }

    return redirect(getHomeByRole(session.role));
  }

  // 2. Unauthorized page
  // If user is not logged in, don't allow access
  if (pathname.startsWith('/unauthorized')) {
    if (!session) {
      return redirect('/login');
    }

    // Logged-in users should not manually stay here
    return redirect(getHomeByRole(session.role));
  }

  // 3. All remaining matched routes are protected
  if (!session) {
    return redirect('/login');
  }

  const role = session.role;

  // 4. Admin-only routes
  if (
    ADMIN_ONLY_PATHS.some((path) => pathname.startsWith(path)) &&
    role !== 'MDRRMC-Admin'
  ) {
    return redirect('/unauthorized');
  }

  // 5. Routes blocked for admin
  if (
    ADMIN_BLOCKED_PATHS.some((path) => pathname.startsWith(path)) &&
    role === 'MDRRMC-Admin'
  ) {
    return redirect('/household');
  }

  return NextResponse.next();
}

export const runtime = 'nodejs';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/map/:path*',
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