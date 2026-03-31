'use client';

import { useEffect, useState } from 'react';
import { AccidentTable, HazardTable, PWDTable, SeniorTable, useHazardsReport } from '@/features/Reports';
import RoleGuard from '@/components/roleGuard';
import { useAuth } from '@/context/authContext';
import { hazardTypes } from '@/utils/hazardTypes';

const titleMap = {
  pwd: 'List of Persons with Disability',
  senior: 'List of Senior Citizens',
  accident: 'List of Reported Accidents',
  ...hazardTypes.reduce((map, type) => {
    map[type] = `Reported Hazards: ${type}`;
    return map;
  }, {}),
};

function ReportsPageContent() {
  const [selectedReport, setSelectedReport] = useState('pwd');
  const { profile } = useAuth();

  // Use hazards report hook for hazard data
  const { affectedHouseholds, loading, legendProp } = useHazardsReport(
    hazardTypes.includes(selectedReport) ? selectedReport : null
  );

  const renderTable = () => {
    const title = titleMap[selectedReport];

    // PWD Table
    if (selectedReport === 'pwd') {
      return <PWDTable title={title} />;
    }

    // Senior Table
    if (selectedReport === 'senior') {
      return <SeniorTable title={title} />;
    }

    // Accident Table
    if (selectedReport === 'accident') {
      return <AccidentTable title={title} />;
    }

    // Hazard Table
    if (hazardTypes.includes(selectedReport)) {
      return (
        <HazardTable
          data={affectedHouseholds}
          title={title}
          loading={loading}
          legendProp={legendProp}
          formatValue={(val) => val ?? 'N/A'}
        />
      );
    }

    return null;
  };

  return (
    <div className="p-4">
      {/* Report selection buttons */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['pwd', 'senior', 'accident']
          .filter((key) => profile?.role !== 'Brgy-Secretary' || key !== 'accident')
          .map((key) => (
            <button
              key={key}
              onClick={() => setSelectedReport(key)}
              className={`px-4 py-2 rounded cursor-pointer ${
                selectedReport === key
                  ? 'bg-green-600 text-white font-bold'
                  : 'bg-gray-300 text-gray-800 hover:bg-green-300'
              }`}
            >
              {titleMap[key].split('(')[0].replace('List of ', '').trim()}
            </button>
          ))}

        {profile?.role !== 'Brgy-Secretary' && (
          <select
            onChange={(e) => setSelectedReport(e.target.value)}
            value={hazardTypes.includes(selectedReport) ? selectedReport : ''}
            className={`px-2 py-1 rounded cursor-pointer outline-none transition-all duration-200 ${
              hazardTypes.includes(selectedReport)
                ? 'bg-green-600 text-white font-bold'
                : 'bg-gray-300 text-gray-800 hover:bg-green-400'
            }`}
          >
            <option value="" disabled className="text-gray-500 bg-white">
              Select Hazard
            </option>
            {hazardTypes.map((hazard) => (
              <option key={hazard} value={hazard} className="text-black bg-white">
                {hazard}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Render table */}
      <div className="bg-white rounded shadow p-4 overflow-x-auto print:border print:border-gray-300">
        {renderTable()}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <RoleGuard allowedRoles={['MDRRMC-Personnel', 'Brgy-Secretary']}>
      <ReportsPageContent />
    </RoleGuard>
  );
}
