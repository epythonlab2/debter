// src/components/purchases/ReceiptCardItem.tsx
import React from 'react';
import { Calendar, Trash2, Loader2 } from 'lucide-react';
import { GroupedReceipt, PurchaseItem } from '../../hooks/usePurchasesLedger';
import { formatNumber } from '../../utils/formatters';

interface ReceiptCardItemProps {
  receipt: GroupedReceipt;
  isDeleting: boolean;
  onDeleteRequest?: (id: string) => void;
  t: Record<string, any>;
}

export const ReceiptCardItem: React.FC<ReceiptCardItemProps> = ({
  receipt,
  isDeleting,
  onDeleteRequest,
  t
}) => {
  const subtotal = receipt.subtotal || receipt.total_amount;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2.5 shadow-sm print:break-inside-avoid print:border-slate-300 print:shadow-none print:bg-white print:text-black">
      {/* HEADER SECTION */}
      <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 print:border-slate-300 pb-2 gap-2">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-sm text-slate-900 dark:text-white print:text-black truncate">
              {receipt.vendor_name}
            </span>
            
            {receipt.is_vat_applied && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 print:bg-white print:border-slate-300 print:text-emerald-800 shrink-0">
                +VAT 15%
              </span>
            )}
            {receipt.is_withholding_applied && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800 print:bg-white print:border-slate-300 print:text-amber-800 shrink-0">
                -WT 3%
              </span>
            )}
          </div>

          {receipt.invoice_ref && (
            <span className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-700 font-mono block">
              Ref: #{receipt.invoice_ref}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <span className="font-bold text-sm text-blue-600 dark:text-blue-400 print:text-black whitespace-nowrap block">
              {formatNumber(receipt.total_amount)} <span className="text-xs font-semibold">{t.currency || "ETB"}</span>
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 print:text-slate-700 font-normal flex items-center justify-end gap-1 mt-0.5 whitespace-nowrap">
              <Calendar className="w-3 h-3 print:hidden shrink-0" />
              {receipt.purchase_date}
            </span>
          </div>

          {onDeleteRequest && (
            <button
              onClick={() => onDeleteRequest(receipt.id)}
              disabled={isDeleting}
              title={t.deleteReceipt || "Delete receipt"}
              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors disabled:opacity-50 print:hidden shrink-0"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin text-red-600" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* ITEM LINE DETAIL LIST */}
      <div className="space-y-1.5 py-0.5">
        {receipt.items.length > 0 ? (
          receipt.items.map((item: PurchaseItem, idx: number) => (
            <div
              key={item.id || idx}
              className="flex items-start justify-between text-xs text-slate-700 dark:text-slate-300 print:text-slate-800"
            >
              <div className="space-y-0.5 min-w-0 pr-2">
                <span className="font-medium text-slate-900 dark:text-white print:text-black block truncate">
                  {item.item_name}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 print:text-slate-600 block">
                  {formatNumber(item.quantity, 0)} {item.unit_of_measurement} × {formatNumber(item.unit_cost)} {t.currency || "ETB"}
                </span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white print:text-black shrink-0">
                {formatNumber(item.total_cost)} {t.currency || "ETB"}
              </span>
            </div>
          ))
        ) : (
          <div className="text-xs text-slate-400 print:text-slate-500 italic py-0.5">
            {t.noLineItemsLogged || "Restock summary logged without detailed line items."}
          </div>
        )}
      </div>

      {/* FOOTER BREAKDOWN */}
      {(receipt.is_vat_applied || receipt.is_withholding_applied || receipt.subtotal > 0) && (
        <div className="pt-2 text-[11px] font-medium text-slate-600 dark:text-slate-400 print:text-slate-700 flex items-center justify-between gap-1 border-t border-slate-100 dark:border-slate-800 print:border-slate-300">
          <span className="whitespace-nowrap">
            {t.subtotal || "Subtotal"}: <strong className="font-semibold text-slate-900 dark:text-white print:text-black">{formatNumber(subtotal)} {t.currency || "ETB"}</strong>
          </span>

          <div className="flex items-center gap-2 whitespace-nowrap text-[10px] sm:text-[11px]">
            {receipt.is_vat_applied && (
              <span className="text-emerald-600 dark:text-emerald-400 print:text-emerald-800 font-semibold">
                +VAT: {formatNumber(receipt.vat_amount)}
              </span>
            )}
            {receipt.is_withholding_applied && (
              <span className="text-amber-600 dark:text-amber-400 print:text-amber-800 font-semibold">
                -WT: {formatNumber(receipt.withholding_amount)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};