// src/components/inventory/InventoryTab.tsx
import React from 'react';
import { PlusCircle, Search, X, SlidersHorizontal } from 'lucide-react';
import { InventoryTabProps, ItemRecord } from '../../types/inventory';
import InventoryList from './InventoryList';
import InventoryModal from './InventoryModal';

export default function InventoryTab({ 
  itemName, setItemName, 
  newInvPrice, setNewInvPrice,
  itemQuantity, setItemQuantity, 
  handleRegisterItem, 
  inventorySearch, setInventorySearch, 
  scopedItems, 
  triggerDeleteConfirm, t,
  
  isModalOpen, setIsModalOpen,
  modalMode, setModalMode,
  selectedItemId,
  setSelectedItemId,
  
  pageSize, setPageSize,
  items
}: InventoryTabProps) {

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedItemId('');
    setItemName('');
    setNewInvPrice('');
    setItemQuantity('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = React.useCallback((item: ItemRecord) => {
    setModalMode('edit');
    setSelectedItemId(item.id);
    setItemName(item.item_name);
    setNewInvPrice(String(item.default_price));
    setItemQuantity(String(item.quantity ?? 0));
    setIsModalOpen(true);
  }, [setModalMode, setSelectedItemId, setItemName, setNewInvPrice, setItemQuantity, setIsModalOpen]);

  const handleCloseModal = React.useCallback(() => {
    setSelectedItemId(''); 
    setIsModalOpen(false);
  }, [setSelectedItemId, setIsModalOpen]);

  return (
    <div 
      className="space-y-4 px-0.5 antialiased transition-colors"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}
    >
      {/* Search & Actions Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-3xs gap-3 transition-colors">
        <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1 group">
            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-[#1a5fb4] dark:group-focus-within:text-blue-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 stroke-[2]" />
            <input 
              type="text" 
              value={inventorySearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInventorySearch(e.target.value)}
              placeholder={t.searchInventory}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 outline-none text-sm bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:border-[#1a5fb4] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#1a5fb4]/10 dark:focus:ring-blue-500/10 text-slate-800 dark:text-slate-100 transition-all duration-200 font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            {inventorySearch.length > 0 && (
              <button
                type="button"
                onClick={() => setInventorySearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5 stroke-[2]" />
              </button>
            )}
          </div>

          <div className="relative flex items-center bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 transition-all duration-200 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-[#1a5fb4] dark:focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-[#1a5fb4]/10 dark:focus-within:ring-blue-500/10">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 mr-2 shrink-0 stroke-[2]" />
            <select
              value={pageSize}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPageSize(Number(e.target.value))}
              className="bg-transparent border-none text-sm py-2.5 pr-7 pl-0 font-medium text-slate-600 dark:text-slate-400 outline-none cursor-pointer appearance-none w-full"
            >
              <option value={5} className="dark:bg-slate-900">5 {t.rows || "Rows"}</option>
              <option value={10} className="dark:bg-slate-900">10 {t.rows || "Rows"}</option>
              <option value={20} className="dark:bg-slate-900">20 {t.rows || "Rows"}</option>
              <option value={50} className="dark:bg-slate-900">50 {t.rows || "Rows"}</option>
              <option value={100} className="dark:bg-slate-900">100 {t.rows || "Rows"}</option>
              <option value={200} className="dark:bg-slate-900">200 {t.rows || "Rows"}</option>
            </select>
          </div>
        </div>
        
        <button 
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-1.5 bg-[#1a5fb4] dark:bg-[#1a5fb4] hover:bg-[#154b91] dark:hover:bg-[#154b91] active:scale-[0.98] text-white font-bold px-4 py-2.5 rounded-xl text-xs tracking-wider transition-all duration-200 shadow-xs cursor-pointer md:h-10 shrink-0"
        >
          <PlusCircle className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
          <span>{t.addInventoryItem}</span>
        </button>
      </div>

      {/* Main Inventory Layout */}
      <InventoryList 
        items={scopedItems} 
        onEdit={handleOpenEdit}
        onDelete={triggerDeleteConfirm} 
        t={t} 
        pageSize={pageSize}
      />

      {/* Contextual Action Modal Overlays */}
      {isModalOpen && (
        <InventoryModal   
          onSubmit={(e: React.FormEvent) => handleRegisterItem(e, selectedItemId || null)}
          mode={modalMode}
          values={{ itemName, newInvPrice, itemQuantity }}
          setters={{ setItemName, setNewInvPrice, setItemQuantity }}
          globalItems={items} 
          onClose={handleCloseModal}
          t={t}
        />
      )}
    </div>
  );
}
