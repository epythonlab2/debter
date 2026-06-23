// src/components/layout/Header.tsx
import React from 'react';
import { LogOut } from 'lucide-react';
import { DebterIcon } from '../layout/DebterIcon';

interface HeaderProps {
  lang: 'en' | 'am';
  setLang: (lang: 'en' | 'am') => void;
  currentUser: any;
  handleLogout: () => void;
  t: any;
}

/**
 * Polished High-Contrast Minimalist Header Component
 * Optimized for scannability, vertical centering, and clean optical weight.
 */
export function Header({ lang, setLang, currentUser, handleLogout, t }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 px-4 py-3 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/60 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-between gap-4">
        
        {/* LEFT BRAND SECTION */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 relative group">
            {/* Smooth gentle ambient hover ring around icon */}
            <div className="absolute inset-0 bg-[#1a5fb4]/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative bg-slate-900 p-2 rounded-xl border border-slate-800 transition-colors group-hover:border-slate-700">
              <DebterIcon size="sm" className="relative z-10" />
            </div>
          </div>
          
          <div className="min-w-0 flex flex-col">
            <h1 className="font-extrabold text-sm md:text-base tracking-wide text-white truncate">
              {t.appName}
            </h1>
            <p className="text-[8px] text-slate-500 font-mono font-bold tracking-widest leading-none mt-0.5 select-none">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* RIGHT CONTROLS SECTION */}
        <div className="flex items-center gap-3 flex-shrink-0">
          
          {/* Segmented Language Switcher */}
          <div className="bg-slate-900 p-0.5 rounded-lg flex items-center border border-slate-800">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-md transition-all duration-150 cursor-pointer ${
                lang === 'en'
                  ? "bg-[#1a5fb4] text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('am')}
              className={`px-2.5 py-1 text-[10px] font-sans font-bold rounded-md transition-all duration-150 cursor-pointer ${
                lang === 'am'
                  ? "bg-[#1a5fb4] text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              አማ
            </button>
          </div>
          
          {currentUser && (
            <>
              {/* Subtle visual separator line */}
              <div className="w-[1px] h-4 bg-slate-800 self-center" />
              
              {/* Logout button */}
              <button 
                type="button"
                onClick={handleLogout} 
                className="group p-2 rounded-lg border border-slate-800 hover:border-rose-900/50 text-slate-400 hover:text-rose-400 bg-slate-900 hover:bg-rose-950/30 transition-all active:scale-95 cursor-pointer" 
                title={t.logout || "Log Out"}
              >
                <LogOut className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 duration-150" />
              </button>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
