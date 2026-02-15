'use client';

import { useState } from 'react';
import { FiSearch, FiEdit, FiTrash2, FiX } from 'react-icons/fi';
import { useSeniors } from '@/hooks/useSeniorViewModel';
import { capitalizeWords } from '@/utils/capitalize';

export default function SeniorTable({ title, barangay }) {
  const [selectedSenior, setSelectedSenior] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const {
    seniors,
    searchTerm,
    setSearchTerm,
    loading,
    authLoading,
    saveSenior,
    deleteSenior,
    downloadCSV
  } = useSeniors(barangay);

  



  if (authLoading) return <p className="text-center py-6 text-gray-600">Loading user profile...</p>;

  return (
    <div className="p-4">
      <div id="print-section">
        {/* Header + Controls */}
        <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-semibold text-lg print:text-black print:bg-white print:text-center">
          {title}
        </div>
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
            
              onClick={() => window.print()}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" 
              disabled={loading}
            >
              Print
            </button>
            <button
              onClick={downloadCSV}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" 
              disabled={loading}
            >
              Download CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto shadow border-t-0 rounded-b-md bg-white p-4 scrollbar-thin
                  print:max-h-auto print:overflow-visible">
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
              <p className="text-gray-600 text-sm">Loading Senior Citizen records...</p>
            </div>
          </div>
          ) : seniors.length === 0 ? (
            <p className="text-center py-6 text-gray-500">No senior citizen records found.</p>
          ) : (
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
                {seniors.map((item, idx) => (
                  <tr key={`${item.id}-${idx}`} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border">{idx + 1}</td>
                    <td className="px-4 py-2 border">{capitalizeWords(item.name)}</td>
                    <td className="px-4 py-2 border">{item.sex}</td>
                    <td className="px-4 py-2 border">{item.age}</td>
                    <td className="px-4 py-2 border">{capitalizeWords(item.barangay)}</td>
                    <td className="px-4 py-2 border">{capitalizeWords(item.sitio)}</td>
                    <td className="px-4 py-2 border">{item.contact}</td>
                    <td className="px-4 py-2 border print:hidden">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => { setSelectedSenior(item); setShowModal(true); }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FiEdit />
                        </button>
                        <button
                          onClick={() => deleteSenior(item)}
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
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedSenior && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-black" onClick={() => setShowModal(false)}>
              <FiX />
            </button>
            <h2 className="text-lg font-bold mb-4">Edit Senior Info</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input type="text" value={capitalizeWords(selectedSenior.name)} readOnly className="w-full border rounded px-3 py-2 bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium">Sex</label>
                <select
                  value={selectedSenior.sex}
                  onChange={(e) => setSelectedSenior(prev => ({ ...prev, sex: e.target.value }))}
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
                  onChange={(e) => setSelectedSenior(prev => ({ ...prev, age: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Barangay</label>
                <input
                  type="text"
                  value={capitalizeWords(selectedSenior.barangay)}
                  onChange={(e) => setSelectedSenior(prev => ({ ...prev, barangay: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Sitio</label>
                <input
                  type="text"
                  value={capitalizeWords(selectedSenior.sitio)}
                  onChange={(e) => setSelectedSenior(prev => ({ ...prev, sitio: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Contact Number</label>
                <input
                  type="tel"
                  value={selectedSenior.contact}
                  onChange={(e) => setSelectedSenior(prev => ({ ...prev, contact: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
                <button
                  onClick={async () => { await saveSenior(selectedSenior); setShowModal(false); }}
                  className={`px-4 py-2 text-white rounded bg-green-600 hover:bg-green-700`}
                >
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
