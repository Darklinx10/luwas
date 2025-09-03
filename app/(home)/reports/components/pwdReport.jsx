'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { FiSearch, FiEdit, FiTrash2, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/authContext';


export default function PWDPage() {
  const [pwds, setPwds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPWD, setSelectedPWD] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchPWDs = async () => {
      setLoading(true);
      try {
        const householdsSnap = await getDocs(collection(db, 'households'));

        const promises = householdsSnap.docs.map(async (householdDoc) => {
          const householdId = householdDoc.id;

          const geoRef = doc(db, 'households', householdId, 'geographicIdentification', 'main');
          const healthRef = doc(db, 'households', householdId, 'health', 'main');

          const [geoSnap, healthSnap] = await Promise.all([getDoc(geoRef), getDoc(healthRef)]);
          const geoData = geoSnap.exists() ? geoSnap.data() : {};
          const health = healthSnap.exists() ? healthSnap.data() : null;

          if (!health?.isPWD || typeof health.pwdLineNumber !== 'string') return null;

          const lineNumber = health.pwdLineNumber;
          const barangay = geoData?.barangay || '—';

          let name = '—';
          let age = '—';
          let sex = '—';
          let contact = '—';

          if (lineNumber === 'head') {
            const demoRef = doc(db, 'households', householdId, 'demographicCharacteristics', 'main');
            const demoSnap = await getDoc(demoRef);
            const demo = demoSnap.exists() ? demoSnap.data() : null;
            if (!demo) return null;

            const nameParts = [
              demo.firstName || '',
              demo.middleName || '',
              demo.lastName || '',
              demo.suffix && demo.suffix.toLowerCase() !== 'n/a' ? demo.suffix : '',
            ].filter(Boolean);
            name = nameParts.join(' ').trim() || '—';

            age = demo?.age || '—';
            sex = demo?.sex || '—';
            contact = demo?.contactNumber || '—';
          } else {
            const memberRef = doc(db, 'households', householdId, 'members', lineNumber);
            const demoRef = doc(db, 'households', householdId, 'members', lineNumber, 'demographicCharacteristics', 'main');

            const [memberDoc, demoSnap] = await Promise.all([
              getDoc(memberRef),
              getDoc(demoRef),
            ]);

            const member = memberDoc.exists() ? memberDoc.data() : null;
            const demo = demoSnap.exists() ? demoSnap.data() : null;
            if (!member) return null;

            const nameParts = [
              member.firstName || '',
              member.middleName || '',
              member.lastName || '',
              member.suffix && member.suffix.toLowerCase() !== 'n/a' ? member.suffix : '',
            ].filter(Boolean);
            name = nameParts.join(' ').trim() || '—';

            age = demo?.age || '—';
            sex = demo?.sex || '—';
            contact = demo?.contactNumber || '—';
          }

          return {
            id: `${householdId}-${lineNumber}`,
            name,
            age,
            sex,
            barangay,
            contact,
            disability: health.pwdDisabilityType || '—',
            householdId,
          };
        });

        const allData = await Promise.all(promises);
        setPwds(allData.filter(Boolean));
      } catch (error) {
        console.error('Error fetching PWD data:', error);
        toast.error('Failed to load PWD data. Please try again.');
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

    const headers = 'Name,Sex,Age,Barangay,Contact,Disability';
    const rows = filteredData.map((p) =>
      [p.name, p.sex, p.age, p.barangay, p.contact, p.disability].join(',')
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

    setLoading(true);
    const {
      householdId,
      id,
      name,
      sex,
      age,
      contact,
      barangay,
      disability,
    } = selectedPWD;

    try {
      const lineNumber = id.replace(`${householdId}-`, '');
      const isHead = lineNumber === 'head';

      const healthRef = doc(db, 'households', householdId, 'health', 'main');
      const geoRef = doc(db, 'households', householdId, 'geographicIdentification', 'main');
      const demographicRef = isHead
        ? doc(db, 'households', householdId, 'demographicCharacteristics', 'main')
        : doc(db, 'households', householdId, 'members', lineNumber, 'demographicCharacteristics', 'main');

      await Promise.all([
        updateDoc(healthRef, {
          pwdDisabilityType: disability ?? '',
        }),
        updateDoc(geoRef, {
          barangay: barangay ?? '',
        }),
        updateDoc(demographicRef, {
          sex: sex ?? '',
          age: age ?? '',
          contactNumber: contact ?? '',
        }),
      ]);

      setPwds((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, name, sex, age, contact, barangay, disability }
            : item
        )
      );

      setShowModal(false);
      toast.success('PWD info updated.');
    } catch (error) {
      console.error('Update failed:', error);
      toast.error('Failed to update PWD information.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (pwd) => {
    if (!pwd) return;
    if (!confirm(`Are you sure you want to remove PWD status for ${pwd.name}?`)) return;

    setLoading(true);
    try {
      const { householdId, id } = pwd;
      const lineNumber = id.replace(`${householdId}-`, '');

      const healthRef = doc(db, 'households', householdId, 'health', 'main');
      await updateDoc(healthRef, {
        isPWD: false,
        pwdLineNumber: '',
        pwdDisabilityType: '',
      });

      setPwds((prev) => prev.filter((item) => item.id !== id));
      toast.success(`PWD status removed for ${pwd.name}`);
    } catch (error) {
      console.error('Failed to remove PWD status:', error);
      toast.error('Failed to remove PWD status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      {/* Breadcrumb */}
      <div className="text-sm text-right text-gray-500 mb-2 print:hidden">Home / Reports / PWD</div>

      <div id="print-section">
        {/* Title */}
        <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-semibold text-lg print:text-black print:bg-white print:font-bold print:text-center">
          Person With Disability Information (2025)
        </div>

        {/* Search + Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-white shadow border-t-0 px-4 py-3 print:hidden">
          <div className="relative w-full max-w-xs print:hidden">
            <FiSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
            <input
              id="search-input" 
              name="search" 
              type="text"
              placeholder="Search Here"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setLoading(true);
                handlePrint();
                setTimeout(() => setLoading(false), 1000); // optional delay
              }}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Print
            </button>

            <button
              onClick={async () => {
                setLoading(true);
                handleDownloadCSV();
                setLoading(false);
              }}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Download CSV
            </button>
          </div>
        </div>
        
        {/* PWD Data Table */}
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto shadow border-t-0 rounded-b-md bg-white p-4 scrollbar-thin">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="flex flex-col items-center">
                <svg
                  className="animate-spin h-10 w-10 text-green-500 mb-3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                <p className="text-gray-600 text-sm">Loading PWD records...</p>
              </div>
          </div>
          ) : pwds.length === 0 ? (
            <p className="text-center text-gray-500 py-6">No PWD records found.</p>
          ) : filteredData.length === 0 ? (
            <p className="text-center text-gray-500 py-6">No PWD record results.</p>
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
                    <th className="px-4 py-2 border print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[...filteredData]
                    .sort((a, b) => a.name.localeCompare(b.name)) // Sort by name
                    .map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2 border">{item.name}</td>
                        <td className="px-4 py-2 border">{item.sex}</td>
                        <td className="px-4 py-2 border">{item.age}</td>
                        <td className="px-4 py-2 border">{item.barangay}</td>
                        <td className="px-4 py-2 border">{item.contact}</td>
                        <td className="px-4 py-2 border">{item.disability}</td>
                        <td className="px-4 py-2 border print:hidden">
                          <div className="flex justify-center gap-3">

                            {/* Edit button */}
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

                            {/* Delete button */}
                            <button
                              className="text-red-600 hover:text-red-800 cursor-pointer"
                              onClick={() => handleDelete(item)}
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

              {/* Count */}
              <p className="text-sm text-gray-700 mt-4 print:hidden">
                <strong>Total PWDs found:</strong>{' '}
                <span className="font-semibold">{filteredData.length}</span>
              </p>
            </>
          )}
        </div>

        {/* Modal for editing */}
        {showModal && selectedPWD && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center print:hidden">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-black"
                onClick={() => setShowModal(false)}
              >
                <FiX />
              </button>

              <h2 className="text-lg font-bold mb-4">Edit PWD Information</h2>

              <div className="space-y-3">
                {/* Read-only Name */}
                <div>
                  <label htmlFor="pwd-name" className="block text-sm font-medium">Name</label>
                  <input
                    id="pwd-name"
                    name="name"
                    type="text"
                    className="w-full border rounded px-3 py-2 bg-gray-100"
                    value={selectedPWD.name}
                    readOnly
                  />
                </div>

                {/* Editable fields */}
                <div>
                  <label htmlFor="pwd-sex" className="block text-sm font-medium">Sex</label>
                  <select
                    id="pwd-sex"
                    name="sex"
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
                  <label htmlFor="pwd-age" className="block text-sm font-medium">Age</label>
                  <input
                    id="pwd-age"
                    name="age"
                    type="number"
                    className="w-full border rounded px-3 py-2"
                    value={selectedPWD.age}
                    onChange={(e) =>
                      setSelectedPWD((prev) => ({ ...prev, age: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label htmlFor="pwd-barangay" className="block text-sm font-medium">Barangay</label>
                  <input
                    id="pwd-barangay"
                    name="barangay"
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={selectedPWD.barangay}
                    onChange={(e) =>
                      setSelectedPWD((prev) => ({ ...prev, barangay: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label htmlFor="pwd-contact" className="block text-sm font-medium">Contact Number</label>
                  <input
                    id="pwd-contact"
                    name="contact"
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={selectedPWD.contact}
                    onChange={(e) =>
                      setSelectedPWD((prev) => ({ ...prev, contact: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label htmlFor="pwd-disability" className="block text-sm font-medium">Disability</label>
                  <select
                    id="pwd-disability"
                    name="disability"
                    className="w-full border rounded px-3 py-2"
                    value={selectedPWD.disability}
                    onChange={(e) =>
                      setSelectedPWD((prev) => ({ ...prev, disability: e.target.value }))
                    }
                  >
                    <option value="">-- Select type of disability --</option>
                    <option>VISUAL DISABILITY</option>
                    <option>DEAF OR HEARING DISABILITY</option>
                    <option>INTELLECTUAL DISABILITY</option>
                    <option>PHYSICAL DISABILITY</option>
                    <option>MENTAL DISABILITY</option>
                    <option>PSYCHOSOCIAL DISABILITY</option>
                    <option>SPEECH AND LANGUAGE IMPAIRMENT</option>
                    <option>LEARNING DISABILITY</option>
                  </select>
                </div>


                {/* Save/Cancel buttons */}
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
                    className={`px-4 py-2 rounded flex items-center justify-center gap-2 transition 
                      ${loading ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'} text-white`}
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
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
