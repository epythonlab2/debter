// src/components/modals/BroadcastModal.tsx
import React, { useState } from 'react';
import { Megaphone, X, CheckCircle, AlertCircle } from 'lucide-react';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendBroadcast: (payload: { message: string; severity: 'info' | 'warning' | 'critical'; createdAt: string }) => Promise<any>;
  t?: Record<string, any>;
}

export default function BroadcastModal({ isOpen, onClose, onSendBroadcast, t = {} }: BroadcastModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setStatusMessage(null);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xl dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] space-y-4 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
              <Megaphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold tracking-widest text-slate-800 dark:text-slate-100">
                {t.globalBroadcastEngine}
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">
                {t.pushRealTimeAlerts}
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Inline Notification Banner */}
        {statusMessage && (
          <div className={`flex items-start gap-2.5 p-3 rounded-xl border animate-in slide-in-from-top-2 duration-300 ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300' 
              : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs font-semibold">{statusMessage.text}</div>
          </div>
        )}

        <form onSubmit={async (e) => {
          e.preventDefault();
          if (isSubmitting) return;

          const form = e.currentTarget;
          const formData = new FormData(form);
          const message = formData.get('broadcastText') as string;
          const severity = formData.get('severity') as 'info' | 'warning' | 'critical';
          
          if (!message.trim()) return;
          
          setIsSubmitting(true);
          setStatusMessage(null);
          
          try {
            await onSendBroadcast({
              message,
              severity,
              createdAt: new Date().toISOString()
            });
            
            form.reset();
            setStatusMessage({
              type: 'success',
              text: t.broadcastSuccess
            });

            setTimeout(() => {
              handleClose();
            }, 1800);

          } catch(err) {
            console.error("Failed to distribute real-time notification:", err);
            setStatusMessage({
              type: 'error',
              text: t.broadcastError
            });
            setIsSubmitting(false);
          }
        }} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500">
              {t.announcementMessage}
            </label>
            <textarea
              name="broadcastText"
              required
              disabled={isSubmitting}
              rows={3}
              placeholder={t.broadcastPlaceholder}
              className="w-full p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-[#1a5fb4] dark:focus:border-[#1a5fb4] focus:ring-4 focus:ring-[#1a5fb4]/10 transition-all resize-none disabled:opacity-60"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500">
              {t.alertPriorityLevel}
            </label>
            <select 
              name="severity" 
              disabled={isSubmitting}
              className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-slate-600 dark:text-slate-300 outline-none cursor-pointer focus:border-[#1a5fb4] dark:focus:border-[#1a5fb4] focus:ring-4 focus:ring-[#1a5fb4]/10 transition-all disabled:opacity-60"
            >
                <option value="info" className="dark:bg-slate-800">Info Accent (Blue)</option>
		<option value="warning" className="dark:bg-slate-800">Warning Alert (Amber)</option>
		<option value="critical" className="dark:bg-slate-800">Critical Outage (Red)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {t.cancelBtn}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#1a5fb4] hover:bg-[#154b91] text-white rounded-xl text-xs font-bold tracking-wider transition-all active:scale-95 cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Pushing...</span>
              ) : (
                <span>{t.transmitPushAlert}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
