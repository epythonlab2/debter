// src/components/layout/Navigation.tsx
import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Plus, BookOpen, Layers, Shield, MessageSquare } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setLedgerSearch: (search: string) => void;
  currentRole: string;
  t: any;
  isFeedbackExpanded: boolean;   // Added
  onFeedbackClick: () => void;   // Added
}

export function Navigation({ 
  activeTab, 
  setActiveTab, 
  setLedgerSearch, 
  currentRole, 
  t, 
  isFeedbackExpanded, 
  onFeedbackClick 
}: NavigationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 12;

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDifference = currentScrollY - lastScrollY.current;

      if (currentScrollY <= 15) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      if (Math.abs(scrollDifference) > scrollThreshold) {
        if (scrollDifference > 0) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleTabTransition = (tabTarget: string) => {
    setActiveTab(tabTarget);
    setLedgerSearch('');
  };

  const isManagementScope = currentRole === "super_admin" || currentRole === "admin";

  return (
    // --- INTEGRATED HARDWARE CONTAINER STACK ---
    <div 
      className={`fixed bottom-0 left-0 right-0 z-40 px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pointer-events-none flex flex-col items-end gap-3.5 transform transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-36 opacity-0'
      }`}
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}
    >
      {/* =================================================================
          1. UNIFIED FLOATING CHAT / FEEDBACK ACTION BUTTON
          ================================================================= */}
      <button
        type="button"
        onClick={onFeedbackClick}
        className="pointer-events-auto bg-slate-950 text-white hover:bg-slate-900 h-11 px-3.5 rounded-full shadow-xl border border-slate-800 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out cursor-pointer group mr-1"
      >
        <MessageSquare className="w-4 h-4 text-[#1a5fb4] stroke-[2.5]" />
        <span className={`text-[11px] font-black tracking-wider transition-all duration-300 overflow-hidden whitespace-nowrap ${
          isFeedbackExpanded ? 'max-w-xs opacity-100' : 'max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100'
        }`}>
          {t.feedback || 'Feedback'}
        </span>
      </button>

      {/* =================================================================
          2. FLOATING BAR DOCK CONTEXT
          ================================================================= */}
      <nav className="w-full max-w-md mx-auto px-3 py-3 pointer-events-auto flex justify-between items-center relative gap-1 bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-[0_16px_36px_-12px_rgba(0,0,0,0.16)]">
        
        {/* DASHBOARD */}
        {isManagementScope && (
          <button 
            type="button"
            onClick={() => handleTabTransition('dashboard')} 
            className={`flex flex-col items-center gap-1.5 flex-1 py-1 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer relative ${
              activeTab === 'dashboard' ? 'text-[#1a5fb4]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <LayoutDashboard className={`w-[19px] h-[19px] transition-transform ${activeTab === 'dashboard' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="text-[10px] font-black tracking-wider uppercase">{t.dashboard || 'Dashboard'}</span>
            {activeTab === 'dashboard' && <span className="absolute bottom-[-2px] w-1 h-1 rounded-full bg-[#1a5fb4]" />}
          </button>
        )}

        {/* SALES ENTRY */}
        <button 
          type="button"
          onClick={() => handleTabTransition('entry')} 
          className="flex flex-col items-center flex-1 py-1 transition-all duration-200 cursor-pointer group"
        >
          <div className={`p-2.5 rounded-xl transition-all active:scale-90 flex items-center justify-center ${
            activeTab === 'entry' 
              ? 'bg-[#1a5fb4] text-white shadow-md shadow-[#1a5fb4]/20 scale-105' 
              : 'bg-slate-50 text-slate-500 border border-slate-200/60 group-hover:text-slate-700 group-hover:bg-slate-100'
          }`}>
            <Plus className="w-[18px] h-[18px] stroke-[3]" />
          </div>
          <span className={`text-[10px] font-black tracking-wider uppercase mt-1 transition-colors ${activeTab === 'entry' ? 'text-[#1a5fb4]' : 'text-slate-400'}`}>
            {t.salesEntry || 'Entry'}
          </span>
        </button>

        {/* LEDGER */}
        <button 
          type="button"
          onClick={() => handleTabTransition('ledger')} 
          className={`flex flex-col items-center gap-1.5 flex-1 py-1 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer relative ${
            activeTab === 'ledger' ? 'text-[#1a5fb4]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <BookOpen className={`w-[19px] h-[19px] transition-transform ${activeTab === 'ledger' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] font-black tracking-wider uppercase">{t.ledger || 'Ledger'}</span>
          {activeTab === 'ledger' && <span className="absolute bottom-[-2px] w-1 h-1 rounded-full bg-[#1a5fb4]" />}
        </button>

        {/* INVENTORY */}
        <button 
          type="button"
          onClick={() => handleTabTransition('inventory')} 
          className={`flex flex-col items-center gap-1.5 flex-1 py-1 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer relative ${
            activeTab === 'inventory' ? 'text-[#1a5fb4]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Layers className={`w-[19px] h-[19px] transition-transform ${activeTab === 'inventory' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] font-black tracking-wider uppercase">{t.inventory || 'Inventory'}</span>
          {activeTab === 'inventory' && <span className="absolute bottom-[-2px] w-1 h-1 rounded-full bg-[#1a5fb4]" />}
        </button>

        {/* ADMIN */}
        {isManagementScope && (
          <button 
            type="button"
            onClick={() => handleTabTransition('admin')} 
            className={`flex flex-col items-center gap-1.5 flex-1 py-1 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer relative ${
              activeTab === 'admin' ? 'text-[#1a5fb4]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Shield className={`w-[19px] h-[19px] transition-transform ${activeTab === 'admin' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="text-[10px] font-black tracking-wider uppercase">{t.adminTab || 'Admin'}</span>
            {activeTab === 'admin' && <span className="absolute bottom-[-2px] w-1 h-1 rounded-full bg-[#1a5fb4]" />}
          </button>
        )}
        
      </nav>
    </div>
  );
}
