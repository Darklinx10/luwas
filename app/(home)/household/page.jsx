'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiSearch, FiEdit, FiTrash2 } from 'react-icons/fi';
import { FaArrowRight } from 'react-icons/fa';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { deleteData } from '@/lib/firestore';
import dynamic from 'next/dynamic';

const MapPopup = dynamic(() => import('@/components/mapPopUp'), { ssr: false });

export default function HouseholdPage() {
  const router = useRouter();
  const [mapOpen, setMapOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [households, setHouseholds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedHouseholds, setExpandedHouseholds] = useState({});
  const [membersData, setMembersData] = useState({});
  const [totalHouseholds, setTotalHouseholds] = useState(0);
  const [totalResidents, setTotalResidents] = useState(0);
  const [loading, setLoading] = useState(true);

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

  const toggleExpanded = async (householdId) => {
    setExpandedHouseholds((prev) => ({
      ...prev,
      [householdId]: !prev[householdId],
    }));

    if (!membersData[householdId]) {
      try {
        const memberSnapshot = await getDocs(
          collection(db, 'households', householdId, 'members')
        );

        const members = await Promise.all(
          memberSnapshot.docs.map(async (docSnap) => {
            const baseData = docSnap.data();
            const memberId = docSnap.id;

            const demoRef = doc(
              db,
              'households',
              householdId,
              'members',
              memberId,
              'demographicCharacteristics',
              'main'
            );
            const demoSnap = await getDoc(demoRef);
            const demoData = demoSnap.exists() ? demoSnap.data() : {};

            return {
              id: memberId,
              ...baseData,
              ...demoData,
            };
          })
        );

        setMembersData((prev) => ({
          ...prev,
          [householdId]: members,
        }));
      } catch (error) {
        console.error('Error fetching members:', error);
      }
    }
  };

  useEffect(() => {
    const fetchHouseholds = async () => {
      setLoading(true);
      try {
        const householdsSnapshot = await getDocs(collection(db, 'households'));
        const householdList = [];
        let residentCounter = 0;

        for (const hhDoc of householdsSnapshot.docs) {
          const householdId = hhDoc.id;

          // Get geo data
          const geoDocRef = doc(db, 'households', householdId, 'geographicIdentification', 'main');
          const geoSnap = await getDoc(geoDocRef);
          const geoData = geoSnap.exists() ? geoSnap.data() : {};

          // Get members collection and find head
          const memberSnap = await getDocs(collection(db, 'households', householdId, 'members'));

          residentCounter += memberSnap.size; // count all members

          let headData = {};
          for (const memberDoc of memberSnap.docs) {
            const baseData = memberDoc.data();
            const memberId = memberDoc.id;

            const demoRef = doc(
              db,
              'households',
              householdId,
              'members',
              memberId,
              'demographicCharacteristics',
              'main'
            );
            const demoSnap = await getDoc(demoRef);
            const demoData = demoSnap.exists() ? demoSnap.data() : {};

            const relationship =
              demoData.relationshipToHead || baseData.relationshipToHead || '';

            if (relationship.toLowerCase() === 'head') {
              headData = {
                headFirstName: baseData.firstName || demoData.firstName || '',
                headMiddleName: baseData.middleName || demoData.middleName || '',
                headLastName: baseData.lastName || demoData.lastName || '',
                headSuffix: baseData.suffix || demoData.suffix || '',
                sex: baseData.sex || demoData.sex || '',
                age: baseData.age || demoData.age || '',
                contactNumber: demoData.contactNumber || '',
              };
              break;
            }
          }

          const merged = {
            householdId,
            ...geoData,
            ...headData,
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
        setTotalHouseholds(householdList.length);
        setTotalResidents(residentCounter);
      } catch (error) {
        console.error('Error fetching households:', error);
      }
      setLoading(false);
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
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="8" className="text-center py-4 text-gray-500">
                Loading...
              </td>
            </tr>
          ) : filteredHouseholds.length > 0 ? (
            filteredHouseholds.map((data) => {
              const fullName = [
                data.headFirstName,
                data.headMiddleName,
                data.headLastName,
                data.headSuffix !== 'n/a' ? data.headSuffix : '',
              ]
                .filter(Boolean)
                .join(' ');

              const isExpanded = expandedHouseholds[data.householdId];
              const members = membersData[data.householdId] || [];

              return (
                <React.Fragment key={data.householdId}>
                  <tr className="hover:bg-gray-50">
                    <td className="p-2 border text-center">
                      <button
                        onClick={() => toggleExpanded(data.householdId)}
                        title="View Members"
                      >
                        <FaArrowRight
                          className={`text-green-600 inline transition-transform duration-200 ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                    </td>
                    <td className="p-2 border">{fullName || '-'}</td>
                    <td className="p-2 border">{data.barangay || '-'}</td>
                    <td className="p-2 border">{data.sex || '-'}</td>
                    <td className="p-2 border">{data.contactNumber || '-'}</td>
                    <td className="p-2 border">{data.age || '-'}</td>
                    <td className="p-2 border text-center">
                      <button
                        onClick={() => openMapWithLocation(data.latitude, data.longitude)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                      >
                        Map
                      </button>
                    </td>
                    <td className="p-2 border text-center space-x-2">
                      <button
                        onClick={() => router.push(`/household/editHousehold`)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={async () => {
                          const confirmed = confirm(
                            'Are you sure you want to delete this household?'
                          );
                          if (!confirmed) return;

                          try {
                            await deleteData('households', data.householdId);
                            setHouseholds((prev) =>
                              prev.filter((hh) => hh.householdId !== data.householdId)
                            );
                            alert('Household deleted successfully.');
                          } catch (error) {
                            console.error('Error deleting household:', error);
                            alert('Failed to delete household.');
                          }
                        }}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr>
                      <td colSpan="8" className="p-4 border bg-gray-50 text-center text-sm">
                        <strong>Household Members:</strong>
                        {members.length > 0 ? (
                          <div className="mt-2">
                            {Object.entries(
                              members.reduce((acc, m) => {
                                // Try to get relation label by splitting at ' - '
                                const rawRelation = m.nuclearRelation || m.relationshipToHead || 'Unspecified';
                                // Sometimes rawRelation is "02 - Spouse", split to get the label
                                const relationLabel = rawRelation.includes(' - ') ? rawRelation.split(' - ')[1].trim() : rawRelation.trim();

                                if (!acc[relationLabel]) acc[relationLabel] = [];
                                acc[relationLabel].push(m);
                                return acc;
                              }, {})
                            ).map(([relation, group]) => (
                              <div key={relation} className="mt-2">
                                <p className="font-semibold text-green-700">👤 {relation}</p>
                                <ul className="list-disc list-inside ml-4">
                                  {group.map((m) => {
                                    // Show full name, original relation with code, and age
                                    const fullName = [m.firstName, m.lastName].filter(Boolean).join(' ');
                                    const originalRelation = m.nuclearRelation || m.relationshipToHead || 'Relation: N/A';
                                    const ageStr = m.age ? `${m.age} years old` : 'Age: N/A';

                                    return (
                                      <li key={m.id}>
                                        <span className="font-medium">{fullName}</span> — {originalRelation} — {ageStr}
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 mt-1">Loading...</p>
                        )}

                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          ) : (
            <tr>
              <td colSpan="8" className="text-center py-4 text-gray-500">
                No households found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex justify-end items-center mt-4 text-sm text-gray-700 space-x-6 px-4">
        <div>
          <strong>Total Households:</strong> {totalHouseholds}
        </div>
        <div>
          <strong>Total Residents:</strong> {totalResidents}
        </div>
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
