// src/components/inventory/InventoryModal.tsx
import React, { useState } from 'react';
import { PlusCircle, X, Loader2, AlertTriangle } from 'lucide-react';
import { InventoryModalProps, ItemRecord } from '../../types/inventory';
import InputField from './InputField';

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

export default InventoryModal;
