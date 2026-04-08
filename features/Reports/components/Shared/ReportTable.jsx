'use client';

import React from 'react';

/**
 * features/Reports/components/Shared/ReportTable.jsx
 *
 * Shared table component for displaying report members
 * Used by both PWD and Seniors reports
 */

export default function ReportTable({ members, columns = [] }) {
  if (!members || members.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
        <p className="text-sm text-slate-500">No records found</p>
      </div>
    );
  }

  const getRowKey = (member, idx) => {
    if (member.recordId) return member.recordId;

    const householdPart = member.householdId || member.householdID || 'household';
    const memberPart =
      member.memberId || member.id || member.fullName || member.firstName || 'member';

    return `${householdPart}-${memberPart}-${idx}`;
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm print:text-xs">
          <thead className="bg-slate-50">
            <tr className="text-xs uppercase tracking-[0.08em] text-slate-500">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="border-b border-slate-200 px-4 py-3 font-semibold"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {members.map((member, idx) => (
              <tr
                key={getRowKey(member, idx)}
                className="transition hover:bg-slate-50"
              >
                {columns.map((col) => (
                  <td
                    key={`${getRowKey(member, idx)}-${col.key}`}
                    className="border-b border-slate-200 px-4 py-4 text-slate-700"
                  >
                    {col.render ? col.render(member) : member[col.key] ?? '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}