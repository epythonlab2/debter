// src/components/feedback/SimpleFeedbackForm.tsx
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useFeedback } from '../../hooks/useFeedback';
import { MessageSquare, X, CheckCircle2, Send, Loader2 } from 'lucide-react';

interface SimpleFeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: { id: string } | null;
  t: any;
  onSubmit: (comment: string) => Promise<void> | void;
}

export function SimpleFeedbackForm({ isOpen, onClose, currentUser, t, onSubmit }: SimpleFeedbackFormProps) {
  const [comment, setComment] = useState('');

  const { submitFeedback, isSubmitting, isSuccess, error } = useFeedback({
    currentUser,
    onSuccess: () => {
      setTimeout(() => {
        setComment('');
        onClose();
      }, 2000);
    }
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    try {
      await onSubmit(comment);
      submitFeedback(comment);
    } catch (err) {
      console.error("Parent onSubmit exception handler block caught intercept:", err);
    }
  };

  return createPortal(
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-slate-950 border-t md:border border-slate-900 rounded-t-3xl md:rounded-2xl p-6 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:pb-6 shadow-2xl relative overflow-hidden transform transition-all duration-200 max-h-[85vh] flex flex-col"
      >
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 bg-slate-900 rounded-full mx-auto mb-6 md:hidden shrink-0" />
        
        <div className="flex justify-between items-start mb-6 shrink-0">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2 tracking-tight">
              <MessageSquare className="w-4 h-4 text-[#1a5fb4]" />
              {t.feedbackTitle}
            </h3>
            <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-wide">
              {t.feedbackSubtitle}
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900/60 transition-colors duration-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {isSuccess ? (
            <div className="py-10 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-full bg-emerald-950/40 flex items-center justify-center text-emerald-400 mb-3 border border-emerald-900/30">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="font-medium text-white text-sm">{t.feedbackSuccessTitle}</h4>
              <p className="text-[10px] text-slate-500 mt-1 uppercase font-medium tracking-wide">
                {t.feedbackSuccessSubtitle}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                rows={5}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t.feedbackPlaceholder}
                className="w-full text-sm bg-slate-950 border border-slate-900 focus:border-[#1a5fb4] focus:ring-4 focus:ring-[#1a5fb4]/10 rounded-xl px-4 py-3 text-slate-100 outline-none placeholder-slate-600 transition-all duration-200 resize-none"
                required
                autoFocus
              />

              {error && (
                <div className="text-xs text-rose-400 bg-rose-950/20 border border-rose-900/30 rounded-xl p-3 font-medium">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-slate-900 text-xs font-medium text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 active:scale-[0.98] transition-all duration-200 cursor-pointer tracking-wide"
                >
                  {t.feedbackBtnCancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !comment.trim()}
                  className="flex-1 py-3 rounded-xl bg-[#1a5fb4] text-white text-xs font-medium hover:bg-[#154b8f] disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 tracking-wide shadow-3xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{t.feedbackBtnSending}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      <span>{t.feedbackBtnSend}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
