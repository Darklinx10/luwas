/**
 * /app/api/users/route.js
 *
 * Unified Users API - Admin-only endpoint for user management
 *
 * GET /api/users
 *   - List users with pagination and search
 *   - Query params: page, limit, search
 *   - Returns: { users: [...], totalCount, totalPages, page, limit }
 *
 * POST /api/users
 *   - Create new user (Auth + Firestore atomically)
 *   - Body: { firstName, middleName, lastName, email, password, role, barangay, municipality, contactNumber }
 *   - Returns: { uid, email, firstName, lastName, role }
 *
 * Security:
 * ✅ All requests must be from authenticated admin
 * ✅ Comprehensive input validation
 * ✅ Server-side filtering by role
 * ✅ Atomic operations (create Auth + Firestore together)
 * ✅ Proper error handling without info leaks
 */

import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { getSessionUser } from '@/lib/auth/getSessionUser';

export const runtime = 'nodejs';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const MIN_PASSWORD_LENGTH = 8;
const ALLOWED_ROLES_FOR_CREATION = ['Brgy-Secretary', 'MDRRMC-Personnel'];

// Regex for basic email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate required fields and formats
 */
function validateUserInput(data, isCreate = false) {
  const errors = [];

  // First Name
  if (!data.firstName || typeof data.firstName !== 'string') {
    errors.push('First name is required');
  } else if (data.firstName.trim().length < 2) {
    errors.push('First name must be at least 2 characters');
  } else if (data.firstName.trim().length > 50) {
    errors.push('First name must not exceed 50 characters');
  }

  // Last Name
  if (!data.lastName || typeof data.lastName !== 'string') {
    errors.push('Last name is required');
  } else if (data.lastName.trim().length < 2) {
    errors.push('Last name must be at least 2 characters');
  } else if (data.lastName.trim().length > 50) {
    errors.push('Last name must not exceed 50 characters');
  }

  // Email (only validate on create)
  if (isCreate) {
    if (!data.email || typeof data.email !== 'string') {
      errors.push('Email is required');
    } else if (!EMAIL_REGEX.test(data.email)) {
      errors.push('Invalid email format');
    } else if (data.email.length > 100) {
      errors.push('Email is too long');
    }
  }

  // Password (only validate on create)
  if (isCreate) {
    if (!data.password || typeof data.password !== 'string') {
      errors.push('Password is required');
    } else if (data.password.length < MIN_PASSWORD_LENGTH) {
      errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    } else if (data.password.length > 128) {
      errors.push('Password is too long');
    }
  }

  // Role (only validate on create)
  if (isCreate) {
    if (!data.role || !ALLOWED_ROLES_FOR_CREATION.includes(data.role)) {
      errors.push(`Role must be one of: ${ALLOWED_ROLES_FOR_CREATION.join(', ')}`);
    }
  }

  // Barangay - required for non-admin roles
  if (isCreate && data.role !== 'MDRRMC-Admin') {
    if (!data.barangay || typeof data.barangay !== 'string') {
      errors.push('Barangay is required');
    } else if (data.barangay.trim().length === 0) {
      errors.push('Barangay cannot be empty');
    }
  }

  // Contact Number (optional but validate if provided)
  if (data.contactNumber) {
    if (typeof data.contactNumber !== 'string') {
      errors.push('Contact number must be a string');
    } else if (!/^\d{10,11}$/.test(data.contactNumber)) {
      errors.push('Contact number must be 10-11 digits');
    }
  }

  return errors;
}

/**
 * GET /api/users - List users
 * Query params: page, limit, search
 */
