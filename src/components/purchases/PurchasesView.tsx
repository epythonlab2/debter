// src/components/views/PurchasesView.tsx
import React, { useState } from 'react';
import { Plus, Receipt, Truck, Calendar, AlertCircle, Trash2, Loader2, Tag } from 'lucide-react';
import { RecordPurchaseModal } from '../modals/RecordPurchaseModal';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal';
import { PurchaseRecord } from '../../types';
import { ItemRecord } from "../../types/inventory";

interface PurchasesViewProps {
  purchases: PurchaseRecord[];
  items: ItemRecord[];
  currentUser: { 
    id: string;
    shopId?: string | null; 
    shop_id?: string | null; 
    role?: string;
  };
  onRecordPurchase: (data: any) => Promise<any>;
  onDeletePurchase?: (purchaseId: string) => Promise<any>;
  t: any;
  lang?: string;
}

export default function PurchasesView({
  purchases,
  items,
  currentUser,
  onRecordPurchase,
  onDeletePurchase,
  t,
  lang = 'en'
}: PurchasesViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Safely resolve shopId across snake_case, camelCase, or null values
  const resolvedShopId = currentUser?.shop_id || currentUser?.shopId || '';
  const hasNoShop = !resolvedShopId && currentUser?.role !== 'super_admin';

  // Modal Handlers
  const handleCloseDeleteModal = () => {
    setPendingDeleteId(null);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId || !onDeletePurchase) return;

    const idToProcess = pendingDeleteId;
    setPendingDeleteId(null);
    setDeletingId(idToProcess);

    try {
      await onDeletePurchase(idToProcess);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto px-4 py-3 font-sans">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#1a5fb4]" />
            {t?.purchasesTitle || "Stock Purchases & Receipts"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t?.purchasesSubtitle || "Log inventory receipts, taxes, and wholesale costs"}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          disabled={hasNoShop}
          title={hasNoShop ? "No shop assigned to your account" : ""}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
            hasNoShop 
              ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
              : 'bg-[#1a5fb4] hover:bg-[#14498c] text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{t?.newPurchase || "New Purchase"}</span>
        </button>
      </div>

      {/* Warning banner if current user has no assigned shop */}
      {hasNoShop && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Your account is not assigned to a shop. Please contact an admin to enable purchasing.</span>
        </div>
      )}

      {/* Purchases History List */}
      <div className="space-y-3">
        {purchases.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
            <Receipt className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-xs text-slate-500 font-medium">No purchase receipts recorded yet.</p>
          </div>
        ) : (
          purchases.map((pur: any, idx: number) => {
            const vendorName = pur.supplier_name || pur.vendor_name || 'Direct Restock';
            const totalAmount = Number(pur.total_amount || pur.total_cost || 0);
            const subtotal = Number(pur.subtotal || totalAmount);
            const vatAmount = Number(pur.vat_amount || 0);
            const withholdingAmount = Number(pur.withholding_amount || 0);
            const isDeleting = deletingId === pur.id;

            const isVatApplied = pur.is_vat_applied || vatAmount > 0;
            const isWithholdingApplied = pur.is_withholding_applied || withholdingAmount > 0;

            // Unique key handles flattened multi-item receipts sharing the same parent purchase ID
            const uniqueCardKey = `${pur.id}-${pur.item_id || idx}`;

            return (
              <div
                key={uniqueCardKey}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors space-y-2.5"
              >
                {/* Receipt Card Header */}
                <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800/60 pb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900 dark:text-white block">
                        {vendorName}
                      </span>
                      
                      {/* Tax Badges */}
                      {isVatApplied && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          +VAT
                        </span>
                      )}
                      {isWithholdingApplied && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          -WT
                        </span>
                      )}
                    </div>

                    {pur.invoice_ref && (
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        Ref: #{pur.invoice_ref}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-extrabold text-xs text-[#1a5fb4] dark:text-blue-400 block">
                        {totalAmount.toFixed(2)} ETB
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {pur.purchase_date}
                      </span>
                    </div>

                    {/* Delete Action Button */}
                    {onDeletePurchase && (
                      <button
                        onClick={() => setPendingDeleteId(pur.id)}
                        disabled={isDeleting}
                        title="Delete receipt"
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Line Items List */}
                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                  {pur.purchase_items && pur.purchase_items.length > 0 ? (
                    pur.purchase_items.map((pi: any, itemIdx: number) => {
                      const itemName = pi.items?.item_name || pi.item_name || 'Restock Item';
                      const uom = pi.unit_of_measurement || pi.unit || 'Pcs';
                      const lineTotal = Number(pi.total_cost || 0);
                      const uniqueItemKey = pi.id || `${pur.id}-item-${itemIdx}`;

                      return (
                        <div key={uniqueItemKey} className="flex justify-between items-center text-[11px] text-slate-600 dark:text-slate-300">
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                            {itemName}
                            <span className="font-semibold text-slate-400">
                              ({pi.quantity} {uom})
                            </span>
                          </span>
                          <span className="font-semibold">{lineTotal.toFixed(2)} ETB</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                      <span>{pur.item_name || 'SKU Restock'} x {pur.quantity || 1}</span>
                      <span className="font-medium">
                        @{Number(pur.cost_price || (totalAmount / (pur.quantity || 1))).toFixed(2)} ETB / unit
                      </span>
                    </div>
                  )}
                </div>

                {/* Tax & Financial Breakdown Summary */}
                {(isVatApplied || isWithholdingApplied) && (
                  <div className="pt-1.5 text-[10px] text-slate-500 dark:text-slate-400 flex flex-wrap justify-between gap-2 border-t border-slate-100 dark:border-slate-800/60">
                    <span>Subtotal: <strong className="text-slate-700 dark:text-slate-300">{subtotal.toFixed(2)} ETB</strong></span>
                    {isVatApplied && (
                      <span className="text-emerald-600 dark:text-emerald-400">+VAT: {vatAmount.toFixed(2)} ETB</span>
                    )}
                    {isWithholdingApplied && (
                      <span className="text-amber-600 dark:text-amber-400">-WT: {withholdingAmount.toFixed(2)} ETB</span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Record Purchase Modal */}
      <RecordPurchaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        items={items as any}
        onSavePurchase={async (formData) => {
          await onRecordPurchase({
            ...formData,
            shopId: resolvedShopId,
            shop_id: resolvedShopId,
            userId: currentUser.id,
            user_id: currentUser.id,
          });
          setIsModalOpen(false);
        }}
        t={t}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(pendingDeleteId)}
        onClose={handleCloseDeleteModal}
        onConfirm={confirmDelete}
        t={t}
        lang={lang}
      />
    </div>
  );
}