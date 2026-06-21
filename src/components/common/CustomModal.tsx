// src/components/common/CustomModal.tsx
import React from 'react';

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function CustomModal({ isOpen, onClose, title, children }: CustomModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl p-6 relative overflow-hidden animate-fade-in space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="font-black text-slate-900 text-base">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer">✕</button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto space-y-3 pr-1">
          {children}
        </div>
      </div>
    </div>
  );
}
