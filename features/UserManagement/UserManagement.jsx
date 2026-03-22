'use client';

import { FiPlus, FiSearch } from 'react-icons/fi';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '../Pagination/Pagination';
import UserModal from './components/UserModal';
import UserTable from './components/UserTable';
import { useUsers } from './hooks/useUsers';

export default function UserManagement() {
  const {
    searchTerm,
    setSearchTerm,

    loading,
    saving,
    loadingAddModal,

    showModal,
    showAddModal,

    selectedUser,
    setSelectedUser,
    newUser,
    setNewUser,

    page,
    totalPages,
    totalCount,
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
  } = useUsers();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-2">
      <div className="mb-2 text-sm text-left text-gray-500">
        Home / User Management
      </div>

      <div className="flex items-center justify-between rounded-t-md bg-green-600 px-4 py-3 text-lg font-semibold text-white">
        <span>User Accounts Management</span>
      </div>

      <div className="flex flex-col gap-3 bg-white px-4 py-3 shadow md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-md">
          <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, role, barangay"
            className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <button
          onClick={openAddModal}
          disabled={loadingAddModal}
          className="group relative flex items-center justify-center gap-2 rounded bg-green-600 px-4 py-2 text-white transition-all duration-200 hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingAddModal ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
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
            </span>
          ) : (
            <>
              <FiPlus className="text-lg transition-transform duration-200 group-hover:scale-110" />
              <span className="hidden md:inline">Add User</span>
              <span className="absolute top-full mt-2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:hidden">
                Add User
              </span>
            </>
          )}
        </button>
      </div>

      <UserTable
        users={paginatedUsers}
        handleEdit={handleEdit}
        handleDelete={deleteUser}
        page={page}
        pageSize={PAGE_SIZE}
      />

      <div className="rounded-b-md bg-white px-4 pb-4 shadow">
        <div className="pt-2 text-sm text-gray-500">
        Showing{' '}
          <span className="font-medium">
            {totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
          </span>
          {' '}to{' '}
          <span className="font-medium">
            {Math.min(page * PAGE_SIZE, totalCount)}
          </span>
          {' '}of{' '}
          <span className="font-medium">{totalCount}</span> users
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          onFirst={() => setPage(1)}
          onPrev={() => setPage((prev) => Math.max(prev - 1, 1))}
          onNext={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          onLast={() => setPage(totalPages)}
          onPageSelect={(selectedPage) => setPage(selectedPage)}
        />
      </div>

      {showModal && selectedUser && (
        <UserModal
          user={selectedUser}
          setUser={setSelectedUser}
          onClose={closeEditModal}
          onSave={saveEditUser}
          saving={saving}
          mode="edit"
        />
      )}

      {showAddModal && (
        <UserModal
          user={newUser}
          setUser={setNewUser}
          onClose={closeAddModal}
          onSave={addUser}
          saving={saving}
          mode="add"
        />
      )}
    </div>
  );
}