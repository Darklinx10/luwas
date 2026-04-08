'use client';

import { FiAlertTriangle, FiHome } from 'react-icons/fi';
import HazardTable from '@/features/Reports/components/AffectedHouseholds/hazardReport';
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

  const selectedHazard = hazardType || activeHazardType || '';

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Affected Households Report
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              Household-level hazard exposure derived from saved household homes
              and hazard polygons.
            </p>
          </div>

          <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-100">
            Hazard Exposure
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="w-full xl:max-w-sm">
            <label
              htmlFor="hazardType"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Hazard Type
            </label>

            <select
              id="hazardType"
              value={selectedHazard}
              onChange={(event) => setHazardType(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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

          <div className="flex flex-wrap gap-3">
            <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              Selected Hazard: {selectedHazard || 'None'}
            </div>
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
              Total Locations: {records.length}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="mt-0.5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!error && !selectedHazard ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <FiHome size={20} />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-700">
            No hazard selected
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Select a hazard type to view affected households.
          </p>
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