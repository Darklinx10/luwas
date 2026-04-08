import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/getSessionUser';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await getSessionUser({ allowPendingProfile: true });
    if (!user) {
      return NextResponse.json(
        { authenticated: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

    const userData = user.profile || {};

    return NextResponse.json({
      authenticated: true,
      user: {
        uid: user.uid,
        email: user.email,
        role: user.role,
        displayName:
          userData.displayName ||
          `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        middleName: userData.middleName || '',
        contactNumber: userData.contactNumber || '',
        barangay: userData.barangay || '',
        municipality: userData.municipality || '',
        dateOfBirth: userData.dateOfBirth || '',
        gender: userData.gender || '',
        profilePhoto: userData.profilePhoto || '',
        status: user.status,
        needsProfileCompletion: user.needsProfileCompletion,
        createdAt: userData.createdAt || null,
      },
    });
  } catch (error) {
    console.error('GET /api/auth/me error:', error);

    return NextResponse.json(
      { authenticated: false, error: 'Invalid session' },
      { status: 401 }
    );
  }
}
