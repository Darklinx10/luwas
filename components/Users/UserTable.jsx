import React from 'react';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

const UserTable = ({ users, loading, onEdit, onDelete }) => {
  if (loading) return <p>Loading users...</p>;
  if (users.length === 0) return <p>No users found.</p>;

  return (
    <div className="overflow-x-auto shadow border-t-0 rounded-b-md bg-white p-4">
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
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="p-2 border">{user.fullName || 'N/A'}</td>
              <td className="p-2 border">{user.email}</td>
              <td className="p-2 border">{user.barangay || 'N/A'}</td>
              <td className="p-2 border">{user.role}</td>
              <td className="p-2 border">{user.contactNumber}</td>
              <td className="p-2 border text-center ">
                <div className="flex justify-center gap-3">
                  <button onClick={() => onEdit(user)} className="text-blue-600 hover:text-blue-800"><FiEdit /></button>
                  <button onClick={() => onDelete(user.id)} className="text-red-600 hover:text-red-800"><FiTrash2 /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
