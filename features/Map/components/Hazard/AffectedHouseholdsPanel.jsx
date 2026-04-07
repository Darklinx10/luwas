'use client';

import { useEffect, useState } from 'react';
import useIsMobile from '@/hooks/useMobile';
import { FiAlertTriangle, FiChevronDown, FiHome } from 'react-icons/fi';

export default function AffectedHouseholdsPanel({
  isHouseholdMap,
  affectedHouseholds,
  isMDRRMCAdmin,
  activeHazard,
  legendProp,
  formatValue,
}) {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(!!isMobile);
  }, [isMobile, activeHazard]);

  if (!isHouseholdMap || affectedHouseholds.length === 0 || isMDRRMCAdmin) {
    return null;
  }

  if (collapsed) {
    return (
      <div className="absolute bottom-4 left-4 z-[1000]">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          aria-label="Expand affected households panel"
        >
          <FiHome className="text-emerald-700" />
          Affected Households
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-4 left-4 z-[1000] w-[calc(100vw-2rem)] max-w-none overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:w-[22rem] md:w-[24rem] lg:w-[26rem]">
      <div className="flex items-start justify-between border-b border-slate-200 px-4 py-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">
            Affected Households
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {affectedHouseholds.length} affected location(s)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Collapse affected households panel"
        >
          <FiChevronDown />
        </button>
      </div>

      <div className="max-h-[40vh] space-y-3 overflow-auto p-4 sm:max-h-[45vh] lg:max-h-[50vh]">
        {activeHazard && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-100">
            <FiAlertTriangle />
            <span>
              Active Hazard: <strong>{activeHazard}</strong>
            </span>
          </div>
        )}

        {affectedHouseholds.map((house) => (
          <div
            key={house.id}
            className="rounded-xl border border-slate-200 bg-slate-50 p-3"
          >
            <p className="text-sm font-semibold text-slate-800">
              {house.headFullName || 'Unnamed'}
            </p>
            <div className="mt-2 space-y-1 text-xs text-slate-600">
              <p>Barangay: {house.barangay || 'N/A'}</p>
              <p>Contact: {house.contactNumber || 'N/A'}</p>
              <p>
                Location: {house.lat}, {house.lng}
              </p>

              {legendProp?.key && (
                <p>
                  {legendProp.key}:{' '}
                  <span className="font-medium text-slate-700">
                    {formatValue
                      ? formatValue(house[legendProp.key])
                      : house[legendProp.key] ?? 'N/A'}
                  </span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}