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
  import {
    FiSearch,
    FiPlus,
    FiEdit,
    FiTrash2,
    FiX,
  } from 'react-icons/fi';
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
    });
    const [loading, setLoading] = useState(false);

    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersData = querySnapshot.docs
          .map((doc) => {
            const data = doc.data();
            const fullName = [data.firstName, data.middleName, data.lastName]
              .filter(Boolean)
              .join(' ');
            return {
              id: doc.id,
              ...data,
              fullName,
            };
          })
          .filter((user) => user.role === 'Secretary');

        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to fetch users.');
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
      const confirmed = confirm('Are you sure you want to delete this user?');
      if (!confirmed) return;

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
        setLoading(true);
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
        setLoading(false);
      }
    };

    const handleAddUser = async () => {
      if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.password) {
        toast.error('First name, last name, email, and password are required.');
        return;
      }

      try {
        setLoading(true);

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          newUser.email,
          newUser.password
        );
        const { uid } = userCredential.user;

        const userToAdd = {
          uid,
          firstName: newUser.firstName,
          middleName: newUser.middleName,
          lastName: newUser.lastName,
          email: newUser.email,
          contactNumber: newUser.contactNumber,
          barangay: newUser.barangay,
          role: 'Secretary',
          createdAt: new Date().toISOString(),
        };

        await addDoc(collection(db, 'users'), userToAdd);

        toast.success('Secretary account created successfully.');
        setShowAddModal(false);
        setNewUser({
          firstName: '',
          middleName: '',
          lastName: '',
          email: '',
          password: '',
          contactNumber: '',
          barangay: '',
        });
        fetchUsers();
      } catch (error) {
        console.error('Error creating account:', error);
        if (error.code === 'auth/email-already-in-use') {
          toast.error('Email already in use.');
        } else {
          toast.error('Failed to create account.');
        }
      } finally {
        setLoading(false);
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
            <span>Barangay Secretary Accounts</span>
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
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded"
            >
              <FiPlus />
              Add Secretary
            </button>
          </div>

          <div className="overflow-x-auto shadow border-t-0 rounded-b-md bg-white p-4">
            {filteredUsers.length === 0 ? (
              <p className="text-center text-gray-500 py-6">
                No secretary users found.
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
                            className="text-blue-600 hover:text-blue-800 cursor-pointer"
                            title="Edit"
                          >
                            <FiEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-800 cursor-pointer"
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
              onClose={() => setShowModal(false)}
              onSave={handleSaveEdit}
              loading={loading}
              setUser={setSelectedUser}
              mode="edit"
            />
          )}

          {showAddModal && (
            <UserModal
              user={newUser}
              onClose={() => setShowAddModal(false)}
              onSave={handleAddUser}
              loading={loading}
              setUser={setNewUser}
              mode="add"
            />
          )}
        </div>
      </RoleGuard>
    );
  };

  const UserModal = ({ user, setUser, onClose, onSave, loading, mode }) => {
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl relative">
          <button
            className="absolute top-2 right-2 text-gray-500 hover:text-black"
            onClick={onClose}
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
            />
            <Input
              label="Middle Name"
              id="middleName"
              value={user.middleName}
              onChange={(v) => setUser((p) => ({ ...p, middleName: v }))}
              autoComplete="additional-name"
            />
            <Input
              label="Last Name"
              id="lastName"
              value={user.lastName}
              onChange={(v) => setUser((p) => ({ ...p, lastName: v }))}
              autoComplete="family-name"
            />
            <Input
              label="Email"
              id="email"
              value={user.email}
              onChange={(v) => setUser((p) => ({ ...p, email: v }))}
              type="email"
              autoComplete="email"
            />
            <Input
              label="Contact Number"
              id="contactNumber"
              value={user.contactNumber}
              onChange={(v) => setUser((p) => ({ ...p, contactNumber: v }))}
              type="tel"
              autoComplete="tel"
            />
            <Input
              label="Barangay"
              id="barangay"
              value={user.barangay}
              onChange={(v) => setUser((p) => ({ ...p, barangay: v }))}
              autoComplete="address-level3"
            />
            {mode === 'add' && (
              <Input
                label="Password"
                id="password"
                type="password"
                value={user.password}
                onChange={(v) => setUser((p) => ({ ...p, password: v }))}
                autoComplete="new-password"
              />
            )}

            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={loading}
                className={`px-4 py-2 text-white rounded flex items-center justify-center gap-2 transition ${
                  loading
                    ? 'bg-green-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 cursor-pointer'
                }`}
              >
                {loading ? (
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

  const Input = ({ label, id, value, onChange, type = 'text', autoComplete }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="w-full border rounded px-3 py-2"
      />
    </div>
  );

export default UserManagementPage;