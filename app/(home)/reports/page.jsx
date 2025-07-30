'use client'; 

import { useState } from 'react'; 
// Import table components for different reports
import PWDTable from '@/components/Tables/pwdTable';
import SeniorTable from '@/components/Tables/seniorTable';
import HazardTable from '@/components/Tables/hazardTable';
import AccidentTable from '@/components/Tables/accidentTable';

// Static sample data for hazard and accident reports
const reportData = {
  hazards: [
    { type: 'Flood', location: 'Zone 1', date: '2025-06-01' },
    { type: 'Landslide', location: 'Zone 3', date: '2025-07-01' },
  ]
};

export default function ReportsPage() {
  // State to track which report is currently selected
  const [selectedReport, setSelectedReport] = useState('pwd');

  // Mapping report keys to readable table titles
  const titleMap = {
    pwd: 'List of Person with Disability (2025)',
    senior: 'List of Senior Citizens (2025)',
    hazards: 'List of Reported Hazards (2025)',
    accident: 'List of Reported Accidents (2025)',
  };

  // Function to render the appropriate table based on the selected report
  const renderTable = () => {
    const title = titleMap[selectedReport];

    if (selectedReport === 'pwd') return <PWDTable title={title} />;
    if (selectedReport === 'senior') return <SeniorTable title={title} />;
    if (selectedReport === 'hazards') return <HazardTable data={reportData.hazards} title={title} />;
    if (selectedReport === 'accident') return <AccidentTable data={reportData.accident} title={title} />;
  };

  return (
    <div className="p-4">
      {/* Report selection buttons */}
      <div className="flex gap-2 mb-4">
        {['pwd', 'senior', 'hazards', 'accident'].map((key) => (
          <button
            key={key}
            onClick={() => setSelectedReport(key)} 
            className={`px-4 py-2 rounded cursor-pointer ${
              selectedReport === key
                ? 'bg-green-600 text-white font-bold' 
                : 'bg-gray-300 text-gray-800 hover:bg-green-300' 
            }`}
          >
            {/* Remove "List of" and trim for shorter tab labels */}
            {titleMap[key].split('(')[0].replace('List of ', '').trim()}
          </button>
        ))}
      </div>

      {/* Table container with shadow and print border */}
      <div className="bg-white rounded shadow p-4 overflow-x-auto print:border print:border-gray-300">
        {renderTable()}
      </div>
    </div>
  );
}
