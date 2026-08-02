import React from 'react';
import { Calendar, Filter, RotateCcw, FileSpreadsheet, Printer, Loader2 } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';

/**
 * Props for the {@link PurchasesFilterToolbar} component.
 */
interface PurchasesFilterToolbarProps {
  /** ISO date string or formatted string representing the start of the filter window. */
  startDate: string;
  /** ISO date string or formatted string representing the end of the filter window. */
  endDate: string;
  /** Callback triggered when a user manually modifies dates or selects a date preset. */
  setActivePreset: (val: any) => void;
  /** Callback to update the start date state. */
  setStartDate: (val: string) => void;
  /** Callback to update the end date state. */
  setEndDate: (val: string) => void;
  /** Current selected tax filter option. */
  taxFilter: 'all' | 'vat' | 'withholding';
  /** Callback to update the selected tax filter state. */
  setTaxFilter: (val: 'all' | 'vat' | 'withholding') => void;
  /** Total count of records matching the active filter criteria. */
  filteredCount: number;
  /** Flag indicating whether purchase data is currently loading/fetching. */
  loading: boolean;
  /** Flag determining whether any non-default filter state is currently applied. */
  hasActiveFilters: boolean;
  /** Handler to reset all filter values back to their default state. */
  onReset: () => void;
  /** Handler to trigger a CSV export of the currently filtered data. */
  onExportCSV: () => void;
  /** Dictionary containing localized translation strings and optional dynamic formatters. */
  t: Record<string, any>;
}

/**
 * `PurchasesFilterToolbar` provides a comprehensive filtering and action header
 * for purchases/receipts management UI.
 * 
 * Features:
 * - Date range selection (Start/End) with automatic preset switching to 'custom'.
 * - Tax categorization filtering (All, VAT, Withholding).
 * - Real-time records count display with loading state indicator.
 * - Dynamic reset and export actions (CSV Export & Native Print).
 */
export const PurchasesFilterToolbar: React.FC<PurchasesFilterToolbarProps> = ({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  setActivePreset,
  taxFilter,
  setTaxFilter,
  filteredCount,
  loading,
  hasActiveFilters,
  onReset,
  onExportCSV,
  t
}) => {
  // Triggers the native browser print dialog safely
  const handlePrint = () => {
    if (filteredCount > 0) {
      window.print();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 print:hidden no-print">
      {/* ------------------------------------------------------------------ */}
      {/* TOP BAR: Primary Input Controls (Date Picker & Tax Category Filter) */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        {/* Date Range Picker Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
            
            {/* Start Date Selector */}
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                // Switch to custom preset whenever dates are manually altered
                setActivePreset('custom');
              }}
              className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            
            <span className="text-slate-400 font-medium px-0.5">{t.toLabel || "to"}</span>
            
            {/* End Date Selector */}
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                // Switch to custom preset whenever dates are manually altered
                setActivePreset('custom');
              }}
              className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Tax Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={taxFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTaxFilter(e.target.value as 'all' | 'vat' | 'withholding')}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">{t.taxAllLabel || "All Taxes"}</option>
            <option value="vat">{t.vatLabel || "VAT"}</option>
            <option value="withholding">{t.withholdingLabel || "Withholding"}</option>
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* BOTTOM BAR: Metadata Summary & Toolbar Actions                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-row items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        
        {/* Record Counter & Loading Spinner */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="leading-none">
            
              {/* Supports both function-based localization formatters and plain numbers */}
              {typeof t.showingReceipts === 'function' 
                ? t.showingReceipts(filteredCount) 
                : `${formatNumber(filteredCount, 0)}`}
          </span>
          
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />}
        </div>

        {/* Action Buttons Container */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          
          {/* Reset Filters (Only visible when non-default filters are active) */}
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="flex items-center justify-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors rounded-lg"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.resetLabel || "Reset"}</span>
            </button>
          )}

          {/* Export to CSV Button */}
          <button
            onClick={onExportCSV}
            disabled={filteredCount === 0 || loading}
            className="flex items-center justify-center gap-1.5 h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          {/* Native Print Dialog Button */}
          <button
            onClick={handlePrint}
            disabled={filteredCount === 0 || loading}
            className="flex items-center justify-center gap-1.5 h-8 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t.printLabel || t.print || "Print"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};