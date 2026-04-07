'use client';

import { FiEdit, FiMail, FiMapPin, FiPhone, FiTrash2, FiUser } from 'react-icons/fi';

function getRoleBadgeClass(role) {
  switch ((role || '').toLowerCase()) {
    case 'mdrrmc-admin':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100';
    case 'mdrrmc-personnel':
      return 'bg-blue-50 text-blue-700 ring-1 ring-blue-100';
    case 'brgy-secretary':
      return 'bg-amber-50 text-amber-700 ring-1 ring-amber-100';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export default function UserTable({
  users = [],
  loading = false,
  handleEdit,
  handleDelete,
  page = 1,
  pageSize = 10,
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center px-6 py-14">
        <div className="flex flex-col items-center">
          <svg
            className="mb-3 h-10 w-10 animate-spin text-emerald-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          <p className="text-sm text-slate-500">Loading users...</p>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="px-6 py-14 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <FiUser size={20} />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-700">No users found</h3>
        <p className="mt-1 text-sm text-slate-500">
          Try adjusting the search terms or add a new user account.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left">
        <thead className="bg-slate-50">
          <tr className="text-xs uppercase tracking-[0.08em] text-slate-500">
            <th className="border-b border-slate-200 px-4 py-3 font-semibold">No.</th>
            <th className="border-b border-slate-200 px-4 py-3 font-semibold min-w-[220px]">User</th>
            <th className="border-b border-slate-200 px-4 py-3 font-semibold min-w-[220px]">Email</th>
            <th className="border-b border-slate-200 px-4 py-3 font-semibold min-w-[160px]">Barangay</th>
            <th className="border-b border-slate-200 px-4 py-3 font-semibold min-w-[160px]">Role</th>
            <th className="border-b border-slate-200 px-4 py-3 font-semibold min-w-[160px]">Contact</th>
            <th className="border-b border-slate-200 px-4 py-3 text-center font-semibold min-w-[120px]">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {users.map((user, index) => (
            <tr key={user.id} className="transition hover:bg-slate-50">
              <td className="border-b border-slate-200 px-4 py-4 text-sm text-slate-600">
                {(page - 1) * pageSize + index + 1}
              </td>

              <td className="border-b border-slate-200 px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 font-semibold text-emerald-700">
                    {(user.fullName || user.firstName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {user.fullName || 'N/A'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      ID: {user.id || 'N/A'}
                    </p>
                  </div>
                </div>
              </td>

              <td className="border-b border-slate-200 px-4 py-4">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <FiMail className="text-slate-400" size={14} />
                  <span>{user.email || 'N/A'}</span>
                </div>
              </td>

              <td className="border-b border-slate-200 px-4 py-4">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <FiMapPin className="text-slate-400" size={14} />
                  <span>{user.barangay || 'N/A'}</span>
                </div>
              </td>

              <td className="border-b border-slate-200 px-4 py-4">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getRoleBadgeClass(
                    user.role
                  )}`}
                >
                  {user.role || 'N/A'}
                </span>
              </td>

              <td className="border-b border-slate-200 px-4 py-4">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <FiPhone className="text-slate-400" size={14} />
                  <span>{user.contactNumber || 'N/A'}</span>
                </div>
              </td>

              <td className="border-b border-slate-200 px-4 py-4">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleEdit(user)}
                    className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-700 transition hover:bg-blue-100"
                    title="Edit user"
                  >
                    <FiEdit size={16} />
                  </button>

                  <button
                    onClick={() => handleDelete(user.id)}
                    className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 transition hover:bg-red-100"
                    title="Delete user"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}