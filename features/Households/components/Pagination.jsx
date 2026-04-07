'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
} from 'react-icons/fi';

function buildPages(page, totalPages, windowSize) {
  if (totalPages <= 1) return [1];

  const pages = [];
  const half = Math.floor(windowSize / 2);

  let start = Math.max(2, page - half);
  let end = Math.min(totalPages - 1, page + half);

  if (page <= half + 1) {
    end = Math.min(totalPages - 1, windowSize);
  }

  if (page >= totalPages - half) {
    start = Math.max(2, totalPages - windowSize + 1);
  }

  pages.push(1);

  if (start > 2) pages.push('left-ellipsis');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push('right-ellipsis');

  if (totalPages > 1) pages.push(totalPages);

  return pages;
}

export default function Pagination({
  page = 1,
  totalPages = 1,
  onFirst,
  onPrev,
  onNext,
  onLast,
  onPageSelect,
}) {
  const [windowSize, setWindowSize] = useState(5);
  const [pageInput, setPageInput] = useState(String(page));

  useEffect(() => {
    const handleResize = () => {
      setWindowSize(window.innerWidth < 640 ? 3 : 5);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  if (!totalPages || totalPages < 1) return null;

  const pages = useMemo(
    () => buildPages(page, totalPages, windowSize),
    [page, totalPages, windowSize]
  );

  const isFirstPage = page === 1;
  const isLastPage = page === totalPages;

  const baseBtn =
    'inline-flex h-9 min-w-[36px] items-center justify-center rounded-xl border px-2.5 text-sm font-medium transition';
  const neutralBtn =
    'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';
  const activeBtn =
    'border-emerald-600 bg-emerald-600 text-white shadow-sm';
  const disabledBtn = 'cursor-not-allowed opacity-40 hover:bg-white';

  const submitPageInput = () => {
    let value = Number(pageInput);

    if (!Number.isFinite(value) || Number.isNaN(value)) {
      setPageInput(String(page));
      return;
    }

    value = Math.max(1, Math.min(totalPages, value));

    if (value !== page) {
      onPageSelect(value);
    } else {
      setPageInput(String(value));
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={onFirst}
          disabled={isFirstPage}
          className={`${baseBtn} ${neutralBtn} ${isFirstPage ? disabledBtn : ''}`}
          aria-label="First page"
        >
          <FiChevronsLeft size={16} />
        </button>

        <button
          type="button"
          onClick={onPrev}
          disabled={isFirstPage}
          className={`${baseBtn} ${neutralBtn} ${isFirstPage ? disabledBtn : ''}`}
          aria-label="Previous page"
        >
          <FiChevronLeft size={16} />
        </button>

        {pages.map((item, index) =>
          typeof item === 'number' ? (
            <button
              key={`${item}-${index}`}
              type="button"
              onClick={() => onPageSelect(item)}
              className={`${baseBtn} ${item === page ? activeBtn : neutralBtn}`}
              aria-current={item === page ? 'page' : undefined}
            >
              {item}
            </button>
          ) : (
            <span
              key={`${item}-${index}`}
              className="px-1 text-sm text-slate-400 select-none"
              aria-hidden="true"
            >
              …
            </span>
          )
        )}

        <button
          type="button"
          onClick={onNext}
          disabled={isLastPage}
          className={`${baseBtn} ${neutralBtn} ${isLastPage ? disabledBtn : ''}`}
          aria-label="Next page"
        >
          <FiChevronRight size={16} />
        </button>

        <button
          type="button"
          onClick={onLast}
          disabled={isLastPage}
          className={`${baseBtn} ${neutralBtn} ${isLastPage ? disabledBtn : ''}`}
          aria-label="Last page"
        >
          <FiChevronsRight size={16} />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-slate-500">
        <span>
          Page <span className="font-semibold text-slate-700">{page}</span> of{' '}
          <span className="font-semibold text-slate-700">{totalPages}</span>
        </span>

        <div className="flex items-center gap-2">
          <label htmlFor="page-jump" className="text-slate-500">
            Go to
          </label>
          <input
            id="page-jump"
            type="number"
            min={1}
            max={totalPages}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onBlur={submitPageInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitPageInput();
            }}
            className="h-9 w-14 rounded-xl border border-slate-300 bg-white px-2 text-center text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            aria-label="Jump to page"
          />
        </div>
      </div>
    </div>
  );
}