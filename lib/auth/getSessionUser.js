/**
 * lib/auth/getSessionUser.js
 *
 * Server-side session validation helper used by protected API routes.
 *
 * Validation flow:
 * - Session cookie and sessionToken cookie must both exist
 * - Session cookie must verify with Firebase Admin SDK
 * - User document must exist in Firestore
 * - activeSessionToken in Firestore must match the sessionToken cookie
 * - Role must be one of the allowed system roles when present
 * - Active users must have status === 'active'
 * - Active Brgy-Secretary users must have an assigned barangay
 *
 * Incomplete-profile handling:
 * - A user needs profile completion when !role or status === 'pending'
 * - By default, users in that state are rejected
 * - Pass { allowPendingProfile: true } for routes that intentionally allow
 *   profile completion while the account is still pending
 *
 * Returns:
 * - { uid, email, role, barangay, status, needsProfileCompletion, profile } on success
 * - null if session invalid/expired/replaced by another login
 * - throws error on unexpected server issues
 *
 * Usage in API route:
 * ```
 * import { getSessionUser } from '@/lib/auth/getSessionUser';
 * 
 * export async function GET(request) {
 *   try {
 *     const user = await getSessionUser();
 *     if (!user) {
 *       return NextResponse.json(
 *         { error: 'Unauthorized' },
 *         { status: 401 }
 *       );
 *     }
 *     // user.uid, user.role, user.barangay, etc.
 *     return NextResponse.json({ data: user });
 *   } catch (error) {
 *     console.error('API error:', error);
 *     return NextResponse.json(
 *       { error: 'Internal server error' },
 *       { status: 500 }
 *     );
 *   }
 * }
 * ```
 */

import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

const ALLOWED_ROLES = [
  'MDRRMC-Admin',
  'MDRRMC-Personnel',
  'Brgy-Secretary',
];

export async function getSessionUser(options = {}) {
  try {
    // allowPendingProfile is used only by routes that intentionally support
    // users who are logged in but still completing their initial profile.
    const { allowPendingProfile = false } = options;
    const cookieStore = await cookies();

    // 1. Extract session cookies
    const sessionCookie = cookieStore.get('session')?.value;
    const sessionToken = cookieStore.get('sessionToken')?.value;

    // 2. Validate cookies exist
    if (!sessionCookie || !sessionToken) {
      return null;
    }

    // 3. Verify session cookie signature with Admin SDK
    let decoded;
    try {
      decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    } catch (error) {
      // Session cookie invalid or expired
      return null;
    }

    const uid = decoded.uid;

    // 4. Fetch user document from Firestore
    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();

    // 5. Validate user document exists
    if (!userSnap.exists) {
      return null;
    }

    const userData = userSnap.data() || {};

    // 6. Validate single active session
    // Compare activeSessionToken in Firestore vs sessionToken in cookie
    const activeSessionToken = userData.activeSessionToken || null;
    if (!activeSessionToken || activeSessionToken !== sessionToken) {
      // Session has been invalidated (e.g., logged in elsewhere or logged out)
      return null;
    }

    // 7. Derive role/status state for active vs. incomplete-profile access
    const role = userData.role || null;
    if (role && !ALLOWED_ROLES.includes(role)) {
      return null;
    }

    const status = userData.status || (role ? 'active' : 'pending');
    const needsProfileCompletion = !role || status === 'pending';

    if (!needsProfileCompletion && status !== 'active') {
      return null;
    }

    if (needsProfileCompletion && !allowPendingProfile) {
      return null;
    }

    // 8. Active secretaries must have an assigned barangay
    if (
      role === 'Brgy-Secretary' &&
      status === 'active' &&
      !userData.barangay
    ) {
      return null;
    }

    // 9. Return user object for API route to use
    return {
      uid,
      email: userData.email || decoded.email || '',
      displayName: userData.displayName || '',
      role,
      barangay: userData.barangay || null,
      status,
      needsProfileCompletion,
      profile: userData, // Full profile object
    };
  } catch (error) {
    // Server error during validation
    console.error('getSessionUser error:', error);
    throw error;
  }
}

/**
 * Helper to check if user has required role(s)
 * @param {string} userRole - User's role from getSessionUser
 * @param {string|string[]} requiredRoles - Role(s) needed
 * @returns {boolean} true if user has one of the required roles
 *
 * Usage:
 * ```
 * const user = await getSessionUser();
 * if (!hasRole(user.role, ['MDRRMC-Admin', 'MDRRMC-Personnel'])) {
 *   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 * }
 * ```
 */
export function hasRole(userRole, requiredRoles) {
  const required = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return required.includes(userRole);
}

/**
 * Helper to validate barangay access for Brgy-Secretary
 * Ensures Secretaries can only access their own barangay data
 * @param {string} userRole - User's role
 * @param {string} userBarangay - User's barangay
 * @param {string} targetBarangay - Barangay being accessed
 * @returns {boolean}
 */
export function canAccessBarangay(userRole, userBarangay, targetBarangay) {
  // Admins and Personnel can access any barangay
  if (userRole === 'MDRRMC-Admin' || userRole === 'MDRRMC-Personnel') {
    return true;
  }

  // Secretaries can only access their own barangay
  if (userRole === 'Brgy-Secretary') {
    return userBarangay === targetBarangay;
  }

  return false;
}
