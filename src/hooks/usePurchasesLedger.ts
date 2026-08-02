// src/hooks/usePurchasesLedger.ts
import { useState, useMemo, useEffect } from 'react';
import { formatDate } from '../utils/formatters';
import { PurchaseReceipt } from '../types/payLoad'; // Import your PurchaseReceipt type

/** LocalStorage key for persisting the user's preferred pagination size across sessions */
const LOCAL_STORAGE_PAGE_SIZE_KEY = 'purchasesPageSize';

/** Preset date range filters supported by the hook */
export type DatePreset = '7d' | '30d' | '3m' | 'month' | 'custom';

/** Tax category filters for tax audit and categorization views */
export type TaxFilterType = 'all' | 'vat' | 'withholding';

/**
 * Represents an individual line-item within a purchase receipt.
 */
export interface PurchaseItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  unit_of_measurement: string;
}

/**
 * Represents a normalized, aggregated purchase receipt along with its nested line-items.
 */
export interface GroupedReceipt {
  id: string;
  vendor_name: string;
  purchase_date: string;
  invoice_ref?: string | null;
  payment_status: string;
  subtotal: number;
  vat_amount: number;
  withholding_amount: number;
  total_amount: number;
  is_vat_applied: boolean;
  is_withholding_applied: boolean;
  items: PurchaseItem[];
}

/**
 * Aggregated metric totals calculated across all currently filtered receipts.
 */
export interface PurchaseMetrics {
  totalSpend: number;
  totalVat: number;
  totalWithholding: number;
  count: number;
}

/**
 * Custom React hook for managing purchase ledger state, server sync, client-side 
 * normalization, multi-dimensional filtering, pagination, and financial metrics.
 *
 * @param purchases - Raw purchase dataset retrieved from the backend/store.
 * @param resolvedShopId - The active shop/tenant context identifier.
 * @param fetchPurchases - Optional async function to trigger remote data sync on filter change.
 */
