// /hooks/useLocalStragePipeline
import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { dbService } from '../core/services/dbService';
import { UserProfile, Shop, Sale, DubeRecord, ToastState, PurchaseRecord } from '../types';
import { ItemRecord } from '../types/inventory';
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
 * Hardened with defensive async race-condition shields and deterministic hydration pipelines.
 */
export function useLocalStoragePipeline(initialLang: string = 'en', t: any = {}) {
  
  // =========================================================================
  // --- LOCALIZATION PROTOCOLS ---
  // =========================================================================
  
  const [lang, setLang] = useState<'en' | 'am'>(() => {
    const savedLang = localStorage.getItem('habesha_ledger_lang');
    return (savedLang === 'en' || savedLang === 'am') ? savedLang : 'en';
  });

  useEffect(() => {
    localStorage.setItem('habesha_ledger_lang', lang);
  }, [lang]);

  // =========================================================================
  // --- PRIMARY CACHED CORE DOMAIN STATE REGISTERS ---
  // =========================================================================

  const [shops, setShops] = useState<Shop[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [dubeRecords, setDubeRecords] = useState<DubeRecord[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [dailyGoal, setDailyGoal] = useState<number>(10000);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loadingPipeline, setLoadingPipeline] = useState(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 🟢 OFFLINE SYNCHRONIZATION TRANSACTION QUEUE STATE
  const [offlineSalesQueue, setOfflineSalesQueue] = useState<any[]>(() => {
    const savedQueue = localStorage.getItem('debter_v1_offline_queue');
    return savedQueue ? JSON.parse(savedQueue) : [];
  });

  // =========================================================================
  // --- UI LAYOUT FILTER & ROUTER PREFERENCE INDICATORS ---
  // =========================================================================

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedShopFilter, setSelectedShopFilter] = useState<string>('all');
  const [ledgerToggle, setLedgerToggle] = useState<'sales' | 'dube'>('sales'); 
  const [ledgerSearch, setLedgerSearch] = useState<string>('');
  const [inventorySearch, setInventorySearch] = useState<string>('');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [activePeriod, setActivePeriod] = useState<LedgerPeriod>('today'); 

  // Refs used to provide reliable atomic context reading within asynchronous closures
  const filterRef = useRef(selectedShopFilter);
  useEffect(() => { filterRef.current = selectedShopFilter; }, [selectedShopFilter]);

  // =========================================================================
  // --- DYNAMIC CONTROL OVERLAY LAYOUT CONFIGURATIONS ---
  // =========================================================================

  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    type: 'item' | 'shop' | 'sale' | null;
    targetId: string | null;
  }>({ isOpen: false, type: null, targetId: null });

  const [shopModal, setShopModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    data: Shop | null;
  }>({ isOpen: false, mode: 'create', data: null });

  const [settleDubeModal, setSettleDubeModal] = useState<{
    isOpen: boolean;
    dubeId: string | number | null; 
  }>({ isOpen: false, dubeId: null });

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // =========================================================================
  // --- INTERFACE FIELD DATA BINDING POOLS ---
  // =========================================================================

  const [salesName, setSalesName] = useState<string>('');
  const [salesPhone, setSalesPhone] = useState<string>('');
  const [salesEmail, setSalesEmail] = useState<string>('');
  const [salesPassword, setSalesPassword] = useState<string>('');

  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [salePrice, setSalePrice] = useState<string>('');
  const [saleQty, setSaleQty] = useState<string>('1');
  const [customItemName, setCustomItemName] = useState<string>(''); 
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [buyerName, setBuyerName] = useState<string>('');
  const [buyerPhone, setBuyerPhone] = useState<string>('');
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [itemName, setItemName] = useState<string>(''); 
  const [newInvPrice, setNewInvPrice] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState<string>(''); 

  const [newShopName, setNewShopName] = useState<string>('');
  const [newShopLocation, setNewShopLocation] = useState<string>('');
  const [newShopOwner, setNewShopOwner] = useState<string>('');

  // =========================================================================
  // --- SYSTEM LOGS & STATUS LIGHTWEIGHT UTILITIES ---
  // =========================================================================

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ id: Date.now(), message, type });
  };

  // =========================================================================
  // --- AUTOMATED BACKGROUND CLOUD NETWORK SYNC PIPELINE ---
  // =========================================================================

  const syncCloudDatabases = async (
    userSession: UserProfile | null = currentUser, 
    forcedFilter?: string
  ) => {
    if (!userSession) return;
    
    // 🟢 OFFLINE SHORT-CIRCUIT
    if (typeof window !== 'undefined' && !navigator.onLine) {
      console.log("[Sync Pipeline]: System is offline. Suppressing background remote queries.");
      return;
    }

    setIsLoading(true);
    try {
      const isSuperAdmin = userSession.role === 'super_admin';
      const targetFilter = forcedFilter ?? filterRef.current;
      
      const shopScope = isSuperAdmin 
        ? (targetFilter === 'all' ? undefined : targetFilter) 
        : (userSession.shop_id || undefined);

      // 🟢 FETCH PURCHASES UNCONDITIONALLY WITH SHOPSCOPE (ALLOWS UNDEFINED FOR ALL SHOPS)
      const [cloudShops, cloudItems, cloudSales, cloudDube, cloudPurchases] = await Promise.all([
        dbService.fetchShops(),
        dbService.fetchItems(shopScope),
        dbService.fetchSales(shopScope),
        dbService.fetchDubeRecords(shopScope),
        dbService.fetchPurchases({shopId:shopScope})
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
        const savedQueueRaw = localStorage.getItem('debter_v1_offline_queue');
        const activeMemoryQueue = savedQueueRaw ? JSON.parse(savedQueueRaw) : [];
        const integratedSales = [...activeMemoryQueue, ...cloudSales];
        
        setSales(integratedSales);
        localStorage.setItem('debter_v1_sales', JSON.stringify(integratedSales));
      }
      
      if (cloudDube) {
        setDubeRecords(cloudDube);
        localStorage.setItem('debter_v1_dube', JSON.stringify(cloudDube));
      }

      // 🟢 PERSIST PURCHASES TO STATE & LOCAL STORAGE
      if (cloudPurchases) {
        setPurchases(cloudPurchases);
        localStorage.setItem('debter_v1_purchases', JSON.stringify(cloudPurchases));
      }

      if (isSuperAdmin || userSession.role === 'admin') {
        const cloudUsers = await dbService.fetchUsers();
        if (cloudUsers) {
          setUsers(cloudUsers);
          localStorage.setItem('debter_v1_users', JSON.stringify(cloudUsers));
        }
      }
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch') || err?.name === 'TypeError') {
        console.warn("[Sync Pipeline]: Server unreachable during periodic heartbeat check. Operating securely out of local storage mirror caches.");
      } else {
        console.error("Database sync pipeline failure:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================================
  // --- AUTOMATED ONLINE BACKGROUND QUEUE SYNC WORKER ---
  // =========================================================================
  useEffect(() => {
    const processOfflineQueue = async () => {
      if (offlineSalesQueue.length === 0 || !navigator.onLine || isLoading) return;
      
      console.log("Device connectivity re-established. Processing pending local queue...");
      const workingQueue = [...offlineSalesQueue];
      
      for (const pendingSale of workingQueue) {
        try {
          const dbPaymentMethod = pendingSale.payment_method === 'dube' ? 'dube' : 'cash';
          const dubePayload = dbPaymentMethod === 'dube' 
            ? { buyer_name: pendingSale.buyer_name, buyer_phone: pendingSale.buyer_phone } 
            : undefined;

          const cleanSalePayload = {
            id: pendingSale.id,
            item_id: pendingSale.item_id,
            item_name: pendingSale.item_name,
            quantity: pendingSale.quantity,
            price_sold: pendingSale.price_sold,
            sale_date: pendingSale.sale_date,
            shop_id: pendingSale.shop_id,
            payment_method: dbPaymentMethod
          };

          await dbService.insertSaleWithDube(cleanSalePayload, dubePayload);
          
          setOfflineSalesQueue(prev => {
            const nextQueue = prev.filter(item => item.id !== pendingSale.id);
            localStorage.setItem('debter_v1_offline_queue', JSON.stringify(nextQueue));
            return nextQueue;
          });
        } catch (err) {
          console.error("Halting automated queue execution. Server dropped connection again:", err);
          break;
        }
      }
      await syncCloudDatabases(currentUser);
    };

    window.addEventListener('online', processOfflineQueue);
    if (navigator.onLine) { processOfflineQueue(); }
    
    return () => window.removeEventListener('online', processOfflineQueue);
  }, [offlineSalesQueue, currentUser]);

  // =========================================================================
  // --- INTEGRATED COMPONENT LIFECYCLE INTERCEPTORS ---
  // =========================================================================

  /** Root Cache Hydration Architecture Engine Lifecycle Gate */
  useEffect(() => {
    let isMounted = true;
    
    async function hydrateAndSync() {
      const localShops = localStorage.getItem('debter_v1_shops');
      const localUsers = localStorage.getItem('debter_v1_users');
      const localItems = localStorage.getItem('debter_v1_items');
      const localSales = localStorage.getItem('debter_v1_sales');
      const localDube = localStorage.getItem('debter_v1_dube');
      const localPurchases = localStorage.getItem('debter_v1_purchases');
      const localGoal = localStorage.getItem('debter_v1_goal');
      const localSession = localStorage.getItem('debter_v1_current_user');

      if (!isMounted) return;

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

      // 🟢 HYDRATE PURCHASES WITH FALLBACK TO EMPTY ARRAY
      if (localPurchases) setPurchases(JSON.parse(localPurchases));
      else setPurchases([]);

      if (localGoal) setDailyGoal(Number(localGoal));

      let activeSession: UserProfile | null = null;

      if (localSession) {
        try {
          const parsedUser = JSON.parse(localSession);

          if (parsedUser && (parsedUser.approved === false || parsedUser.is_approve === false)) {
            localStorage.removeItem('debter_v1_current_user');
            setCurrentUser(null);
            setLoadingPipeline(false);
            return;
          }

          const { data: freshDbUser, error } = await supabase
            .from('users')
            .select(`*, shops (location)`)
            .eq('id', parsedUser.id)
            .maybeSingle();

          if (freshDbUser && !error) {
            if (freshDbUser.approved === false || freshDbUser.is_approve === false) {
              localStorage.removeItem('debter_v1_current_user');
              setCurrentUser(null);
              setLoadingPipeline(false);
              return; 
            }

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
              createdBy: freshDbUser.created_by,
              location: freshDbUser.shops?.location
            };
            
            localStorage.setItem('debter_v1_current_user', JSON.stringify(activeSession));
            setCurrentUser(activeSession);
            
            if (activeSession.role === 'sales') {
              setActiveTab('entry');
            }
          } else {
            if (parsedUser && (parsedUser.approved === true || parsedUser.role === 'super_admin')) {
              activeSession = parsedUser;
              setCurrentUser(parsedUser);
              if (parsedUser.role === 'sales') {
                setActiveTab('entry');
              }
            } else {
              localStorage.removeItem('debter_v1_current_user');
              setCurrentUser(null);
            }
          }
        } catch (err) {
          console.error("Hydration guard structural validation failure:", err);
          localStorage.removeItem('debter_v1_current_user');
          setCurrentUser(null);
        }
      }
      
      setLoadingPipeline(false);
      if (activeSession) {
        await syncCloudDatabases(activeSession, filterRef.current);
      }
    }

    hydrateAndSync();
    return () => { isMounted = false; };
  }, []);

  /** Listens for administrative shop filter toggles equipped with clean sync guards */
  useEffect(() => {
    if (currentUser) {
      syncCloudDatabases(currentUser, selectedShopFilter);
    }
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

  const handleUpdateGoal = (newGoal: number) => {
    setDailyGoal(newGoal);
    localStorage.setItem('debter_v1_goal', String(newGoal));
  };

  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) return;

    let finalItemName = customItemName.trim();
    let computedItemId = selectedItemId;

    if (!selectedItemId || selectedItemId === 'custom') {
      computedItemId = `item-${Date.now()}`;
      if (!finalItemName) finalItemName = "Generic Item";
      
      const newLocalProduct: ItemRecord = {
        id: computedItemId,
        item_name: finalItemName,
        default_price: Number(salePrice) || 0,
        shop_id: currentUser.shop_id || '',
        quantity: Number(saleQty || 1)
      };
      setItems(prev => [newLocalProduct, ...prev]);
    } else {
      const activeItem = items.find(i => String(i.id) === String(selectedItemId));
      if (activeItem) {
        finalItemName = activeItem.item_name || '';
      }
    }

    const dbPaymentMethod = (paymentMethod === 'dube') ? 'dube' : 'cash';
    const saleId = `sale-${Date.now()}`;
    const numericQty = Number(saleQty || 1);

    const salePayload = {
      id: saleId,
      item_id: computedItemId,
      item_name: finalItemName,
      quantity: numericQty,
      price_sold: Number(salePrice) || 0,
      sale_date: saleDate,
      shop_id: currentUser.shop_id || '',
      payment_method: dbPaymentMethod
    };

    const localUIRecord = {
      ...salePayload,
      buyer_name: buyerName,
      buyer_phone: buyerPhone,
      is_offline_pending: true 
    };

    setSales(prevSales => {
      const updated = [localUIRecord, ...prevSales];
      localStorage.setItem('debter_v1_sales', JSON.stringify(updated));
      return updated;
    });

    if (dbPaymentMethod === 'dube') {
      setDubeRecords(prevDube => {
        const newDubeRecord: DubeRecord = {
          id: `dube-${Date.now()}`,
          sale_id: saleId,
          buyer_name: buyerName,
          buyer_phone: buyerPhone,
          amount: (Number(salePrice) || 0) * numericQty,
          status: 'unpaid' as const,
          created_at: new Date().toISOString(),
          shop_id: currentUser.shop_id ?? "" 
        };
        const updated = [newDubeRecord, ...prevDube];
        localStorage.setItem('debter_v1_dube', JSON.stringify(updated));
        return updated;
      });
    }

    setSelectedItemId('');
    setSalePrice('');
    setSaleQty('1');
    setCustomItemName('');
    setBuyerName(''); 
    setBuyerPhone('');

    triggerToast(lang === 'en' ? "Saved offline (Pending Sync)" : "ከመስመር ውጭ ተቀምጧል!", "success");

    try {
      if (!selectedItemId || selectedItemId === 'custom') {
        await dbService.createItem({
          id: computedItemId,
          item_name: finalItemName,
          default_price: Number(salePrice) || 0,
          shop_id: currentUser.shop_id || '',
          quantity: 100 
        });
      }

      const dubePayload = dbPaymentMethod === 'dube' 
        ? { buyer_name: buyerName, buyer_phone: buyerPhone } 
        : undefined;
      
      await dbService.insertSaleWithDube(salePayload, dubePayload);
      triggerToast(lang === 'en' ? "Transaction synchronized with cloud!" : "ሽያጩ ተመሳስሏል!", "success");
      
    } catch (networkError: any) {
      console.warn("Cloud push failed. Stashing inside persistent offline cache map queue.");
      setOfflineSalesQueue(prev => {
        const nextQueue = [...prev, localUIRecord];
        localStorage.setItem('debter_v1_offline_queue', JSON.stringify(nextQueue));
        return nextQueue;
      });
    }
  };

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
      await syncCloudDatabases(currentUser);
    } catch (err: any) {
      triggerToast(err.message, "error");
    }
  };

  const handleSaveShop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
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
      await syncCloudDatabases(currentUser);
    } catch (err: any) {
      triggerToast(err.message, "error");
    }
  };

  const handleApproveOwner = async (userId: string, targetStatus: boolean) => {
    try {
      const { error } = await supabase.from('users').update({ approved: targetStatus }).eq('id', userId);
      if (error) throw error;
      triggerToast("Status updated successfully", "success");
      await syncCloudDatabases(currentUser);
    } catch (err: any) {
      triggerToast(err.message, "error");
    }
  };

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
      
      await syncCloudDatabases(currentUser);
    } catch (err: any) {
      triggerToast(err.message, "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('debter_v1_current_user');
    setCurrentUser(null);
    window.location.reload();
  };

  const handleOpenShopModal = (mode: 'create' | 'edit', data: any = null) => {
    setShopModal({ isOpen: true, mode, data });
    if (mode === 'edit' && data) {
      setNewShopName(data.name || '');
      setNewShopLocation(data.location || '');
      setNewShopOwner(data.owner_id || data.ownerId || '');
    }
  };
  
  const handleUpdateProfile = async (data: { fullName: string; shopName: string; email: string; location: string }) => {
    if (!currentUser?.id) return;
    setIsLoading(true);
    try {
      const updatedUser = await dbService.updateUserProfile(currentUser.id, data);
      setCurrentUser(updatedUser);
      localStorage.setItem('debter_v1_current_user', JSON.stringify(updatedUser));
      await syncCloudDatabases(updatedUser);
    } catch (err: any) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
    if (!currentUser?.id) return;
    setIsLoading(true);
    try {
      await dbService.updateAccountPassword(currentUser.id, currentPassword, newPassword);
      
      const secureUserSession = { ...currentUser, must_change_password: false };
      setCurrentUser(secureUserSession);
      localStorage.setItem('debter_v1_current_user', JSON.stringify(secureUserSession));
    } catch (err: any) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================================
  // --- DERIVED MEMOIZED TRANSFORMATION PIPELINES ---
  // =========================================================================

  const potentialOwners = useMemo(() => users.filter(u => u.role === 'admin'), [users]);
  
  const activeShopItems = useMemo(() => items.filter(i => String(i.shop_id) === String(currentUser?.shop_id)), [items, currentUser]);

  return {
    lang, setLang,
    shops, setShops,
    users, setUsers,
    items, setItems,
    sales, setSales,
    dubeRecords, setDubeRecords,
    purchases, setPurchases, 
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
    handleUpdateProfile,
    handleUpdatePassword,
    handleRecordSale,
    handleRegisterItem, 
    handleSaveShop,
    handleApproveOwner,
    handleRegisterSalesperson,
    handleLogout,
    handleOpenShopModal,
    syncCloudDatabases: () => syncCloudDatabases(currentUser)
  };
}