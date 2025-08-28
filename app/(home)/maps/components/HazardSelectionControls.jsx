'use client';

import React from 'react';

export default function HazardSelectControls({
  isHouseholdMap,
  isMDRRMCAdmin,
  loading,
  activeHazard,
  setActiveHazard
}) {
  if (!isHouseholdMap || isMDRRMCAdmin) return null;

  return (
    <div className="leaflet-top leaflet-left ml-10">
      <div className="leaflet-control leaflet-bar bg-white shadow rounded mt-2 ml-2 p-2">
        <div className="flex items-center gap-2 mb-1">
          <label htmlFor="hazard-select" className="text-sm font-medium">
            Hazards
          </label>
          {loading && (
            <div className="absolute top-2 right-2 z-50">
              <svg className="animate-spin h-4 w-4 text-green-800" viewBox="0 0 24 24">
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
            </div>
          )}
        </div>
        <select
          id="hazard-select"
          className="text-sm border rounded p-1 cursor-pointer focus:outline-none w-full"
          value={activeHazard}
          onChange={(e) => setActiveHazard(e.target.value)}
        >
          <option value="">Select Hazard</option>
          <option value="Active Faults">Active Faults Susceptibility Map</option>
          <option value="Liquefaction">Liquefaction Susceptibility Map</option>
          <option value="Rain Induced Landslide">Rain Induced Landslide Susceptibility Map</option>
          <option value="Earthquake Induced Landslide">Earthquake Induced Landslide Susceptibility Map</option>
          <option value="Ground Shaking">Ground Shaking Susceptibility Map</option>
          <option value="Storm Surge">Storm Surge Susceptibility Map</option>
          <option value="Tsunami">Tsunami Susceptibility Map</option>
          <option value="Landslide">Landslide Susceptibility Map</option>
        </select>
      </div>
    </div>
  );
}
