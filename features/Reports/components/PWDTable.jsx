'use client';

import { useState } from 'react';
import { FiSearch, FiEdit, FiX } from 'react-icons/fi';
import { usePWDReport } from '../hooks/usePWDReport';
import { formatNameLastFirst } from '../utils/nameFormatter';
import { generatePWDCSV, downloadCSV } from '../utils/csvExport';
import { capitalizeWords } from '@/utils/capitalize';

export default function PWDTable({ title }) {
  const [selectedPWD, setSelectedPWD] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const {
    pwdMembers,
    searchTerm,
    setSearchTerm,
    loading,
    authLoading,
    pagination,
    goToPage,
    savePWD,
    deletePWD,
  } = usePWDReport();

  const handleDownloadCSV = () => {
    if (!pwdMembers.length) return;
    const csv = generatePWDCSV(pwdMembers);
    downloadCSV(csv, `pwd_report_${new Date().getFullYear()}.csv`);
  };

  if (authLoading) {
    return <p className="text-center py-6 text-gray-600">Loading user profile...</p>;
  }

  return (
    <div className="p-4">
      <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-semibold text-lg print:text-black print:bg-white print:text-center">
        {title}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 bg-white shadow border-t-0 px-4 py-3 print:hidden">
        <div className="relative w-full max-w-xs">
          <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            Print
          </button>
          <button
            onClick={handleDownloadCSV}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            Download CSV
          </button>
        </div>
      </div>

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
        ) : pwdMembers.length === 0 ? (
          <p className="text-center py-6 text-gray-500">No PWD records found.</p>
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
                <th className="px-4 py-2 border">Disability</th>
                <th className="px-4 py-2 border print:hidden">Action</th>
              </tr>
            </thead>
            <tbody>
              {pwdMembers.map((item, idx) => (
                <tr key={item.memberId} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">{idx + 1}</td>
                  <td className="px-4 py-2 border">{formatNameLastFirst(item.fullName)}</td>
                  <td className="px-4 py-2 border">{item.sex || '-'}</td>
                  <td className="px-4 py-2 border">{item.age || '-'}</td>
                  <td className="px-4 py-2 border">{capitalizeWords(item.barangay || '')}</td>
                  <td className="px-4 py-2 border">{capitalizeWords(item.sitio || '')}</td>
                  <td className="px-4 py-2 border">{item.contactNumber || '-'}</td>
                  <td className="px-4 py-2 border">
                    {item.disabilityType || item.disability || '-'}
                  </td>
                  <td className="px-4 py-2 border print:hidden">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => {
                          setSelectedPWD(item);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <FiEdit />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-gray-700">
          <strong>Total PWDs:</strong> {pagination.totalCount}
        </p>
        
        {pagination.totalPages > 1 && (
          <div className="flex gap-1">
            <button
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Prev
            </button>
            {Array.from({ length: pagination.totalPages }).map((_, i) => (
              <button
                key={i + 1}
                onClick={() => goToPage(i + 1)}
                className={`px-3 py-1 border rounded ${
                  pagination.page === i + 1 ? 'bg-green-600 text-white' : 'hover:bg-gray-100'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
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

            <h2 className="text-lg font-bold mb-4">Edit PWD Info</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={selectedPWD.fullName || ''}
                  readOnly
                  className="w-full border rounded px-3 py-2 bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Disability Type</label>
                <input
                  type="text"
                  value={selectedPWD.disabilityType || ''}
                  onChange={(e) =>
                    setSelectedPWD({ ...selectedPWD, disabilityType: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    savePWD(selectedPWD);
                    setShowModal(false);
                  }}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
