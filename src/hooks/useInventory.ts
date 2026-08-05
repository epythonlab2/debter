// src/hooks/useInventory.ts
import { useState, useMemo, useCallback } from 'react';
import { dbService } from '../core/services/dbService';
import { UserProfile } from '../types';
import { ItemRecord, InventoryTranslation, UnitOfMeasure } from '../types/inventory';
import { BatchItemInput } from '../components/inventory/InventoryModal';

interface UseInventoryProps {
  t: any;
  currentUser: UserProfile | null;
  items: ItemRecord[];
  setItems: React.Dispatch<React.SetStateAction<ItemRecord[]>>;
  selectedShopFilter: string;
  syncCloudDatabases: () => Promise<void>;
  triggerToast: (msg: string, type?: 'success' | 'error') => void;
  lang: string;
}

export interface RegisterItemFormData {
  itemName?: string;
  newInvPrice?: string | number;
  itemQuantity?: string | number;
  unitCost?: string | number;
  unit?: UnitOfMeasure;
  minStockLevel?: string | number;
}

/**
 * ============================================================================
 * CUSTOM HOOK: useInventory
 * ============================================================================
 * Encapsulates the core transactional and view state management for shop 
 * inventories. Coordinates local reactive arrays, form validations, fuzzy 
 * client-side searches, row pagination limits, and cross-platform syncing.
 */
