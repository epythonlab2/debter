// src/hooks/useSalesManagement.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import { dbService } from '../core/services/dbService';
import { Sale, DubeRecord, Shop, UserProfile, ToastState, Item } from '../types';
import { ItemRecord } from '../types/inventory';

// Slice-logic hooks handling localized data slices
import { useInventory } from './useInventory';
import { useSales } from './useSales';
import { useShop } from './useShop';
import { useLedgerSales } from './useLedgerSales'; 
import { useAnalytics, TimeFilterType } from './useAnalytics';
import { useAdmin } from './useAdmin'; 

// IndexedDB local offline orchestration engine
import { 
  saveOfflineSale, 
  getOfflineSales, 
  removeOfflineSale, 
  CachedSalePayload 
} from '../core/services/offlineSalesDb';

import { PaymentMethodType } from '../components/sales/RecordSaleTab';

interface UseSalesManagementProps {
  lang: 'en' | 'am';
  t: any;
  currentUser: any;
  shops: Shop[];
  setShops: React.Dispatch<React.SetStateAction<Shop[]>>;
  items: ItemRecord[]; // Hydrated cache array passed from useLocalStoragePipeline ('debter_v1_items')
  setItems: React.Dispatch<React.SetStateAction<ItemRecord[]>>;
  sales: Sale[];      // Hydrated cache array passed from useLocalStoragePipeline ('debter_v1_sales')
  setSales?: React.Dispatch<React.SetStateAction<Sale[]>>;
  dailyGoal: number;
}

export function useSalesManagement(props: UseSalesManagementProps) {
  const { 
    lang, t, currentUser, setShops, 
    items, 
    setItems, 
    sales, 
    setSales: setGlobalSales, dailyGoal 
  } = props;

  // =========================================================================
  // --- SECTION 1: STATE STORAGE STACK ---
  // =========================================================================
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

  // Browser Network State Trackers
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // =========================================================================
  // --- SECTION 2: SYSTEM WORKERS & EVENT LISTENERS ---
  // =========================================================================
  const triggerToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ id: Date.now(), message, type });
  }, []);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  // Hydrates state from IndexedDB offline storage
  const refreshOfflineQueueState = useCallback(async () => {
    try {
      const currentQueue = await getOfflineSales();
      setOfflineQueue(currentQueue || []);
    } catch (e) {
      console.error("Critical Storage Error: Failed loading offline queue frames", e);
    }
  }, []);

  // Network listener binding lifecycle
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

  // Restricts non-super_admin accounts from querying across isolated tenants
  const normalizedShopFilter = useMemo(() => {
    return currentUser?.role === 'super_admin' ? selectedShopFilter : 'all';
  }, [currentUser?.role, selectedShopFilter]);

  // =========================================================================
  // --- SECTION 3: REMOTE BACKEND SYNC OPERATIONS ---
  // =========================================================================
  const syncCloudDatabases = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const isSuperAdmin = currentUser.role === 'super_admin';
      const shopScope = isSuperAdmin 
        ? (selectedShopFilter === 'all' ? undefined : selectedShopFilter) 
        : (currentUser.shop_id || undefined);

      // Concurrent fetch operations to optimize initial page loading time
      const [cloudShops, cloudItems, cloudSales, cloudDube] = await Promise.all([
        dbService.fetchShops(),
        dbService.fetchItems(shopScope),
        dbService.fetchSales(shopScope),
        dbService.fetchDubeRecords(shopScope)
      ]);

      setShops(cloudShops || []);
      setDubeRecords(cloudDube || []);

      // Commit items upstream into the global storage state layout
      if (cloudItems) {
        localStorage.setItem('debter_v1_items', JSON.stringify(cloudItems));
        setItems(cloudItems);
      }

      // Commit transactions upstream into the global storage state layout
      if (cloudSales) {
        localStorage.setItem('debter_v1_sales', JSON.stringify(cloudSales));
        if (setGlobalSales) {
          setGlobalSales(cloudSales); 
        }
      }

      if (isSuperAdmin || currentUser.role === 'admin') {
        await adminSlice.syncCohortsView();
      }
    } catch (err: any) {
      // Identify network fetch losses or offline drops safely without causing type errors
      const isFetchError = err?.message?.includes('Failed to fetch') || (err as any).status === 0;
      
      if (isFetchError || !navigator.onLine) {
        triggerToast(
          t.noInternet, 
          "error"
        );
      } else {
        triggerToast(err.message || "Failed syncing with remote server", "error");
      }
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.role, currentUser?.shop_id, selectedShopFilter, setShops, setItems, setGlobalSales, triggerToast, t]);

  useEffect(() => { 
    syncCloudDatabases(); 
  }, [syncCloudDatabases]);

  // Administrative interface slice initializer
  const adminSlice = useAdmin({
    currentUser,
    selectedShopFilter,
    syncCloudDatabases, 
    triggerToast,
    t,
  });

  // =========================================================================
  // --- SECTION 4: DATA QUERIES & FILTER COMPUTATIONS ---
  // =========================================================================
  
  // Computes client-side multi-shop location matching
  const filteredShops = useMemo(() => {
    const baseShops = props.shops || [];
    const sanitizedQuery = shopQuery.trim().toLowerCase();
    if (!sanitizedQuery) return baseShops;
    return baseShops.filter(shop => shop?.name?.toLowerCase().includes(sanitizedQuery));
  }, [props.shops, shopQuery]);

  // Row-level role-based access security enforcement for sales personnel data separation
  const filteredSalesForMetrics = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role !== 'sales') return sales;

    const currentUserIdStr = String(currentUser.id).trim().toLowerCase();

    return sales.filter(sale => {
      if (!sale.recorded_by) return false;
      let recorderId = '';
      if (typeof sale.recorded_by === 'object') {
        recorderId = String((sale.recorded_by as any).id || (sale.recorded_by as any).user_id || '');
      } else {
        recorderId = String(sale.recorded_by);
      }
      return recorderId.trim().toLowerCase() === currentUserIdStr;
    });
  }, [sales, currentUser]);

  // Isolate and filter associated customer debt entries based on filtered sales records
  const filteredDubeForMetrics = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'sales') {
      const allowedSaleIds = new Set(filteredSalesForMetrics.map(s => String(s.id)));
      return dubeRecords.filter(record => allowedSaleIds.has(String(record.sale_id)));
    }
    return dubeRecords;
  }, [dubeRecords, filteredSalesForMetrics, currentUser]);

 // Computes catalog mapping combining global inventory records and un-synchronized offline items
