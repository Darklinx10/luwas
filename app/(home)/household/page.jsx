'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { FaUserEdit } from 'react-icons/fa';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import dynamic from 'next/dynamic';

const MapPopup = dynamic(() => import('@/components/mapPopUP'), { ssr: false });

export default function HouseholdPage() {
  const router = useRouter();
  const [mapOpen, setMapOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [households, setHouseholds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddClick = () => {
    router.push('/household/addHouseholdForms');
  };

  const openMapWithLocation = (lat, lng) => {
    if (lat && lng) {
      setSelectedLocation({ lat: parseFloat(lat), lng: parseFloat(lng) });
      setMapOpen(true);
    } else {
      alert('No location data available for this household.');
    }
  };

  useEffect(() => {
    const fetchHouseholds = async () => {
      try {
        const householdsSnapshot = await getDocs(collection(db, 'households'));
        const householdList = [];

        for (const hhDoc of householdsSnapshot.docs) {
          const householdId = hhDoc.id;

          // 👇 Correctly fetch 'main' document under subcollections
          const geoDocRef = doc(db, 'households', householdId, 'geographicIdentification', 'main');
          const geoSnap = await getDoc(geoDocRef);
          const geoData = geoSnap.exists() ? geoSnap.data() : {};

          const demoDocRef = doc(db, 'households', householdId, 'demographicCharacteristics', 'main');
          const demoSnap = await getDoc(demoDocRef);
          const demoData = demoSnap.exists() ? demoSnap.data() : {};

          const merged = {
            householdId,
            ...geoData,
            ...demoData,
          };

          if (
            merged.headFirstName ||
            merged.headLastName ||
            merged.barangay ||
            merged.latitude ||
            merged.longitude
          ) {
            householdList.push(merged);
          }
        }

        setHouseholds(householdList);
      } catch (error) {
        console.error('Error fetching households:', error);
      }
    };

    fetchHouseholds();
  }, []);

  const filteredHouseholds = households.filter((data) => {
    const fullName = [
      data.headFirstName || '',
      data.headMiddleName || '',
      data.headLastName || '',
    ]
      .join(' ')
      .toLowerCase();

    return fullName.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-4">
      <div className="text-sm text-right text-gray-500 mb-2">Home / Households</div>

      <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-semibold text-lg">
        Household Information (2025)
      </div>

      <div className="flex items-center justify-between bg-white border border-t-0 px-4 py-3">
        <div className="relative w-1/2 max-w-md">
          <FiSearch className="absolute top-2.5 left-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search Family Head"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          <FiPlus />
          Add
        </button>
      </div>

      <div className="overflow-x-auto border border-t-0 rounded-b-md">
        <table className="w-full text-sm text-center">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-2 border"></th>
              <th className="p-2 border">Family Head</th>
              <th className="p-2 border">Barangay</th>
              <th className="p-2 border">Sex</th>
              <th className="p-2 border">Contact Number</th>
              <th className="p-2 border">Age</th>
              <th className="p-2 border">Map</th>
            </tr>
          </thead>
          <tbody>
            {filteredHouseholds.length > 0 ? (
              filteredHouseholds.map((data, index) => {
                const fullName = [
                  data.headFirstName,
                  data.headMiddleName,
                  data.headLastName,
                  data.headSuffix !== 'n/a' ? data.headSuffix : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="p-2 border text-center">
                      <button
                        onClick={() => router.push(`/household/${data.householdId}`)}
                        title="Edit Household"
                      >
                        <FaUserEdit className="text-green-600 inline" />
                      </button>
                    </td>
                    <td className="p-2 border">{fullName || '-'}</td>
                    <td className="p-2 border">{data.barangay || '-'}</td>
                    <td className="p-2 border">{data.sex || '-'}</td>
                    <td className="p-2 border">{data.contactNumber || '-'}</td>
                    <td className="p-2 border">{data.age || '-'}</td>
                    <td className="p-2 border text-center">
                      <button
                        onClick={() =>
                          openMapWithLocation(data.latitude, data.longitude)
                        }
                        className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                      >
                        Map
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-4 text-gray-500">
                  No matching households found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <MapPopup
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        location={selectedLocation}
        readOnly={true}
      />
    </div>
  );
}
