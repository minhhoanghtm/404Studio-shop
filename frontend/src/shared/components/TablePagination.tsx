import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function getPaginationRange(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

export interface TablePaginationProps {
  currentPage: number;
  totalItems?: number;
  totalPages?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  itemName?: string;
  className?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalItems,
  totalPages: propTotalPages,
  pageSize = 10,
  onPageChange,
  itemName = 'mục',
  className = '',
}) => {
  const calculatedTotalPages = typeof totalItems === 'number'
    ? Math.max(1, Math.ceil(totalItems / pageSize))
    : 1;

  const finalTotalPages = propTotalPages ?? calculatedTotalPages;
  const validPage = Math.min(Math.max(1, currentPage), finalTotalPages);

  // If there are no items and totalPages is 0 or 1 with 0 items, don't show
  if (typeof totalItems === 'number' && totalItems === 0) return null;
  if (finalTotalPages <= 1 && typeof totalItems === 'undefined') return null;

  const startItem = typeof totalItems === 'number'
    ? (totalItems > 0 ? (validPage - 1) * pageSize + 1 : 0)
    : undefined;
  const endItem = typeof totalItems === 'number'
    ? Math.min(validPage * pageSize, totalItems)
    : undefined;

  const paginationRange = getPaginationRange(validPage, finalTotalPages);

  return (
    <div
      className={`px-6 py-4 border-t border-[var(--border)] dark:border-white/10 bg-[var(--bg-card-muted)] dark:bg-zinc-900/90 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)] dark:text-zinc-400 ${className}`}
    >
      <div className="font-mono text-xs">
        {typeof startItem === 'number' && typeof endItem === 'number' && typeof totalItems === 'number' ? (
          <span>
            Hiển thị <strong className="text-[var(--text-primary)] dark:text-zinc-100 font-mono">{startItem}</strong> –{' '}
            <strong className="text-[var(--text-primary)] dark:text-zinc-100 font-mono">{endItem}</strong> trong tổng số{' '}
            <strong className="text-[var(--text-primary)] dark:text-zinc-100 font-mono">{totalItems.toLocaleString('vi-VN')}</strong>{' '}
            {itemName} (Trang {validPage}/{finalTotalPages})
          </span>
        ) : (
          <span>
            Hiển thị trang <strong className="text-[var(--text-primary)] dark:text-zinc-100 font-mono">{validPage}</strong> /{' '}
            <strong className="text-[var(--text-primary)] dark:text-zinc-100 font-mono">{finalTotalPages}</strong>{' '}
            {itemName ? `(${itemName})` : ''}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-end">
        {/* Nút Trước */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, validPage - 1))}
          disabled={validPage <= 1}
          className="pagination-btn-nav px-3.5 py-1.5 bg-white dark:bg-zinc-800 hover:bg-[#f7f5ef] dark:hover:bg-zinc-700/80 border border-[#e3ded2] dark:border-white/15 text-[#1a1a17] dark:text-zinc-200 rounded-lg shadow-xs disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:border-[#e3ded2] disabled:hover:bg-white dark:disabled:hover:bg-zinc-800 transition-all duration-200 flex items-center gap-1.5 text-[11px] font-mono cursor-pointer hover:border-[#8a6d1a] dark:hover:border-[#d4af37] hover:text-[#8a6d1a] dark:hover:text-[#fef08a] hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-95 active:shadow-inner"
          aria-label="Trang trước"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Trước</span>
        </button>

        {/* Các nút số trang và dấu ... */}
        {paginationRange.map((item, idx) => {
          if (typeof item === 'string') {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 py-1 text-xs text-[var(--text-muted)] dark:text-zinc-500 select-none font-mono"
              >
                ...
              </span>
            );
          }

          const isActive = item === validPage;
          return (
            <button
              key={`page-${item}`}
              type="button"
              onClick={() => onPageChange(item)}
              aria-current={isActive ? 'page' : undefined}
              className={`min-w-[34px] h-8 px-2 text-xs font-mono rounded-lg border transition-all duration-200 flex items-center justify-center cursor-pointer ${
                isActive
                  ? 'pagination-btn-active bg-[#8a6d1a] text-white border-[#8a6d1a] dark:bg-[#d4af37] dark:text-[#121217] dark:border-[#d4af37] font-bold shadow-md shadow-amber-900/25 dark:shadow-[0_0_16px_rgba(212,175,55,0.45)] hover:brightness-105 active:scale-95'
                  : 'pagination-btn-inactive bg-white dark:bg-zinc-800 border-[#e3ded2] dark:border-white/15 text-[#1a1a17] dark:text-zinc-200 shadow-xs hover:border-[#8a6d1a] dark:hover:border-[#d4af37] hover:text-[#8a6d1a] dark:hover:text-[#fef08a] hover:bg-[#f7f5ef] dark:hover:bg-zinc-700/80 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-95'
              }`}
            >
              {item}
            </button>
          );
        })}

        {/* Nút Sau */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(finalTotalPages, validPage + 1))}
          disabled={validPage >= finalTotalPages}
          className="pagination-btn-nav px-3.5 py-1.5 bg-white dark:bg-zinc-800 hover:bg-[#f7f5ef] dark:hover:bg-zinc-700/80 border border-[#e3ded2] dark:border-white/15 text-[#1a1a17] dark:text-zinc-200 rounded-lg shadow-xs disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:border-[#e3ded2] disabled:hover:bg-white dark:disabled:hover:bg-zinc-800 transition-all duration-200 flex items-center gap-1.5 text-[11px] font-mono cursor-pointer hover:border-[#8a6d1a] dark:hover:border-[#d4af37] hover:text-[#8a6d1a] dark:hover:text-[#fef08a] hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-95 active:shadow-inner"
          aria-label="Trang sau"
        >
          <span>Sau</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
