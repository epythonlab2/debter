// src/components/views/PurchasesView.tsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, 
  Receipt, 
  Truck, 
  Calendar, 
  AlertCircle, 
  Trash2, 
  Loader2, 
  Printer, 
  RotateCcw, 
  FileSpreadsheet,
  Filter
} from 'lucide-react';
import { RecordPurchaseModal } from '../modals/RecordPurchaseModal';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal';
import { Pagination } from '../common/Pagination';
import { PurchaseRecord } from '../../types';
import { ItemRecord } from "../../types/inventory";

/* ============================================================================
   TYPES & CONSTANTS
   ============================================================================ */
interface PurchasesViewProps {
  purchases: PurchaseRecord[];
  items: ItemRecord[];
  currentUser: { 
    id: string;
    shopId?: string | null; 
    shop_id?: string | null; 
    role?: string;
  };
  onRecordPurchase: (data: any) => Promise<any>;
  onDeletePurchase?: (purchaseId: string) => Promise<any>;
  fetchPurchases?: (params: { shopId: string; startDate?: string; endDate?: string; limit?: number }) => Promise<void>;
  loading?: boolean;
  t: any;
  lang?: string;
}

const LOCAL_STORAGE_PAGE_SIZE_KEY = 'purchasesPageSize';

// Helper function to format date as YYYY-MM-DD
const formatDate = (d: Date) => d.toISOString().split('T')[0];

/* ============================================================================
   MAIN COMPONENT
   ============================================================================ */
