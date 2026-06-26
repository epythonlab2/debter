// src/components/InventoryTab.tsx
import React, { useState } from 'react';
import { PlusCircle, Search, Trash2, Edit3, Layers, X, SlidersHorizontal, Loader2, AlertTriangle } from 'lucide-react';
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
            </select>
          </div>
        </div>
        
        {/* Primary Action Button (#1a5fb4) */}
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

/**
 * ============================================================================
 * SUB-COMPONENT: InventoryModal
 * ============================================================================
 */
const InventoryModal = ({ onSubmit, mode, values, setters, onClose, t, globalItems }: InventoryModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cleanTypingName = values.itemName.trim().toLowerCase();
  const duplicateMatch = globalItems.find((i: ItemRecord) => i.item_name.toLowerCase() === cleanTypingName);
  const isDuplicateRegister = mode === 'create' && duplicateMatch;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(e);
    } catch (err) {
      console.error("Item processing rejected:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-2xl p-5 space-y-4 relative max-h-[90vh] overflow-y-auto transform scale-100 animate-in zoom-in-95 duration-200">
        
        <button 
          type="button" 
          onClick={onClose} 
          disabled={isSubmitting}
          className="absolute right-4 top-4 p-1.5 rounded-xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950/40 hover:text-slate-600 dark:hover:text-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[2]" />
        </button>

        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div className="p-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 rounded-xl text-[#1a5fb4]">
            <PlusCircle className="w-4 h-4 shrink-0 stroke-[2]" />
          </div>
          <h3 className="font-black text-xs text-slate-800 dark:text-slate-200 tracking-widest uppercase">
            {mode === 'edit' ? (t.modifyItem || "Modify item details") : (t.addInventoryItem || "Add new item")}
          </h3>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-3.5">
            <div>
              <InputField 
                label={t.itemName} 
                value={values.itemName} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setters.setItemName(e.target.value)} 
                placeholder={t.itemNamePlaceholder || "Item Name"} 
                disabled={isSubmitting}
              />
              {isDuplicateRegister && duplicateMatch && (
                <div className="mt-2 px-3 py-2.5 text-[11px] rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 font-medium flex items-start gap-2 leading-relaxed animate-in fade-in duration-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5 stroke-[2.5]" />
                  <div>
                    <strong className="font-bold text-slate-800 dark:text-slate-200">{duplicateMatch.item_name}</strong> {t.alreadyExist}. {t.addExistingStock || "Submitting will aggregate stock counts together"} ({duplicateMatch.quantity ?? 0} {t.pcs}).
                  </div>
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
                disabled={isSubmitting}
              />
              <InputField 
                label={t.quantity} 
                value={values.itemQuantity} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setters.setItemQuantity(e.target.value)} 
                placeholder="10" 
                type="number" 
                min="0" 
                inputMode="numeric"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isSubmitting}
              className="flex-1 bg-white hover:bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800/80 transition-all duration-200 active:scale-[0.98] tracking-wider disabled:opacity-50 cursor-pointer"
            >
              {t.cancelBtn}
            </button>
            {/* Modal Submit Button (#1a5fb4 / #154b91) */}
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 font-bold py-2.5 rounded-xl text-xs active:scale-[0.98] transition-all duration-200 text-white tracking-wider bg-[#1a5fb4] dark:bg-[#1a5fb4] hover:bg-[#154b91] dark:hover:bg-[#154b91] disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin stroke-[2.5]" />
              ) : mode === 'edit' ? (
                t.saveChange || "Save Changes"
              ) : isDuplicateRegister ? (
                t.mergeUpdate || "Merge Stock"
              ) : (
                t.registerItem
              )}
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
interface ExtendedInputFieldProps extends InputFieldProps {
  disabled?: boolean;
}

const InputField = React.memo(({ label, value, onChange, placeholder, type = "text", min, inputMode, disabled }: ExtendedInputFieldProps) => (
  <div className="space-y-1">
    <label className="block text-slate-500 dark:text-slate-400 font-bold text-[11px] tracking-wider uppercase">{label}</label>
    <input 
      type={type} 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder} 
      min={min} 
      inputMode={inputMode}
      disabled={disabled}
      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-[#1a5fb4] dark:focus:border-[#1a5fb4] focus:ring-4 focus:ring-[#1a5fb4]/10 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-normal transition-all duration-200 disabled:opacity-60 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500" 
      required 
    />
  </div>
));

InputField.displayName = 'InputField';

/**
 * ============================================================================
 * SUB-COMPONENT: InventoryList
 * ============================================================================
 */
const InventoryList = React.memo(({ items, onEdit, onDelete, t }: InventoryListProps) => (
  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-2xs overflow-hidden transition-colors">
    {items.length === 0 ? (
      <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl m-4 bg-slate-50/50 dark:bg-slate-950/20 transition-colors">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">{t.noSalesGeneric}</p>
      </div>
    ) : (
      <div className="w-full overflow-x-auto max-h-[calc(100vh-240px)] overflow-y-auto no-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-950 z-10 border-b border-slate-100 dark:border-slate-800/80">
            <tr className="text-slate-400 dark:text-slate-500 text-[10px] font-black tracking-widest uppercase">
              <th className="py-3 px-5">{t.itemName}</th>
              <th className="py-3 px-4 text-center">{t.stock}</th>
              <th className="py-3 px-5 text-right">{t.priceEtb}</th>
              <th className="py-3 px-5 text-center w-28">{t.actions || "Actions"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm font-normal">
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
const InventoryRow = React.memo(({ item, onEdit, onDelete, t }: InventoryRowProps) => {
  const stockCount = item.quantity ?? 0;

  const badgeColorClass = stockCount === 0 
    ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40" 
    : stockCount < 5 
      ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30"
      : "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30";

  return (
    <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-950/40 transition-colors duration-150 group">
      <td className="py-3.5 px-5 font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">{item.item_name}</td>
      
      <td className="py-3.5 px-4 text-center whitespace-nowrap">
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-colors ${badgeColorClass}`}>
          <Layers className="w-3 h-3 shrink-0 stroke-[2.5]" />
          <span>{stockCount} {t.pcs} {stockCount === 0 && `(${t.outOfStock || 'Empty'})`}</span>
        </span>
      </td>
      
      {/* Price Unit Typography Token (#1a5fb4) */}
      <td className="py-3.5 px-5 text-right font-bold text-[#1a5fb4] dark:text-blue-400 font-mono whitespace-nowrap">
        {Number(item.default_price).toLocaleString()} <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500 font-sans tracking-wide">{t.currency}</span>
      </td>
      
      <td className="py-3.5 px-5 text-center whitespace-nowrap">
        <div className="flex items-center justify-center gap-1">
          <button 
            type="button"
            onClick={() => onEdit(item)} 
            className="p-1.5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-[#1a5fb4] dark:hover:text-blue-400 hover:bg-[#1a5fb4]/5 dark:hover:bg-blue-500/10 transition-colors cursor-pointer"
            title={t.edit}
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button 
            type="button"
            onClick={() => onDelete('item', item.id)} 
            className="p-1.5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            title={t.deleteBtn}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
});

InventoryRow.displayName = 'InventoryRow';
