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
 * Clean Sub-Header MetaPanel Component
 * Placed immediately below the primary header with exact layout matching.
 */
export function MetaPanel({ currentUser, users, t }: MetaPanelProps) {
  const safeUsers = Array.isArray(users) ? users : [];

  // Traverse historical record profiles to isolate the parent record creator
  const creator = safeUsers.find(u => u.id === currentUser.createdBy);
  
  // Cascade resolution hierarchy path layout: Parent Context -> Current Shop -> System Baseline
  const displayName = creator?.businessName || currentUser.businessName || "Esale retail system";
  
  // Format the user role safely to lowercase
  const displayRole = currentUser.role 
    ? String(currentUser.role).replace('_', ' ').toLowerCase() 
    : 'guest';

  return (
    // --- MAIN META CONTAINER BANNER BLOCK ---
    <div className="bg-[#070d19] text-white px-4 py-1.5 border-b border-gray-800/30 shadow-sm relative z-30 font-sans">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
        
        {/* LEFT COMPARTMENT: Identity Branding & Meta Identifiers */}
        <div className="flex items-center gap-2.5 min-w-0">
          
          {/* Unified Rounded Icon Container */}
          <div className="p-1 rounded-md bg-[#040810] text-[#1a5fb4] flex-shrink-0 border border-gray-800">
            <Shield className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          
          <div className="min-w-0 flex flex-col justify-center">
            {/* Dynamic Organization Name Assignment */}
            <span className="font-bold text-xs text-white block tracking-wide truncate leading-tight">
              {displayName}
            </span>
            
            {/* Direct Communication Parameter Line */}
            <span className="text-[10px] text-gray-400 font-medium block truncate mt-0.5 select-none">
              <span className="text-gray-500 font-bold tracking-wide">{t.identifierLabel}/{t.phoneOrEmail}:</span> {currentUser.identifier}
            </span>
          </div>
        </div>

        {/* RIGHT COMPARTMENT: Clean Authorization Badge */}
        <span className="bg-[#1a5fb4]/15 text-blue-400 font-bold px-2 py-0.5 rounded-md border border-[#1a5fb4]/20 text-[10px] tracking-wide flex-shrink-0 select-none">
          {displayRole}
        </span>
        
      </div>
    </div>
  );
}
