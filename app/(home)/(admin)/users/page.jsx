'use client';

import { useState } from 'react';
import { FiSearch, FiPlus } from 'react-icons/fi';
import RoleGuard from '@/components/roleGuard';
import UserModal from './components/UserModal';
import UserTable from './components/UserTable';
import { useUserViewModel } from '@/hooks/useUserViewModel';

const UserManagementPage = () => {

  const {
    users,
    loading,
    saving,
    addUser,
    editUser,
    deleteUser,
  } = useUserViewModel();

  // UI STATE ONLY
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
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

  //----------------------------------
  // UI HANDLERS
  //----------------------------------

  const handleAdd = async () => {
    const success = await addUser(newUser);
    if (success) {
      setShowAddModal(false);
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
    }
  };

  const handleEditSave = async () => {
    const success = await editUser(selectedUser);
    if (success) setShowEditModal(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    await deleteUser(id);
  };

  //----------------------------------

  const filteredUsers = users.filter(user =>
    `${user.fullName} ${user.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  //----------------------------------

  return (
    <RoleGuard allowedRoles={['MDRRMC-Admin']}>
      <div className="p-4">

        <div className="text-sm text-right text-gray-500 mb-2">
          Home / User Management
        </div>

        <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-semibold text-lg">
          User Accounts Management
        </div>

        <div className="flex justify-between bg-white shadow px-4 py-3">

          <div className="relative w-full max-w-md">
            <FiSearch className="absolute top-2.5 left-3 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border rounded-md"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded"
          >
            <FiPlus />
            Add User
          </button>
        </div>

        <UserTable
          loading={loading}
          filteredUsers={filteredUsers}
          handleEdit={(user) => {
            setSelectedUser(user);
            setShowEditModal(true);
          }}
          handleDelete={handleDelete}
        />

        {showEditModal && selectedUser && (
          <UserModal
            user={selectedUser}
            setUser={setSelectedUser}
            onClose={() => setShowEditModal(false)}
            onSave={handleEditSave}
            saving={saving}
            mode="edit"
          />
        )}

        {showAddModal && (
          <UserModal
            user={newUser}
            setUser={setNewUser}
            onClose={() => setShowAddModal(false)}
            onSave={handleAdd}
            saving={saving}
            mode="add"
          />
        )}
      </div>
    </RoleGuard>
  );
};

export default UserManagementPage;