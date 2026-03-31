'use client';

/**
 * /features/UserManagement/hooks/useUsers.js
 *
 * User Management Hook
 * Handles state for user listing, creation, editing, and deletion
 * All operations use protected server APIs
 */

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { PAGE_SIZE } from '@/constant/pagination';
import { userService } from '../services/userService';

const defaultNewUser = {
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  password: '',
  contactNumber: '',
  municipality: '',
  barangay: '',
  role: 'Brgy-Secretary',
};

export function useUsers() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL state for pagination and search
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const urlSearchTerm = searchParams.get('search') || '';

  // Local state for input control (debounced)
  const [searchInput, setSearchInput] = useState(urlSearchTerm);

  // User data state
  const [users, setUsers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingAddModal, setLoadingAddModal] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState(defaultNewUser);

  /**
   * Update URL parameters for pagination and search
   */
  const updateUrlParams = useCallback(
    (updates = {}) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '' || value === 1) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname);
    },
    [router, pathname, searchParams]
  );

  /**
   * Set current page
   */
  const setPage = useCallback(
    (value) => {
      const nextPage = typeof value === 'function' ? value(page) : value;
      updateUrlParams({ page: Math.max(1, nextPage) });
    },
    [page, updateUrlParams]
  );

  /**
   * Sync search input with URL
   */
  useEffect(() => {
    setSearchInput(urlSearchTerm);
  }, [urlSearchTerm]);

  /**
   * Debounce search input changes
   */
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== urlSearchTerm) {
        updateUrlParams({
          search: searchInput.trim(),
          page: 1,
        });
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [searchInput, urlSearchTerm, updateUrlParams]);

  /**
   * Fetch users from server API
   */
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const result = await userService.fetchUsers({
        page,
        limitSize: PAGE_SIZE,
        search: urlSearchTerm,
      });

      setUsers(result.users);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  }, [page, urlSearchTerm]);

  /**
   * Fetch users when page or search changes
   */
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /**
   * Reset to last valid page if current page exceeds totalPages
   */
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      updateUrlParams({ page: totalPages });
    }
  }, [page, totalPages, updateUrlParams]);

  /**
   * Edit user handler
   */
  const handleEdit = (user) => {
    setSelectedUser({ ...user });
    setShowModal(true);
  };

  /**
   * Open add user modal
   */
  const openAddModal = () => {
    setLoadingAddModal(true);
    setShowAddModal(true);

    setTimeout(() => {
      setLoadingAddModal(false);
    }, 500);
  };

  /**
   * Close edit modal
   */
  const closeEditModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  /**
   * Close add modal
   */
  const closeAddModal = () => {
    setShowAddModal(false);
    setNewUser(defaultNewUser);
  };

  /**
   * Create new user
   */
  const addUser = async () => {
    // Validate required fields
    if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (!newUser.barangay) {
      toast.error('Please select a barangay.');
      return;
    }

    try {
      setSaving(true);
      await userService.createUser(newUser);
      toast.success('User created successfully!');

      closeAddModal();
      setSearchInput('');
      updateUrlParams({ search: '', page: 1 });
      await fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Save user edits
   */
  const saveEditUser = async () => {
    if (!selectedUser?.id) return;

    try {
      setSaving(true);
      await userService.updateUser(selectedUser);
      toast.success('User updated successfully.');
      closeEditModal();
      await fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Delete user
   */
  const deleteUser = async (userId) => {
    const confirmed = window.confirm('Are you sure you want to delete this user?');
    if (!confirmed) return;

    try {
      await userService.deleteUser(userId);
      toast.success('User deleted successfully.');

      // Refresh user list
      const result = await userService.fetchUsers({
        page,
        limitSize: PAGE_SIZE,
        search: urlSearchTerm,
      });

      // Adjust page if it exceeds totalPages
      if (page > result.totalPages && result.totalPages > 0) {
        updateUrlParams({ page: result.totalPages });
      } else {
        setUsers(result.users);
        setTotalPages(result.totalPages);
        setTotalCount(result.totalCount);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user.');
    }
  };

  return {
    // User data
    users,
    searchTerm: searchInput,
    setSearchTerm: setSearchInput,

    // Loading states
    loading,
    saving,
    loadingAddModal,

    // Modal states
    showModal,
    setShowModal,
    showAddModal,
    setShowAddModal,

    // Form states
    selectedUser,
    setSelectedUser,
    newUser,
    setNewUser,

    // Pagination
    page,
    totalPages,
    totalCount,
    paginatedUsers: users,

    // Methods
    handleEdit,
    openAddModal,
    closeEditModal,
    closeAddModal,
    addUser,
    saveEditUser,
    deleteUser,
    setPage,

    // Constants
    PAGE_SIZE,
  };
}