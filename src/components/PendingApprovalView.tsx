// src/components/PendingApprovalView.tsx
import React, { useState } from 'react';
import { Clock, RefreshCw, Lock, ShieldAlert, Phone, Mail, Store } from 'lucide-react';

interface PendingApprovalViewProps {
  user: {
    identifier: string;
    email?: string | null;
    businessName?: string | null;
  };
  handleLogout: () => void; 
  t?: any;
  lang: 'en' | 'am';
}

export default function PendingApprovalView({ user, handleLogout, t, lang }: PendingApprovalViewProps) {
  const [checking, setChecking] = useState(false);
  
  const safeT = {
    pendingApproval: t?.pendingApproval || (lang === 'en' 
      ? 'Verification Processing' 
      : 'መለያዎ መፅደቅን እየጠበቀ ነው'),
    pendingApprovalMsg: t?.pendingApprovalMsg || (lang === 'en'
      ? 'Your registry profile is active. A system administrator is currently auditing your shop metrics.'
      : 'የምዝገባ ጥያቄዎ በተሳካ ሁኔታ ደርሷል። ዋና አስተዳዳሪው የድርጅትዎን መረጃ እያረጋገጠ ነው።')
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      window.location.reload();
    } catch (e) {
      console.error(e);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-slate-950 flex flex-col justify-center items-center p-5 z-50 select-none overflow-hidden">
      {/* Background soft minimalist branding blurs */}
      <div className="absolute -right-32 -top-32 w-[500px] h-[500px] bg-[#1a5fb4]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -left-40 -bottom-40 w-[400px] h-[400px] bg-slate-900/60 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-20 animate-fade-in">
        
        {/* Soft-Glass Surface Container */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-7 backdrop-blur-md shadow-2xl space-y-5">
          
          {/* Pulsing Central Status Icon */}
          <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 bg-[#1a5fb4]/20 rounded-2xl blur-md opacity-60 animate-pulse" />
            <div className="relative bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-center text-[#1a5fb4]">
              <Clock className="w-6 h-6 animate-pulse stroke-[2.5]" />
            </div>
          </div>

          {/* Heading Block */}
          <div className="text-center space-y-1.5">
            <h2 className="text-sm font-black text-white tracking-tight uppercase">
              {safeT.pendingApproval}
            </h2>
            <p className="text-[11px] text-slate-400 leading-normal max-w-xs mx-auto">
              {safeT.pendingApprovalMsg}
            </p>
          </div>

          {/* Editorial Metadata Audit Box */}
          <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-900 space-y-2.5 font-mono">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-900 pb-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[#1a5fb4]" />
              <span>{lang === 'en' ? "Identity Registry" : "የማንነት መረጃ"}</span>
            </div>

            <div className="space-y-2 text-xs font-bold">
              <div className="flex justify-between items-center gap-4">
                <span className="text-slate-500 flex items-center gap-1.5 font-sans font-medium shrink-0">
                  <Phone className="w-3.5 h-3.5 text-slate-600" />
                  {lang === 'en' ? "Identifier" : "ስልክ"}
                </span>
                <span className="text-white tracking-wide truncate max-w-[180px]">{user.identifier}</span>
              </div>
              
              {user.email && (
                <div className="flex justify-between items-center gap-4 border-t border-slate-900/50 pt-2">
                  <span className="text-slate-500 flex items-center gap-1.5 font-sans font-medium shrink-0">
                    <Mail className="w-3.5 h-3.5 text-slate-600" />
                    {lang === 'en' ? "Email" : "ኢሜይል"}
                  </span>
                  <span className="text-slate-300 font-medium truncate max-w-[180px]">
                    {user.email}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center gap-4 border-t border-slate-900/50 pt-2">
                <span className="text-slate-500 flex items-center gap-1.5 font-sans font-medium shrink-0">
                  <Store className="w-3.5 h-3.5 text-slate-600" />
                  {lang === 'en' ? "Business" : "ድርጅት"}
                </span>
                <span className="text-slate-200 font-bold truncate max-w-[180px]">
                  {user.businessName || (lang === 'en' ? 'Not Provided' : 'አልተገለጸም')}
                </span>
              </div>
            </div>
          </div>

          {/* Functional Actions */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleCheckStatus}
              disabled={checking}
              className="w-full bg-[#1a5fb4] hover:bg-[#1a5fb4]/90 text-white font-mono font-bold py-3 px-4 rounded-xl text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(26,95,180,0.15)] disabled:opacity-40 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-white stroke-[2.5] ${checking ? 'animate-spin' : ''}`} />
              <span>{lang === 'en' ? "Synchronize Session" : "የመለያ ሁኔታን አረጋግጥ"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                alert(lang === 'en' 
                  ? "Access Restrictions Active: Terminal dashboard is locked until registration verification completes." 
                  : "መለያዎ በበላይ አካል እስኪጸድቅ ድረስ መውጣት አይችሉም::");
              }}
              className="w-full bg-slate-950/80 text-slate-600 border border-slate-900 font-mono font-bold py-2.5 px-4 rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <Lock className="w-3 h-3 text-slate-700" />
              <span>{lang === 'en' ? "Session Locked" : "መውጫው ተቆልፏል"}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
