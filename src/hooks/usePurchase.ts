// src/hooks/usePurchase.ts

import { useState, useCallback } from 'react';
import { dbService } from '../core/services/dbService';
import { PurchaseRecord, PurchaseItemLine } from '../types';

/** LocalStorage key for persisting cached purchases across page refreshes */
const PURCHASES_CACHE_KEY = 'debter_v1_purchases';

// ============================================================================
// TYPE DEFINITIONS & CONTRACTS
// ============================================================================

/**
 * Extended purchase line item incorporating measurement units and explicit total costs.
 */
export interface ExtendedPurchaseItemLine extends PurchaseItemLine {
  /** Optional unit of measurement (e.g., 'kg', 'pcs', 'box') */
  unitOfMeasurement?: string;
  /** Total calculated cost for this item line (quantity * unit cost) */
  totalCost: number;
}

/**
 * Payload required to record a multi-line purchase invoice header and its nested items.
 */
export interface CreatePurchaseInvoicePayload {
  /** Tenant / Shop identifier */
  shopId: string;
  /** Optional user identifier recording the transaction */
  userId?: string;
  /** Supplier / Vendor entity name */
  vendorName?: string;
  /** Net invoice total before tax additions */
  subtotal: number;
  /** Total computed Value Added Tax (VAT) */
  vatAmount: number;
  /** Total computed Withholding Tax */
  withholdingAmount: number;
  /** Final gross payable amount including applicable taxes */
  totalAmount: number;
  /** Flag indicating whether VAT calculation rules were applied */
  isVatApplied: boolean;
  /** Flag indicating whether withholding tax deduction was applied */
  isWithholdingApplied: boolean;
  /** Array of line items attached to this purchase invoice */
  items: ExtendedPurchaseItemLine[];
}

/**
 * Query parameters for fetching purchase invoices from remote DB or cache.
 */
export interface FetchPurchasesParams {
  /** Target shop ID */
  shopId: string;
  /** ISO date filter boundary start */
  startDate?: string;
  /** ISO date filter boundary end */
  endDate?: string;
  /** Pagination limit (defaults to 100) */
  limit?: number;
}

/**
 * Injection options provided to the {@link usePurchase} hook.
 */
export interface UsePurchaseOptions {
  /** Authenticated user context and assigned shop parameters */
  currentUser?: {
    id: string;
    shop_id?: string | null;
    shopId?: string | null;
    role?: string;
  } | null;
  /** Optional shop override filter parameter */
  selectedShopFilter?: string;
  /** Optional async sync handler to push updates to secondary/cloud databases */
  syncCloudDatabases?: () => Promise<void>;
  /** Toast alert notification dispatch callback */
  triggerToast: (msg: string, type?: 'success' | 'error') => void;
  /** Localization dictionary reference */
  t?: any;
}

// ============================================================================
// CUSTOM HOOK IMPLEMENTATION
// ============================================================================

/**
 * Custom React hook managing purchase orders and receipt ledger state.
 * Handles persistence layer caching, remote synchronization, invoice creation,
 * and deletion operations.
 *
 * @param options - Configuration options and side-effect handlers (toasts, cloud sync, localization)
 */
