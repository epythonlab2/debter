// src/components/modals/RecordPurchaseModal.tsx

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom'; // <--- Correct import
import { X, Plus, Trash2, ShoppingBag, Percent, Search, ChevronDown, Check } from 'lucide-react';
import { PurchaseItemLine } from '../../types';
import { ItemRecord } from '@/types/inventory';

/* ============================================================================
   1. TYPES & INTERFACES
   ============================================================================ */

export interface ExtendedPurchaseItemLine extends PurchaseItemLine {
  unitOfMeasurement?: string;
}

interface RecordPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ItemRecord[];
  onSavePurchase: (data: {
    vendorName: string;
    items: ExtendedPurchaseItemLine[];
    subtotal: number;
    vatAmount: number;
    withholdingAmount: number;
    totalAmount: number;
    applyVat: boolean;
    applyWithholding: boolean;
    vatRate: number;
    withholdingRate: number;
  }) => Promise<void>;
  t?: Record<string, string>;
}

const COMMON_UOMS = ['Pcs', 'Kg', 'Box', 'Ltr', 'Pack', 'Carton'];

/* ============================================================================
   2. SUB-COMPONENT: SEARCHABLE ITEM SELECT DROPDOWN (MEMOIZED)
   ============================================================================ */

interface SearchableItemSelectProps {
  items: ItemRecord[];
  selectedItemId: string;
  onSelect: (itemId: string) => void;
  disabled?: boolean;
}

