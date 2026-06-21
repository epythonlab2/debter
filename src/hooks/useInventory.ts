// src/hooks/useInventory.ts
import { useState, useMemo } from 'react';
import { dbService } from '../core/services/dbService';
import { UserProfile } from '../types';
import { ItemRecord, InventoryTranslation } from '../types/inventory';

interface UseInventoryProps {
  t: InventoryTranslation;
  currentUser: UserProfile | null;
  items: ItemRecord[];
  setItems: React.Dispatch<React.SetStateAction<ItemRecord[]>>;
  selectedShopFilter: string;
  syncCloudDatabases: () => Promise<void>;
  triggerToast: (msg: string, type?: 'success' | 'error') => void;
  lang: string;
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
  lang,
  t
}: UseInventoryProps) {
  
  /* --------------------------------------------------------------------------
     1. UI ACTION & MODAL LAYOUT STATE
     -------------------------------------------------------------------------- */
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedItemId, setSelectedItemId] = useState<string>('');

  /* --------------------------------------------------------------------------
     2. LIVE INVENTORY INTERACTIVE FORM CONTROLS
     -------------------------------------------------------------------------- */
  const [inventorySearch, setInventorySearch] = useState<string>('');
  const [itemName, setItemName] = useState<string>('');
  const [newInvPrice, setNewInvPrice] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState<string>('');
  
  // State tracking for local row-limit filters
  const [pageSize, setPageSize] = useState<number>(5);

  /* --------------------------------------------------------------------------
     3. PERSISTENCE & RESOURCE REGISTRATION HANDLERS
     -------------------------------------------------------------------------- */
  /**
   * Evaluates form context inputs to persist unique products or dynamically 
   * append volume levels to existing items sharing matching structural keys.
   */
  const handleRegisterItem = async (e: React.FormEvent, explicitId?: string) => {
    e.preventDefault();
    
    // Core Guard Clause: Stop transaction sequences if the active session lacks shop association
    if (!currentUser?.shop_id) {
      triggerToast((t as any).shopIdMissing || "Shop ID is missing. Action aborted.", "error");
      return;
    }

    // Input sanitization and type normalization pipelines
    const cleanName = itemName.trim();
    const cleanPrice = Number(newInvPrice);
    const parsedQty = parseInt(itemQuantity, 10);
    const finalQuantity = isNaN(parsedQty) || parsedQty < 0 ? 0 : parsedQty;

    // Reject schema manipulation patterns if base properties fail validations
    if (!cleanName || isNaN(cleanPrice)) {
      triggerToast("Please enter a valid name and price", "error");
      return;
    }

    // 1. Check for name collisions inside the current shop's local state
    const existingProductMatch = items.find(
      item => 
        item.item_name.toLowerCase() === cleanName.toLowerCase() && 
        item.shop_id === currentUser.shop_id
    );

    // 2. Resolve the true operational ID pointer
    let targetId = explicitId || (modalMode === 'create' ? existingProductMatch?.id : selectedItemId);

    try {
      if (targetId) {
        // 🟢 PATHWAY: Update existing row (handles both explicit edits AND registration duplicates)
        const existingItem = items.find(i => i.id === targetId);
        
        const updatedQuantity = modalMode === 'create' 
          ? (existingItem ? (existingItem.quantity ?? 0) + finalQuantity : finalQuantity)
          : finalQuantity;

        // Commit modifications downstream into the localized persistence engine
        await dbService.updateItem(targetId, {
          item_name: cleanName,
          default_price: cleanPrice,
          quantity: updatedQuantity
        });

        // Rehydrate front-end runtime state by pulling the target entry to index 0
        setItems(prev => {
          const filtered = prev.filter(item => item.id !== targetId);
          return [
            { 
              id: targetId!, 
              item_name: cleanName, 
              default_price: cleanPrice, 
              // 🟢 FIX: Neutralize string|null type constraints into string|undefined
              shop_id: currentUser.shop_id ?? undefined, 
              quantity: updatedQuantity 
            },
            ...filtered
          ];
        });
        
        const translationRef = t as any;
        const successMsg = modalMode === 'create'
          ? `${cleanName} ${translationRef.alreadyExist || "already exists."} ${translationRef.updateStock || "Stock incremented."}`
          : (translationRef.saveChangesSuccess || "Changes saved successfully");
          
        triggerToast(successMsg, "success");

      } else {
        // 🟢 PATHWAY: Pure Create a brand new unique entry
        const newItem: ItemRecord = {
          id: crypto.randomUUID(), 
          item_name: cleanName,
          default_price: cleanPrice,
          // 🟢 FIX: Neutralize string|null type constraints into string|undefined
          shop_id: currentUser.shop_id ?? undefined,
          quantity: finalQuantity 
        };

        // Write fresh entity schema into the local storage layer
        await dbService.createItem(newItem);
        
        // Append item instance onto the frontend array stack
        setItems(prev => [newItem, ...prev.filter(item => item.id !== newItem.id)]);
        
        triggerToast((t as any).successRegister || "Item added successfully!", "success");
      }
      
      // Clean up layout control values post execution
      setItemName('');
      setNewInvPrice('');
      setItemQuantity('');
      setSelectedItemId('');
      setIsModalOpen(false);
      
      // Execute asynchronous network replication sequences for cloud alignment
      await syncCloudDatabases();
    } catch (err: any) {
      triggerToast(err.message, "error");
    }
  };

  /* --------------------------------------------------------------------------
     4. MEMOIZED VIEW LAYER CALCULATIONS
     -------------------------------------------------------------------------- */
  // Applies search rules, shop filters, and limits array view using slice()
  const scopedItems = useMemo((): ItemRecord[] => {
    const filtered = items.filter(i => {
      const name = i.item_name || '';
      const matchesSearch = name.toLowerCase().includes(inventorySearch.toLowerCase());
      const matchesShop = selectedShopFilter === 'all' || i.shop_id === selectedShopFilter;
      return matchesSearch && matchesShop;
    });

    return filtered.slice(0, pageSize);
  }, [items, inventorySearch, selectedShopFilter, pageSize]);

  /**
   * Isoradial evaluation of items owned directly by the logged-in storefront model context.
   */
  const activeShopItems = useMemo((): ItemRecord[] => {
    if (!currentUser) return [];
    return items.filter(i => i.shop_id === currentUser.shop_id);
  }, [items, currentUser]);

  /* --------------------------------------------------------------------------
     5. COMPONENT INTERFACE EXPOSURES
     -------------------------------------------------------------------------- */
  return {
    itemName, setItemName,
    newInvPrice, setNewInvPrice,
    itemQuantity, setItemQuantity,
    inventorySearch, setInventorySearch,
    isModalOpen, setIsModalOpen,
    modalMode, setModalMode,
    selectedItemId, setSelectedItemId,
    pageSize, setPageSize,
    scopedItems,
    activeShopItems,
    handleRegisterItem
  };
}
