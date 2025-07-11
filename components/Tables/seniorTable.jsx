'use client';

import { useEffect, useState } from 'react';
import { collectionGroup, getDocs, collection } from 'firebase/firestore';
import { db } from '@/firebase/config';

export default function SeniorPage() {
  const [seniors, setSeniors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSeniors = async () => {
      try {
        const demoSnap = await getDocs(collectionGroup(db, 'demographicCharacteristics'));
        const result = [];

        for (const docSnap of demoSnap.docs) {
          const data = docSnap.data();
          const age = parseInt(data.age);

          if (!isNaN(age) && age >= 60) {
            const pathParts = docSnap.ref.path.split('/');
            const householdId = pathParts[1];

            let barangay = '—';
            let contact = data.contactNumber || '—';

            const geoSnap = await getDocs(
              collection(db, 'households', householdId, 'geographicIdentification')
            );
            geoSnap.forEach((geo) => {
              const geoData = geo.data();
              barangay = geoData.barangay || barangay;
            });

            const fullName = [
              data.firstName || '',
              data.middleName || '',
              data.lastName || '',
              data.suffix !== 'n/a' ? data.suffix : ''
            ]
              .filter(Boolean)
              .join(' ')
              .trim();

            result.push({
              id: docSnap.id,
              name: fullName,
              sex: data.sex || '—',
              age,
              barangay,
              contact,
            });
          }
        }

        setSeniors(result);
      } catch (error) {
        console.error('Error fetching senior citizens:', error);
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
      <div className="text-sm text-right text-gray-500 mb-2">
        Home / Reports / Senior Citizens
      </div>

      <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-semibold text-lg">
        List of Senior Citizens (2025)
      </div>

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

      <div className="bg-white p-4 border border-t-0 rounded-b-md overflow-x-auto">
        {filteredData.length > 0 ? (
          <table className="w-full border-collapse border border-gray-400 text-sm text-center">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">👤</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">Barangay</th>
                <th className="border p-2">Sex</th>
                <th className="border p-2">Age</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border p-2">👤</td>
                  <td className="border p-2">{item.name}</td>
                  <td className="border p-2">{item.barangay}</td>
                  <td className="border p-2">{item.sex}</td>
                  <td className="border p-2">{item.age}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-gray-500 py-6">No matching records found.</p>
        )}
      </div>
    </div>
  );
}
