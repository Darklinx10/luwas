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
    <div className="leaflet-top leaflet-left ml-10 md:ml-10 sm:ml-2">
      <div className="leaflet-control leaflet-bar bg-white shadow rounded mt-2 ml-2 p-2 w-[200px] sm:w-[150px] md:w-[220px]">
        <div className="flex items-center justify-between mb-1">
          <label
            htmlFor="hazard-select"
            className="text-sm font-medium whitespace-nowrap sm:text-xs"
          >
            Hazards
          </label>
          {loading && (
            <div className="relative flex justify-end ml-2">
              <svg
                className="animate-spin h-4 w-4 text-green-800"
                viewBox="0 0 24 24"
              >
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
          className="
            text-sm md:text-sm sm:text-xs
            border border-gray-300 rounded-lg
            p-2 sm:p-1.5
            cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-green-600
            w-full
            bg-white
            transition-all duration-200
          "
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
