'use client';

import React, { useState, useEffect } from 'react';
import useIsMobile from '@/hooks/useMobile';

const AffectedHouseholdsPanel = ({
  isHouseholdMap,
  affectedHouseholds,
  isMDRRMCAdmin,
  activeHazard,
  legendProp,
  formatValue,
}) => {
  // 🟩 Hooks always at the top
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);

  // 🟩 Automatically collapse on mobile
  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }, [isMobile, activeHazard]);

  // 🟩 Return null in JSX (not before hooks)
  if (!isHouseholdMap || affectedHouseholds.length === 0 || isMDRRMCAdmin) {
    return null;
  }

  return (
    <>
      {collapsed ? (
        <div className="absolute left-4 bottom-4 z-[1000] group">
          {/* Plus button */}
          <button
            onClick={() => setCollapsed(false)}
            className="p-2 rounded-full bg-white shadow hover:bg-gray-200 flex items-center justify-center"
            aria-label="Expand panel"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-gray-700"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {/* Chat bubble */}
              <path
                d="M21 6H3c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14l4 4V8c0-1.1-.9-2-2-2z"
                fill="white"
                stroke="currentColor"
              />

             
            </svg>

          </button>

          {/* Tooltip */}
          <span
            className="
              absolute left-12 bottom-1 
              px-2 py-1 text-xs text-white bg-gray-800 rounded 
              opacity-0 group-hover:opacity-100 transition-opacity duration-200
              whitespace-nowrap
            "
          >
            Affected Households
          </span>
        </div>
      ) : (
        <div className="absolute left-4 bottom-4 z-[1000] bg-white rounded shadow text-sm transition-all duration-300 ease-in-out p-4 max-h-[300px] overflow-auto w-[90vw] max-w-sm sm:max-w-md">
          <button
            onClick={() => setCollapsed(true)}
            className="absolute top-2 right-2 p-1 rounded hover:bg-gray-200"
            aria-label="Collapse panel"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          <h3 className="font-semibold mt-5 mb-2 text-lg">
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
                {legendProp?.key && (
                  <>
                    ⚠️ {legendProp.key}:{' '}
                    {formatValue
                      ? formatValue(h[legendProp.key])
                      : h[legendProp.key] ?? 'N/A'}
                    <br />
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

export default AffectedHouseholdsPanel;
