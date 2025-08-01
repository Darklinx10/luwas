'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, getDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { FiSearch, FiEdit, FiTrash2, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function SeniorPage() {
  const [seniors, setSeniors] = useState([]); // Stores all senior citizen data
  const [searchTerm, setSearchTerm] = useState(''); //  Input for filtering senior records
  const [loading, setLoading] = useState(false); //  Controls loading spinner visibility
  const [selectedSenior, setSelectedSenior] = useState(null); //  Stores currently selected senior for editing
  const [showModal, setShowModal] = useState(false); //  Controls modal visibility

  useEffect(() => {
    const fetchSeniors = async () => {
      setLoading(true);
      try {
        const householdsSnap = await getDocs(collection(db, 'households'));
        const allData = [];

        for (const householdDoc of householdsSnap.docs) {
          const householdId = householdDoc.id;

          // Get barangay info
          const geoSnap = await getDoc(
            doc(db, 'households', householdId, 'geographicIdentification', 'main')
          );
          const geoData = geoSnap.exists() ? geoSnap.data() : {};
          const barangay = geoData?.barangay || '—';

          // Get members
          const membersSnap = await getDocs(collection(db, 'households', householdId, 'members'));

          for (const memberDoc of membersSnap.docs) {
            const memberId = memberDoc.id;

            // Fetch demographic info
            const demoSnap = await getDoc(
              doc(db, 'households', householdId, 'members', memberId, 'demographicCharacteristics', 'main')
            );
            const demo = demoSnap.exists() ? demoSnap.data() : null;

            if (demo) {
              const age = parseInt(demo.age);
              if (!isNaN(age) && age >= 60) {
                const fullName = `${demo.firstName || ''} ${demo.middleName || ''} ${demo.lastName || ''} ${
                  demo.suffix && demo.suffix.trim().toLowerCase() !== 'n/a' ? demo.suffix : ''
                }`.trim();

                allData.push({
                  id: memberId,
                  name: fullName,
                  age,
                  sex: demo.sex || '—',
                  barangay,
                  contact: demo.contactNumber || '—',
                  isHead: (demo.relationshipToHead || '').toLowerCase() === 'head',
                  householdId,
                });
              }
            }
          }
        }

        setSeniors(allData);
      } catch (error) {
        console.error('Error fetching senior citizens:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSeniors();
  }, []);



  //  Filter senior list by search input
  const filteredData = seniors.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  //  Trigger browser print dialog
  const handlePrint = () => window.print();

  //  Export filtered data as CSV
  const handleDownloadCSV = () => {
    if (!filteredData.length) return;

    const headers = 'Name, Sex, Age, Barangay, Contact';
    const rows = filteredData.map((p) =>
      [p.name, p.sex, p.age, p.barangay, p.contact].join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `senior_citizens_report_2025.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  //  Update senior info in Firestore
  const handleSaveEdit = async () => {
    if (!selectedSenior) return;

    setLoading(true); // Start spinner

    const {
      householdId,
      id,
      name,
      sex,
      age,
      contact,
      barangay,
    } = selectedSenior;

    try {
      const lineNumber = id.replace(`${householdId}-`, '');
      const isHead = lineNumber === 'head';

      // 1. Update demographicCharacteristics
      const demographicRef = isHead
        ? doc(db, 'households', householdId, 'demographicCharacteristics', 'main')
        : doc(db, 'households', householdId, 'members', lineNumber, 'demographicCharacteristics', 'main');

      await updateDoc(demographicRef, {
        name: name ?? '',
        sex: sex ?? '',
        age: age ?? '',
        contactNumber: contact ?? '',
      });

      // 2. Update geographicIdentification
      const geoRef = doc(db, 'households', householdId, 'geographicIdentification', 'main');
      await updateDoc(geoRef, {
        barangay: barangay ?? '',
      });

      // 3. Update local state
      setSeniors((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                name,
                sex,
                age,
                contact,
                barangay,
              }
            : item
        )
      );

      setShowModal(false);
      toast.success('Senior info updated.');
    } catch (error) {
      console.error('Update failed:', error);
      toast.error('Failed to update senior information.');
    } finally {
      setLoading(false); // Stop spinner
    }
  };

  // Delete senior info in Firestore
  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Are you sure you want to remove senior citizen status for ${item.name}?`);
    if (!confirmed) return;

    setLoading(true);

    try {
      const { id, householdId: rawHouseholdId } = item;
      const householdId = rawHouseholdId || id.split('-')[0];
      const lineNumber = id.replace(`${householdId}-`, '');
      const isHead = lineNumber === 'head';

      // Reference to the demographic document (head or member)
      const demographicRef = isHead
        ? doc(db, 'households', householdId, 'demographicCharacteristics', 'main')
        : doc(db, 'households', householdId, 'members', lineNumber, 'demographicCharacteristics', 'main');

      // Clear or update senior status fields (adjust field names as per your DB schema)
      await updateDoc(demographicRef, {
        isSenior: false,       // Example flag - clear senior status
        seniorCitizenId: '',   // Or clear any senior-specific ID
        // Optionally clear other senior-related fields
      });

      // Update local state
      setSeniors((prev) => prev.filter((s) => s.id !== id));

      toast.success(`Senior citizen status removed for ${item.name}.`);
    } catch (error) {
      console.error('Failed to remove senior status:', error);
      toast.error('Failed to remove senior citizen status.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="p-4">
      {/*  Breadcrumb */}
      <div className="text-sm text-right text-gray-500 mb-2 print:hidden">Home / Reports / Senior Citizens</div>

      <div id="print-section">
        {/*  Section header */}
        <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-semibold text-lg print:text-black print:bg-white print:text-center">
          Senior Citizens Information (2025)
        </div>

        {/*  Top controls (search, print, download) */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-white shadow border-t-0 px-4 py-3 print:hidden">
          <div className="relative w-full max-w-xs">
            <FiSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
            <input
              id='search-input'
              name='search'
              type="text"
              placeholder="Search Here"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex gap-2">
            <button onClick={handlePrint} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer">Print</button>
            <button onClick={handleDownloadCSV} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer">Download CSV</button>
          </div>
        </div>

        {/*  Senior Data Table  */}
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto shadow border-t-0 rounded-b-md bg-white p-4 scrollbar-thin">
         {loading ? (
          <p className="text-center text-gray-500 py-6 animate-pulse">Loading senior citizen records...</p>
         ) : seniors.length === 0 ? (
          <p className="text-center text-gray-500 py-6">No senior citizen records found.</p>
         ) : filteredData.length === 0 ? (
          <p className="text-center text-gray-500 py-6">No senior citizen record results.</p>
         ) : (
            <>
              <table className="w-full text-sm text-center print:text-xs print:w-full print:border print:border-gray-400">
                <thead className="bg-gray-100 text-gray-600 print:bg-white print:text-black">
                  <tr>
                    <th className="px-4 py-2 border">Name</th>
                    <th className="px-4 py-2 border">Sex</th>
                    <th className="px-4 py-2 border">Age</th>
                    <th className="px-4 py-2 border">Barangay</th>
                    <th className="px-4 py-2 border">Contact</th>
                    <th className="px-4 py-2 border print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[...filteredData]
                    .sort((a, b) => a.name.localeCompare(b.name)) // DEBUG: Sort by name
                    .map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border">{item.name}</td>
                      <td className="px-4 py-2 border">{item.sex}</td>
                      <td className="px-4 py-2 border">{item.age}</td>
                      <td className="px-4 py-2 border">{item.barangay}</td>
                      <td className="px-4 py-2 border">{item.contact}</td>
                      <td className="px-4 py-2 border print:hidden">
                        <div className="flex justify-center gap-3">

                          {/* Edit button */}
                          <button
                            onClick={() => {
                              setSelectedSenior(item);
                              setShowModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 cursor-pointer"
                            title="Edit"
                          >
                            <FiEdit />
                          </button>

                           {/* Delete button */}
                          <button
                            onClick={() => handleDelete(item)}
                            className="text-red-600 hover:text-red-800 cursor-pointer"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/*  Footer count */}
              <p className="text-sm text-gray-700 mt-4 print:hidden">
                <strong>Total Senior Citizens found:</strong> <span className="font-semibold">{filteredData.length}</span>
              </p>
            </>
          )}
        </div>

        {/* Modal for editing senior info */}
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
                {/* Name (readonly) */}
                <div>
                  <label htmlFor="senior-name" className="block text-sm font-medium">Name</label>
                  <input
                    id="senior-name"
                    name="name"
                    type="text"
                    className="w-full border rounded px-3 py-2 bg-gray-100"
                    value={selectedSenior.name}
                    readOnly
                    autoComplete="name"
                  />
                </div>

                {/* Sex */}
                <div>
                  <label htmlFor="senior-sex" className="block text-sm font-medium">Sex</label>
                  <select
                    id="senior-sex"
                    name="sex"
                    className="w-full border rounded px-3 py-2"
                    value={selectedSenior.sex}
                    onChange={(e) =>
                      setSelectedSenior((prev) => ({ ...prev, sex: e.target.value }))
                    }
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                {/* Age */}
                <div>
                  <label htmlFor="senior-age" className="block text-sm font-medium">Age</label>
                  <input
                    id="senior-age"
                    name="age"
                    type="number"
                    className="w-full border rounded px-3 py-2"
                    value={selectedSenior.age}
                    onChange={(e) =>
                      setSelectedSenior((prev) => ({ ...prev, age: e.target.value }))
                    }
                    autoComplete="bday"
                  />
                </div>

                {/* Barangay */}
                <div>
                  <label htmlFor="senior-barangay" className="block text-sm font-medium">Barangay</label>
                  <input
                    id="senior-barangay"
                    name="barangay"
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={selectedSenior.barangay}
                    onChange={(e) =>
                      setSelectedSenior((prev) => ({ ...prev, barangay: e.target.value }))
                    }
                    autoComplete="address-level3"
                  />
                </div>

                {/* Contact Number */}
                <div>
                  <label htmlFor="senior-contact" className="block text-sm font-medium">Contact Number</label>
                  <input
                    id="senior-contact"
                    name="contact"
                    type="tel"
                    className="w-full border rounded px-3 py-2"
                    value={selectedSenior.contact}
                    onChange={(e) =>
                      setSelectedSenior((prev) => ({ ...prev, contact: e.target.value }))
                    }
                    autoComplete="tel"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleSaveEdit}
                    disabled={loading}
                    className={`px-4 py-2 text-white rounded flex items-center justify-center gap-2 transition ${
                      loading ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 cursor-pointer'
                    }`}
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          viewBox="0 0 24 24"
                        >
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
                        Saving...
                      </>
                    ) : (
                      'Save'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
