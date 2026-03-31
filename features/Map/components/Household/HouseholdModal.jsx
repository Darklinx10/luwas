'use client';

import React from 'react';
import { FiX } from 'react-icons/fi';
import { formatHouseholdName } from '../../utils/formatHouseholdName';

const HouseholdModal = ({
  isOpen,
  selectedHousehold,
  isMDRRMCAdmin,
  setIsModalOpen,
}) => {
  if (!isOpen || !selectedHousehold || isMDRRMCAdmin) return null;

  const householdName = formatHouseholdName(selectedHousehold);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-10000">
      <div className="bg-white p-6 rounded shadow-lg w-96 relative border border-gray-200">
        {/* Close button */}
        <button
          onClick={() => setIsModalOpen(false)}
          className="absolute top-2 right-2 text-gray-600 hover:text-red-600"
        >
          <FiX className="text-xl" />
        </button>

        <p className="mb-1 font-semibold text-center text-lg">
          {householdName}&apos;s Residence
        </p>

        <div className="border-t border-gray-300 my-3"></div>

        <div className="text-sm text-gray-800 space-y-2">
          <p>
            <strong>Home Label:</strong> {selectedHousehold.homeLabel || 'N/A'}
          </p>
          <p>
            <strong>Barangay:</strong> {selectedHousehold.barangay || 'N/A'}
          </p>
          <p>
            <strong>Sitio:</strong> {selectedHousehold.sitio || 'N/A'}
          </p>
          <p>
            <strong>Contact Number:</strong> {selectedHousehold.contactNumber || 'N/A'}
          </p>
          <p>
            <strong>Coordinates:</strong> {selectedHousehold.lat?.toFixed(5)}, {selectedHousehold.lng?.toFixed(5)}
          </p>

          <div className="border-t border-gray-300 my-3"></div>

          <div className="grid grid-cols-2 gap-2">
            <p>
              <strong>Total Residents:</strong> {selectedHousehold.totalResidents || 0}
            </p>
            <p>
              <strong>Male:</strong> {selectedHousehold.totalMale || 0}
            </p>
            <p>
              <strong>Female:</strong> {selectedHousehold.totalFemale || 0}
            </p>
            <p>
              <strong>PWDs:</strong> {selectedHousehold.totalPWDs || 0}
            </p>
            <p>
              <strong>Seniors:</strong> {selectedHousehold.totalSeniors || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HouseholdModal;
