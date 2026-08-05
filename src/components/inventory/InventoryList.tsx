// src/components/inventory/InventoryList.tsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { InventoryListProps, ItemRecord } from '../../types/inventory';
import InventoryRow from './InventoryRow';

interface ExtendedInventoryListProps extends InventoryListProps {
  /** Number of items to load initially or per batch */
  pageSize: number;
  /** Array of currently selected item IDs for batch actions */
  selectedIds?: string[];
  /** Callback fired when an individual row selection is toggled */
  onSelectToggle?: (id: string) => void;
  /** Callback fired when the master header checkbox is toggled */
  onSelectAll?: (ids: string[]) => void;
}

/**
 * InventoryList Component
 * 
 * Renders a performant, virtualized-like table of inventory items featuring:
 * - Lazy pagination via IntersectionObserver for scalable UI performance
 * - Master & row-level selection state handlers
 * - Fallback states for empty record sets
 */
const InventoryList = React.memo(({ 
  items, 
  onEdit, 
  onDelete, 
  t, 
  pageSize,
  selectedIds = [],
  onSelectToggle,
  onSelectAll
}: ExtendedInventoryListProps) => {
  // 1. Defensive Guard: Ensure fallback for undefined/null items array
  const safeItems = useMemo(() => items || [], [items]);

  // 2. State & Refs for Infinite Scroll / Lazy Loading
  const [visibleCount, setVisibleCount] = useState<number>(pageSize);
  const triggerRef = useRef<HTMLTableRowElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Enable infinite loading dynamic pagination only when page size exceeds threshold
  const isLazyEnabled = pageSize >= 20;

  // 3. Reset visible item count when data source or page configuration changes
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [safeItems, pageSize]);

  // 4. Optimize Selection Lookups: O(1) set lookup instead of O(N) array searching inside map
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  // 5. Slice rendering array based on current lazy pagination count
  const renderedItems = useMemo(() => {
    if (!isLazyEnabled) return safeItems.slice(0, pageSize);
    return safeItems.slice(0, visibleCount);
  }, [safeItems, visibleCount, isLazyEnabled, pageSize]);

  // 6. Infinite Scroll Observer Setup
  const handleObserverCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting) {
      setVisibleCount((prev) => Math.min(prev + 20, safeItems.length));
    }
  }, [safeItems.length]);

  useEffect(() => {
    if (!isLazyEnabled || visibleCount >= safeItems.length) return;

    const observer = new IntersectionObserver(handleObserverCallback, { 
      root: scrollContainerRef.current, 
      rootMargin: '100px'
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
  }, [visibleCount, safeItems.length, isLazyEnabled, handleObserverCallback]);

  // 7. Master Checkbox Logic
  const isAllSelected = useMemo(() => {
    return safeItems.length > 0 && selectedIds.length === safeItems.length;
  }, [safeItems.length, selectedIds.length]);

  const handleMasterCheckboxChange = useCallback(() => {
    if (!onSelectAll) return;
    if (isAllSelected) {
      onSelectAll([]);
    } else {
      onSelectAll(safeItems.map((item) => item.id));
    }
  }, [onSelectAll, isAllSelected, safeItems]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-2xs overflow-hidden transition-colors">
      {safeItems.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl m-4 bg-slate-50/50 dark:bg-slate-950/20 transition-colors">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
            {t.noInventoryFound || "No inventory items recorded yet."}
          </p>
        </div>
      ) : (
        <div 
          ref={scrollContainerRef} 
          className="w-full overflow-x-auto max-h-[calc(100vh-250px)] overflow-y-auto no-scrollbar"
        >
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-950 z-10 border-b border-slate-100 dark:border-slate-800/80">
              <tr className="text-slate-400 dark:text-slate-500 text-[10px] font-black tracking-widest select-none">
                {onSelectAll && (
                  <th className="py-3 px-4 w-10 text-center">
                    <input 
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleMasterCheckboxChange}
                      aria-label="Select all inventory items"
                      className="rounded border-slate-300 dark:border-slate-700 text-[#1a5fb4] focus:ring-[#1a5fb4]/20 cursor-pointer"
                    />
                  </th>
                )}
                <th className="py-3 px-5">{t.itemName || "Item Details"}</th>
                <th className="py-3 px-4 text-center">{t.unit || "Unit"}</th>
                <th className="py-3 px-4 text-center">{t.stock || "Stock Qty"}</th>
                <th className="py-3 px-4 text-center">{t.status || "Status"}</th>
                <th className="py-3 px-5 text-right">{t.unitCostEtb || "Unit Price"}</th>
                <th className="py-3 px-5 text-right">{t.priceEtb || "Selling Price"}</th>
                <th className="py-3 px-5 text-center w-28">{t.actions || "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm font-normal">
              {renderedItems.map((item: ItemRecord, index: number) => {
                // Set observer trigger near end of visible slice
                const isTrigger = isLazyEnabled && index === renderedItems.length - 2;

                return (
                  <InventoryRow 
                    key={item.id} 
                    item={item} 
                    onEdit={onEdit} 
                    onDelete={onDelete} 
                    t={t}
                    isSelected={selectedSet.has(item.id)}
                    onSelectToggle={onSelectToggle}
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