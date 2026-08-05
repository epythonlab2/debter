// src/components/inventory/InventoryTab.tsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  PlusCircle, 
  Search, 
  X, 
  SlidersHorizontal, 
  AlertTriangle, 
  Boxes,
  CheckCircle2
} from 'lucide-react';
import { InventoryTabProps, ItemRecord, UnitOfMeasure } from '../../types/inventory';
import InventoryList from './InventoryList';
import InventoryModal, { BatchItemInput } from './InventoryModal';
import EditInventoryModal from './EditInventoryModal';

export interface ExtendedInventoryTabProps extends InventoryTabProps {
  handleRegisterBatchItems?: (items: BatchItemInput[]) => Promise<void>;
  unit?: UnitOfMeasure;
  setUnit?: (unit: UnitOfMeasure) => void;
  unitCost?: string;
  setUnitCost?: (cost: string) => void;
  minStockLevel?: string;
  setMinStockLevel?: (min: string) => void;
  t: any;
}

type StockFilterMode = 'all' | 'inStock' | 'lowStock';

/**
 * InventoryTab Component
 * 
 * Central controller component for managing inventory data:
 * - Direct-action metric cards with clean count displays
 * - Quick-filter toggle showing precise item counts for each view mode
 * - Modal overlays for creating and editing batch or single items
 */
