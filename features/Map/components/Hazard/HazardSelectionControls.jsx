'use client';

import { hazardTypes } from '@/utils/hazardTypes';

export default function HazardSelectControls({
  isHouseholdMap,
  isMDRRMCAdmin,
  loading,
  activeHazard,
  setActiveHazard,
}) {
  if (!isHouseholdMap || isMDRRMCAdmin) return null;

  return (
    <div className="leaflet-top leaflet-left ml-10">
      <div className="leaflet-control mt-2 ml-2 w-[220px] rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <label
            htmlFor="hazard-select"
            className="text-sm font-semibold text-slate-700"
          >
            Hazard Layer
          </label>

          {loading && (
            <svg className="h-4 w-4 animate-spin text-emerald-700" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
              />
            </svg>
          )}
        </div>

        <select
          id="hazard-select"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          value={activeHazard}
          onChange={(e) => setActiveHazard(e.target.value)}
        >
          <option value="">Select a hazard type</option>
          {hazardTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}