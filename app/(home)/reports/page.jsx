'use client';

/**
 * app/(home)/reports/page.jsx
 *
 * Reports landing page
 * Feature-based architecture: Uses feature module from features/Reports/
 */

import { useState } from 'react';
import {
  AccidentsReportView,
  AffectedHouseholdsReportView,
  PWDReportView,
  SeniorsReportView,
} from '@/features/Reports';
import RoleGuard from '@/components/roleGuard';
import { FiFileText, FiShield, FiUsers, FiUserCheck, FiAlertTriangle, FiHome } from 'react-icons/fi';

function ReportsPageContent() {
  const [selectedReport, setSelectedReport] = useState('pwd');

  const reportTabs = [
    {
      id: 'pwd',
      label: 'PWD',
      title: 'Persons with Disability Report',
      description: 'Members identified as PWD.',
      icon: <FiUserCheck size={16} />,
    },
    {
      id: 'senior',
      label: 'Seniors',
      title: 'Senior Citizens Report',
      description: 'Members aged 60 and above.',
      icon: <FiUsers size={16} />,
    },
    {
      id: 'accident',
      label: 'Accidents',
      title: 'Accident Reports',
      description: 'All reported accidents.',
      icon: <FiAlertTriangle size={16} />,
    },
    {
      id: 'affected-households',
      label: 'Affected Households',
      title: 'Hazard-Affected Household Report',
      description: 'Households affected by the selected hazard layer.',
      icon: <FiHome size={16} />,
    },
  ];

  const activeTab = reportTabs.find((tab) => tab.id === selectedReport) || reportTabs[0];

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
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {/* Page Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm text-slate-400">Home / Reports</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-800">Reports</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-500">
                View and manage household, demographic, accident, and hazard-related reports across LUWAS.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                Reporting Workspace
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                4 Report Types
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {reportTabs.map((tab) => {
              const isActive = selectedReport === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedReport(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Report Info */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <FiFileText size={18} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-800">
                {activeTab.title}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {activeTab.description}
              </p>
            </div>
          </div>
        </div>

        {/* Report Content */}
        {renderSelectedReport()}
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
