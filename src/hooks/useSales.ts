// src/hooks/useSales.ts
import { useState } from 'react';
import { dbService } from '../core/services/dbService';
import { UseSalesProps, UseSalesReturn } from '../types/sales';

/**
 * Custom React hook that handles retail point-of-sale (POS) interactions.
 * Bridges state bindings for data-entry forms with transactional write routines
 * across inventory items, ad-hoc custom sales, and credit tracking (Dube records).
 *
 * @param props - Configuration properties containing context states, master data records, and cloud sync callbacks.
 * @param props.currentUser - The active user profile context executing sales operations.
 * @param props.items - Standardized catalog of items/SKUs currently loaded into local state caches.
 * @param props.sales - Master dataset tracking historically recorded sales operations.
 * @param props.dubeRecords - Master dataset tracking credit/outstanding line-of-credit metrics.
 * @param props.selectedShopFilter - active organizational store scope filter or 'all'.
 * @param props.syncCloudDatabases - Async handler to pull fresh data states following local database changes.
 * @param props.triggerToast - Global layout notification pipeline callback.
 * @param props.t - Strongly-typed translation string mapping dictionary objects.
 * * @returns An object containing reactive input form state variables, explicit state-mutators, and execution callbacks.
 */
export function useSales({
  currentUser,
  items,
  sales,
  dubeRecords,
  selectedShopFilter,
  syncCloudDatabases,
  triggerToast,
  t
}: UseSalesProps): UseSalesReturn {
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [salePrice, setSalePrice] = useState<string>('');
  // Standardized to string to match input fields & your hook's form state wrapper
  const [saleQty, setSaleQty] = useState<string>('1');
  const [customItemName, setCustomItemName] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [buyerName, setBuyerName] = useState<string>('');
  const [buyerPhone, setBuyerPhone] = useState<string>('');
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split('T')[0]);

  /**
   * Event wrapper logic handling local transaction records submission parsing.
   * Differentiates workflow logic between registered inventory SKU deductions and custom ad-hoc product logs,
   * dynamically handles alternative payment routes, and tracks multi-step credit payload models (Dube entries).
   *
   * @param e - The standard DOM React Form submit event thread context wrapper.
   * @returns A promise that resolves when the local insertions and remote cloud re-syncs conclude successfully.
   */
  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !currentUser.shop_id || currentUser.shop_id === 'all') {
      triggerToast(t.invalidShop, "error");
      return;
    }

    if (selectedItemId === 'custom' && !customItemName.trim()) {
      triggerToast(t.specifyItemName, "error");
      return;
    }

    let finalItemName = customItemName.trim();
    let activeItem = items.find(i => String(i.id) === String(selectedItemId));
    if (selectedItemId !== 'custom' && activeItem) {
      finalItemName = activeItem.item_name || '';
    }

    let dbPaymentMethod: 'cash' | 'transfer' | 'dube' = 'cash';
    if (paymentMethod === 'dube') dbPaymentMethod = 'dube';
    else if (['transfer', 'telebirr', 'bank'].includes(paymentMethod)) dbPaymentMethod = 'transfer';

    const formattedDbDate = saleDate.includes('T') ? saleDate.split('T')[0] : saleDate;
    const dubePayload = dbPaymentMethod === 'dube' ? { buyer_name: buyerName, buyer_phone: buyerPhone } : undefined;

    try {
      if (selectedItemId === 'custom') {
        await dbService.insertCustomSaleWithDube({
          item_name: finalItemName, quantity: Number(saleQty), price_sold: Number(salePrice),
          sale_date: formattedDbDate, shop_id: currentUser.shop_id, paymentMethod: dbPaymentMethod, recordedBy: currentUser.id
        }, dubePayload);
      } else {
        await dbService.insertSaleWithDube({
          item_id: selectedItemId, quantity: Number(saleQty), price_sold: Number(salePrice),
          sale_date: formattedDbDate, shop_id: currentUser.shop_id, paymentMethod: dbPaymentMethod, recordedBy: currentUser.id
        }, dubePayload);

        if (activeItem) {
          const updatedStock = Math.max(0, Number(activeItem.quantity || 0) - Number(saleQty || 1));
          await dbService.updateItemQuantity(String(activeItem.id), updatedStock);
        }
      }

      triggerToast(t.saleInventoryAdhoc, "success");
      setSelectedItemId(''); setSalePrice(''); setSaleQty('1'); setCustomItemName(''); setBuyerName(''); setBuyerPhone('');
      await syncCloudDatabases();
    } catch (err: any) {
      triggerToast(err.message, "error");
    }
  };

  /**
   * Action handler targeting credit components for debt settlement.
   * Resolves outstanding unpaid lines-of-credit balances inside local database systems.
   *
   * @param dubeId - The system identifier key tracking the record being processed (string UUID or incremental number integer).
   * @returns A promise that updates the credit ledger profile and pushes downstream structural data synchronization pipelines.
   */
  const handleSettleDube = async (dubeId: string | number) => {
    try {
      // FORCE CAST to string here to satisfy the dbService signature:
      await dbService.settleDubeDebt(String(dubeId));
      triggerToast(t.dubePaid, "success");
      await syncCloudDatabases();
    } catch (err: any) {
      triggerToast(err.message, "error");
    }
  };

  return {
    selectedItemId, setSelectedItemId, salePrice, setSalePrice, saleQty, setSaleQty,
    customItemName, setCustomItemName, paymentMethod, setPaymentMethod, buyerName, setBuyerName,
    buyerPhone, setBuyerPhone, saleDate, setSaleDate, handleRecordSale, handleSettleDube
  } as any;
}
