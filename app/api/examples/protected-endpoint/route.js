// app/api/examples/protected-endpoint/route.js
/**
 * Example: Basic Protected Endpoint
 * 
 * Pattern for any API route that requires authentication
 * Validates session, returns user data
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/getSessionUser';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // 1. Validate session
    const user = await getSessionUser();

    // 2. Check if session is valid
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or expired session' },
        { status: 401 }
      );
    }

    // 3. User is authenticated, proceed with request
    return NextResponse.json({
      message: 'You are authenticated',
      user: {
        uid: user.uid,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    // Server error during session validation
    console.error('GET /api/examples/protected-endpoint error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
