'use client';

import { FiPlus, FiSearch, FiShield, FiUsers, FiUserCheck, FiSettings } from 'react-icons/fi';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '../Pagination/Pagination';
import UserModal from './components/UserModal';
import UserTable from './components/UserTable';
import { useUsers } from './hooks/useUsers';

function StatCard({ title, value, icon, subtitle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({ children, onClick, disabled, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
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
      ) : (
        <FiPlus size={16} />
      )}
      <span>{loading ? 'Preparing...' : children}</span>
    </button>
  );
}

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

  const firstItem = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <div className="min-h-screen space-y-6 bg-slate-50 p-4 md:p-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {/* Page Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm text-slate-400">Home / User Management</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-800">User Management</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-500">
                Manage user accounts, assigned roles, and barangay access across the LUWAS system.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                Admin Only
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                Account & Access Control
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Users"
            value={totalCount}
            icon={<FiUsers size={20} />}
            subtitle="Registered system accounts"
          />
          <StatCard
            title="Visible Results"
            value={paginatedUsers.length}
            icon={<FiUserCheck size={20} />}
            subtitle={searchTerm ? `Filtered by: ${searchTerm}` : 'Current page results'}
          />
          <StatCard
            title="Current Page"
            value={page}
            icon={<FiSettings size={20} />}
            subtitle={`Page ${page} of ${totalPages || 1}`}
          />
          <StatCard
            title="Modal Status"
            value={showModal || showAddModal ? 'Open' : 'Closed'}
            icon={<FiShield size={20} />}
            subtitle={
              showAddModal
                ? 'Adding new user'
                : showModal
                  ? 'Editing selected user'
                  : 'No active modal'
            }
          />
        </div>

        {/* Search and Actions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, role, or barangay"
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <ToolbarButton
              onClick={openAddModal}
              disabled={loadingAddModal}
              loading={loadingAddModal}
            >
              Add User
            </ToolbarButton>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">User Accounts</h2>
                <p className="text-sm text-slate-500">
                  Review, edit, and manage user records, roles, and account assignments.
                </p>
              </div>

              <div className="mt-2 md:mt-0">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {totalCount} total user(s)
                </span>
              </div>
            </div>
          </div>

          <UserTable
            users={paginatedUsers}
            handleEdit={handleEdit}
            handleDelete={deleteUser}
            page={page}
            pageSize={PAGE_SIZE}
          />

          <div className="border-t border-slate-200 px-4 py-4">
            <div className="mb-3 text-sm text-slate-500">
              Showing <span className="font-medium">{firstItem}</span> to{' '}
              <span className="font-medium">{lastItem}</span> of{' '}
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
        </div>
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
