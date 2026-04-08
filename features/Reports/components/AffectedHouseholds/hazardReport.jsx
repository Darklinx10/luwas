'use client';

import ReportPagination from '@/features/Reports/components/Shared/ReportPagination';
import { capitalizeWords } from '@/utils/capitalize';
import { useEffect, useMemo, useState } from 'react';
import { FiDownload, FiHome, FiPrinter, FiSearch } from 'react-icons/fi';

const PAGE_SIZE = 10;

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}

export default function HazardTable({
  data = [],
  title = 'Hazard Reports',
  loading = false,
  legendProp,
  formatValue = (val) => val ?? 'N/A',
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!debouncedSearch.trim()) return data;

    const search = debouncedSearch.toLowerCase();
    const key = legendProp?.key || 'unknown';

    return data.filter((h) => {
      const haystack = `${h.householdId || ''} ${h.name || ''} ${h.barangay || ''} ${h.sitio || ''} ${h.contactNumber || ''} ${h.homeLabel || ''} ${h[key] || ''}`.toLowerCase();
      return haystack.includes(search);
    });
  }, [data, debouncedSearch, legendProp]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage((prevPage) => Math.min(prevPage, totalPages));
  }, [totalPages]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredData.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, filteredData]);

  const handlePrint = () => window.print();

  const handleDownloadCSV = () => {
    if (!filteredData.length) return;

    const headers = [
      'Household',
      'Barangay',
      'Sitio',
      'Contact Number',
      'Home',
      legendProp?.key || 'Value',
    ];

    const rows = filteredData.map((h) =>
      [
        `"${String(h.name || '').replace(/"/g, '""')}"`,
        `"${String(h.barangay || '').replace(/"/g, '""')}"`,
        `"${String(h.sitio || '').replace(/"/g, '""')}"`,
        `"${String(h.contactNumber || '').replace(/"/g, '""')}"`,
        `"${String(h.homeLabel ?? 'Primary Home').replace(/"/g, '""')}"`,
        `"${String(legendProp?.key ? formatValue(h[legendProp.key]) : 'N/A').replace(/"/g, '""')}"`,
      ].join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'hazard-report.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-4">
      <div id="print-section" className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-800">{title}</h3>
              <p className="mt-2 text-sm text-slate-500">
                Hazard-affected household locations based on saved household home coordinates.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-100">
                Hazard Records
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                Total: {filteredData.length}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-sm">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search household, barangay, sitio, home..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handlePrint}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiPrinter size={16} />
                Print
              </button>

              <button
                onClick={handleDownloadCSV}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiDownload size={16} />
                Download CSV
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            {loading ? (
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
                  <p className="text-sm text-slate-500">Loading hazard records...</p>
                </div>
              </div>
            ) : data.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <FiHome size={20} />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-700">
                  No hazard records found
                </h3>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="text-sm text-slate-500">No matching hazard records found.</p>
              </div>
            ) : (
              <table className="min-w-full text-left text-sm print:text-xs">
                <thead className="bg-slate-50">
                  <tr className="text-xs uppercase tracking-[0.08em] text-slate-500">
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">No.</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">Household</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">Barangay</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">Sitio</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">Contact Number</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">Home</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">
                      {legendProp?.key || 'Value'}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedData.map((h, i) => (
                    <tr
                      key={h.recordId || `${h.householdId || 'household'}-${h.homeLabel || i}`}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="border-b border-slate-200 px-4 py-4 text-slate-700">
                        {(currentPage - 1) * PAGE_SIZE + i + 1}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-4 font-medium text-slate-800">
                        {capitalizeWords(h.name || 'Unnamed')}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-4 text-slate-700">
                        {capitalizeWords(h.barangay || 'N/A')}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-4 text-slate-700">
                        {capitalizeWords(h.sitio || '-')}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-4 text-slate-700">
                        {h.contactNumber || 'N/A'}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-4 text-slate-700">
                        {h.homeLabel ?? 'Primary Home'}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-4 text-slate-700">
                        {legendProp?.key ? formatValue(h[legendProp.key]) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {filteredData.length > 0 && (
          <ReportPagination
            currentPage={currentPage}
            totalPages={totalPages}
            hasNextPage={currentPage < totalPages}
            hasPrevPage={currentPage > 1}
            onPrevious={() => setCurrentPage((prevPage) => Math.max(1, prevPage - 1))}
            onNext={() => setCurrentPage((prevPage) => Math.min(totalPages, prevPage + 1))}
          />
        )}
      </div>
    </div>
  );
}