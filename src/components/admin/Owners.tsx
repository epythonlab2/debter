// src/components/Owners.tsx
import React from 'react';
import { ShieldCheck, ShieldAlert, User, CheckCircle2, XCircle, Mail, Phone } from 'lucide-react';

interface OwnersProps {
  users: any[];
  handleApproveOwner: (id: string, approved: boolean) => void;
  handleChangePasswordPermission: (id: string, forceChange: boolean) => void;
  t: any;
}

/**
 * ==========================================
 * OWNERS DASHBOARD COMPONENT
 * ==========================================
 * Renders a scannable, soft-minimalist list card for system admins 
 * and super-admins with intuitive toggles for access and credential controls.
 */
export default function Owners({ users, handleApproveOwner, handleChangePasswordPermission, t }: OwnersProps) {
  
  // SECTION 1: DATA FILTERING
  // Restricts operational scope to authorized roles (admin & super-admin)
  const targetOwners = users.filter((u) => u.role === 'super-admin' || u.role === 'admin');

  // SECTION 2: HANDLERS & HELPERS
  const onActionClick = (id: string, isApproved: boolean) => {
    console.log(`Action triggered for owner: ${id}, setting approved: ${isApproved}`);
    handleApproveOwner(id, isApproved);
  };

  const onTogglePasswordPermission = (id: string, currentStatus: boolean) => {
    console.log(`Password toggle triggered for owner: ${id}, setting onChangePassword: ${!currentStatus}`);
    handleChangePasswordPermission(id, !currentStatus);
  };

  // Evaluates string parameters to apply contextual communications icons (Phone vs Mail)
  const isPhoneNumber = (input: string) => {
    if (!input) return false;
    return /^[+]?[(]?[0-9]{3}[)]?[-s.]?[0-9]{3}[[-s.]?[0-9]{4,6}$/im.test(input.trim());
  };

  return (
    // MAIN CONTAINER: Unified soft-minimal layout wrapper with structural padding variants
    <div 
      className="bg-white rounded-3xl border border-slate-200/70 p-4 sm:p-5 shadow-2xs space-y-4 animate-in fade-in duration-200 antialiased"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}
    >
      
      {/* SECTION 3: EMPTY STATE
          Fallback interface when filtered arrays match no active records */}
      {targetOwners.length === 0 ? (
        <div className="text-center py-12 text-xs text-slate-400 font-semibold bg-slate-50/40 rounded-2xl border border-dashed border-slate-200/60">
          👤 {t.noOwnersFound || 'No operator parameters matching this specific scope view.'}
        </div>
      ) : (
        
        // SECTION 4: ACTIVE ROW ITERATION
        // Iterates through dynamic arrays rendering cards configured for mobile responsiveness
        <div className="space-y-3">
          {targetOwners.map((owner) => {
            const contactString = owner.identifier || owner.email || owner.phone || '';
            console.log(owner.must_change_password)
            const usePhoneIcon = isPhoneNumber(contactString);
            
            // Comprehensive structural checks supporting snake_case variations and camelCase properties
            const isPasswordResetEnabled = !!(
              owner.onChangePassword ?? 
              owner.must_change_password ?? 
              owner.must_change_password ?? 
              owner.change_password
            );
            
            const tooltipText = t.allowResetLabel || 'Allow Password Change';

            return (
              <div 
                key={owner.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50/40 border border-slate-100 rounded-2xl shadow-3xs hover:shadow-xs hover:bg-white hover:border-slate-200/80 transition-all duration-200 gap-4 group"
              >
                {/* SUB-SECTION 4A: IDENTITY CARD BLOCK
                    Houses user avatars, dynamic approval badges, roles, and communication indicators */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Dynamic Status Avatar */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border relative transition-transform group-hover:scale-105 ${
                    owner.approved 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                      : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    <User className="w-5 h-5" />
                    <span className="absolute -bottom-1 -right-1 rounded-full p-0.5 bg-white shadow-xs">
                      {owner.approved ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 fill-emerald-50" />
                      ) : (
                        <ShieldAlert className="w-3 h-3 text-amber-500 fill-amber-50" />
                      )}
                    </span>
                  </div>
                  
                  {/* User Profile Info Labels */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-800 leading-tight truncate">
                        {owner.business_name || owner.businessName || t.noBusinessName || 'Unnamed Business'}
                      </p>
                      <span className="inline-block text-[9px] font-extrabold tracking-wider px-1.5 py-0.5 bg-slate-100/80 text-slate-500 rounded-md shrink-0">
                        {owner.role}
                      </span>
                    </div>
                    
                    {/* Communication Metadata Line */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      {usePhoneIcon ? (
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      ) : (
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span className="font-mono truncate text-slate-600">
                        {contactString || 'No Contact Specified'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* SUB-SECTION 4B: INTERACTIVE CONTROLS BAR
                    Fully responsive control strip that stacks neatly on mobile layout scopes */}
                <div className="flex flex-row items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t border-slate-100 sm:border-0 shrink-0 w-full sm:w-auto">
                  
                  {/* Interactive Switch Component */}
                  <label 
                    title={tooltipText}
                    className="relative flex items-center cursor-pointer select-none shrink-0 p-1.5 rounded-xl hover:bg-slate-100/80 transition-colors"
                  >
                    <input 
                      type="checkbox"
                      checked={isPasswordResetEnabled}
                      onChange={() => onTogglePasswordPermission(owner.id, isPasswordResetEnabled)}
                      className="sr-only peer"
                    />
                    <div 
                      className="w-9 h-5 bg-slate-200 rounded-full transition-colors relative 
                        after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all 
                        peer-checked:bg-[#1a5fb4] peer-checked:after:translate-x-4 rtl:peer-checked:after:-translate-x-4 peer-checked:after:border-white"
                    ></div>
                  </label>

                  {/* Operational Status Action Trigger */}
                  <button
                    type="button"
                    data-approved={owner.approved}
                    onClick={() => onActionClick(owner.id, !owner.approved)}
                    className="min-w-[100px] sm:min-w-0 px-4 py-2 rounded-xl text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer border shadow-3xs shrink-0 whitespace-nowrap bg-emerald-500 text-white border-transparent hover:bg-emerald-600 hover:shadow-sm data-[approved=true]:bg-white data-[approved=true]:text-rose-600 data-[approved=true]:border-rose-200/60 data-[approved=true]:hover:bg-rose-50/50 data-[approved=true]:hover:border-rose-200"
                  >
                    {owner.approved ? (
                      <>
                        <XCircle className="w-4 h-4 opacity-90" />
                        <span>{t.disableBtn || 'Disable'}</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 opacity-95" />
                        <span>{t.approveBtn || 'Approve'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
