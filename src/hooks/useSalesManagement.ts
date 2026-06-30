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

  const [sales, setSales] = useState<Sale[]>([]);
  const [dubeRecords, setDubeRecords] = useState<DubeRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>(currentUser?.role === 'sales' ? 'entry' : 'dashboard');
  const [selectedShopFilter, setSelectedShopFilter] = useState<string>('all');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('today');
  
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    type: 'item' | 'shop' | 'sale' | 'user' | null;
    targetId: string | null;
  }>({ isOpen: false, type: null, targetId: null });

  const triggerToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ id: Date.now(), message, type });
  }, []);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  const normalizedShopFilter = useMemo(() => {
    return currentUser?.role === 'super_admin' ? selectedShopFilter : 'all';
  }, [currentUser, selectedShopFilter]);

  // =========================================================================
  // --- SUB-HOOK MOUNTING NODES ---
  // =========================================================================

  // 🟢 Initialize Admin Slice early so syncCloudDatabases can access its refresh method
  const adminSlice = useAdmin({
    currentUser,
    selectedShopFilter,
    syncCloudDatabases: () => syncCloudDatabases(), 
    triggerToast,
    t,
  });

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

      // 🟢 Cleanly trigger the PostgreSQL view synchronization instead of manual state settings
      if (isSuperAdmin || currentUser.role === 'admin') {
        await adminSlice.syncCohortsView();
      }
    } catch (err: any) {
      triggerToast(err.message || "Failed syncing with remote server", "error");
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, selectedShopFilter, setShops, setItems, triggerToast, adminSlice.syncCohortsView]);

  useEffect(() => { 
    syncCloudDatabases(); 
  }, [syncCloudDatabases]);

  // Role-based data isolation mechanics
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

  const analytics = useAnalytics({
    sales: filteredSalesForMetrics,
    dubeRecords: filteredDubeForMetrics,
    selectedShopFilter: normalizedShopFilter,
    dailyGoal,
    timeFilter,
    t,
    lang
  });
  
  const ledgerSlice = useLedgerSales({
    sales: filteredSalesForMetrics, 
    items, 
    dubeRecords: filteredDubeForMetrics, 
    selectedShopFilter: normalizedShopFilter, 
    t
  });

  const inventorySlice = useInventory({
    currentUser, items, setItems, selectedShopFilter: normalizedShopFilter, syncCloudDatabases, triggerToast, lang, t
  });

  const salesSlice = useSales({
    currentUser, items, sales: filteredSalesForMetrics, dubeRecords: filteredDubeForMetrics, selectedShopFilter: normalizedShopFilter, syncCloudDatabases, triggerToast, t, lang
  });

  const shopSlice = useShop({
    currentUser, 
    users: adminSlice.users as unknown as UserProfile[], // ✨ Fixed structural type mismatch here
    syncCloudDatabases, 
    triggerToast, 
    t, 
    lang
  });

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

  const handleQuickSelect = useCallback((item: Item) => {
    salesSlice.setSelectedItemId(String(item.id)); 
    salesSlice.setSalePrice('');
    salesSlice.setSaleQty('1');
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
    const salesFrequencyMap: Record<string, number> = {};
    for (let i = 0; i < filteredSalesForMetrics.length; i++) {
      const itemId = filteredSalesForMetrics[i].item_id;
      if (itemId) {
        salesFrequencyMap[String(itemId)] = (salesFrequencyMap[String(itemId)] || 0) + 1;
      }
    }
    return [...baseItems].sort((a, b) => (salesFrequencyMap[String(b.id)] || 0) - (salesFrequencyMap[String(a.id)] || 0)).slice(0, 4);
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
    itemQuantity: inventorySlice.itemQuantity, setItemQuantity: inventorySlice.itemQuantity,
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
    inventorySlice.itemName, inventorySlice.setItemName, inventorySlice.newInvPrice, inventorySlice.setNewInvPrice,
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
  }, [currentUser]);

  return {
    ...cleanInventorySlice,
    ...salesSlice,   
    ...shopSlice,
    ...ledgerSlice, 
    ...adminSlice, 

    sales: filteredSalesForMetrics,
    items, 
    dubeRecords: filteredDubeForMetrics, 
    shops: props.shops, 
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
    forms: memoizedForms
  };
}
