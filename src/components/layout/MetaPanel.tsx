// src/components/layout/MetaPanel.tsx
import React from 'react';
import { Shield } from 'lucide-react';
import { UserProfile } from '../../types';

interface MetaPanelProps {
  currentUser: UserProfile;
  /** Array containing active system profiles used for administrative tree processing */
  users: UserProfile[]; 
  t: any;
}

/**
 * Modern High-Contrast Sub-Header MetaPanel Component
 * Displays system authorization tracking indices, organization hierarchy labels, 
 * and operational user role profiles with refined corporate typography.
 */
export function MetaPanel({ currentUser, users, t }: MetaPanelProps) {
  
  // -----------------------------------------------------------------
  // DATA ANALYSIS & RELATIONSHIP TRANSFORMATION
  // -----------------------------------------------------------------
  const safeUsers = Array.isArray(users) ? users : [];

  // Traverse historical record profiles to isolate the parent record creator
  const creator = safeUsers.find(u => u.id === currentUser.createdBy);
  
  // Cascade resolution hierarchy path layout: Parent Context -> Current Shop -> System Baseline
  const displayName = creator?.businessName || currentUser.businessName || "Esale Retail System";
  
  return (
    // --- MAIN META CONTAINER BANNER BLOCK ---
    <div className="bg-slate-950 text-white px-4 py-2 border-b border-slate-900 shadow-[inset_0_1px_0_rgba(251,253,255,0.05)] relative z-30">
      <div className="max-w-md mx-auto flex items-center justify-between gap-4">
        
        {/* LEFT COMPARTMENT: Identity Branding & Meta Identifiers */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Dynamic Shield Branding Accent Node using Brand Hex Accent */}
          <div className="p-1 rounded-md bg-slate-900 text-[#1a5fb4] flex-shrink-0 border border-slate-800 shadow-xs">
            <Shield className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          
          <div className="min-w-0">
            {/* Dynamic Organization Name Assignment */}
            <span className="font-black text-xs text-white block tracking-tight uppercase truncate">
              {displayName}
            </span>
            {/* Direct Communication Parameter Line */}
            <span className="text-[9px] text-slate-500 font-mono font-bold block uppercase tracking-wider mt-0.5 truncate">
              {t.identifierLabel}/{ t.phoneOrEmail} : <span className="text-slate-400 font-medium">{currentUser.identifier}</span>
            </span>
          </div>
        </div>

        {/* RIGHT COMPARTMENT: Security Cleared Authorization Badge Layout */}
        <span className="bg-[#1a5fb4]/10 text-blue-400 font-mono font-bold px-2 py-0.5 rounded-md border border-[#1a5fb4]/20 text-[9px] uppercase tracking-widest flex-shrink-0 select-none shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
          {currentUser.role ? String(currentUser.role).replace('_', ' ') : 'Guest'}
        </span>
        
      </div>
    </div>
  );
}
