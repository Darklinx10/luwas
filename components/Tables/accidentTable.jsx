'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const MapPopup = dynamic(() => import('@/components/mapPopUP'), { ssr: false });

export default function AccidentTable({ title = 'Accident Reports' }) {
  const [accidents, setAccidents] = useState([]);
  const [mapOpen, setMapOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    const fetchAccidents = async () => {
      try {
        const { getDocs, collection } = await import('firebase/firestore');
        const { db } = await import('@/firebase/config');

        const snapshot = await getDocs(collection(db, 'accidents'));
        const fetchedData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setAccidents(fetchedData);
      } catch (error) {
        console.error('Error fetching accident data:', error);
      }
    };

    fetchAccidents();
  }, []);

  const openMapWithLocation = (lat, lng) => {
    if (lat && lng) {
      setSelectedLocation({ lat: parseFloat(lat), lng: parseFloat(lng) });
      setMapOpen(true);
    } else {
      alert('No location data available for this accident.');
    }
  };

  return (
    <div className="p-4">
      {/* ✅ Breadcrumb */}
      <div className="text-sm text-right text-gray-500 mb-2">
        Home / Reports / Accidents
      </div>

      {/* ✅ Table */}
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
            </tr>
          </thead>
          <tbody>
            {accidents.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center p-4 text-gray-500">
                  No accident records found.
                </td>
              </tr>
            ) : (
              accidents.map((accident, index) => (
                <tr key={index} className="hover:bg-gray-50 text-center">
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Map Popup */}
      <MapPopup
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        location={selectedLocation}
        readOnly={true}
        mode="accident" // ✅ This enables the 'Accident Location' label
      />
    </div>
  );
}
