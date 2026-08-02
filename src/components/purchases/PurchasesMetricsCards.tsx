// src/components/purchases/PurchasesMetricsCards.tsx
import React from 'react';
import { formatNumber } from '../../utils/formatters';

/**
 * Shape of calculated purchase financial summaries passed to {@link PurchasesMetricsCards}.
 */
export interface PurchaseMetricsData {
  /** Sum total expenditure across all filtered purchase receipts */
  totalSpend: number;
  /** Total value-added tax (VAT) available for input tax claims */
  totalVat: number;
  /** Total tax amount withheld from vendor payouts */
  totalWithholding: number;
}

/**
 * Props interface for the {@link PurchasesMetricsCards} component.
 */
interface PurchasesMetricsCardsProps {
  /** Aggregated purchase metric indicators */
  metrics: PurchaseMetricsData;
  /** Dictionary containing localized labels and currency symbol mappings */
  t: Record<string, any>;
}

/**
 * `PurchasesMetricsCards` presents a high-level summary overview of purchase financials.
 * 
 * Displays three responsive summary KPI cards:
 * 1. **Total Spend**: Gross purchasing expenditure.
 * 2. **Claimable VAT**: Input VAT amounts eligible for tax reclaim.
 * 3. **Retained Withholding (WT)**: Tax withheld at source on supplier payments.
 * 
 * Styled for both light/dark modes and hidden during document print actions (`print:hidden`).
 */
export const PurchasesMetricsCards: React.FC<PurchasesMetricsCardsProps> = ({ metrics, t }) => {
  return (
    <div className="grid grid-cols-3 gap-2 print:hidden no-print">
      
      {/* ------------------------------------------------------------------ */}
      {/* CARD 1: Total Purchasing Expenditure                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm min-w-0">
        <span className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 block truncate">
          {t.totalSpendLabel || "Total Spend"}
        </span>
        <span className="text-xs sm:text-base font-bold text-slate-900 dark:text-white block truncate mt-0.5">
          {formatNumber(metrics.totalSpend)}{' '}
          <span className="text-[10px] font-semibold text-slate-500">{t.currency}</span>
        </span>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* CARD 2: Total Claimable Input VAT                                  */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm min-w-0">
        <span className="text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400 block truncate">
          {t.claimableVatLabel || "Claimable VAT"}
        </span>
        <span className="text-xs sm:text-base font-bold text-emerald-600 dark:text-emerald-400 block truncate mt-0.5">
          +{formatNumber(metrics.totalVat)}{' '}
          <span className="text-[10px] font-semibold">{t.currency}</span>
        </span>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* CARD 3: Retained Withholding Tax (WT) Deductions                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm min-w-0">
        <span className="text-[10px] sm:text-xs font-medium text-amber-600 dark:text-amber-400 block truncate">
          {t.retainedWtLabel || "Retained WT"}
        </span>
        <span className="text-xs sm:text-base font-bold text-amber-600 dark:text-amber-400 block truncate mt-0.5">
          -{formatNumber(metrics.totalWithholding)}{' '}
          <span className="text-[10px] font-semibold">{t.currency}</span>
        </span>
      </div>

    </div>
  );
};