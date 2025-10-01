'use client';
import React from 'react';

const SetDefaultCenterControl = ({ setSettingDefault }) => {
  return (
    <button
      onClick={() => {
        setSettingDefault(true);
        alert('Click on the map to set a new default center.');
      }}
      className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 w-full cursor-pointer"
    >
      Set New Default Center
    </button>
  );
};

export default SetDefaultCenterControl;
