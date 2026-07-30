// src/components/layout/MetaPanel.tsx
import React from 'react';
import { ShieldCheck, Shield } from 'lucide-react'; 
import { UserProfile } from '../../types';

interface MetaPanelProps {
  currentUser: UserProfile;
  /** Array containing active system profiles used for administrative tree processing */
  users: UserProfile[]; 
  t: any;
  /** Active view navigation props */
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

/**
 * Clean Sub-Header MetaPanel Component
 * Placed immediately below the primary header with exact layout matching.
 */
export function MetaPanel({ currentUser, users, t, activeTab, setActiveTab }: MetaPanelProps) {
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

  const isManagementScope = currentUser?.role === 'super_admin' || currentUser?.role === 'admin';

  return (
    // --- MAIN META CONTAINER BANNER BLOCK ---
    <div className="bg-[#021b3d] text-white px-4 py-1.5 border-b border-slate-800/60 shadow-sm relative z-30 font-sans">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
        
        {/* LEFT COMPARTMENT: Identity Branding & Meta Identifiers */}
        <div className="flex items-center gap-2.5 min-w-0">
          
          <div className="p-1 rounded-md bg-slate-300/60 dark:bg-[#021126] text-slate-700 dark:text-blue-200/50 flex-shrink-0 border border-slate-300/40 dark:border-slate-800/70">
            <ShieldCheck className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          
          <div className="min-w-0 flex flex-col justify-center">
            <span className="font-bold text-xs text-white dark:text-slate-100 block tracking-wide truncate leading-tight">
              {displayName}
            </span>
            
            <span className="text-[10px] text-blue-200/80 dark:text-blue-200/60 font-medium block truncate mt-0.5 select-none">
              <span className="text-blue-200/60 dark:text-blue-200/40 font-bold tracking-wide">{t.identifierLabel}/{t.phoneOrEmail}:</span> {currentUser.identifier}
            </span>
          </div>
        </div>

        {/* RIGHT COMPARTMENT: Authorization Badge & Admin Shortcut */}
        <div className="flex items-center gap-2 flex-shrink-0 select-none">
          
          {/* Admin Panel Button (Shown only for Admin / Super Admin roles) */}
          {isManagementScope && setActiveTab && (
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`px-2 py-0.5 rounded-md border text-[10px] font-extrabold tracking-wide flex items-center gap-1 transition-all duration-150 cursor-pointer active:scale-95 ${
                activeTab === 'admin'
                  ? "bg-[#025da6] text-white border-blue-400/50 shadow-md"
                  : "bg-[#022a61] text-blue-200 hover:text-white border-slate-700/60 hover:border-slate-600"
              }`}
              title={t.adminTab || "Admin Panel"}
            >
              <Shield className="w-3 h-3 text-amber-400" />
              <span>{t.adminTab || "Admin"}</span>
            </button>
          )}

          {/* Role Indicator Badge */}
          <span className="bg-slate-200 dark:bg-[#024982]/30 text-[#025da6] dark:text-white font-extrabold px-2 py-0.5 rounded-md border border-slate-300/60 dark:border-[#024982]/40 text-[10px] tracking-wide">
            {displayRole}
          </span>

        </div>
        
      </div>
    </div>
  );
}