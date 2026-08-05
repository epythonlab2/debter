// src/components/inventory/InventoryModal.tsx
import React, { useState, useRef, useCallback, useMemo } from 'react';
import { 
  PlusCircle, 
  X, 
  Loader2, 
  AlertTriangle, 
  Trash2, 
  Plus, 
  Copy, 
  ShieldAlert 
} from 'lucide-react';
import { ItemRecord, UnitOfMeasure } from '../../types/inventory';
import InputField from './InputField';

/**
 * Interface representing a single item input row within a batch.
 */
export interface BatchItemInput {
  tempId: string;
  item_name: string;
  default_price: string;
  quantity: string;
  cost_price: string;
  unit: UnitOfMeasure;
  min_stock_level: string;
}

/**
 * Component Props definition with strong typing for translation (t) object functions/keys.
 */
interface BatchInventoryModalProps {
  onClose: () => void;
  onSubmitBatch: (items: BatchItemInput[]) => Promise<void>;
  globalItems: ItemRecord[];
  t: Record<string, any>;
  initialUnit?: UnitOfMeasure | '';
  initialUnitCost?: string;
  initialMinStockLevel?: string;
}

/**
 * Tracks row-level validation errors keyed by the temporary row ID.
 */
interface ValidationErrors {
  [rowId: string]: {
    item_name?: string;
    default_price?: string;
    unit?: string;
    quantity?: string;
    cost_price?: string;
  };
}

/**
 * Helper to safely generate unique identifiers across older and modern browsers.
 */
