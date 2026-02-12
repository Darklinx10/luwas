'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { FiSearch, FiEdit, FiTrash2, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/authContext';

export default function SeniorTable({ title, barangay: filterBarangay = null }) {
  const [seniors, setSeniors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSenior, setSelectedSenior] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { profile, loading: authLoading } = useAuth();

  // Fetch senior citizen data
  // Fetch senior citizen data
  useEffect(() => {
    const fetchSeniors = async () => {
      setLoading(true);
      console.log('🔄 Starting to fetch senior citizen data...');
      try {
        const householdsSnap = await getDocs(collection(db, 'households'));
        console.log(`🏠 Total households fetched: ${householdsSnap.docs.length}`);
  
        const seniorsList = [];
        const batchSize = 250; // adjust as needed to prevent overload
  
        for (let i = 0; i < householdsSnap.docs.length; i += batchSize) {
          const batch = householdsSnap.docs.slice(i, i + batchSize);
          console.log(`➡ Processing batch ${i / batchSize + 1} (${batch.length} households)`);
  
          // process all households in this batch concurrently
          await Promise.all(
            batch.map(async (householdDoc) => {
              const householdId = householdDoc.id;
  
              try {
                const geoDocRef = doc(db, 'households', householdId, 'geographicIdentification', 'main');
                const membersColRef = collection(db, 'households', householdId, 'members');
  
                const [geoSnap, membersSnap] = await Promise.all([getDoc(geoDocRef), getDocs(membersColRef)]);
                const geoData = geoSnap.exists() ? geoSnap.data() : {};
                const barangay = geoData?.barangay || '—';
                const sitio = geoData?.sitio || '—';
  
                // fetch member demographics concurrently but safely
                const memberPromises = membersSnap.docs.map(async (memberDoc) => {
                  const demoRef = doc(
                    db,
                    'households',
                    householdId,
                    'members',
                    memberDoc.id,
                    'demographicCharacteristics',
                    'main'
                  );
                  const demoSnap = await getDoc(demoRef);
                  if (!demoSnap.exists()) return null;
  
                  const demo = demoSnap.data();
                  const age = parseInt(demo.age);
                  if (!isNaN(age) && age >= 60) {
                    const fullName = [
                      demo.firstName,
                      demo.middleName,
                      demo.lastName,
                      demo.suffix && demo.suffix.trim().toLowerCase() !== 'n/a' ? demo.suffix : null
                    ].filter(Boolean).join(' ');
  
                    return {
                      id: memberDoc.id,
                      name: fullName || 'Unnamed',
                      age,
                      sex: demo.sex || '—',
                      barangay,
                      sitio,
                      contact: demo.contactNumber || '—',
                      householdId,
                    };
                  }
                  return null;
                });
  
                const batchSeniors = (await Promise.allSettled(memberPromises))
                  .filter(res => res.status === 'fulfilled')
                  .map(res => res.value)
                  .filter(Boolean);
  
                seniorsList.push(...batchSeniors);
  
              } catch (err) {
                console.warn(`⚠️ Error processing household ${householdId}:`, err);
              }
            })
          );
  
          console.log(`✅ Batch processed. Total seniors so far: ${seniorsList.length}`);
        }
  
        console.log(`🎯 Finished fetching seniors. Total seniors: ${seniorsList.length}`);
        setSeniors(seniorsList);
  
      } catch (error) {
        console.error('❌ Error fetching senior citizens:', error);
        toast.error('Failed to fetch senior citizen data.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchSeniors();
  }, []);
  


  // Determine effective barangay for filtering
  const effectiveBarangay =
    profile?.role === 'Brgy-Secretary'
      ? profile?.barangay
      : filterBarangay;

  // Filter seniors by search term + effective barangay
  const filteredData = seniors
    .filter((item) =>
      !effectiveBarangay ||
      (item.barangay?.trim().toLowerCase() === effectiveBarangay?.trim().toLowerCase())
    )
    .filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

  // Print functionality
  const handlePrint = () => window.print();

  // CSV download
  const handleDownloadCSV = () => {
    if (!filteredData.length) return;
    const headers = 'Name,Sex,Age,Barangay,Contact';
    const rows = filteredData.map((p) => [p.name, p.sex, p.age, p.barangay, p.contact].join(','));
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `senior_citizens_report_2025.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Save edits
  const handleSaveEdit = async () => {
    if (!selectedSenior) return;

    setLoading(true);
    const { householdId, id, name, sex, age, contact, barangay, sitio } = selectedSenior;

    try {
      const demographicRef = doc(db, 'households', householdId, 'members', id, 'demographicCharacteristics', 'main');
      const geoRef = doc(db, 'households', householdId, 'geographicIdentification', 'main');

      await updateDoc(demographicRef, { name, sex, age, contactNumber: contact });
      await updateDoc(geoRef, { barangay, sitio});

      setSeniors((prev) =>
        prev.map((item) => (item.id === id ? { ...item, name, sex, age, contact, barangay, sitio } : item))
      );

      setShowModal(false);
      toast.success('Senior info updated.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update senior information.');
    } finally {
      setLoading(false);
    }
  };

  // Delete senior
  const handleDelete = async (item) => {
    if (!window.confirm(`Remove senior citizen status for ${item.name}?`)) return;
    setLoading(true);

    try {
      const demographicRef = doc(db, 'households', item.householdId, 'members', item.id, 'demographicCharacteristics', 'main');
      await updateDoc(demographicRef, { isSenior: false, seniorCitizenId: '' });
      setSeniors((prev) => prev.filter((s) => s.id !== item.id));
      toast.success(`Senior citizen status removed for ${item.name}.`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove senior citizen status.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <p className="text-center py-6 text-gray-600">Loading user profile...</p>;
  }

  return (
    <div className="p-4">
      {/* Breadcrumb (print hidden) */}
      <div className="text-sm text-left text-gray-500 mb-2 print:hidden">
        Home / Reports / Senior Citizens
      </div>
      <div id="print-section">
        {/* Header */}
        <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-semibold text-lg print:text-black print:bg-white print:text-center">
          {title}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-white shadow border-t-0 px-4 py-3 print:hidden">
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
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Print
            </button>
            <button
              onClick={handleDownloadCSV}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Download CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto shadow border-t-0 rounded-b-md bg-white p-4 scrollbar-thin">
          {loading ? (
            <p className="text-center py-6 text-gray-600">Loading Senior Citizen records...</p>
          ) : filteredData.length === 0 ? (
            <p className="text-center py-6 text-gray-500">No senior citizen records found.</p>
          ) : (
            <>
              <table className="w-full text-sm text-center print:text-xs print:w-full print:border print:border-gray-400">
                <thead className="bg-gray-100 text-gray-600 print:bg-white print:text-black">
                  <tr>
                    <th className="px-4 py-2 border">No.</th> 
                    <th className="px-4 py-2 border">Name</th>
                    <th className="px-4 py-2 border">Sex</th>
                    <th className="px-4 py-2 border">Age</th>
                    <th className="px-4 py-2 border">Barangay</th>
                    <th className="px-4 py-2 border">Sitio</th>
                    <th className="px-4 py-2 border">Contact</th>
                    <th className="px-4 py-2 border print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((item, index) => (
                      <tr key={`${item.id}-${index}`} className="hover:bg-gray-50">
                        <td className="px-4 py-2 border">{index + 1}</td> 
                        <td className="px-4 py-2 border">{item.name}</td>
                        <td className="px-4 py-2 border">{item.sex}</td>
                        <td className="px-4 py-2 border">{item.age}</td>
                        <td className="px-4 py-2 border">{item.barangay}</td>
                        <td className="px-4 py-2 border">{item.sitio}</td>
                        <td className="px-4 py-2 border">{item.contact}</td>
                        <td className="px-4 py-2 border print:hidden">
                          <div className="flex justify-center gap-3">
                            <button
                              onClick={() => {
                                setSelectedSenior(item);
                                setShowModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <FiEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              <p className="text-sm text-gray-700 mt-4 print:hidden">
                <strong>Total Senior Citizens:</strong> {filteredData.length}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedSenior && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              onClick={() => setShowModal(false)}
            >
              <FiX />
            </button>
            <h2 className="text-lg font-bold mb-4">Edit Senior Info</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={selectedSenior.name}
                  readOnly
                  className="w-full border rounded px-3 py-2 bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Sex</label>
                <select
                  value={selectedSenior.sex}
                  onChange={(e) => setSelectedSenior((prev) => ({ ...prev, sex: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Age</label>
                <input
                  type="number"
                  value={selectedSenior.age}
                  onChange={(e) => setSelectedSenior((prev) => ({ ...prev, age: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Barangay</label>
                <input
                  type="text"
                  value={selectedSenior.barangay}
                  onChange={(e) => setSelectedSenior((prev) => ({ ...prev, barangay: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Sitio</label>
                <input
                  type="text"
                  value={selectedSenior.sitio}
                  onChange={(e) => setSelectedSenior((prev) => ({ ...prev, barangay: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Contact Number</label>
                <input
                  type="tel"
                  value={selectedSenior.contact}
                  onChange={(e) => setSelectedSenior((prev) => ({ ...prev, contact: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={loading}
                  className={`px-4 py-2 text-white rounded ${loading ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
