'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { FiSearch, FiPlus } from 'react-icons/fi';
import RoleGuard from '@/components/roleGuard';
import { toast } from 'react-toastify';
import UserModal from '../users/components/UserModal';
import UserTable from '../users/components/UserTable';
import LoadingSpinner from '@/components/LoadingSpinner';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    password: '',
    contactNumber: '',
    barangay: '',
    role: 'Brgy-Secretary',
  });

  // Loading states
  const [loading, setLoading] = useState(true); // main spinner for fetch
  const [saving, setSaving] = useState(false); // for saving user in modal
  const [loadingAddModal, setLoadingAddModal] = useState(false); // for "Add User" button

  // Fetch users from Firestore
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'users'));

      const usersData = querySnapshot.docs
        .filter((docSnap) => {
          const role = docSnap.data().role;
          return ['Brgy-Secretary', 'MDRRMC-Personnel'].includes(role);
        })
        .map((docSnap) => {
          const data = docSnap.data();
          const fullName = [data.firstName, data.middleName, data.lastName]
            .filter(Boolean)
            .join(' ');
          return { id: docSnap.id, ...data, fullName };
        });

      setUsers(usersData);
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

  const handleEdit = (user) => {
    setSelectedUser({ ...user });
    setShowModal(true);
  };

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
      toast.error('Please fill in all required fields.');
      return;
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
        toast.error(data.error || 'Failed to create user.');
        return;
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

      toast.success('User created successfully!');
      setShowAddModal(false);
      setSearchTerm('');
      await fetchUsers();

      setNewUser({
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        password: '',
        contactNumber: '',
        barangay: '',
        role: 'Brgy-Secretary',
      });
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedUser?.id) return;

    try {
      setSaving(true);
      const userRef = doc(db, 'users', selectedUser.id);
      const { fullName, id, ...dataToUpdate } = selectedUser;
      await updateDoc(userRef, dataToUpdate);

      toast.success('User updated successfully.');
      setShowModal(false);
      await fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const res = await fetch('/api/deleteUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to delete user.');
        return;
      }

      toast.success('User deleted successfully.');
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user.');
    }
  };

  const filteredUsers = users.filter((user) =>
    `${user.fullName} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Full-page spinner with no text
  if (loading) return <LoadingSpinner />;

  return (
    <RoleGuard allowedRoles={['MDRRMC-Admin']}>
      <div className="p-4">
        <div className="text-sm text-right text-gray-500 mb-2">Home / User Management</div>

        <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-semibold text-lg flex justify-between items-center">
          <span>User Accounts Management</span>
        </div>

        <div className="flex items-center justify-between bg-white shadow px-4 py-3">
          <div className="relative w-full max-w-md">
            <FiSearch className="absolute top-2.5 left-3 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <button
            onClick={() => {
              setLoadingAddModal(true);
              setShowAddModal(true);
              setTimeout(() => setLoadingAddModal(false), 800);
            }}
            disabled={loadingAddModal}
            className="group relative flex items-center justify-center gap-2 px-4 py-2 rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loadingAddModal ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
              </span>
            ) : (
              <>
                <FiPlus className="text-lg transform group-hover:scale-110 transition-transform duration-200" />
                <span className="hidden md:inline">Add User</span>
                <span className="absolute top-full mt-2 px-2 py-1 rounded-md bg-gray-800 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap md:hidden">
                  Add User
                </span>
              </>
            )}
          </button>
        </div>

        <UserTable
          loading={loading}
          filteredUsers={filteredUsers}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
        />

        {showModal && selectedUser && (
          <UserModal
            user={selectedUser}
            setUser={setSelectedUser}
            onClose={() => setShowModal(false)}
            onSave={handleSaveEdit}
            saving={saving}
            mode="edit"
          />
        )}

        {showAddModal && (
          <UserModal
            user={newUser}
            setUser={setNewUser}
            onClose={() => setShowAddModal(false)}
            onSave={handleAddUser}
            saving={saving}
            mode="add"
          />
        )}
      </div>
    </RoleGuard>
  );
};

export default UserManagementPage;
