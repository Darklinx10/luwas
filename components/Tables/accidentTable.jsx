'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'react-toastify';
import { doc, getDocs, deleteDoc, collection } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

const MapPopup = dynamic(() => import('@/components/mapPopUp'), { ssr: false });

export default function AccidentTable({ title = 'Accident Reports' }) {
  const [accidents, setAccidents] = useState([]);
  const [mapOpen, setMapOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    const fetchAccidents = async () => {
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
      }
    };

    fetchAccidents();
  }, []);

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

  const handleEdit = (id) => {
    toast.info(`Edit functionality not implemented. Accident ID: ${id}`);
  };

  return (
    <div className="p-4">
      <div className="text-sm text-right text-gray-500 mb-2">
        Home / Reports / Accidents
      </div>

      <div className="overflow-x-auto rounded shadow">
        <table className="min-w-full border-collapse border border-gray-300 text-sm">
          <caption className="caption-top text-lg font-semibold text-left text-white bg-green-600 p-3">
            {title}
          </caption>
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-center">Type</th>
              <th className="border p-2 text-center">Severity</th>
              <th className="border p-2 text-center">Description</th>
              <th className="border p-2 text-center">Date & Time</th>
              <th className="border p-2 text-center">Map</th>
              <th className="border p-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {accidents.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-4 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : (
              accidents.map((accident) => (
                <tr key={accident.id} className="hover:bg-gray-50 text-center">
                  <td className="border p-2">{accident.type}</td>
                  <td className="border p-2">{accident.severity}</td>
                  <td className="border p-2">{accident.description}</td>
                  <td className="border p-2">{accident.datetime}</td>
                  <td className="border p-2">
                    <button
                      onClick={() =>
                        openMapWithLocation(accident.position?.lat, accident.position?.lng)
                      }
                      className="bg-green-600 text-white px-3 py-1 text-xs rounded hover:bg-green-700"
                    >
                      Map
                    </button>
                  </td>
                  <td className="p-2 border text-center space-x-2">
                    <button
                      onClick={() => handleEdit(accident.id)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit"
                    >
                      <FiEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(accident.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <MapPopup
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        location={selectedLocation}
        readOnly={true}
        mode="accident"
      />
    </div>
  );
}
