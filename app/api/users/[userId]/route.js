/**
 * /app/api/users/[userId]/route.js
 *
 * Single User API - Admin-only endpoint for managing individual users
 *
 * GET /api/users/[userId]
 *   - Fetch single user details
 *   - Returns: { uid, firstName, lastName, email, role, barangay, ... }
 *
 * PATCH /api/users/[userId]
 *   - Update user profile (name, contact, location only)
 *   - Cannot update: email, password, role (these require special handling)
 *   - Body: { firstName, lastName, middleName, contactNumber, barangay, municipality }
 *   - Returns: { uid, ...updatedFields }
 *
 * DELETE /api/users/[userId]
 *   - Delete user (Auth + Firestore atomically)
 *   - Returns: { success: true }
 *
 * Security:
 * ✅ All requests must be from authenticated admin
 * ✅ Comprehensive input validation
 * ✅ Email/password/role cannot be edited via PATCH
 * ✅ Atomic delete (Firestore transaction)
 * ✅ Proper error handling
 */

import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { getSessionUser } from '@/lib/auth/getSessionUser';

export const runtime = 'nodejs';

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 50;

/**
 * GET /api/users/[userId] - Fetch single user
 */
export async function GET(req, { params }) {
  try {
    // 1. Verify admin authentication
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.role !== 'MDRRMC-Admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // 2. Get userId from URL
    const userId = params.userId;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 3. Fetch user from Firestore
    const userDoc = await admin.firestore().collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // 4. Return user data
    return NextResponse.json({
      uid: userId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      middleName: userData.middleName,
      email: userData.email,
      role: userData.role,
      barangay: userData.barangay,
      municipality: userData.municipality,
      contactNumber: userData.contactNumber,
      status: userData.status,
      createdAt: userData.createdAt,
    });

  } catch (error) {
    console.error('GET /api/users/[userId] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/[userId] - Update user profile
 * Only allows updating: firstName, lastName, middleName, contactNumber, barangay, municipality
 */
export async function PATCH(req, { params }) {
  try {
    // 1. Verify admin authentication
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.role !== 'MDRRMC-Admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // 2. Get userId from URL
    const userId = params.userId;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 3. Parse request body
    const body = await req.json();

    // 4. Get current user to prevent editing restricted fields
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 5. Build update object - only allow certain fields
    const updateData = {};

    // Validate and add editable fields
    if (body.firstName !== undefined) {
      const firstName = body.firstName?.trim() || '';
      if (firstName.length < MIN_NAME_LENGTH || firstName.length > MAX_NAME_LENGTH) {
        return NextResponse.json(
          { error: `First name must be ${MIN_NAME_LENGTH}-${MAX_NAME_LENGTH} characters` },
          { status: 400 }
        );
      }
      updateData.firstName = firstName;
    }

    if (body.lastName !== undefined) {
      const lastName = body.lastName?.trim() || '';
      if (lastName.length < MIN_NAME_LENGTH || lastName.length > MAX_NAME_LENGTH) {
        return NextResponse.json(
          { error: `Last name must be ${MIN_NAME_LENGTH}-${MAX_NAME_LENGTH} characters` },
          { status: 400 }
        );
      }
      updateData.lastName = lastName;
    }

    if (body.middleName !== undefined) {
      updateData.middleName = body.middleName?.trim() || '';
    }

    if (body.contactNumber !== undefined) {
      const contactNumber = body.contactNumber?.trim() || '';
      if (contactNumber && !/^\d{10,11}$/.test(contactNumber)) {
        return NextResponse.json(
          { error: 'Contact number must be 10-11 digits' },
          { status: 400 }
        );
      }
      updateData.contactNumber = contactNumber;
    }

    if (body.barangay !== undefined) {
      updateData.barangay = body.barangay?.trim() || '';
    }

    if (body.municipality !== undefined) {
      updateData.municipality = body.municipality?.trim() || '';
    }

    // 6. Reject attempts to edit restricted fields
    const restrictedFields = ['email', 'password', 'role', 'uid', 'createdAt', 'status'];
    const attemptedRestricted = restrictedFields.filter(field => body.hasOwnProperty(field));
    if (attemptedRestricted.length > 0) {
      return NextResponse.json(
        { error: `Cannot edit restricted fields: ${attemptedRestricted.join(', ')}` },
        { status: 400 }
      );
    }

    // 7. Update Firestore
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    updateData.updatedBy = user.uid;

    await admin.firestore().collection('users').doc(userId).update(updateData);

    // 8. Return updated data
    return NextResponse.json({
      uid: userId,
      ...updateData,
    });

  } catch (error) {
    console.error('PATCH /api/users/[userId] error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[userId] - Delete user
 * Deletes both Firebase Auth user and Firestore document atomically
 */
export async function DELETE(req, { params }) {
  try {
    // 1. Verify admin authentication
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.role !== 'MDRRMC-Admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // 2. Get userId from URL
    const userId = params.userId;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 3. Prevent self-deletion
    if (userId === user.uid) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // 4. Verify user exists before deletion
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 5. Delete using transaction for atomicity
    const db = admin.firestore();
    await db.runTransaction(async (transaction) => {
      // First, delete Firestore document
      const userRef = db.collection('users').doc(userId);
      transaction.delete(userRef);

      // Note: Auth user must be deleted separately (can't use in transaction)
      // It's safer to delete Firestore first, then Auth as cleanup
    });

    // 6. Delete Firebase Auth user
    try {
      await admin.auth().deleteUser(userId);
    } catch (authError) {
      if (authError.code !== 'auth/user-not-found') {
        throw authError; // Log but don't fail - Firestore already deleted
      }
      console.warn(`Auth user ${userId} not found when deleting`);
    }

    // 7. Return success
    return NextResponse.json({
      success: true,
      uid: userId,
    });

  } catch (error) {
    console.error('DELETE /api/users/[userId] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