export default function PurchasesView({
  purchases,
  items,
  currentUser,
  onRecordPurchase,
  onDeletePurchase,
  fetchPurchases,
  loading = false,
  t,
  lang = 'en'
}: PurchasesViewProps) {

  /* --------------------------------------------------------------------------
     1. LOCAL COMPONENT STATE (DEFAULT: 7 DAYS)
     -------------------------------------------------------------------------- */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Default preset is 7d
  const [activePreset, setActivePreset] = useState<'7d' | '30d' | '3m' | 'month' | 'custom'>('7d');
  const [startDate, setStartDate] = useState(() => {
    const past = new Date();
    past.setDate(past.getDate() - 7);
    return formatDate(past);
  });
  const [endDate, setEndDate] = useState(() => formatDate(new Date()));

  const [taxFilter, setTaxFilter] = useState<'all' | 'vat' | 'withholding'>('all');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(() => {
    try {
      const savedSize = localStorage.getItem(LOCAL_STORAGE_PAGE_SIZE_KEY);
      return savedSize ? parseInt(savedSize, 10) : 10;
    } catch {
      return 10;
    }
  });

  /* --------------------------------------------------------------------------
     2. DERIVED USER / SHOP ATTRIBUTES
     -------------------------------------------------------------------------- */
  const resolvedShopId = currentUser?.shop_id || currentUser?.shopId || '';
  const hasNoShop = !resolvedShopId && currentUser?.role !== 'super_admin';
  const isInitialMount = useRef(true);

  /* --------------------------------------------------------------------------
     3. EVENT HANDLERS & HELPERS
     -------------------------------------------------------------------------- */
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    try {
      localStorage.setItem(LOCAL_STORAGE_PAGE_SIZE_KEY, String(newSize));
    } catch (e) {
      console.warn("Could not save pageSize to localStorage", e);
    }
  };

  const handleApplyPreset = (preset: '7d' | '30d' | '3m' | 'month') => {
    setActivePreset(preset);
    const today = new Date();

    if (preset === '7d') {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      setStartDate(formatDate(past));
      setEndDate(formatDate(today));
    } else if (preset === '30d') {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      setStartDate(formatDate(past));
      setEndDate(formatDate(today));
    } else if (preset === '3m') {
      const past = new Date();
      past.setMonth(today.getMonth() - 3);
      setStartDate(formatDate(past));
      setEndDate(formatDate(today));
    } else if (preset === 'month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDate(startOfMonth));
      setEndDate(formatDate(today));
    }
  };

  const handleResetFilters = () => {
    handleApplyPreset('7d');
    setTaxFilter('all');
    setCurrentPage(1);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId || !onDeletePurchase) return;

    const idToProcess = pendingDeleteId;
    setPendingDeleteId(null);
    setDeletingId(idToProcess);

    try {
      await onDeletePurchase(idToProcess);
    } finally {
      setDeletingId(null);
    }
  };

  const exportToCSV = () => {
    if (filteredReceipts.length === 0) return;

   const headers = [
      t.receiptId,                            
      t.date,                                 
      t.vendor,                               
      t.itemName,
      t.invoiceRef,                          
      t.itemsCount,                           
      `${t.subtotal} (${t.currency})`,        
      `${t.vat15} (${t.currency})`,           
      `${t.withholding3} (${t.currency})`,    
      `${t.totalSpendLabel} (${t.currency})`, 
    ];
    
    const rows = filteredReceipts.map(r => [
      `"${String(r.id).replace(/"/g, '""')}"`,
      `"${r.purchase_date}"`,
      `"${String(r.vendor_name).replace(/"/g, '""')}"`,
      `"${r.items.map(itemR => String(itemR.item_name).replace(/"/g, '""')).join('; ')}"`,
      `"${String(r.invoice_ref || 'N/A').replace(/"/g, '""')}"`,
      r.items.length,
      r.subtotal.toFixed(2),
      r.vat_amount.toFixed(2),
      r.withholding_amount.toFixed(2),
      r.total_amount.toFixed(2)
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Purchases_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* --------------------------------------------------------------------------
     4. SIDE EFFECTS (DATA FETCHING)
     -------------------------------------------------------------------------- */
  useEffect(() => {
    if (resolvedShopId && fetchPurchases) {
      fetchPurchases({ 
        shopId: resolvedShopId, 
        startDate, 
        endDate, 
        limit: 100 
      });
    }
  }, [resolvedShopId, fetchPurchases]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!resolvedShopId || !fetchPurchases) return;

    if (startDate && endDate) {
      setCurrentPage(1);
      fetchPurchases({
        shopId: resolvedShopId,
        startDate,
        endDate,
        limit: 100
      });
    }
  }, [startDate, endDate, resolvedShopId, fetchPurchases]);

  useEffect(() => {
    setCurrentPage(1);
  }, [taxFilter]);

  /* --------------------------------------------------------------------------
     5. MEMOIZED DATA COMPUTATIONS
     -------------------------------------------------------------------------- */
  const groupedReceipts = useMemo(() => {
    const receiptMap = new Map<string, any>();

    (purchases || []).forEach((pur: any) => {
      const receiptId = pur.id;

      if (!receiptMap.has(receiptId)) {
        receiptMap.set(receiptId, {
          id: receiptId,
          vendor_name: pur.supplier_name || pur.vendor_name || 'Direct Restock',
          purchase_date: pur.purchase_date,
          invoice_ref: pur.invoice_ref,
          payment_status: pur.payment_status || 'paid',
          subtotal: Number(pur.subtotal || 0),
          vat_amount: Number(pur.vat_amount || 0),
          withholding_amount: Number(pur.withholding_amount || 0),
          total_amount: Number(pur.total_amount || pur.total_cost || 0),
          is_vat_applied: Boolean(pur.is_vat_applied || Number(pur.vat_amount) > 0),
          is_withholding_applied: Boolean(pur.is_withholding_applied || Number(pur.withholding_amount) > 0),
          items: []
        });
      }

      const receipt = receiptMap.get(receiptId);

      if (pur.item_name && pur.item_name !== 'No items') {
        receipt.items.push({
          id: pur.item_id || `${receiptId}_${receipt.items.length}`,
          item_name: pur.item_name,
          quantity: Number(pur.quantity || 1),
          unit_cost: Number(pur.cost_price || 0),
          total_cost: Number(pur.total_cost || 0),
          unit_of_measurement: pur.unit_of_measurement || 'Pcs'
        });
      }
    });

    return Array.from(receiptMap.values());
  }, [purchases]);

  const filteredReceipts = useMemo(() => {
    return groupedReceipts.filter((receipt) => {
      const matchesStartDate = !startDate || receipt.purchase_date >= startDate;
      const matchesEndDate = !endDate || receipt.purchase_date <= endDate;
      const matchesTax =
        taxFilter === 'all' ||
        (taxFilter === 'vat' && receipt.is_vat_applied) ||
        (taxFilter === 'withholding' && receipt.is_withholding_applied);

      return matchesStartDate && matchesEndDate && matchesTax;
    });
  }, [groupedReceipts, startDate, endDate, taxFilter]);

  const paginatedReceipts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredReceipts.slice(startIndex, startIndex + pageSize);
  }, [filteredReceipts, currentPage, pageSize]);

  const metrics = useMemo(() => {
    return filteredReceipts.reduce(
      (acc, r) => {
        acc.totalSpend += r.total_amount;
        acc.totalVat += r.vat_amount;
        acc.totalWithholding += r.withholding_amount;
        acc.count += 1;
        return acc;
      },
      { totalSpend: 0, totalVat: 0, totalWithholding: 0, count: 0 }
    );
  }, [filteredReceipts]);

  const hasActiveFilters = Boolean(
    activePreset !== '7d' || taxFilter !== 'all'
  );

  const printDateOnly = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  /* ============================================================================
     RENDER JSX
     ============================================================================ */
  return (
    <div 
      className="space-y-5 pb-2 text-slate-700 dark:text-slate-200 antialiased w-full p-0 m-0 print-container"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}
    >
      
      {/* PRINT MEDIA STYLESHEET */}
      <style>{`
        @media print {
          @page { margin: 0.6cm; size: auto; }
          body * { visibility: hidden !important; }
          .print-container, .print-container * { visibility: visible !important; }
          .print-container { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; background: #ffffff !important; color: #000000 !important; }
          .no-print, .print\\:hidden { display: none !important; }
          .print-header { display: block !important; border-bottom: 2px solid #000000 !important; padding-bottom: 8px !important; margin-bottom: 12px !important; }
          .print-card { break-inside: avoid !important; page-break-inside: avoid !important; border: 1px solid #cbd5e1 !important; box-shadow: none !important; margin-bottom: 8px !important; }
        }
      `}</style>

      {/* PRINT-ONLY HEADER */}
      <div className="hidden print-header text-black">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold uppercase text-slate-900">
              {t.purchaseReceiptSummary}
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              {t.logHeaderText}
            </p>
          </div>
          <div className="text-right text-xs">
            <p className="font-semibold text-slate-900">{t.dateReceipt}: {printDateOnly}</p>
            <p className="text-slate-600">{t.totalStatement} <strong>{filteredReceipts.length}</strong></p>
          </div>
        </div>
      </div>

      {/* PAGE TITLE & ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden no-print">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50 text-[#1a5fb4] dark:text-blue-400 shrink-0 shadow-sm">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t?.purchasesTitle }
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
              {t?.purchasesSubTitle}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          disabled={hasNoShop}
          title={hasNoShop ? t.noShopAssigned : ""}
          className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm sm:w-auto w-full ${
            hasNoShop 
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10'
          }`}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{t?.newPurchase}</span>
        </button>
      </div>

      {/* UNCONTAINED PRESETS TOOLBAR (BELOW NEW PURCHASE BUTTON) */}
      <div className="flex items-center gap-1.5 pt-1 overflow-x-auto print:hidden no-print">
        <button
          onClick={() => handleApplyPreset('7d')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activePreset === '7d'
              ? 'bg-blue-600 text-white shadow-sm font-semibold'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t.weeklyLabel}
        </button>
        <button
          onClick={() => handleApplyPreset('30d')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activePreset === '30d'
              ? 'bg-blue-600 text-white shadow-sm font-semibold'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t.mon30DaysLabel}
        </button>
        <button
          onClick={() => handleApplyPreset('3m')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activePreset === '3m'
              ? 'bg-blue-600 text-white shadow-sm font-semibold'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t.mon3Label}
        </button>
        <button
          onClick={() => handleApplyPreset('month')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activePreset === 'month'
              ? 'bg-blue-600 text-white shadow-sm font-semibold'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t.monthlyLabel}
        </button>
      </div>

      {/* SYSTEM ALERTS */}
      {hasNoShop && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-medium print:hidden no-print">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Your account is not assigned to a shop. Please contact an admin to enable purchasing.</span>
        </div>
      )}

      {/* CONTAINED FILTER CONTROLS & DATE PICKERS */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 print:hidden no-print">
        
        {/* Upper Toolbar: Date Pickers & Tax Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Custom Date Range Container */}
            <div className="flex items-center gap-1.5 p-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-slate-400 font-medium px-0.5">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tax Criteria Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={taxFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTaxFilter(e.target.value as 'all' | 'vat' | 'withholding')}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">{t.taxAllLabel}</option>
              <option value="vat">{t.vatLabel}</option>
              <option value="withholding">{t.withholdingLabel}</option>
            </select>
          </div>
        </div>

        {/* Lower Toolbar: Text count left-aligned to CSV/Print buttons */}
        <div className="flex flex-row items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="leading-none"><strong className="text-slate-900 dark:text-white">{t.showingReceipts(filteredReceipts.length)}</strong></span>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />}
          </div>

          <div className="flex items-center justify-end gap-2 shrink-0">
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center justify-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors rounded-lg"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

            <button
              onClick={exportToCSV}
              disabled={filteredReceipts.length === 0}
              className="flex items-center justify-center gap-1.5 h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50 shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              disabled={filteredReceipts.length === 0}
              className="flex items-center justify-center gap-1.5 h-8 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* DYNAMIC KPI STAT CARDS */}
      <div className="grid grid-cols-3 gap-2 print:hidden no-print">
        {/* Total Spend */}
        <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm min-w-0">
          <span className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 block truncate">
            Total Spend
          </span>
          <span className="text-xs sm:text-base font-bold text-slate-900 dark:text-white block truncate mt-0.5">
            {metrics.totalSpend.toFixed(2)} <span className="text-[10px] font-semibold text-slate-500">{t.currency}</span>
          </span>
        </div>

        {/* Claimable VAT */}
        <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm min-w-0">
          <span className="text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400 block truncate">
            Claimable VAT
          </span>
          <span className="text-xs sm:text-base font-bold text-emerald-600 dark:text-emerald-400 block truncate mt-0.5">
            +{metrics.totalVat.toFixed(2)} <span className="text-[10px] font-semibold">{t.currency}</span>
          </span>
        </div>

        {/* Retained WT */}
        <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm min-w-0">
          <span className="text-[10px] sm:text-xs font-medium text-amber-600 dark:text-amber-400 block truncate">
            Retained WT
          </span>
          <span className="text-xs sm:text-base font-bold text-amber-600 dark:text-amber-400 block truncate mt-0.5">
            -{metrics.totalWithholding.toFixed(2)} <span className="text-[10px] font-semibold">{t.currency}</span>
          </span>
        </div>
      </div>

      {/* PURCHASE RECEIPTS CARDS LIST */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-500 gap-2 font-medium text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            Fetching receipts from database...
          </div>
        ) : paginatedReceipts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 print:hidden no-print">
            <Receipt className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {hasActiveFilters ? "No receipts found matching your criteria." : "No purchase receipts recorded yet."}
            </p>
          </div>
        ) : (
          paginatedReceipts.map((receipt: any) => {
            const isDeleting = deletingId === receipt.id;
            const subtotal = receipt.subtotal || receipt.total_amount;

            return (
              <div
                key={receipt.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2.5 shadow-sm print-card"
              >
                {/* CARD HEADER */}
                <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-2 gap-2">
                  {/* Left Side: Name + Badges */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                        {receipt.vendor_name}
                      </span>
                      
                      {receipt.is_vat_applied && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                          +VAT 15%
                        </span>
                      )}
                      {receipt.is_withholding_applied && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shrink-0">
                          -WT 2%
                        </span>
                      )}
                    </div>

                    {receipt.invoice_ref && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono block">
                        Ref: #{receipt.invoice_ref}
                      </span>
                    )}
                  </div>

                  {/* Right Side: Total Price, Date & Delete */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span className="font-bold text-sm text-blue-600 dark:text-blue-400 whitespace-nowrap block">
                        {receipt.total_amount.toFixed(2)} <span className="text-xs font-semibold">{t.currency}</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal flex items-center justify-end gap-1 mt-0.5 whitespace-nowrap">
                        <Calendar className="w-3 h-3 print:hidden no-print shrink-0" />
                        {receipt.purchase_date}
                      </span>
                    </div>

                    {onDeletePurchase && (
                      <button
                        onClick={() => setPendingDeleteId(receipt.id)}
                        disabled={isDeleting}
                        title="Delete receipt"
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors disabled:opacity-50 print:hidden no-print shrink-0"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* LINE ITEMS */}
                <div className="space-y-1.5 py-0.5">
                  {receipt.items.length > 0 ? (
                    receipt.items.map((item: any, idx: number) => (
                      <div
                        key={item.id || idx}
                        className="flex items-start justify-between text-xs text-slate-700 dark:text-slate-300"
                      >
                        <div className="space-y-0.5 min-w-0 pr-2">
                          <span className="font-medium text-slate-900 dark:text-white block truncate">
                            {item.item_name}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                            {item.quantity} {item.unit_of_measurement} × {item.unit_cost.toFixed(2)} {t.currency}
                          </span>
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white shrink-0">
                          {item.total_cost.toFixed(2)} {t.currency}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 italic py-0.5">
                      Restock summary logged without detailed line items.
                    </div>
                  )}
                </div>

                {/* CARD FOOTER */}
                {(receipt.is_vat_applied || receipt.is_withholding_applied || receipt.subtotal > 0) && (
                  <div className="pt-2 text-[11px] font-medium text-slate-600 dark:text-slate-400 flex items-center justify-between gap-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="whitespace-nowrap">
                      Subtotal: <strong className="font-semibold text-slate-900 dark:text-white">{subtotal.toFixed(2)} {t.currency}</strong>
                    </span>

                    <div className="flex items-center gap-2 whitespace-nowrap text-[10px] sm:text-[11px]">
                      {receipt.is_vat_applied && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          +VAT: {receipt.vat_amount.toFixed(2)}
                        </span>
                      )}
                      {receipt.is_withholding_applied && (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                          -WT: {receipt.withholding_amount.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* PAGINATION CONTROLS */}
      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={filteredReceipts.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={[5, 10, 20, 50, 100]}
      />

      {/* MODALS */}
      <RecordPurchaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        items={items as any}
        onSavePurchase={async (formData) => {
          await onRecordPurchase({
            ...formData,
            shopId: resolvedShopId,
            shop_id: resolvedShopId,
            userId: currentUser.id,
            user_id: currentUser.id,
          });
          setIsModalOpen(false);
        }}
        t={t}
      />

      <DeleteConfirmModal
        isOpen={Boolean(pendingDeleteId)}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={confirmDelete}
        t={t}
        lang={lang}
      />
    </div>
  );
}