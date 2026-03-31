// app/api/examples/admin-only/route.js
/**
 * Example: Admin-Only Endpoint
 * 
 * Pattern for endpoints that require MDRRMC-Admin role
 * Uses requireAdmin() helper which throws on auth failure
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/permissions';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // 1. Require admin role (throws if not authorized)
    const user = await requireAdmin();

    // 2. User is guaranteed to be admin here
    return NextResponse.json({
      message: 'Admin access granted',
      admin: {
        uid: user.uid,
        email: user.email,
      },
    });
  } catch (error) {
    // Handle authorization errors (401 or 403)
    if (error.status) {
      return NextResponse.json(
        { error: error.error },
        { status: error.status }
      );
    }

    // Handle unexpected server errors
    console.error('GET /api/examples/admin-only error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
