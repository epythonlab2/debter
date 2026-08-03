// src/components/purchases/RecordPurchaseModal.tsx
import React, { useState, useEffect, useMemo, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, ShoppingBag, Percent, AlertCircle } from 'lucide-react';
import { PurchaseItemLine } from '../../types';
import { formatNumber } from '../../utils/formatters';
import { ItemRecord } from '@/types/inventory';
import { SearchableItemSelect } from './SearchableItemSelect';

/* ============================================================================
   1. TYPES & CONSTANTS
   ============================================================================ */

export const BASE_UOMS = ['Pcs', 'Kg', 'Box', 'Litre', 'Meter', 'Pack', 'Carton'] as const;
export type BaseUom = typeof BASE_UOMS[number];

export interface ExtendedPurchaseItemLine extends Omit<PurchaseItemLine, 'quantity' | 'unitCost'> {
  _id: string;
  quantity: number | '';
  unitCost: number | '';
  unitOfMeasurement?: BaseUom | string;
}

export interface InventoryItemWithUnit extends ItemRecord {
  unit?: string;
  unit_of_measurement?: string;
}

export interface PurchasePayload {
  vendorName: string;
  items: Omit<PurchaseItemLine, '_id'>[];
  subtotal: number;
  vatAmount: number;
  withholdingAmount: number;
  totalAmount: number;
  applyVat: boolean;
  applyWithholding: boolean;
  vatRate: number;
  withholdingRate: number;
}

export interface RecordPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItemWithUnit[];
  onSavePurchase: (payload: PurchasePayload) => Promise<void>;
  t?: Record<string, string>;
}

export interface LineError {
  itemId?: string;
  quantity?: string;
  unitOfMeasurement?: string;
  unitCost?: string;
}

/** Utility to generate crypto-safe dynamic key */
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 9);
};

/** Standard default line item state factory */
const createEmptyLine = (): ExtendedPurchaseItemLine => ({
  _id: generateId(),
  itemId: '',
  itemName: '',
  quantity: 1,
  unitCost: '',
  totalCost: 0,
  unitOfMeasurement: '',
});

export const getLocalizedUom = (uom?: string, t?: Record<string, string>): string => {
  if (!uom) return '';

  const key = `uom${uom}`;
  const lowerKey = key.toLowerCase();
  const underscoreKey = `uom_${uom.toLowerCase()}`;

  return t?.[key] || t?.[lowerKey] || t?.[underscoreKey] || uom;
};

/* ============================================================================
   2. MAIN COMPONENT: RECORD PURCHASE MODAL
   ============================================================================ */

