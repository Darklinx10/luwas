'use client';

import React from 'react';

const AffectedHouseholdsPanel = ({
  isHouseholdMap,
  affectedHouseholds,
  isMDRRMCAdmin,
  activeHazard,
  formatSusceptibility,
  formatStormSurge,
  formatTsunami,
  formatGroundShaking,
}) => {
  if (!isHouseholdMap || affectedHouseholds.length === 0 || isMDRRMCAdmin) {
    return null;
  }

  // 🔑 Map hazard names to their display category
  const hazardCategoryMap = {
    liquefaction: 'susceptibility',
    landslide: 'susceptibility',
    'earthquake induced landslide': 'susceptibility',
  'rain induced landslide': 'susceptibility',
    'storm surge': 'stormSurge',
    tsunami: 'tsunami',
    earthquake: 'groundShaking',
    'ground shaking': 'groundShaking',
  };

  // Normalize the hazard name (lowercase for safe matching)
  const selectedCategory =
    hazardCategoryMap[activeHazard?.toLowerCase()] || null;

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

            {/* Display Susceptibility for applicable hazards */}
            {selectedCategory === 'susceptibility' && h.susceptibility && (
              <>
                🌋 Susceptibility: {formatSusceptibility(h.susceptibility)}
                <br />
              </>
            )}

            {/* Display Storm Surge */}
            {selectedCategory === 'stormSurge' &&
            (h.stormSurge || h.Inundiation) ? (
              <>
                🌊 Storm Surge: {formatStormSurge(h.stormSurge || h.Inundiation)}
                <br />
              </>
            ) : null}

            {/* Display Tsunami */}
            {selectedCategory === 'tsunami' && h.tsunami ? (
              <>
                🌊 Tsunami: {h.tsunami?.descrption} ({h.tsunami?.Area} sq.km)
                <br />
              </>
            ) : null}

            {/* Display Ground Shaking */}
            {selectedCategory === 'groundShaking' && h.intensity ? (
              <>
                🌋 Ground Shaking: {formatGroundShaking(h.intensity)}
                <br />
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AffectedHouseholdsPanel;