export function useInventory({
  currentUser,
  items,
  setItems,
  selectedShopFilter,
  syncCloudDatabases,
  triggerToast,
  t
}: UseInventoryProps) {
  
  /* --------------------------------------------------------------------------
     1. UI ACTION & MODAL LAYOUT STATE
     -------------------------------------------------------------------------- */
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  /* --------------------------------------------------------------------------
     2. LIVE INVENTORY FORM CONTROLS
     -------------------------------------------------------------------------- */
  const [inventorySearch, setInventorySearch] = useState<string>('');
  const [itemName, setItemName] = useState<string>('');
  const [newInvPrice, setNewInvPrice] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState<string>('');
  
  // Extended SKU & Ledger state controls
  const [unitCost, setUnitCost] = useState<string>('');
  const [unit, setUnit] = useState<UnitOfMeasure>('pcs');
  const [minStockLevel, setMinStockLevel] = useState<string>('5');

  // Pagination limit state
  const [pageSize, setPageSize] = useState<number>(10);

  /* --------------------------------------------------------------------------
     3. FORM STATE RESET UTILITY
     -------------------------------------------------------------------------- */
  const resetFormFields = useCallback(() => {
    setItemName('');
    setNewInvPrice('');
    setItemQuantity('');
    setUnitCost('');
    setUnit('pcs');
    setMinStockLevel('5');
    setSelectedItemId(null);
  }, []);

  /**
   * Pre-populates form controls for editing an existing item record.
   */
  const handleEditInit = useCallback((item: ItemRecord) => {
    setSelectedItemId(item.id);
    setItemName(item.item_name || '');
    setNewInvPrice(item.default_price?.toString() || '');
    setItemQuantity(item.quantity?.toString() || '0');
    setUnitCost(item.cost_price?.toString() || '');
    setUnit(item.unit || 'pcs');
    setMinStockLevel(item.min_stock_level?.toString() || '5');
    setModalMode('edit');
    setIsModalOpen(true);
  }, []);

  /**
   * Safe wrapper to open modal in create mode with blank state.
   */
  const handleCreateInit = useCallback(() => {
    resetFormFields();
    setModalMode('create');
    setIsModalOpen(true);
  }, [resetFormFields]);

  /* --------------------------------------------------------------------------
     4. PERSISTENCE & RESOURCE REGISTRATION HANDLERS
     -------------------------------------------------------------------------- */

  /**
   * Single Item Registration (Used by Edit Mode)
   */
  const handleRegisterItem = async (e: React.FormEvent, explicitId?: string | null) => {
    e.preventDefault();
    
    // Guard Clause: Reject operations if user lacks an active shop scope
    if (!currentUser?.shop_id) {
      const errMessage = t.errorGeneric || "Shop assignment missing. Action aborted.";
      console.error("[useInventory:handleRegisterItem] Shop assignment missing:", { currentUser });
      triggerToast(errMessage, "error");
      return;
    }

    // Input sanitization and type parsing
    const cleanName = itemName.trim();
    const cleanPrice = parseFloat(newInvPrice);
    const parsedQty = parseInt(itemQuantity, 10);
    const finalQuantity = isNaN(parsedQty) || parsedQty < 0 ? 0 : parsedQty;
    
    const parsedCost = unitCost ? parseFloat(unitCost) : undefined;
    const parsedMinStock = minStockLevel ? parseInt(minStockLevel, 10) : undefined;

    // Validate core numerical and textual inputs
    if (!cleanName || isNaN(cleanPrice) || cleanPrice < 0) {
      const errMessage = t.invalidPrice || "Please enter a valid product name and price.";
      console.error("[useInventory:handleRegisterItem] Validation failed:", { cleanName, newInvPrice, cleanPrice });
      triggerToast(errMessage, "error");
      return;
    }

    // 1. Check for collision inside current shop's local inventory scope
    const existingProductMatch = items.find(
      item => 
        item.item_name.toLowerCase() === cleanName.toLowerCase() && 
        item.shop_id === currentUser.shop_id
    );

    // 2. Resolve operational ID target pointer
    const targetId = explicitId !== undefined ? explicitId : (modalMode === 'create' ? (existingProductMatch?.id || null) : selectedItemId);

    try {
      if (targetId) {
        // 🟢 UPDATE PATH: Target existing row (handles explicit edit & duplicate creation merge)
        const existingItem = items.find(i => i.id === targetId);
        
        const updatedQuantity = modalMode === 'create' 
          ? (existingItem ? (existingItem.quantity ?? 0) + finalQuantity : finalQuantity)
          : finalQuantity;

        const updatePayload = {
          item_name: cleanName,
          default_price: cleanPrice,
          quantity: updatedQuantity,
          cost_price: parsedCost,
          unit: unit,
          min_stock_level: parsedMinStock,
          updated_at: new Date().toISOString()
        };

        await dbService.updateItem(targetId, updatePayload);

        // Update local React state while preserving existing non-mutated fields
        setItems(prev => {
          const filtered = prev.filter(item => item.id !== targetId);
          const baseItem = existingItem || {} as ItemRecord;
          const updatedRecord: ItemRecord = {
            ...baseItem,
            ...updatePayload,
            id: targetId,
            shop_id: currentUser.shop_id ?? undefined,
          };
          return [updatedRecord, ...filtered];
        });
        
        const successMsg = modalMode === 'create'
          ? `${cleanName} ${t.alreadyExist || "already exists."} ${t.addExistingStock || "Stock updated."}`
          : (t.changesSavedSuccessfully || "Changes saved successfully.");
          
        triggerToast(successMsg, "success");

      } else {
        // 🟢 CREATE PATH: Fresh item creation
        const newItem: ItemRecord = {
          id: crypto.randomUUID(), 
          item_name: cleanName,
          default_price: cleanPrice,
          quantity: finalQuantity,
          cost_price: parsedCost,
          unit: unit,
          min_stock_level: parsedMinStock,
          shop_id: currentUser.shop_id ?? undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Write record to database engine
        await dbService.createItem(newItem);
        
        // Prepend new item to active reactive state
        setItems(prev => [newItem, ...prev.filter(item => item.id !== newItem.id)]);
        
        triggerToast(t.successRegister || "Item registered successfully!", "success");
      }
      
      // Cleanup form and modal state post execution
      resetFormFields();
      setIsModalOpen(false);
      
      // Async trigger for remote synchronization pipeline
      await syncCloudDatabases();
    } catch (err: any) {
      console.error("[useInventory:handleRegisterItem] Failed to persist item modifications:", err);
      triggerToast(err.message || "Failed to persist item modifications.", "error");
    }
  };

  /**
   * Batch Item Registration Handler (Used by Create Mode Matrix)
   */
  const handleBatchRegisterItems = async (batchItems: BatchItemInput[]) => {
    if (!currentUser?.shop_id) {
      const errMessage = t.errorGeneric || "Shop assignment missing. Action aborted.";
      console.error("[useInventory:handleBatchRegisterItems] Shop assignment missing:", { currentUser });
      triggerToast(errMessage, "error");
      return;
    }

    try {
      let updatedItemsList = [...items];

      for (const row of batchItems) {
        const cleanName = row.item_name.trim();
        const cleanPrice = parseFloat(row.default_price);
        const parsedQty = parseInt(row.quantity, 10);
        const finalQuantity = isNaN(parsedQty) || parsedQty < 0 ? 0 : parsedQty;
        
        const parsedCost = row.cost_price ? parseFloat(row.cost_price) : undefined;
        const parsedMinStock = row.min_stock_level ? parseInt(row.min_stock_level, 10) : undefined;

        if (!cleanName || isNaN(cleanPrice) || cleanPrice < 0) continue;

        // Check if item exists in current shop
        const existingMatch = updatedItemsList.find(
          i => i.item_name.toLowerCase() === cleanName.toLowerCase() && i.shop_id === currentUser.shop_id
        );

        if (existingMatch) {
          // Merge stock into existing product
          const newQty = (existingMatch.quantity ?? 0) + finalQuantity;
          const updatePayload = {
            item_name: cleanName,
            default_price: cleanPrice,
            quantity: newQty,
            cost_price: parsedCost,
            unit: row.unit,
            min_stock_level: parsedMinStock,
            updated_at: new Date().toISOString()
          };

          await dbService.updateItem(existingMatch.id, updatePayload);

          updatedItemsList = updatedItemsList.map(item => 
            item.id === existingMatch.id ? { ...item, ...updatePayload } : item
          );
        } else {
          // Create new SKU entry
          const newItem: ItemRecord = {
            id: crypto.randomUUID(),
            item_name: cleanName,
            default_price: cleanPrice,
            quantity: finalQuantity,
            cost_price: parsedCost,
            unit: row.unit,
            min_stock_level: parsedMinStock,
            shop_id: currentUser.shop_id ?? undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          await dbService.createItem(newItem);
          updatedItemsList = [newItem, ...updatedItemsList];
        }
      }

      setItems(updatedItemsList);
      triggerToast(t.successRegister || "Batch items registered successfully!", "success");

      resetFormFields();
      setIsModalOpen(false);
      await syncCloudDatabases();
    } catch (err: any) {
      console.error("[useInventory:handleBatchRegisterItems] Failed to register batch items:", err);
      triggerToast(err.message || "Failed to persist batch items.", "error");
      throw err;
    }
  };

  /* --------------------------------------------------------------------------
     5. MEMOIZED DATA VISUALIZATIONS & FILTERS
     -------------------------------------------------------------------------- */
  const scopedItems = useMemo((): ItemRecord[] => {
    const query = inventorySearch.trim().toLowerCase();
    
    return items.filter(i => {
      const nameMatch = (i.item_name || '').toLowerCase().includes(query);
      const codeMatch = (i.code || '').toLowerCase().includes(query);
      const matchesSearch = nameMatch || codeMatch;
      
      const matchesShop = selectedShopFilter === 'all' || i.shop_id === selectedShopFilter;
      return matchesSearch && matchesShop;
    });
  }, [items, inventorySearch, selectedShopFilter]);

  const activeShopItems = useMemo((): ItemRecord[] => {
    if (!currentUser?.shop_id) return [];
    return items.filter(i => i.shop_id === currentUser.shop_id);
  }, [items, currentUser]);

  /* --------------------------------------------------------------------------
     6. PUBLIC API RETURN BINDINGS
     -------------------------------------------------------------------------- */
  return {
    // Basic Form Inputs
    itemName, setItemName,
    newInvPrice, setNewInvPrice,
    itemQuantity, setItemQuantity,
    
    // Extended Form Inputs
    unitCost, setUnitCost,
    unit, setUnit,
    minStockLevel, setMinStockLevel,

    // Layout & Search Controls
    inventorySearch, setInventorySearch,
    isModalOpen, setIsModalOpen,
    modalMode, setModalMode,
    selectedItemId, setSelectedItemId,
    pageSize, setPageSize,
    
    // Calculations & Datasets
    scopedItems,
    activeShopItems,
    
    // Operational Action Dispatchers
    handleRegisterItem,
    handleBatchRegisterItems,
    handleEditInit,
    handleCreateInit,
    resetFormFields
  };
}