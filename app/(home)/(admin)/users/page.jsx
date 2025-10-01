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
import { db } from '@/firebase/config';
import { FiSearch, FiPlus } from 'react-icons/fi';
import RoleGuard from '@/components/roleGuard';
import { toast } from 'react-toastify';
import UserModal from './components/UserModal';
import UserTable from './components/UserTable';


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


  // Loading states for different operations
  const [loading, setLoading] = useState(false); // for fetching users & editing
  const [saving, setSaving] = useState(false); // for saving user in modal
  const [loadingAddModal, setLoadingAddModal] = useState(false); // for "Add User" button
  

  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'users'));
  
      // Use Promise.all to handle potential async operations per user
      const usersData = await Promise.all(
        querySnapshot.docs
          .filter((docSnap) => {
            const role = docSnap.data().role;
            return ['Brgy-Secretary', 'MDRRMC-Personnel'].includes(role);
          })
          .map(async (docSnap) => {
            const data = docSnap.data();
  
            // Build full name
            const fullName = [data.firstName, data.middleName, data.lastName]
              .filter(Boolean)
              .join(' ');
  
            // Example async operation per user (optional)
            // const extraDoc = await getDoc(doc(db, 'extraCollection', docSnap.id));
            // const extraData = extraDoc.exists() ? extraDoc.data() : {};
  
            return {
              id: docSnap.id,
              ...data,
              fullName,
              // ...extraData
            };
          })
      );
  
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };
  
  // Load user list when component mounts
  useEffect(() => {
    fetchUsers();
  }, []);
  

  // Opens edit modal and pre-fills selected user's data
  const handleEdit = (user) => {
    setSelectedUser({ ...user });
    setShowModal(true);
  };

  // Adds a new user to Firebase Auth + Firestore
  const handleAddUser = async () => {
    // Simple validation for required fields
    if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      setSaving(true);

      // Create Firebase Auth user via API
      const res = await fetch('/api/createUser', { // ✅ fixed endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          displayName: `${newUser.firstName} ${newUser.middleName || ''} ${newUser.lastName}`.trim(),
          role: newUser.role
        }),
      });

      const data = await res.json();

      // If API returns error, stop execution
      if (!res.ok) {
        toast.error(data.error || 'Failed to create user.');
        return;
      }

      // Store Firestore profile with UID as document ID
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

      //  Refresh lists and profile
      await fetchUsers();
      

      //  Reset form
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

  // Saves changes to an existing user's profile
  const handleSaveEdit = async () => {
    if (!selectedUser?.id) return;

    try {
      setSaving(true);
      const userRef = doc(db, 'users', selectedUser.id);
      const { fullName, id, ...dataToUpdate } = selectedUser;
      await updateDoc(userRef, dataToUpdate);

      toast.success('User updated successfully.');
      setShowModal(false);

      await fetchUsers();           // ✅ refresh list
      

    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  // Deletes a user document from Firestore
  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await deleteDoc(doc(db, 'users', userId));
      toast.success('User deleted successfully.');

      await fetchUsers();           // ✅ refresh list
      

    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user.');
    }
  };

  // Filters users list based on search input
  const filteredUsers = users.filter((user) =>
    `${user.fullName} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <RoleGuard allowedRoles={['MDRRMC-Admin']}>
      <div className="p-4 ">
        <div className="text-sm text-right text-gray-500 mb-2">
          Home / User Management
        </div>

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
            className="flex items-center gap-2 px-4 py-2 rounded text-white bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loadingAddModal}
          >
            {loadingAddModal ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                  />
                </svg>
                Loading...
              </span>
            ) : (
              <>
                <FiPlus />
                Add User
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