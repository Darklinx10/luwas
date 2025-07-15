'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { FiSearch,  FiEdit, FiTrash2 } from 'react-icons/fi';



export default function SeniorPage() {
  const [seniors, setSeniors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true); // 🟢 NEW

  useEffect(() => {
    const fetchSeniors = async () => {
      setLoading(true);
      try {
        const householdsSnap = await getDocs(collection(db, 'households'));
        const allData = [];

        for (const householdDoc of householdsSnap.docs) {
          const householdId = householdDoc.id;

          // 📍 Get barangay from geo data
          const geoSnap = await getDocs(collection(db, 'households', householdId, 'geographicIdentification'));
          const geoDoc = geoSnap.docs[0]?.data();
          const barangay = geoDoc?.barangay || '—';

          // 👨‍👩‍👧 Loop members
          const membersSnap = await getDocs(collection(db, 'households', householdId, 'members'));
          for (const memberDoc of membersSnap.docs) {
            const memberId = memberDoc.id;

            // ✅ Fetch 'main' demographicCharacteristics subdoc
            const demoSnap = await getDoc(doc(db, 'households', householdId, 'members', memberId, 'demographicCharacteristics', 'main'));
            const demo = demoSnap.exists() ? demoSnap.data() : null;

            if (demo) {
              const age = parseInt(demo.age);
              if (!isNaN(age) && age >= 60) {
                const fullName = `${demo.firstName || ''} ${demo.middleName || ''} ${demo.lastName || ''} ${
                  demo.suffix && demo.suffix.trim() && demo.suffix.toLowerCase() !== 'n/a' ? demo.suffix : ''
                }`.trim();

                allData.push({
                  id: demo.id || memberId,
                  name: fullName,
                  age,
                  sex: demo.sex || '—',
                  barangay,
                  contact: demo.contactNumber || '—',
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

    const headers = 'ID,Name,Sex,Age,Barangay,Contact';
    const rows = filteredData.map((p) =>
      [p.id, p.name, p.sex, p.age, p.barangay, p.contact].join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `senior_citizens_report_2025.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="p-4">
      <div className="text-sm text-right text-gray-500 mb-2">Home / Reports / Senior Citizens</div>

      <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-semibold text-lg">
        Senior Citizens Information (2025)
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
          <button
            onClick={handlePrint}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer"
          >
            Print
          </button>
          <button
            onClick={handleDownloadCSV}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer"
          >
            Download CSV
          </button>
        </div>
      </div>

      {/* Table or Message */}
      <div className="overflow-x-auto border border-t-0 rounded-b-md bg-white p-4">
        {loading ? (
          <p className="text-center text-gray-500 py-6 animate-pulse">Loading senior citizen records...</p>
        ) : seniors.length === 0 ? (
          <p className="text-center text-gray-500 py-6">No senior citizen records found.</p>
        ) : filteredData.length === 0 ? (
          <p className="text-center text-gray-500 py-6">No results matched your search.</p>
        ) : (
          <table className="w-full text-sm text-center print:text-xs print:w-full">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">Sex</th>
                <th className="px-4 py-2 border">Age</th>
                <th className="px-4 py-2 border">Barangay</th>
                <th className="px-4 py-2 border">Contact</th>
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
                  <td className="px-4 py-2 border">
                    <div className="flex justify-center gap-3">
                      <button className="text-blue-600 hover:text-blue-800 cursor-pointer" title="Edit">
                        <FiEdit />
                      </button>
                      <button className="text-red-600 hover:text-red-800 cursor-pointer" title="Delete">
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
