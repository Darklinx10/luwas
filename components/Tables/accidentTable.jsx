'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'react-toastify';
import { doc, getDocs, getDoc, updateDoc, deleteDoc, collection } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { FiEdit, FiTrash2, FiSearch, FiX } from 'react-icons/fi';

const MapPopup = dynamic(() => import('@/components/mapPopUp'), { ssr: false });

export default function AccidentTable({ title = 'Accident Reports (2025)' }) {
  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapOpen, setMapOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    const fetchAccidents = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, 'accidents'));
        const fetchedData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAccidents(fetchedData);
      } catch (error) {
        console.error('Error fetching accident data:', error);
        toast.error('Failed to load accident records.');
      } finally {
        setLoading(false);
      }
    };

    fetchAccidents();
  }, []);

  const filteredAccidents = accidents.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const openMapWithLocation = (lat, lng) => {
    if (lat && lng) {
      setSelectedLocation({ lat: parseFloat(lat), lng: parseFloat(lng) });
      setMapOpen(true);
    } else {
      toast.warn('No location data available for this accident.');
    }
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm('Are you sure you want to delete this accident record?');
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, 'accidents', id));
      setAccidents((prev) => prev.filter((acc) => acc.id !== id));
      toast.success('Accident record deleted.');
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete record.');
    }
  };

  const handleEdit = async (id) => {
    const docRef = doc(db, 'accidents', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return toast.error('Accident not found.');
    setEditData({ id, ...docSnap.data() });
    setShowEditModal(true);
  };

    const handleSaveEdit = async () => {
    if (!editData) return;

    try {
      const { id, type, severity, description, datetime } = editData;

      // 🟢 Update in Firestore
      await updateDoc(doc(db, 'accidents', id), {
        type,
        severity,
        description,
        datetime,
      });

      // 🟢 Update local state
      setAccidents((prev) =>
        prev.map((acc) =>
          acc.id === id
            ? { ...acc, type, severity, description, datetime }
            : acc
        )
      );

      setShowEditModal(false);
      toast.success('Accident updated.');
    } catch (err) {
      console.error(err);
      toast.error('Update failed.');
    }
  };


  const handlePrint = () => window.print();

  const handleDownloadCSV = () => {
    const headers = ['Type', 'Severity', 'Description', 'DateTime'];
    const rows = filteredAccidents.map((acc) => [
      acc.type,
      acc.severity,
      acc.description,
      acc.datetime,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers, ...rows].map((row) => row.join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'accidents.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4">
      <div className="text-sm text-right text-gray-500 mb-2">Home / Reports / Accidents</div>

      <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-semibold text-lg">
        {title}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-t-0 px-4 py-3">
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

        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer"
          >
            Print
          </button>
          <button
            onClick={handleDownloadCSV}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer"
          >
            Download CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-t-0 rounded-b-md bg-white p-4">
        {loading ? (
          <p className="text-center text-gray-500 py-6 animate-pulse">
            Loading accident records...
          </p>
        ) : accidents.length === 0 ? (
          <p className="text-center text-gray-500 py-6">No accident records found.</p>
        ) : filteredAccidents.length === 0 ? (
          <p className="text-center text-gray-500 py-6">No results matched your search.</p>
        ) : (
          <>
            <table className="w-full text-sm text-center print:text-xs print:w-full">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="px-4 py-2 border">Type</th>
                  <th className="px-4 py-2 border">Severity</th>
                  <th className="px-4 py-2 border">Description</th>
                  <th className="px-4 py-2 border">Date & Time</th>
                  <th className="px-4 py-2 border">Map</th>
                  <th className="px-4 py-2 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccidents.map((accident) => (
                  <tr key={accident.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border">{accident.type}</td>
                    <td className="px-4 py-2 border">{accident.severity}</td>
                    <td className="px-4 py-2 border">{accident.description}</td>
                    <td className="px-4 py-2 border">{accident.datetime}</td>
                    <td className="px-4 py-2 border">
                      <button
                        onClick={() =>
                          openMapWithLocation(accident.position?.lat, accident.position?.lng)
                        }
                        className="bg-green-600 text-white px-3 py-1 text-xs rounded hover:bg-green-700 cursor-pointer"
                      >
                        Map
                      </button>
                    </td>
                    <td className="px-4 py-2 border space-x-2">
                      <button
                        onClick={() => handleEdit(accident.id)}
                        className="text-blue-600 hover:text-blue-800 cursor-pointer"
                        title="Edit"
                      >
                        <FiEdit size={16} />
                      </button>
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

            <p className="text-sm text-gray-700 mt-4">
              <strong>Total accident records:</strong>{' '}
              <span className="font-semibold">{filteredAccidents.length}</span>
            </p>
          </>
        )}
      </div>

      {/* Map Popup */}
      <MapPopup
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        location={selectedLocation}
        readOnly={true}
        mode="accident"
      />

      {/* Edit Modal */}
      {showEditModal && editData && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              onClick={() => setShowEditModal(false)}
            >
              <FiX />
            </button>
            <h2 className="text-lg font-bold mb-4">Edit Accident Info</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Type</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={editData.type || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, type: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Severity</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={editData.severity || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, severity: e.target.value }))
                  }
                >
                  <option value="">Select severity</option>
                  <option value="Minor">Minor</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  value={editData.description || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, description: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Date & Time</label>
                <input
                  type="datetime-local"
                  className="w-full border rounded px-3 py-2"
                  value={editData.datetime || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, datetime: e.target.value }))
                  }
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
