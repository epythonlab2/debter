// src/components/common/Pagination.tsx
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  className = ''
}) => {
  if (totalItems <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  // Safe bounded current page to prevent rendering invalid ranges if props are out-of-sync
  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages));

  const startItem = (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

  // Sync mobile input with bounded page state
  const [mobileInput, setMobileInput] = useState(String(safeCurrentPage));

  useEffect(() => {
    setMobileInput(String(safeCurrentPage));
  }, [safeCurrentPage]);

  const handlePageChange = (newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages));
    if (validPage !== safeCurrentPage) {
      onPageChange(validPage);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    onPageSizeChange(newSize);
    
    // Recalculate max page for the new size and clamp if necessary
    const newTotalPages = Math.max(1, Math.ceil(totalItems / newSize));
    if (safeCurrentPage > newTotalPages) {
      onPageChange(newTotalPages);
    }
  };

  const handleMobileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMobileInput(e.target.value);
  };

  const handleMobileInputSubmit = () => {
    const pageNum = parseInt(mobileInput, 10);
    if (!isNaN(pageNum)) {
      handlePageChange(pageNum);
    } else {
      setMobileInput(String(safeCurrentPage));
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 1;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    const left = safeCurrentPage - delta;
    const right = safeCurrentPage + delta;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i <= right)) {
        pages.push(i);
      } else if (i === left - 1 || i === right + 1) {
        pages.push('...');
      }
    }

    return pages.filter((page, index, array) => page !== '...' || array[index - 1] !== '...');
  };

  return (
    <div className={`bg-slate-100 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs print:hidden no-print ${className}`}>
      
      {/* Page Size & Item Count Information */}
      <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-semibold text-[11px]">Rows:</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="px-2 py-1 sm:py-0.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-1 focus:ring-[#1a5fb4]"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <span className="text-slate-600 dark:text-slate-400 text-[11px]">
          Showing <strong>{startItem}</strong>–<strong>{endItem}</strong> of <strong>{totalItems}</strong>
        </span>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto border-t sm:border-t-0 border-slate-200 dark:border-slate-700/60 pt-2 sm:pt-0 gap-1.5 sm:gap-1">
        
        {/* First & Previous Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handlePageChange(1)}
            disabled={safeCurrentPage === 1}
            title="First Page"
            aria-label="First Page"
            className="p-2 sm:p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-slate-700 dark:text-slate-300"
          >
            <ChevronsLeft className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          </button>

          <button
            onClick={() => handlePageChange(safeCurrentPage - 1)}
            disabled={safeCurrentPage === 1}
            title="Previous Page"
            aria-label="Previous Page"
            className="p-2 sm:p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-slate-700 dark:text-slate-300"
          >
            <ChevronLeft className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>

        {/* Center Page Numbers & Mobile Quick Jump */}
        <div className="flex items-center justify-center">
          {/* Mobile Display */}
          <div className="flex sm:hidden items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700">
            <span className="text-slate-500 text-[11px]">Page</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={mobileInput}
              onChange={handleMobileInputChange}
              onBlur={handleMobileInputSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur(); // Blur triggers onBlur naturally, avoiding double submit
                }
              }}
              className="w-10 text-center text-xs font-extrabold text-[#1a5fb4] dark:text-blue-400 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-slate-400 text-[11px]">/ {totalPages}</span>
          </div>

          {/* Desktop Display */}
          <div className="hidden sm:flex items-center gap-1">
            {getPageNumbers().map((page, index) => {
              if (page === '...') {
                return (
                  <span key={`ellipsis-${index}`} className="text-slate-400 px-1 select-none">
                    …
                  </span>
                );
              }

              const pageNum = page as number;
              const isActive = pageNum === safeCurrentPage;

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-2.5 py-0.5 rounded-md text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#1a5fb4] text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
        </div>

        {/* Next & Last Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handlePageChange(safeCurrentPage + 1)}
            disabled={safeCurrentPage === totalPages}
            title="Next Page"
            aria-label="Next Page"
            className="p-2 sm:p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-slate-700 dark:text-slate-300"
          >
            <ChevronRight className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          </button>

          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={safeCurrentPage === totalPages}
            title="Last Page"
            aria-label="Last Page"
            className="p-2 sm:p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-slate-700 dark:text-slate-300"
          >
            <ChevronsRight className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default Pagination;