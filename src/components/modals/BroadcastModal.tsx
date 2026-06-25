// src/components/modals/BroadcastModal.tsx
import React, { useState } from 'react';
import { Megaphone, X, CheckCircle, AlertCircle } from 'lucide-react';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  // CHANGED FROM Promise<void> TO Promise<any> TO ALLOW SUBSTRATE RETURN VALUE PACKAGES
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}
    >
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-50 rounded-lg">
              <Megaphone className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">
                {t.globalBroadcastEngine || "Global Broadcast Engine"}
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">
                {t.pushRealTimeAlerts || "Push real-time system alert terminal packs"}
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Inline Notification Banner */}
        {statusMessage && (
          <div className={`flex items-start gap-2.5 p-3 rounded-xl border animate-in slide-in-from-top-2 duration-300 ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
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
              text: t.broadcastSuccess || "Real-time broadcast pushed successfully!"
            });

            setTimeout(() => {
              handleClose();
            }, 1800);

          } catch(err) {
            console.error("Failed to distribute real-time notification broadcast packet:", err);
            setStatusMessage({
              type: 'error',
              text: t.broadcastError || "Failed to distribute notification package. Please try again."
            });
            setIsSubmitting(false);
          }
        }} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {t.announcementMessage || "Announcement Message"}
            </label>
            <textarea
              name="broadcastText"
              required
              disabled={isSubmitting}
              rows={3}
              placeholder="Type an announcement (e.g., Planned server diagnostics in 30 minutes...)"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-medium focus:border-slate-400 focus:bg-white transition-all resize-none disabled:opacity-60"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {t.alertPriorityLevel || "Alert Priority Level"}
            </label>
            <select 
              name="severity" 
              disabled={isSubmitting}
              className="w-full text-xs font-bold uppercase bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-slate-600 outline-none cursor-pointer disabled:opacity-60"
            >
              <option value="info">Info Accent (Blue)</option>
              <option value="warning">Warning Alert (Amber)</option>
              <option value="critical">Critical Outage (Red)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {t.cancelBtn || "Cancel"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Pushing...</span>
              ) : (
                <span>{t.transmitPushAlert || "Transmit Push Alert"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
