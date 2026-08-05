// src/components/inventory/EditInventoryModal.tsx
import React, { useState, useRef, useCallback } from 'react';
import { Edit3, X, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { UnitOfMeasure } from '../../types/inventory';
import InputField from './InputField';

/**
 * Interface defining the required and optional props for EditInventoryModal.
 */
export interface EditInventoryModalProps {
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  values: {
    itemName: string;
    newInvPrice: string;
    itemQuantity: string;
  };
  setters: {
    setItemName: (val: string) => void;
    setNewInvPrice: (val: string) => void;
    setItemQuantity: (val: string) => void;
  };
  t?: Record<string, string>;
  unit?: UnitOfMeasure | string;
  setUnit?: (unit: UnitOfMeasure) => void;
  unitCost?: string;
  setUnitCost?: (cost: string) => void;
  minStockLevel?: string;
  setMinStockLevel?: (min: string) => void;
}

export const EditInventoryModal: React.FC<EditInventoryModalProps> = ({
  onClose,
  onSubmit,
  values,
  setters,
  t,
  unit = '',
  setUnit,
  unitCost = '',
  setUnitCost,
  minStockLevel = '5',
  setMinStockLevel
}) => {
  // State for form submittal status and runtime validation messages
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // DOM ref to auto-focus the main input field upon component render
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  /**
   * Universal keyboard listener for modal interactions.
   * Handles Shift/Ctrl + Enter submission and Escape key dismissal.
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleFormSubmit(e);
      return;
    }
    if (e.key === 'Escape' && !isSubmitting) {
      onClose();
    }
  };

  /**
   * Sanitizes numeric inputs to prevent negative values or NaN propagation.
   */
  const handleNumericChange = useCallback((setter: (val: string) => void, rawVal: string) => {
    if (rawVal === '') {
      setter('');
      return;
    }
    const num = Number(rawVal);
    if (!isNaN(num) && num >= 0) {
      setter(rawVal);
    }
  }, []);

  /**
   * Validates form inputs and dispatches the payload to the provided parent submit handler.
   */
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (isSubmitting) return;

    // Direct input sanitization and verification
    const trimmedName = values.itemName.trim();
    if (!trimmedName) {
      setFormError(t?.itemNameRequired || 'Item name is required.');
      return;
    }

    // Validate numeric state values before submitting
    const parsedQty = Number(values.itemQuantity);
    if (values.itemQuantity !== '' && (isNaN(parsedQty) || parsedQty < 0)) {
      setFormError(t?.invalidQuantity || 'Quantity must be a valid positive number.');
      return;
    }

    const parsedPrice = Number(values.newInvPrice);
    if (values.newInvPrice !== '' && (isNaN(parsedPrice) || parsedPrice < 0)) {
      setFormError(t?.invalidPrice || 'Price must be a valid positive number.');
      return;
    }

    if (unitCost !== '') {
      const parsedCost = Number(unitCost);
      if (isNaN(parsedCost) || parsedCost < 0) {
        setFormError(t?.invalidCost || 'Cost must be a valid positive number.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit(e);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t?.errorGeneric || 'Execution failed.';
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
      aria-modal="true"
      role="dialog"
      aria-labelledby="edit-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl relative max-h-[90vh] sm:max-h-[85vh] flex flex-col transition-all duration-200">
        
        {/* Mobile Drag Indicator */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 pt-2 sm:pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2.5 rounded-2xl border shrink-0 transition-colors ${
              formError
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400'
                : 'bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40 text-[#1a5fb4]'
            }`}>
              <Edit3 className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <h3 id="edit-modal-title" className="font-black text-sm text-slate-900 dark:text-slate-100 tracking-tight truncate">
                {t?.modifyItem || 'Modify Item Details'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
                {t?.updatePricingAndThreshold || 'Update product pricing and threshold properties'}
              </p>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            disabled={isSubmitting}
            aria-label="Close modal"
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 stroke-[2]" />
          </button>
        </div>

        {/* Form Controls Body */}
        <form 
          id="edit-inventory-modal-form" 
          onSubmit={handleFormSubmit} 
          onKeyDown={handleKeyDown} 
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
        >
          {formError && (
            <div 
              role="alert" 
              className="px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <InputField 
            ref={firstInputRef}
            label={t?.itemName || 'Item Name'} 
            value={values.itemName} 
            onChange={(e) => setters.setItemName(e.target.value)} 
            placeholder="Item name"
            disabled={isSubmitting}
            autoFocus
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {setUnit && (
              <div className="space-y-1">
                <label className="block text-slate-500 dark:text-slate-400 font-bold text-[11px] tracking-wider">
                  {t?.unitOfMeasure || 'Unit of Measurement'}
                </label>
                <select
                  value={unit}
                  disabled={isSubmitting}
                  onChange={(e) => setUnit(e.target.value as UnitOfMeasure)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 outline-none focus:border-[#1a5fb4] focus:ring-1 focus:ring-[#1a5fb4] transition-all disabled:opacity-50"
                >
                  <option value={t?.uomPcs || 'pcs'}>{t?.uomPcs || 'Pcs'}</option>
                  <option value={t?.uomKg || 'kg'}>{t?.uomKg || 'Kg'}</option>
                  <option value={t?.uomLitre || 'litre'}>{t?.uomLitre || 'Litre'}</option>
                  <option value={t?.uomBox || 'box'}>{t?.uomBox || 'Box'}</option>
                  <option value={t?.uomCarton || 'carton'}>{t?.uomCarton || 'Carton'}</option>
                  <option value={t?.uomPack || 'pack'}>{t?.uomPack || 'Pack'}</option>
                </select>
              </div>
            )}
            <InputField 
              label={t?.currentStock || 'Stock'} 
              value={values.itemQuantity} 
              onChange={(e) => handleNumericChange(setters.setItemQuantity, e.target.value)} 
              placeholder="0"
              type="number" 
              min="0"
              inputMode="numeric"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {setUnitCost && (
              <InputField 
                label={t?.unitCostPlaceholder || 'Unit Cost'} 
                value={unitCost} 
                onChange={(e) => handleNumericChange(setUnitCost, e.target.value)} 
                placeholder="0.00"
                type="number" 
                min="0"
                inputMode="decimal"
                disabled={isSubmitting}
              />
            )}
            <InputField 
              label={t?.priceEtb || 'Selling Price (ETB)'} 
              value={values.newInvPrice} 
              onChange={(e) => handleNumericChange(setters.setNewInvPrice, e.target.value)}
              placeholder="0.00 (Optional)"
              type="number" 
              min="0" 
              inputMode="decimal"
              disabled={isSubmitting}
            />
          </div>

          {setMinStockLevel && (
            <div className="pt-2">
              <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/15 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <label htmlFor="min-stock-input" className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      {t?.minStockLevel || 'Min Stock Threshold'}
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {t?.stockLevelLog || 'Triggers alerts when inventory reaches this amount'}
                    </p>
                  </div>
                </div>
                <div className="w-20 shrink-0">
                  <input
                    id="min-stock-input"
                    type="number"
                    min="0"
                    value={minStockLevel}
                    onChange={(e) => handleNumericChange(setMinStockLevel, e.target.value)}
                    placeholder="5"
                    inputMode="numeric"
                    disabled={isSubmitting}
                    className="w-full text-center font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none focus:border-[#1a5fb4] transition-all disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:px-6 sm:py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-3xl shrink-0">
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isSubmitting}
              className="flex-1 bg-white hover:bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 transition-all disabled:opacity-50"
            >
              {t?.cancelBtn || 'Cancel'}
            </button>
            <button 
              type="submit" 
              form="edit-inventory-modal-form"
              disabled={isSubmitting}
              className="flex-1 font-bold py-2.5 rounded-xl text-xs text-white bg-[#1a5fb4] hover:bg-[#154b91] transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t?.saveChange || 'Save Changes'
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EditInventoryModal;