export function RecordPurchaseModal({
  isOpen,
  onClose,
  items,
  onSavePurchase,
  t,
}: RecordPurchaseModalProps) {
  // Accessibility IDs
  const vendorInputId = useId();
  const vatInputId = useId();
  const withholdingInputId = useId();

  // Form State
  const [vendorName, setVendorName] = useState<string>('');
  const [lines, setLines] = useState<ExtendedPurchaseItemLine[]>([createEmptyLine()]);

  // Tax Settings State
  const [applyVat, setApplyVat] = useState<boolean>(false);
  const [vatRate, setVatRate] = useState<number>(15);
  const [applyWithholding, setApplyWithholding] = useState<boolean>(false);
  const [withholdingRate, setWithholdingRate] = useState<number>(3);

  // UI & Validation State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lineErrors, setLineErrors] = useState<LineError[]>([{}]);

  /** Reset internal state variables back to default initial values */
  const resetFormState = useCallback(() => {
    setVendorName('');
    setLines([createEmptyLine()]);
    setLineErrors([{}]);
    setApplyVat(false);
    setVatRate(15);
    setApplyWithholding(false);
    setWithholdingRate(3);
    setErrorMessage(null);
    setIsSubmitting(false);
  }, []);

  /* Lock body scrolling & listen for Escape key */
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  /* Reset form state on modal dismiss */
  useEffect(() => {
    if (!isOpen) {
      resetFormState();
    }
  }, [isOpen, resetFormState]);

  /* Line Item Operations */
  const handleAddLine = useCallback(() => {
    setLines((prev) => [...prev, createEmptyLine()]);
    setLineErrors((prev) => [...prev, {}]);
  }, []);

  const handleRemoveLine = useCallback((index: number) => {
    setLines((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
    setLineErrors((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleLineChange = useCallback(
    (index: number, field: keyof ExtendedPurchaseItemLine, value: unknown) => {
      setLines((prev) => {
        const updated = [...prev];
        const currentLine = { ...updated[index], [field]: value };

        if (field === 'itemId') {
          const selectedItem = items.find((i) => i.id === value);
          currentLine.itemName = selectedItem?.item_name || '';
          currentLine.unitOfMeasurement =
            selectedItem?.unit || selectedItem?.unit_of_measurement || '';
        }

        // Recalculate total cost using safe integer rounding logic
        const qty = typeof currentLine.quantity === 'number' ? Math.max(0, currentLine.quantity) : 0;
        const cost = typeof currentLine.unitCost === 'number' ? Math.max(0, currentLine.unitCost) : 0;
        
        currentLine.totalCost = Math.round(qty * cost * 100) / 100;

        updated[index] = currentLine;
        return updated;
      });

      // Clear field error as input updates
      setLineErrors((prev) => {
        if (!prev[index]?.[field as keyof LineError]) return prev;
        const updatedErrors = [...prev];
        const updatedRowErrors = { ...updatedErrors[index] };
        delete updatedRowErrors[field as keyof LineError];
        updatedErrors[index] = updatedRowErrors;
        return updatedErrors;
      });
    },
    [items]
  );

  /* Financial Summary Calculations */
  const financialSummary = useMemo(() => {
    const subtotalCents = lines.reduce((acc, curr) => {
      const lineCost = Math.round((curr.totalCost || 0) * 100);
      return acc + lineCost;
    }, 0);

    const validVatRate = Math.max(0, vatRate);
    const validWithholdingRate = Math.max(0, withholdingRate);

    const subtotal = subtotalCents / 100;
    const vatAmount = applyVat ? Math.round((subtotalCents * validVatRate) / 100) / 100 : 0;
    const withholdingAmount = applyWithholding
      ? Math.round((subtotalCents * validWithholdingRate) / 100) / 100
      : 0;

    const grandTotal = Math.max(0, subtotal + vatAmount - withholdingAmount);

    return {
      subtotal,
      vatAmount,
      withholdingAmount,
      grandTotal: Math.round(grandTotal * 100) / 100,
    };
  }, [lines, applyVat, vatRate, applyWithholding, withholdingRate]);

  /* Form Validation */
  const validateForm = (): boolean => {
    const errors: LineError[] = lines.map((line) => {
      const err: LineError = {};
      
      if (!line.itemId) {
        err.itemId = t?.requiredItem || 'Item required';
      }
      if (line.quantity === '' || typeof line.quantity !== 'number' || line.quantity <= 0) {
        err.quantity = t?.invalidQty || 'Invalid Qty';
      }
      if (!line.unitOfMeasurement) {
        err.unitOfMeasurement = t?.requiredUom || 'UOM required';
      }
      if (line.unitCost === '' || typeof line.unitCost !== 'number' || line.unitCost <= 0) {
        err.unitCost = t?.invalidCost || 'Cost required';
      }
      return err;
    });

    setLineErrors(errors);
    return errors.every((err) => Object.keys(err).length === 0);
  };

  /* Submit Form */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) {
      setErrorMessage(
        t?.invalidLineError || 'Please complete all required item fields marked in red.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      
      const cleanedItems = lines.map(({ _id, ...rest }) => ({
        ...rest,
        quantity: Number(rest.quantity) || 0,
        unitCost: Number(rest.unitCost) || 0,
      }));

      await onSavePurchase({
        vendorName: vendorName.trim() || t?.directRestock || 'Direct Restock',
        items: cleanedItems,
        subtotal: financialSummary.subtotal,
        vatAmount: financialSummary.vatAmount,
        withholdingAmount: financialSummary.withholdingAmount,
        totalAmount: financialSummary.grandTotal,
        applyVat,
        applyWithholding,
        vatRate: applyVat ? vatRate : 0,
        withholdingRate: applyWithholding ? withholdingRate : 0,
      });

      onClose();
    } catch (err: unknown) {
      const errorStr =
        err instanceof Error
          ? err.message
          : t?.failedToRecordPurchase || 'Failed to record purchase. Please try again.';
      setErrorMessage(errorStr);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 antialiased"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-purchase-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#1a5fb4]" />
            <h2 id="modal-purchase-title" className="font-bold text-sm text-slate-900 dark:text-white">
              {t?.recordPurchase || 'Record Stock Restock'}
            </h2>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#1a5fb4]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} noValidate className="p-4 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div
              role="alert"
              className="flex items-center gap-2 text-xs bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 p-2.5 rounded-xl border border-red-200 dark:border-red-800"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Vendor Name */}
          <div>
            <label htmlFor={vendorInputId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t?.vendorName || 'Supplier / Vendor Name'}
            </label>
            <input
              id={vendorInputId}
              type="text"
              placeholder={t?.vendorNamePlaceholder || 'e.g. Wholesale Distributor, Direct Import'}
              value={vendorName}
              disabled={isSubmitting}
              onChange={(e) => setVendorName(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#1a5fb4] dark:text-white transition-colors"
            />
          </div>

          {/* Dynamic Lines */}
          <div className="space-y-3">
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t?.restockItems || 'Restock Line Items'}
            </span>

            {lines.map((line, idx) => {
              const errors = lineErrors[idx] || {};
              const qtyErrorId = `qty-error-${line._id}`;
              const uomErrorId = `uom-error-${line._id}`;
              const costErrorId = `cost-error-${line._id}`;

              return (
                <div
                  key={line._id}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800"
                >
                  {/* Item Select */}
                  <div className="flex-1 w-full">
                    <div className={errors.itemId ? 'ring-2 ring-red-500 rounded-lg' : ''}>
                      <SearchableItemSelect
                        items={items}
                        selectedItemId={line.itemId}
                        disabled={isSubmitting}
                        onSelect={(id) => handleLineChange(idx, 'itemId', id)}
                        t={t}
                      />
                    </div>
                    {errors.itemId && (
                      <span className="text-[10px] text-red-500 font-medium pl-1 mt-0.5 block">
                        {errors.itemId}
                      </span>
                    )}
                  </div>

                  <div className="flex items-start gap-1.5 w-full sm:w-auto">
                    {/* Quantity */}
                    <div className="w-16">
                      <input
                        type="number"
                        min="1"
                        placeholder={t?.qtyPlaceholder || 'Qty'}
                        aria-label="Quantity"
                        aria-invalid={Boolean(errors.quantity)}
                        aria-describedby={errors.quantity ? qtyErrorId : undefined}
                        disabled={isSubmitting}
                        value={line.quantity}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleLineChange(
                            idx,
                            'quantity',
                            val === '' ? '' : parseInt(val, 10)
                          );
                        }}
                        className={`w-full text-xs px-2 py-2 bg-white dark:bg-slate-800 border ${
                          errors.quantity
                            ? 'border-red-500 ring-2 ring-red-500/20'
                            : 'border-slate-200 dark:border-slate-700'
                        } rounded-lg dark:text-white text-center focus:outline-none focus:border-[#1a5fb4]`}
                      />
                      {errors.quantity && (
                        <span id={qtyErrorId} className="text-[10px] text-red-500 font-medium text-center block mt-0.5">
                          {errors.quantity}
                        </span>
                      )}
                    </div>

                    {/* UOM Dropdown */}
                    <div className="w-24">
                      <select
                        value={line.unitOfMeasurement || ''}
                        disabled={isSubmitting}
                        aria-label="Unit of measurement"
                        aria-invalid={Boolean(errors.unitOfMeasurement)}
                        aria-describedby={errors.unitOfMeasurement ? uomErrorId : undefined}
                        onChange={(e) => handleLineChange(idx, 'unitOfMeasurement', e.target.value)}
                        className={`w-full text-xs px-1.5 py-2 bg-white dark:bg-slate-800 border ${
                          errors.unitOfMeasurement
                            ? 'border-red-500 ring-2 ring-red-500/20'
                            : 'border-slate-200 dark:border-slate-700'
                        } rounded-lg dark:text-white focus:outline-none focus:border-[#1a5fb4] text-center`}
                      >
                        <option value="" disabled>
                          {t?.selectUom || 'Select UOM'}
                        </option>
                        {BASE_UOMS.map((uom) => {
                          const label = getLocalizedUom(uom, t);
                          return (
                            <option key={uom} value={label}>
                              {label}
                            </option>
                          );
                        })}
                      </select>
                      {errors.unitOfMeasurement && (
                        <span id={uomErrorId} className="text-[10px] text-red-500 font-medium text-center block mt-0.5">
                          {errors.unitOfMeasurement}
                        </span>
                      )}
                    </div>

                    {/* Unit Cost */}
                    <div className="w-24">
                      <input
                        type="number"
                        step="any"
                        placeholder={t?.unitCostPlaceholder || 'Unit Cost'}
                        aria-label="Unit Cost"
                        aria-invalid={Boolean(errors.unitCost)}
                        aria-describedby={errors.unitCost ? costErrorId : undefined}
                        disabled={isSubmitting}
                        value={line.unitCost}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleLineChange(
                            idx,
                            'unitCost',
                            val === '' ? '' : parseFloat(val)
                          );
                        }}
                        className={`w-full text-xs px-2 py-2 bg-white dark:bg-slate-800 border ${
                          errors.unitCost
                            ? 'border-red-500 ring-2 ring-red-500/20'
                            : 'border-slate-200 dark:border-slate-700'
                        } rounded-lg dark:text-white text-right focus:outline-none focus:border-[#1a5fb4]`}
                      />
                      {errors.unitCost && (
                        <span id={costErrorId} className="text-[10px] text-red-500 font-medium text-right block mt-0.5">
                          {errors.unitCost}
                        </span>
                      )}
                    </div>

                    {/* Remove Row Button */}
                    {lines.length > 1 && (
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleRemoveLine(idx)}
                        aria-label={`Remove row ${idx + 1}`}
                        className="text-slate-400 hover:text-red-500 p-1.5 transition-colors rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleAddLine}
              className="flex items-center gap-1 text-xs text-[#1a5fb4] dark:text-blue-400 font-bold hover:underline pt-1 focus:outline-none"
            >
              <Plus className="w-3.5 h-3.5" />
              {t?.addAnotherItem || 'Add Another Item'}
            </button>
          </div>

          {/* Tax Controls */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {t?.taxesAndDeductions || 'Taxes & Deductions'}
            </span>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyVat}
                  disabled={isSubmitting}
                  onChange={(e) => setApplyVat(e.target.checked)}
                  className="rounded border-slate-300 text-[#1a5fb4] focus:ring-[#1a5fb4]"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {t?.includeVat || 'Include VAT'}
                </span>
                {applyVat && (
                  <div className="flex items-center gap-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-1.5 py-0.5">
                    <input
                      id={vatInputId}
                      type="number"
                      min="0"
                      max="100"
                      disabled={isSubmitting}
                      value={vatRate}
                      aria-label="VAT percentage rate"
                      onChange={(e) => setVatRate(Math.max(0, Number(e.target.value) || 0))}
                      className="w-8 text-center text-xs bg-transparent dark:text-white focus:outline-none font-bold"
                    />
                    <Percent className="w-3 h-3 text-slate-400" />
                  </div>
                )}
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyWithholding}
                  disabled={isSubmitting}
                  onChange={(e) => setApplyWithholding(e.target.checked)}
                  className="rounded border-slate-300 text-[#1a5fb4] focus:ring-[#1a5fb4]"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {t?.deductWithholding || 'Deduct Withholding (WT)'}
                </span>
                {applyWithholding && (
                  <div className="flex items-center gap-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-1.5 py-0.5">
                    <input
                      id={withholdingInputId}
                      type="number"
                      min="0"
                      max="100"
                      disabled={isSubmitting}
                      value={withholdingRate}
                      aria-label="Withholding percentage rate"
                      onChange={(e) => setWithholdingRate(Math.max(0, Number(e.target.value) || 0))}
                      className="w-8 text-center text-xs bg-transparent dark:text-white focus:outline-none font-bold"
                    />
                    <Percent className="w-3 h-3 text-slate-400" />
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Financial Totals Display */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>{t?.subtotal || 'Subtotal'}:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {formatNumber(financialSummary.subtotal)} {t?.currencyEtb || 'ETB'}
              </span>
            </div>

            {applyVat && (
              <div className="flex justify-between text-slate-500">
                <span>{t?.vatLabel || 'VAT'} ({vatRate}%):</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  +{formatNumber(financialSummary.vatAmount)} {t?.currencyEtb || 'ETB'}
                </span>
              </div>
            )}

            {applyWithholding && (
              <div className="flex justify-between text-slate-500">
                <span>{t?.withholdingTaxLabel || 'Withholding Tax'} ({withholdingRate}%):</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  -{formatNumber(financialSummary.withholdingAmount)} {t?.currencyEtb || 'ETB'}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-1.5 border-t border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-800 dark:text-white">
                {t?.netPayableAmount || 'Net Payable Amount'}:
              </span>
              <span className="text-base font-extrabold text-[#1a5fb4] dark:text-blue-400">
                {formatNumber(financialSummary.grandTotal)} {t?.currencyEtb || 'ETB'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1a5fb4]"
            >
              {t?.cancel || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#1a5fb4] hover:bg-[#14498c] text-white transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#1a5fb4]"
            >
              {isSubmitting ? (
                <span>{t?.saving || 'Saving...'}</span>
              ) : (
                <span>{t?.savePurchase || 'Save Purchase'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}