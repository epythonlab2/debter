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

  const handleOpenEdit = (item: ItemRecord) => {
    setModalMode('edit');
    setSelectedItemId(item.id);
    setItemName(item.item_name);
    setNewInvPrice(String(item.default_price));
    setItemQuantity(String(item.quantity ?? 0));
    setIsModalOpen(true);
  };

  return (
    <div 
      className="space-y-3.5 px-0.5"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}
    >
      {/* Search & Actions Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-3xs gap-3">
        <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1 group">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[#1a5fb4] transition-colors duration-200 stroke-[2]" />
            <input 
              type="text" 
              value={inventorySearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInventorySearch(e.target.value)}
              placeholder={t.searchInventory}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 outline-none text-sm bg-slate-50 focus:bg-white focus:border-[#1a5fb4] focus:ring-4 focus:ring-[#1a5fb4]/10 transition-all duration-200 font-normal placeholder:text-slate-400"
            />
            {inventorySearch.length > 0 && (
              <button
                type="button"
                onClick={() => setInventorySearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5 stroke-[2]" />
              </button>
            )}
          </div>

          <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 transition-all duration-200 focus-within:bg-white focus-within:border-[#1a5fb4] focus-within:ring-4 focus-within:ring-[#1a5fb4]/10">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 mr-2 shrink-0 stroke-[2]" />
            <select
              value={pageSize}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPageSize(Number(e.target.value))}
              className="bg-transparent border-none text-sm py-2.5 pr-7 pl-0 font-medium text-slate-600 outline-none cursor-pointer appearance-none w-full"
            >
              <option value={5}>5 {t.rows || "Rows"}</option>
              <option value={10}>10 {t.rows || "Rows"}</option>
              <option value={20}>20 {t.rows || "Rows"}</option>
              <option value={50}>50 {t.rows || "Rows"}</option>
            </select>
          </div>
        </div>
        
        <button 
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 bg-[#1a5fb4] hover:bg-[#154b91] active:scale-[0.98] text-white font-medium px-4 py-2.5 rounded-xl text-xs tracking-wide transition-all duration-200 shadow-3xs cursor-pointer md:h-10 shrink-0"
        >
          <PlusCircle className="w-4 h-4 shrink-0 stroke-[2]" />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl p-5 space-y-4 relative max-h-[90vh] overflow-y-auto scale-100 transition-all duration-200">
        
        <button 
          type="button" 
          onClick={onClose} 
          disabled={isSubmitting}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[2]" />
        </button>

        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <PlusCircle className="w-4 h-4 text-[#1a5fb4] shrink-0 stroke-[2]" />
          <h3 className="font-semibold text-sm text-slate-800">
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
                <div className="mt-2 px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-600 font-normal flex items-start gap-1.5 leading-relaxed animate-in fade-in duration-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5 stroke-[2]" />
                  <div>
                    <strong className="font-semibold text-slate-800">{duplicateMatch.item_name}</strong> {t.alreadyExist}. {t.addExistingStock || "Submitting will aggregate stock counts together"} ({duplicateMatch.quantity ?? 0} {t.pcs}).
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
              className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium py-2.5 rounded-xl text-xs border border-slate-200 transition-colors duration-200 active:scale-[0.98] tracking-wide disabled:opacity-50 cursor-pointer"
            >
              {t.cancelBtn}
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 font-medium py-2.5 rounded-xl text-xs active:scale-[0.98] transition-all duration-200 text-white tracking-wide bg-[#1a5fb4] hover:bg-[#154b91] disabled:bg-slate-200 disabled:text-slate-400 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-3xs cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin stroke-[2]" />
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

const InputField = ({ label, value, onChange, placeholder, type = "text", min, inputMode, disabled }: ExtendedInputFieldProps) => (
  <div className="space-y-1">
    <label className="block text-slate-500 font-medium text-xs">{label}</label>
    <input 
      type={type} 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder} 
      min={min} 
      inputMode={inputMode}
      disabled={disabled}
      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#1a5fb4] focus:ring-4 focus:ring-[#1a5fb4]/10 bg-slate-50 focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-normal transition-all duration-200 disabled:opacity-60 text-slate-800 placeholder:text-slate-400" 
      required 
    />
  </div>
);

/**
 * ============================================================================
 * SUB-COMPONENT: InventoryList
 * ============================================================================
 */
const InventoryList = React.memo(({ items, onEdit, onDelete, t }: InventoryListProps) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-3xs overflow-hidden">
    {items.length === 0 ? (
      <p className="text-center text-slate-400 text-sm py-12 font-normal">{t.noSalesGeneric}</p>
    ) : (
      <div className="w-full overflow-x-auto max-h-[calc(100vh-240px)] overflow-y-auto no-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-50 z-10 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
            <tr className="text-slate-400 text-xs font-semibold tracking-wide">
              <th className="py-3 px-4">{t.itemName}</th>
              <th className="py-3 px-4 text-center">{t.stock}</th>
              <th className="py-3 px-4 text-right">{t.priceEtb}</th>
              <th className="py-3 px-4 text-center w-28">{t.actions || "Actions"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm font-normal">
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
    <tr className="hover:bg-slate-50/60 transition-colors duration-150 group">
      <td className="py-3.5 px-4 font-semibold text-slate-800 text-xs sm:text-sm">{item.item_name}</td>
      
      <td className="py-3.5 px-4 text-center whitespace-nowrap">
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border ${badgeColorClass}`}>
          <Layers className="w-3 h-3 shrink-0 stroke-[2]" />
          <span>{stockCount} {t.pcs} {stockCount === 0 && `(${t.outOfStock || 'Empty'})`}</span>
        </span>
      </td>
      
      <td className="py-3.5 px-4 text-right font-semibold text-[#1a5fb4] font-mono whitespace-nowrap">
        {Number(item.default_price).toLocaleString()} <span className="text-xs font-normal text-slate-400 font-sans">{t.currency}</span>
      </td>
      
      <td className="py-3.5 px-4 text-center whitespace-nowrap">
        <div className="flex items-center justify-center gap-1">
          <button 
            type="button"
            onClick={() => onEdit(item)} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#1a5fb4] hover:bg-[#1a5fb4]/5 transition-colors cursor-pointer"
            title={t.edit}
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button 
            type="button"
            onClick={() => onDelete('item', item.id)} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title={t.deleteBtn}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};