export async function GET(req) {
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

    // 2. Parse query parameters
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page')) || DEFAULT_PAGE);
    const limit = Math.min(parseInt(searchParams.get('limit')) || DEFAULT_LIMIT, MAX_LIMIT);
    const search = (searchParams.get('search') || '').trim().toLowerCase();

    // 3. Fetch users from Firestore
    const usersRef = admin.firestore().collection('users');
    const snapshot = await usersRef.get();

    let users = snapshot.docs.map(doc => ({
      id: doc.id,
      uid: doc.id,
      ...doc.data(),
    }));

    // 4. Filter by allowed roles (don't show MDRRMC-Admin users to regular admins viewing list)
    users = users.filter(u => 
      ['Brgy-Secretary', 'MDRRMC-Personnel'].includes(u.role)
    );

    // 5. Apply search filter (server-side)
    if (search) {
      users = users.filter(u => {
        const fullName = `${u.firstName || ''} ${u.middleName || ''} ${u.lastName || ''}`.toLowerCase();
        const email = (u.email || '').toLowerCase();
        const barangay = (u.barangay || '').toLowerCase();
        const role = (u.role || '').toLowerCase();

        return (
          fullName.includes(search) ||
          email.includes(search) ||
          barangay.includes(search) ||
          role.includes(search)
        );
      });
    }

    // 6. Sort by last name, then first name
    users.sort((a, b) => {
      const lastA = (a.lastName || '').toLowerCase();
      const lastB = (b.lastName || '').toLowerCase();
      if (lastA !== lastB) return lastA.localeCompare(lastB);

      const firstA = (a.firstName || '').toLowerCase();
      const firstB = (b.firstName || '').toLowerCase();
      return firstA.localeCompare(firstB);
    });

    // 7. Apply pagination
    const totalCount = users.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const startIndex = (page - 1) * limit;
    const paginatedUsers = users.slice(startIndex, startIndex + limit);

    // 8. Build fullName for display
    const responseUsers = paginatedUsers.map(u => ({
      id: u.id,
      uid: u.uid,
      firstName: u.firstName,
      middleName: u.middleName,
      lastName: u.lastName,
      fullName: `${u.firstName}${u.middleName ? ' ' + u.middleName : ''} ${u.lastName}`,
      email: u.email,
      contactNumber: u.contactNumber,
      barangay: u.barangay,
      municipality: u.municipality,
      role: u.role,
      createdAt: u.createdAt,
    }));

    return NextResponse.json({
      users: responseUsers,
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    });

  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users - Create new user
 * Body: { firstName, middleName, lastName, email, password, role, barangay, municipality, contactNumber }
 */
export async function POST(req) {
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

    // 2. Parse request body
    const body = await req.json();

    // 3. Normalize inputs
    const userData = {
      firstName: body.firstName?.trim() || '',
      middleName: body.middleName?.trim() || '',
      lastName: body.lastName?.trim() || '',
      email: body.email?.trim().toLowerCase() || '',
      password: body.password || '',
      role: body.role || '',
      barangay: body.barangay?.trim() || '',
      municipality: body.municipality?.trim() || '',
      contactNumber: body.contactNumber?.trim() || '',
    };

    // 4. Validate input
    const errors = validateUserInput(userData, true);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: errors[0] }, // Return first error
        { status: 400 }
      );
    }

    // 5. Check if email already exists
    try {
      await admin.auth().getUserByEmail(userData.email);
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    } catch (err) {
      if (err.code !== 'auth/user-not-found') {
        throw err; // Unexpected error
      }
      // Email doesn't exist, continue with creation
    }

    // 6. Create Auth user and Firestore document atomically
    let authUser;
    try {
      authUser = await admin.auth().createUser({
        email: userData.email,
        password: userData.password,
        displayName: `${userData.firstName} ${userData.middleName} ${userData.lastName}`.trim(),
      });
    } catch (authError) {
      return NextResponse.json(
        { error: 'Failed to create authentication user' },
        { status: 500 }
      );
    }

    // 7. Set custom claims for role
    try {
      await admin.auth().setCustomUserClaims(authUser.uid, { role: userData.role });
    } catch (claimsError) {
      // Rollback: Delete the created user
      await admin.auth().deleteUser(authUser.uid);
      console.error('Failed to set custom claims:', claimsError);
      return NextResponse.json(
        { error: 'Failed to set user role' },
        { status: 500 }
      );
    }

    // 8. Create Firestore document
    try {
      await admin.firestore().collection('users').doc(authUser.uid).set({
        firstName: userData.firstName,
        middleName: userData.middleName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role,
        barangay: userData.barangay,
        municipality: userData.municipality,
        contactNumber: userData.contactNumber,
        status: 'active',
        // ✅ Initialize profile fields with defaults
        displayName: `${userData.firstName}${userData.middleName ? ' ' + userData.middleName : ''} ${userData.lastName}`.trim(),
        dateOfBirth: '',
        gender: '',
        profilePhoto: '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: user.uid,
      });
    } catch (firestoreError) {
      // Rollback: Delete the Auth user
      await admin.auth().deleteUser(authUser.uid);
      console.error('Failed to create Firestore document:', firestoreError);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    // 9. Return success
    return NextResponse.json({
      uid: authUser.uid,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      barangay: userData.barangay,
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/users error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
