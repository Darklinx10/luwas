'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { FiSearch, FiEdit, FiTrash2, FiX } from 'react-icons/fi';

export default function PWDPage() {
  const [pwds, setPwds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPWD, setSelectedPWD] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchPWDs = async () => {
      setLoading(true);
      try {
        const householdsSnap = await getDocs(collection(db, 'households'));
        const allData = [];

        for (const docSnap of householdsSnap.docs) {
          const householdId = docSnap.id;

          const healthMainDoc = await getDoc(doc(db, 'households', householdId, 'health', 'main'));
          const health = healthMainDoc.exists() ? healthMainDoc.data() : null;

          const pwdLineNumber = health?.pwdLineNumber;

          if (health?.isPWD && pwdLineNumber) {
            const memberDoc = await getDoc(doc(db, 'households', householdId, 'members', pwdLineNumber));
            const member = memberDoc.exists() ? memberDoc.data() : null;

            const demoDoc = await getDoc(doc(db, 'households', householdId, 'members', pwdLineNumber, 'demographicCharacteristics', 'main'));
            const demo = demoDoc.exists() ? demoDoc.data() : null;

            const geoDoc = await getDoc(doc(db, 'households', householdId, 'geographicIdentification', 'main'));
            const geo = geoDoc.exists() ? geoDoc.data() : null;

            if (member && demo && geo) {
              const fullName = `${member.firstName || ''} ${member.middleName || ''} ${member.lastName || ''} ${
                member.suffix && member.suffix !== 'n/a' ? member.suffix : ''
              }`.trim();

              allData.push({
                id: memberDoc.id,
                name: fullName,
                age: demo.age || '—',
                sex: demo.sex || '—',
                barangay: geo.barangay || '—',
                contact: demo.contactNumber || '—',
                disability: health.pwdDisabilityType || '—',
                householdId,
              });
            }
          }
        }

        setPwds(allData);
      } catch (error) {
        console.error('Error fetching PWD data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPWDs();
  }, []);

  const filteredData = pwds.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handlePrint = () => window.print();

  const handleDownloadCSV = () => {
    if (!filteredData.length) return;

    const headers = 'ID,Name,Sex,Age,Barangay,Contact,Disability,Assistance Received';
    const rows = filteredData.map((p) =>
      [p.id, p.name, p.sex, p.age, p.barangay, p.contact, p.disability, p.assistance].join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pwd_report_2025.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleSaveEdit = async () => {
    if (!selectedPWD) return;

    try {
      await updateDoc(doc(db, 'households', selectedPWD.householdId, 'health', 'main'), {
        assistanceReceived: selectedPWD.assistance,
      });

      setPwds((prev) =>
        prev.map((item) =>
          item.id === selectedPWD.id
            ? { ...item, assistance: selectedPWD.assistance }
            : item
        )
      );

      setShowModal(false);
      alert('Assistance updated.');
    } catch (error) {
      console.error('Update failed:', error);
      alert('Failed to update assistance.');
    }
  };

  const handleDelete = async (householdId) => {
    try {
      await updateDoc(doc(db, 'households', householdId, 'health', 'main'), {
        assistanceReceived: '',
      });

      setPwds((prev) =>
        prev.map((item) =>
          item.householdId === householdId ? { ...item, assistance: '' } : item
        )
      );
      alert('Assistance deleted.');
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete assistance.');
    }
  };

  return (
    <div className="p-4">
      <div className="text-sm text-right text-gray-500 mb-2">Home / Reports / PWD</div>

      <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-semibold text-lg">
        Person With Disability Information (2025)
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-t-0 px-4 py-3">
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
          <button onClick={handlePrint} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer">
            Print
          </button>
          <button onClick={handleDownloadCSV} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer">
            Download CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-t-0 rounded-b-md bg-white p-4">
        {loading ? (
          <p className="text-center text-gray-500 py-6 animate-pulse">Loading PWD records...</p>
        ) : filteredData.length === 0 ? (
          <p className="text-center text-gray-500 py-6">No results matched your search.</p>
        ) : (
          <>
            <table className="w-full text-sm text-center print:text-xs print:w-full">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="px-4 py-2 border">Name</th>
                  <th className="px-4 py-2 border">Sex</th>
                  <th className="px-4 py-2 border">Age</th>
                  <th className="px-4 py-2 border">Barangay</th>
                  <th className="px-4 py-2 border">Contact</th>
                  <th className="px-4 py-2 border">Disability</th>
                  <th className="px-4 py-2 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border">{item.name}</td>
                    <td className="px-4 py-2 border">{item.sex}</td>
                    <td className="px-4 py-2 border">{item.age}</td>
                    <td className="px-4 py-2 border">{item.barangay}</td>
                    <td className="px-4 py-2 border">{item.contact}</td>
                    <td className="px-4 py-2 border">{item.disability}</td>
                    <td className="px-4 py-2 border">
                      <div className="flex justify-center gap-3">
                        <button
                          className="text-blue-600 hover:text-blue-800 cursor-pointer"
                          onClick={() => {
                            setSelectedPWD(item);
                            setShowModal(true);
                          }}
                          title="Edit"
                        >
                          <FiEdit />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800 cursor-pointer"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete assistance received info?')) {
                              handleDelete(item.householdId);
                            }
                          }}
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

            {/* ✅ Total PWD Count */}
            <p className="text-sm text-gray-700 mt-4">
              <strong>Total PWDs found:</strong> <span className="font-semibold">{filteredData.length}</span>
            </p>
          </>
        )}
      </div>

      {showModal && selectedPWD && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              onClick={() => setShowModal(false)}
            >
              <FiX />
            </button>

            <h2 className="text-lg font-bold mb-4">Edit PWD Information</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 bg-gray-100"
                  value={selectedPWD.name}
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Sex</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={selectedPWD.sex}
                  onChange={(e) =>
                    setSelectedPWD((prev) => ({ ...prev, sex: e.target.value }))
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
                  value={selectedPWD.age}
                  onChange={(e) =>
                    setSelectedPWD((prev) => ({ ...prev, age: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Barangay</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={selectedPWD.barangay}
                  onChange={(e) =>
                    setSelectedPWD((prev) => ({ ...prev, barangay: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Contact Number</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={selectedPWD.contact}
                  onChange={(e) =>
                    setSelectedPWD((prev) => ({ ...prev, contact: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Disability</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={selectedPWD.disability}
                  onChange={(e) =>
                    setSelectedPWD((prev) => ({ ...prev, disability: e.target.value }))
                  }
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
                  Cancel
                </button>
                <button onClick={handleSaveEdit} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
