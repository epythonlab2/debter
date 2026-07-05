// src/components/inventory/InventoryList.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { InventoryListProps, ItemRecord } from '../../types/inventory';
import InventoryRow from './InventoryRow';

interface ExtendedInventoryListProps extends InventoryListProps {
  pageSize: number;
}

const InventoryList = React.memo(({ items, onEdit, onDelete, t, pageSize }: ExtendedInventoryListProps) => {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const triggerRef = useRef<HTMLTableRowElement | null>(null);
  
  // 🟢 FIXED: Direct explicit reference wrapper to track internal table scroll container bounds
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Lazy loading kicks in for standard larger views
  const isLazyEnabled = pageSize >= 20;

  // Reset rendering chunk whenever items baseline or current pageSize updates
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [items, pageSize]);

  // Compute actual sliced rows to be rendered safely
  const renderedItems = useMemo(() => {
    if (!isLazyEnabled) return items.slice(0, pageSize);
    return items.slice(0, visibleCount);
  }, [items, visibleCount, isLazyEnabled, pageSize]);

  // IntersectionObserver to load next chunk of items on scroll boundary
  useEffect(() => {
    if (!isLazyEnabled || visibleCount >= items.length) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        // Appends chunks of 20 when scrolling
        setVisibleCount((prev) => Math.min(prev + 20, items.length));
      }
    }, { 
      // 🟢 FIXED: Connect explicitly to our localized parent container element bounds
      root: scrollContainerRef.current, 
      rootMargin: '50px' // Lowered margin value prevents over-aggressive triggers
    });

    const currentTrigger = triggerRef.current;
    if (currentTrigger) {
      observer.observe(currentTrigger);
    }

    return () => {
      if (currentTrigger) {
        observer.unobserve(currentTrigger);
      }
    };
  }, [visibleCount, items.length, isLazyEnabled]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-2xs overflow-hidden transition-colors">
      {items.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl m-4 bg-slate-50/50 dark:bg-slate-950/20 transition-colors">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">{t.noSalesGeneric}</p>
        </div>
      ) : (
        // 🟢 FIXED: Attached the boundary ref layout wrapper hook here
        <div 
          ref={scrollContainerRef} 
          className="w-full overflow-x-auto max-h-[calc(100vh-240px)] overflow-y-auto no-scrollbar"
        >
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-950 z-10 border-b border-slate-100 dark:border-slate-800/80">
              <tr className="text-slate-400 dark:text-slate-500 text-[10px] font-black tracking-widest uppercase">
                <th className="py-3 px-5">{t.itemName}</th>
                <th className="py-3 px-4 text-center">{t.stock}</th>
                <th className="py-3 px-5 text-right">{t.priceEtb}</th>
                <th className="py-3 px-5 text-center w-28">{t.actions || "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm font-normal">
              {renderedItems.map((item: ItemRecord, index: number) => {
                const isTrigger = isLazyEnabled && index === renderedItems.length - 2;
                return (
                  <InventoryRow 
                    key={item.id} 
                    item={item} 
                    onEdit={onEdit} 
                    onDelete={onDelete} 
                    t={t}
                    ref={isTrigger ? triggerRef : undefined}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

InventoryList.displayName = 'InventoryList';
export default InventoryList;
