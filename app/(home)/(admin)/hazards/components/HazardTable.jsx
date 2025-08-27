'use client';

import { FiTrash2 } from 'react-icons/fi';

export default function HazardTable({
  loading,
  filteredHazards,
  handlePreview,
  handleDeleteHazard
}) {
  return (
    <div className="overflow-x-auto shadow border-t-0 rounded-b-md bg-white p-4">
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
            <p className="text-gray-600 text-sm">Loading hazard layers...</p>
          </div>
        </div>
      ) : filteredHazards.length === 0 ? (
        <p className="text-center text-gray-500 py-6">No hazard layers found.</p>
      ) : (
        <table className="w-full text-sm text-center">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-2 border">Type</th>
              <th className="p-2 border">Description</th>
              <th className="p-2 border">Date Uploaded</th>
              <th className="p-2 border">View</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredHazards.map((hazard) => (
              <tr key={hazard.id} className="hover:bg-gray-50">
                <td className="p-2 border">{hazard.type}</td>
                <td className="p-2 border">{hazard.description}</td>
                <td className="p-2 border">
                  {hazard.createdAt
                    ? new Date(hazard.createdAt.seconds * 1000).toLocaleString()
                    : 'N/A'}
                </td>
                <td className="p-2 border">
                  <button
                    onClick={() => handlePreview(hazard)}
                    className="px-2 py-1 text-white bg-green-600 hover:bg-green-700 rounded"
                  >
                    Preview
                  </button>
                </td>
                <td className="p-2 border">
                  <button
                    onClick={() => handleDeleteHazard(hazard)}
                    className="text-red-600 hover:text-red-800 cursor-pointer"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
