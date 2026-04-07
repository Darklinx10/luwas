'use client';

/**
 * app/(home)/reports/page.jsx
 *
 * Reports landing page
 * Feature-based architecture: Uses feature module from features/Reports/
 * 
 * Report types:
 * - PWD: Persons with Disability
 * - Seniors: Senior Citizens (age >= 60)
 * - Accidents: Accident reports
 * - Affected households: Household locations intersecting hazard layers
 */

import { useState } from 'react';
import {
  AccidentsReportView,
  AffectedHouseholdsReportView,
  PWDReportView,
  SeniorsReportView,
} from '@/features/Reports';
import RoleGuard from '@/components/roleGuard';

/**
 * Report navigation and display component
 * 
 * Features:
 * - Tabbed interface for selecting reports
 * - Feature-integrated report views
 * - Role-based access control
 */
function ReportsPageContent() {
  const [selectedReport, setSelectedReport] = useState('pwd');

  // Report tabs configuration
  const reportTabs = [
    {
      id: 'pwd',
      label: 'PWD',
      title: 'Persons with Disability Report',
      description: 'Members identified as PWD',
    },
    {
      id: 'senior',
      label: 'Seniors',
      title: 'Senior Citizens Report',
      description: 'Members aged 60 and above',
    },
    {
      id: 'accident',
      label: 'Accidents',
      title: 'Accident Reports',
      description: 'All reported accidents',
    },
    {
      id: 'affected-households',
      label: 'Affected Households',
      title: 'Hazard-Affected Household Report',
      description: 'Households affected by the selected hazard layer',
    },
  ];

  /**
   * Render selected report
   * Uses feature-based components from features/Reports/
   */
  const renderSelectedReport = () => {
    switch (selectedReport) {
      case 'pwd':
        return <PWDReportView />;

      case 'senior':
        return <SeniorsReportView />;

      case 'accident':
        return <AccidentsReportView />;

      case 'affected-households':
        return <AffectedHouseholdsReportView />;

      default:
        return <PWDReportView />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-2">View and manage household reports</p>
      </div>

      {/* Report Navigation Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 flex-wrap border-b border-gray-200">
          {reportTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedReport(tab.id)}
              className={`px-4 py-3 font-medium border-b-2 transition-all ${
                selectedReport === tab.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Report Description */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          {reportTabs.find((t) => t.id === selectedReport)?.description}
        </p>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          {renderSelectedReport()}
        </div>
      </div>
    </div>
  );
}

/**
 * Main Reports Page Component
 * 
 * Wraps content with role-based access guard
 * MDRRMC-Admin, MDRRMC-Personnel, and Brgy-Secretary can access
 */
export default function ReportsPage() {
  return (
    <RoleGuard allowedRoles={['MDRRMC-Admin', 'MDRRMC-Personnel', 'Brgy-Secretary']}>
      <ReportsPageContent />
    </RoleGuard>
  );
}
