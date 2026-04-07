'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * features/Reports/components/Shared/ReportSearch.jsx
 *
 * Shared search component for filtering reports
 */

export default function ReportSearch({
  placeholder = 'Search by name...',
  onSearch,
  debounceDelay = 500,
}) {
  const [searchValue, setSearchValue] = useState('');
  const timeoutRef = useRef(null);

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onSearch(value);
    }, debounceDelay);
  };

  const handleClear = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setSearchValue('');
    onSearch('');
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex gap-2 mb-6">
      <input
        type="text"
        value={searchValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {searchValue && (
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
        >
          Clear
        </button>
      )}
    </div>
  );
}
