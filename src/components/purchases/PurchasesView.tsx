// src/components/purchases/PurchasesView.tsx
import React, { useState } from 'react';
import { Plus, Receipt, Truck, AlertCircle, Loader2 } from 'lucide-react';

// Modals & Common Components
import { RecordPurchaseModal } from '../modals/RecordPurchaseModal';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal';
import { Pagination } from '../common/Pagination';

// Domain Type Definitions
import { PurchaseRecord } from '../../types';
import { ItemRecord } from "../../types/inventory";

// Hooks & Sub-components
import { usePurchasesLedger, GroupedReceipt } from '../../hooks/usePurchasesLedger';
import { PurchasesMetricsCards } from './PurchasesMetricsCards';
import { PurchasesFilterToolbar } from './PurchasesFilterToolbar';
import { ReceiptCardItem } from './ReceiptCardItem';

// Utilities
import { exportPurchasesToCSV } from '../../utils/purchases/csvExporter';
import { formatNumber } from '../../utils/formatters';

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
  fetchPurchases?: (params: { shopId: string; startDate?: string; endDate?: string; limit?: number }) => Promise<void>;
  loading?: boolean;
  t: Record<string, any>;
  lang?: string;
}

export default function PurchasesView({
  purchases,
  items,
  currentUser,
  onRecordPurchase,
  onDeletePurchase,
  fetchPurchases,
  loading = false,
  t,
  lang = 'en'
}: PurchasesViewProps) {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const resolvedShopId = currentUser?.shop_id || currentUser?.shopId || '';
  const hasNoShop = !resolvedShopId && currentUser?.role !== 'super_admin';

  const {
    activePreset,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    setActivePreset,
    taxFilter,
    setTaxFilter,
    currentPage,
    setCurrentPage,
    pageSize,
    handlePageSizeChange,
    handleApplyPreset,
    handleResetFilters,
    filteredReceipts,
    paginatedReceipts,
    metrics,
    hasActiveFilters
  } = usePurchasesLedger(purchases, resolvedShopId, fetchPurchases);

  const confirmDelete = async () => {
    if (!pendingDeleteId || !onDeletePurchase) return;
    const idToProcess = pendingDeleteId;
    setPendingDeleteId(null);
    setDeletingId(idToProcess);

    try {
      await onDeletePurchase(idToProcess);
    } catch (error) {
      console.error("Failed to delete purchase record:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveNewPurchase = async (formData: any) => {
    try {
      await onRecordPurchase({
        ...formData,
        shopId: resolvedShopId,
        shop_id: resolvedShopId,
        userId: currentUser.id,
        user_id: currentUser.id,
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to record purchase:", error);
    }
  };

  const printDateOnly = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div 
      className="space-y-5 pb-2 text-slate-700 dark:text-slate-200 antialiased w-full p-0 m-0 print:p-0 print:m-0 print-container"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}
    >

      {/* ================================================================== */}
      {/* PRINT-ONLY HEADER - Visible ONLY during print                      */}
      {/* ================================================================== */}
      <div className="hidden print-header print:block border-b-2 border-black pb-2 mb-3 text-black">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold uppercase text-slate-900">
              {t.purchaseReceiptSummary}
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              {t.logHeaderText}
            </p>
          </div>
          <div className="text-right text-xs">
            <p className="font-semibold text-slate-900">{t.date}: {printDateOnly}</p>
            <p className="text-slate-600">
              {t.totalStatement}: <strong>{formatNumber(filteredReceipts.length, 0)}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* NON-PRINTABLE SECTION: Header, Presets, Filters & KPI Cards        */}
      {/* ================================================================== */}
      <div className="print:hidden space-y-5">
        {/* Page Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50 text-[#1a5fb4] dark:text-blue-400 shrink-0 shadow-sm">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {t?.purchasesTitle || "Purchases"}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                {t?.purchasesSubTitle}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            disabled={hasNoShop}
            title={hasNoShop ? t.noShopAssigned : ""}
            className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm sm:w-auto w-full ${
              hasNoShop 
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10'
            }`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t?.newPurchase}</span>
          </button>
        </div>

        {/* Date Presets */}
        <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
          {(['7d', '30d', '3m', 'month'] as const).map((preset) => {
            const labels: Record<string, string> = {
              '7d': t.weeklyLabel,
              '30d': t.mon30DaysLabel,
              '3m': t.mon3Label,
              'month': t.monthlyLabel
            };
            return (
              <button
                key={preset}
                onClick={() => handleApplyPreset(preset)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  activePreset === preset
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {labels[preset]}
              </button>
            );
          })}
        </div>

        {/* Warning Alert */}
        {hasNoShop && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{t.noShopWarning || "Your account is not assigned to a shop. Please contact an admin to enable purchasing."}</span>
          </div>
        )}

        {/* Filter Toolbar */}
        <PurchasesFilterToolbar
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          setActivePreset={setActivePreset}
          taxFilter={taxFilter}
          setTaxFilter={setTaxFilter}
          filteredCount={filteredReceipts.length}
          loading={loading}
          hasActiveFilters={hasActiveFilters}
          onReset={handleResetFilters}
          onExportCSV={() => exportPurchasesToCSV(filteredReceipts, t)}
          t={t}
        />

        {/* Metrics Cards */}
        <PurchasesMetricsCards metrics={metrics} t={t} />
      </div>

      {/* ================================================================== */}
      {/* RECEIPT LISTING - Printed in document output                       */}
      {/* ================================================================== */}
      <div className="space-y-3 print:space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-500 gap-2 font-medium text-xs print:hidden no-print">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            {t.loadingPurchases}
          </div>
        ) : paginatedReceipts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 print:hidden">
            <Receipt className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {hasActiveFilters ? (t.noFilteredReceipts) : (t.noReceiptsYet)}
            </p>
          </div>
        ) : (
          paginatedReceipts.map((receipt: GroupedReceipt) => (
            <ReceiptCardItem
              key={receipt.id}
              receipt={receipt}
              isDeleting={deletingId === receipt.id}
              onDeleteRequest={(id) => setPendingDeleteId(id)}
              t={t}
            />
          ))
        )}
      </div>

      {/* ================================================================== */}
      {/* NON-PRINTABLE SECTION: Pagination & Modals                        */}
      {/* ================================================================== */}
      <div className="print:hidden no-print">
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredReceipts.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={[5, 10, 20, 50, 100]}
        />

        <RecordPurchaseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          items={items as any}
          onSavePurchase={handleSaveNewPurchase}
          t={t}
        />

        <DeleteConfirmModal
          isOpen={Boolean(pendingDeleteId)}
          onClose={() => setPendingDeleteId(null)}
          onConfirm={confirmDelete}
          t={t}
          lang={lang}
        />
      </div>
    </div>
  );
}