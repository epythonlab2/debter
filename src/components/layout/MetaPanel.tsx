// src/components/layout/MetaPanel.tsx
import React from 'react';
import { ShieldCheck } from 'lucide-react'; 
import { UserProfile } from '../../types';

interface MetaPanelProps {
  currentUser: UserProfile;
  /** Array containing active system profiles used for administrative tree processing */
  users: UserProfile[]; 
  t: any;
}

/**
 * Clean Sub-Header MetaPanel Component
 * Placed immediately below the primary header with exact layout matching.
 */
export function MetaPanel({ currentUser, users, t }: MetaPanelProps) {
  const safeUsers = Array.isArray(users) ? users : [];

  // Traverse historical record profiles to isolate the parent record creator
  const creator = safeUsers.find(u => u.id === currentUser.createdBy);
  
  // Cascade resolution hierarchy path layout: Parent Context -> Current Shop -> System Baseline
  const displayName = creator?.businessName || currentUser.businessName || "Debter Ledger System";
  
  // Format the user role safely to title case
  const displayRole = currentUser.role 
    ? String(currentUser.role)
        .replace('_', ' ')
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : 'Guest';

  return (
    // --- MAIN META CONTAINER BANNER BLOCK ---
    // Stays solid dark deep blue to act as the global baseline bar under the header
    <div className="bg-[#021b3d] text-white px-4 py-1.5 border-b border-slate-800/60 shadow-sm relative z-30 font-sans">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
        
        {/* LEFT COMPARTMENT: Identity Branding & Meta Identifiers */}
        <div className="flex items-center gap-2.5 min-w-0">
          
          {/* Unified Rounded Icon Container */}
          {/* Swaps colors between light and dark modes based on the dropdown theme behavior (no blur) */}
          <div className="p-1 rounded-md bg-slate-300/60 dark:bg-[#021126] text-slate-700 dark:text-blue-200/50 flex-shrink-0 border border-slate-300/40 dark:border-slate-800/70">
            <ShieldCheck className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          
          <div className="min-w-0 flex flex-col justify-center">
            {/* Dynamic Organization Name Assignment */}
            {/* Text colors respond cleanly between light text modes based on theme framework */}
            <span className="font-bold text-xs text-white dark:text-slate-100 block tracking-wide truncate leading-tight">
              {displayName}
            </span>
            
            {/* Direct Communication Parameter Line */}
            <span className="text-[10px] text-blue-200/80 dark:text-blue-200/60 font-medium block truncate mt-0.5 select-none">
              <span className="text-blue-200/60 dark:text-blue-200/40 font-bold tracking-wide">{t.identifierLabel}/{t.phoneOrEmail}:</span> {currentUser.identifier}
            </span>
          </div>
        </div>

        {/* RIGHT COMPARTMENT: Clean Authorization Badge */}
        {/* The badge now utilizes theme-switched solid background states without blurring */}
        <span className="bg-slate-200 dark:bg-[#024982]/30 text-[#025da6] dark:text-white font-extrabold px-2 py-0.5 rounded-md border border-slate-300/60 dark:border-[#024982]/40 text-[10px] tracking-wide flex-shrink-0 select-none">
          {displayRole}
        </span>
        
      </div>
    </div>
  );
}
