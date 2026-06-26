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
    <div 
      className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 antialiased transition-colors"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl p-6 relative overflow-hidden animate-fade-in space-y-4 transition-colors">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-lg font-bold p-1 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>
        
        {/* Modal Main Content Area */}
        <div className="max-h-[70vh] overflow-y-auto space-y-3 pr-1 text-slate-700 dark:text-slate-300">
          {children}
        </div>
      </div>
    </div>
  );
}
