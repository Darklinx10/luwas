'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiSearch, FiEdit, FiTrash2 } from 'react-icons/fi';
import { FaArrowRight } from 'react-icons/fa';
import { collection, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import dynamic from 'next/dynamic';
import EditHouseholdModal from '@/components/modals/editHouseholModal';

// Dynamically import map component to avoid SSR issues
const MapPopup = dynamic(() => import('@/components/mapPopUp'), { ssr: false });

export default function HouseholdPage() {
  const router = useRouter();

  // State management
  const [mapOpen, setMapOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [households, setHouseholds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedHouseholds, setExpandedHouseholds] = useState({});
  const [membersData, setMembersData] = useState({});
  const [totalHouseholds, setTotalHouseholds] = useState(0);
  const [totalResidents, setTotalResidents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState(null);

  // Redirect to add household form
  const handleAddClick = () => {
    router.push('/household/addHouseholdForms');
  };

  // Open map modal with given coordinates
  const openMapWithLocation = (lat, lng) => {
    if (lat && lng) {
      setSelectedLocation({ lat: parseFloat(lat), lng: parseFloat(lng) });
      setMapOpen(true);
    } else {
      alert('No location data available for this household.');
    }
  };

  // Expand/collapse household and fetch members if not cached
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

            // Fetch demographic data
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

  // Fetch all household data
  const fetchHouseholds = async () => {
    setLoading(true);
    try {
      const householdsSnapshot = await getDocs(collection(db, 'households'));
      const householdList = [];
      let residentCounter = 0;

      for (const hhDoc of householdsSnapshot.docs) {
        const householdId = hhDoc.id;

        // Get geographic data
        const geoDocRef = doc(db, 'households', householdId, 'geographicIdentification', 'main');
        const geoSnap = await getDoc(geoDocRef);
        const geoData = geoSnap.exists() ? geoSnap.data() : {};

        // Get household members
        const memberSnap = await getDocs(collection(db, 'households', householdId, 'members'));
        residentCounter += memberSnap.size;

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

          // Identify head of household
          if (relationship.toLowerCase() === 'head') {
            headData = {
              headFirstName: baseData.firstName || demoData.firstName || '',
              headMiddleName: baseData.middleName || demoData.middleName || '',
              headLastName: baseData.lastName || demoData.lastName || '',
              headSuffix: baseData.suffix || demoData.suffix || '',
              headSex:  demoData.sex || '',
              headAge:  demoData.age || '',
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

        // Filter out incomplete records
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

  useEffect(() => {
    fetchHouseholds();
  }, []);

  // Filter by family head name
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
      {/* Breadcrumb */}
      <div className="text-sm text-right text-gray-500 mb-2">Home / Households</div>

      {/* Header */}
      <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-semibold text-lg">
        Household Information (2025)
      </div>

      {/* Search and Add Button */}
      <div className="flex items-center justify-between bg-white shadow border-t-0 px-4 py-3">
        <div className="relative w-1/2 max-w-md">
          <FiSearch className="absolute top-2.5 left-3 text-gray-400" />
          <input
            id='Search-input'
            name='search'
            type="text"
            placeholder="Search Family Head"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 cursor-pointer"
        >
          <FiPlus />
          Add
        </button>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto shadow border-t-0 rounded-b-md bg-white p-4">
        {loading ? (
          <p className="text-center text-gray-500 py-6 animate-pulse">Fetching household records...</p>
        ) : households.length === 0 ? (
          <p className="text-center text-gray-500 py-6">No household records found.</p>
        ) : filteredHouseholds.length === 0 ? (
          <p className="text-center text-gray-500 py-6">No results matched your search.</p>
        ) : (
          <>
            {/* Household Table */}
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
                {[...filteredHouseholds]
                  .sort((a, b) =>
                    [a.headFirstName, a.headMiddleName, a.headLastName]
                      .join(' ')
                      .localeCompare([b.headFirstName, b.headMiddleName, b.headLastName].join(' '))
                  )
                  .map((data) => {
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
                          
                          {/* Expand button */}
                          <td className="p-2 border text-center">
                            <button onClick={() => toggleExpanded(data.householdId)} title="View Members">
                              <FaArrowRight
                                className={`text-green-600 inline transition-transform duration-200 cursor-pointer ${
                                  isExpanded ? 'rotate-90' : ''
                                }`}
                              />
                            </button>
                          </td>
                          <td className="p-2 border">{fullName || '-'}</td>
                          <td className="p-2 border">{data.barangay || '-'}</td>
                          <td className="p-2 border">{data.headSex || '-'}</td>
                          <td className="p-2 border">{data.contactNumber || '-'}</td>
                          <td className="p-2 border">{data.headAge || '-'}</td>
                          <td className="p-2 border">
                            <button
                              onClick={() => openMapWithLocation(data.latitude, data.longitude)}
                              className="bg-green-600 text-white px-3 py-1 text-xs rounded hover:bg-green-700 cursor-pointer"
                            >
                              Map
                            </button>
                          </td>
                          <td className="p-2 border space-x-2">
                            {/* Edit household */}
                            <button
                              onClick={() => {
                                setSelectedHouseholdId(data.householdId);
                                setEditModalOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 cursor-pointer"
                              title="Edit"
                            >
                              <FiEdit />
                            </button>

                            {/* Delete household */}
                            <button
                            onClick={async () => {
                              const confirmed = confirm('Are you sure you want to delete this household?');
                              if (!confirmed) return;

                              try {
                                const docRef = doc(db, 'households', data.householdId);
                                await deleteDoc(docRef); // Direct call to delete the document
                                await fetchHouseholds(); // Refresh the list
                                alert('Household deleted successfully.');
                              } catch (error) {
                                console.error('Error deleting household:', error);
                                alert('Failed to delete household.');
                              }
                            }}
                            className="text-red-600 hover:text-red-800 cursor-pointer"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                          </td>
                        </tr>

                        {/* Member list row */}
                        {isExpanded && (
                          <tr>
                            <td colSpan="8" className="p-4 border bg-gray-50 text-left text-sm">
                              <strong>Household Members:</strong>
                              {members.length > 0 ? (
                                <div className="mt-2">
                                  {Object.entries(
                                    // Filter out the household head BEFORE grouping
                                    members
                                      .filter(
                                        (m) =>
                                          (m.relationshipToHead || m.nuclearRelation || '').toLowerCase() !== 'head'
                                      )
                                      .reduce((acc, m) => {
                                        const rawRelation =
                                          m.nuclearRelation || m.relationshipToHead || 'Unspecified';
                                        const relationLabel = rawRelation.includes(' - ')
                                          ? rawRelation.split(' - ')[1].trim()
                                          : rawRelation.trim();

                                        if (!acc[relationLabel]) acc[relationLabel] = [];
                                        acc[relationLabel].push(m);
                                        return acc;
                                      }, {})
                                  ).map(([relation, group]) => (
                                    <div key={relation} className="mt-2">
                                      <p className="font-semibold text-green-700">{relation}</p>
                                      <ul className="list-disc list-inside ml-4">
                                        {group.map((m) => {
                                          const name = [m.firstName, m.lastName].filter(Boolean).join(' ');
                                          const originalRelation =
                                            m.nuclearRelation || m.relationshipToHead || 'N/A';
                                          const ageStr = m.age ? `${m.age} years old` : 'Age: N/A';

                                          return (
                                            <li key={m.id}>
                                              <span className="font-medium">{name}</span> — {originalRelation} — {ageStr}
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
                  })}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-start items-center mt-4 text-sm text-gray-700 space-x-6">
              <div>
                <strong>Total Households:</strong> {totalHouseholds}
              </div>
              <div>
                <strong>Total Residents:</strong> {totalResidents}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <EditHouseholdModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        householdId={selectedHouseholdId}
        onUpdated={fetchHouseholds} // ✅ This triggers refresh after update
      />


      <MapPopup
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        location={selectedLocation}
        readOnly={true}
      />
    </div>
  );
}
