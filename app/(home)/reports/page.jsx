'use client';

import { useState } from 'react';
import PWDTable from '@/components/Tables/pwdTable';
import SeniorTable from '@/components/Tables/seniorTable';
import HazardTable from '@/components/Tables/hazardTable';
import AccidentTable from '@/components/Tables/accidentTable';

const reportData = {
  hazards: [
    { type: 'Flood', location: 'Zone 1', date: '2025-06-01' },
    { type: 'Landslide', location: 'Zone 3', date: '2025-07-01' },
  ],
  accident: [
    { type: 'Collision', location: 'Highway 1', date: '2025-06-20', injuries: 2 },
    { type: 'Overturn', location: 'Zone 5', date: '2025-06-22', injuries: 0 },
  ],
};

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('pwd');

  const titleMap = {
    pwd: 'List of Person with Disability (2025)',
    senior: 'List of Senior Citizens (2025)',
    hazards: 'List of Reported Hazards (2025)',
    accident: 'List of Reported Accidents (2025)',
  };

  const renderTable = () => {
    const title = titleMap[selectedReport];

    if (selectedReport === 'pwd') return <PWDTable title={title} />;
    if (selectedReport === 'senior') return <SeniorTable title={title} />;
    if (selectedReport === 'hazards') return <HazardTable data={reportData.hazards} title={title} />;
    if (selectedReport === 'accident') return <AccidentTable data={reportData.accident} title={title} />;
  };

  return (
    <div className="p-4">
      {/* Report Tabs */}
      <div className="flex gap-2 mb-4">
        {['pwd', 'senior', 'hazards', 'accident'].map((key) => (
          <button
            key={key}
            onClick={() => setSelectedReport(key)}
            className={`px-4 py-2 rounded cursor-pointer ${
              selectedReport === key
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-green-100'
            }`}
          >
            {titleMap[key].split('(')[0].replace('List of ', '').trim()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded shadow p-4 overflow-x-auto print:border print:border-gray-300">
        {renderTable()}
      </div>
    </div>
  );
}
