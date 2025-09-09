'use client';

import React from 'react';

const AffectedHouseholdsPanel = ({
  isHouseholdMap,
  affectedHouseholds,
  isMDRRMCAdmin,
  activeHazard,
  legendProp, // 👈 pass legendProp down from HazardLayers
  formatValue, // 👈 NEW: formatter function passed down
}) => {
  if (!isHouseholdMap || affectedHouseholds.length === 0 || isMDRRMCAdmin) {
    return null;
  }

  return (
    <div className="absolute bottom-4 left-4 z-[1000] p-4 bg-white rounded shadow max-h-[300px] overflow-auto w-[90vw] max-w-sm sm:max-w-md text-sm">
      <h3 className="font-semibold mb-2 text-lg">
        Affected Households ({affectedHouseholds.length})
      </h3>

      {activeHazard && (
        <p className="text-sm text-gray-600 mb-2">
          💡 Hazard: <strong>{activeHazard}</strong>
        </p>
      )}

      <ul className="list-disc ml-5">
        {affectedHouseholds.map((h) => (
          <li key={h.id} className="mb-2">
            <strong>{h.name || 'Unnamed'}</strong>
            <br />
            📍 Barangay: {h.barangay || 'N/A'}
            <br />
            📞 Contact: {h.contactNumber || 'N/A'}
            <br />
            🌐 Location: Lat: {h.lat}, Lng: {h.lng}
            <br />

            {/* Show hazard-specific value */}
            {legendProp?.key && (
              <>
                ⚠️ {legendProp.key}:{" "}
                {formatValue
                  ? formatValue(h[legendProp.key])
                  : h[legendProp.key] ?? "N/A"}
                <br />
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AffectedHouseholdsPanel;
