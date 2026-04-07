'use client';

import { FiCalendar, FiEye, FiLayers, FiTrash2 } from 'react-icons/fi';

function formatUploadedDate(createdAt) {
  if (!createdAt?.seconds) return 'N/A';
  return new Date(createdAt.seconds * 1000).toLocaleString();
}

export default function HazardTable({
  loading,
  filteredHazards = [],
  handlePreview,
  handleDeleteHazard,
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center px-6 py-14">
        <div className="flex flex-col items-center">
          <svg
            className="mb-3 h-10 w-10 animate-spin text-emerald-600"
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
          <p className="text-sm text-slate-500">Loading hazard layers...</p>
        </div>
      </div>
    );
  }

  if (filteredHazards.length === 0) {
    return (
      <div className="px-6 py-14 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <FiLayers size={20} />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-700">
          No hazard layers found
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Add a new GeoJSON hazard layer or adjust your search.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left">
        <thead className="bg-slate-50">
          <tr className="text-xs uppercase tracking-[0.08em] text-slate-500">
            <th className="border-b border-slate-200 px-4 py-3 font-semibold min-w-[180px]">
              Hazard Type
            </th>
            <th className="border-b border-slate-200 px-4 py-3 font-semibold min-w-[240px]">
              Description
            </th>
            <th className="border-b border-slate-200 px-4 py-3 font-semibold min-w-[200px]">
              Date Uploaded
            </th>
            <th className="border-b border-slate-200 px-4 py-3 text-center font-semibold min-w-[120px]">
              Preview
            </th>
            <th className="border-b border-slate-200 px-4 py-3 text-center font-semibold min-w-[110px]">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {filteredHazards.map((hazard) => (
            <tr key={hazard.id} className="transition hover:bg-slate-50">
              <td className="border-b border-slate-200 px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <FiLayers size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {hazard.type || 'N/A'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Hazard layer
                    </p>
                  </div>
                </div>
              </td>

              <td className="border-b border-slate-200 px-4 py-4">
                <p className="text-sm text-slate-700">
                  {hazard.description || 'No description provided.'}
                </p>
              </td>

              <td className="border-b border-slate-200 px-4 py-4">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <FiCalendar className="text-slate-400" size={14} />
                  <span>{formatUploadedDate(hazard.createdAt)}</span>
                </div>
              </td>

              <td className="border-b border-slate-200 px-4 py-4 text-center">
                <button
                  onClick={() => handlePreview(hazard)}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                >
                  <FiEye size={15} />
                  Preview
                </button>
              </td>

              <td className="border-b border-slate-200 px-4 py-4 text-center">
                <button
                  onClick={() => handleDeleteHazard(hazard)}
                  className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 transition hover:bg-red-100"
                  title="Delete hazard layer"
                >
                  <FiTrash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}