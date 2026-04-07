'use client';

import { FiUploadCloud, FiX } from 'react-icons/fi';

export default function GeojsonUploadModal({
  isOpen,
  isMDRRMCAdmin,
  geojsonFile,
  setGeojsonFile,
  setIsUploadModalOpen,
  handleFileUpload,
  loading,
}) {
  if (!isOpen || !isMDRRMCAdmin) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <button
          type="button"
          onClick={() => setIsUploadModalOpen(false)}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close modal"
        >
          <FiX className="h-5 w-5" />
        </button>

        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
              Admin Only
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              GeoJSON Boundary
            </span>
          </div>

          <h2 className="mt-3 text-xl font-bold text-slate-800">
            Upload Boundary File
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Upload a valid GeoJSON boundary file for the municipal map.
          </p>
        </div>

        <div className="space-y-4 p-6">
          <label
            htmlFor="geojsonUpload"
            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 text-center transition hover:border-emerald-500 hover:bg-emerald-50"
          >
            <FiUploadCloud className="mb-3 h-10 w-10 text-emerald-600" />
            <p className="text-sm font-medium text-slate-700">
              {geojsonFile ? geojsonFile.name : 'Click to upload GeoJSON file'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Accepted: .geojson / application/geo+json
            </p>

            <input
              id="geojsonUpload"
              type="file"
              accept=".geojson,application/geo+json"
              onChange={(e) => setGeojsonFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>

          {geojsonFile && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Selected: <span className="font-medium">{geojsonFile.name}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(false)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleFileUpload}
            disabled={loading}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Boundary'}
          </button>
        </div>

        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-[1px]">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          </div>
        )}
      </div>
    </div>
  );
}