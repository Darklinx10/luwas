'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  updateDoc,
  setDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { toast } from 'react-toastify';

export const useUserViewModel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  //----------------------------------
  // FETCH USERS
  //----------------------------------

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const snapshot = await getDocs(collection(db, 'users'));

      const data = snapshot.docs
        .filter(docSnap =>
          ['Brgy-Secretary', 'MDRRMC-Personnel'].includes(docSnap.data().role)
        )
        .map(docSnap => {
          const data = docSnap.data();

          const fullName = [
            data.firstName,
            data.middleName,
            data.lastName,
          ]
            .filter(Boolean)
            .join(' ');

          return {
            id: docSnap.id,
            ...data,
            fullName,
          };
        });

      setUsers(data);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  //----------------------------------
  // ADD USER
  //----------------------------------

  const addUser = async (newUser) => {
    if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
      toast.error('Please fill required fields');
      return false;
    }

    try {
      setSaving(true);

      const res = await fetch('/api/createUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          displayName: `${newUser.firstName} ${newUser.middleName || ''} ${newUser.lastName}`.trim(),
          role: newUser.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'User creation failed');
        return false;
      }

      await setDoc(doc(db, 'users', data.uid), {
        firstName: newUser.firstName,
        middleName: newUser.middleName,
        lastName: newUser.lastName,
        email: newUser.email,
        contactNumber: newUser.contactNumber,
        barangay: newUser.barangay,
        role: newUser.role,
      });

      toast.success('User created successfully');
      await fetchUsers();
      return true;

    } catch (error) {
      toast.error(error.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  //----------------------------------
  // EDIT USER
  //----------------------------------

  const editUser = async (user) => {
    try {
      setSaving(true);

      const { id, fullName, ...data } = user;
      await updateDoc(doc(db, 'users', id), data);

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

  //----------------------------------
  // DELETE USER
  //----------------------------------

  const deleteUser = async (userId) => {
    try {
      const res = await fetch('/api/deleteUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Delete failed');
        return false;
      }

      toast.success('User deleted');
      await fetchUsers();
      return true;
    } catch {
      toast.error('Failed to delete user');
      return false;
    }
  };

  //----------------------------------

  return {
    users,
    loading,
    saving,
    addUser,
    editUser,
    deleteUser,
  };
};