'use client';

import { useState } from 'react';
import { FiSearch } from 'react-icons/fi';

export default function HazardTable({
  data = [],
  title = 'Hazard Reports (2025)',
  loading = false,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter((h) =>
    Object.values(h).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handlePrint = () => window.print();

  const handleDownloadCSV = () => {
    if (!filteredData.length) return;

    const headers = 'Name,Barangay,Contact Number,Susceptibility,Latitude,Longitude';
    const rows = filteredData.map((h) =>
      [
        h.name,
        h.barangay,
        h.contactnumber,
        h.susceptibility,
        h.lat,
        h.lng,
      ].join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'hazard_reports_2025.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="p-4">
      {/* ✅ Breadcrumb */}
      <div className="text-sm text-right text-gray-500 mb-2 print:hidden">
        Home / Reports / Hazards
      </div>

      <div id="print-section">
        {/* ✅ Header */}
        <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-semibold text-lg print:text-black print:bg-white print:text-center">
          {title}
        </div>

        {/* ✅ Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-white shadow border-t-0 px-4 py-3 print:hidden">
          <div className="relative w-full max-w-xs">
            <FiSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search here"
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

        {/* ✅ Table */}
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto shadow border-t-0 rounded-b-md bg-white p-4 scrollbar-thin">
          {loading || data.length === 0 ? (
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
              <p className="text-gray-600 text-sm">Loading Hazards records...</p>
            </div>
          </div>
          ) : filteredData.length === 0 ? (
            <p className="text-center text-gray-500 py-6">No matching hazard reports found.</p>
          ) : (
            <>
              <table className="w-full text-sm text-center print:text-xs print:border print:border-gray-400">
                <thead className="bg-gray-100 text-gray-600 print:bg-white print:text-black">
                  <tr>
                    <th className="px-4 py-2 border">Household</th>
                    <th className="px-4 py-2 border">Barangay</th>
                    <th className="px-4 py-2 border">Contact Number</th>
                    <th className="px-4 py-2 border">Susceptibility</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((h, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 border">{h.name}</td>
                      <td className="px-4 py-2 border">{h.barangay}</td>
                      <td className="px-4 py-2 border">{h.contactnumber}</td>
                      <td className="px-4 py-2 border">{h.susceptibility || 'Unknown'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ✅ Footer */}
              <p className="text-sm text-gray-700 mt-4 print:hidden">
                <strong>Total Records:</strong> {filteredData.length}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
