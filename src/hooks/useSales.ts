// src/hooks/useSales.ts
import { useState, useCallback } from 'react';
import { dbService } from '../core/services/dbService';
import { UseSalesProps, UseSalesReturn } from '../types/sales';
import { PaymentMethodType } from '../components/sales/RecordSaleTab';

/**
 * Custom React hook managing retail point-of-sale (POS) transactional mechanics.
 * Bridges responsive frontend data-entry states with robust local/remote database mutations,
 * handling physical inventory allocations, custom ad-hoc transactions, and credit tracking (Dube records).
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
  // =========================================================================
  // --- STATE CORE STACK ---
  // =========================================================================
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [salePrice, setSalePrice] = useState<string>('');
  const [saleQty, setSaleQty] = useState<number>(1);
  const [customItemName, setCustomItemName] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('cash');
  const [buyerName, setBuyerName] = useState<string>('');
  const [buyerPhone, setBuyerPhone] = useState<string>('');
  const [saleDate, setSaleDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // =========================================================================
  // --- TRANSACTION MUTATION PIPELINES ---
  // =========================================================================

  /**
   * Evaluates, validates, and records retail transaction entries.
   * Accommodates both standard UI submissions and offline payload sync operations.
   */
  const handleRecordSale = useCallback(async (e?: React.FormEvent, offlinePayload?: any) => {
    if (e) e.preventDefault();

    // Access Control Validation Guard
    if (!currentUser || !currentUser.shop_id || currentUser.shop_id === 'all') {
      triggerToast(t.invalidShop, "error");
      return;
    }

    // Extraction Strategy: Fall back systematically to internal state components if offline payload fields are missing
    let activeItemId = offlinePayload 
      ? (offlinePayload.selectedItemId || offlinePayload.item_id || (offlinePayload.item_name ? 'custom' : '')) 
      : selectedItemId;

    const activeSalePrice = offlinePayload 
      ? (offlinePayload.salePrice !== undefined ? offlinePayload.salePrice : offlinePayload.price_sold) 
      : salePrice;

    const activeSaleQty = offlinePayload 
      ? (offlinePayload.saleQty !== undefined ? offlinePayload.saleQty : offlinePayload.quantity) 
      : saleQty;

    const activeCustomItemName = offlinePayload ? (offlinePayload.customItemName || offlinePayload.item_name || '') : customItemName;
    const activePaymentMethod = offlinePayload ? (offlinePayload.paymentMethod || offlinePayload.payment_method) : paymentMethod;
    const activeBuyerName = offlinePayload ? (offlinePayload.buyerName || offlinePayload.buyer_name || '') : buyerName;
    const activeBuyerPhone = offlinePayload ? (offlinePayload.buyerPhone || offlinePayload.buyer_phone || '') : buyerPhone;
    const activeSaleDate = offlinePayload ? (offlinePayload.saleDate || offlinePayload.sale_date) : saleDate;

    // Structural Ad-hoc Constraints Validation
    if (activeItemId === 'custom' && !activeCustomItemName.trim()) {
      triggerToast(t.specifyItemName, "error");
      return;
    }

    let finalItemName = activeCustomItemName.trim();
    
    // 🌟 DYNAMIC OFFLINE DUPLICATE CONVERGENCE INTERCEPTOR
    // If it's labeled as custom but matches an item name already in our sync collection, transform it auto-selectively.
    let activeItem = items.find(i => String(i.id) === String(activeItemId));
    
    if (activeItemId === 'custom' && finalItemName) {
      const duplicateMatch = items.find(
        i => i.item_name?.trim().toLowerCase() === finalItemName.toLowerCase()
      );
      if (duplicateMatch) {
        activeItem = duplicateMatch;
        activeItemId = String(duplicateMatch.id);
        // Sync state back to the UI so the select elements automatically latch on visually
        if (!offlinePayload) {
          setSelectedItemId(String(duplicateMatch.id));
          setCustomItemName('');
        }
      }
    }

    if (activeItemId !== 'custom' && activeItem) {
      finalItemName = activeItem.item_name || '';
    }

    // Payment Schema Normalization Strategy
    let dbPaymentMethod: 'cash' | 'transfer' | 'dube' = 'cash';
    if (activePaymentMethod === 'dube') {
      dbPaymentMethod = 'dube';
    } else if (['transfer', 'telebirr', 'bank'].includes(String(activePaymentMethod).toLowerCase())) {
      dbPaymentMethod = 'transfer';
    }

    const formattedDbDate = activeSaleDate.includes('T') ? activeSaleDate.split('T')[0] : activeSaleDate;
    const dubePayload = dbPaymentMethod === 'dube' ? { buyer_name: activeBuyerName, buyer_phone: activeBuyerPhone } : undefined;

    // Sanitize numerical representations against IEEE-754 floating point drift anomalies
    const sanitizedPrice = Math.round(Number(activeSalePrice || 0) * 100) / 100;
    const sanitizedQty = Math.max(1, Number(activeSaleQty || 1));

    try {
      if (activeItemId === 'custom') {
        await dbService.insertCustomSaleWithDube({
          item_name: finalItemName, 
          quantity: sanitizedQty, 
          price_sold: sanitizedPrice,
          sale_date: formattedDbDate, 
          shop_id: currentUser.shop_id, 
          paymentMethod: dbPaymentMethod, 
          recordedBy: currentUser.id
        }, dubePayload);
      } else {
        // Process DB entry insertion and catalog inventory updates in parallel
        const mutationWorkers: Promise<any>[] = [
          dbService.insertSaleWithDube({
            item_id: activeItemId, 
            quantity: sanitizedQty, 
            price_sold: sanitizedPrice,
            sale_date: formattedDbDate, 
            shop_id: currentUser.shop_id, 
            paymentMethod: dbPaymentMethod, 
            recordedBy: currentUser.id
          }, dubePayload)
        ];

        if (activeItem) {
          const updatedStock = Math.max(0, Number(activeItem.quantity || 0) - sanitizedQty);
          mutationWorkers.push(dbService.updateItemQuantity(String(activeItem.id), updatedStock));
        }

        await Promise.all(mutationWorkers);
      }

      // Evict interactive form components exclusively when driving direct online interactions
      if (!offlinePayload) {
        triggerToast(t.saleInventoryAdhoc, "success");
        setSelectedItemId(''); 
        setSalePrice(''); 
        setSaleQty(1); 
        setCustomItemName(''); 
        setBuyerName(''); 
        setBuyerPhone('');

        // Trigger background reload asynchronously without awaiting.
        syncCloudDatabases().catch(err => console.error("Non-blocking background data-sync dropped:", err));
      }
    } catch (err: any) {
      triggerToast(err.message || "Failed to process sale mutation", "error");
      throw err; 
    }
  }, [currentUser, selectedItemId, salePrice, saleQty, customItemName, paymentMethod, buyerName, buyerPhone, saleDate, items, triggerToast, syncCloudDatabases, t]);

  /**
   * Resolves outstanding accounts receivable line records (Dube transactions).
   */
  const handleSettleDube = useCallback(async (dubeId: string | number) => {
    if (!dubeId) return;
    try {
      await dbService.settleDubeDebt(String(dubeId));
      triggerToast(t.dubePaid, "success");
      
      // Let settlement metrics sync in background
      syncCloudDatabases().catch(err => console.error("Non-blocking background sync failed:", err));
    } catch (err: any) {
      triggerToast(err.message || "Failed to settle credit balance", "error");
    }
  }, [syncCloudDatabases, triggerToast, t]);

  // =========================================================================
  // --- INTERFACE CONTRACT RETURN MAPS ---
  // =========================================================================
  return {
    selectedItemId, setSelectedItemId,
    salePrice, setSalePrice,
    saleQty, setSaleQty,
    customItemName, setCustomItemName,
    paymentMethod, setPaymentMethod,
    buyerName, setBuyerName,
    buyerPhone, setBuyerPhone,
    saleDate, setSaleDate,
    handleRecordSale,
    handleSettleDube
  } as any;
}
