// src/components/layout/DebterIcon.tsx
import React from 'react';

interface DebterIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Premium Full Amharic Debter/Ledger Icon
 * Aligned with the application's clean high-contrast dark design system.
 * Font sizes are scaled dynamically to perfectly accommodate the multi-character "ደብተር" script.
 */
export function DebterIcon({ className = '', size = 'md' }: DebterIconProps) {
  
  // ==========================================
  // --- 📐 TYPOGRAPHY & SCALING DEFINITIONS --
  // ==========================================
  const sizeClasses = {
    sm: { 
      container: 'w-10 h-12 rounded-lg pl-2 pr-1 shadow-md', 
      scriptText: 'text-[9px] tracking-tight', 
      ribbon: 'w-2 h-3.5 bottom-[-10px] right-2.5',
      loops: 4
    },
    md: { 
      container: 'w-14 h-18 rounded-xl pl-3.5 pr-2 shadow-lg', 
      scriptText: 'text-[12px] tracking-wide', 
      ribbon: 'w-3 h-4.5 bottom-[-14px] right-3.5',
      loops: 5
    },
    lg: { 
      container: 'w-22 h-28 rounded-2xl pl-5 pr-3 shadow-xl', 
      scriptText: 'text-[18px] tracking-wider', 
      ribbon: 'w-4.5 h-6 bottom-[-20px] right-5',
      loops: 6
    }
  };

  const currentScale = sizeClasses[size];

  return (
    <div 
      className={`
        relative group flex flex-col items-center justify-center select-none
        bg-gradient-to-b from-slate-900 to-black 
        border border-slate-800/80
        shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_8px_16px_-4px_rgba(0,0,0,0.5)]
        transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0
        ${currentScale.container} ${className}
      `}
    >
      {/* ==========================================
          --- 🪡 LEFT SPINE: WIRE LOOP BINDINGS ---
          ========================================== */}
      <div className="absolute left-0 top-[12%] bottom-[12%] w-1.5 flex flex-col justify-between items-center z-20 pointer-events-none">
        {[...Array(currentScale.loops)].map((_, i) => (
          <div 
            key={i} 
            className="w-2.5 h-1 -ml-1 rounded-full bg-gradient-to-r from-[#d4af37] via-[#f3cb65] to-[#aa7c11] shadow-[0_1px_2px_rgba(0,0,0,0.8)] border-t border-white/10"
          />
        ))}
      </div>

      {/* ==========================================
          --- 🧵 RIGHT SPINE: ELASTIC CLOSURE ---
          ========================================== */}
      <div className="absolute right-1.5 top-0 bottom-0 w-1 bg-black/60 shadow-inner border-x border-slate-950/20 z-20" />

      {/* ==========================================
          --- 📂 CREASE: EMBOSSED MARGIN LINE ----
          ========================================== */}
      <div className="absolute inset-y-0 left-2 w-[1px] bg-black/50 z-10" />

      {/* ==========================================
          --- 🏷️ FOREGROUND: BRAND TYPOGRAPHY ----
          ========================================== */}
      <div className="relative z-10 flex flex-col items-center justify-center font-black leading-none antialiased">
        <span 
          className={`font-sans text-amber-400 select-none font-black text-center ${currentScale.scriptText}`}
        >
          ደብተር
        </span>
        
        {/* Brand Accent Indicator Rule Line using Brand Hex #1a5fb4 */}
        <div 
          className="w-4 h-[2px] mt-1.5 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.4)]" 
          style={{ backgroundColor: '#1a5fb4' }} 
        />
      </div>

      {/* ==========================================
          --- 🔖 ACCENT: SKEUOMORPHIC RIBBON -----
          ========================================== */}
      <div 
        className={`absolute z-0 shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:translate-y-0.5 ${currentScale.ribbon}`}
        style={{ 
          backgroundColor: '#1a5fb4',
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 82%, 0% 100%)'
        }} 
      />
    </div>
  );
}
