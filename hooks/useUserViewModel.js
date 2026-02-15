// hooks/useUserViewModel.js
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getUsers, updateUser, createUserProfile, deleteUserById } from '@/services/userServices';

export const useUserViewModel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Add user
  const addUser = async (newUser, authUid) => {
    if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
      toast.error('Please fill required fields');
      return false;
    }
    try {
      setSaving(true);
      await createUserProfile(authUid, newUser); // Pass uid from /api/createUser
      toast.success('User created successfully');
      await fetchUsers();
      return true;
    } catch (error) {
      toast.error(error.message || 'Failed to create user');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Edit user
  const editUser = async (user) => {
    try {
      setSaving(true);
      const { id, fullName, ...data } = user;
      await updateUser(id, data);
      toast.success('User updated successfully');
      await fetchUsers();
      return true;
    } catch {
      toast.error('Failed to update user');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Delete user
  const deleteUser = async (id) => {
    try {
      setSaving(true);
      await deleteUserById(id);
      toast.success('User deleted successfully');
      await fetchUsers();
      return true;
    } catch (error) {
      toast.error(error.message || 'Failed to delete user');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    users,
    loading,
    saving,
    fetchUsers,
    addUser,
    editUser,
    deleteUser,
  };
};