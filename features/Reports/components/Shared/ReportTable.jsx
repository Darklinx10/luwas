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
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No members found</p>
      </div>
    );
  }

  const getRowKey = (member, idx) => {
    if (member.recordId) {
      return member.recordId;
    }

    const householdPart = member.householdId || member.householdID || 'household';
    const memberPart = member.memberId || member.id || member.fullName || member.firstName || 'member';

    return `${householdPart}-${memberPart}-${idx}`;
  };

  return (
    <div className="overflow-x-auto shadow border-t-0 rounded-b-md bg-white p-4">
      <table className="w-full text-sm text-center print:text-xs print:border print:border-gray-400">
        <thead className="bg-gray-100 text-gray-600 print:bg-white print:text-black">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="p-2 border font-semibold"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((member, idx) => (
            <tr key={getRowKey(member, idx)} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td
                  key={`${getRowKey(member, idx)}-${col.key}`}
                  className="p-2 border text-gray-900"
                >
                  {col.render ? col.render(member) : (member[col.key] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
