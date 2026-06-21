// src/components/modals/SettleDubeModal.tsx
import React, { useState } from 'react';
import CustomModal from '../common/CustomModal';
import { Check, Loader2 } from 'lucide-react';

interface SettleDubeModalProps {
  isOpen: boolean;
  dubeId: string | number | null; // 🟢 Add this property
  onClose: () => void;
  onSettle: (dubeId: string | number) => Promise<void>; // 🟢 Update to accept id argument
  lang: string;
  t: any;
}

export function SettleDubeModal({ isOpen, dubeId, onClose, onSettle, lang, t }: SettleDubeModalProps) {
  const [isSettling, setIsSettling] = useState(false);

  const handleSettleSubmit = async () => {
    if (isSettling || !dubeId) return;
    
    setIsSettling(true);
    try {
      // 🟢 Explicitly pass the active account key to the execution engine
      await onSettle(dubeId);
      onClose(); 
    } catch (error) {
      console.error("Debt settlement transaction failed:", error);
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <CustomModal isOpen={isOpen} onClose={onClose} title={t.dubeConfirmTitle}>
      <p className="text-xs text-slate-600 leading-relaxed">
        {t.dubeConfirmInfo}
      </p>
      <div className="flex gap-2.5 pt-3">
        <button 
          type="button"
          onClick={onClose} 
          disabled={isSettling}
          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
        >
          {t.cancelBtn}
        </button>
        
        <button 
          type="button"
          onClick={handleSettleSubmit} 
          disabled={isSettling}
          className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
        >
          {isSettling ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              <span>{t.savingSale || "Processing..."}</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5 stroke-[2.5]" /> 
              <span>{t.dubeSettle}</span>
            </>
          )}
        </button>
      </div>
    </CustomModal>
  );
}
