// src/components/inventory/InventoryRow.tsx
import React, { useCallback } from 'react';
import { Edit3, Trash2, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { InventoryRowProps } from '../../types/inventory';

interface ExtendedInventoryRowProps extends InventoryRowProps {
  /** Whether this specific row item is currently multi-selected */
  isSelected?: boolean;
  /** Optional callback triggered when toggling the selection checkbox */
  onSelectToggle?: (id: string) => void;
}

/**
 * InventoryRow Component
 * 
 * Renders an individual row in the inventory list table.
 * - Handles calculation and badges for stock status (Out of Stock, Low Stock, In Stock).
 * - Safe numeric parsing and dynamic formatting for cost, selling pricing, and quantities.
 * - Event-isolated row action buttons (Edit, Delete, Checkbox toggle).
 */
const InventoryRow = React.memo(React.forwardRef<HTMLTableRowElement, ExtendedInventoryRowProps>(
  ({ item, onEdit, onDelete, t, isSelected = false, onSelectToggle }, ref) => {
    // 1. Data Normalization: Guard against NaN or missing numerical data from APIs
    const stockCount = Number(item.quantity ?? 0);
    const minThreshold = Number(item.min_stock_level ?? 5);
    const itemUnit = item.unit || t.pcs || 'pcs';
    const rawCostPrice = Number(item.cost_price ?? 0);
    const rawPrice = Number(item.default_price ?? 0);

    // Dynamic stock status conditions
    const isOutOfStock = stockCount <= 0;
    const isLowStock = !isOutOfStock && stockCount <= minThreshold;

    // 2. Event Isolation Handlers: Stop event propagation to prevent unintended row clicks
    const handleSelectToggle = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        onSelectToggle?.(item.id);
      },
      [onSelectToggle, item.id]
    );

    const handleEdit = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        onEdit(item);
      },
      [onEdit, item]
    );

    const handleDelete = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        onDelete('item', item.id);
      },
      [onDelete, item.id]
    );

    return (
      <tr 
        ref={ref} 
        className={`hover:bg-slate-50/80 dark:hover:bg-slate-950/40 transition-colors duration-150 group ${
          isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
        }`}
      >
        {/* Multi-select Checkbox Cell */}
        {onSelectToggle && (
          <td className="py-3.5 px-4 text-center">
            <input 
              type="checkbox"
              checked={isSelected}
              onChange={handleSelectToggle}
              aria-label={`Select item ${item.item_name}`}
              className="rounded border-slate-300 dark:border-slate-700 text-[#1a5fb4] focus:ring-[#1a5fb4]/20 cursor-pointer"
            />
          </td>
        )}

        {/* Item Name & SKU / Code */}
        <td className="py-3.5 px-5">
          <div className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
            {item.item_name}
          </div>
          {item.code && (
            <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
              SKU: {item.code}
            </div>
          )}
        </td>

        {/* Unit of Measure */}
        <td className="py-3.5 px-4 text-center whitespace-nowrap text-xs font-semibold text-slate-500 dark:text-slate-400">
          {itemUnit}
        </td>
        
        {/* Stock Quantity */}
        <td className="py-3.5 px-4 text-center whitespace-nowrap">
          <span className="font-semibold text-slate-700 dark:text-slate-300">{stockCount}</span>
        </td>

        {/* Stock Status Label */}
        <td className="py-3.5 px-4 text-center whitespace-nowrap">
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              <XCircle className="w-3 h-3 stroke-[2.5]" />
              {t.outOfStock || "Out of Stock"}
            </span>
          ) : isLowStock ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              <AlertCircle className="w-3 h-3 stroke-[2.5]" />
              {t.lowStock || "Low Stock"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
              {t.inStock || "In Stock"}
            </span>
          )}
        </td>

        {/* Unit Cost Price */}
        <td className="py-3.5 px-5 text-right font-medium text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">
          {rawCostPrice.toLocaleString(undefined, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })}
          <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500 font-sans tracking-wide ml-1">
            {t.currency || "ETB"}
          </span>
        </td>
        
        {/* Unit Selling Price */}
        <td className="py-3.5 px-5 text-right font-bold text-[#1a5fb4] dark:text-blue-400 font-mono whitespace-nowrap">
          {rawPrice.toLocaleString(undefined, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })}
          <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500 font-sans tracking-wide ml-1">
            {t.currency || "ETB"}
          </span>
        </td>
        
        {/* Row Action Buttons */}
        <td className="py-3.5 px-5 text-center whitespace-nowrap">
          <div className="flex items-center justify-center gap-1">
            <button 
              type="button"
              onClick={handleEdit} 
              aria-label={`Edit ${item.item_name}`}
              className="p-1.5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-[#1a5fb4] dark:hover:text-blue-400 hover:bg-[#1a5fb4]/5 dark:hover:bg-blue-500/10 transition-colors cursor-pointer"
              title={t.edit || "Edit item"}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button 
              type="button"
              onClick={handleDelete} 
              aria-label={`Delete ${item.item_name}`}
              className="p-1.5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              title={t.deleteBtn || "Delete item"}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>
    );
  }
));

InventoryRow.displayName = 'InventoryRow';
export default InventoryRow;