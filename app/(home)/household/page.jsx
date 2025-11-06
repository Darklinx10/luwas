'use client';

import RoleGuard from '@/components/roleGuard';
import { db } from '@/firebase/config';
import { collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import EditMemberModal from './components/edithhMemberModal';
import EditHouseholdModal from './components/editHouseholModal';
import HouseholdTable from './components/HouseholdTable';
import { useAuth } from '@/context/authContext'; // ✅ use AuthContext

const MapPopup = dynamic(() => import('../../../components/mapPopUP'), { ssr: false });

export default function HouseholdPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth(); // ✅ get user data from context

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [updating, setUpdating] = useState(false);

  // ✅ Handle member edit
  const handleEditMember = (member, householdId) => {
    setSelectedMember({ ...member, householdId });
    setIsEditModalOpen(true);
  };

  // ✅ Handle member deletion
  const handleDeleteMember = async (memberId) => {
    const confirmed = confirm('Are you sure you want to delete this member?');
    if (!confirmed) return;

    try {
      const householdId = Object.entries(membersData).find(([_, members]) =>
        members.some((m) => m.id === memberId)
      )?.[0];

      if (!householdId) {
        toast.error("Unable to identify member's household");
        return;
      }

      await deleteDoc(doc(db, 'households', householdId, 'members', memberId));

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

  // ✅ Handle edit field change
  const handleEditFieldChange = (e) => {
    const { name, value } = e.target;
    setSelectedMember((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Save edited member
  const handleSaveEdit = async () => {
    try {
      setUpdating(true);
      const { householdId, id, firstName, lastName, middleName, contactNumber, nuclearRelation } =
        selectedMember;

      const memberRef = doc(db, 'households', householdId, 'members', id);
      const updateData = { firstName, lastName, middleName, contactNumber };

      if (nuclearRelation !== undefined) updateData.nuclearRelation = nuclearRelation;

      await updateDoc(memberRef, updateData);

      setMembersData((prev) => ({
        ...prev,
        [householdId]: prev[householdId].map((m) =>
          m.id === id ? { ...m, ...updateData } : m
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

  const handleCloseEditModal = useCallback(() => setEditModalOpen(false), []);
  const handleAddClick = () => router.push('/household/add');

  // ✅ Map popup handler
  const openMapWithLocation = (lat, lng) => {
    if (lat && lng) {
      setSelectedLocation({ lat: parseFloat(lat), lng: parseFloat(lng) });
      setMapOpen(true);
    } else {
      alert('No location data available for this household.');
    }
  };

  // ✅ Download as CSV
  const downloadCSV = () => {
    const csvHeaders = ['Household ID', 'Family Head', 'Barangay', 'Sex', 'Age', 'Contact Number'];
    const rows = households.map((h) => [
      h.householdId,
      [h.headFirstName, h.headMiddleName, h.headLastName, h.headSuffix !== 'n/a' ? h.headSuffix : '']
        .filter(Boolean)
        .join(' '),
      h.barangay,
      h.headSex,
      h.headAge,
      h.contactNumber,
    ]);

    const csvContent = [csvHeaders, ...rows]
      .map((e) => e.map((f) => `"${String(f ?? '')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'households.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ✅ Relation mapping
  const mapRelationToCategory = (relation) => {
    if (!relation) return '';
    const lower = relation.toLowerCase();
    if (['head', 'family head'].includes(lower)) return 'Head';
    if (['spouse', 'partner'].includes(lower)) return 'Spouse';
    if (['son', 'daughter', 'child', 'nephew', 'niece'].includes(lower)) return 'Child';
    if (['father', 'mother', 'father-in-law', 'mother-in-law', 'parent'].includes(lower))
      return 'Parent';
    if (['brother', 'sister', 'brother-in-law', 'sister-in-law', 'sibling'].includes(lower))
      return 'Sibling';
    if (['uncle', 'aunt', 'other relative', 'relative'].includes(lower)) return 'Relative';
    return 'Other';
  };

  // ✅ Expand/collapse households and fetch members
  const toggleExpanded = async (householdId) => {
    setExpandedHouseholds((prev) => ({ ...prev, [householdId]: !prev[householdId] }));

    if (!membersData[householdId]) {
      setLoadingMembers((prev) => ({ ...prev, [householdId]: true }));

      try {
        const memberSnapshot = await getDocs(collection(db, 'households', householdId, 'members'));

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

            return { id: memberId, ...baseData, ...demoData };
          })
        );

        setMembersData((prev) => ({ ...prev, [householdId]: members }));
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setLoadingMembers((prev) => ({ ...prev, [householdId]: false }));
      }
    }
  };

  // ✅ Fetch households
  const fetchHouseholds = async () => {
    setLoading(true);
    try {
      const householdsSnapshot = await getDocs(collection(db, 'households'));
      let residentCounter = 0;

      const householdList = await Promise.all(
        householdsSnapshot.docs.map(async (hhDoc) => {
          const householdId = hhDoc.id;
          const geoSnap = await getDoc(doc(db, 'households', householdId, 'geographicIdentification', 'main'));
          const geoData = geoSnap.exists() ? geoSnap.data() : {};

          const memberSnap = await getDocs(collection(db, 'households', householdId, 'members'));
          residentCounter += memberSnap.size;

          let headData = {};

          await Promise.all(
            memberSnap.docs.map(async (memberDoc) => {
              const baseData = memberDoc.data();
              const demoSnap = await getDoc(
                doc(db, 'households', householdId, 'members', memberDoc.id, 'demographicCharacteristics', 'main')
              );
              const demoData = demoSnap.exists() ? demoSnap.data() : {};
              const relationship = demoData.relationshipToHead || baseData.relationshipToHead || '';

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

          return { householdId, ...geoData, ...headData };
        })
      );

      const validHouseholds = householdList.filter(
        (h) =>
          h.headFirstName || h.headLastName || h.barangay || h.latitude || h.longitude
      );

      setHouseholds(validHouseholds);
      setTotalHouseholds(validHouseholds.length);
      setTotalResidents(residentCounter);
    } catch (error) {
      console.error('Error fetching households:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHouseholds();
  }, []);

  // ✅ Role-based filtering
  const filteredByRoleAndBarangay = useMemo(() => {
    if (!profile) return households;

    if (profile.role === 'Brgy-Secretary') {
      return households.filter(
        (hh) => (hh.barangay || '').toLowerCase() === profile.barangay?.toLowerCase()
      );
    }
    return households;
  }, [households, profile]);

  // ✅ Search filtering
  const filteredHouseholds = filteredByRoleAndBarangay.filter((data) =>
    [
      data.headFirstName || '',
      data.headMiddleName || '',
      data.headLastName || '',
    ]
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (authLoading) return <div className="p-4 text-gray-500">Loading user...</div>;

  return (
    <RoleGuard allowedRoles={['Brgy-Secretary', 'MDRRMC-Personnel']}>
      <div className="p-4">
        <div className="text-sm text-right text-gray-500 mb-2 print:hidden">Home / Households</div>
        <div id="print-section">
          <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-semibold text-lg print:text-black print:text-center print:font-bold print:py-2 print:rounded-none">
            Household Information (2025)
          </div>

          {/* Search + Actions */}
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

            {profile?.role === 'Brgy-Secretary' && (
              <button
                onClick={() => {
                  setLoading(true);
                  handleAddClick();
                  setTimeout(() => setLoading(false), 1000);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded text-white bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                <FiPlus />
                Add Household
              </button>
            )}

            {profile?.role === 'MDRRMC-Personnel' && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setLoading(true);
                    window.print();
                    setTimeout(() => setLoading(false), 1000);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  Print
                </button>

                <button
                  onClick={() => {
                    setLoading(true);
                    downloadCSV();
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

          <HouseholdTable
            loading={loading}
            households={households}
            filteredHouseholds={filteredHouseholds}
            expandedHouseholds={expandedHouseholds}
            membersData={membersData}
            toggleExpanded={toggleExpanded}
            openMapWithLocation={openMapWithLocation}
            setSelectedHouseholdId={setSelectedHouseholdId}
            setEditModalOpen={setEditModalOpen}
            fetchHouseholds={fetchHouseholds}
            totalHouseholds={totalHouseholds}
            totalResidents={totalResidents}
            handleEditMember={handleEditMember}
            handleDeleteMember={handleDeleteMember}
            loadingMembers={loadingMembers}
            db={db}
            deleteDoc={deleteDoc}
            doc={doc}
            toast={toast}
            setLoading={setLoading}
          />
        </div>

        {/* Modals */}
        <EditMemberModal
          isOpen={isEditModalOpen}
          member={selectedMember}
          onClose={() => setIsEditModalOpen(false)}
          onChange={handleEditFieldChange}
          onSave={handleSaveEdit}
          updating={updating}
          mapRelationToCategory={mapRelationToCategory}
        />

        <EditHouseholdModal
          open={editModalOpen}
          onClose={handleCloseEditModal}
          householdId={selectedHouseholdId}
          onUpdated={fetchHouseholds}
        />

        <MapPopup isOpen={mapOpen} onClose={() => setMapOpen(false)} location={selectedLocation} readOnly />
      </div>
    </RoleGuard>
  );
}
