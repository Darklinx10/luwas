'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { FiSearch, FiTrash,FiPlus } from 'react-icons/fi';
import RoleGuard from '@/components/roleGuard';
import { toast } from 'react-toastify';

export default function HazardsPage() {
  const [hazards, setHazards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch hazard layers from Firestore
  const fetchHazards = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'hazards'));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setHazards(data);
    } catch (error) {
      console.error('Error fetching hazards:', error);
      toast.error('Failed to load hazard layers.');
    } finally {
      setLoading(false);
    }
  };

  // Delete hazard by ID
  const handleDelete = async (id) => {
    const confirmDelete = confirm('Are you sure you want to delete this hazard layer?');
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, 'hazards', id));
      toast.success('Hazard layer deleted.');
      fetchHazards();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete hazard.');
    }
  };

  // Handle file upload
  const handleHazardUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const geojson = JSON.parse(event.target.result);

        // Extract basic metadata
        const type = geojson.type || 'GeoJSON';
        const description = geojson?.features?.[0]?.properties?.description || 'Imported hazard layer';

        // Save metadata to Firestore
        await addDoc(collection(db, 'hazards'), {
          type,
          description,
          createdAt: serverTimestamp(),
        });

        toast.success('Hazard layer added.');
        fetchHazards();
      } catch (error) {
        console.error('Invalid GeoJSON file', error);
        toast.error('Invalid GeoJSON file.');
      }
    };

    reader.readAsText(file);
  };

  const filteredHazards = hazards.filter((hazard) =>
    `${hazard.type} ${hazard.description}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchHazards();
  }, []);

  return (
    <RoleGuard allowedRoles={['SeniorAdmin']}>
      <div className="p-4">
        <div className="text-sm text-right text-gray-500 mb-2">
          Home / Hazard Management
        </div>

        <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-semibold text-lg flex justify-between items-center">
          <span>Hazard Layers</span>
        </div>

        {/* Top bar with search and add button */}
        <div className="flex items-center justify-between bg-white shadow px-4 py-3">
          {/* Search input */}
          <div className="relative w-full max-w-md">
            <FiSearch className="absolute top-2.5 left-3 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by type or description"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Add Hazard Layer button */}
          <div className="ml-4">
            <button
              onClick={() => document.getElementById('hazard-file-upload').click()}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              <FiPlus />
              Add Hazard Layer
            </button>
            <input
              type="file"
              accept=".geojson,application/geo+json"
              id="hazard-file-upload"
              className="hidden"
              onChange={handleHazardUpload}
            />
          </div>

        </div>

        {/* Table */}
        <div className="overflow-x-auto shadow border-t-0 rounded-b-md bg-white p-4">
          {loading ? (
            <p className="text-center text-gray-500 py-6">Loading...</p>
          ) : filteredHazards.length === 0 ? (
            <p className="text-center text-gray-500 py-6">No hazard layers found.</p>
          ) : (
            <table className="w-full text-sm text-center">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="p-2 border">Type</th>
                  <th className="p-2 border">Description</th>
                  <th className="p-2 border">Date Uploaded</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHazards.map((hazard) => (
                  <tr key={hazard.id} className="hover:bg-gray-50">
                    <td className="p-2 border">{hazard.type || 'Unknown'}</td>
                    <td className="p-2 border">{hazard.description || 'N/A'}</td>
                    <td className="p-2 border">
                      {hazard.createdAt
                        ? new Date(hazard.createdAt.seconds * 1000).toLocaleString()
                        : 'N/A'}
                    </td>
                    <td className="p-2 border">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleDelete(hazard.id)}
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
