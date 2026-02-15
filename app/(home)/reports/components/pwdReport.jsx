'use client';

import { useState } from 'react';
import { FiSearch, FiEdit, FiTrash2, FiX } from 'react-icons/fi';
import { usePWDs } from '@/hooks/usePwdViewModel';
import { capitalizeWords } from '@/utils/capitalize';

export default function PWDTable({ title, barangay }) {
  const [selectedPWD, setSelectedPWD] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const {
    pwds,
    searchTerm,
    setSearchTerm,
    loading,
    authLoading,
    savePWD,
    deletePWD,
  } = usePWDs(barangay);

  

  // CSV download
  const handleDownloadCSV = () => {
    if (!pwds.length) return;

    const headers = 'No,Name,Sex,Age,Barangay,Sitio,Contact,Disability';
    const rows = pwds
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p, idx) => [
        idx + 1,
        capitalizeWords(p.name),
        p.sex,
        p.age,
        capitalizeWords(p.barangay),
        capitalizeWords(p.sitio),
        p.contact,
        p.disability,
      ].join(','));

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pwd_report_2026.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (authLoading) return <p className="text-center py-6 text-gray-600">Loading user profile...</p>;

  return (
    <div className="p-4">
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
          <button
            onClick={() => window.print()}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" 
            disabled={loading}
          >
            Print
          </button>
          <button
            onClick={handleDownloadCSV}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" 
            disabled = {loading}
          >
            Download CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto shadow border-t-0 rounded-b-md bg-white p-4 scrollbar-thin">
        {loading ? (
          <p className="text-center py-6 text-gray-600">Loading PWD records...</p>
        ) : pwds.length === 0 ? (
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
              {pwds.map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">{idx + 1}</td>
                  <td className="px-4 py-2 border">{capitalizeWords(item.name)}</td>
                  <td className="px-4 py-2 border">{item.sex}</td>
                  <td className="px-4 py-2 border">{item.age}</td>
                  <td className="px-4 py-2 border">{capitalizeWords(item.barangay)}</td>
                  <td className="px-4 py-2 border">{capitalizeWords(item.sitio)}</td>
                  <td className="px-4 py-2 border">{item.contact}</td>
                  <td className="px-4 py-2 border">{item.disability}</td>
                  <td className="px-4 py-2 border print:hidden">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => { setSelectedPWD(item); setShowModal(true); }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => deletePWD(item)}
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

        <p className="text-sm text-gray-700 mt-4">
          <strong>Total PWDs:</strong> {pwds.length}
        </p>
      </div>

      {/* Modal */}
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
                <input type="text" value={capitalizeWords(selectedPWD.name)} readOnly className="w-full border rounded px-3 py-2 bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium">Sex</label>
                <select
                  value={selectedPWD.sex}
                  onChange={(e) => setSelectedPWD(prev => ({ ...prev, sex: e.target.value }))}
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
                  value={selectedPWD.age}
                  onChange={(e) => setSelectedPWD(prev => ({ ...prev, age: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Barangay</label>
                <input
                  type="text"
                  value={capitalizeWords(selectedPWD.barangay)}
                  onChange={(e) => setSelectedPWD(prev => ({ ...prev, barangay: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Sitio</label>
                <input
                  type="text"
                  value={capitalizeWords(selectedPWD.sitio)}
                  onChange={(e) => setSelectedPWD(prev => ({ ...prev, sitio: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Contact Number</label>
                <input
                  type="tel"
                  value={selectedPWD.contact}
                  onChange={(e) => setSelectedPWD(prev => ({ ...prev, contact: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Disability</label>
                <input
                  type="text"
                  value={selectedPWD.disability}
                  onChange={(e) => setSelectedPWD(prev => ({ ...prev, disability: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
                <button
                  onClick={async () => { await savePWD(selectedPWD); setShowModal(false); }}
                  className="px-4 py-2 text-white rounded bg-green-600 hover:bg-green-700"
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