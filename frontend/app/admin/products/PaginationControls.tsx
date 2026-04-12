"use client";

import React from "react";

type Props = {
  currentPage: number;
  totalPages: number;
  onPageChange: (n: number) => void;
  loading?: boolean;
};

export default function PaginationControls({ currentPage, totalPages, onPageChange, loading }: Props) {
  // Helper: compute range of pages to show (max 7)
  const makeRange = (cur: number, total: number, maxLen = 7) => {
    if (total <= maxLen) return Array.from({ length: total }, (_, i) => i + 1);
    const half = Math.floor(maxLen / 2);
    let start = Math.max(1, cur - half);
    let end = start + maxLen - 1;
    if (end > total) {
      end = total;
      start = end - maxLen + 1;
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const pages = makeRange(currentPage, totalPages, 7);

  return (
    <div className="w-full flex items-center justify-between gap-2 py-3">
      {/* small screens: compact selector + prev/next (visible only on sm:hidden) */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <button
          className="btn border px-3 py-2 sm:hidden"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={loading || currentPage <= 1}
          aria-label="Anterior"
          title="Anterior"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M12.293 16.293a1 1 0 010 1.414l-6-6a1 1 0 010-1.414l6-6a1 1 0 111.414 1.414L8.414 10l5.293 5.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="flex items-center gap-2 sm:hidden">
          <label className="sr-only">Página</label>
          <select
            className="input-base"
            value={currentPage}
            onChange={(e) => onPageChange(Number(e.target.value))}
            disabled={loading}
          >
            {Array.from({ length: totalPages }).map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1} / {totalPages}
              </option>
            ))}
          </select>
        </div>

        <button
          className="btn border px-3 py-2 sm:hidden"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={loading || currentPage >= totalPages}
          aria-label="Próxima"
          title="Próxima"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M7.707 3.707a1 1 0 010-1.414l6 6a1 1 0 010 1.414l-6 6a1 1 0 11-1.414-1.414L11.586 10 6.293 4.707a1 1 0 011.414-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* medium+ screens: full pager with arrows flanking the page numbers */}
      <div className="hidden sm:flex sm:items-center sm:gap-2 overflow-x-auto">
        <button
          className="btn border px-3 py-2 mr-2"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={loading || currentPage <= 1}
          aria-label="Anterior"
          title="Anterior"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M12.293 16.293a1 1 0 010 1.414l-6-6a1 1 0 010-1.414l6-6a1 1 0 111.414 1.414L8.414 10l5.293 5.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="flex-1">
          <div className="flex justify-center">
            <div className="flex flex-wrap items-center gap-1 justify-center">
              {pages.map((p) => {
                const base = 'px-3 py-1 rounded border text-sm transition-colors';
                const activeCls = 'bg-brand text-white shadow';
                const inactiveCls = 'bg-[var(--color-card)] text-[var(--color-text)] border-[var(--color-border)] hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-white/10 dark:hover:bg-slate-700';
                return (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    disabled={loading || p === currentPage}
                    aria-current={p === currentPage}
                    className={`${base} ${p === currentPage ? activeCls : inactiveCls} min-w-[36px] text-center`}
                    style={p === currentPage ? undefined : { background: 'var(--color-card)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          className="btn border px-3 py-2 ml-2"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={loading || currentPage >= totalPages}
          aria-label="Próxima"
          title="Próxima"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M7.707 3.707a1 1 0 010-1.414l6 6a1 1 0 010 1.414l-6 6a1 1 0 11-1.414-1.414L11.586 10 6.293 4.707a1 1 0 011.414-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}
