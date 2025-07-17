'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, getDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { FiSearch, FiEdit, FiTrash2, FiX } from 'react-icons/fi';

export default function SeniorPage() {
  const [seniors, setSeniors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSenior, setSelectedSenior] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchSeniors = async () => {
      setLoading(true);
      try {
        const householdsSnap = await getDocs(collection(db, 'households'));
        const allData = [];

        for (const householdDoc of householdsSnap.docs) {
          const householdId = householdDoc.id;
          const geoSnap = await getDoc(doc(db, 'households', householdId, 'geographicIdentification', 'main'));
          const geoData = geoSnap.exists() ? geoSnap.data() : {};
          const barangay = geoData?.barangay || '—';

          const headAge = parseInt(geoData.headAge);
          if (!isNaN(headAge) && headAge >= 60) {
            const fullName = `${geoData.headFirstName || ''} ${geoData.headMiddleName || ''} ${geoData.headLastName || ''} ${
              geoData.headSuffix && geoData.headSuffix.trim().toLowerCase() !== 'n/a' ? geoData.headSuffix : ''
            }`.trim();

            allData.push({
              id: householdId + '-head',
              name: fullName,
              age: headAge,
              sex: geoData.headSex || '—',
              barangay,
              contact: geoData.contactNumber || '—',
              isHead: true,
              householdId,
            });
          }

          const membersSnap = await getDocs(collection(db, 'households', householdId, 'members'));
          for (const memberDoc of membersSnap.docs) {
            const memberId = memberDoc.id;
            const demoSnap = await getDoc(doc(db, 'households', householdId, 'members', memberId, 'demographicCharacteristics', 'main'));
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
                  isHead: (demo.relationshipToHead || '').toLowerCase().trim() === 'head',
                  householdId,
                });
              }
            }
          }
        }

        setSeniors(allData);
      } catch (error) {
        console.error('Error fetching senior citizen data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSeniors();
  }, []);

  const filteredData = seniors.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handlePrint = () => window.print();

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

  const handleSaveEdit = async () => {
    if (!selectedSenior) return;

    try {
      const { id, contact, sex, age, barangay, isHead } = selectedSenior;
      let docRef;

      if (isHead) {
        const householdId = id.replace('-head', '');
        docRef = doc(db, 'households', householdId, 'geographicIdentification', 'main');
        await updateDoc(docRef, {
          contactNumber: contact,
          headSex: sex,
          headAge: age,
          barangay,
        });
      } else {
        const householdId = seniors.find(h => h.id === id)?.householdId;
        docRef = doc(db, 'households', householdId, 'members', id, 'demographicCharacteristics', 'main');
        await updateDoc(docRef, {
          contactNumber: contact,
          sex,
          age,
          barangay,
        });
      }

      setSeniors((prev) =>
        prev.map((s) =>
          s.id === selectedSenior.id
            ? { ...s, contact, sex, age, barangay }
            : s
        )
      );

      setShowModal(false);
      alert('Senior info updated.');
    } catch (error) {
      console.error('Error updating senior info:', error);
      alert('Failed to update senior info.');
    }
  };

  const handleDelete = async (item) => {
    const confirm = window.confirm(`Are you sure you want to delete ${item.name}?`);
    if (!confirm) return;

    try {
      if (item.isHead) {
        const householdId = item.id.replace('-head', '');
        await deleteDoc(doc(db, 'households', householdId, 'geographicIdentification', 'main'));
      } else {
        const householdId = seniors.find(h => h.id === item.id)?.householdId;
        await deleteDoc(doc(db, 'households', householdId, 'members', item.id, 'demographicCharacteristics', 'main'));
      }

      setSeniors((prev) => prev.filter((s) => s.id !== item.id));
      alert('Deleted successfully.');
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete record.');
    }
  };

  return (
    <div className="p-4">
      <div className="text-sm text-right text-gray-500 mb-2 print:hidden">Home / Reports / Senior Citizens</div>
      <div id="print-section">
        <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-semibold text-lg print:text-black print:bg-white print:text-center">
          Senior Citizens Information (2025)
        </div>
     

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-t-0 px-4 py-3 print:hidden">
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
              <button onClick={handlePrint} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer">Print</button>
              <button onClick={handleDownloadCSV} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer">Download CSV</button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-t-0 rounded-b-md bg-white p-4">
            {loading ? (
              <p className="text-center text-gray-500 py-6 animate-pulse">Loading senior citizen records...</p>
            ) : filteredData.length === 0 ? (
              <p className="text-center text-gray-500 py-6">No results matched your search.</p>
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
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2 border">{item.name}</td>
                        <td className="px-4 py-2 border">{item.sex}</td>
                        <td className="px-4 py-2 border">{item.age}</td>
                        <td className="px-4 py-2 border">{item.barangay}</td>
                        <td className="px-4 py-2 border">{item.contact}</td>
                        <td className="px-4 py-2 border print:hidden">
                          <div className="flex justify-center gap-3">
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
                <p className="text-sm text-gray-700 mt-4 print:hidden">
                  <strong>Total Senior Citizens found:</strong> <span className="font-semibold">{filteredData.length}</span>
                </p>
              </>
            )}
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
                      className="w-full border rounded px-3 py-2"
                      value={selectedSenior.name}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Sex</label>
                    <select
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
                  <div>
                    <label className="block text-sm font-medium">Age</label>
                    <input
                      type="number"
                      className="w-full border rounded px-3 py-2"
                      value={selectedSenior.age}
                      onChange={(e) =>
                        setSelectedSenior((prev) => ({ ...prev, age: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Barangay</label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2"
                      value={selectedSenior.barangay}
                      onChange={(e) =>
                        setSelectedSenior((prev) => ({ ...prev, barangay: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Contact Number</label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2"
                      value={selectedSenior.contact}
                      onChange={(e) =>
                        setSelectedSenior((prev) => ({ ...prev, contact: e.target.value }))
                      }
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 cursor-pointer">
                      Cancel
                    </button>
                    <button onClick={handleSaveEdit} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer">
                      Save
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
