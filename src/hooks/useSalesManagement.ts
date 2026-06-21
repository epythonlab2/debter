// src/hooks/useSalesManagement.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import { dbService } from '../core/services/dbService';
import { supabase } from '../utils/supabaseClient'; 
import { Sale, DubeRecord, Shop, UserProfile, ToastState, Item } from '../types';
import { ItemRecord } from '../types/inventory';

import { useInventory } from './useInventory';
import { useSales } from './useSales';
import { useShop } from './useShop';
import { useLedgerSales } from './useLedgerSales'; 
import { useAnalytics, TimeFilterType } from './useAnalytics';

/**
 * Configuration schema for the primary sales management orchestration hook.
 * Holds references to local storage synchronization state modifiers and active operator sessions.
 */
interface UseSalesManagementProps {
  /** Current active interface language code */
  lang: 'en' | 'am';
  /** Global localized translation dictionary resource */
  t: any;
  /** Authenticated user session profile object containing identity and role authorization matrices */
  currentUser: any;
  /** State-tracked list of all synchronized retail shop modules */
  shops: Shop[];
  /** State modifier function dispatched to update the upstream list of shops */
  setShops: React.Dispatch<React.SetStateAction<Shop[]>>;
  /** Inventory items list cached within client operational memory */
  items: ItemRecord[];
  /** State modifier function dispatched to update the upstream inventory index */
  setItems: React.Dispatch<React.SetStateAction<ItemRecord[]>>;
  /** Computed threshold tracking modern financial baseline goals */
  dailyGoal: number;
}

/**
 * Root Data Orchestration and State Coordination Hook.
 * Acts as the master operational engine linking persistent offline storage layers,
 * real-time Supabase remote servers, validation layers, and role-based views.
 * * @param {UseSalesManagementProps} props Configuration parameters and database sync nodes.
 * @returns {Object} Unified application stage matrix interface and bound transactional actions.
 */
