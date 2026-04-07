'use client';

import React from 'react';
import { usePWDReport } from '../../hooks/usePWDReport';
import ReportTable from '../Shared/ReportTable';
import ReportSearch from '../Shared/ReportSearch';
import ReportPagination from '../Shared/ReportPagination';
import { formatFullName } from '@/features/Households/utils/householdFormat';

/**
 * features/Reports/components/PWD/PWDReportView.jsx
 *
 * PWD (Persons with Disability) Report component
 * Integrated into household module via Feature-based architecture
 */

const renderMemberFullName = (member) =>
  member.fullName ||
  formatFullName({
    firstName: member.firstName,
    middleName: member.middleName,
    lastName: member.lastName,
    suffix: member.suffix,
  }) ||
  'Unnamed';

const PWD_COLUMNS = [
  {
    key: 'fullName',
    label: 'Name',
    render: renderMemberFullName,
  },
  {
    key: 'householdBarangay',
    label: 'Barangay',
    render: (member) => member.householdBarangay || 'N/A',
  },
  {
    key: 'householdSitio',
    label: 'Sitio',
    render: (member) => member.householdSitio || 'N/A',
  },
  {
    key: 'sex',
    label: 'Sex',
    render: (member) => member.sex || 'N/A',
  },
  {
    key: 'contactNumber',
    label: 'Contact Number',
    render: (member) => member.contactNumber || 'N/A',
  },
  {
    key: 'age',
    label: 'Age',
    render: (member) => member.age ?? 'N/A',
  },
  {
    key: 'headFullName',
    label: 'Household Head',
    render: (member) => member.headFullName || 'N/A',
  },
];

export default function PWDReportView() {
  const {
    members,
    loading,
    error,
    page,
    search,
    totalCount,
    totalPages,
    hasNextPage,
    hasPrevPage,
    isIndexError,
    indexErrorLink,
    setPage,
    setSearch,
  } = usePWDReport();

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1); // Reset to page 1 on search
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (hasPrevPage) {
      setPage(Math.max(1, page - 1));
    }
  };

  if (isIndexError) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">Index Error</h3>
        <p className="text-yellow-800 mb-4">
          Check the server logs for Firestore composite index creation link.
        </p>
        {indexErrorLink && (
          <a
            href={indexErrorLink}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-yellow-900 underline"
          >
            Open Firebase index creation page
          </a>
        )}
        <p className="text-sm text-yellow-700">
          The system will automatically retry once the index is created.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          PWD (Persons with Disability) Report
        </h2>
        <p className="text-gray-600 mt-1">
          Total members: <span className="font-semibold">{totalCount}</span>
        </p>
      </div>

      {/* Search */}
      <ReportSearch
        placeholder="Search by member, household head, barangay, or contact..."
        onSearch={handleSearch}
      />

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-900 font-semibold">Error</p>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-gray-600 mt-4">Loading PWD members...</p>
        </div>
      )}

      {/* Table */}
      {!loading && members.length > 0 && (
        <>
          <ReportTable members={members} columns={PWD_COLUMNS} />

          {/* Pagination */}
          <ReportPagination
            currentPage={page}
            totalPages={totalPages}
            hasNextPage={hasNextPage}
            hasPrevPage={hasPrevPage}
            onPrevious={handlePrevPage}
            onNext={handleNextPage}
          />
        </>
      )}

      {/* Empty State */}
      {!loading && members.length === 0 && !error && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No PWD members found</p>
        </div>
      )}
    </div>
  );
}
