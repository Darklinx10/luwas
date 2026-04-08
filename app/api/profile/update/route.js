// app/api/profile/update/route.js
/**
 * Server-side profile update endpoint
 *
 * Protected endpoint that:
 * - Validates session via getSessionUser({ allowPendingProfile: true })
 * - Allows incomplete-profile users to finish their own profile
 * - Applies barangay restrictions based on current role/profile state
 * - Validates submitted input from the current edit-profile form
 * - Updates profile in Firestore (Server SDK only)
 * - Returns updated profile
 *
 * Usage:
 * POST /api/profile/update
 * Body: {
 *   firstName,
 *   middleName,
 *   lastName,
 *   dateOfBirth,
 *   gender,
 *   contactNumber,
 *   barangay,
 *   profilePhoto
 * }
 * Returns: { success: true, profile: {...} }
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/getSessionUser';
import { adminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

// Allowed fields that users can update
const UPDATABLE_FIELDS = [
  'firstName',
  'middleName',
  'lastName',
  'dateOfBirth',
  'gender',
  'contactNumber',
];

// Fields that require special permission to update
const PROTECTED_FIELDS = {
  barangay: 'Requires admin permission',
  email: 'Use Firebase Auth to change email',
  role: 'Only admins can assign roles',
  status: 'System field',
};

function sanitizeProfilePhotoValue(value) {
  if (typeof value !== 'string') {
    return { shouldPersist: true, value: '' };
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return { shouldPersist: true, value: '' };
  }

  if (trimmed.startsWith('blob:')) {
    return { shouldPersist: false, value: '' };
  }

  return { shouldPersist: true, value: trimmed };
}

export async function POST(request) {
  try {
    // 1. Validate session
    const user = await getSessionUser({ allowPendingProfile: true });
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const {
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      gender,
      contactNumber,
      barangay,
      profilePhoto,
    } = body;

    // 3. Validate required fields
    if (!firstName || !firstName.trim()) {
      return NextResponse.json(
        { error: 'First name is required' },
        { status: 400 }
      );
    }

    if (!lastName || !lastName.trim()) {
      return NextResponse.json(
        { error: 'Last name is required' },
        { status: 400 }
      );
    }

    // The current edit-profile form submits dateOfBirth and gender.
    // This handler normalizes both values as trimmed strings below.

    if (!contactNumber || !contactNumber.trim()) {
      return NextResponse.json(
        { error: 'Contact number is required' },
        { status: 400 }
      );
    }

    // 4. Validate optional fields
    if (gender && !['Male', 'Female'].includes(gender)) {
      return NextResponse.json(
        { error: 'Invalid gender value' },
        { status: 400 }
      );
    }

    // 5. Check if user is trying to update protected fields
    if (barangay && barangay !== user.barangay && user.role === 'Brgy-Secretary') {
      // Secretaries cannot change their barangay
      return NextResponse.json(
        { error: 'You cannot change your assigned barangay' },
        { status: 403 }
      );
    }

    // 6. Prepare update object (server-side only)
    const updateData = {
      firstName: firstName.trim(),
      middleName: middleName?.trim() || '',
      lastName: lastName.trim(),
      dateOfBirth: dateOfBirth.trim(),
      gender: gender.trim(),
      contactNumber: contactNumber.trim(),
      // Note: Email is NOT updated here - use Firebase Auth
      // Note: Barangay can only be updated by admins or is fixed for secretaries
      updatedAt: new Date().toISOString(),
    };

    const sanitizedProfilePhoto = sanitizeProfilePhotoValue(profilePhoto);
    if (sanitizedProfilePhoto.shouldPersist) {
      updateData.profilePhoto = sanitizedProfilePhoto.value;
    }

    // 7. Only admins can update barangay after activation.
    // Incomplete-profile users can set their initial barangay here.
    if (barangay && barangay !== user.barangay) {
      if (!user.needsProfileCompletion && user.role !== 'MDRRMC-Admin') {
        return NextResponse.json(
          { error: 'Only admins can update barangay' },
          { status: 403 }
        );
      }
      updateData.barangay = barangay.trim();
    } else if (barangay) {
      updateData.barangay = barangay.trim();
    }

    // 8. Update profile in Firestore (Server SDK)
    const userRef = adminDb.collection('users').doc(user.uid);
    await userRef.update(updateData);

    // 9. Fetch updated profile to return
    const updatedSnap = await userRef.get();
    const updatedProfile = updatedSnap.data() || {};

    // 10. Return success response
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        uid: user.uid,
        email: user.email, // From session, not from form
        role: user.role, // Unchanged by this endpoint
        ...updatedProfile,
      },
    });
  } catch (error) {
    console.error('POST /api/profile/update error:', error);

    // Handle specific error types
    if (error.code === 'PERMISSION_DENIED') {
      return NextResponse.json(
        { error: 'Permission denied - check Firestore rules' },
        { status: 403 }
      );
    }

    if (error.code === 'NOT_FOUND') {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

/**
 * GET: Fetch the current user's profile, including pending-profile users.
 * Can be used to refresh profile data before editing.
 */
export async function GET() {
  try {
    const user = await getSessionUser({ allowPendingProfile: true });
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userRef = adminDb.collection('users').doc(user.uid);
    const userSnap = await userRef.get();
    const userData = userSnap.data() || {};

    return NextResponse.json({
      success: true,
      profile: {
        uid: user.uid,
        email: user.email,
        role: user.role,
        ...userData,
      },
    });
  } catch (error) {
    console.error('GET /api/profile/update error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
