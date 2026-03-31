// app/api/examples/barangay-data/route.js
/**
 * Example: Barangay-Level Access Control
 * 
 * Pattern for endpoints requiring access to specific barangay
 * - Secretaries can only access their own barangay
 * - Admin/Personnel can access any barangay
 */

import { NextResponse } from 'next/server';
import { requireBarangayAccess } from '@/lib/auth/permissions';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    // Get barangay from query parameter
    const { searchParams } = new URL(request.url);
    const barangay = searchParams.get('barangay');

    if (!barangay) {
      return NextResponse.json(
        { error: 'barangay parameter required' },
        { status: 400 }
      );
    }

    // 1. Require access to this barangay
    // For Secretary: must be their own barangay
    // For Admin/Personnel: any barangay allowed
    const user = await requireBarangayAccess(barangay);

    // 2. User has access to this barangay
    return NextResponse.json({
      message: `You have access to ${barangay}`,
      user: {
        uid: user.uid,
        role: user.role,
        assignedBarangay: user.barangay,
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
    console.error('GET /api/examples/barangay-data error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
