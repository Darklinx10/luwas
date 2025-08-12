'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiSearch, FiEdit, FiTrash2 } from 'react-icons/fi';
import { FaArrowRight } from 'react-icons/fa';
import { collection, getDocs, doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/firebase/config';
import dynamic from 'next/dynamic';
import EditHouseholdModal from '@/components/modals/editHouseholModal';
import { toast } from 'react-toastify';
import RoleGuard from '@/components/roleGuard';

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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState(null);
  const [loadingMembers, setLoadingMembers] = useState({});
  const [profile, setProfile] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [updating, setUpdating] = useState(false);

  const handleEditMember = (member, householdId) => {
    setSelectedMember({ ...member, householdId });
    setIsEditModalOpen(true);
  };

  const handleDeleteMember = async (memberId) => {
    const confirmed = confirm('Are you sure you want to delete this member?');
    if (!confirmed) return;

    try {
      // Find which household the member belongs to
      const householdId = Object.entries(membersData).find(([_, members]) =>
        members.some((m) => m.id === memberId)
      )?.[0];

      if (!householdId) {
        toast.error('Unable to identify member\'s household');
        return;
      }

      await deleteDoc(doc(db, 'households', householdId, 'members', memberId));

      // Remove from UI
      setMembersData((prev) => ({
        ...prev,
        [householdId]: prev[householdId].filter((m) => m.id !== memberId),
      }));

      toast.success('Member deleted successfully');
    } catch (error) {
      console.error('Failed to delete member', error);
      toast.error('Failed to delete member');
    }
  };

  const handleEditFieldChange = (e) => {
    const { name, value } = e.target;
    setSelectedMember((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    try {
      setUpdating(true);
      const { householdId, id, firstName, lastName, middleName, contactNumber, nuclearRelation } = selectedMember;

      const memberRef = doc(db, 'households', householdId, 'members', id);

      // Prepare the update object
      const updateData = {
        firstName,
        lastName,
        middleName,
        contactNumber,
      };

      // Only add nuclearRelation if it's defined (not undefined)
      if (nuclearRelation !== undefined) {
        updateData.nuclearRelation = nuclearRelation;
      }

      await updateDoc(memberRef, updateData);

      setMembersData((prev) => ({
        ...prev,
        [householdId]: prev[householdId].map((member) =>
          member.id === id
            ? {
                ...member,
                firstName,
                lastName,
                middleName,
                contactNumber,
                nuclearRelation,
              }
            : member
        ),
      }));

      toast.success('Member updated!');
      setIsEditModalOpen(false);
      setSelectedMember(null);
    } catch (error) {
      console.error('Update failed', error);
      toast.error('Failed to update member');
    } finally {
      setUpdating(false);
    }
  };



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

  const downloadCSV = () => {
    const csvHeaders = ['Household ID', 'Family Head', 'Barangay', 'Sex', 'Age', 'Contact Number'];
    const rows = households.map(h => [
      h.householdId,
      [h.headFirstName, h.headMiddleName, h.headLastName, h.headSuffix !== 'n/a' ? h.headSuffix : ''].filter(Boolean).join(' '),
      h.barangay,
      h.headSex,
      h.headAge,
      h.contactNumber
    ]);

    const csvContent = [csvHeaders, ...rows]
      .map(e => e.map(field => `"${String(field ?? '')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'households.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const mapRelationToCategory = (relation) => {
    if (!relation) return '';

    const lower = relation.toLowerCase();

    if (['head', 'family head'].includes(lower)) return 'Head';
    if (['spouse', 'partner'].includes(lower)) return 'Spouse';
    if (['son', 'daughter', 'child', 'nephew', 'niece'].includes(lower)) return 'Child';
    if (['father', 'mother', 'father-in-law', 'mother-in-law', 'parent'].includes(lower)) return 'Parent';
    if (['brother', 'sister', 'brother-in-law', 'sister-in-law', 'sibling'].includes(lower)) return 'Sibling';
    if (['uncle', 'aunt', 'other relative', 'relative'].includes(lower)) return 'Relative';
    if (['border', 'nonrelative', 'domestic helper', 'other'].includes(lower)) return 'Other';

    return 'Other'; // fallback
  };

  const toggleExpanded = async (householdId) => {
    setExpandedHouseholds((prev) => ({
      ...prev,
      [householdId]: !prev[householdId],
    }));

    if (!membersData[householdId]) {
      setLoadingMembers((prev) => ({
        ...prev,
        [householdId]: true,
      }));

      try {
        const memberSnapshot = await getDocs(
          collection(db, 'households', householdId, 'members')
        );

        const memberPromises = memberSnapshot.docs.map(async (docSnap) => {
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
        });

        const members = await Promise.all(memberPromises);

        setMembersData((prev) => ({
          ...prev,
          [householdId]: members,
        }));
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setLoadingMembers((prev) => ({
          ...prev,
          [householdId]: false,
        }));
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchHouseholds = async () => {
    setLoading(true);
    try {
      const householdsSnapshot = await getDocs(collection(db, 'households'));
      let residentCounter = 0;

      const householdPromises = householdsSnapshot.docs.map(async (hhDoc) => {
        const householdId = hhDoc.id;

        const geoDocRef = doc(db, 'households', householdId, 'geographicIdentification', 'main');
        const geoSnap = await getDoc(geoDocRef);
        const geoData = geoSnap.exists() ? geoSnap.data() : {};

        const memberSnap = await getDocs(collection(db, 'households', householdId, 'members'));
        residentCounter += memberSnap.size;

        let headData = {};

        // Removed unused `memberData`
        await Promise.all(
          memberSnap.docs.map(async (memberDoc) => {
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
                headSex: demoData.sex || '',
                headAge: demoData.age || '',
                contactNumber: demoData.contactNumber || '',
              };
            }
          })
        );

        return {
          householdId,
          ...geoData,
          ...headData,
        };
      });

      const householdList = (await Promise.all(householdPromises)).filter(
        (merged) =>
          merged.headFirstName ||
          merged.headLastName ||
          merged.barangay ||
          merged.latitude ||
          merged.longitude
      );

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

  const filteredByRoleAndBarangay = React.useMemo(() => {
    if (!profile) return households;

    if (profile.role === 'Secretary') {
      // Show only households with the same barangay as the secretary's barangay
      return households.filter(
        (hh) => (hh.barangay || '').toLowerCase() === profile.barangay.toLowerCase()
      );
    } else if (profile.role === 'OfficeStaff') {
      // OfficeStaff sees all households, no filter
      return households;
    } else {
      // Other roles can have custom logic or default to all
      return households;
    }
  }, [households, profile]);


  const filteredHouseholds = filteredByRoleAndBarangay.filter((data) => {
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
    <RoleGuard allowedRoles={['Secretary', 'OfficeStaff']}>
      <div className="p-4">
        {/* Breadcrumb */}
        <div className="text-sm text-right text-gray-500 mb-2 print:hidden">Home / Households</div>
        <div id="print-section">
          {/* Header */}
          <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-semibold text-lg print:text-black print:text-center print:font-bold print:py-2 print:rounded-none">
            Household Information (2025)
          </div>


          {/* Search and Actions (Hidden on Print) */}
          <div className="flex flex-wrap items-center justify-between bg-white shadow border-t-0 px-4 py-3 gap-2 print:hidden">
            <div className="relative w-full sm:w-1/2 max-w-md">
              <FiSearch className="absolute top-2.5 left-3 text-gray-400" />
              <input
                id="Search-input"
                name="search"
                type="text"
                placeholder="Search Family Head"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {profile?.role === 'Secretary' && (
              <button
                onClick={() => {
                  setLoading(true);
                  handleAddClick(); // You can await this if it's async
                  setTimeout(() => setLoading(false), 1000); // Optional delay like print
                }}
                className="flex items-center gap-2 px-4 py-2 rounded text-white bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                <FiPlus />
                Add Household
              </button>
            )}


            {profile?.role === 'OfficeStaff' && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setLoading(true);
                    window.print();
                    setTimeout(() => setLoading(false), 1000); // slight delay after print
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  Print
                </button>

                <button
                  onClick={async () => {
                    setLoading(true);
                    downloadCSV(); // assume this is an async function
                    setLoading(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  Download CSV
                </button>
              </div>
            )}

          </div>

          <div className="overflow-x-auto shadow border-t-0 rounded-b-md bg-white p-4">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="flex flex-col items-center">
                  <svg
                    className="animate-spin h-10 w-10 text-green-500 mb-3"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <p className="text-gray-600 text-sm">Loading household records...</p>
                </div>
              </div>
            ) : households.length === 0 ? (
              <p className="text-center text-gray-500 py-6">No results matched your search.</p>
            ) : filteredHouseholds.length === 0 ? (
              <p className="text-center text-gray-500 py-6">No household records found.</p>
            ) : (
              <>
                <table className="w-full text-sm text-center print:text-xs print:border print:border-gray-400">
                  <thead className="bg-gray-100 text-gray-600 print:bg-white print:text-black">
                    <tr>
                      <th className="p-2 border print:hidden"></th>
                      <th className="p-2 border">Family Head</th>
                      <th className="p-2 border">Barangay</th>
                      <th className="p-2 border">Sex</th>
                      <th className="p-2 border">Contact Number</th>
                      <th className="p-2 border">Age</th>
                      <th className="p-2 border print:hidden">Map</th>
                      <th className="p-2 border print:hidden">Actions</th>
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
                              <td className="p-2 border text-center print:hidden">
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
                              <td className="p-2 border print:hidden">
                                <button
                                  onClick={() => openMapWithLocation(data.latitude, data.longitude)}
                                  className="bg-green-600 text-white px-3 py-1 text-xs rounded hover:bg-green-700 cursor-pointer"
                                >
                                  Map
                                </button>
                              </td>
                              <td className="p-2 border space-x-2 print:hidden">
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
                                <button
                                  onClick={async () => {
                                    const confirmed = confirm('Are you sure you want to delete this household?');
                                    if (!confirmed) return;

                                    setLoading(true);
                                    try {
                                      const docRef = doc(db, 'households', data.householdId);
                                      await deleteDoc(docRef);
                                      await fetchHouseholds();
                                      toast.success('Household deleted successfully.');
                                    } catch (error) {
                                      console.error('Error deleting household:', error);
                                      toast.error('Failed to delete household.');
                                    } finally {
                                      setLoading(false);
                                    }
                                  }}
                                  disabled={loading}
                                  className={`text-red-600 hover:text-red-800 cursor-pointer ${
                                    loading ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                  title="Delete"
                                >
                                  {loading ? 'Deleting...' : <FiTrash2 />}
                                </button>
                              </td>
                            </tr>

                            {/* Member list row */}
                            {isExpanded && (
                              <tr>
                                <td colSpan="8" className="p-4 border bg-gray-50 text-left text-sm">
                                  <strong>Household Members:</strong>

                                  {loadingMembers[data.householdId] ? (
                                    <p className="text-gray-500 mt-1 animate-pulse">Loading household members...</p>
                                  ) : members.length === 0 ? (
                                    <p className="text-gray-500 mt-1">No household members found...</p>
                                  ) : members.filter(
                                      (m) =>
                                        (m.relationshipToHead || m.nuclearRelation || '').toLowerCase() !== 'head'
                                    ).length === 0 ? (
                                    <p className="text-gray-500 mt-1">No members found...</p>
                                  ) : (
                                    <div className="mt-2 overflow-x-auto">
                                      <table className="w-full text-center text-sm border border-collapse">
                                        <thead>
                                          <tr className="bg-gray-100 text-gray-600">
                                            <th className="p-2 border">Name</th>
                                            <th className="p-2 border">Relation</th>
                                            <th className="p-2 border">Age</th>
                                            <th className="p-2 border">Contact Number</th>
                                            <th className="p-2 border text-center">Actions</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {members
                                            .filter(
                                              (m) =>
                                                (m.relationshipToHead || m.nuclearRelation || '').toLowerCase() !== 'head'
                                            )
                                            .map((m) => {
                                              const name = [m.firstName,m.middleName, m.lastName].filter(Boolean).join(' ');
                                              const rawRelation = m.nuclearRelation || m.relationshipToHead || 'Unspecified';
                                              const relationLabel = rawRelation.includes(' - ')
                                                ? rawRelation.split(' - ')[1].trim()
                                                : rawRelation.trim();
                                              const ageStr = m.age ? `${m.age} ` : 'N/A';
                                              const contactNumber = m.contactNumber;

                                              return (
                                                <tr key={m.id} className="hover:bg-gray-100">
                                                  <td className="p-2 border">{name || 'Unnamed'}</td>
                                                  <td className="p-2 border">{relationLabel}</td>
                                                  <td className="p-2 border">{ageStr}</td>
                                                  <td className="p-2 border">{contactNumber}</td>
                                                  <td className="p-2 border text-center space-x-2">
                                                    <button
                                                      onClick={() => handleEditMember(m, data.householdId)}
                                                      className="text-blue-600 hover:text-blue-800"
                                                      title="Edit"
                                                    >
                                                      <FiEdit />
                                                    </button>

                                                    <button
                                                      onClick={() => handleDeleteMember(m.id)}
                                                      className="text-red-600 hover:text-red-800"
                                                      title="Delete"
                                                    >
                                                      <FiTrash2 />
                                                    </button>
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}

                          </React.Fragment>
                        );
                      })}
                  </tbody>
                </table>

                {isEditModalOpen && selectedMember && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
                      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-[90%] max-w-lg">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">Edit Member Information</h2>

                        <div className="space-y-4">
                          {/* First Name */}
                          <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                              First Name
                            </label>
                            <input
                              id="firstName"
                              name="firstName"
                              value={selectedMember.firstName || ''}
                              onChange={handleEditFieldChange}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>

                          {/* Last Name */}
                          <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                              Last Name
                            </label>
                            <input
                              id="lastName"
                              name="lastName"
                              value={selectedMember.lastName || ''}
                              onChange={handleEditFieldChange}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>

                          <div>
                            <label htmlFor="middleName" className="block text-sm font-medium text-gray-700 mb-1">
                              Middle Name
                            </label>
                            <input
                              type="text"
                              name="middleName"
                              value={selectedMember.middleName || ''}
                              onChange={handleEditFieldChange}
                              placeholder="Middle Name"
                              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div> 


                          {/* Age */}
                          <div>
                            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                              Age
                            </label>
                            <input
                              id="age"
                              name="age"
                              type="number"
                              value={selectedMember.age || ''}
                              readOnly
                              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>

                          {/* Contact Number - NEW */}
                          <div>
                            <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">
                              Contact Number
                            </label>
                            <input
                              id="contactNumber"
                              name="contactNumber"
                              type="tel"
                              value={selectedMember.contactNumber || ''}
                              onChange={handleEditFieldChange}
                              placeholder="e.g. 0917XXXXXXX"
                              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          {/* Relation to Head */}
                          <div>
                            <label htmlFor="nuclearRelation" className="block text-sm font-medium text-gray-700 mb-1">
                              Relation to Head
                            </label>
                            <select
                              name="nuclearRelation"
                              value={mapRelationToCategory(selectedMember.nuclearRelation || selectedMember.relationshipToHead)}
                              onChange={handleEditFieldChange}
                              className="w-full border rounded px-3 py-2"
                            >
                              <option value="" disabled>Select relation</option>
                              <option value="Head">Head</option>
                              <option value="Spouse">Spouse</option>
                              <option value="Partner">Partner</option>
                              <option value="Child">Child</option>
                              <option value="Parent">Parent</option>
                              <option value="Sibling">Sibling</option>
                              <option value="Relative">Relative</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>

                        {/* Buttons */}
                        <div className="mt-6 flex justify-end gap-3">
                          <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
                          >
                            Cancel
                          </button>

                          <button
                            onClick={handleSaveEdit}
                            disabled={updating}
                            className={`px-4 py-2 rounded-lg text-white transition flex justify-center items-center gap-2 ${
                              updating ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500'
                            }`}
                          >
                            {updating ? (
                              <>
                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
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
                                Updating...
                              </>
                            ) : (
                              'Save'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                          
                {/* Totals */}
                <div className="flex justify-start items-center mt-4 text-sm text-gray-700 space-x-6 print:hidden">
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
    </RoleGuard>
  );
}
