// src/components/common/CustomToast.tsx
import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface ToastData {
  id?: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

interface CustomToastProps {
  toast: ToastData | null;
  onClose: () => void; // 🟢 Added callback property to reset upstream state
}

export default function CustomToast({ toast, onClose }: CustomToastProps) {
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    if (toast) {
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
        onClose(); // 🟢 Notify the parent layout to clear its state
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast || !visible) return null;

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border transition-all duration-300 ${
      toast.type === "error" 
        ? "bg-rose-50 text-rose-800 border-rose-200" 
        : "bg-emerald-50 text-emerald-800 border-emerald-200"
    }`}>
      {toast.type === "error" ? (
        <AlertCircle className="w-5 h-5 shrink-0" />
      ) : (
        <CheckCircle className="w-5 h-5 shrink-0" />
      )}
      <span className="font-semibold text-sm leading-tight">{toast.message}</span>
    </div>
  );
}