export function usePurchase(options?: UsePurchaseOptions) {
  const { syncCloudDatabases, triggerToast, t } = options || {};

  // --------------------------------------------------------------------------
  // STATE MANAGEMENT & LOCAL STORAGE CACHING
  // --------------------------------------------------------------------------

  /** Purchase records state initialized synchronously from LocalStorage */
  const [purchases, setPurchases] = useState<PurchaseRecord[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const cached = localStorage.getItem(PURCHASES_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      console.warn('Failed to read purchases cache from LocalStorage:', e);
      return [];
    }
  });

  /** Loading state flag for read queries */
  const [loading, setLoading] = useState<boolean>(false);

  /** Processing state flag for write/mutation requests */
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);

  /** Active operational error message container */
  const [error, setError] = useState<string | null>(null);

  /**
   * Helper function to atomically update React state and LocalStorage cache.
   * Ensures UI reactivity and client-side data persistence remain synchronized.
   */
  const updatePurchasesState = (data: PurchaseRecord[]) => {
    setPurchases(data);
    try {
      localStorage.setItem(PURCHASES_CACHE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save purchases state to LocalStorage:', e);
    }
  };

  // --------------------------------------------------------------------------
  // READ OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Fetches purchase invoices filtered by date boundaries and tenant/shop parameters.
   * Accepts either a raw shop ID string or a structured {@link FetchPurchasesParams} object.
   */
  const fetchPurchases = useCallback(
    async (params: string | FetchPurchasesParams) => {
      // Normalize parameter input format
      const optionsObj: FetchPurchasesParams =
        typeof params === 'string' ? { shopId: params, limit: 100 } : { limit: 100, ...params };

      if (!optionsObj.shopId) return;

      setLoading(true);
      setError(null);
      try {
        const data = await dbService.fetchPurchases(optionsObj);
        const fetchedList = data || [];
        updatePurchasesState(fetchedList);
      } catch (err: any) {
        console.error('Failed to load purchases:', err);
        const msg = err?.message || 'Failed to load purchase records.';
        setError(msg);
        if (triggerToast) triggerToast(msg, 'error');
      } finally {
        setLoading(false);
      }
    },
    [triggerToast]
  );

  // --------------------------------------------------------------------------
  // WRITE & MUTATION OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Persists a new purchase invoice header with associated line items to the database,
   * updates local cache, and triggers background cloud synchronizations.
   *
   * @param payload - Structured invoice details and nested array of purchased items
   * @returns Resolution status object indicating execution outcome
   */
  const recordPurchase = async (payload: CreatePurchaseInvoicePayload) => {
    // Validate line items presence prior to dispatching DB request
    if (!payload.items || payload.items.length === 0) {
      const msg = t?.noItemsError || 'No items in purchase invoice.';
      if (triggerToast) triggerToast(msg, 'error');
      return { success: false, error: msg };
    }

    setIsPurchasing(true);
    setError(null);

    try {
      // Map domain payload into target DB schema contract
      await dbService.insertPurchase({
        shop_id: payload.shopId,
        recorded_by: payload.userId || null,
        vendor_name: payload.vendorName || 'Direct Vendor',
        subtotal: payload.subtotal,
        vat_amount: payload.vatAmount,
        withholding_amount: payload.withholdingAmount,
        total_amount: payload.totalAmount,
        is_vat_applied: payload.isVatApplied,
        is_withholding_applied: payload.isWithholdingApplied,
        items: payload.items.map((item) => ({
          item_id: item.itemId,
          quantity: item.quantity,
          unit_cost: item.unitCost,
          total_cost: item.totalCost || item.quantity * item.unitCost,
          unit_of_measurement: item.unitOfMeasurement || 'Pcs',
        })),
      });

      // Refetch records & execute secondary sync side-effects
      await fetchPurchases(payload.shopId);
      if (syncCloudDatabases) await syncCloudDatabases();
      if (triggerToast) triggerToast(t?.purchaseRecorded, 'success');

      return { success: true };
    } catch (err: any) {
      console.error('Failed to record purchase:', err);
      const msg = err?.message || 'Failed to record purchase.';
      setError(msg);
      if (triggerToast) triggerToast(msg, 'error');
      return { success: false, error: msg };
    } finally {
      setIsPurchasing(false);
    }
  };

  /**
   * Deletes a purchase record by ID and updates local state using optimistic cleanup strategies.
   *
   * @param purchaseId - Unique identifier of the purchase record to purge
   * @param shop_id - Optional shop ID context to trigger remote re-fetching
   * @returns Resolution status object indicating execution outcome
   */
  const deletePurchase = async (purchaseId: string, shop_id?: string) => {
    setError(null);
    try {
      await dbService.deletePurchase(purchaseId);

      // Optimistic cache update: update UI state before full network sync resolves
      const updated = purchases.filter((p) => p.id !== purchaseId);
      updatePurchasesState(updated);

      if (shop_id) await fetchPurchases(shop_id);
      if (syncCloudDatabases) await syncCloudDatabases();
      if (triggerToast) triggerToast(t?.purchaseDeleted, 'success');

      return { success: true };
    } catch (err: any) {
      console.error('Failed to delete purchase:', err);
      const msg = err?.message || 'Failed to delete purchase.';
      setError(msg);
      if (triggerToast) triggerToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  // --------------------------------------------------------------------------
  // HOOK INTERFACE EXPORTS
  // --------------------------------------------------------------------------

  return {
    purchases,
    loading,
    isPurchasing,
    error,
    fetchPurchases,
    recordPurchase,
    deletePurchase,
  };
}