'use client';

import React from 'react';
import { FiX } from 'react-icons/fi';

const HouseholdModal = ({
  isOpen,
  selectedHousehold,
  isMDRRMCAdmin,
  setIsModalOpen,
}) => {
  if (!isOpen || !selectedHousehold || isMDRRMCAdmin) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-10000">
      <div className="bg-white p-4 rounded shadow-lg w-80 relative border border-gray-200">
        {/* Close icon button */}
        <button
          onClick={() => setIsModalOpen(false)}
          className="absolute top-2 right-2 text-gray-600 hover:text-red-600"
        >
          <FiX className="text-xl" />
        </button>

        <p className="mb-1 font-semibold text-center">
          {selectedHousehold.name || 'Unnamed Household'}&apos;s Residence
        </p>
        <p className="mb-2 text-sm text-center text-gray-700">
          Contact Number: {selectedHousehold.contactNumber || 'N/A'}
        </p>

        <div className="text-sm text-gray-800 ml-9">
          <strong>Members:</strong>
          <ul className="list-disc list-inside ml-4 mt-1">
            {selectedHousehold.members?.length > 0 ? (
              selectedHousehold.members.map((member, index) => (
                <li key={index}>{member}</li>
              ))
            ) : (
              <li>No members listed</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HouseholdModal;
