'use client';

import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function ReportPagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  onPrevious,
  onNext,
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-slate-500">
        Page <span className="font-semibold text-slate-700">{currentPage}</span> of{' '}
        <span className="font-semibold text-slate-700">{totalPages}</span>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!hasPrevPage}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FiChevronLeft size={16} />
          Previous
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!hasNextPage}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <FiChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}