export function useSalesManagement(props: UseSalesManagementProps) {
  const { lang, t, currentUser, setShops, items, setItems, dailyGoal } = props;

  // =========================================================================
  // --- CORE PIPELINE STATE REGISTERS ---
  // =========================================================================

  /** @type {[Sale[], React.Dispatch<React.SetStateAction<Sale[]>>]} Transaction logs array state */
  const [sales, setSales] = useState<Sale[]>([]);

  /** @type {[DubeRecord[], React.Dispatch<React.SetStateAction<DubeRecord[]>>]} Credit ledger logs array state */
  const [dubeRecords, setDubeRecords] = useState<DubeRecord[]>([]);

  /** @type {[UserProfile[], React.Dispatch<React.SetStateAction<UserProfile[]>>]} System operators array state */
  const [users, setUsers] = useState<UserProfile[]>([]);

  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} Global cloud synchronization spinner state */
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} Tab visibility router index state pointer */
  const [activeTab, setActiveTab] = useState<string>(currentUser?.role === 'sales' ? 'entry' : 'dashboard');

  /**
   * Reactive Authorization Guard.
   * Catches user profile loading lags to automatically reset standard sales associates
   * away from gated administration dashboards into operational entry states on mount.
   */
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'sales') {
        setActiveTab('entry');
      } else if (activeTab === 'dashboard' && currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
        setActiveTab('entry');
      }
    }
  }, [currentUser]);

  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} Administrative target shop filter query */
  const [selectedShopFilter, setSelectedShopFilter] = useState<string>('all');

  /** @type {[ToastState|null, React.Dispatch<React.SetStateAction<ToastState|null>>]} Transient system banner event register */
  const [toast, setToast] = useState<ToastState | null>(null);

  /** @type {[TimeFilterType, React.Dispatch<React.SetStateAction<TimeFilterType>>]} Chronological segmentation filter index */
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('today');
  
  /** @type {[Object, React.Dispatch<React.SetStateAction<Object>>]} Breakout confirm overlay parameter register */
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    type: 'item' | 'shop' | 'sale' | 'user' | null;
    targetId: string | null;
  }>({ isOpen: false, type: null, targetId: null });

  /**
   * Dispatches transient visual banner notices across downstream layouts.
   * Wrapped in a callback to prevent child updates when parent nodes evaluate structures.
   * * @param {string} message The readable textual evaluation payload to render.
   * * @param {'success'|'error'} [type='success'] Severity classification flag.
   */
  const triggerToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ id: Date.now(), message, type });
  }, []);

  /**
   * Clears the active transient system banner notification from application state.
   * Used as an onClose hook to break state initialization loops during tab view switches.
   */
  const clearToast = useCallback(() => {
    setToast(null);
  }, []);
  // =========================================================================
  // --- CLOUD DATABASES ROUTINES & LIFECYCLES ---
  // =========================================================================

  /**
   * Orchestrates high-performance data pulling workflows across concurrent storage clusters.
   * Evaluates current user session access clearance thresholds to limit network row scoping
   * to safe structural segments (e.g., locking sales clerks strictly to assigned shop constraints).
   * * @async
   * @function syncCloudDatabases
   * @throws {Error} Relays failures across remote server bridges straight to toast intercept arrays.
   */
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
        const cloudUsers = await dbService.fetchUsers();
        if (cloudUsers) setUsers(cloudUsers);
      }
    } catch (err: any) {
      triggerToast(err.message || "Failed syncing with remote server", "error");
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, selectedShopFilter, setShops, setItems, triggerToast]);

  /**
   * Primary network lifecycle synchronizer.
   * Triggers background refresh loops strictly when root user scope mutations or
   * admin selection filter changes occur, preventing cyclical render overhead.
   */
  useEffect(() => { 
    syncCloudDatabases(); 
  }, [syncCloudDatabases]);

  /**
   * Destructive Mutation Gateway handler.
   * Executes remote network data deletions across items, shops, or transactional records,
   * providing optimistic UI list filter processing prior to structural sync updates.
   * * @async
   * @function executeDelete
   */
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

  /**
   * Stages an element registration identity for destruction inside a visual prompt window.
   * * @param {'user'|'item'|'shop'|'sale'} type Target database catalog collection.
   * @param {string} id Unique structural registration primary key hash.
   */
  const triggerDeleteConfirm = useCallback((type: 'user' | 'item' | 'shop' | 'sale', id: string) => {
    setDeleteConfirmModal({ isOpen: true, type, targetId: id });
  }, []);
  
  /**
   * Memoized administrative string resolver preventing regular operators 
   * from passing cross-tenant search keys to operational downstream analytical components.
   * * @type {string}
   */
  const normalizedShopFilter = useMemo(() => {
    if (currentUser?.role === 'super_admin') {
      return selectedShopFilter;
    }
    return 'all';
  }, [currentUser, selectedShopFilter]);

  // =========================================================================
  // --- ROLE-BASED DATA ISOLATION PIPELINE ---
  // =========================================================================

  /**
   * Memoized security barrier filtering transactional ledger visibility.
   * Forces standard staff profiles to view exclusively their own recorded operations
   * while giving managers unfiltered access.
   * * @type {Sale[]}
   */
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

  /**
   * Memoized security barrier filtering credit record lines.
   * Ensures credit ledger information limits correlate directly with visible transactions.
   * * @type {DubeRecord[]}
   */
  const filteredDubeForMetrics = useMemo(() => {
    if (!currentUser) return [];
    
    if (currentUser.role === 'sales') {
      const allowedSaleIds = new Set(filteredSalesForMetrics.map(s => String(s.id)));
      return dubeRecords.filter(record => allowedSaleIds.has(String(record.sale_id)));
    }
    return dubeRecords;
  }, [dubeRecords, filteredSalesForMetrics, currentUser]);

  // =========================================================================
  // --- SUB-HOOK MOUNTING NODES ---
  // =========================================================================

  /** Analytical reporting math processor slice */
  const analytics = useAnalytics({
    sales: filteredSalesForMetrics,
    dubeRecords: filteredDubeForMetrics,
    selectedShopFilter: normalizedShopFilter,
    dailyGoal: dailyGoal,
    timeFilter: timeFilter,
    t,
    lang
  });
  
  /** Historical auditing financial spreadsheet slice */
  const ledgerSlice = useLedgerSales({
    sales: filteredSalesForMetrics, 
    items, 
    dubeRecords: filteredDubeForMetrics, 
    selectedShopFilter: normalizedShopFilter, 
    t
  });

  /** Warehouse auditing and real-time product baseline controls slice */
  const inventorySlice = useInventory({
    currentUser, 
    items, 
    setItems, 
    selectedShopFilter: normalizedShopFilter, 
    syncCloudDatabases, 
    triggerToast, 
    lang, 
    t
  });

  /** Transaction creation, validation engine, and input buffer state slice */
  const salesSlice = useSales({
    currentUser, 
    items, 
    sales: filteredSalesForMetrics, 
    dubeRecords: filteredDubeForMetrics, 
    selectedShopFilter: normalizedShopFilter, 
    syncCloudDatabases, 
    triggerToast, 
    t, 
    lang
  });

  /** Retail footprint definitions and management allocation configurations slice */
  const shopSlice = useShop({
    currentUser, users, syncCloudDatabases, triggerToast, t, lang
  });

  // =========================================================================
  // --- DATA MUTATIONS & ACCOUNT MANAGEMENT CACHE BRIDGES ---
  // =========================================================================

  /**
   * Processes security provisioning rules to register a new sales associate account record.
   * Automatically scopes the user mapping coordinates to match active administrative shops,
   * and handles local rollbacks cleanly if remote server network writes drop rows.
   * * @async
   * @function handleRegisterSalesperson
   * @param {React.FormEvent} e Primary form execution event context loop interface.
   */
  const handleRegisterSalesperson = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const currentName = (shopSlice.salesName || '').trim();
    const currentPhone = (shopSlice.salesPhone || '').trim();
    const currentPassword = (shopSlice.salesPassword || '').trim();
    const currentEmail = (shopSlice.salesEmail || '').trim();

    if (!currentName) {
      triggerToast("Full name is required.", "error");
      return;
    }

    const targetShopId = currentUser.role === 'super_admin'
      ? (selectedShopFilter !== 'all' ? selectedShopFilter : null)
      : currentUser.shop_id;

    if (!targetShopId && currentUser.role === 'super_admin') {
      triggerToast("Super Admins must select a specific shop.", "error");
      return;
    }

    const newStaff = {
      id: `usr-${Date.now()}`,
      full_name: currentName,
      identifier: currentPhone || `09${Math.floor(10000000 + Math.random() * 90000000)}`,
      password: currentPassword || '123456',
      email: currentEmail || null,
      role: 'sales' as const,
      shop_id: targetShopId || '',
      approved: true,
      createdBy: currentUser.id,
      businessName: null
    } as UserProfile;

    try {
      setUsers(prev => [...prev, newStaff]);

      const dbPayload = {
        id: newStaff.id,
        full_name: newStaff.full_name,
        identifier: newStaff.identifier,
        password: newStaff.password,
        email: newStaff.email,
        role: newStaff.role,
        shop_id: newStaff.shop_id || null,
        approved: newStaff.approved,
        created_by: newStaff.createdBy
      };

      const { error } = await supabase.from('users').insert([dbPayload]);
      if (error) throw error;

      triggerToast(t.salesPersonRegistered, "success");

      if (shopSlice.setSalesName) shopSlice.setSalesName('');
      if (shopSlice.setSalesPhone) shopSlice.setSalesPhone('');
      if (shopSlice.setSalesPassword) shopSlice.setSalesPassword('');
      if (shopSlice.setSalesEmail) shopSlice.setSalesEmail('');

      await syncCloudDatabases();
    } catch (err: any) {
      console.error("Staff Registration Failure:", err);
      setUsers(prev => prev.filter(u => u.id !== newStaff.id));
      triggerToast(err.message || "Failed to register profile", "error");
    }
  }, [currentUser, selectedShopFilter, shopSlice, triggerToast, syncCloudDatabases, t.salesPersonRegistered]);

  /**
   * Populates checkout form input state properties instantly when tapping quick-select cards.
   * * @param {Item} item Selected configuration item data row model reference.
   */
  const handleQuickSelect = useCallback((item: Item) => {
    salesSlice.setSelectedItemId(String(item.id)); 
    salesSlice.setSalePrice('');
    salesSlice.setSaleQty('1');
    salesSlice.setCustomItemName('');
  }, [salesSlice]);

  /**
   * Clears security identity tokens from storage memory configurations and forces clean viewport reloads.
   */
  const handleLogout = useCallback(() => {
    localStorage.removeItem('debter_v1_current_user');
    window.location.reload();
  }, []);

  /**
   * Displays diagnostic entry confirmations and updates view tracking references upon successful login actions.
   * * @param {UserProfile} userObj Authenticated worker identity profile reference row.
   */
  const handleAuthSuccess = useCallback((userObj: UserProfile) => {
    triggerToast(`Welcome back, ${userObj.identifier}`, "success");
    window.location.reload();
  }, [triggerToast]);

  /**
   * Computes a linear-time ($O(N)$ mapping) calculation cross-referencing sales velocity rules
   * to extract the top four highest-performing retail items. Used for high-speed checkout tap actions.
   * * @type {Item[]}
   */
  const topFrequentShopItems = useMemo(() => {
    const baseItems = inventorySlice.activeShopItems || [];
    if (!baseItems.length) return [];

    const salesFrequencyMap: Record<string, number> = {};
    for (let i = 0; i < filteredSalesForMetrics.length; i++) {
      const itemId = filteredSalesForMetrics[i].item_id;
      if (itemId) {
        const idString = String(itemId);
        salesFrequencyMap[idString] = (salesFrequencyMap[idString] || 0) + 1;
      }
    }

    return [...baseItems]
      .sort((a, b) => {
        const countA = salesFrequencyMap[String(a.id)] || 0;
        const countB = salesFrequencyMap[String(b.id)] || 0;
        return countB - countA;
      })
      .slice(0, 4);
  }, [inventorySlice.activeShopItems, filteredSalesForMetrics]);

  /**
   * Bridge mutation processing link. Runs debt clearing tasks using verified keys
   * and triggers background network fetches to update balances across all views.
   * * @async
   * @function unifiedHandleSettleDube
   */
  const unifiedHandleSettleDube = useCallback(async () => {
    const activeDubeId = ledgerSlice.settleDubeModal.dubeId;
    if (!activeDubeId) return;

    try {
      await salesSlice.handleSettleDube(activeDubeId);
      await syncCloudDatabases();
      ledgerSlice.setSettleDubeModal({ isOpen: false, dubeId: null });
      triggerToast(t.dubePaid || t.settleSuccess || "Settled successfully", "success");
    } catch (err: any) {
      console.error("Debt settlement transaction failed:", err);
      triggerToast(err.message || "Failed settling debt", "error");
    } finally {
      setIsLoading(false);
    }
  }, [ledgerSlice, salesSlice, syncCloudDatabases, triggerToast, t]);

  // =========================================================================
  // --- CACHED STATE REFERENCE MAPS ---
  // =========================================================================

  /**
   * Consolidates dynamic data state bindings into a stable reference object.
   * Prevents layout components from triggering unnecessary re-renders during active typing input cycles.
   * * @type {Object}
   */
  const memoizedForms = useMemo(() => ({
    selectedItemId: salesSlice.selectedItemId, 
    setSelectedItemId: salesSlice.setSelectedItemId,
    salePrice: salesSlice.salePrice, 
    setSalePrice: salesSlice.setSalePrice,
    saleQty: salesSlice.saleQty, 
    setSaleQty: salesSlice.setSaleQty,
    customItemName: salesSlice.customItemName, 
    setCustomItemName: salesSlice.setCustomItemName,
    paymentMethod: salesSlice.paymentMethod, 
    setPaymentMethod: salesSlice.setPaymentMethod,
    buyerName: salesSlice.buyerName, 
    setBuyerName: salesSlice.setBuyerName,
    buyerPhone: salesSlice.buyerPhone, 
    setBuyerPhone: salesSlice.setBuyerPhone,
    saleDate: salesSlice.saleDate, 
    setSaleDate: salesSlice.setSaleDate,
    
    itemName: inventorySlice.itemName, 
    setItemName: inventorySlice.setItemName,
    newInvPrice: inventorySlice.newInvPrice, 
    setNewInvPrice: inventorySlice.setNewInvPrice,
    itemQuantity: inventorySlice.itemQuantity, 
    setItemQuantity: inventorySlice.setItemQuantity,
    
    salesName: shopSlice.salesName,
    setSalesName: shopSlice.setSalesName,
    newShopName: shopSlice.newShopName, 
    setNewShopName: shopSlice.setNewShopName,
    newShopLocation: shopSlice.newShopLocation, 
    setNewShopLocation: shopSlice.setNewShopLocation,
    newShopOwner: shopSlice.newShopOwner, 
    setNewShopOwner: shopSlice.setNewShopOwner,
    salesPhone: shopSlice.salesPhone, 
    setSalesPhone: shopSlice.setSalesPhone,
    salesEmail: shopSlice.salesEmail, 
    setSalesEmail: shopSlice.setSalesEmail,
    salesPassword: shopSlice.salesPassword, 
    setSalesPassword: shopSlice.setSalesPassword,
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

  // =========================================================================
  // =========================================================================
  // --- SAFE UNIFIED INTERFACE EXPORT ---
  // =========================================================================
  return {
    // 1. Spreads placed at the top so their keys are cleanly evaluated first
    ...cleanInventorySlice,
    ...salesSlice,   
    ...shopSlice,
    ...ledgerSlice, 

    // 2. Overrides/custom bindings explicitly layered last to win property priority
    sales: filteredSalesForMetrics,
    items, 
    dubeRecords: filteredDubeForMetrics, 
    shops: props.shops, 
    users, 
    isLoading,
    activeTab, 
    setActiveTab,
    selectedShopFilter, 
    setSelectedShopFilter,
    toast, 
    clearToast, // 🟢 Add this line here to pass it to your layout rendering layers
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
    handleRegisterSalesperson,
    handleSettleDube: unifiedHandleSettleDube,
    activeShopItems: topFrequentShopItems,
    forms: memoizedForms
  };
}
