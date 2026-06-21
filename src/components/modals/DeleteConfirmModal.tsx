import React from 'react';
import CustomModal from '../common/CustomModal';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  t: any;
  lang: string;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  t,
  lang
}: DeleteConfirmModalProps) {
  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={t.confirmDeletionTitle}
    >
      <p className="text-xs text-slate-600 leading-relaxed">
        {t.deleteConfirm}
      </p>

      <div className="flex gap-2.5 pt-3">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
        >
          {t.cancelBtn}
        </button>

        <button
          onClick={onConfirm}
          className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
        >
          {t.deleteBtn}
        </button>
      </div>
    </CustomModal>
  );
}
