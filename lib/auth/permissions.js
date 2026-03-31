/**
 * lib/auth/permissions.js
 *
 * Centralized permission checking for protected API routes
 * Standard patterns for common authorization checks
 */

import { getSessionUser, hasRole, canAccessBarangay } from './getSessionUser';

/**
 * Middleware-style permission check for API routes
 *
 * Usage in API route:
 * ```
 * const user = await requireAuth(request);
 * const admin = await requireRole(request, 'MDRRMC-Admin');
 * const sameBarangay = await requireBarangay(request, targetBarangay);
 * ```
 */

/**
 * Require validated session user
 * Returns user object or throws response error
 * @returns {Promise<Object>} User object { uid, role, profile, barangay, ... }
 * @throws {Object} { status: 401, error: string } if not authenticated
 */
export async function requireAuth() {
  const user = await getSessionUser();

  if (!user) {
    throw {
      status: 401,
      error: 'Unauthorized: Invalid or expired session',
    };
  }

  return user;
}

/**
 * Require specific role(s)
 * @param {string|string[]} requiredRoles - Role(s) needed
 * @returns {Promise<Object>} User object if authorized
 * @throws {Object} { status: 403, error: string } if forbidden
 */
export async function requireRole(requiredRoles) {
  const user = await requireAuth();

  if (!hasRole(user.role, requiredRoles)) {
    throw {
      status: 403,
      error: `Forbidden: Requires role ${Array.isArray(requiredRoles) ? requiredRoles.join(' or ') : requiredRoles}`,
    };
  }

  return user;
}

/**
 * Require admin role
 * @returns {Promise<Object>} User object if admin
 * @throws {Object} { status: 403, error: string } if not admin
 */
export async function requireAdmin() {
  return requireRole('MDRRMC-Admin');
}

/**
 * Require barangay-level access
 * For Secretaries: must be their own barangay
 * For Admin/Personnel: any barangay
 * @param {string} targetBarangay - Barangay being accessed
 * @returns {Promise<Object>} User object if can access
 * @throws {Object} { status: 403, error: string } if forbidden
 */
export async function requireBarangayAccess(targetBarangay) {
  const user = await requireAuth();

  if (!canAccessBarangay(user.role, user.barangay, targetBarangay)) {
    throw {
      status: 403,
      error: `Forbidden: No access to barangay ${targetBarangay}`,
    };
  }

  return user;
}

/**
 * Require multiple conditions at once
 * @param {Object} options - { roles, barangay }
 * @returns {Promise<Object>} User object if all conditions met
 * @throws {Object} { status, error: string } if any condition fails
 *
 * Usage:
 * ```
 * const user = await requireAuthMultiple({ 
 *   roles: ['MDRRMC-Admin', 'MDRRMC-Personnel'],
 *   barangay: 'Bauan'
 * });
 * ```
 */
export async function requireAuthMultiple(options = {}) {
  let user = await requireAuth();

  if (options.roles) {
    user = await requireRole(options.roles);
  }

  if (options.barangay) {
    user = await requireBarangayAccess(options.barangay);
  }

  return user;
}

/**
 * Safe permission check that returns null instead of throwing
 * Useful for optional authorization checks
 * @returns {Promise<Object|null>} User object or null if unauthorized
 *
 * Usage:
 * ```
 * const user = await checkAuth();
 * if (user && user.role === 'MDRRMC-Admin') {
 *   // User is admin
 * }
 * ```
 */
export async function checkAuth() {
  try {
    return await getSessionUser();
  } catch {
    return null;
  }
}

/**
 * Check if user is admin (returns boolean)
 * @returns {Promise<boolean>}
 * @example
 * if (await isAdmin()) { ... }
 */
export async function isAdmin() {
  try {
    const user = await requireAuth();
    return user.role === 'MDRRMC-Admin';
  } catch {
    return false;
  }
}

/**
 * Check if user is secretary (returns boolean)
 * @returns {Promise<boolean>}
 */
export async function isSecretary() {
  try {
    const user = await requireAuth();
    return user.role === 'Brgy-Secretary';
  } catch {
    return false;
  }
}

/**
 * Check if user is personnel (returns boolean)
 * @returns {Promise<boolean>}
 */
export async function isPersonnel() {
  try {
    const user = await requireAuth();
    return user.role === 'MDRRMC-Personnel';
  } catch {
    return false;
  }
}

/**
 * Helper error response maker for API routes
 * Usage: return makeErrorResponse(403, 'Forbidden reason')
 * @param {number} status
 * @param {string} error
 * @returns {Object} JSON response
 */
export function makeErrorResponse(status, error) {
  return {
    status,
    body: { error, authenticated: false },
  };
}

/**
 * Helper success response maker for API routes
 * @param {Object} data
 * @returns {Object} JSON response
 */
export function makeSuccessResponse(data = {}) {
  return {
    status: 200,
    body: { ...data, success: true },
  };
}
