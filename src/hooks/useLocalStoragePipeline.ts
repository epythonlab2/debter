// src/hooks/useLocalStoragePipeline.ts
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabaseClient';
import { dbService } from '../core/services/dbService';
import { UserProfile, Shop, Sale, DubeRecord, ToastState } from '../types';
import { ItemRecord } from '../types/inventory'; // Standardized item format
import { 
  INITIAL_SHOPS, 
  INITIAL_USERS, 
  INITIAL_ITEMS, 
  INITIAL_SALES, 
  INITIAL_DUBE_RECORDS 
} from '../constants/initialData';

export type LedgerPeriod = 'today' | 'yesterday' | 'weekly' | 'all';

/**
 * Universal Unified Client-Side Storage Orchestration Hook.
 * Manages foundational offline fallback layers, runtime application state structures,
 * authentication synchronization lifecycle gates, and dynamic layout form inputs.
 * * @param {string} [initialLang='en'] Baseline application localization string fallback.
 * @param {any} [t={}] Global translation resource matrix reference.
 * @returns {Object} Consolidated collection of domain states, bound UI callbacks, and form properties.
 */
export function useLocalStoragePipeline(initialLang: string = 'en', t: any = {}) {
  
  // =========================================================================
  // --- LOCALIZATION PROTOCOLS ---
  // =========================================================================
  
  /** Central localization tracker core */
  const [lang, setLang] = useState<'en' | 'am'>(() => {
    const savedLang = localStorage.getItem('habesha_ledger_lang');
    return (savedLang === 'en' || savedLang === 'am') ? savedLang : 'en';
  });

  /** Updates the user's persistent localization key whenever state adjustments occur */
  useEffect(() => {
    localStorage.setItem('habesha_ledger_lang', lang);
  }, [lang]);

  // =========================================================================
  // --- PRIMARY CACHED CORE DOMAIN STATE REGISTERS ---
  // =========================================================================

  /** Dynamic list of all operating storefront facilities */
  const [shops, setShops] = useState<Shop[]>([]);
  
  /** Verified system administrative and associate records array */
  const [users, setUsers] = useState<UserProfile[]>([]);
  
  /** Unified product catalog repository tracking quantities and base prices */
  const [items, setItems] = useState<ItemRecord[]>([]);
  
  /** Global history logs ledger array */
  const [sales, setSales] = useState<Sale[]>([]);
  
  /** Accounts receivable uncollateralized credit list ledger */
  const [dubeRecords, setDubeRecords] = useState<DubeRecord[]>([]);
  
  /** Baseline target parameters metric marker */
  const [dailyGoal, setDailyGoal] = useState<number>(10000);
  
  /** Profile instance payload matching the present login layer */
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  /** Initial system cache hydration process indicator flag */
  const [loadingPipeline, setLoadingPipeline] = useState(true);
  
  /** Remote operational transaction spinner flag */
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // =========================================================================
  // --- UI LAYOUT FILTER & ROUTER PREFERENCE INDICATORS ---
  // =========================================================================

  /** Navigation index tracking targeted UI sub-panes */
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  /** Selected shop module constraint filter index */
  const [selectedShopFilter, setSelectedShopFilter] = useState<string>('all');
  
  /** Toggle split view switcher index */
  const [ledgerToggle, setLedgerToggle] = useState<'sales' | 'dube'>('sales'); 
  
  /** Input query binding matching ledger searches */
  const [ledgerSearch, setLedgerSearch] = useState<string>('');
  
  /** Input query binding matching inventory stock search utilities */
  const [inventorySearch, setInventorySearch] = useState<string>('');
  
  /** Dynamic notification event state link */
  const [toast, setToast] = useState<ToastState | null>(null);
  
  /** Temporal scale window reference index */
  const [activePeriod, setActivePeriod] = useState<LedgerPeriod>('today'); 

  // =========================================================================
  // --- DYNAMIC CONTROL OVERLAY LAYOUT CONFIGURATIONS ---
  // =========================================================================

  /** Confirm dialog operational state controller */
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    type: 'item' | 'shop' | 'sale' | null;
    targetId: string | null;
  }>({ isOpen: false, type: null, targetId: null });

  /** Shop deployment details layout utility context */
  const [shopModal, setShopModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    data: Shop | null;
  }>({ isOpen: false, mode: 'create', data: null });

  /** Credit resolution ledger execution frame controller */
  const [settleDubeModal, setSettleDubeModal] = useState<{
    isOpen: boolean;
    dubeId: string | number | null; 
  }>({ isOpen: false, dubeId: null });

  /** Inventory form presentation flag */
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  
  /** Inventory form operation target focus switcher */
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // =========================================================================
  // --- INTERFACE FIELD DATA BINDING POOLS ---
  // =========================================================================

  /* --- Staff Enrollment Context Properties --- */
  const [salesName, setSalesName] = useState<string>('');
  const [salesPhone, setSalesPhone] = useState<string>('');
  const [salesEmail, setSalesEmail] = useState<string>('');
  const [salesPassword, setSalesPassword] = useState<string>('');

  /* --- Transaction Formulation Field Elements --- */
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [salePrice, setSalePrice] = useState<string>('');
  // CORRECTED: Aligned to string representation to serve text inputs flawlessly
  const [saleQty, setSaleQty] = useState<string>('1');
  const [customItemName, setCustomItemName] = useState<string>(''); 
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [buyerName, setBuyerName] = useState<string>('');
  const [buyerPhone, setBuyerPhone] = useState<string>('');
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split('T')[0]);

  /* --- Stock Item Specification Inputs --- */
  const [itemName, setItemName] = useState<string>(''); 
  const [newInvPrice, setNewInvPrice] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState<string>(''); 

  /* --- Storefront Initialization Properties --- */
  const [newShopName, setNewShopName] = useState<string>('');
  const [newShopLocation, setNewShopLocation] = useState<string>('');
  const [newShopOwner, setNewShopOwner] = useState<string>('');

  // =========================================================================
  // --- SYSTEM LOGS & STATUS LIGHTWEIGHT UTILITIES ---
  // =========================================================================

  /**
   * Triggers layout banner alert detailing programmatic feedback statements.
   * * @param {string} message Text segment displaying inside the toast payload.
   * @param {'success'|'error'} [type='success'] Validation context sorting classification marker.
   */
  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ id: Date.now(), message, type });
  };

  // =========================================================================
  // --- AUTOMATED BACKGROUND CLOUD NETWORK SYNC PIPELINE ---
  // =========================================================================

  /**
   * Dispatches asynchronous aggregation pipelines fetching transactional histories and inventory states.
   * Mirrors database query strings locally via system localStorage clusters to ensure instant offline bootstrapping capabilities.
   * * @async
   * @function syncCloudDatabases
   * @param {UserProfile|null} [userSession=currentUser] Target user record driving session visibility constraints.
   */
  const syncCloudDatabases = async (userSession: UserProfile | null = currentUser) => {
    if (!userSession) return;
    setIsLoading(true);
    try {
      const isSuperAdmin = userSession.role === 'super_admin';
      
      const shopScope = isSuperAdmin 
        ? (selectedShopFilter === 'all' ? undefined : selectedShopFilter) 
        : (userSession.shop_id || undefined);

      const [cloudShops, cloudItems, cloudSales, cloudDube] = await Promise.all([
        dbService.fetchShops(),
        dbService.fetchItems(shopScope),
        dbService.fetchSales(shopScope),
        dbService.fetchDubeRecords(shopScope)
      ]);

      if (cloudShops) {
        setShops(cloudShops);
        localStorage.setItem('debter_v1_shops', JSON.stringify(cloudShops));
      }
      if (cloudItems) {
        setItems(cloudItems);
        localStorage.setItem('debter_v1_items', JSON.stringify(cloudItems));
      }
      if (cloudSales) {
        setSales(cloudSales);
        localStorage.setItem('debter_v1_sales', JSON.stringify(cloudSales));
      }
      if (cloudDube) {
        setDubeRecords(cloudDube);
        localStorage.setItem('debter_v1_dube', JSON.stringify(cloudDube));
      }

      if (isSuperAdmin || userSession.role === 'admin') {
        const cloudUsers = await dbService.fetchUsers();
        if (cloudUsers) {
          setUsers(cloudUsers);
          localStorage.setItem('debter_v1_users', JSON.stringify(cloudUsers));
        }
      }
    } catch (err: any) {
      console.error("Database sync failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================================
  // --- INTEGRATED COMPONENT LIFECYCLE INTERCEPTORS ---
  // =========================================================================

  /**
   * Root Hydration Engine Lifecycle Hook.
   */
  useEffect(() => {
    async function hydrateAndSync() {
      const localShops = localStorage.getItem('debter_v1_shops');
      const localUsers = localStorage.getItem('debter_v1_users');
      const localItems = localStorage.getItem('debter_v1_items');
      const localSales = localStorage.getItem('debter_v1_sales');
      const localDube = localStorage.getItem('debter_v1_dube');
      const localGoal = localStorage.getItem('debter_v1_goal');
      const localSession = localStorage.getItem('debter_v1_current_user');

      if (localShops) setShops(JSON.parse(localShops));
      else setShops(INITIAL_SHOPS);

      if (localUsers) setUsers(JSON.parse(localUsers));
      else setUsers(INITIAL_USERS);

      if (localItems) setItems(JSON.parse(localItems));
      else setItems(INITIAL_ITEMS);

      if (localSales) setSales(JSON.parse(localSales));
      else setSales(INITIAL_SALES);

      if (localDube) setDubeRecords(JSON.parse(localDube));
      else setDubeRecords(INITIAL_DUBE_RECORDS);

      if (localGoal) setDailyGoal(Number(localGoal));

      let activeSession: UserProfile | null = null;

      if (localSession) {
        try {
          const parsedUser = JSON.parse(localSession);
          const { data: freshDbUser, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', parsedUser.id)
            .maybeSingle();

          if (freshDbUser && !error) {
            activeSession = {
              id: freshDbUser.id,
              full_name: freshDbUser.full_name,
              identifier: freshDbUser.identifier,
              email: freshDbUser.email,
              password: freshDbUser.password,
              role: freshDbUser.role,
              shop_id: freshDbUser.shop_id,
              businessName: freshDbUser.business_name,
              approved: freshDbUser.approved,
              createdBy: freshDbUser.created_by
            };
            localStorage.setItem('debter_v1_current_user', JSON.stringify(activeSession));
            setCurrentUser(activeSession);
            
            if (activeSession?.role === 'sales') {
              setActiveTab('entry');
            }
          } else {
            activeSession = parsedUser;
            setCurrentUser(parsedUser);
            if (parsedUser && parsedUser.role === 'sales') {
              setActiveTab('entry');
            }
          }
        } catch {
          setCurrentUser(null);
        }
      }
      
      setLoadingPipeline(false);
      if (activeSession) {
        await syncCloudDatabases(activeSession);
      }
    }

    hydrateAndSync();
  }, []);

  /** Listens for administrative shop filter toggles to execute background query shifts */
  useEffect(() => {
    if (currentUser) syncCloudDatabases();
  }, [selectedShopFilter]);

  /** Listens for item selection mutations during checkout processing */
  useEffect(() => {
    if (selectedItemId && selectedItemId !== 'custom') {
      const match = items.find(i => String(i.id) === String(selectedItemId));
      if (match) setSalePrice(String(match.default_price));
    } else {
      setSalePrice('');
    }
  }, [selectedItemId, items]);

  // =========================================================================
  // --- DATA MUTATION CALLBACK METRIC HANDLERS ---
  // =========================================================================

  /**
   * Modifies daily performance thresholds and saves configurations to the local disk.
   */
  const handleUpdateGoal = (newGoal: number) => {
    setDailyGoal(newGoal);
    localStorage.setItem('debter_v1_goal', String(newGoal));
  };

  /**
   * Validates and registers sales transaction logs across database connections.
   */
  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    let finalItemName = customItemName;
    if (selectedItemId !== 'custom') {
      const activeItem = items.find(i => String(i.id) === String(selectedItemId));
      if (!activeItem) return;
      finalItemName = activeItem.item_name || '';
    }

    const dbPaymentMethod = (paymentMethod === 'dube') ? 'dube' : 'cash';
    const saleId = `sale-${Date.now()}`;
    const numericQty = Number(saleQty || 1);

    const salePayload = {
      id: saleId,
      item_id: selectedItemId === 'custom' ? '' : selectedItemId,
      item_name: finalItemName,
      quantity: numericQty,
      price_sold: Number(salePrice),
      sale_date: saleDate,
      shop_id: currentUser.shop_id || '',
      payment_method: dbPaymentMethod
    };

    const dubeBuyerName = buyerName;
    const dubeBuyerPhone = buyerPhone;

    const updatedSalesArray = [salePayload, ...sales];
    setSales(updatedSalesArray);
    localStorage.setItem('debter_v1_sales', JSON.stringify(updatedSalesArray));

  

    let updatedDubeArray = [...dubeRecords];
    if (dbPaymentMethod === 'dube') {
      const newDubeRecord: DubeRecord = {
        id: `dube-${Date.now()}`,
        sale_id: saleId,
        buyer_name: dubeBuyerName,
        buyer_phone: dubeBuyerPhone,
        amount: Number(salePrice) * numericQty,
        status: 'unpaid' as const,
        created_at: new Date().toISOString(),
        // 🟢 FIX: Converts string | null gracefully to a strict string primitive
        shop_id: currentUser.shop_id ?? "" 
      };
      updatedDubeArray = [newDubeRecord, ...dubeRecords];
      setDubeRecords(updatedDubeArray);
      localStorage.setItem('debter_v1_dube', JSON.stringify(updatedDubeArray));
    }

    setSelectedItemId('');
    setSalePrice('');
    setSaleQty('1');
    setCustomItemName('');
    setBuyerName(''); 
    setBuyerPhone('');

    triggerToast(lang === 'en' ? "Saved offline (Pending Sync)" : "ከመስመር ውጭ ተቀምጧል!", "success");

    try {
      const dubePayload = dbPaymentMethod === 'dube' 
        ? { buyer_name: dubeBuyerName, buyer_phone: dubeBuyerPhone } 
        : undefined;
      
      await dbService.insertSaleWithDube(salePayload, dubePayload);
      triggerToast(lang === 'en' ? "Transaction synchronized with cloud!" : "ሽያጩ ተመሳስሏል!", "success");
      await syncCloudDatabases();
      
    } catch (networkError: any) {
      console.warn(
        "Cloud insertion deferred. Client operating inside offline mode. Payload cached successfully:", 
        networkError.message || networkError
      );
    }
  };

  /**
   * Commits inventory additions or adjustments across structural system indices.
   */
  const handleRegisterItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.shop_id) return;

    const parsedQuantity = parseInt(itemQuantity, 10);
    const finalQuantity = isNaN(parsedQuantity) || parsedQuantity <= 0 ? 1 : parsedQuantity;

    try {
      if (modalMode === 'edit' && selectedItemId) {
        await dbService.updateItem(selectedItemId, {
          item_name: itemName.trim(),
          default_price: Number(newInvPrice),
          quantity: finalQuantity
        });
        triggerToast(lang === 'en' ? "Item updated!" : "ዕቃው ተስተካክሏል!", "success");
      } else {
        await dbService.createItem({
          id: crypto.randomUUID(),
          item_name: itemName.trim(),
          default_price: Number(newInvPrice),
          shop_id: currentUser.shop_id,
          quantity: finalQuantity 
        });
        triggerToast(lang === 'en' ? "Item added!" : "ዕቃው ገብቷል!", "success");
      }

      setItemName('');
      setNewInvPrice('');
      setItemQuantity('');
      setSelectedItemId('');
      setIsModalOpen(false);
      await syncCloudDatabases();
    } catch (err: any) {
      triggerToast(err.message, "error");
    }
  };

  /**
   * Initializes a physical retail shop partition framework.
   */
  const handleSaveShop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // CORRECTED: 'owner_id' swapped to 'ownerId' to align flawlessly with the interface contract
      await dbService.createShop({
        id: `shop-${Date.now()}`,
        name: newShopName.trim(),
        location: newShopLocation.trim(),
        ownerId: newShopOwner || null
      });
      triggerToast("Shop initialized successfully", "success");
      setNewShopName('');
      setNewShopLocation('');
      setNewShopOwner('');
      setShopModal({ isOpen: false, mode: 'create', data: null });
      await syncCloudDatabases();
    } catch (err: any) {
      triggerToast(err.message, "error");
    }
  };

  /**
   * Alters status validation properties for platform managers.
   */
  const handleApproveOwner = async (userId: string, targetStatus: boolean) => {
    try {
      const { error } = await supabase.from('users').update({ approved: targetStatus }).eq('id', userId);
      if (error) throw error;
      triggerToast("Status updated successfully", "success");
      await syncCloudDatabases();
    } catch (err: any) {
      triggerToast(err.message, "error");
    }
  };

  /**
   * Registers a new salesperson profile while handling role-based shop scoping.
   */
  const handleRegisterSalesperson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const currentName = salesName.trim();
    if (!currentName) {
      triggerToast("Full name is required to register staff profiles.", "error");
      return;
    }

    const targetShopId = currentUser.role === 'super_admin'
      ? (selectedShopFilter !== 'all' ? selectedShopFilter : null)
      : currentUser.shop_id;

    if (!targetShopId && currentUser.role === 'super_admin') {
      triggerToast("Super Admins must select a specific shop branch from the active dashboard filter.", "error");
      return;
    }
    
    try {
      const { error } = await supabase.from('users').insert([{
        id: `usr-${Date.now()}`, 
        full_name: currentName, 
        identifier: salesPhone.trim() || `09${Math.floor(10000000 + Math.random() * 90000000)}`,
        password: salesPassword || '123456',
        email: salesEmail.trim() || null,
        role: 'sales',
        shop_id: targetShopId,
        approved: true,
        created_by: currentUser.id
      }]);
      
      if (error) throw error;
      
      triggerToast("Salesperson profile registered!", "success");
      
      setSalesName('');
      setSalesPhone('');
      setSalesEmail('');
      setSalesPassword('');
      
      await syncCloudDatabases();
    } catch (err: any) {
      triggerToast(err.message, "error");
    }
  };

  /** Clears authentication tokens from client session memories and restarts view components */
  const handleLogout = () => {
    localStorage.removeItem('debter_v1_current_user');
    window.location.reload();
  };

  /** Handles modal configuration and state hydration rules for storefront modifications */
  const handleOpenShopModal = (mode: 'create' | 'edit', data: any = null) => {
    setShopModal({ isOpen: true, mode, data });
    if (mode === 'edit' && data) {
      setNewShopName(data.name || '');
      setNewShopLocation(data.location || '');
      setNewShopOwner(data.owner_id || data.ownerId || '');
    }
  };

  // =========================================================================
  // --- DERIVED MEMOIZED TRANSFORMATION PIPELINES ---
  // =========================================================================

  /** Filtered collection of system users holding explicit administrative access clearance keys */
  const potentialOwners = useMemo(() => users.filter(u => u.role === 'admin'), [users]);
  
  /** Filtered items list mapped exclusively to the active manager's storefront division coordinates */
  const activeShopItems = useMemo(() => items.filter(i => String(i.shop_id) === String(currentUser?.shop_id)), [items, currentUser]);

  return {
    lang,
    setLang,
    shops, setShops,
    users, setUsers,
    items, setItems,
    sales, setSales,
    dubeRecords, setDubeRecords,
    dailyGoal, handleUpdateGoal,
    currentUser, setCurrentUser,
    loadingPipeline, isLoading,
    activeTab, setActiveTab,
    selectedShopFilter, setSelectedShopFilter,
    ledgerToggle, setLedgerToggle,
    ledgerSearch, setLedgerSearch,
    inventorySearch, setInventorySearch,
    toast,
    activePeriod, setActivePeriod, 
    deleteConfirmModal, setDeleteConfirmModal,
    shopModal, setShopModal,
    settleDubeModal, setSettleDubeModal,
    potentialOwners, activeShopItems,
    
    isModalOpen, setIsModalOpen,
    modalMode, setModalMode,
    
    salesName, setSalesName,
    salesPhone, setSalesPhone,
    salesEmail, setSalesEmail,
    salesPassword, setSalesPassword,

    selectedItemId, setSelectedItemId,
    salePrice, setSalePrice,
    saleQty, setSaleQty,
    customItemName, setCustomItemName,
    paymentMethod, setPaymentMethod,
    buyerName, setBuyerName,
    buyerPhone, setBuyerPhone,
    saleDate, setSaleDate,
    
    itemName, setItemName,
    newInvPrice, setNewInvPrice,
    itemQuantity, setItemQuantity, 
    
    newShopName, setNewShopName,
    newShopLocation, setNewShopLocation,
    newShopOwner, setNewShopOwner,
    
    handleRecordSale,
    handleRegisterItem, 
    handleSaveShop,
    handleApproveOwner,
    handleRegisterSalesperson,
    handleLogout,
    handleOpenShopModal,
    syncCloudDatabases
  };
}
