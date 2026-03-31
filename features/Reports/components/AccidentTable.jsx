'use client';

import { db, storage } from '@/lib/firebaseConfig';
import { collection, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { FiEdit, FiSearch, FiTrash2, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Image from 'next/image';
import { useAccidentsReport } from '../hooks/useAccidentsReport';
import { generateAccidentCSV, downloadCSV } from '../utils/csvExport';

// Dynamically import MapPopup to avoid SSR issues
const MapPopup = dynamic(() => import('@/components/mapPopUP'), { ssr: false });

export default function AccidentTable({ title = 'Accident Reports' }) {
  const [mapOpen, setMapOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const { accidents, searchTerm, setSearchTerm, loading, refetch, setAccidents } =
    useAccidentsReport();

  // Open map popup with coordinates
  const openMapWithLocation = (lat, lng) => {
    if (lat && lng) {
      setSelectedLocation({ lat: parseFloat(lat), lng: parseFloat(lng) });
      setMapOpen(true);
    } else {
      toast.warn('No location data available for this accident.');
    }
  };

  // Delete accident record
  const handleDelete = async (id) => {
    const confirm = window.confirm(
      'Are you sure you want to delete this accident record?'
    );
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, 'accidents', id));
      setAccidents((prev) => prev.filter((acc) => acc.id !== id));
      toast.success('Accident record deleted.');
      refetch();
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete record.');
    }
  };

  // Open edit modal with pre-filled accident data
  const handleEdit = async (id) => {
    const docRef = doc(db, 'accidents', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return toast.error('Accident not found.');
    setEditData({ id, ...docSnap.data() });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editData) return;
    setEditLoading(true);

    try {
      const { id, type, severity, description, datetime, imageFile } = editData;

      let imageUrl = editData.imageUrl; // keep the old image by default

      // ✅ If user uploaded a new image, upload to Firebase Storage
      if (imageFile) {
        const storageRef = ref(storage, `accidents/${id}-${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      // ✅ Update Firestore document
      await updateDoc(doc(db, 'accidents', id), {
        type,
        severity,
        description,
        datetime,
        imageUrl,
      });

      // ✅ Update local state
      setAccidents((prev) =>
        prev.map((acc) =>
          acc.id === id
            ? { ...acc, type, severity, description, datetime, imageUrl }
            : acc
        )
      );

      setShowEditModal(false);
      toast.success('Accident updated.');
      refetch();
    } catch (err) {
      console.error(err);
      toast.error('Update failed.');
    } finally {
      setEditLoading(false);
    }
  };

  // Export filtered results to CSV
  const handleDownloadCSV = () => {
    if (!accidents.length) return;
    const csv = generateAccidentCSV(accidents);
    downloadCSV(csv, `accidents_${new Date().getFullYear()}.csv`);
  };

  // Print report
  const handlePrint = () => window.print();

  return (
    <div className="p-4">
      <div id="print-section">
        {/* Report Title */}
        <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-bold text-lg print:text-black print:bg-white print:text-center">
          {title}
        </div>

        {/* Search + Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-white shadow border-t-0 px-4 py-3 print:hidden">
          {/* Search Field */}
          <div className="relative w-full max-w-xs">
            <FiSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search Here"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                handlePrint();
              }}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Print
            </button>

            <button
              onClick={handleDownloadCSV}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Download CSV
            </button>
          </div>
        </div>

        {/* Accident Data Table */}
        <div className="overflow-x-auto max-h-[530px] overflow-y-auto shadow border-t-0 rounded-b-md bg-white p-4 scrollbar-thin">
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
                <p className="text-gray-600 text-sm">Loading Accident records...</p>
              </div>
            </div>
          ) : accidents.length === 0 ? (
            <p className="text-center text-gray-500 py-6">No accident records found.</p>
          ) : (
            <>
              <table className="w-full text-sm text-center print:text-xs print:w-full print:border print:border-gray-400">
                <thead className="bg-gray-100 text-gray-600 print:bg-white print:text-black">
                  <tr>
                    <th className="px-4 py-2 border">No.</th>
                    <th className="px-4 py-2 border">Image</th>
                    <th className="px-4 py-2 border">Type</th>
                    <th className="px-4 py-2 border">Severity</th>
                    <th className="px-4 py-2 border">Description</th>
                    <th className="px-4 py-2 border">Date & Time</th>
                    <th className="px-4 py-2 border print:hidden">Map</th>
                    <th className="px-4 py-2 border print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {accidents
                    .sort((a, b) => new Date(b.datetime) - new Date(a.datetime))
                    .map((accident, index) => (
                      <tr key={accident.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 border">{index + 1}</td>

                        {/* Image */}
                        <td className="px-4 py-2 border">
                          {accident.imageUrl ? (
                            <Image
                              src={accident.imageUrl}
                              alt={accident.type}
                              width={64}
                              height={64}
                              className="w-16 h-16 object-cover mx-auto rounded"
                            />
                          ) : (
                            <span className="text-gray-400">No Image</span>
                          )}
                        </td>

                        <td className="px-4 py-2 border">{accident.type}</td>
                        <td className="px-4 py-2 border">{accident.severity}</td>
                        <td className="px-4 py-2 border">{accident.description}</td>
                        <td className="px-4 py-2 border">
                          {accident.datetime
                            ? new Date(accident.datetime).toLocaleString()
                            : '—'}
                        </td>

                        <td className="px-4 py-2 border print:hidden">
                          <button
                            onClick={() =>
                              openMapWithLocation(
                                accident.position?.lat,
                                accident.position?.lng
                              )
                            }
                            className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 text-xs"
                          >
                            View
                          </button>
                        </td>

                        <td className="px-4 py-2 border print:hidden">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleEdit(accident.id)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <FiEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(accident.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-700 mt-4">
        <strong>Total Accidents:</strong> {accidents.length}
      </p>

      {/* Edit Modal */}
      {showEditModal && editData && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              onClick={() => setShowEditModal(false)}
            >
              <FiX />
            </button>

            <h2 className="text-lg font-bold mb-4">Edit Accident</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Type</label>
                <input
                  type="text"
                  value={editData.type || ''}
                  onChange={(e) =>
                    setEditData({ ...editData, type: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Severity</label>
                <select
                  value={editData.severity || ''}
                  onChange={(e) =>
                    setEditData({ ...editData, severity: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea
                  value={editData.description || ''}
                  onChange={(e) =>
                    setEditData({ ...editData, description: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                  rows="3"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={editLoading}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {editLoading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Popup */}
      {mapOpen && selectedLocation && (
        <MapPopup
          lat={selectedLocation.lat}
          lng={selectedLocation.lng}
          onClose={() => setMapOpen(false)}
        />
      )}
    </div>
  );
}
