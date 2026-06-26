// src/components/AdminControls.tsx
import React from 'react';
import { Search } from 'lucide-react';

interface AdminControlsProps {
  localSearch: string;
  setLocalSearch: (val: string) => void;
  pageSize: number;
  onPageSizeChange?: (size: number) => void;
  t: any;
}

/**
 * AdminControls Component
 * Provides a streamlined query input layout and context pagination sizing controls.
 */
export default function AdminControls({
  localSearch,
  setLocalSearch,
  pageSize,
  onPageSizeChange,
  t
}: AdminControlsProps) {
  return (
    <div 
      className="flex gap-2.5 items-center w-full animate-in fade-in duration-200"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}
    >
      
      {/* Search Input Filter Component */}
      <div className="relative flex-1 flex items-center h-11">
        <Search className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 stroke-[2.5]" />
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder={t.searchPlaceholder || "Search..."}
          className="w-full h-full pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl outline-none text-xs text-slate-700 dark:text-slate-200 font-semibold placeholder:text-slate-400 placeholder:font-medium dark:placeholder:text-slate-600 transition-all focus:border-[#1a5fb4] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#1a5fb4]/10 dark:focus:ring-blue-500/10 shadow-3xs"
        />
      </div>

      {/* Row Count Page Size Controls Matrix */}
      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-1 rounded-2xl h-11 shrink-0 shadow-3xs transition-colors duration-150">
        {[5, 10, 20].map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => onPageSizeChange && onPageSizeChange(size)}
            className={`text-xs font-black h-full px-3 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center ${
              pageSize === size 
                ? 'bg-[#1a5fb4] dark:bg-[#1a5fb4] text-white shadow-xs' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
            }`}
          >
            {size}
          </button>
        ))}
      </div>
      
    </div>
  );
}