const SearchableItemSelect = React.memo(function SearchableItemSelect({
  items,
  selectedItemId,
  onSelect,
  disabled = false,
}: SearchableItemSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Derived selected object
  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedItemId),
    [items, selectedItemId]
  );

  // Filter items efficiently
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const query = searchTerm.toLowerCase();
    return items.filter((item) =>
      item.item_name.toLowerCase().includes(query)
    );
  }, [items, searchTerm]);

  // Click Outside Handler
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Keyboard navigation within search box
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between text-xs px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:outline-none focus:border-[#1a5fb4] focus:ring-1 focus:ring-[#1a5fb4] disabled:opacity-50 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate text-left font-medium">
          {selectedItem ? (
            <span>
              {selectedItem.item_name}{' '}
              <span className="text-slate-400 font-normal">
                (Stock: {selectedItem.quantity})
              </span>
            </span>
          ) : (
            <span className="text-slate-400">-- Select or Search Item --</span>
          )}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating Menu */}
      {isOpen && (
        <div className="absolute z-[60] left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden font-sans">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-700 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            <input
              type="text"
              placeholder="Search item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full text-xs bg-transparent dark:text-white focus:outline-none"
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1"
              >
                ×
              </button>
            )}
          </div>

          {/* Item Options */}
          <div className="max-h-48 overflow-y-auto py-1 divide-y divide-slate-50 dark:divide-slate-800/50">
            {filteredItems.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400 italic text-center">
                No items match "{searchTerm}"
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = item.id === selectedItemId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelect(item.id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-[#1a5fb4] dark:text-blue-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="block truncate">{item.item_name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Available: {item.quantity}
                      </span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-[#1a5fb4]" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
});

/* ============================================================================
   3. MAIN COMPONENT: RECORD PURCHASE MODAL
   ============================================================================ */

export function RecordPurchaseModal({
  isOpen,
  onClose,
  items,
  onSavePurchase,
  t,
}: RecordPurchaseModalProps) {
  /* --------------------------------------------------------------------------
     A. INITIAL STATES & HOOKS
     -------------------------------------------------------------------------- */
  const [vendorName, setVendorName] = useState('');
  const [lines, setLines] = useState<ExtendedPurchaseItemLine[]>([
    { itemId: '', quantity: 1, unitCost: 0, totalCost: 0, unitOfMeasurement: 'Pcs' },
  ]);

  // Tax States
  const [applyVat, setApplyVat] = useState(false);
  const [vatRate, setVatRate] = useState(15);

  const [applyWithholding, setApplyWithholding] = useState(false);
  const [withholdingRate, setWithholdingRate] = useState(2);

  // Status & Lock States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /* --------------------------------------------------------------------------
     B. BODY SCROLL LOCKING & ESCAPE KEY LISTENER
     -------------------------------------------------------------------------- */
  useEffect(() => {
    if (!isOpen) return;

    // Prevent background scrolling while modal is open
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Handle ESC key press
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  /* --------------------------------------------------------------------------
     C. LINE ITEM ACTIONS
     -------------------------------------------------------------------------- */
  const handleAddLine = useCallback(() => {
    setLines((prev) => [
      ...prev,
      { itemId: '', quantity: 1, unitCost: 0, totalCost: 0, unitOfMeasurement: 'Pcs' },
    ]);
  }, []);

  const handleRemoveLine = useCallback((index: number) => {
    setLines((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleLineChange = useCallback(
    (index: number, field: keyof ExtendedPurchaseItemLine, value: any) => {
      setLines((prev) => {
        const updated = [...prev];
        const line = { ...updated[index], [field]: value };

        // Auto-fill Item Metadata
        if (field === 'itemId') {
          const selectedItem = items.find((i) => i.id === value);
          line.itemName = selectedItem?.item_name || '';
          const defaultUom =
            (selectedItem as any)?.unit ||
            (selectedItem as any)?.unit_of_measurement ||
            'Pcs';
          line.unitOfMeasurement = defaultUom;
        }

        // Recalculate line subtotal (Safe numerical sanitization)
        const qty = Math.max(0, Number(line.quantity) || 0);
        const cost = Math.max(0, Number(line.unitCost) || 0);
        line.totalCost = Number((qty * cost).toFixed(2));

        updated[index] = line;
        return updated;
      });
    },
    [items]
  );

  /* --------------------------------------------------------------------------
     D. FINANCIAL CALCULATIONS (MEMOIZED)
     -------------------------------------------------------------------------- */
  const financialSummary = useMemo(() => {
    const subtotal = lines.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);
    const vatAmount = applyVat ? subtotal * (Math.max(0, vatRate) / 100) : 0;
    const withholdingAmount = applyWithholding
      ? subtotal * (Math.max(0, withholdingRate) / 100)
      : 0;
    const grandTotal = subtotal + vatAmount - withholdingAmount;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      vatAmount: Number(vatAmount.toFixed(2)),
      withholdingAmount: Number(withholdingAmount.toFixed(2)),
      grandTotal: Number(Math.max(0, grandTotal).toFixed(2)),
    };
  }, [lines, applyVat, vatRate, applyWithholding, withholdingRate]);

  /* --------------------------------------------------------------------------
     E. FORM SUBMISSION
     -------------------------------------------------------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form Validation Rules
    const hasInvalidLine = lines.some(
      (l) => !l.itemId || l.quantity <= 0 || l.unitCost < 0
    );

    if (hasInvalidLine) {
      setErrorMessage('Please select an item, valid quantity, and unit cost for all lines.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSavePurchase({
        vendorName: vendorName.trim() || 'Direct Restock',
        items: lines,
        subtotal: financialSummary.subtotal,
        vatAmount: financialSummary.vatAmount,
        withholdingAmount: financialSummary.withholdingAmount,
        totalAmount: financialSummary.grandTotal,
        applyVat,
        applyWithholding,
        vatRate: applyVat ? vatRate : 0,
        withholdingRate: applyWithholding ? withholdingRate : 0,
      });

      // Reset Modal Form
      setVendorName('');
      setLines([{ itemId: '', quantity: 1, unitCost: 0, totalCost: 0, unitOfMeasurement: 'Pcs' }]);
      setApplyVat(false);
      setApplyWithholding(false);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to record purchase. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  /* --------------------------------------------------------------------------
     F. PORTAL RENDER
     -------------------------------------------------------------------------- */
  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 antialiased"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#1a5fb4]" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {t?.recordPurchase || 'Record Stock Restock'}
            </h3>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="text-xs bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 p-2.5 rounded-xl border border-red-200 dark:border-red-800">
              {errorMessage}
            </div>
          )}

          {/* Vendor Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t?.vendorName || 'Supplier / Vendor Name'}
            </label>
            <input
              type="text"
              placeholder="e.g. Wholesale Distributor, Direct Import"
              value={vendorName}
              disabled={isSubmitting}
              onChange={(e) => setVendorName(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#1a5fb4] dark:text-white"
            />
          </div>

          {/* Dynamic Restock Lines */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t?.restockItems || 'Restock Line Items'}
            </label>

            {lines.map((line, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800"
              >
                {/* Searchable Select */}
                <SearchableItemSelect
                  items={items}
                  selectedItemId={line.itemId}
                  disabled={isSubmitting}
                  onSelect={(id) => handleLineChange(idx, 'itemId', id)}
                />

                <div className="flex items-center gap-1.5">
                  {/* Quantity */}
                  <div className="w-16">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      disabled={isSubmitting}
                      value={line.quantity || ''}
                      onChange={(e) =>
                        handleLineChange(idx, 'quantity', parseInt(e.target.value, 10) || 0)
                      }
                      className="w-full text-xs px-2 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white text-center focus:outline-none"
                      required
                    />
                  </div>

                  {/* UOM */}
                  <div className="w-20">
                    <select
                      value={line.unitOfMeasurement || 'Pcs'}
                      disabled={isSubmitting}
                      onChange={(e) => handleLineChange(idx, 'unitOfMeasurement', e.target.value)}
                      className="w-full text-xs px-1.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:outline-none text-center"
                    >
                      {COMMON_UOMS.map((uom) => (
                        <option key={uom} value={uom}>
                          {uom}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Unit Cost */}
                  <div className="w-24">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Unit Cost"
                      disabled={isSubmitting}
                      value={line.unitCost || ''}
                      onChange={(e) =>
                        handleLineChange(idx, 'unitCost', parseFloat(e.target.value) || 0)
                      }
                      className="w-full text-xs px-2 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white text-right focus:outline-none"
                      required
                    />
                  </div>

                  {/* Delete Row Button */}
                  {lines.length > 1 && (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleRemoveLine(idx)}
                      className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleAddLine}
              className="flex items-center gap-1 text-xs text-[#1a5fb4] dark:text-blue-400 font-bold hover:underline pt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Item
            </button>
          </div>

          {/* Tax Toggles */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Taxes & Deductions
            </span>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* VAT Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyVat}
                  disabled={isSubmitting}
                  onChange={(e) => setApplyVat(e.target.checked)}
                  className="rounded border-slate-300 text-[#1a5fb4] focus:ring-[#1a5fb4]"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Include VAT
                </span>
                {applyVat && (
                  <div className="flex items-center gap-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-1.5 py-0.5">
                    <input
                      type="number"
                      min="0"
                      disabled={isSubmitting}
                      value={vatRate}
                      onChange={(e) => setVatRate(Number(e.target.value))}
                      className="w-8 text-center text-xs bg-transparent dark:text-white focus:outline-none font-bold"
                    />
                    <Percent className="w-3 h-3 text-slate-400" />
                  </div>
                )}
              </label>

              {/* Withholding Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyWithholding}
                  disabled={isSubmitting}
                  onChange={(e) => setApplyWithholding(e.target.checked)}
                  className="rounded border-slate-300 text-[#1a5fb4] focus:ring-[#1a5fb4]"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Deduct Withholding (WT)
                </span>
                {applyWithholding && (
                  <div className="flex items-center gap-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-1.5 py-0.5">
                    <input
                      type="number"
                      min="0"
                      disabled={isSubmitting}
                      value={withholdingRate}
                      onChange={(e) => setWithholdingRate(Number(e.target.value))}
                      className="w-8 text-center text-xs bg-transparent dark:text-white focus:outline-none font-bold"
                    />
                    <Percent className="w-3 h-3 text-slate-400" />
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Financial Totals */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {financialSummary.subtotal.toFixed(2)} ETB
              </span>
            </div>

            {applyVat && (
              <div className="flex justify-between text-slate-500">
                <span>VAT ({vatRate}%):</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  +{financialSummary.vatAmount.toFixed(2)} ETB
                </span>
              </div>
            )}

            {applyWithholding && (
              <div className="flex justify-between text-slate-500">
                <span>Withholding Tax ({withholdingRate}%):</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  -{financialSummary.withholdingAmount.toFixed(2)} ETB
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-1.5 border-t border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-800 dark:text-white">
                Net Payable Amount:
              </span>
              <span className="text-base font-extrabold text-[#1a5fb4] dark:text-blue-400">
                {financialSummary.grandTotal.toFixed(2)} ETB
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {t?.cancel || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#1a5fb4] hover:bg-[#14498c] text-white transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <span>Save Purchase</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Safely render via portal directly on document.body
  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}