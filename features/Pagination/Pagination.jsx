'use client';

import { useEffect, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from "react-icons/fi";

export default function Pagination({
  page = 1,
  totalPages = 1,
  onFirst,
  onPrev,
  onNext,
  onLast,
  onPageSelect
}) {
  const [windowSize, setWindowSize] = useState(5);

  useEffect(() => {
    function handleResize() {
      setWindowSize(window.innerWidth < 640 ? 3 : 5);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!totalPages || totalPages < 1) return null;

  const pages = [];
  const half = Math.floor(windowSize / 2);
  let start = Math.max(2, page - half);
  let end = Math.min(totalPages - 1, page + half);

  if (page <= half) end = Math.min(totalPages - 1, windowSize);
  if (page > totalPages - half) start = Math.max(2, totalPages - windowSize + 1);

  pages.push(1);
  if (start > 2) pages.push('...');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push('...');
  if (totalPages > 1) pages.push(totalPages);

  const baseBtn =
    "flex items-center justify-center px-2 py-1 rounded-md border text-xs transition min-w-[30px] h-8";
  const navBtn = `${baseBtn} bg-white hover:bg-gray-100 border-gray-300`;
  const disabledBtn = "opacity-40 cursor-not-allowed";

  const handleJump = (e) => {
    let val = Number(e.target.value);
    if (val < 1) val = 1;
    if (val > totalPages) val = totalPages;
    onPageSelect(val);
  };

  return (
    <div className="flex flex-col items-center gap-2 p-2">
      <div className="flex flex-wrap justify-center items-center gap-1.5">
        <button
          onClick={onFirst}
          disabled={page === 1}
          className={`${navBtn} ${page === 1 ? disabledBtn : ""}`}
          aria-label="First Page"
        >
          <FiChevronsLeft size={14} />
        </button>

        <button
          onClick={onPrev}
          disabled={page === 1}
          className={`${navBtn} ${page === 1 ? disabledBtn : ""}`}
          aria-label="Previous Page"
        >
          <FiChevronLeft size={14} />
        </button>

        {pages.map((p, idx) =>
          typeof p === 'number' ? (
            <button
              key={idx}
              onClick={() => onPageSelect(p)}
              className={
                p === page
                  ? "flex items-center justify-center px-2 py-1 rounded-md border bg-green-600 text-white border-green-600 min-w-[30px] h-8 text-xs transition"
                  : "flex items-center justify-center px-2 py-1 rounded-md border bg-white text-gray-700 border-gray-300 min-w-[30px] h-8 hover:bg-gray-100 text-xs transition"
              }
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          ) : (
            <span key={idx} className="px-1 text-gray-400 text-xs select-none">
              …
            </span>
          )
        )}

        <button
          onClick={onNext}
          disabled={page === totalPages}
          className={`${navBtn} ${page === totalPages ? disabledBtn : ""}`}
          aria-label="Next Page"
        >
          <FiChevronRight size={14} />
        </button>

        <button
          onClick={onLast}
          disabled={page === totalPages}
          className={`${navBtn} ${page === totalPages ? disabledBtn : ""}`}
          aria-label="Last Page"
        >
          <FiChevronsRight size={14} />
        </button>
      </div>

      <div className="flex items-center gap-1.5 mt-1">
        <span className="text-gray-500 text-xs">
          Page <span className="font-semibold">{page}</span> of{" "}
          <span className="font-semibold">{totalPages}</span>
        </span>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={page}
          onChange={handleJump}
          onBlur={handleJump}
          className="w-10 h-7 px-1 text-center border border-gray-300 rounded-md bg-gray-100 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
          aria-label="Jump to page"
        />
      </div>
    </div>
  );
}