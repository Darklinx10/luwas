'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { FiSearch, FiTrash2 } from 'react-icons/fi';
import RoleGuard from '@/components/roleGuard';
import { toast } from 'react-toastify';

export default function HazardsPage() {
  const [boundaries, setBoundaries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchBoundaries = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'boundaries'));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBoundaries(data);
    } catch (error) {
      console.error('Error fetching boundaries:', error);
      toast.error('Failed to load boundaries.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = confirm('Are you sure you want to delete this boundary?');
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, 'boundaries', id));
      toast.success('Boundary deleted.');
      fetchBoundaries();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete boundary.');
    }
  };

  const filteredBoundaries = boundaries.filter((b) =>
    `${b.name} ${b.description}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchBoundaries();
  }, []);

  return (
    <RoleGuard allowedRoles={['SeniorAdmin']}>
      <div className="p-4">
        <div className="text-sm text-right text-gray-500 mb-2">
          Home / Boundary Management
        </div>

        <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-semibold text-lg flex justify-between items-center">
          <span>Barangay Boundaries</span>
        </div>

        {/* Search bar */}
        <div className="flex items-center justify-between bg-white shadow px-4 py-3">
          <div className="relative w-full max-w-md">
            <FiSearch className="absolute top-2.5 left-3 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or description"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto shadow border-t-0 rounded-b-md bg-white p-4">
          {loading ? (
            <p className="text-center text-gray-500 py-6">Loading boundaries...</p>
          ) : filteredBoundaries.length === 0 ? (
            <p className="text-center text-gray-500 py-6">No boundaries found.</p>
          ) : (
            <table className="w-full text-sm text-center">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Description</th>
                  <th className="p-2 border">Date Uploaded</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBoundaries.map((boundary) => (
                  <tr key={boundary.id} className="hover:bg-gray-50">
                    <td className="p-2 border">{boundary.name || 'Untitled'}</td>
                    <td className="p-2 border">{boundary.description || 'N/A'}</td>
                    <td className="p-2 border">
                      {boundary.createdAt
                        ? new Date(boundary.createdAt).toLocaleString()
                        : 'N/A'}
                    </td>
                    <td className="p-2 border">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleDelete(boundary.id)}
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
      </div>
    </RoleGuard>
  );
}
