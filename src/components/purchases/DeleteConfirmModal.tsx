// src/components/modals/DeleteConfirmModal.tsx
import React from 'react';
import CustomModal from '../common/CustomModal';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  t: any;
  lang?: string;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  t,
  lang = 'en'
}: DeleteConfirmModalProps) {
  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={t?.confirmDeletionTitle || t?.deletePurchaseTitle || "Confirm Deletion"}
    >
      <div style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {t?.deleteConfirm || t?.confirmDeletePurchase || "Are you sure you want to delete this purchase receipt?"}
        </p>

        <div className="flex gap-2.5 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            {t?.cancelBtn || t?.cancel || "Cancel"}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm active:scale-95"
          >
            {t?.deleteBtn || t?.delete || "Delete"}
          </button>
        </div>
      </div>
    </CustomModal>
  );
}

export default DeleteConfirmModal;