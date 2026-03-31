// app/api/examples/multi-role-endpoint/route.js
/**
 * Example: Multi-Role Access Endpoint
 * 
 * Pattern for endpoints that require one of several roles
 * Example: Admin OR Personnel can create reports
 */

import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/permissions';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    // 1. Require one of: Admin or Personnel
    //    Secretaries cannot access this endpoint
    const user = await requireRole([
      'MDRRMC-Admin',
      'MDRRMC-Personnel',
    ]);

    // 2. User has one of the required roles
    const body = await request.json();

    return NextResponse.json({
      message: 'Report created',
      report: {
        createdBy: user.uid,
        createdByRole: user.role,
        data: body,
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
    console.error('POST /api/examples/multi-role-endpoint error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