export default function InventoryTab({ 
  itemName, setItemName, 
  newInvPrice, setNewInvPrice,
  itemQuantity, setItemQuantity, 
  handleRegisterItem,
  handleRegisterBatchItems,
  inventorySearch, setInventorySearch, 
  scopedItems, 
  triggerDeleteConfirm, 
  t,
  isModalOpen, setIsModalOpen,
  modalMode, setModalMode,
  selectedItemId, setSelectedItemId,
  pageSize, setPageSize,
  items,
  unit, setUnit,
  unitCost, setUnitCost,
  minStockLevel, setMinStockLevel
}: ExtendedInventoryTabProps) {

  // Active filter mode: 'inStock' (Default) | 'lowStock' | 'all'
  const [filterMode, setFilterMode] = useState<StockFilterMode>('inStock');

  // 1. Mobile UX Guard: Prevent background scrolling when modal overlay is active
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isModalOpen]);

  // 2. Safe Numerical Helpers
  const getQuantity = (item: ItemRecord): number => Number(item.quantity ?? 0);
  const getMinThreshold = (item: ItemRecord): number => Number(item.min_stock_level ?? 5);

  // 3. Metric Computations (Counts for Badges)
  const totalItemsCount = scopedItems.length;

  const lowStockCount = useMemo(() => {
    return scopedItems.filter(item => getQuantity(item) <= getMinThreshold(item)).length;
  }, [scopedItems]);

  const inStockCount = useMemo(() => {
    return scopedItems.filter(item => getQuantity(item) > 0).length;
  }, [scopedItems]);

  // 4. Dynamic Data Filter
  const filteredItems = useMemo(() => {
    if (filterMode === 'lowStock') {
      return scopedItems.filter(item => getQuantity(item) <= getMinThreshold(item));
    }
    if (filterMode === 'inStock') {
      return scopedItems.filter(item => getQuantity(item) > 0);
    }
    return scopedItems; // 'all' items
  }, [scopedItems, filterMode]);

  // 5. Modal Controllers
  const handleOpenCreate = useCallback(() => {
    setModalMode('create');
    setSelectedItemId('');
    setItemName('');
    setNewInvPrice('');
    setItemQuantity('0');
    if (setUnitCost) setUnitCost('');
    setIsModalOpen(true);
  }, [setModalMode, setSelectedItemId, setItemName, setNewInvPrice, setItemQuantity, setUnitCost, setIsModalOpen]);

  const handleOpenEdit = useCallback((item: ItemRecord) => {
    setModalMode('edit');
    setSelectedItemId(item.id);
    setItemName(item.item_name);
    setNewInvPrice(String(item.default_price ?? 0));
    setItemQuantity(String(item.quantity ?? 0));
    if (setUnit && item.unit) setUnit(item.unit);
    if (setUnitCost) setUnitCost(item.cost_price ? String(item.cost_price) : '');
    if (setMinStockLevel) setMinStockLevel(item.min_stock_level ? String(item.min_stock_level) : '5');
    setIsModalOpen(true);
  }, [setModalMode, setSelectedItemId, setItemName, setNewInvPrice, setItemQuantity, setUnit, setUnitCost, setMinStockLevel, setIsModalOpen]);

  const handleCloseModal = useCallback(() => {
    setSelectedItemId(''); 
    setIsModalOpen(false);
  }, [setSelectedItemId, setIsModalOpen]);

  return (
    <div 
      className="space-y-4 md:space-y-5 antialiased select-none sm:select-auto"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}
    >
      {/* 1. Streamlined Metric Dashboard Cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        
        {/* Card 1: Total Items */}
        <button
          type="button"
          onClick={() => setFilterMode(filterMode === 'all' ? 'inStock' : 'all')}
          aria-label="Toggle All Items View"
          className={`text-left bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl flex items-center gap-3.5 border transition-all cursor-pointer touch-manipulation active:scale-[0.98] ${
            filterMode === 'all'
              ? 'border-blue-500/80 ring-2 ring-blue-500/20 dark:border-blue-400 shadow-xs'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-blue-200 dark:hover:border-slate-700 shadow-xs'
          }`}
        >
          <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 transition-colors ${
            filterMode === 'all' 
              ? 'bg-[#1a5fb4] text-white' 
              : 'bg-blue-50 dark:bg-blue-950/40 text-[#1a5fb4] dark:text-blue-400'
          }`}>
            <Boxes className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.totalItems || "Total Items"}</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{totalItemsCount}</p>
          </div>
        </button>

        {/* Card 2: Low Stock Items */}
        <button
          type="button"
          onClick={() => setFilterMode(filterMode === 'lowStock' ? 'inStock' : 'lowStock')}
          aria-label="Toggle Low Stock View"
          className={`text-left bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl flex items-center gap-3.5 border transition-all cursor-pointer touch-manipulation active:scale-[0.98] ${
            filterMode === 'lowStock'
              ? 'border-amber-500/80 ring-2 ring-amber-500/20 dark:border-amber-400 shadow-xs'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-amber-200 dark:hover:border-slate-700 shadow-xs'
          }`}
        >
          <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 transition-colors ${
            filterMode === 'lowStock' 
              ? 'bg-amber-500 text-white' 
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
          }`}>
            <AlertTriangle className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.lowStock || "Low Stock"}</p>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{lowStockCount}</p>
          </div>
        </button>

      </div>

      {/* 2. Responsive Search & Action Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        
        {/* Search Input Container */}
        <div className="relative flex-1 group min-w-0">
          <Search className="w-4 h-4 text-slate-400 group-focus-within:text-[#1a5fb4] dark:group-focus-within:text-blue-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors stroke-[2] pointer-events-none" />
          <input 
            type="text" 
            value={inventorySearch}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInventorySearch(e.target.value)}
            placeholder={t.searchInventory || "Search item name or code..."}
            className="w-full h-10 pl-10 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-slate-50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-900 focus:border-[#1a5fb4] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#1a5fb4]/10 text-slate-900 dark:text-slate-100 transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 touch-manipulation"
          />
          {inventorySearch.length > 0 && (
            <button
              type="button"
              onClick={() => setInventorySearch('')}
              aria-label="Clear Search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer touch-manipulation active:scale-95"
            >
              <X className="w-3.5 h-3.5 stroke-[2]" />
            </button>
          )}
        </div>

        {/* Action Controls Container */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 shrink-0 w-full lg:w-auto">
          
          <div className="flex items-center gap-2 sm:gap-2.5 flex-1 lg:flex-initial">
            
            {/* Quick Filter Status Switcher with Numerical Badges */}
            <button
              type="button"
              onClick={() => {
                if (filterMode === 'inStock') setFilterMode('lowStock');
                else if (filterMode === 'lowStock') setFilterMode('all');
                else setFilterMode('inStock');
              }}
              aria-label="Cycle Stock Filter"
              className={`h-10 flex-1 lg:flex-none flex items-center justify-center gap-2 px-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer touch-manipulation active:scale-95 whitespace-nowrap ${
                filterMode === 'lowStock' 
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-400 ring-2 ring-amber-500/10' 
                  : filterMode === 'all'
                    ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/80 text-[#1a5fb4] dark:text-blue-400 ring-2 ring-blue-500/10'
                    : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/10'
              }`}
            >
              {filterMode === 'lowStock' ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5] text-amber-600 dark:text-amber-400" />
                  <span>{t.lowStock || "Low Stock"}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                    {lowStockCount}
                  </span>
                </>
              ) : filterMode === 'all' ? (
                <>
                  <Boxes className="w-3.5 h-3.5 stroke-[2.5] text-[#1a5fb4] dark:text-blue-400" />
                  <span>{t.allItems || "All Items"}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-[#1a5fb4] dark:text-blue-300">
                    {totalItemsCount}
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5] text-emerald-600 dark:text-emerald-400" />
                  <span>{t.inStock || "In Stock"}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    {inStockCount}
                  </span>
                </>
              )}
            </button>

            {/* Rows Per Page Dropdown */}
            <div className="relative h-10 flex-1 lg:flex-none flex items-center bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-[#1a5fb4] dark:focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-[#1a5fb4]/10">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0 stroke-[2] pointer-events-none" />
              <select
                value={pageSize}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPageSize(Number(e.target.value))}
                aria-label="Rows per page"
                className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer appearance-none w-full pr-4 touch-manipulation"
              >
                <option value={5} className="bg-white dark:bg-slate-900">5 {t.rows || "Rows"}</option>
                <option value={10} className="bg-white dark:bg-slate-900">10 {t.rows || "Rows"}</option>
                <option value={20} className="bg-white dark:bg-slate-900">20 {t.rows || "Rows"}</option>
                <option value={50} className="bg-white dark:bg-slate-900">50 {t.rows || "Rows"}</option>
                <option value={100} className="bg-white dark:bg-slate-900">100 {t.rows || "Rows"}</option>
                <option value={200} className="bg-white dark:bg-slate-900">200 {t.rows || "Rows"}</option>
              </select>
            </div>
          </div>

          {/* Primary Action Button */}
          <button 
            type="button"
            onClick={handleOpenCreate}
            className="h-10 w-full lg:w-auto flex items-center justify-center gap-1.5 bg-[#1a5fb4] hover:bg-[#154b91] active:bg-[#113c75] text-white font-bold px-4 rounded-xl text-xs tracking-wide transition-all shadow-xs cursor-pointer shrink-0 touch-manipulation active:scale-[0.98] whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4 shrink-0 stroke-[2.5]" />
            <span>{t.addInventoryItem || "Add Item"}</span>
          </button>
        </div>
      </div>

      {/* 3. Main Inventory Listing Component */}
      <InventoryList 
        items={filteredItems} 
        onEdit={handleOpenEdit}
        onDelete={triggerDeleteConfirm} 
        t={t} 
        pageSize={pageSize}
      />

      {/* 4. Modal Overlays */}
      {isModalOpen && (
        modalMode === 'edit' ? (
          <EditInventoryModal
            onClose={handleCloseModal}
            onSubmit={async (e: React.FormEvent) => {
              await handleRegisterItem(e, selectedItemId || null);
            }}
            values={{ itemName, newInvPrice, itemQuantity }}
            setters={{ setItemName, setNewInvPrice, setItemQuantity }}
            t={t}
            unit={unit}
            setUnit={setUnit}
            unitCost={unitCost}
            setUnitCost={setUnitCost}
            minStockLevel={minStockLevel}
            setMinStockLevel={setMinStockLevel}
          />
        ) : (
          <InventoryModal   
            onSubmitBatch={handleRegisterBatchItems || (async () => {})}
            globalItems={items} 
            onClose={handleCloseModal}
            t={t}
            initialUnit={unit}
            initialUnitCost={unitCost}
            initialMinStockLevel={minStockLevel}
          />
        )
      )}
    </div>
  );
}