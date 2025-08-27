'use client';

import { FiEdit, FiTrash2 } from 'react-icons/fi';

export default function UserTable({
  loading,
  filteredUsers,
  handleEdit,
  handleDelete
}) {
  return (
    <div className="overflow-x-auto shadow border-t-0 rounded-b-md bg-white p-4">
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="flex flex-col items-center">
            <svg
              className="animate-spin h-10 w-10 text-green-500 mb-3"
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
            <p className="text-gray-600 text-sm">Loading users...</p>
          </div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <p className="text-center text-gray-500 py-6">No users found.</p>
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
  );
}
