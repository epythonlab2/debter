// src/components/inventory/InventoryRow.tsx
import React from 'react';
import { Edit3, Trash2, Layers } from 'lucide-react';
import { InventoryRowProps } from '../../types/inventory';

const InventoryRow = React.memo(React.forwardRef<HTMLTableRowElement, InventoryRowProps>(
  ({ item, onEdit, onDelete, t }, ref) => {
    const stockCount = item.quantity ?? 0;

    const badgeColorClass = stockCount === 0 
      ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40" 
      : stockCount < 5 
        ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30"
        : "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30";

    return (
      <tr ref={ref} className="hover:bg-slate-50/60 dark:hover:bg-slate-950/40 transition-colors duration-150 group">
        <td className="py-3.5 px-5 font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">{item.item_name}</td>
        
        <td className="py-3.5 px-4 text-center whitespace-nowrap">
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-colors ${badgeColorClass}`}>
            <Layers className="w-3 h-3 shrink-0 stroke-[2.5]" />
            <span>{stockCount} {t.pcs} {stockCount === 0 }</span>
          </span>
        </td>
        
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
  }
));

InventoryRow.displayName = 'InventoryRow';
export default InventoryRow;
