'use client';

import React from 'react';

export default function AccidentMapControls({ isAccidentMap, isMDRRMCAdmin, addingAccident, setAddingAccident }) {
  if (!isAccidentMap || isMDRRMCAdmin) return null;

  return (
    <div className="leaflet-top leaflet-left ml-10">
      <div className="leaflet-control leaflet-bar bg-white shadow rounded mt-2 ml-2 p-2">
        <button
          onClick={() => setAddingAccident((prev) => !prev)}
          className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 w-full cursor-pointer"
        >
          {addingAccident ? 'Cancel' : 'Add Accident'}
        </button>
      </div>
    </div>
  );
}
