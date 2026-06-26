// src/components/ShopManagement.tsx
import React, { useMemo } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface ShopsProps {
  shops?: any[];
  users?: any[]; 
  potentialOwners?: any[];
  handleOpenShopModal: (mode: 'create' | 'edit', shop?: any) => void;
  triggerDeleteConfirm: (type: 'shop', id: string | number) => void;
  t: any;
}

/**
 * ShopManagement Component
 * Renders the administrative dashboard view for monitoring and management of retail stores.
 * Optimizes relational user-to-shop datasets using memoized lookup matrices to ensure 
 * stable O(1) lookup performance overhead across large scale view re-renders.
 */
export default function ShopManagement({
  shops = [],
  users = [],           
  potentialOwners = [], 
  handleOpenShopModal,
  triggerDeleteConfirm,
  t
}: ShopsProps) {

  // Fallback cascade to accommodate varied parent-prop naming architectures
  const sourceOwners = potentialOwners.length > 0 ? potentialOwners : users;

  /**
   * Memoizes user structures into a key-value dictionary.
   * Eliminates nested linear O(N × M) scan complexity inside the component mapping sequence.
   */
  const ownerMap = useMemo(() => {
    const map: Record<string, any> = {};
    sourceOwners.forEach((u) => {
      if (u && u.id) {
        map[String(u.id)] = u;
      }
    });
    return map;
  }, [sourceOwners]);

  return (
    <div 
      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-6 space-y-4 shadow-xs antialiased transition-colors"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}
    >
      
      {/* Section Header Toolbar */}
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest">
          {t.crudShopsTitle || 'Shops'}
        </h3>
        <button
          type="button"
          onClick={() => handleOpenShopModal('create')}
          className="text-xs font-bold tracking-wider flex items-center gap-1 hover:opacity-80 dark:hover:text-blue-400 transition-all active:scale-95 cursor-pointer text-[#1a5fb4] dark:text-blue-500"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>{t.addShopBtn || 'Add Shop'}</span>
        </button>
      </div>

      {/* Main Dataview Context */}
      {shops.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6 font-medium">
          {t.noShopsFound || 'No shops found'}
        </p>
      ) : (
        <div className="divide-y divide-slate-100/70 dark:divide-slate-800/60">
          {shops.map((s) => {
            // Support both standard Snake Case (DB-native) and Camel Case properties
            const ownerId = String(s.owner_id || s.ownerId || '');
            const owner = ownerMap[ownerId];

            return (
              <div key={s.id} className="py-4 first:pt-1 last:pb-1 flex justify-between items-center gap-4">
                
                {/* Meta Entity Information */}
                <div className="space-y-1 min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{s.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate">{s.location}</p>
                  
                  <div className="space-y-0.5 text-xs pt-1">
                    <p className="font-bold text-[#1a5fb4] dark:text-blue-500">
                      {t.ownerLabel || 'Owner'}:{' '}
                      <span className="text-slate-600 dark:text-slate-400 font-semibold">
                        {owner?.full_name || owner?.fullName || t.na || 'N/A'}
                      </span>
                    </p>
                    
                    {owner?.identifier && (
                      <p className="text-slate-400 dark:text-slate-500 font-medium">
                        Phone: <span className="font-mono text-slate-500 dark:text-slate-400">{owner.identifier}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Inline Action Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenShopModal('edit', s)}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/80 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 transition-all active:scale-95 cursor-pointer"
                    aria-label="Edit shop"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerDeleteConfirm('shop', s.id)}
                    className="p-2.5 rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 hover:bg-rose-100/80 dark:hover:bg-rose-900/60 transition-all active:scale-95 cursor-pointer"
                    aria-label="Delete shop"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
