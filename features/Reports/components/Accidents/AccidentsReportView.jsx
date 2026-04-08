'use client';

import AccidentTable from '@/features/Reports/components/Accidents/accidentReport';

export default function AccidentsReportView() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Accidents Report
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Review reported accidents and manage incident records.
            </p>
          </div>

          <div className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-red-100">
            Incident Records
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <AccidentTable title="List of Reported Accidents" />
      </div>
    </div>
  );
}