'use client';

import React from 'react';

/**
 * features/Reports/components/Shared/ReportPagination.jsx
 *
 * Shared pagination component for report navigation
 */

export default function ReportPagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  onPrevious,
  onNext,
  onPageChange,
}) {
  return (
    <div className="flex items-center justify-between mt-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex gap-2">
        <button
          onClick={onPrevious}
          disabled={!hasPrevPage}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={!hasNextPage}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700"
        >
          Next
        </button>
      </div>
      <div className="text-sm text-gray-600">
        Page <span className="font-semibold">{currentPage}</span> of{' '}
        <span className="font-semibold">{totalPages}</span>
      </div>
    </div>
  );
}
