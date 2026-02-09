'use client';

import RoleGuard from '@/components/roleGuard';
import { db } from '@/lib/firebaseConfig';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  startAfter,
  limit,
} from 'firebase/firestore';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useRef, useState, useCallback} from 'react';
import { FiPlus, FiSearch, FiUpload } from 'react-icons/fi';
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
      const batchSize = 100; // number of households per batch
      let lastDoc = null;
      let nonEmptyHouseholdCount = 0;
      const allHouseholds = [];
      let batchNumber = 0;
  
      console.log('🔄 Starting to fetch households...');
  
      while (true) {
        batchNumber++;
        const q = lastDoc
          ? query(collection(db, 'households'), orderBy('__name__'), startAfter(lastDoc), limit(batchSize))
          : query(collection(db, 'households'), orderBy('__name__'), limit(batchSize));
  
        const snapshot = await getDocs(q);
        if (snapshot.empty) break;
  
        lastDoc = snapshot.docs[snapshot.docs.length - 1];
        console.log(`➡ Processing batch ${batchNumber}: ${snapshot.docs.length} households`);
  
        const batchResults = await Promise.all(
          snapshot.docs.map(async (hhDoc, idx) => {
            const householdId = hhDoc.id;
  
            // 1️⃣ Fetch geographic info
            const geoSnap = await getDoc(doc(db, 'households', householdId, 'geographicIdentification', 'main'));
            const geoData = geoSnap.exists() ? geoSnap.data() : {};
  
            let headData = {};
            const uniqueResidentIds = new Set();
            let headFoundInMembers = false;
  
            // 2️⃣ Fetch members
            const membersSnap = await getDocs(collection(db, 'households', householdId, 'members'));
            const memberChunks = [];
            const chunkSize = 20;
  
            for (let i = 0; i < membersSnap.docs.length; i += chunkSize) {
              memberChunks.push(membersSnap.docs.slice(i, i + chunkSize));
            }
  
            for (const chunk of memberChunks) {
              const chunkResults = await Promise.allSettled(
                chunk.map(async (m) => {
                  const base = m.data();
                  const demoSnap = await getDoc(
                    doc(db, 'households', householdId, 'members', m.id, 'demographicCharacteristics', 'main')
                  );
                  if (!demoSnap.exists()) return null;
  
                  const demo = demoSnap.data();
                  const rel = demo.relationshipToHead || base.relationshipToHead || '';
  
                  if (rel.toLowerCase() === 'head') {
                    headFoundInMembers = true;
                    uniqueResidentIds.add(m.id);
                    return {
                      headFirstName: base.firstName || '',
                      headMiddleName: base.middleName || '',
                      headLastName: base.lastName || '',
                      headSuffix: base.suffix || '',
                      headSex: demo.sex || '',
                      headAge: demo.age || '',
                      contactNumber: demo.contactNumber || '',
                    };
                  } else {
                    uniqueResidentIds.add(m.id);
                    return null;
                  }
                })
              );
  
              const headInChunk = chunkResults.find((r) => r.status === 'fulfilled' && r.value);
              if (headInChunk) headData = headInChunk.value;
            }
  
            // 3️⃣ Fallback to geoData if no head found
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
              uniqueResidentIds.add(`head-${householdId}`);
            }
  
            const hasData =
              headData.headFirstName ||
              headData.headLastName ||
              geoData?.barangay ||
              geoData?.sitio ||
              membersSnap.size > 0;
  
            if (hasData) nonEmptyHouseholdCount++;
  
            console.log(`   🏠 Processed household ${idx + 1}/${snapshot.docs.length} (${householdId}) - Residents: ${uniqueResidentIds.size}`);
  
            return { householdId, ...geoData, ...headData, hasData, residentCount: uniqueResidentIds.size };
          })
        );
  
        allHouseholds.push(...batchResults.filter((r) => r.hasData !== false));
        console.log(`✅ Batch ${batchNumber} processed. Total households so far: ${allHouseholds.length}`);
      }
  
      const valid = allHouseholds.filter((h) => h.hasData);
      setHouseholds(valid);
      setTotalHouseholds(nonEmptyHouseholdCount);
      setTotalResidents(valid.reduce((sum, h) => sum + h.residentCount, 0));
  
      console.log(`🎯 Finished fetching households. Total valid households: ${valid.length}`);
    } catch (error) {
      console.error('❌ Failed to fetch households:', error);
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

  const handleUploadHouseholdData = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setProgress(0);

    try {
      const ext = file.name.split(".").pop().toLowerCase();

      console.log("File extension:", ext);

      let householdRows = [];
      let memberRows = [];

      if (ext === "json") {
        const text = await file.text();
        const data = JSON.parse(text);
        householdRows = data.households || [];
        memberRows = data.members || [];
        console.log("Loaded JSON data:", { householdRowsLength: householdRows.length, memberRowsLength: memberRows.length });
      } else if (["csv", "xlsx", "xls"].includes(ext)) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array", raw: true });

        console.log("Workbook sheets:", workbook.SheetNames);

        const householdSheetName = workbook.SheetNames.find((name) =>
          ["household", "households"].includes(name.trim().toLowerCase())
        );

        const memberSheetName = workbook.SheetNames.find((name) =>
          ["member", "members"].includes(name.trim().toLowerCase())
        );
        console.log("Household sheet name:", householdSheetName);
        console.log("Member sheet name:", memberSheetName);

        if (!householdSheetName || !memberSheetName) {
          toast.error("Workbook must contain sheets: Households and Members");
          throw new Error("Missing required sheets");
        }

        householdRows = XLSX.utils.sheet_to_json(workbook.Sheets[householdSheetName], { defval: "" });
        memberRows = XLSX.utils.sheet_to_json(workbook.Sheets[memberSheetName], { defval: "" });

        console.log("Household rows loaded:", householdRows.length);
        console.log("Member rows loaded:", memberRows.length);
      } else {
        toast.error("Unsupported file format");
        return;
      }

      if (!householdRows.length) {
        toast.error("Households sheet is empty");
        return;
      }

      if (!memberRows.length) {
        toast.error("Members sheet is empty");
        return;
      }

      // Build households map from household sheet
      const householdsMap = {};
      householdRows.forEach((row, index) => {
        const householdId = (row["Household ID"] || "").toString().trim();
        if (!householdId) {
          console.warn(`Skipping household row ${index}: Missing householdId`);
          return;
        }

        householdsMap[householdId] = {
          householdId,
          geoData: {
            headFirstName: (row.headFirstName || row["Head FirstName"] || "").toString(),
            headMiddleName: (row.headMiddleName || row["Head MiddleName"] || "").toString(),
            headLastName: (row.headLastName || row["Head LastName"] || "").toString(),
            headSuffix: (row.headSuffix || row["Head Suffix"] || "N/A").toString(),
            headSex: (row.headSex || row["Head Sex"] || "").toString(),
            headAge: Number(row.headAge || row["Head Age"]) || 0,
            contactNumber: (row.headContactNumber || row["Contact Number"] || "N/A").toString(),
            barangay: (row.barangay || row["Barangay"] || "").toString(),
            sitio: (row.sitio || row["Sitio"]|| "").toString(),
            
            homes: [
              {
                label: "Primary Home",
                latitude: row.home1_latitude || row["Home1 Latitude"],
                longitude: row.home1_longitude || row["Home1 Longitude"],
              },
              {
                label: "Secondary Home 1",
                latitude: row.home2_latitude || row["Home2 Latitude"],
                longitude: row.home2_longitude || row["Home2 Longitude"],
              },
              {
                label: "Secondary Home 2",
                latitude: row.home3_latitude || row["Home3 Latitude"],
                longitude: row.home3_longitude || row["Home3 Longitude"],
              },
              {
                label: "Secondary Home 3",
                latitude: row.home4_latitude || row["Home4 Latitude"],
                longitude: row.home4_longitude || row["Home4 Longitude"],
              },
            ].filter((h) => h.latitude && h.longitude),
          },
          members: [],
        };
      });

      console.log("Built households map:", Object.keys(householdsMap).length);

      // Attach members from member sheet
      memberRows.forEach((row, index) => {
        const householdId = (row["Household ID"] || "").toString().trim();
        const memberId = (row["Member ID"] || "").toString().trim();

        if (!householdId) {
          console.warn(`Skipping member row ${index}: Missing householdId`);
          return;
        }
        if (!memberId) {
          console.warn(`Skipping member row ${index}: Missing memberId`);
          return;
        }
        if (!householdsMap[householdId]) {
          console.warn(`Member row ${index}: Household ID ${householdId} not found in households`);
          return;
        }

        const relationshipRaw = (row.relationshipToHead || row["Relationship To Head"] || "").toString();
        const normalizedRelationship =
          relationshipRaw.trim().toLowerCase() === "head" ? "Head" : relationshipRaw;

        householdsMap[householdId].members.push({
          id: memberId,
          lastName: (row.lastName || row["LastName"] || "").toString(),
          firstName: (row.firstName || row["FirstName"] || "").toString(),
          middleName: (row.middleName || row["MiddleName"] || "").toString(),
          suffix: (row.suffix || row["Suffix"] || "").toString(),
          relationshipToHead: normalizedRelationship,
          sex: (row.sex || row["Sex"] || "").toString(),
          age: Number(row.age || row["Age"]) || 0,
          contactNumber: (row.memberContactNumber || row["Member Contact Number"] || "").toString(),
        });
      });

      console.log("Attached members to households.");

      // Upload to Firestore in batches
      const batchSize = 400;
      const allHouseholds = Object.values(householdsMap);

      for (let i = 0; i < allHouseholds.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = allHouseholds.slice(i, i + batchSize);

        console.log(`Uploading batch: ${i} to ${i + chunk.length} of ${allHouseholds.length}`);

        chunk.forEach(({ householdId, geoData, members }) => {
          const hhRef = doc(db, "households", householdId);
          batch.set(hhRef, { createdAt: serverTimestamp(), householdId }, { merge: true });

          if (geoData.headFirstName) {
            const geoRef = doc(db, "households", householdId, "geographicIdentification", "main");
            batch.set(geoRef, geoData, { merge: true });
          }

          members.forEach((member) => {
            if (!member.id || typeof member.id !== "string" || member.id.trim() === "") {
              console.warn("Skipping member without valid ID:", member);
              return;
            }
            const memberId = member.id.trim();

            const memberRef = doc(db, "households", householdId, "members", memberId);
            batch.set(memberRef, member, { merge: true });

            const demoRef = doc(
              db,
              "households",
              householdId,
              "members",
              memberId,
              "demographicCharacteristics",
              "main"
            );
            batch.set(
              demoRef,
              {
                firstName: member.firstName || "",
                lastName: member.lastName || "",
                middleName: member.middleName || "",
                suffix: member.suffix || "",
                sex: member.sex || "",
                age: Number(member.age) || 0,
                relationshipToHead: member.relationshipToHead || "",
                contactNumber: member.contactNumber || "",
              },
              { merge: true }
            );
          });
        });

        await batch.commit();
        setProgress(Math.min(100, Math.round(((i + chunk.length) / allHouseholds.length) * 100)));
      }

      toast.success(`Uploaded ${allHouseholds.length} households successfully!`);

      if (fetchHouseholds) await fetchHouseholds();
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload file");
    } finally {
      setLoading(false);
      e.target.value = "";
      setProgress(0);
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
    <RoleGuard allowedRoles={['Brgy-Secretary', 'MDRRMC-Personnel', 'MDRRMC-Admin']}>
      <div className="p-4">
        <div className="text-sm text-left text-gray-500 mb-2 print:hidden">Home / Households</div>
        <div id="print-section">
          <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-semibold text-lg print:text-black print:text-center print:font-bold print:py-2 print:rounded-none">
            Household Information
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

            {profile?.role === 'MDRRMC-Admin' && (
              <>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportFile}
                  className="hidden"
                  id="importFileInput"
                />
                <label
                  htmlFor="importFileInput"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer flex items-center gap-2"
                >
                  <FiUpload />
                  Import Household Data
                </label>
              </>
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
