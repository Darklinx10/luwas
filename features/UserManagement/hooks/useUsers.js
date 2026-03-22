'use client';

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
  barangay: '',
  role: 'Brgy-Secretary',
};

export function useUsers() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const urlSearchTerm = searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(urlSearchTerm);

  const [users, setUsers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingAddModal, setLoadingAddModal] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState(defaultNewUser);

  const updateUrlParams = useCallback(
    (updates = {}) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (
          value === undefined ||
          value === null ||
          value === '' ||
          value === 1
        ) {
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

  const setPage = useCallback(
    (value) => {
      const nextPage = typeof value === 'function' ? value(page) : value;
      updateUrlParams({ page: Math.max(1, nextPage) });
    },
    [page, updateUrlParams]
  );

  useEffect(() => {
    setSearchInput(urlSearchTerm);
  }, [urlSearchTerm]);

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

  const fetchUsers = useCallback(async () => {
    try {
     

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

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      updateUrlParams({ page: totalPages });
    }
  }, [page, totalPages, updateUrlParams]);

  const handleEdit = (user) => {
    setSelectedUser({ ...user });
    setShowModal(true);
  };

  const openAddModal = () => {
    setLoadingAddModal(true);
    setShowAddModal(true);

    setTimeout(() => {
      setLoadingAddModal(false);
    }, 500);
  };

  const closeEditModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setNewUser(defaultNewUser);
  };

  const addUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
      toast.error('Please fill in all required fields.');
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
      toast.error(error.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

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

  const deleteUser = async (userId) => {
    const confirmed = window.confirm('Are you sure you want to delete this user?');
    if (!confirmed) return;

    try {
      await userService.deleteUser(userId);
      toast.success('User deleted successfully.');

      const result = await userService.fetchUsers({
        page,
        limitSize: PAGE_SIZE,
        search: urlSearchTerm,
      });

      if (page > result.totalPages) {
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
    users,
    searchTerm: searchInput,
    setSearchTerm: setSearchInput,

    loading,
    saving,
    loadingAddModal,

    showModal,
    setShowModal,
    showAddModal,
    setShowAddModal,

    selectedUser,
    setSelectedUser,
    newUser,
    setNewUser,

    page,
    totalPages,
    totalCount,
    paginatedUsers: users,

    handleEdit,
    openAddModal,
    closeEditModal,
    closeAddModal,

    addUser,
    saveEditUser,
    deleteUser,

    setPage,
    PAGE_SIZE,
  };
}