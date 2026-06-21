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
 * Modern Editorial Glassmorphic Header Component
 * Enhanced with immersive deep-contrast aesthetics and brand-aligned active states.
 */
export function Header({ lang, setLang, currentUser, handleLogout, t }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 px-4 py-3 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      <div className="max-w-md mx-auto flex items-center justify-between">
        
        {/* GRID LAYOUT CONSTRAINT: Shields DebterIcon from layout compression */}
        <div className="grid grid-cols-[auto_1fr] items-center gap-3">
          <div className="flex-shrink-0 group relative">
            <div className="absolute inset-0 bg-[#1a5fb4]/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative bg-slate-900 p-1.5 rounded-xl border border-slate-800">
              <DebterIcon size="sm" className="relative z-10" />
            </div>
          </div>
          
          <div className="min-w-0 flex flex-col justify-center">
            <h1 className="font-black text-sm md:text-base tracking-tight text-white leading-tight uppercase truncate">
              {t.appName}
            </h1>
            <p className="text-[8px] text-slate-500 font-mono font-bold uppercase tracking-widest leading-none mt-0.5 select-none">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Action Controls Rack */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          
          {/* Elegant Dark Segmented Language Switcher */}
          <div className="bg-slate-900/80 p-0.5 rounded-lg flex items-center border border-slate-800/80 backdrop-blur-md relative z-10">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 text-[9px] font-mono font-bold rounded-md transition-all duration-200 ease-out cursor-pointer ${
                lang === 'en'
                  ? "bg-[#1a5fb4] text-white shadow-[0_2px_6px_rgba(26,95,180,0.4)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('am')}
              className={`px-2.5 py-1 text-[9px] font-sans font-bold rounded-md transition-all duration-200 ease-out cursor-pointer ${
                lang === 'am'
                  ? "bg-[#1a5fb4] text-white shadow-[0_2px_6px_rgba(26,95,180,0.4)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              አማ
            </button>
          </div>
          
          {currentUser && (
            <>
              {/* Soft vertical visual barrier rule */}
              <div className="w-[1px] h-3.5 bg-slate-900 self-center" />
              
              {/* Elegant floating circular logout interaction trigger */}
              <button 
                type="button"
                onClick={handleLogout} 
                className="group p-1.5 rounded-lg border border-slate-900 hover:border-rose-950/60 text-slate-500 hover:text-rose-400 bg-slate-900/40 hover:bg-rose-950/20 transition-all active:scale-95 cursor-pointer" 
                title={t.logout || "Log Out"}
              >
                <LogOut className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 duration-200" />
              </button>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
