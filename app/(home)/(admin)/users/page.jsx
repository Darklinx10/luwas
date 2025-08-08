'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  addDoc,
} from 'firebase/firestore';
import { db, auth } from '@/firebase/config';
import { FiSearch, FiPlus, FiEdit, FiTrash2, FiX } from 'react-icons/fi';
import RoleGuard from '@/components/roleGuard';
import { toast } from 'react-toastify';
import { createUserWithEmailAndPassword } from 'firebase/auth';

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
    role: 'Secretary',
  });

  const [loading, setLoading] = useState(false); // for fetching users & editing
  const [saving, setSaving] = useState(false); // for saving user in modal
  const [loadingAddModal, setLoadingAddModal] = useState(false); // for "Add User" button

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs
        .map((docSnap) => {
          const data = docSnap.data();
          const fullName = [data.firstName, data.middleName, data.lastName]
            .filter(Boolean)
            .join(' ');
          return {
            id: docSnap.id,
            ...data,
            fullName,
          };
        })
        .filter((user) => ['Secretary', 'OfficeStaff'].includes(user.role));

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

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await deleteDoc(doc(db, 'users', userId));
      toast.success('User deleted successfully.');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user.');
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
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddUser = async () => {
    const { firstName, lastName, email, password, contactNumber, role, middleName, barangay } = newUser;

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      toast.error('First name, last name, email, and password are required.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Please enter a valid email.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }
    if (contactNumber && !/^0\d{10}$/.test(contactNumber)) {
      toast.error('Contact number must be 11 digits and start with 0.');
      return;
    }

    try {
      setSaving(true);

      const res = await fetch('/api/createUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          displayName: `${firstName.trim()} ${lastName.trim()}`,
          role,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.error || 'Failed to create account.');
        return;
      }

      const data = await res.json();
      const uid = data.uid;

      // Add user info to Firestore as well
      const userToAdd = {
        uid,
        firstName: firstName.trim(),
        middleName: middleName.trim() || '',
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        contactNumber: contactNumber || '',
        barangay: barangay || '',
        role,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'users'), userToAdd);

      toast.success('User account created successfully.');

      setShowAddModal(false);
      setNewUser({
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        password: '',
        contactNumber: '',
        barangay: '',
        role: 'Secretary',
      });

      // Refresh user list
      fetchUsers();
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error('Failed to create account.');
    } finally {
      setSaving(false);
    }
  };


  const filteredUsers = users.filter((user) =>
    `${user.fullName} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <RoleGuard allowedRoles={['SeniorAdmin']}>
      <div className="p-4">
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

        <div className="overflow-x-auto shadow border-t-0 rounded-b-md bg-white p-4">
          {filteredUsers.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              {loading ? 'Loading users...' : 'No users found.'}
            </p>
          ) : (
            <table className="w-full text-sm text-center">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Barangay</th>
                  <th className="p-2 border">Role</th>
                  <th className="p-2 border">Contact Number</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="p-2 border">{user.fullName || 'N/A'}</td>
                    <td className="p-2 border">{user.email}</td>
                    <td className="p-2 border">{user.barangay || 'N/A'}</td>
                    <td className="p-2 border">{user.role}</td>
                    <td className="p-2 border">{user.contactNumber}</td>
                    <td className="p-2 border text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <FiEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

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

const UserModal = ({ user, setUser, onClose, onSave, saving, mode }) => {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-black"
          onClick={onClose}
          aria-label="Close modal"
        >
          <FiX />
        </button>
        <h2 className="text-lg font-bold mb-4">
          {mode === 'edit' ? 'Edit User Info' : 'Add New Secretary'}
        </h2>

        <div className="space-y-3">
          <Input
            label="First Name"
            id="firstName"
            value={user.firstName}
            onChange={(v) => setUser((p) => ({ ...p, firstName: v }))}
            autoComplete="given-name"
            placeholder="Enter first name"
          />
          <Input
            label="Middle Name"
            id="middleName"
            value={user.middleName}
            onChange={(v) => setUser((p) => ({ ...p, middleName: v }))}
            autoComplete="additional-name"
            placeholder="Enter middle name"
          />
          <Input
            label="Last Name"
            id="lastName"
            value={user.lastName}
            onChange={(v) => setUser((p) => ({ ...p, lastName: v }))}
            autoComplete="family-name"
            placeholder="Enter last name"
          />
          <Input
            label="Contact Number"
            id="contactNumber"
            value={user.contactNumber}
            onChange={(v) => {
              if ((v === '' || /^0\d{0,10}$/.test(v)) && v.length <= 11) {
                setUser((p) => ({ ...p, contactNumber: v }));
              }
            }}
            type="tel"
            autoComplete="tel"
            placeholder="Enter contact number"
          />
          <Input
            label="Barangay"
            id="barangay"
            value={user.barangay}
            onChange={(v) => setUser((p) => ({ ...p, barangay: v }))}
            autoComplete="address-level3"
            placeholder="Enter barangay"
          />
          <Input
            label="Email"
            id="email"
            value={user.email}
            onChange={(v) => setUser((p) => ({ ...p, email: v }))}
            type="email"
            autoComplete="email"
            placeholder="Enter email address"
            disabled={mode === 'edit'}
          />

          {mode === 'add' && (
            <>
              <Input
                label="Password"
                id="password"
                type="password"
                value={user.password}
                onChange={(v) => setUser((p) => ({ ...p, password: v }))}
                autoComplete="new-password"
                placeholder="Enter password"
              />
              <div>
                <label htmlFor="role" className="block text-sm font-medium">
                  Role
                </label>
                <select
                  id="role"
                  value={user.role}
                  onChange={(e) => setUser((p) => ({ ...p, role: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="Secretary">Secretary</option>
                  <option value="OfficeStaff">Office Staff</option>
                </select>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className={`px-4 py-2 text-white rounded flex items-center gap-2 ${
                saving
                  ? 'bg-green-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {saving ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
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
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Input = ({ label, id, value, onChange, type = 'text', autoComplete, placeholder, disabled = false }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium">
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      autoComplete={autoComplete}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full border rounded px-3 py-2 ${
        disabled ? 'bg-gray-100 cursor-not-allowed' : ''
      }`}
    />
  </div>
);

export default UserManagementPage;
