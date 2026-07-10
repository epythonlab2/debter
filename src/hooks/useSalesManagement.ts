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

// Import isolated offline database utilities from IndexedDB store
import { 
  saveOfflineSale, 
  getOfflineSales, 
  removeOfflineSale, 
  CachedSalePayload 
} from '../core/services/offlineSalesDb';

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

  // Offline Sync Management Engine States
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // =========================================================================
  // --- SYSTEM NOTIFICATION UTILITIES ---
  // =========================================================================
  const triggerToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ id: Date.now(), message, type });
  }, []);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  // Utility to reload local cache snapshot into state frame directly from IndexedDB
  const refreshOfflineQueueState = useCallback(async () => {
    try {
      const currentQueue = await getOfflineSales();
      setOfflineQueue(currentQueue || []);
    } catch (e) {
      console.error("Failed loading offline queue frames", e);
    }
  }, []);

  // Monitor connectivity updates and fetch offline store on mount
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
      triggerToast(err.message || "Failed syncing with remote server", "error");
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.role, currentUser?.shop_id, selectedShopFilter, setShops, setItems, triggerToast]);

  // Handle core synchronization on mount or filter switches
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

  const filteredDubeForMetrics = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'sales') {
      const allowedSaleIds = new Set(filteredSalesForMetrics.map(s => String(s.id)));
      return dubeRecords.filter(record => allowedSaleIds.has(String(record.sale_id)));
    }
    return dubeRecords;
  }, [dubeRecords, filteredSalesForMetrics, currentUser]);

  // 🟢 DYNAMIC ITEMS INJECTION MATRIX: EXTRACTS OFFLINE PENDING CUSTOM ITEMS AND INJECTS THEM INTO THE DROPDOWN LISTS
  const combinedItemsWithOfflineCustom = useMemo<ItemRecord[]>(() => {
    const activeItemNames = new Set(items.map(i => (i.item_name || '').trim().toLowerCase()));
    const customOfflineItemsCollected: ItemRecord[] = [];

    offlineQueue.forEach(item => {
      if (item.customItemName && item.customItemName.trim()) {
        const normalizedCustomName = item.customItemName.trim();
        if (!activeItemNames.has(normalizedCustomName.toLowerCase())) {
          activeItemNames.add(normalizedCustomName.toLowerCase());
          
          // Construct a mock ItemRecord representation so it populates selector options safely
          customOfflineItemsCollected.push({
            id: `local_item_${item.id}`,
            item_name: normalizedCustomName,
            price: Number(item.salePrice || 0),
            quantity: 0, // Pending creation validation
            shop_id: currentUser?.shop_id || '',
            created_at: new Date(item.cachedAt).toISOString()
          } as ItemRecord);
        }
      }
    });

    return [...items, ...customOfflineItemsCollected];
  }, [items, offlineQueue, currentUser?.shop_id]);

  // 🟢 HARDENED CONVERSION ENGINE: MAP UN-SYNCED OFFLINE QUEUE DATA TO PRESERVE ALL DETAILS IN THE LEDGER
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

  // 🟢 MERGE LOCAL CONVERTED QUEUE AND ONLINE CLOUD SNAPSHOT RECORDS INTO SINGLE SOURCE OF TRUTH
  const combinedSalesWithOfflinePayload = useMemo(() => {
    return [...convertedOfflineSales, ...filteredSalesForMetrics];
  }, [convertedOfflineSales, filteredSalesForMetrics]);

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
  
  // 🟢 INJECT COMBINED ARRAY DOWN INTO THE LEDGER VIEW COMPUTATION SLICE
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
  const processOfflineQueue = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    try {
      const offlineQueueData = await getOfflineSales();
      if (offlineQueueData.length === 0) return;

      // 🌟 THIS ACTS AS THE KEY FOR YOUR DIALOG WINDOW NOW
      setIsSyncing(true); 

      const sortedQueue = offlineQueueData.sort((a, b) => a.cachedAt - b.cachedAt);

      for (const cachedSale of sortedQueue) {
        try {
          const mockEvent = { preventDefault: () => {} } as React.FormEvent;
          await salesSlice.handleRecordSale(mockEvent, cachedSale);
          await removeOfflineSale(cachedSale.id);
        } catch (err) {
          console.error("Queue execution entry halted mid-way:", err);
          break; 
        }
      }

      await refreshOfflineQueueState();
      await syncCloudDatabases();
      
      // Optional: Flash a quick completion toast *after* the dialog drops
      triggerToast(t.syncComplete || "All offline records synced successfully!", "success");
    } catch (error) {
      console.error("Database cache pipeline worker crash:", error);
      triggerToast("Sync encountered errors", "error");
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, salesSlice, syncCloudDatabases, triggerToast, t, refreshOfflineQueueState]);

  // Handle auto-sync processing when coming back online
  useEffect(() => {
    if (isOnline) {
      processOfflineQueue();
    }
  }, [isOnline, processOfflineQueue]);

  // Intercepted UI Form Controller Action Pipeline Submission Engine
  const interceptedHandleRecordSale = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (isOnline) {
      try {
        // 1. Let the inner slice record the sale and manage its own database sync cleanly
        await salesSlice.handleRecordSale(e);
        return; // Exit instantly so the UI form's 'finally' loader toggles back to false
      } catch (err) {
        console.warn("Server interaction failure fallback redirect triggered.");
        // If the API completely drops, execution falls through to secure it locally instead
      }
    }

    // --- FALLBACK OFFLINE CACHING PIPELINE ---
    const uniqueCachedPayload: CachedSalePayload = {
      id: `local_${crypto.randomUUID()}`,
      selectedItemId: salesSlice.selectedItemId,
      salePrice: salesSlice.salePrice,
      saleQty: salesSlice.saleQty,
      customItemName: salesSlice.customItemName,
      paymentMethod: salesSlice.paymentMethod,
      buyerName: salesSlice.buyerName,
      buyerPhone: salesSlice.buyerPhone,
      saleDate: salesSlice.saleDate,
      cachedAt: Date.now()
    };

    await saveOfflineSale(uniqueCachedPayload);
    await refreshOfflineQueueState(); 
    triggerToast(t.offlineSaved || "Sale saved locally. Syncing when connection returns.", "success");

    // Clear UI state fields manually for offline path
    salesSlice.setSelectedItemId('');
    salesSlice.setSalePrice('');
    salesSlice.setSaleQty(1 as any);
    salesSlice.setCustomItemName('');
    salesSlice.setBuyerName('');
    salesSlice.setBuyerPhone('');
  }, [isOnline, salesSlice, triggerToast, t, refreshOfflineQueueState]);

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
    items: combinedItemsWithOfflineCustom, // 🟢 NOW INCLUDES NEW OFFLINE CUSTOM REGISTERED ENTRIES IN THE DROPDOWNS
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
