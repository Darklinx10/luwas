'use client';

import RoleGuard from '@/components/roleGuard';
import { db } from '@/firebase/config';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useRef, useState, useCallback} from 'react';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import EditMemberModal from './components/edithhMemberModal';
import EditHouseholdModal from './components/editHouseholModal';
import HouseholdTable from './components/HouseholdTable';
import { useAuth } from '@/context/authContext';

const MapPopup = dynamic(() => import('../../../components/mapPopUP'), { ssr: false });

export default function HouseholdPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();

  const [households, setHouseholds] = useState([]);
  const [membersData, setMembersData] = useState({});
  const [expandedHouseholds, setExpandedHouseholds] = useState({});
  const [loadingMembers, setLoadingMembers] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const [totalHouseholds, setTotalHouseholds] = useState(0);
  const [totalResidents, setTotalResidents] = useState(0);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [updating, setUpdating] = useState(false);

  const [mapOpen, setMapOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedHomeIndex, setSelectedHomeIndex] = useState(null);

  const [year, setYear] = useState(new Date().getFullYear());

  const memberListeners = useRef({});

  /* =========================
     FETCH HOUSEHOLDS (Reusable)
  ========================== */
  const fetchHouseholds = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'households'));
      let nonEmptyHouseholdCount = 0;

      const list = await Promise.all(
        snapshot.docs.map(async (hhDoc) => {
          const householdId = hhDoc.id;

          // Geographic info
          const geoSnap = await getDoc(
            doc(db, 'households', householdId, 'geographicIdentification', 'main')
          );
          const geoData = geoSnap.exists() ? geoSnap.data() : {};

          let headData = {};
          const uniqueResidentIds = new Set();
          let headFoundInMembers = false;

          // Members
          const membersSnap = await getDocs(
            collection(db, 'households', householdId, 'members')
          );

          for (const m of membersSnap.docs) {
            const base = m.data();
            const demoSnap = await getDoc(
              doc(
                db,
                'households',
                householdId,
                'members',
                m.id,
                'demographicCharacteristics',
                'main'
              )
            );
            const demo = demoSnap.exists() ? demoSnap.data() : {};
            const rel = demo.relationshipToHead || base.relationshipToHead || '';

            if (rel.toLowerCase() === 'head') {
              headData = {
                headFirstName: base.firstName || '',
                headMiddleName: base.middleName || '',
                headLastName: base.lastName || '',
                headSuffix: base.suffix || '',
                headSex: demo.sex || '',
                headAge: demo.age || '',
                contactNumber: demo.contactNumber || '',
              };
              headFoundInMembers = true;
              uniqueResidentIds.add(m.id);
            } else {
              uniqueResidentIds.add(m.id);
            }
          }

          // If no head in members, use geographicIdentification
          if (!headFoundInMembers && geoData?.headFirstName) {
            headData = {
              headFirstName: geoData.headFirstName,
              headMiddleName: geoData.headMiddleName,
              headLastName: geoData.headLastName,
              headSuffix: geoData.headSuffix,
              headSex: geoData.headSex,
              headAge: geoData.headAge,
              contactNumber: geoData.contactNumber,
            };
            uniqueResidentIds.add(`head-${householdId}`); // synthetic ID for head
          }

          const hasData =
            headData.headFirstName || headData.headLastName || geoData?.barangay || membersSnap.size > 0;

          if (hasData) nonEmptyHouseholdCount++;

          return { householdId, ...geoData, ...headData, hasData, residentCount: uniqueResidentIds.size };
        })
      );

      const valid = list.filter((h) => h.hasData);

      setHouseholds(valid);
      setTotalHouseholds(nonEmptyHouseholdCount);
      setTotalResidents(valid.reduce((sum, h) => sum + h.residentCount, 0));
    } catch (error) {
      console.error('Failed to fetch households:', error);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     INITIAL LOAD
  ========================== */
  useEffect(() => {
    fetchHouseholds();
  }, []);

  /* =========================
     REALTIME MEMBERS PER HH
  ========================== */
  const toggleExpanded = (householdId) => {
    setExpandedHouseholds((p) => ({ ...p, [householdId]: !p[householdId] }));

    if (memberListeners.current[householdId]) return;

    setLoadingMembers((p) => ({ ...p, [householdId]: true }));

    memberListeners.current[householdId] = onSnapshot(
      collection(db, 'households', householdId, 'members'),
      async (snap) => {
        const members = await Promise.all(
          snap.docs.map(async (d) => {
            const base = d.data();
            const demoSnap = await getDoc(
              doc(
                db,
                'households',
                householdId,
                'members',
                d.id,
                'demographicCharacteristics',
                'main'
              )
            );
            const demo = demoSnap.exists() ? demoSnap.data() : {};
            return { id: d.id, ...base, ...demo };
          })
        );

        setMembersData((p) => ({ ...p, [householdId]: members }));
        setLoadingMembers((p) => ({ ...p, [householdId]: false }));
      }
    );
  };

  /* =========================
     MEMBER CRUD
  ========================== */
  const handleEditMember = (member, householdId) => {
    setSelectedMember({ ...member, householdId });
    setIsEditModalOpen(true);
  };

  const handleDeleteMember = async (memberId) => {
    const confirmed = confirm('Delete this member?');
    if (!confirmed) return;

    try {
      const householdId = Object.entries(membersData).find(([_, m]) =>
        m.some((x) => x.id === memberId)
      )?.[0];

      if (!householdId) return;

      await deleteDoc(doc(db, 'households', householdId, 'members', memberId));
      toast.success('Member deleted');
      fetchHouseholds(); // refresh table after deleting member
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleSaveEdit = async () => {
    try {
      setUpdating(true);
      const { householdId, id, ...data } = selectedMember;
      await updateDoc(doc(db, 'households', householdId, 'members', id), data);
      toast.success('Member updated');
      setIsEditModalOpen(false);
      fetchHouseholds(); // refresh table after edit
    } catch {
      toast.error('Update failed');
    } finally {
      setUpdating(false);
    }
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

  const handleCloseEditModal = useCallback(() => setEditModalOpen(false), []);
  const handleAddClick = () => router.push('/household/add');

  // ✅ Handle edit field change
  const handleEditFieldChange = (e) => {
    const { name, value } = e.target;
    setSelectedMember((prev) => ({ ...prev, [name]: value }));
  };

  // =========================
  // MAP HANDLER FOR MULTIPLE HOMES
  // =========================
  const openMapWithLocation = (household, index = 0) => {
    const home = household.homes?.[index];
    if (home && home.latitude && home.longitude) {
      setSelectedLocation({ lat: parseFloat(home.latitude), lng: parseFloat(home.longitude) });
      setSelectedHomeIndex(index);
      setMapOpen(true);
    } else {
      alert('No location data available for this home.');
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


  /* =========================
     FILTERS
  ========================== */
  const filteredByRole = useMemo(() => {
    if (!profile) return households;
    if (profile.role === 'Brgy-Secretary') {
      return households.filter(
        (h) => (h.barangay || '').toLowerCase() === profile.barangay?.toLowerCase()
      );
    }
    return households;
  }, [households, profile]);

  const filteredHouseholds = filteredByRole.filter((h) =>
    `${h.headFirstName} ${h.headMiddleName} ${h.headLastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setTotalHouseholds(filteredHouseholds.length);
    const filteredResidentCount = filteredHouseholds.reduce(
      (total, hh) => total + (hh.residentCount || 0),
      0
    );
    setTotalResidents(filteredResidentCount);
  }, [filteredHouseholds]);

  if (authLoading) return <div className="p-4">Loading user...</div>;

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
            setSelectedHouseholdId={setSelectedHouseholdId}
            setEditModalOpen={setEditModalOpen}
            fetchHouseholds={fetchHouseholds} // ✅ now passed
            totalHouseholds={totalHouseholds}
            totalResidents={totalResidents}
            handleEditMember={handleEditMember}
            handleDeleteMember={handleDeleteMember}
            openMapWithLocation={openMapWithLocation}
            loadingMembers={loadingMembers}
            toast={toast}
            db={db}
            deleteDoc={deleteDoc}
            doc={doc}
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

        <MapPopup
          isOpen={mapOpen}
          onClose={() => setMapOpen(false)}
          location={selectedLocation}
          readOnly={false} // allow picking
          onSave={(location) => {
            if (selectedHomeIndex !== null) {
              handleHomeChange('latitude', location.lat.toFixed(6), selectedHomeIndex);
              handleHomeChange('longitude', location.lng.toFixed(6), selectedHomeIndex);
              setSelectedHomeIndex(null);
              setMapOpen(false);
            }
          }}
        />

      </div>
    </RoleGuard>
  );
}
