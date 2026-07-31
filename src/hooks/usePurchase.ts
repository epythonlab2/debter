// src/hooks/usePurchase.ts

import { useState, useCallback } from 'react';
import { dbService } from '../core/services/dbService';
import { PurchaseRecord, PurchaseItemLine } from '../types';

export interface ExtendedPurchaseItemLine extends PurchaseItemLine {
  unitOfMeasurement?: string;
  totalCost: number;
}

export interface CreatePurchaseInvoicePayload {
  shopId: string;
  userId?: string;
  vendorName?: string;
  subtotal: number;
  vatAmount: number;
  withholdingAmount: number;
  totalAmount: number;
  isVatApplied: boolean;
  isWithholdingApplied: boolean;
  items: ExtendedPurchaseItemLine[];
}

export interface FetchPurchasesParams {
  shopId: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface UsePurchaseOptions {
  currentUser?: {
    id: string;
    shop_id?: string | null;
    shopId?: string | null;
    role?: string;
  } | null;
  selectedShopFilter?: string;
  syncCloudDatabases?: () => Promise<void>;
  triggerToast: (msg: string, type?: 'success' | 'error') => void;
  t?: any;
}

export function usePurchase(options?: UsePurchaseOptions) {
  const { syncCloudDatabases, triggerToast, t } = options || {};

  // 🟢 1. Initialize state directly from localStorage cache
  const [purchases, setPurchases] = useState<PurchaseRecord[]>(() => {
    if (typeof window === 'undefined') return [];
    const cached = localStorage.getItem('debter_v1_purchases');
    return cached ? JSON.parse(cached) : [];
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to sync memory state with localStorage
  const updatePurchasesState = (data: PurchaseRecord[]) => {
    setPurchases(data);
    localStorage.setItem('debter_v1_purchases', JSON.stringify(data));
  };

  // 🟢 2. Fetch Purchases with date filtering and initial limit (default 100)
  const fetchPurchases = useCallback(
    async (params: string | FetchPurchasesParams) => {
      // Allow passing either a shopId string directly or a FetchPurchasesParams object
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

  // 🟢 3. Record Multi-Line Purchase Invoice Header + Items
  const recordPurchase = async (payload: CreatePurchaseInvoicePayload) => {
    if (!payload.items || payload.items.length === 0) {
      const msg = t?.noItemsError || 'No items in purchase invoice.';
      if (triggerToast) triggerToast(msg, 'error');
      return { success: false, error: msg };
    }

    setIsPurchasing(true);
    setError(null);

    try {
      // Send single payload with header taxes and items array to dbService
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

      await fetchPurchases(payload.shopId);
      if (syncCloudDatabases) await syncCloudDatabases();
      if (triggerToast) triggerToast(t?.purchaseRecorded || 'Purchase invoice recorded successfully', 'success');

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

  // 🟢 4. Delete Single Purchase Record
  const deletePurchase = async (purchaseId: string, shop_id?: string) => {
    setError(null);
    try {
      await dbService.deletePurchase(purchaseId);

      // Optimistically clean local storage & memory state
      const updated = purchases.filter((p) => p.id !== purchaseId);
      updatePurchasesState(updated);

      if (shop_id) await fetchPurchases(shop_id);
      if (syncCloudDatabases) await syncCloudDatabases();
      if (triggerToast) triggerToast(t?.purchaseDeleted || 'Purchase record deleted', 'success');

      return { success: true };
    } catch (err: any) {
      console.error('Failed to delete purchase:', err);
      const msg = err?.message || 'Failed to delete purchase.';
      setError(msg);
      if (triggerToast) triggerToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

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