'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { FiSearch, FiEdit, FiTrash2, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/authContext';

export default function PWDTable({ title, barangay: filterBarangay = null }) {
  const [pwds, setPwds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPWD, setSelectedPWD] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { profile, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchPWDs = async () => {
      setLoading(true);
      try {
        const householdsSnap = await getDocs(collection(db, 'households'));
        const allData = await Promise.all(
          householdsSnap.docs.map(async (householdDoc) => {
            const householdId = householdDoc.id;
            const geoSnap = await getDoc(doc(db, 'households', householdId, 'geographicIdentification', 'main'));
            const healthSnap = await getDoc(doc(db, 'households', householdId, 'health', 'main'));

            const geoData = geoSnap.exists() ? geoSnap.data() : {};
            const health = healthSnap.exists() ? healthSnap.data() : null;
            if (!health?.isPWD || typeof health.pwdLineNumber !== 'string') return null;

            const lineNumber = health.pwdLineNumber;
            const barangay = geoData?.barangay || '—';
            let name = '—', age = '—', sex = '—', contact = '—';

            if (lineNumber === 'head') {
              const demoSnap = await getDoc(doc(db, 'households', householdId, 'demographicCharacteristics', 'main'));
              const demo = demoSnap.exists() ? demoSnap.data() : null;
              if (!demo) return null;
              name = [demo.firstName, demo.middleName, demo.lastName, demo.suffix && demo.suffix.toLowerCase() !== 'n/a' ? demo.suffix : ''].filter(Boolean).join(' ');
              age = demo?.age || '—';
              sex = demo?.sex || '—';
              contact = demo?.contactNumber || '—';
            } else {
              const memberSnap = await getDoc(doc(db, 'households', householdId, 'members', lineNumber));
              const demoSnap = await getDoc(doc(db, 'households', householdId, 'members', lineNumber, 'demographicCharacteristics', 'main'));
              const member = memberSnap.exists() ? memberSnap.data() : null;
              const demo = demoSnap.exists() ? demoSnap.data() : null;
              if (!member) return null;
              name = [member.firstName, member.middleName, member.lastName, member.suffix && member.suffix.toLowerCase() !== 'n/a' ? member.suffix : ''].filter(Boolean).join(' ');
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
          })
        );

        setPwds(allData.filter(Boolean));
      } catch (error) {
        console.error(error);
        toast.error('Failed to fetch PWD data.');
      } finally {
        setLoading(false);
      }
    };

    fetchPWDs();
  }, []);

  const effectiveBarangay = profile?.role === 'Brgy-Secretary' ? profile?.barangay : filterBarangay;

  const filteredData = pwds
    .filter((item) => !effectiveBarangay || item.barangay?.trim().toLowerCase() === effectiveBarangay?.trim().toLowerCase())
    .filter((item) => Object.values(item).some((val) => String(val).toLowerCase().includes(searchTerm.toLowerCase())));

  const handlePrint = () => window.print();

  const handleDownloadCSV = () => {
    if (!filteredData.length) return;
    const headers = 'Name,Sex,Age,Barangay,Contact,Disability';
    const rows = filteredData.map((p) => [p.name, p.sex, p.age, p.barangay, p.contact, p.disability].join(','));
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
    const { householdId, id, sex, age, contact, barangay, disability } = selectedPWD;
    const lineNumber = id.replace(`${householdId}-`, '');
    const isHead = lineNumber === 'head';

    try {
      const healthRef = doc(db, 'households', householdId, 'health', 'main');
      const geoRef = doc(db, 'households', householdId, 'geographicIdentification', 'main');
      const demographicRef = isHead
        ? doc(db, 'households', householdId, 'demographicCharacteristics', 'main')
        : doc(db, 'households', householdId, 'members', lineNumber, 'demographicCharacteristics', 'main');

      await Promise.all([
        updateDoc(healthRef, { pwdDisabilityType: disability }),
        updateDoc(geoRef, { barangay }),
        updateDoc(demographicRef, { sex, age, contactNumber: contact }),
      ]);

      setPwds((prev) =>
        prev.map((item) => (item.id === id ? { ...item, sex, age, contact, barangay, disability } : item))
      );
      setShowModal(false);
      toast.success('PWD info updated.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update PWD info.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Remove PWD status for ${item.name}?`)) return;
    setLoading(true);
    try {
      const { householdId, id } = item;
      const lineNumber = id.replace(`${householdId}-`, '');
      const healthRef = doc(db, 'households', householdId, 'health', 'main');
      await updateDoc(healthRef, { isPWD: false, pwdLineNumber: '', pwdDisabilityType: '' });
      setPwds((prev) => prev.filter((p) => p.id !== id));
      toast.success(`PWD status removed for ${item.name}.`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove PWD status.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <p className="text-center py-6 text-gray-600">Loading user profile...</p>;

  return (
    <div className="p-4">
      {/* Breadcrumb (print hidden) */}
      <div className="text-sm text-left text-gray-500 mb-2 print:hidden">
        Home / Reports / Person's with Disabilities
      </div>

      <div id='print-section'>
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
            <button onClick={handlePrint} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              Print
            </button>
            <button onClick={handleDownloadCSV} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              Download CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto shadow border-t-0 rounded-b-md bg-white p-4 scrollbar-thin">
          {loading ? (
            <p className="text-center py-6 text-gray-600">Loading PWD records...</p>
          ) : filteredData.length === 0 ? (
            <p className="text-center py-6 text-gray-500">No PWD records found.</p>
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
                    <th className="px-4 py-2 border">Disability</th>
                    <th className="px-4 py-2 border print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.sort((a, b) => a.name.localeCompare(b.name)).map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border">{item.name}</td>
                      <td className="px-4 py-2 border">{item.sex}</td>
                      <td className="px-4 py-2 border">{item.age}</td>
                      <td className="px-4 py-2 border">{item.barangay}</td>
                      <td className="px-4 py-2 border">{item.contact}</td>
                      <td className="px-4 py-2 border">{item.disability}</td>
                      <td className="px-4 py-2 border print:hidden">
                        <div className="flex justify-center gap-3">
                          <button onClick={() => { setSelectedPWD(item); setShowModal(true); }} className="text-blue-600 hover:text-blue-800">
                            <FiEdit />
                          </button>
                          <button onClick={() => handleDelete(item)} className="text-red-600 hover:text-red-800">
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-sm text-gray-700 mt-4 print:hidden">
                <strong>Total PWDs:</strong> {filteredData.length}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedPWD && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-black" onClick={() => setShowModal(false)}>
              <FiX />
            </button>
            <h2 className="text-lg font-bold mb-4">Edit PWD Info</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input type="text" value={selectedPWD.name} readOnly className="w-full border rounded px-3 py-2 bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium">Sex</label>
                <select value={selectedPWD.sex} onChange={(e) => setSelectedPWD((prev) => ({ ...prev, sex: e.target.value }))} className="w-full border rounded px-3 py-2">
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Age</label>
                <input type="number" value={selectedPWD.age} onChange={(e) => setSelectedPWD((prev) => ({ ...prev, age: e.target.value }))} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Barangay</label>
                <input type="text" value={selectedPWD.barangay} onChange={(e) => setSelectedPWD((prev) => ({ ...prev, barangay: e.target.value }))} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Contact Number</label>
                <input type="tel" value={selectedPWD.contact} onChange={(e) => setSelectedPWD((prev) => ({ ...prev, contact: e.target.value }))} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Disability</label>
                <select value={selectedPWD.disability} onChange={(e) => setSelectedPWD((prev) => ({ ...prev, disability: e.target.value }))} className="w-full border rounded px-3 py-2">
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
              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
                <button onClick={handleSaveEdit} disabled={loading} className={`px-4 py-2 text-white rounded ${loading ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'}`}>
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