const combinedItemsWithOfflineCustom = useMemo<ItemRecord[]>(() => {
  const activeItemNames = new Set(items.map(i => (i.item_name || '').trim().toLowerCase()));
  const customOfflineItemsCollected: ItemRecord[] = [];

  offlineQueue.forEach(item => {
    if (item.customItemName && item.customItemName.trim()) {
      const normalizedCustomName = item.customItemName.trim();
      if (!activeItemNames.has(normalizedCustomName.toLowerCase())) {
        activeItemNames.add(normalizedCustomName.toLowerCase());
        
        customOfflineItemsCollected.push({
          // FIX: Change 'local_item_' to 'custom_saved_' to match RecordSaleTab dropdown expectations
          id: `custom_saved_${normalizedCustomName}`, 
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

  // Maps physical local transaction records back into standard Sale data signatures
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
        // FIX: Ensure custom ad-hoc sales use null instead of string IDs.
        // This avoids foreign key constraint issues upstream when syncing.
        item_id: item.selectedItemId && item.selectedItemId !== 'custom' 
          ? item.selectedItemId 
          : null, 
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

  // Combines production database sales with local pending offline arrays
  const combinedSalesWithOfflinePayload = useMemo(() => {
    return [...convertedOfflineSales, ...filteredSalesForMetrics];
  }, [convertedOfflineSales, filteredSalesForMetrics]);

  // =========================================================================
  // --- SECTION 5: DOWNSTREAM SUB-HOOK ORCHESTRATION ---
  // =========================================================================
  const analytics = useAnalytics({
    sales: filteredSalesForMetrics,
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
  // --- SECTION 6: BACKGROUND OFFLINE SYNCHRONIZATION WORKER ---
  // =========================================================================
  const processOfflineQueue = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    try {
      const offlineQueueData = await getOfflineSales();
      if (offlineQueueData.length === 0) return;

      setIsSyncing(true); 

      // Sort logs by time to maintain ledger integrity (First-In, First-Out sequence)
      const sortedQueue = [...offlineQueueData].sort((a, b) => a.cachedAt - b.cachedAt);

      for (const cachedSale of sortedQueue) {
        try {
          const mockEvent = { preventDefault: () => {} } as React.FormEvent;
          await salesSlice.handleRecordSale(mockEvent, cachedSale);
          await removeOfflineSale(cachedSale.id);
        } catch (err) {
          console.error("Queue execution entry halted mid-way:", err);
          break; // Stop execution on failure to preserve sequential log order
        }
      }

      await refreshOfflineQueueState();
      await syncCloudDatabases();
      triggerToast(t.syncComplete || "All offline records synced successfully!", "success");
    } catch (error) {
      console.error("Database cache pipeline worker crash:", error);
      triggerToast("Sync encountered errors", "error");
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, salesSlice, syncCloudDatabases, triggerToast, t, refreshOfflineQueueState]);

  useEffect(() => {
    if (isOnline) {
      processOfflineQueue();
    }
  }, [isOnline, processOfflineQueue]);

  // =========================================================================
  // --- SECTION 7: INTERACTION EVENT HANDLERS ---
  // =========================================================================
  const interceptedHandleRecordSale = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // If online, dispatch directly to remote server databases
    if (isOnline) {
      try {
        await salesSlice.handleRecordSale(e);
        return;
      } catch (err) {
        console.warn("Server interaction failure: Falling back to local offline storage.");
      }
    }

    // Capture and write down data arrays to local device cache database
    const uniqueCachedPayload: CachedSalePayload = {
      id: `local_${crypto.randomUUID()}`,
      selectedItemId: salesSlice.selectedItemId,
      salePrice: salesSlice.salePrice,
      saleQty: salesSlice.saleQty,
      customItemName: salesSlice.customItemName,
      paymentMethod: salesSlice.paymentMethod as PaymentMethodType,
      buyerName: salesSlice.buyerName,
      buyerPhone: salesSlice.buyerPhone,
      saleDate: salesSlice.saleDate,
      cachedAt: Date.now()
    };

    await saveOfflineSale(uniqueCachedPayload);
    await refreshOfflineQueueState(); 
    triggerToast(t.offlineSaved || "Sale saved locally. Syncing when connection returns.", "success");

    // Clear transaction state fields
    salesSlice.setSelectedItemId('');
    salesSlice.setSalePrice('');
    salesSlice.setSaleQty(1 as any);
    salesSlice.setCustomItemName('');
    salesSlice.setBuyerName('');
    salesSlice.setBuyerPhone('');
  }, [isOnline, salesSlice, triggerToast, t, refreshOfflineQueueState]);

  // Handlers for record drop / data deletion management
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
        if (setGlobalSales) {
          setGlobalSales(prev => prev.filter(s => s.id !== targetId));
        }
      }
      triggerToast(t.deleteSuccess || "Record deleted successfully", "success");
      setDeleteConfirmModal({ isOpen: false, type: null, targetId: null });
      await syncCloudDatabases();
    } catch (err: any) {
      triggerToast(err.message, "error");
    }
  }, [deleteConfirmModal, t.deleteSuccess, setItems, setShops, setGlobalSales, triggerToast, syncCloudDatabases]);

  const triggerDeleteConfirm = useCallback((type: 'user' | 'item' | 'shop' | 'sale', id: string) => {
    setDeleteConfirmModal({ isOpen: true, type, targetId: id });
  }, []);

  const handleQuickSelect = useCallback((item: Item) => {
    salesSlice.setSelectedItemId(String(item.id)); 
    salesSlice.setSalePrice('');
    salesSlice.setSaleQty(1 as any);
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

  // Computes the top 4 most frequently sold items for quick checkout actions
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
  // --- SECTION 8: STATE MEMOIZATION CORES ---
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
    newShopName: shopSlice.newShopName, setNewShopName: shopSlice.newShopName,
    newShopLocation: shopSlice.newShopLocation, setNewShopLocation: shopSlice.newShopLocation,
    newShopOwner: shopSlice.newShopOwner, setNewShopOwner: shopSlice.newShopOwner,
    salesPhone: shopSlice.salesPhone, setSalesPhone: shopSlice.setSalesPhone,
    salesEmail: shopSlice.salesEmail, setSalesEmail: shopSlice.setSalesEmail,
    salesPassword: shopSlice.salesPassword, setSalesPassword: shopSlice.setSalesPassword,
  }), [
    salesSlice.selectedItemId, salesSlice.setSelectedItemId, salesSlice.salePrice, salesSlice.setSalePrice,
    salesSlice.saleQty, salesSlice.setSaleQty, salesSlice.customItemName, salesSlice.setCustomItemName,
    salesSlice.paymentMethod, salesSlice.setPaymentMethod, salesSlice.buyerName, salesSlice.setBuyerName,
    salesSlice.buyerPhone, salesSlice.setBuyerPhone, salesSlice.saleDate, salesSlice.setSaleDate,
    inventorySlice.itemName, inventorySlice.setItemName, inventorySlice.newInvPrice, inventorySlice.newInvPrice,
    inventorySlice.itemQuantity, inventorySlice.setItemQuantity, shopSlice.salesName, shopSlice.setSalesName, 
    shopSlice.newShopName, shopSlice.setNewShopName, shopSlice.newShopLocation, shopSlice.setNewShopLocation,
    shopSlice.newShopOwner, shopSlice.setNewShopOwner, shopSlice.salesPhone, shopSlice.setSalesPhone,
    shopSlice.salesEmail, shopSlice.setSalesEmail, shopSlice.salesPassword, shopSlice.setSalesPassword
  ]);
  
  const { activeShopItems: _droppedInvItems, ...cleanInventorySlice } = inventorySlice;


  // View fallback mapping for sales representatives
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'sales') {
        setActiveTab('entry');
      } else if (activeTab === 'dashboard' && currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
        setActiveTab('entry');
      }
    }
  }, [currentUser]);

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
