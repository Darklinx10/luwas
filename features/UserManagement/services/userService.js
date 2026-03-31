/**
 * /features/UserManagement/services/userService.js
 *
 * User Management API Client
 * Provides methods to interact with protected /api/users endpoints
 *
 * All operations are server-protected:
 * - Admin-only access verified on server
 * - Comprehensive input validation on server
 * - Atomic operations (create/delete)
 * - Server-side pagination and search
 *
 * This service NEVER uses Firebase Client SDK for admin operations.
 * All data flows through protected APIs.
 */

const DEFAULT_PAGE_SIZE = 10;

/**
 * Fetch users with server-side pagination and search
 * GET /api/users?page=1&limit=10&search=term
 */
export const userService = {
  async fetchUsers({ page = 1, limitSize = DEFAULT_PAGE_SIZE, search = '' } = {}) {
    try {
      const params = new URLSearchParams({
        page: Math.max(1, Number(page) || 1),
        limit: Math.min(Number(limitSize) || DEFAULT_PAGE_SIZE, 100),
        ...(search && { search: search.trim() }),
      });

      const response = await fetch(`/api/users?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch users');
      }

      const data = await response.json();
      return {
        users: data.users || [],
        page: data.page,
        limitSize: data.limit,
        totalCount: data.totalCount,
        totalPages: data.totalPages,
        hasPrevPage: data.hasPrevPage,
        hasNextPage: data.hasNextPage,
      };
    } catch (error) {
      console.error('fetchUsers error:', error);
      throw error;
    }
  },

  /**
   * Get single user details
   * GET /api/users/[userId]
   */
  async getUser(userId) {
    try {
      if (!userId) throw new Error('User ID is required');

      const response = await fetch(`/api/users/${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch user');
      }

      return await response.json();
    } catch (error) {
      console.error('getUser error:', error);
      throw error;
    }
  },

  /**
   * Create new user (Auth + Firestore)
   * POST /api/users
   */
  async createUser(userData) {
    try {
      // Validate required fields on client first
      if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
        throw new Error('Missing required fields');
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: userData.firstName,
          middleName: userData.middleName || '',
          lastName: userData.lastName,
          email: userData.email,
          password: userData.password,
          role: userData.role,
          barangay: userData.barangay || '',
          municipality: userData.municipality || '',
          contactNumber: userData.contactNumber || '',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }

      return await response.json();
    } catch (error) {
      console.error('createUser error:', error);
      throw error;
    }
  },

  /**
   * Update user profile
   * PATCH /api/users/[userId]
   * Editable fields: firstName, lastName, middleName, contactNumber, barangay, municipality
   */
  async updateUser(user) {
    try {
      if (!user?.id) throw new Error('User ID is required');

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: user.firstName,
          middleName: user.middleName || '',
          lastName: user.lastName,
          contactNumber: user.contactNumber || '',
          barangay: user.barangay || '',
          municipality: user.municipality || '',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      return await response.json();
    } catch (error) {
      console.error('updateUser error:', error);
      throw error;
    }
  },

  /**
   * Delete user (Auth + Firestore atomically)
   * DELETE /api/users/[userId]
   */
  async deleteUser(userId) {
    try {
      if (!userId) throw new Error('User ID is required');

      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      return await response.json();
    } catch (error) {
      console.error('deleteUser error:', error);
      throw error;
    }
  },
};