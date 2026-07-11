// src/hooks/useSalesManagement.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import { dbService } from '../core/services/dbService';
import { Sale, DubeRecord, Shop, UserProfile, ToastState, Item } from '../types';
import { ItemRecord } from '../types/inventory';

import { useInventory } from './useInventory';
import { useSales } from './useSales';
import { useShop } from './useShop';
import { useLedgerSales } from './useLedgerSales'; 
import { useAnalytics, TimeFilterType } from './useAnalytics';
import { useAdmin } from './useAdmin'; 

import { 
  saveOfflineSale, 
  getOfflineSales, 
  removeOfflineSale, 
  CachedSalePayload,
} from '../core/services/offlineSalesDb';
import { PaymentMethodType } from '../components/sales/RecordSaleTab';

interface UseSalesManagementProps {
  lang: 'en' | 'am';
  t: any;
  currentUser: any;
  shops: Shop[];
  setShops: React.Dispatch<React.SetStateAction<Shop[]>>;
  items: ItemRecord[];
  setItems: React.Dispatch<React.SetStateAction<ItemRecord[]>>;
  dailyGoal: number;
}

/**
 * Orchestrates sales processing, analytical state configurations, custom state injections,
 * and resilient background offline-to-cloud transactional synchronizations.
 */
export function useSalesManagement(props: UseSalesManagementProps) {
  const { lang, t, currentUser, setShops, items, setItems, dailyGoal } = props;

  // =========================================================================
  // --- STATE CORE STACK ---
  // =========================================================================
  const [sales, setSales] = useState<Sale[]>([]);
  const [dubeRecords, setDubeRecords] = useState<DubeRecord[]>([]);
  const [offlineQueue, setOfflineQueue] = useState<CachedSalePayload[]>([]); 
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>(currentUser?.role === 'sales' ? 'entry' : 'dashboard');
  const [selectedShopFilter, setSelectedShopFilter] = useState<string>('all');
  const [shopQuery, setShopQuery] = useState<string>('');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('today');
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    type: 'item' | 'shop' | 'sale' | 'user' | null;
    targetId: string | null;
  }>({ isOpen: false, type: null, targetId: null });

  // Sync state trackers
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // =========================================================================
  // --- NOTIFICATION & OFFLINE DATA SYNC UTILITIES ---
  // =========================================================================
  const triggerToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ id: Date.now(), message, type });
  }, []);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  /**
   * Refreshes local component states against the IndexedDB storage layer.
   */
  const refreshOfflineQueueState = useCallback(async () => {
    try {
      const currentQueue = await getOfflineSales();
      setOfflineQueue(currentQueue || []);
    } catch (e) {
      console.error("Failed loading offline queue frames:", e);
    }
  }, []);

  // Sync online connection state listeners
  useEffect(() => {
    refreshOfflineQueueState();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshOfflineQueueState]);

  // =========================================================================
  // --- ROLE AND ACCESS LEVEL SANITIZATION ---
  // =========================================================================
  const normalizedShopFilter = useMemo(() => {
    return currentUser?.role === 'super_admin' ? selectedShopFilter : 'all';
  }, [currentUser?.role, selectedShopFilter]);

  // =========================================================================
  // --- REMOTE DATABASE ORCHESTRATION PIPELINES ---
  // =========================================================================
  const syncCloudDatabases = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const isSuperAdmin = currentUser.role === 'super_admin';
      const shopScope = isSuperAdmin 
        ? (selectedShopFilter === 'all' ? undefined : selectedShopFilter) 
        : (currentUser.shop_id || undefined);

      const [cloudShops, cloudItems, cloudSales, cloudDube] = await Promise.all([
        dbService.fetchShops(),
        dbService.fetchItems(shopScope),
        dbService.fetchSales(shopScope),
        dbService.fetchDubeRecords(shopScope)
      ]);

      setShops(cloudShops || []);
      setItems(cloudItems || []);
      setSales(cloudSales || []);
      setDubeRecords(cloudDube || []);

      if (isSuperAdmin || currentUser.role === 'admin') {
        await adminSlice.syncCohortsView();
      }
    } catch (err: any) {
      // Catch and filter captive portal conditions during default state polling loops
      const msg = String(err?.message || '').toLowerCase();
      if (msg.includes('failed to fetch') || err?.name === 'TypeError') {
        triggerToast(t.noInternet, "error");
      } else {
        triggerToast(err.message || "Failed syncing with remote server", "error");
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.role, currentUser?.shop_id, selectedShopFilter, setShops, setItems, triggerToast, lang]);

  useEffect(() => { 
    syncCloudDatabases(); 
  }, [syncCloudDatabases]);

  // =========================================================================
  // --- CHILD CORE SLICE MANAGEMENT INJECTIONS ---
  // =========================================================================
  const adminSlice = useAdmin({
    currentUser,
    selectedShopFilter,
    syncCloudDatabases, 
    triggerToast,
    t,
  });

  // =========================================================================
  // --- PERFORMANCE METRIC INVENTORY FILTER ENGINES ---
  // =========================================================================
  const filteredShops = useMemo(() => {
    const baseShops = props.shops || [];
    const sanitizedQuery = shopQuery.trim().toLowerCase();
    if (!sanitizedQuery) return baseShops;
    return baseShops.filter(shop => shop?.name?.toLowerCase().includes(sanitizedQuery));
  }, [props.shops, shopQuery]);

  const filteredSalesForMetrics = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'sales') {
      const currentUserIdStr = String(currentUser.id);
      return sales.filter(sale => {
        const recorderId = typeof sale.recorded_by === 'object' && sale.recorded_by !== null
          ? (sale.recorded_by as any).id
          : sale.recorded_by;
        return String(recorderId) === currentUserIdStr;
      });
    }
    return sales;
  }, [sales, currentUser]);

  // Inject locally cached unique offline custom items gracefully into the store scope arrays
  const combinedItemsWithOfflineCustom = useMemo<ItemRecord[]>(() => {
    const activeItemNames = new Set(items.map(i => (i.item_name || '').trim().toLowerCase()));
    const customOfflineItemsCollected: ItemRecord[] = [];

    offlineQueue.forEach(item => {
      if (item.customItemName && item.customItemName.trim()) {
        const normalizedCustomName = item.customItemName.trim();
        if (!activeItemNames.has(normalizedCustomName.toLowerCase())) {
          activeItemNames.add(normalizedCustomName.toLowerCase());
          
          customOfflineItemsCollected.push({
            id: `local_item_${item.id}`,
            item_name: normalizedCustomName,
            default_price: Number(item.salePrice || 0),
            quantity: 0,
            shop_id: currentUser?.shop_id || '',
            created_at: new Date(item.cachedAt).toISOString()
          } as ItemRecord);
        }
      }
    });

    return [...items, ...customOfflineItemsCollected];
  }, [items, offlineQueue, currentUser?.shop_id]);

  // Inject locally mapped non-synchronized credit/dube elements into computation flows
  const filteredDubeForMetrics = useMemo(() => {
    let baseDube: DubeRecord[] = [];
    if (currentUser) {
      if (currentUser.role === 'sales') {
        const allowedSaleIds = new Set(filteredSalesForMetrics.map(s => String(s.id)));
        baseDube = dubeRecords.filter(record => allowedSaleIds.has(String(record.sale_id)));
      } else {
        baseDube = dubeRecords;
      }
    }

    const offlinePendingDubeCollected: DubeRecord[] = [];
    offlineQueue.forEach(item => {
      if (item.paymentMethod === 'dube') {
        let resolvedItemName = item.customItemName || t.unregItem || 'Item';
        
        if (item.selectedItemId && item.selectedItemId !== 'custom') {
          const matchedCatalogItem = combinedItemsWithOfflineCustom.find(i => String(i.id) === String(item.selectedItemId));
          if (matchedCatalogItem) {
            resolvedItemName = matchedCatalogItem.item_name || resolvedItemName;
          }
        }

        offlinePendingDubeCollected.push({
          id: `local_dube_${item.id}`,
          sale_id: item.id,
          buyer_name: item.buyerName || 'Offline Customer',
          buyer_phone: item.buyerPhone || '',
          amount: Number(item.salePrice || 0) * Math.max(1, Number(item.saleQty || 1)),
          is_paid: false,
          created_at: new Date(item.cachedAt).toISOString(),
          items: {
            item_name: resolvedItemName
          }
        } as unknown as DubeRecord);
      }
    });

    return [...offlinePendingDubeCollected, ...baseDube];
  }, [dubeRecords, filteredSalesForMetrics, offlineQueue, combinedItemsWithOfflineCustom, currentUser, t]);

  // Transform non-uploaded items into standard array items safely 
  const convertedOfflineSales = useMemo<Sale[]>(() => {
    return offlineQueue.map(item => {
      let resolvedItemName = item.customItemName || t.unregItem || 'Item';
      
      if (item.selectedItemId && item.selectedItemId !== 'custom') {
        const matchedCatalogItem = combinedItemsWithOfflineCustom.find(i => String(i.id) === String(item.selectedItemId));
        if (matchedCatalogItem) {
          resolvedItemName = matchedCatalogItem.item_name || resolvedItemName;
        }
      }

      return {
        id: item.id,
        item_id: item.selectedItemId && item.selectedItemId !== 'custom' 
          ? item.selectedItemId 
          : `local_item_${item.id}`, 
        price_sold: Number(item.salePrice || 0),
        quantity: Number(item.saleQty || 1),
        item_name: resolvedItemName,
        customItemName: item.customItemName,
        payment_method: item.paymentMethod,
        buyerName: item.buyerName,
        buyer_name: item.buyerName,
        buyerPhone: item.buyerPhone,
        buyer_phone: item.buyerPhone,
        sale_date: item.saleDate || new Date(item.cachedAt).toISOString(),
        is_offline_pending: true, 
        recorded_by: {
          id: currentUser?.id,
          full_name: currentUser?.full_name || 'Offline Operator'
        }
      } as unknown as Sale;
    });
  }, [offlineQueue, combinedItemsWithOfflineCustom, currentUser, t]);

  const combinedSalesWithOfflinePayload = useMemo(() => {
    return [...convertedOfflineSales, ...filteredSalesForMetrics];
  }, [convertedOfflineSales, filteredSalesForMetrics]);

  // Hook Slices Initialization Matrix
  const analytics = useAnalytics({
    sales: combinedSalesWithOfflinePayload, 
    dubeRecords: filteredDubeForMetrics,
    selectedShopFilter: normalizedShopFilter,
    shopQuery,
    dailyGoal,
    timeFilter,
    t,
    lang
  });
  
  const ledgerSlice = useLedgerSales({
    sales: combinedSalesWithOfflinePayload, 
    items: combinedItemsWithOfflineCustom, 
    dubeRecords: filteredDubeForMetrics, 
    selectedShopFilter: normalizedShopFilter, 
    t
  });

  const inventorySlice = useInventory({
    currentUser, items: combinedItemsWithOfflineCustom, setItems, selectedShopFilter: normalizedShopFilter, syncCloudDatabases, triggerToast, lang, t
  });

  const salesSlice = useSales({
    currentUser, items: combinedItemsWithOfflineCustom, sales: filteredSalesForMetrics, dubeRecords: filteredDubeForMetrics, selectedShopFilter: normalizedShopFilter, syncCloudDatabases, triggerToast, t, lang
  });

  const shopSlice = useShop({
    currentUser, 
    users: adminSlice.users as unknown as UserProfile[], 
    syncCloudDatabases, 
    triggerToast, 
    t, 
    lang
  });

  // =========================================================================
  // --- BACKGROUND OFFLINE SYNCHRONIZATION WORKER ---
  // =========================================================================
  /**
   * Evaluates connectivity pipelines to offload pending local records sequentially into cloud database arrays.
   * Gracefully breaks operations if a captive network condition matches standard fetch exceptions.
   */
  const processOfflineQueue = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    try {
      const offlineQueueData = await getOfflineSales();
      if (!offlineQueueData || offlineQueueData.length === 0) return;

      setIsSyncing(true); 
      const sortedQueue = [...offlineQueueData].sort((a, b) => a.cachedAt - b.cachedAt);

      for (const cachedSale of sortedQueue) {
        try {
          const mockEvent = { preventDefault: () => {} } as React.FormEvent;
          await (salesSlice.handleRecordSale as any)(mockEvent, cachedSale);
          await removeOfflineSale(cachedSale.id);
        } catch (err: any) {
          console.error("Queue execution entry halted mid-way:", err);
          const errorMsg = String(err?.message || '').toLowerCase();
          
          // Edge case intercept: Local Wi-Fi is up but external cloud APIs throw network connection blocks
          if (errorMsg.includes('failed to fetch') || errorMsg.includes('networkerror') || err?.name === 'TypeError') {
            triggerToast(t.noInternet, "error");
          }
          break; 
        }
      }

      await refreshOfflineQueueState();
      await syncCloudDatabases();
      
      const trailingQueueCheck = await getOfflineSales();
      if (!trailingQueueCheck || trailingQueueCheck.length === 0) {
        triggerToast(t.syncComplete || "All offline records synced successfully!", "success");
      }
    } catch (error) {
      console.error("Database cache pipeline worker crash:", error);
      triggerToast("Sync encountered errors", "error");
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, salesSlice, syncCloudDatabases, triggerToast, t, lang, refreshOfflineQueueState]);

  useEffect(() => {
    if (isOnline) {
      processOfflineQueue();
    }
  }, [isOnline, processOfflineQueue]);

  // =========================================================================
  // --- FORM RECORD SUBMISSION CONVERGENCE INTERCEPTOR ---
  // =========================================================================
  /**
   * Intercepts sales inputs to route transactions between live server frames and IndexedDB queues depending on deep network operational status.
   */
  const interceptedHandleRecordSale = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    let finalSelection = salesSlice.selectedItemId;
    let finalCustomName = salesSlice.customItemName.trim();
    let internetAccessFailureEncountered = false;

    if (finalSelection === 'custom' && finalCustomName) {
      const duplicateMatch = combinedItemsWithOfflineCustom.find(
        i => i.item_name?.trim().toLowerCase() === finalCustomName.toLowerCase()
      );
      if (duplicateMatch) {
        finalSelection = String(duplicateMatch.id);
        finalCustomName = '';
      }
    }

    if (isOnline) {
      try {
        await salesSlice.handleRecordSale(e);
        return; 
      } catch (err: any) {
        const errorMsg = String(err?.message || '').toLowerCase();
        // Check for captive portals / missing routes
        if (errorMsg.includes('failed to fetch') || errorMsg.includes('networkerror') || err?.name === 'TypeError') {
          console.warn("Network interface online but outbound internet routes are blocked. Falling back to internal cache.");
          internetAccessFailureEncountered = true;
          triggerToast(t.noInternet, "error" );
        } else {
          console.warn("Server interaction failure fallback redirect triggered.");
        }
      }
    }

    // --- FALLBACK LOCAL CACHING PIPELINE ---
    const uniqueCachedPayload: CachedSalePayload = {
      id: `local_${crypto.randomUUID()}`,
      selectedItemId: finalSelection,
      salePrice: salesSlice.salePrice,
      saleQty: salesSlice.saleQty,
      customItemName: finalCustomName,
      paymentMethod: salesSlice.paymentMethod as PaymentMethodType,
      buyerName: salesSlice.buyerName,
      buyerPhone: salesSlice.buyerPhone,
      saleDate: salesSlice.saleDate,
      cachedAt: Date.now()
    };

    await saveOfflineSale(uniqueCachedPayload);
    await refreshOfflineQueueState(); 
    
    // Fall back to clean default toast message if standard offline metrics are evaluated natively
    if (!isOnline && !internetAccessFailureEncountered) {
      triggerToast(t.offlineSaved || "Sale saved locally. Syncing when connection returns.", "success");
    }

    salesSlice.setSelectedItemId('');
    salesSlice.setSalePrice('');
    salesSlice.setSaleQty(1);
    salesSlice.setCustomItemName('');
    salesSlice.setBuyerName('');
    salesSlice.setBuyerPhone('');
  }, [isOnline, salesSlice, combinedItemsWithOfflineCustom, triggerToast, t, lang, refreshOfflineQueueState]);

  // =========================================================================
  // --- TRANSACTION RECORD CLEANUP CONTROLLERS ---
  // =========================================================================
  const executeDelete = useCallback(async () => {
    const { type, targetId } = deleteConfirmModal;
    if (!type || !targetId) return;
    try {
      if (type === 'item') {
        await dbService.deleteItem(targetId);
        setItems(prev => prev.filter(i => i.id !== targetId));
      } else if (type === 'shop') {
        await dbService.deleteShop(targetId);
        setShops(prev => prev.filter(s => s.id !== targetId));
      } else if (type === 'sale') {
        await dbService.deleteSale(targetId);
        setSales(prev => prev.filter(s => s.id !== targetId));
      }
      triggerToast(t.deleteSuccess || "Record deleted successfully", "success");
      setDeleteConfirmModal({ isOpen: false, type: null, targetId: null });
      await syncCloudDatabases();
    } catch (err: any) {
      triggerToast(err.message, "error");
    }
  }, [deleteConfirmModal, t.deleteSuccess, setItems, setShops, triggerToast, syncCloudDatabases]);

  const triggerDeleteConfirm = useCallback((type: 'user' | 'item' | 'shop' | 'sale', id: string) => {
    setDeleteConfirmModal({ isOpen: true, type, targetId: id });
  }, []);

  // =========================================================================
  // --- INTERACTION ELEMENT HANDLERS ---
  // =========================================================================
  const handleQuickSelect = useCallback((item: Item) => {
    salesSlice.setSelectedItemId(String(item.id)); 
    salesSlice.setSalePrice('');
    salesSlice.setSaleQty(1);
    salesSlice.setCustomItemName('');
  }, [salesSlice]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('debter_v1_current_user');
    window.location.reload();
  }, []);

  const handleAuthSuccess = useCallback((userObj: UserProfile) => {
    triggerToast(`Welcome back, ${userObj.identifier}`, "success");
    window.location.reload();
  }, [triggerToast]);

  const topFrequentShopItems = useMemo(() => {
    const baseItems = inventorySlice.activeShopItems || [];
    if (!baseItems.length) return [];
    
    const salesFrequencyMap = new Map<string, number>();
    filteredSalesForMetrics.forEach(sale => {
      if (sale.item_id) {
        const key = String(sale.item_id);
        salesFrequencyMap.set(key, (salesFrequencyMap.get(key) || 0) + 1);
      }
    });

    return [...baseItems]
      .sort((a, b) => (salesFrequencyMap.get(String(b.id)) || 0) - (salesFrequencyMap.get(String(a.id)) || 0))
      .slice(0, 4);
  }, [inventorySlice.activeShopItems, filteredSalesForMetrics]);

  const unifiedHandleSettleDube = useCallback(async () => {
    const activeDubeId = ledgerSlice.settleDubeModal.dubeId;
    if (!activeDubeId) return;
    try {
      await salesSlice.handleSettleDube(activeDubeId);
      await syncCloudDatabases();
      ledgerSlice.setSettleDubeModal({ isOpen: false, dubeId: null });
      triggerToast(t.dubePaid || t.settleSuccess || "Settled successfully", "success");
    } catch (err: any) {
      triggerToast(err.message || "Failed settling debt", "error");
    }
  }, [ledgerSlice, salesSlice, syncCloudDatabases, triggerToast, t]);

  // =========================================================================
  // --- MEMOIZED UI TRANSACTION MUTATION STATE MAPS ---
  // =========================================================================
  const memoizedForms = useMemo(() => ({
    selectedItemId: salesSlice.selectedItemId, setSelectedItemId: salesSlice.setSelectedItemId,
    salePrice: salesSlice.salePrice, setSalePrice: salesSlice.setSalePrice,
    saleQty: salesSlice.saleQty, setSaleQty: salesSlice.setSaleQty,
    customItemName: salesSlice.customItemName, setCustomItemName: salesSlice.setCustomItemName,
    paymentMethod: salesSlice.paymentMethod, setPaymentMethod: salesSlice.setPaymentMethod,
    buyerName: salesSlice.buyerName, setBuyerName: salesSlice.setBuyerName,
    buyerPhone: salesSlice.buyerPhone, setBuyerPhone: salesSlice.setBuyerPhone,
    saleDate: salesSlice.saleDate, setSaleDate: salesSlice.setSaleDate,
    itemName: inventorySlice.itemName, setItemName: inventorySlice.setItemName,
    newInvPrice: inventorySlice.newInvPrice, setNewInvPrice: inventorySlice.setNewInvPrice,
    itemQuantity: inventorySlice.itemQuantity, setItemQuantity: inventorySlice.setItemQuantity,
    salesName: shopSlice.salesName, setSalesName: shopSlice.setSalesName,
    newShopName: shopSlice.newShopName, setNewShopName: shopSlice.setNewShopName,
    newShopLocation: shopSlice.newShopLocation, setNewShopLocation: shopSlice.setNewShopLocation,
    newShopOwner: shopSlice.newShopOwner, setNewShopOwner: shopSlice.setNewShopOwner,
    salesPhone: shopSlice.salesPhone, setSalesPhone: shopSlice.setSalesPhone,
    salesEmail: shopSlice.salesEmail, setSalesEmail: shopSlice.setSalesEmail,
    salesPassword: shopSlice.salesPassword, setSalesPassword: shopSlice.setSalesPassword,
  }), [
    salesSlice.selectedItemId, salesSlice.setSelectedItemId, salesSlice.salePrice, salesSlice.setSalePrice,
    salesSlice.saleQty, salesSlice.setSaleQty, salesSlice.customItemName, salesSlice.setCustomItemName,
    salesSlice.paymentMethod, salesSlice.setPaymentMethod, salesSlice.buyerName, salesSlice.setBuyerName,
    salesSlice.buyerPhone, salesSlice.setBuyerPhone, salesSlice.saleDate, salesSlice.setSaleDate,
    inventorySlice.itemName, inventorySlice.setItemName, inventorySlice.newInvPrice, inventorySlice.itemQuantity, 
    inventorySlice.setItemQuantity, shopSlice.salesName, shopSlice.setSalesName, shopSlice.newShopName, 
    shopSlice.setNewShopName, shopSlice.newShopLocation, shopSlice.setNewShopLocation, shopSlice.newShopOwner, 
    shopSlice.setNewShopOwner, shopSlice.salesPhone, shopSlice.setSalesPhone, shopSlice.salesEmail, 
    shopSlice.setSalesEmail, shopSlice.salesPassword, shopSlice.setSalesPassword
  ]);
  
  const { activeShopItems: _droppedInvItems, ...cleanInventorySlice } = inventorySlice;

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'sales') {
        setActiveTab('entry');
      } else if (activeTab === 'dashboard' && currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
        setActiveTab('entry');
      }
    }
  }, [currentUser, activeTab]);

  // =========================================================================
  // --- UNIFIED EXECUTION EXPORTS ---
  // =========================================================================
  return {
    ...cleanInventorySlice,
    ...salesSlice,   
    ...shopSlice,
    ...ledgerSlice, 
    ...adminSlice, 

    sales: combinedSalesWithOfflinePayload, 
    items: combinedItemsWithOfflineCustom,
    dubeRecords: filteredDubeForMetrics, 
    shops: filteredShops, 
    shopQuery,
    setShopQuery,

    isLoading,
    activeTab, 
    setActiveTab,
    selectedShopFilter, 
    setSelectedShopFilter,
    toast, 
    clearToast, 
    deleteConfirmModal, 
    setDeleteConfirmModal,
    triggerDeleteConfirm, 
    executeDelete, 
    handleLogout, 
    handleAuthSuccess,
    analytics,
    timeFilter,
    setTimeFilter,
    handleQuickSelect,
    handleRegisterSalesperson: (e: React.FormEvent) => adminSlice.handleRegisterSalesperson(e, memoizedForms), 
    handleSettleDube: unifiedHandleSettleDube,
    activeShopItems: topFrequentShopItems,
    forms: memoizedForms,

    handleRecordSale: interceptedHandleRecordSale,
    isOnline,
    isSyncing
  };
}
