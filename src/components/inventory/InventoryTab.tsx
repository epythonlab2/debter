// src/components/InventoryTab.tsx
import React from 'react';
import { PlusCircle, Search, Trash2, Edit3, Layers, X, SlidersHorizontal } from 'lucide-react';
import { 
  ItemRecord, 
  InventoryTabProps, 
  InventoryRowProps, 
  InventoryListProps, 
  InventoryModalProps, 
  InputFieldProps 
} from '../../types/inventory';

/**
 * ============================================================================
 * MAIN COMPONENT: InventoryTab
 * ============================================================================
 * Handles the view layout for managing shop items, inventory stock, row sizes,
 * and passes upstream callback handles directly down into modular sub-components.
 */
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

  /**
   * 🟢 Action Handlers: State Preparation Pipelines
   * --------------------------------------------------------------------------
   * Clears out any stale context fields and safely primes the target pointers
   * to guarantee the modal initializes cleanly in either 'create' or 'edit' modes.
   */

  // Opens modal prepared to ingest a brand new unique product entry
  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedItemId('');
    setItemName('');
    setNewInvPrice('');
    setItemQuantity('');
    setIsModalOpen(true);
  };

  // Pre-populates all string states to shift modal into updating records
  const handleOpenEdit = (item: ItemRecord) => {
    setModalMode('edit');
    setSelectedItemId(item.id);
    setItemName(item.item_name);
    setNewInvPrice(String(item.default_price));
    setItemQuantity(String(item.quantity ?? 0));
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4 px-0.5">
      
      {/* ======================================================================
        SECTION 1: Upper Control Hub Header Panel
        ======================================================================
        Houses local live-text search fields, pagination/row limitation 
        dropdown selectors, and the main initialization triggers.
      */}
      <div className="flex flex-col gap-3 justify-between bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        
        <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-2.5">
          {/* Live Inventory Text Search Bar */}
          <div className="relative flex-1 group">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[#1a5fb4] transition-colors stroke-[2.5]" />
            <input 
              type="text" 
              value={inventorySearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInventorySearch(e.target.value)}
              placeholder={t.searchInventory}
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 outline-none text-sm bg-slate-50 focus:bg-white focus:border-[#1a5fb4] focus:ring-4 focus:ring-[#1a5fb4]/10 transition-all font-medium placeholder:text-slate-400"
            />
            {/* Actionable search reset field element */}
            {inventorySearch.length > 0 && (
              <button
                type="button"
                onClick={() => setInventorySearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            )}
          </div>

          {/* Page Limit Selection Filter (5, 10, 20, 50 rows) */}
          <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 transition-all focus-within:bg-white focus-within:border-[#1a5fb4] focus-within:ring-4 focus-within:ring-[#1a5fb4]/10">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 mr-2 shrink-0 stroke-[2]" />
            <select
              value={pageSize}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPageSize(Number(e.target.value))}
              className="bg-transparent border-none text-sm py-3 pr-7 pl-0 font-bold text-slate-600 outline-none cursor-pointer appearance-none w-full"
            >
              <option value={5}>5 {t.rows || "Rows"}</option>
              <option value={10}>10 {t.rows || "Rows"}</option>
              <option value={20}>20 {t.rows || "Rows"}</option>
              <option value={50}>50 {t.rows || "Rows"}</option>
            </select>
          </div>
        </div>
        
        {/* Trigger to initiate a product creation cycle */}
        <button 
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 bg-[#1a5fb4] hover:bg-[#154b91] active:scale-[0.97] text-white font-black px-4 py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 shrink-0 stroke-[2.5]" />
          <span>{t.addInventoryItem}</span>
        </button>
      </div>

      {/* ======================================================================
        SECTION 2: Data Display Matrix Frame
        ======================================================================
      */}
      <InventoryList 
        items={scopedItems} 
        onEdit={handleOpenEdit}
        onDelete={triggerDeleteConfirm} 
        t={t} 
      />

      {/* ======================================================================
        SECTION 3: Single Dynamic Shared Action Form Modal
        ======================================================================
      */}
      {isModalOpen && (
        <InventoryModal  
          onSubmit={(e: React.FormEvent) => handleRegisterItem(e, selectedItemId || null)}
          mode={modalMode}
          values={{ itemName, newInvPrice, itemQuantity }}
          setters={{ setItemName, setNewInvPrice, setItemQuantity }}
          globalItems={items} 
          onClose={() => {
            setSelectedItemId(''); 
            setIsModalOpen(false);
          }}
          t={t}
        />
      )}
    </div>
  );
}


/**
 * ============================================================================
 * SUB-COMPONENT: InventoryModal
 * ============================================================================
 */
const InventoryModal = ({ onSubmit, mode, values, setters, onClose, t, globalItems }: InventoryModalProps) => {
  const cleanTypingName = values.itemName.trim().toLowerCase();
  const duplicateMatch = globalItems.find((i: ItemRecord) => i.item_name.toLowerCase() === cleanTypingName);
  
  const isDuplicateRegister = mode === 'create' && duplicateMatch;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl p-5 space-y-4 relative animate-scale-up max-h-[90vh] overflow-y-auto">
        
        <button type="button" onClick={onClose} className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <PlusCircle className="w-5 h-5 text-[#1a5fb4] shrink-0 stroke-[2.5]" />
          <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
            {mode === 'edit' ? (t.modifyItem || "Modify Item") : t.addInventoryItem}
          </h3>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-3.5">
            <div>
              <InputField 
                label={t.itemName} 
                value={values.itemName} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setters.setItemName(e.target.value)} 
                placeholder={t.itemNamePlaceholder || "Item Name"} 
              />
              {isDuplicateRegister && duplicateMatch && (
                <div className="mt-2 px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium animate-fade-in leading-relaxed">
                  ⚠️ <strong>{duplicateMatch.item_name}</strong> {t.alreadyExist}. {t.addExistingStock || "Submitting will aggregate stock counts together"} ({duplicateMatch.quantity ?? 0} {t.pcs}).
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <InputField 
                label={t.priceEtb} 
                value={values.newInvPrice} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setters.setNewInvPrice(e.target.value)} 
                placeholder="4500" 
                type="number" 
                min="0" 
                inputMode="decimal"
              />
              <InputField 
                label={t.quantity} 
                value={values.itemQuantity} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setters.setItemQuantity(e.target.value)} 
                placeholder="10" 
                type="number" 
                min="0" 
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-3 rounded-xl text-xs transition-all uppercase tracking-wider">
              {t.cancelBtn}
            </button>
            <button 
              type="submit" 
              className={`flex-1 font-black py-3 rounded-xl text-xs active:scale-[0.97] transition-all text-white uppercase tracking-wider bg-[#1a5fb4] hover:bg-[#154b91]`}
            >
              {mode === 'edit' 
                ? (t.saveChange || "Save Changes") 
                : isDuplicateRegister 
                  ? (t.mergeUpdate || "Merge Stock") 
                  : t.registerItem
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


/**
 * ============================================================================
 * SUB-COMPONENT: InputField
 * ============================================================================
 */
const InputField = ({ label, value, onChange, placeholder, type = "text", min, inputMode }: InputFieldProps) => (
  <div className="space-y-1">
    <label className="block text-slate-500 font-bold text-xs">{label}</label>
    <input 
      type={type} 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder} 
      min={min} 
      inputMode={inputMode}
      className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#1a5fb4] focus:ring-4 focus:ring-[#1a5fb4]/10 bg-slate-50 focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-medium transition-all" 
      required 
    />
  </div>
);


/**
 * ============================================================================
 * SUB-COMPONENT: InventoryList (Memoized)
 * ============================================================================
 */
const InventoryList = React.memo(({ items, onEdit, onDelete, t }: InventoryListProps) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
    {items.length === 0 ? (
      <p className="text-center text-slate-400 text-sm py-12 font-medium">{t.noSalesGeneric}</p>
    ) : (
      <div className="w-full overflow-x-auto max-h-[calc(100vh-240px)] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-50 z-10 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
            <tr className="text-slate-500 text-xs uppercase tracking-wider font-extrabold">
              <th className="py-3.5 px-4">{t.itemName}</th>
              <th className="py-3.5 px-4 text-center">{t.stock}</th>
              <th className="py-3.5 px-4 text-right">{t.priceEtb}</th>
              <th className="py-3.5 px-4 text-center w-28">{t.actions || "Actions"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm font-medium">
            {items.map((item: ItemRecord) => (
              <InventoryRow key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} t={t} />
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
));

InventoryList.displayName = 'InventoryList';


/**
 * ============================================================================
 * SUB-COMPONENT: InventoryRow
 * ============================================================================
 */
const InventoryRow = ({ item, onEdit, onDelete, t }: InventoryRowProps) => {
  const stockCount = item.quantity ?? 0;

  const badgeColorClass = stockCount === 0 
    ? "text-rose-700 bg-rose-50 border-rose-100" 
    : stockCount < 5 
      ? "text-amber-700 bg-amber-50 border-amber-100"
      : "text-emerald-700 bg-emerald-50 border-emerald-100";

  return (
    <tr className="hover:bg-slate-50/70 transition-colors group">
      <td className="py-4 px-4 font-bold text-slate-800 text-xs sm:text-sm">{item.item_name}</td>
      
      <td className="py-4 px-4 text-center whitespace-nowrap">
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${badgeColorClass}`}>
          <Layers className="w-3.5 h-3.5 shrink-0" />
          {stockCount} {t.pcs} {stockCount === 0 && `(${t.outOfStock || 'Empty'})`}
        </span>
      </td>
      
      <td className="py-4 px-4 text-right font-black text-[#1a5fb4] font-mono whitespace-nowrap">
        {Number(item.default_price).toLocaleString()} <span className="text-xs font-bold text-slate-400 font-sans">{t.currency}</span>
      </td>
      
      <td className="py-4 px-4 text-center whitespace-nowrap">
        <div className="flex items-center justify-center gap-2">
          <button 
            type="button"
            onClick={() => onEdit(item)} 
            className="p-2 rounded-xl text-slate-400 hover:text-[#1a5fb4] hover:bg-[#1a5fb4]/5 transition-all cursor-pointer"
            title={t.edit}
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button 
            type="button"
            onClick={() => onDelete('item', item.id)} 
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
            title={t.deleteBtn}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};
