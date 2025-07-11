'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';

export default function PWDPage() {
  const [pwds, setPwds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPWDs = async () => {
      try {
        const householdsSnap = await getDocs(collection(db, 'households'));
        const allData = [];

        for (const docSnap of householdsSnap.docs) {
          const householdId = docSnap.id;

          const demoSnap = await getDocs(collection(db, 'households', householdId, 'demographicCharacteristics'));
          const healthSnap = await getDocs(collection(db, 'households', householdId, 'health'));

          if (!demoSnap.empty && !healthSnap.empty) {
            demoSnap.forEach((demoDoc) => {
              const demo = demoDoc.data();
              const personId = demoDoc.id;

              // Match the corresponding health record
              const matchedHealth = healthSnap.docs.find((h) => h.id === personId);
              const healthData = matchedHealth?.data();

              // Only include if marked as PWD
              if (healthData?.isPWD === true) {
                const fullName = `${demo.firstName || ''} ${demo.middleName || ''} ${demo.lastName || ''} ${
                  demo.suffix && demo.suffix !== 'n/a' ? demo.suffix : ''
                }`.trim();

                allData.push({
                  id: personId,
                  name: fullName,
                  age: demo.age || '—',
                  sex: demo.sex || '—',
                  barangay: demo.barangay || '—',
                  contact: demo.contactNumber || '—',
                  disability: healthData.pwdDisabilityType || '—',
                  assistance: healthData.assistanceReceived || '—',
                });
              }
            });
          }
        }

        setPwds(allData);
      } catch (error) {
        console.error('Error fetching PWD data:', error);
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

  return (
    <div className="p-4">
      <div className="text-sm text-right text-gray-500 mb-2">Home / Reports / PWD</div>

      <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-semibold text-lg">
        List of Person with Disability (2025)
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-t-0 px-4 py-3">
        <input
          type="text"
          placeholder="Search Here"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border border-gray-300 rounded w-full max-w-xs"
        />

        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
      <div className="overflow-x-auto border border-t-0 rounded-b-md bg-white p-4">
        {filteredData.length > 0 ? (
          <table className="w-full text-sm text-center print:text-xs print:w-full">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">Sex</th>
                <th className="px-4 py-2 border">Age</th>
                <th className="px-4 py-2 border">Barangay</th>
                <th className="px-4 py-2 border">Contact</th>
                <th className="px-4 py-2 border">Disability</th>
                <th className="px-4 py-2 border">Assistance Received</th>
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
                  <td className="px-4 py-2 border">{item.assistance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-gray-500 py-6">No PWD records found.</p>
        )}
      </div>
    </div>
  );
}
