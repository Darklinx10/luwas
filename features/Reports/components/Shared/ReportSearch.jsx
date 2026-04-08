'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="relative">
        <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchValue}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />

        {searchValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Clear search"
          >
            <FiX size={16} />
          </button>
        )}
      </div>
    </div>
  );
}