// src/components/modals/RecordPurchaseModal.tsx
import React, { useState } from 'react';
import { X, Plus, Trash2, ShoppingBag, Percent } from 'lucide-react';
import { PurchaseItemLine } from '../../types';
import { ItemRecord } from '@/types/inventory';

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
  t: Record<string, string>;
}

const COMMON_UOMS = ['Pcs', 'Kg', 'Ltr', 'Box', 'Meter', 'Pack', 'Carton', 'Set'];

export function RecordPurchaseModal({
  isOpen,
  onClose,
  items,
  onSavePurchase,
  t,
}: RecordPurchaseModalProps) {
  const [vendorName, setVendorName] = useState('');
  const [lines, setLines] = useState<ExtendedPurchaseItemLine[]>([
    { itemId: '', quantity: 1, unitCost: 0, totalCost: 0, unitOfMeasurement: 'Pcs' },
  ]);

  // Tax States
  const [applyVat, setApplyVat] = useState(false);
  const [vatRate, setVatRate] = useState(15); // Standard Ethiopian VAT (15%)
  
  const [applyWithholding, setApplyWithholding] = useState(false);
  const [withholdingRate, setWithholdingRate] = useState(2); // Standard Withholding (2%)

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Add line item
  const handleAddLine = () => {
    setLines([
      ...lines,
      { itemId: '', quantity: 1, unitCost: 0, totalCost: 0, unitOfMeasurement: 'Pcs' },
    ]);
  };

  // Remove line item
  const handleRemoveLine = (index: number) => {
    if (lines.length === 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  // Handle input changes per line
  const handleLineChange = (
    index: number,
    field: keyof ExtendedPurchaseItemLine,
    value: any
  ) => {
    const updated = [...lines];
    const line = { ...updated[index], [field]: value };

    // Auto-fill Item Name & Unit of Measurement if selecting Item ID
    if (field === 'itemId') {
      const selectedItem = items.find((i: any) => i.id === value);
      line.itemName = selectedItem?.item_name || '';
      
      // Infer UOM from existing item schema if present
      const defaultUom = (selectedItem as any)?.unit || (selectedItem as any)?.unit_of_measurement || 'Pcs';
      line.unitOfMeasurement = defaultUom;
    }

    // Auto-recalculate line subtotal
    const qty = Number(line.quantity) || 0;
    const cost = Number(line.unitCost) || 0;
    line.totalCost = qty * cost;

    updated[index] = line;
    setLines(updated);
  };

  // Financial Calculations
  const subtotal = lines.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);
  const vatAmount = applyVat ? (subtotal * (vatRate / 100)) : 0;
  const withholdingAmount = applyWithholding ? (subtotal * (withholdingRate / 100)) : 0;
  const grandTotal = subtotal + vatAmount - withholdingAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    const invalidLines = lines.some((l) => !l.itemId || l.quantity <= 0 || l.unitCost < 0);
    if (invalidLines) {
      setErrorMessage('Please select an item, quantity, and unit cost for all lines.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSavePurchase({
        vendorName: vendorName.trim() || 'Direct Restock',
        items: lines,
        subtotal,
        vatAmount,
        withholdingAmount,
        totalAmount: grandTotal,
        applyVat,
        applyWithholding,
        vatRate: applyVat ? vatRate : 0,
        withholdingRate: applyWithholding ? withholdingRate : 0,
      });

      // Reset form on success
      setVendorName('');
      setLines([{ itemId: '', quantity: 1, unitCost: 0, totalCost: 0, unitOfMeasurement: 'Pcs' }]);
      setApplyVat(false);
      setApplyWithholding(false);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to record purchase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden font-sans">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#025da6]" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {t?.recordPurchase || "Record Stock Restock"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="text-xs bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 p-2.5 rounded-xl border border-red-200 dark:border-red-800">
              {errorMessage}
            </div>
          )}

          {/* Supplier Name Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t?.vendorName || "Supplier / Vendor Name"}
            </label>
            <input
              type="text"
              placeholder="e.g. Wholesale Distributor, Direct Import"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#025da6] dark:text-white"
            />
          </div>

          {/* Line Items Section */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t?.restockItems || "Restock Line Items"}
            </label>

            {lines.map((line, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800"
              >
                {/* Item Dropdown */}
                <div className="flex-1">
                  <select
                    value={line.itemId}
                    onChange={(e) => handleLineChange(idx, 'itemId', e.target.value)}
                    className="w-full text-xs px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:outline-none"
                    required
                  >
                    <option value="">-- Select Item --</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.item_name} (Stock: {item.quantity})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Quantity */}
                  <div className="w-16">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={line.quantity}
                      onChange={(e) =>
                        handleLineChange(idx, 'quantity', parseInt(e.target.value) || 0)
                      }
                      className="w-full text-xs px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white text-center focus:outline-none"
                      required
                    />
                  </div>

                  {/* Unit of Measurement (UOM) */}
                  <div className="w-20">
                    <select
                      value={line.unitOfMeasurement || 'Pcs'}
                      onChange={(e) => handleLineChange(idx, 'unitOfMeasurement', e.target.value)}
                      className="w-full text-xs px-1.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:outline-none text-center"
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
                      value={line.unitCost || ''}
                      onChange={(e) =>
                        handleLineChange(idx, 'unitCost', parseFloat(e.target.value) || 0)
                      }
                      className="w-full text-xs px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white text-right focus:outline-none"
                      required
                    />
                  </div>

                  {/* Delete Button */}
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddLine}
              className="flex items-center gap-1 text-xs text-[#025da6] dark:text-blue-400 font-bold hover:underline pt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Item
            </button>
          </div>

          {/* Tax Configurations (VAT & Withholding) */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Taxes & Deductions
            </span>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* VAT Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyVat}
                  onChange={(e) => setApplyVat(e.target.checked)}
                  className="rounded border-slate-300 text-[#025da6] focus:ring-[#025da6]"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Include VAT
                </span>
                {applyVat && (
                  <div className="flex items-center gap-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-1.5 py-0.5">
                    <input
                      type="number"
                      value={vatRate}
                      onChange={(e) => setVatRate(Number(e.target.value))}
                      className="w-8 text-center text-xs bg-transparent dark:text-white focus:outline-none font-bold"
                    />
                    <Percent className="w-3 h-3 text-slate-400" />
                  </div>
                )}
              </label>

              {/* Withholding Tax Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyWithholding}
                  onChange={(e) => setApplyWithholding(e.target.checked)}
                  className="rounded border-slate-300 text-[#025da6] focus:ring-[#025da6]"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Deduct Withholding (WT)
                </span>
                {applyWithholding && (
                  <div className="flex items-center gap-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-1.5 py-0.5">
                    <input
                      type="number"
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

          {/* Invoice Summary Breakdown */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {subtotal.toFixed(2)} ETB
              </span>
            </div>

            {applyVat && (
              <div className="flex justify-between text-slate-500">
                <span>VAT ({vatRate}%):</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  +{vatAmount.toFixed(2)} ETB
                </span>
              </div>
            )}

            {applyWithholding && (
              <div className="flex justify-between text-slate-500">
                <span>Withholding Tax ({withholdingRate}%):</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  -{withholdingAmount.toFixed(2)} ETB
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-1.5 border-t border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-800 dark:text-white">
                Net Payable Amount:
              </span>
              <span className="text-base font-extrabold text-[#025da6] dark:text-blue-400">
                {grandTotal.toFixed(2)} ETB
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
            >
              {t?.cancel || "Cancel"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#025da6] hover:bg-[#024982] text-white transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Purchase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}