const generateUniqueId = (): string => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const InventoryModal: React.FC<BatchInventoryModalProps> = ({
  onClose,
  onSubmitBatch,
  globalItems,
  t,
  initialUnit = '',
  initialUnitCost = '',
  initialMinStockLevel = '5'
}) => {
  // State management
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});
  const [minStockLevel, setMinStockLevel] = useState<string>(initialMinStockLevel);

  // DOM Focus references
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const lastRowInputRef = useRef<HTMLInputElement | null>(null);

  /**
   * Helper for numeric input updates with optional state synchronization
   */
  const handleNumericChange = (setter: React.Dispatch<React.SetStateAction<string>>, val: string) => {
    const sanitizedVal = val.replace(/[^0-9]/g, '');
    setter(sanitizedVal);
    setBatchRows(prev =>
      prev.map(row => ({
        ...row,
        min_stock_level: sanitizedVal
      }))
    );
  };

  /**
   * Initialize state with a single clean row.
   */
  const [batchRows, setBatchRows] = useState<BatchItemInput[]>(() => [
    {
      tempId: generateUniqueId(),
      item_name: '',
      default_price: '',
      quantity: '0',
      cost_price: initialUnitCost || '',
      unit: '' as UnitOfMeasure,
      min_stock_level: initialMinStockLevel
    }
  ]);

  /**
   * Pre-index existing global items in a lowercased Map for O(1) fast lookup.
   */
  const globalItemsLookup = useMemo(() => {
    const map = new Map<string, ItemRecord>();
    globalItems.forEach(item => {
      if (item.item_name) {
        map.set(item.item_name.trim().toLowerCase(), item);
      }
    });
    return map;
  }, [globalItems]);

  /**
   * Appends a new item row to the batch and manages element focus.
   */
  const handleAddRow = useCallback(() => {
    const newId = generateUniqueId();
    setBatchRows(prev => [
      ...prev,
      {
        tempId: newId,
        item_name: '',
        default_price: '',
        quantity: '0',
        cost_price: '0.00',
        unit: '' as UnitOfMeasure,
        min_stock_level: minStockLevel
      }
    ]);

    requestAnimationFrame(() => {
      lastRowInputRef.current?.focus();
    });
  }, [minStockLevel]);

  /**
   * Duplicates an existing row's structure while issuing a new unique identifier.
   */
  const handleDuplicateRow = useCallback((index: number) => {
    setBatchRows(prev => {
      const source = prev[index];
      if (!source) return prev;
      return [
        ...prev,
        {
          ...source,
          tempId: generateUniqueId(),
          item_name: source.item_name ? `${source.item_name} (Copy)` : '',
          min_stock_level: minStockLevel
        }
      ];
    });
  }, [minStockLevel]);

  /**
   * Removes a designated row and clears associated field errors.
   */
  const handleRemoveRow = useCallback((tempId: string) => {
    setBatchRows(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter(row => row.tempId !== tempId);
    });

    setFieldErrors(prev => {
      if (!prev[tempId]) return prev;
      const copy = { ...prev };
      delete copy[tempId];
      return copy;
    });
  }, []);

  /**
   * Handles user field input with inline security sanitization and automatic error clearing.
   */
  const handleRowChange = useCallback((tempId: string, field: keyof BatchItemInput, val: string) => {
    const sanitizedVal = val;

    if (['quantity', 'cost_price', 'default_price', 'min_stock_level'].includes(field)) {
      if (Number(val) < 0) return;
    }

    setBatchRows(prev =>
      prev.map(row => (row.tempId === tempId ? { ...row, [field]: sanitizedVal } : row))
    );

    setFieldErrors(prev => {
      if (!prev[tempId]?.[field as keyof ValidationErrors[string]]) return prev;
      return {
        ...prev,
        [tempId]: {
          ...prev[tempId],
          [field]: undefined
        }
      };
    });
  }, []);

  /**
   * Keyboard shortcuts handler for form actions.
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleFormSubmit(e);
      return;
    }

    if (e.shiftKey && e.key === 'Enter') {
      e.preventDefault();
      handleAddRow();
      return;
    }

    if (e.key === 'Escape' && !isSubmitting) {
      onClose();
    }
  };

  /**
   * Validates form items, cleans payload, and submits batch data.
   */
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    if (isSubmitting) return;

    const errors: ValidationErrors = {};
    let hasValidationError = false;

    // Validate fields individually; error messages will appear under specific inputs
    batchRows.forEach((row) => {
      const rowErr: ValidationErrors[string] = {};
      const trimmedName = row.item_name.trim();

      if (!trimmedName) {
        rowErr.item_name = t?.itemNameRequired || 'Item name is required';
        hasValidationError = true;
      }

      if (!row.unit || row.unit.trim() === '') {
        rowErr.unit = t?.selectUnitRequired || 'Unit is required';
        hasValidationError = true;
      }

      const numericPrice = Number(row.default_price);
      if (row.default_price !== '' && (isNaN(numericPrice) || numericPrice < 0)) {
        rowErr.default_price = t?.invalidPrice || 'Invalid price';
        hasValidationError = true;
      }

      const numericQty = Number(row.quantity);
      if (row.quantity !== '' && (isNaN(numericQty) || numericQty < 0)) {
        rowErr.quantity = t?.invalidQuantity || 'Invalid quantity';
        hasValidationError = true;
      }

      const numericCost = Number(row.cost_price);
      if (row.cost_price !== '' && (isNaN(numericCost) || numericCost < 0)) {
        rowErr.cost_price = t?.invalidCost || 'Invalid cost price';
        hasValidationError = true;
      }

      if (Object.keys(rowErr).length > 0) {
        errors[row.tempId] = rowErr;
      }
    });

    if (hasValidationError) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanedBatchRows: BatchItemInput[] = batchRows.map(row => ({
        ...row,
        item_name: row.item_name.trim(),
        default_price: row.default_price.trim() === '' ? '0' : row.default_price.trim(),
        cost_price: row.cost_price.trim() === '' ? '0' : row.cost_price.trim(),
        quantity: row.quantity.trim() === '' ? '0' : row.quantity.trim(),
        min_stock_level: row.min_stock_level.trim() === '' ? '0' : row.min_stock_level.trim()
      }));

      await onSubmitBatch(cleanedBatchRows);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-t-3xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl relative max-h-[90vh] sm:max-h-[85vh] flex flex-col transition-all duration-200">
        
        {/* Mobile Drag Handle Indicator */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Clean Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 pt-2 sm:pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl border shrink-0 transition-colors bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40 text-[#1a5fb4]">
              <PlusCircle className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 tracking-tight truncate">
                {`${t?.batchRegisterItems || 'Batch Register Items'} (${batchRows.length})`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
                {t?.addMultipleSkusSimultaneously || 'Add multiple stock SKUs into the inventory matrix simultaneously'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden lg:flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">Shift+Enter</span> Add Row
              <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">Ctrl+Enter</span> Save
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
        </div>

        {/* Scrollable Form Container */}
        <form id="inventory-modal-form" onSubmit={handleFormSubmit} onKeyDown={handleKeyDown} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="space-y-4">
            
            {/* Minimum Stock Threshold Section */}
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

            {/* Render Batch Rows */}
            <div className="space-y-3.5">
              {batchRows.map((row, index) => {
                const cleanName = row.item_name.trim().toLowerCase();
                const dupMatch = cleanName ? globalItemsLookup.get(cleanName) : null;
                const rowErr = fieldErrors[row.tempId];
                const isLastRow = index === batchRows.length - 1;

                return (
                  <div 
                    key={row.tempId} 
                    className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 space-y-3 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-2.5">
                      <span className="text-[10px] font-black tracking-wider text-[#1a5fb4] bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/40">
                        {t?.item || 'Item'} {index + 1}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateRow(index)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                          title={t?.duplicateRow || 'Duplicate Row'}
                          aria-label={`Duplicate row ${index + 1}`}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {batchRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(row.tempId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title={t?.removeRow || 'Remove Row'}
                            aria-label={`Remove row ${index + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                      <div className="md:col-span-4">
                        <InputField
                          ref={isLastRow ? lastRowInputRef : index === 0 ? firstInputRef : undefined}
                          label={t?.itemName || 'Item Name'}
                          value={row.item_name}
                          onChange={(e) => handleRowChange(row.tempId, 'item_name', e.target.value)}
                          placeholder={t?.itemNamePlaceholder || 'Product name'}
                          error={rowErr?.item_name}
                        />
                      </div>

                      <div className="grid grid-cols-2 md:contents gap-3">
                        <div className="md:col-span-2 space-y-1">
                          <label className="block text-slate-500 dark:text-slate-400 font-bold text-[11px] tracking-wider">
                            {t?.unitOfMeasure || 'Unit'}
                          </label>

                          <select
                            value={row.unit || ''}
                            onChange={(e) => handleRowChange(row.tempId, 'unit', e.target.value as UnitOfMeasure)}
                            className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 outline-none focus:border-[#1a5fb4] focus:ring-1 focus:ring-[#1a5fb4] transition-all ${
                              rowErr?.unit ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <option value="" disabled>{t?.selectUom || 'Select UOM'}</option>
                            <option value={t?.uomPcs || 'pcs'}>{t?.uomPcs || 'Pcs'}</option>
                            <option value={t?.uomKg || 'kg'}>{t?.uomKg || 'Kg'}</option>
                            <option value={t?.uomLitre || 'litre'}>{t?.uomLitre || 'Litre'}</option>
                            <option value={t?.uomMeter || 'meter'}>{t?.uomMeter || 'Meter'}</option>
                            <option value={t?.uomBox || 'box'}>{t?.uomBox || 'Box'}</option>
                            <option value={t?.uomCarton || 'carton'}>{t?.uomCarton || 'Carton'}</option>
                            <option value={t?.uomPack || 'pack'}>{t?.uomPack || 'Pack'}</option>
                          </select>
                          {rowErr?.unit && <p className="text-[10px] text-rose-500 font-semibold">{rowErr.unit}</p>}
                        </div>

                        <div className="md:col-span-2">
                          <InputField
                            label={t?.stock || 'Stock'}
                            value={row.quantity}
                            onChange={(e) => handleRowChange(row.tempId, 'quantity', e.target.value)}
                            placeholder="0"
                            type="number"
                            min="0"
                            inputMode="numeric"
                            error={rowErr?.quantity}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <InputField
                            label={t?.unitCostPlaceholder || 'Cost (ETB)'}
                            value={row.cost_price}
                            onChange={(e) => handleRowChange(row.tempId, 'cost_price', e.target.value)}
                            type="number"
                            min="0"
                            inputMode="decimal"
                            placeholder="0.00"
                            error={rowErr?.cost_price}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <InputField
                            label={t?.priceEtb || 'Price (ETB)'}
                            value={row.default_price}
                            onChange={(e) => handleRowChange(row.tempId, 'default_price', e.target.value)}
                            type="number"
                            min="0"
                            inputMode="decimal"
                            placeholder="0.00 (Optional)"
                            error={rowErr?.default_price}
                          />
                        </div>
                      </div>
                    </div>

                    {dupMatch && (
                      <div className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 text-amber-800 dark:text-amber-400 text-xs flex items-center gap-2 font-medium">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                        <span>
                          <strong>{dupMatch.item_name}</strong> {t?.addExistingStock || 'already exists. Submitting will update existing stock levels.'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleAddRow}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-[#1a5fb4] dark:hover:border-[#1a5fb4] text-slate-600 dark:text-slate-400 hover:text-[#1a5fb4] dark:hover:text-[#1a5fb4] text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{t?.addProduct || 'Add Product Row'}</span>
            </button>
          </div>
        </form>

        {/* Modal Action Footer */}
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
              form="inventory-modal-form"
              disabled={isSubmitting}
              className="flex-1 font-bold py-2.5 rounded-xl text-xs text-white bg-[#1a5fb4] hover:bg-[#154b91] transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                `${t?.registerItem || 'Register Items'} (${batchRows.length})`
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default InventoryModal;