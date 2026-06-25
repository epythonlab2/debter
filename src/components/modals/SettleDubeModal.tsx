// src/components/modals/SettleDubeModal.tsx
import React, { useState } from 'react';
import CustomModal from '../common/CustomModal';
import { Check, Loader2 } from 'lucide-react';

interface SettleDubeModalProps {
  isOpen: boolean;
  dubeId: string | number | null;
  onClose: () => void;
  onSettle: (dubeId: string | number) => Promise<void>;
  lang: string;
  t: any;
}

export function SettleDubeModal({ isOpen, dubeId, onClose, onSettle, lang, t }: SettleDubeModalProps) {
  const [isSettling, setIsSettling] = useState(false);

  const handleSettleSubmit = async () => {
    if (isSettling || !dubeId) return;
    
    setIsSettling(true);
    try {
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
      <div 
        className="space-y-4 antialiased"
        style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}
      >
        <p className="text-xs text-slate-600 leading-relaxed font-normal px-0.5">
          {t.dubeConfirmInfo}
        </p>
        
        <div className="flex items-center gap-2.5 pt-1">
          <button 
            type="button"
            onClick={onClose} 
            disabled={isSettling}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {t.cancelBtn}
          </button>
          
          <button 
            type="button"
            onClick={handleSettleSubmit} 
            disabled={isSettling}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-3xs"
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
      </div>
    </CustomModal>
  );
}
