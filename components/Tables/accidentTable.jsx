'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'react-toastify';
import { doc, getDocs, getDoc, updateDoc, deleteDoc, collection } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { FiEdit, FiTrash2, FiSearch, FiX } from 'react-icons/fi';

// Dynamically import MapPopup to avoid SSR issues
const MapPopup = dynamic(() => import('@/components/mapPopUp'), { ssr: false });

export default function AccidentTable({ title = 'Accident Reports (2025)' }) {
  // State variables
  const [accidents, setAccidents] = useState([]); // All fetched accident records
  const [loading, setLoading] = useState(false); // Loading state
  const [mapOpen, setMapOpen] = useState(false); // Toggles map popup visibility
  const [selectedLocation, setSelectedLocation] = useState(null); // Coordinates for map
  const [searchTerm, setSearchTerm] = useState(''); // Search filter input
  const [showEditModal, setShowEditModal] = useState(false); // Controls edit modal
  const [editData, setEditData] = useState(null); // Accident data being edited

  // Fetch all accident records on mount
  useEffect(() => {
    const fetchAccidents = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, 'accidents'));
        const fetchedData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAccidents(fetchedData); // Populate accident list
      } catch (error) {
        console.error('Error fetching accident data:', error);
        toast.error('Failed to load accident records.');
      } finally {
        setLoading(false);
      }
    };

    fetchAccidents();
  }, []);

  // Filter accidents using search input
  const filteredAccidents = accidents
  .filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  )
  .sort((a, b) => new Date(b.datetime) - new Date(a.datetime)); // Sort by datetime DESC


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
    const confirm = window.confirm('Are you sure you want to delete this accident record?');
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, 'accidents', id));
      setAccidents((prev) => prev.filter((acc) => acc.id !== id)); // Remove from UI
      toast.success('Accident record deleted.');
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
  setLoading(true); // Show spinner

  try {
    const { id, type, severity, description, datetime } = editData;

    await updateDoc(doc(db, 'accidents', id), {
      type,
      severity,
      description,
      datetime,
    });

    // Update local state
    setAccidents((prev) =>
      prev.map((acc) =>
        acc.id === id ? { ...acc, type, severity, description, datetime } : acc
      )
    );

    setShowEditModal(false);
    toast.success('Accident updated.');
  } catch (err) {
    console.error(err);
    toast.error('Update failed.');
  } finally {
    setLoading(false); // Hide spinner
  }
};


  // Print report
  const handlePrint = () => window.print();

  // Export filtered results to CSV
  const handleDownloadCSV = () => {
    if (!filteredAccidents.length) return;

    const headers = 'Type,Severity,Description,DateTime';
    const rows = filteredAccidents.map((acc) =>
      [acc.type, acc.severity, acc.description, acc.datetime].join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `accidents_2025.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="p-4">
      {/* Breadcrumb (print hidden) */}
      <div className="text-sm text-right text-gray-500 mb-2 print:hidden">
        Home / Reports / Accidents
      </div>

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
              id='search-input'
              name='search'
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
                setLoading(true);
                handlePrint();
                setTimeout(() => setLoading(false), 1000); // optional delay
              }}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Print
            </button>

            <button
              onClick={async () => {
                setLoading(true);
                handleDownloadCSV();
                setLoading(false);
              }}
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
          ) : filteredAccidents.length === 0 ? (
            <p className="text-center text-gray-500 py-6">No accident record results.</p>
          ) : (
            <>
              <table className="w-full text-sm text-center print:text-xs print:w-full print:border print:border-gray-400">
                <thead className="bg-gray-100 text-gray-600 print:bg-white print:text-black">
                  <tr>
                    <th className="px-4 py-2 border">Type</th>
                    <th className="px-4 py-2 border">Severity</th>
                    <th className="px-4 py-2 border">Description</th>
                    <th className="px-4 py-2 border">Date & Time</th>
                    <th className="px-4 py-2 border print:hidden">Map</th>
                    <th className="px-4 py-2 border print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Sorted and filtered accidents */}
                  {filteredAccidents
                    .sort((a, b) => new Date(b.datetime) - new Date(a.datetime))
                    .map((accident) => (
                      <tr key={accident.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 border">{accident.type}</td>
                        <td className="px-4 py-2 border">{accident.severity}</td>
                        <td className="px-4 py-2 border">{accident.description}</td>
                        <td className="px-4 py-2 border">
                          {accident.datetime
                            ? new Date(accident.datetime).toLocaleString()
                            : '—'}
                        </td>
                        <td className="px-4 py-2 border print:hidden">

                          {/* Map button */}
                          <button
                            onClick={() =>
                              openMapWithLocation(accident.position?.lat, accident.position?.lng)
                            }
                            className="bg-green-600 text-white px-3 py-1 text-xs rounded hover:bg-green-700 cursor-pointer"
                          >
                            Map
                          </button>
                        </td>
                        <td className="px-4 py-2 border space-x-2 print:hidden">

                          {/* Edit button */}
                          <button
                            onClick={() => handleEdit(accident.id)}
                            className="text-blue-600 hover:text-blue-800 cursor-pointer"
                            title="Edit"
                          >
                            <FiEdit size={16} />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDelete(accident.id)}
                            className="text-red-600 hover:text-red-800 cursor-pointer"
                            title="Delete"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
              {/* Record Count */}
              <p className="text-sm text-gray-700 mt-4 print:hidden">
                <strong>Total accident records:</strong> <span className="font-semibold">{filteredAccidents.length}</span>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Static Map Viewer (Read Only) */}
      <MapPopup isOpen={mapOpen} onClose={() => setMapOpen(false)} location={selectedLocation} readOnly={true} mode="accident" />

      {/* Edit Modal */}
      {showEditModal && editData && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-black" onClick={() => setShowEditModal(false)}><FiX /></button>
            <h2 className="text-lg font-bold mb-4">Edit Accident Info</h2>
            <div className="space-y-3">
              {/* Type */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium">Type</label>
                <input
                  id="type"
                  name="type"
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={editData.type || ''}
                  onChange={(e) => setEditData((prev) => ({ ...prev, type: e.target.value }))}
                />
              </div>

              {/* Severity */}
              <div>
                <label htmlFor="severity" className="block text-sm font-medium">Severity</label>
                <select
                  id="severity"
                  name="severity"
                  className="w-full border rounded px-3 py-2"
                  value={editData.severity || ''}
                  onChange={(e) => setEditData((prev) => ({ ...prev, severity: e.target.value }))}
                >
                  <option value="">Select severity</option>
                  <option value="Minor">Minor</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium">Description</label>
                <textarea
                  id="description"
                  name="description"
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  value={editData.description || ''}
                  onChange={(e) => setEditData((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {/* Date & Time */}
              <div>
                <label htmlFor="datetime" className="block text-sm font-medium">Date & Time</label>
                <input
                  id="datetime"
                  name="datetime"
                  type="datetime-local"
                  className="w-full border rounded px-3 py-2"
                  value={editData.datetime || ''}
                  onChange={(e) => setEditData((prev) => ({ ...prev, datetime: e.target.value }))}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <button 
                  onClick={() => setShowEditModal(false)} 
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
                    Cancel
                </button>
                
                <button
                  onClick={handleSaveEdit}
                  disabled={loading}
                  className={`px-4 py-2 text-white rounded flex items-center justify-center gap-2 transition ${
                    loading ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        viewBox="0 0 24 24"
                      >
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
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
