// src/components/QuickTapSelection.tsx
import React from 'react';
import { ItemRecord } from '../../types/inventory';
import { SalesTranslation } from '../../types/sales';

interface QuickTapSelectionProps {
  frequentItems: ItemRecord[];
  selectedItemId: string;
  isSubmitting: boolean;
  handleQuickSelect: (item: ItemRecord) => void;
  t: SalesTranslation;
}

export const QuickTapSelection: React.FC<QuickTapSelectionProps> = ({
  frequentItems,
  selectedItemId,
  isSubmitting,
  handleQuickSelect,
  t,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between px-0.5">
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
          {t.quickTap || "Quick Tap Selection"}
        </h3>
        <span className="w-2 h-2 rounded-full bg-[#1a5fb4] dark:bg-blue-500/70 animate-pulse" />
      </div>
      
      {frequentItems.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 py-6 text-center bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-dashed border-slate-200/80 dark:border-slate-800 font-normal">
          {t.regItem}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {frequentItems.map((item) => {
            const isSelected = String(selectedItemId) === String(item.id);

            return (
              <button
                key={item.id}
                type="button"
                disabled={isSubmitting}
                onClick={() => handleQuickSelect(item)}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between min-h-[92px] h-auto pb-3 transition-all duration-200 active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none cursor-pointer ${
                  isSelected 
                    ? "bg-[#1a5fb4] dark:bg-[#1a5fb4]/20 text-white dark:text-blue-100 border-[#154b91] dark:border-[#1a5fb4]/40 shadow-md shadow-[#1a5fb4]/10 dark:shadow-none scale-[1.01]" 
                    : "bg-slate-50 dark:bg-slate-950/40 hover:bg-white dark:hover:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-100 shadow-3xs"
                }`}
              >
                <span className={`text-sm font-medium line-clamp-2 leading-tight tracking-tight mb-2 ${isSelected ? "text-white dark:text-blue-200" : "text-slate-700 dark:text-slate-300"}`}>
                  {item.item_name}
                </span>
                <div className="flex items-center justify-between w-full mt-auto pt-1 gap-1">
                 
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap border ${
                    isSelected ? "bg-[#154b91]/50 dark:bg-blue-500/10 border-transparent dark:border-blue-500/20 text-white dark:text-blue-300" : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                  }`}>
                    {Number(item.quantity || 0).toLocaleString()} {t.pcs || "Pcs"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