export function usePurchasesLedger(
  purchases: PurchaseReceipt[] | any[],
  resolvedShopId: string,
  fetchPurchases?: (params: { shopId: string; startDate: string; endDate: string; limit: number }) => Promise<void>
) {
  // ============================================================================
  // 1. FILTER & DATE STATE
  // ============================================================================

  /** Tracks the current active date range preset selection */
  const [activePreset, setActivePreset] = useState<DatePreset>('7d');

  /** Start boundary date string (defaults to 7 days ago) */
  const [startDate, setStartDate] = useState<string>(() => {
    const past = new Date();
    past.setDate(past.getDate() - 7);
    return formatDate(past);
  });

  /** End boundary date string (defaults to current date) */
  const [endDate, setEndDate] = useState<string>(() => formatDate(new Date()));

  /** Active tax filter criteria */
  const [taxFilter, setTaxFilter] = useState<TaxFilterType>('all');

  // ============================================================================
  // 2. PAGINATION STATE
  // ============================================================================

  /** Current page index for client-side pagination (1-based index) */
  const [currentPage, setCurrentPage] = useState<number>(1);

  /** Number of items displayed per page, initialized from LocalStorage */
  const [pageSize, setPageSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PAGE_SIZE_KEY);
      return saved ? parseInt(saved, 10) : 10;
    } catch {
      // Fallback in case LocalStorage access is blocked or restricted
      return 10;
    }
  });

  // ============================================================================
  // 3. SIDE EFFECTS & SYNCHRONIZATION
  // ============================================================================

  /**
   * Fetches remote purchase data whenever the tenant context or primary date scope changes.
   */
  useEffect(() => {
    if (resolvedShopId && fetchPurchases && startDate && endDate) {
      fetchPurchases({
        shopId: resolvedShopId,
        startDate,
        endDate,
        limit: 100
      });
    }
  }, [resolvedShopId, startDate, endDate, fetchPurchases]);

  /**
   * Resets pagination back to the first page when filter criteria change
   * to avoid displaying out-of-range empty pages.
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [taxFilter, startDate, endDate]);

  // ============================================================================
  // 4. FILTER HANDLERS & CALLBACKS
  // ============================================================================

  /** Custom Date Change Wrappers */
  const handleStartDateChange = (dateStr: string) => {
    setStartDate(dateStr);
    setActivePreset('custom');
  };

  const handleEndDateChange = (dateStr: string) => {
    setEndDate(dateStr);
    setActivePreset('custom');
  };

  /**
   * Updates page size state and persists preference to LocalStorage.
   */
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    try {
      localStorage.setItem(LOCAL_STORAGE_PAGE_SIZE_KEY, String(newSize));
    } catch (e) {
      console.warn("Could not persist page size preference to LocalStorage:", e);
    }
  };

  /**
   * Applies pre-calculated date ranges (e.g., 7 days, 30 days, 3 months, current month).
   */
  const handleApplyPreset = (preset: Exclude<DatePreset, 'custom'>) => {
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

  /**
   * Resets all filters back to default initial state.
   */
  const handleResetFilters = () => {
    handleApplyPreset('7d');
    setTaxFilter('all');
    setCurrentPage(1);
  };

  // ============================================================================
  // 5. DATA TRANSFORMATIONS & DERIVED METRICS
  // ============================================================================

  /**
   * Normalizes denormalized/flat purchase rows from backend API response into 
   * grouped receipt objects with embedded items array.
   */
  const groupedReceipts = useMemo<GroupedReceipt[]>(() => {
    const receiptMap = new Map<string, GroupedReceipt>();

    (purchases || []).forEach((pur: PurchaseReceipt) => {
      const receiptId = String(pur.id);

      if (!receiptMap.has(receiptId)) {
        receiptMap.set(receiptId, {
          id: receiptId,
          vendor_name: pur.supplier_name || 'Direct Restock',
          purchase_date: pur.purchase_date,
          invoice_ref: pur.invoice_ref || null,
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

      const receipt = receiptMap.get(receiptId)!;

      // Filter out placeholders or missing items
      if (pur.item_name && pur.item_name !== 'No items') {
        const itemId = pur.item_id || `${receiptId}_${receipt.items.length}`;
        
        // Prevent duplicate items if raw rows contain duplicated IDs
        const existingItemIndex = receipt.items.findIndex(i => i.id === itemId);
        if (existingItemIndex === -1) {
          receipt.items.push({
            id: itemId,
            item_name: pur.item_name,
            quantity: Number(pur.quantity || 1),
            unit_cost: Number(pur.cost_price || 0),
            total_cost: Number(pur.total_cost || 0),
            unit_of_measurement: pur.unit_of_measurement || 'Pcs'
          });
        }
      }
    });

    return Array.from(receiptMap.values());
  }, [purchases]);

  /**
   * Filters normalized receipts based on active date range and tax requirements.
   */
  const filteredReceipts = useMemo<GroupedReceipt[]>(() => {
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

  /**
   * Slices filtered receipts based on current page index and page size window.
   */
  const paginatedReceipts = useMemo<GroupedReceipt[]>(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredReceipts.slice(startIndex, startIndex + pageSize);
  }, [filteredReceipts, currentPage, pageSize]);

  /**
   * Computes financial summaries (total spend, total VAT, withholding total, total count)
   * across all current filtered receipts.
   */
  const metrics = useMemo<PurchaseMetrics>(() => {
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

  // ============================================================================
  // 6. PUBLIC INTERFACE
  // ============================================================================

  return {
    activePreset,
    startDate,
    endDate,
    setStartDate: handleStartDateChange,
    setEndDate: handleEndDateChange,
    setActivePreset,
    taxFilter,
    setTaxFilter,
    currentPage,
    setCurrentPage,
    pageSize,
    handlePageSizeChange,
    handleApplyPreset,
    handleResetFilters,
    filteredReceipts,
    paginatedReceipts,
    metrics,
    /** Helper flag indicating if any filter deviates from the default configuration */
    hasActiveFilters: Boolean(activePreset !== '7d' || taxFilter !== 'all')
  };
}