'use client';

import React, { useState } from 'react';
import { FiDownload, FiPrinter } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { downloadCsvFile, openPrintWindow, printTable } from '@/lib/utils/clientExport';
import { usePWDReport } from '../../hooks/usePWDReport';
import { fetchPWDReport } from '../../services/reportService';
import ReportTable from '../Shared/ReportTable';
import ReportSearch from '../Shared/ReportSearch';
import ReportPagination from '../Shared/ReportPagination';
import { formatFullName } from '@/features/Households/utils/householdFormat';

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

const PWD_EXPORT_HEADERS = [
  'Name',
  'Barangay',
  'Sitio',
  'Sex',
  'Contact Number',
  'Age',
  'Household Head',
];

function buildPWDExportRows(members = []) {
  return members.map((member) => [
    renderMemberFullName(member),
    member.householdBarangay || 'N/A',
    member.householdSitio || 'N/A',
    member.sex || 'N/A',
    member.contactNumber || 'N/A',
    member.age ?? 'N/A',
    member.headFullName || 'N/A',
  ]);
}

export default function PWDReportView() {
  const {
    members,
    loading,
    error,
    page,
    totalCount,
    totalPages,
    hasNextPage,
    hasPrevPage,
    isIndexError,
    indexErrorLink,
    search,
    setPage,
    setSearch,
  } = usePWDReport();
  const [actionLoading, setActionLoading] = useState('');

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
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

  const handlePrint = async () => {
    let printWindow = null;

    try {
      printWindow = openPrintWindow('PWD Report');
      setActionLoading('print');

      const data = await fetchPWDReport({ search, exportAll: true });
      const exportMembers = data.members || [];

      if (!exportMembers.length) {
        printWindow.close();
        toast.info('No PWD members available to print.');
        return;
      }

      printTable({
        printWindow,
        title: 'PWD (Persons with Disability) Report',
        subtitle: search ? `Filtered by search: ${search}` : 'All matching PWD records',
        headers: PWD_EXPORT_HEADERS,
        rows: buildPWDExportRows(exportMembers),
        summaryLines: [`Total members: ${data.totalMembers || exportMembers.length}`],
      });
    } catch (error) {
      if (printWindow) {
        printWindow.close();
      }

      console.error(error);
      toast.error(error.message || 'Failed to print PWD report.');
    } finally {
      setActionLoading('');
    }
  };

  const handleDownloadCSV = async () => {
    try {
      setActionLoading('download');

      const data = await fetchPWDReport({ search, exportAll: true });
      const exportMembers = data.members || [];

      if (!exportMembers.length) {
        toast.info('No PWD members available to download.');
        return;
      }

      downloadCsvFile({
        filename: 'pwd-report.csv',
        headers: PWD_EXPORT_HEADERS,
        rows: buildPWDExportRows(exportMembers),
      });
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to download PWD report.');
    } finally {
      setActionLoading('');
    }
  };

  if (isIndexError) {
    return (
      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
        <h3 className="text-lg font-semibold text-yellow-900">Index Error</h3>
        <p className="mt-2 text-sm text-yellow-800">
          Check the server logs for Firestore composite index creation link.
        </p>
        {indexErrorLink && (
          <a
            href={indexErrorLink}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-sm font-medium text-yellow-900 underline"
          >
            Open Firebase index creation page
          </a>
        )}
        <p className="mt-2 text-sm text-yellow-700">
          The system will automatically retry once the index is created.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="print-section">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              PWD (Persons with Disability) Report
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Total members: <span className="font-semibold text-slate-700">{totalCount}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              disabled={loading || actionLoading !== '' || totalCount === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiPrinter size={16} />
              {actionLoading === 'print' ? 'Preparing...' : 'Print All'}
            </button>

            <button
              type="button"
              onClick={handleDownloadCSV}
              disabled={loading || actionLoading !== '' || totalCount === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiDownload size={16} />
              {actionLoading === 'download' ? 'Preparing...' : 'Download CSV'}
            </button>
          </div>
        </div>
      </div>

      <div className="print:hidden">
        <ReportSearch
          placeholder="Search by member, household head, barangay, or contact..."
          onSearch={handleSearch}
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="font-semibold text-red-900">Error</p>
          <p className="mt-1 text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-14 shadow-sm">
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
            <p className="text-sm text-slate-500">Loading PWD members...</p>
          </div>
        </div>
      )}

      {!loading && members.length > 0 && (
        <>
          <ReportTable members={members} columns={PWD_COLUMNS} />

          <div className="print:hidden">
            <ReportPagination
              currentPage={page}
              totalPages={totalPages}
              hasNextPage={hasNextPage}
              hasPrevPage={hasPrevPage}
              onPrevious={handlePrevPage}
              onNext={handleNextPage}
            />
          </div>
        </>
      )}

      {!loading && members.length === 0 && !error && (
        <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center shadow-sm">
          <p className="text-sm text-slate-500">No PWD members found</p>
        </div>
      )}
    </div>
  );
}
