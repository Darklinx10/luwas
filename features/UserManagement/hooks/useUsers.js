'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingAddModal, setLoadingAddModal] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState(defaultNewUser);

  const [page, setPage] = useState(1);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.fetchUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) return users;

    return users.filter((user) =>
      `${user.fullName} ${user.email} ${user.contactNumber || ''} ${user.barangay || ''} ${user.role || ''}`
        .toLowerCase()
        .includes(keyword)
    );
  }, [users, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredUsers.slice(start, end);
  }, [filteredUsers, page]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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
      setSearchTerm('');
      await fetchUsers();
      setPage(1);
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

      const updatedUsers = users.filter((user) => user.id !== userId);
      setUsers(updatedUsers);

      const updatedFiltered = updatedUsers.filter((user) =>
        `${user.fullName} ${user.email} ${user.contactNumber || ''} ${user.barangay || ''} ${user.role || ''}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );

      const updatedTotalPages = Math.max(1, Math.ceil(updatedFiltered.length / PAGE_SIZE));
      if (page > updatedTotalPages) {
        setPage(updatedTotalPages);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user.');
    }
  };

  return {
    users,
    searchTerm,
    setSearchTerm,

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
    paginatedUsers,
    filteredUsers,

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