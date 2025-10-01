'use client';
import React from 'react';

const SetDefaultCenterControl = ({ isMDRRMCAdmin, setSettingDefault }) => {
  if (!isMDRRMCAdmin) return null;

  return (
    <div className="leaflet-top leaflet-left ml-10">
      <div className="leaflet-control leaflet-bar bg-white shadow rounded p-2 space-y-2">
        {/* Set New Default Center */}
        <button
          onClick={() => {
            setSettingDefault(true);
            alert('Click on the map to set a new default center.');
          }}
          className="text-xm sm:text-sm bg-green-600 text-white px-2 sm:px-3 py-1 rounded hover:bg-green-700 w-[9rem] sm:w-full cursor-pointer"

        >
          Set New Default Center
        </button>
      </div>
    </div>
  );
};

export default SetDefaultCenterControl;
