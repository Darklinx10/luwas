'use client';

import HazardTable from '@/app/(home)/reports/components/hazardReport';
import { useAffectedHouseholdsReport } from '../../hooks/useAffectedHouseholdsReport';

function formatLegendValue(value, legendProp) {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }

  if (legendProp?.type === 'numeric') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed.toLocaleString() : String(value);
  }

  return String(value);
}

export default function AffectedHouseholdsReportView() {
  const {
    hazardType,
    setHazardType,
    hazardTypes,
    activeHazardType,
    records,
    legendProp,
    loading,
    error,
  } = useAffectedHouseholdsReport();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Affected Households Report</h2>
        <p className="text-gray-600 mt-1">
          Household-level hazard exposure derived from saved household homes and hazard polygons.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[260px]">
          <label htmlFor="hazardType" className="block text-sm font-medium text-gray-700 mb-2">
            Hazard Type
          </label>
          <select
            id="hazardType"
            value={hazardType || activeHazardType || ''}
            onChange={(event) => setHazardType(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="">Select a hazard type</option>
            {hazardTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-gray-600">
          Total affected household locations:{' '}
          <span className="font-semibold text-gray-900">{records.length}</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-900 font-semibold">Error</p>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {!error && !(hazardType || activeHazardType) ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Select a hazard type to view affected households.</p>
        </div>
      ) : !error ? (
        <HazardTable
          data={records}
          loading={loading}
          title={
            activeHazardType
              ? `Affected Households - ${activeHazardType}`
              : 'Affected Households'
          }
          legendProp={legendProp}
          formatValue={(value) => formatLegendValue(value, legendProp)}
        />
      ) : null}
    </div>
  );
}
