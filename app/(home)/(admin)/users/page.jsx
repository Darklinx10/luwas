'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { FaUserEdit, FaTrash } from 'react-icons/fa';
import RoleGuard from '@/components/roleGuard';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersData = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((user) => user.role === 'Secretary'); // ✅ Filter Secretaries only

        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <RoleGuard allowedRoles={['SeniorAdmin']}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">User Management (Secretaries)</h1>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3 border">Name</th>
                <th className="p-3 border">Email</th>
                <th className="p-3 border">Role</th>
                <th className="p-3 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="p-3 border align-middle">{user.name || 'N/A'}</td>
                  <td className="p-3 border align-middle">{user.email}</td>
                  <td className="p-3 border align-middle">{user.role}</td>
                  <td className="p-3 border w-32 text-center align-middle">
                    <div className="flex justify-center items-center gap-2">
                      <button className="text-blue-600 hover:text-blue-800">
                        <FaUserEdit />
                      </button>
                      <button className="text-red-600 hover:text-red-800">
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-3 text-center text-gray-500">
                    No secretary users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </RoleGuard>
  );
};

export default UserManagementPage;
