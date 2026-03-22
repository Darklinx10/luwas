'use client';

import { FiEdit, FiTrash2 } from 'react-icons/fi';

export default function UserTable({
  users = [],
  loading = false,
  handleEdit,
  handleDelete,
  page = 1,
  pageSize = 10,
}) {
  return (
    <div className="overflow-x-auto rounded-b-md border-t-0 bg-white p-6 shadow">
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="flex flex-col items-center">
            <svg
              className="mb-3 h-10 w-10 animate-spin text-green-500"
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
            <p className="text-sm text-gray-600">Loading users...</p>
          </div>
        </div>
      ) : users.length === 0 ? (
        <p className="py-6 text-center text-gray-500">No users found.</p>
      ) : (
        <table className="w-full text-sm text-center">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="border-b border-gray-200 p-2">No.</th>
              <th className="border-b border-gray-200 p-2">Name</th>
              <th className="border-b border-gray-200 p-2">Email</th>
              <th className="border-b border-gray-200 p-2">Barangay</th>
              <th className="border-b border-gray-200 p-2">Role</th>
              <th className="border-b border-gray-200 p-2">Contact Number</th>
              <th className="border-b border-gray-200 p-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user, index) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="border-b border-gray-200 p-2">
                  {(page - 1) * pageSize + index + 1}
                </td>
                <td className="border-b border-gray-200 p-2">
                  {user.fullName || 'N/A'}
                </td>
                <td className="border-b border-gray-200 p-2">
                  {user.email || 'N/A'}
                </td>
                <td className="border-b border-gray-200 p-2">
                  {user.barangay || 'N/A'}
                </td>
                <td className="border-b border-gray-200 p-2">
                  {user.role || 'N/A'}
                </td>
                <td className="border-b border-gray-200 p-2">
                  {user.contactNumber || 'N/A'}
                </td>
                <td className="border-b border-gray-200 p-2">
                  <div className="flex items-center justify-center gap-2">
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
  );
}