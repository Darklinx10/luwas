'use client';

import React, { useMemo } from 'react';
import { FiEdit, FiMapPin, FiTrash2 } from 'react-icons/fi';
import { FaChevronRight } from 'react-icons/fa';
import HouseholdMembersTable from './HouseholdMembersTable';
import { formatFullName } from '../utils/householdFormat';
import { toast } from 'react-toastify';

export default function HouseholdTable({
  loading,
  households = [],
  expandedHouseholds = {},
  toggleExpanded,
  membersData = {},
  loadingMembers = {},
  handleEditMember,
  handleDeleteMember,
  handleDeleteHousehold,
  handleEditHousehold,
  handleAddMember,
  onMapClick,
  totalHouseholds,
  totalResidents,
  page = 1,
  pageSize = 10,
  role,
}) {
  const displayedHouseholds = useMemo(() => {
    return Array.isArray(households) ? households : [];
  }, [households]);

  if (loading) {
    return (
      <div className="flex items-center justify-center px-6 py-14">
        <div className="flex flex-col items-center">
          <svg
            className="mb-3 h-10 w-10 animate-spin text-emerald-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          <p className="text-sm text-slate-500">Loading household records...</p>
        </div>
      </div>
    );
  }

  if (!displayedHouseholds.length) {
    return (
      <div className="px-6 py-14 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <FiMapPin size={20} />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-700">
          No household records found
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Add a new household or adjust the current search.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="max-h-[560px] overflow-y-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr className="text-xs uppercase tracking-[0.08em] text-slate-500">
              <th className="border-b border-slate-200 px-3 py-3 print:hidden" />
              <th className="border-b border-slate-200 px-3 py-3 font-semibold">No.</th>
              <th className="min-w-[180px] border-b border-slate-200 px-3 py-3 font-semibold">
                Family Head
              </th>
              <th className="min-w-[120px] border-b border-slate-200 px-3 py-3 font-semibold">
                Barangay
              </th>
              <th className="min-w-[110px] border-b border-slate-200 px-3 py-3 font-semibold">
                Sitio
              </th>
              <th className="min-w-[80px] border-b border-slate-200 px-3 py-3 font-semibold">
                Sex
              </th>
              <th className="min-w-[130px] border-b border-slate-200 px-3 py-3 font-semibold">
                Contact
              </th>
              <th className="min-w-[70px] border-b border-slate-200 px-3 py-3 font-semibold">
                Age
              </th>
              <th className="min-w-[110px] border-b border-slate-200 px-3 py-3 font-semibold print:hidden">
                Map
              </th>
              <th className="min-w-[90px] border-b border-slate-200 px-3 py-3 text-center font-semibold print:hidden">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {displayedHouseholds.map((hh, index) => {
              const fullName =
                hh.headFullName ||
                formatFullName({
                  firstName: hh.headFirstName,
                  middleName: hh.headMiddleName,
                  lastName: hh.headLastName,
                  suffix: hh.headSuffix,
                });

              const isExpanded = expandedHouseholds[hh.householdId];
              const members = membersData[hh.householdId] || [];

              return (
                <React.Fragment key={hh.householdId}>
                  <tr className="transition hover:bg-slate-50">
                    <td className="border-b border-slate-200 px-3 py-4 print:hidden">
                      <button
                        onClick={() => toggleExpanded(hh.householdId)}
                        title="View household members"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-emerald-700 transition hover:bg-emerald-50"
                      >
                        <FaChevronRight
                          className={`text-sm transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''
                            }`}
                        />
                      </button>
                    </td>

                    <td className="border-b border-slate-200 px-4 py-4 text-sm text-slate-600">
                      {(page - 1) * pageSize + index + 1}
                    </td>

                    <td className="border-b border-slate-200 px-4 py-4">
                      <div>
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {fullName || '-'}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          Household ID: {hh.householdId || '-'}
                        </p>
                      </div>
                    </td>

                    <td className="border-b border-slate-200 px-4 py-4 text-sm text-slate-700">
                      {hh.barangay || '-'}
                    </td>

                    <td className="border-b border-slate-200 px-4 py-4 text-sm text-slate-700">
                      {hh.sitio || '-'}
                    </td>

                    <td className="border-b border-slate-200 px-4 py-4 text-sm text-slate-700">
                      {hh.headSex || '-'}
                    </td>

                    <td className="border-b border-slate-200 px-4 py-4 text-sm text-slate-700">
                      {hh.contactNumber || '-'}
                    </td>

                    <td className="border-b border-slate-200 px-4 py-4 text-sm text-slate-700">
                      {hh.headAge || '-'}
                    </td>

                    <td className="border-b border-slate-200 px-4 py-4 print:hidden">
                      {hh.homes?.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {hh.homes.map((home, idx) => (
                            <button
                              key={`${hh.householdId}-home-${idx}`}
                              onClick={() => onMapClick(hh, home)}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                              title={`View ${home.label ?? `Home ${idx + 1}`} on map`}
                            >
                              <FiMapPin size={13} />
                              {home.label ?? `Home ${idx + 1}`}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>

                    <td className="border-b border-slate-200 px-4 py-4 print:hidden">
                      <div className="flex items-center justify-center gap-2">
                        {(role === 'Brgy-Secretary' || role === 'MDRRMC-Admin') && (
                          <button
                            onClick={() => handleEditHousehold(hh)}
                            className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-700 transition hover:bg-blue-100"
                            title="Edit household"
                          >
                            <FiEdit size={16} />
                          </button>
                        )}

                        {role === 'MDRRMC-Admin' && (
                          <button
                            onClick={async () => {
                              const confirmed = confirm(
                                'Are you sure you want to delete this household?'
                              );
                              if (!confirmed) return;

                              try {
                                await handleDeleteHousehold(hh.householdId);
                                toast.success('Household deleted successfully.');
                              } catch (error) {
                                console.error('Error deleting household:', error);
                                toast.error('Failed to delete household.');
                              }
                            }}
                            disabled={loading}
                            className={`inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 transition hover:bg-red-100 ${loading ? 'cursor-not-allowed opacity-50' : ''
                              }`}
                            title="Delete household"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  <HouseholdMembersTable
                    key={`members-${hh.householdId}`}
                    isExpanded={isExpanded}
                    data={hh}
                    members={members}
                    loadingMembers={loadingMembers}
                    handleEditMember={handleEditMember}
                    handleDeleteMember={handleDeleteMember}
                    handleAddMember={handleAddMember}
                  />
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 px-4 py-4">
        <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
          Total Households: {totalHouseholds}
        </div>
        <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
          Total Residents: {totalResidents}
        </div>
      </div>
    </div>
  );
}