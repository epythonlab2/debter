// src/components/StaffList.tsx
import React, { useState } from 'react';
import { Shield, ShieldAlert, Phone, Mail, Store, UserCheck, UserX, Users, Key, User, Eye, EyeOff, Copy, Check } from 'lucide-react';

interface StaffListProps {
  users: any[];
  currentUser: any;
  selectedShopFilter?: string;
  onToggleStatus: (user: any) => void;
  t: any;
}

export default function StaffList({ users, currentUser, selectedShopFilter = 'all', onToggleStatus, t }: StaffListProps) {
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Filter logic: Isolate sales staff assigned to the user's specific shop (or all if super admin)
  const salesStaff = users.filter((u) => {
    const isSales = String(u.role || '').toLowerCase() === 'sales';
    if (!isSales) return false;

    const userShopId = String(u.shop_id || '');
    const currentShopId = String(currentUser?.shop_id || '');
    const filterShopId = String(selectedShopFilter || 'all');
    
    if (currentUser?.role === 'super_admin') {
      return filterShopId === 'all' || userShopId === filterShopId;
    }
    
    return userShopId === currentShopId;
  });

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyToClipboard = (text: string, fieldId: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 1800);
  };

  return (
    <div 
      className="bg-white rounded-3xl border border-slate-200/60 p-5 space-y-4 shadow-2xs animate-in fade-in duration-200 antialiased"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}
    >
      
      {/* List Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-500">
            <Users className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-black text-slate-800 tracking-widest">
            {t.myStaffTitle || 'Registered Staff'}
          </h3>
        </div>
        <span className="bg-[#1a5fb4]/10 text-[#1a5fb4] px-2.5 py-0.5 rounded-full font-black text-[11px]">
          {salesStaff.length}
        </span>
      </div>
      
      {/* Staff Directory Container */}
      <div className="divide-y divide-slate-100/70">
        {salesStaff.map((staff) => {
          const isPasswordVisible = !!visiblePasswords[staff.id];
          const usernameKey = `${staff.id}-user`;
          const passwordKey = `${staff.id}-pass`;

          return (
            <div key={staff.id} className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-start justify-between gap-4 text-xs">
              
              {/* User Details Section */}
              <div className="flex-1 min-w-0 space-y-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-slate-800 text-sm truncate max-w-[240px]">
                    {staff.full_name || staff.fullName || 'Unnamed Personnel'}
                  </p>
                  
                  {/* Active Status Badge Indicator */}
                  <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-bold tracking-wide ${
                    staff.approved 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${staff.approved ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {staff.approved ? (t.activeLabel || 'Active') : (t.suspended || 'Suspended')}
                  </span>
                </div>

                {/* Informational Profile Sub-matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-slate-500 font-medium">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono tracking-wide text-slate-600">{staff.identifier}</span>
                  </div>
                  
                  {staff.email && (
                    <div className="flex items-center gap-2 min-w-0">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate text-slate-500/90">{staff.email}</span>
                    </div>
                  )}

                  {/* Operational Security Credentials Block */}
                  <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-dashed border-slate-100 mt-1 bg-slate-50/50 p-2 rounded-xl">
                    
                    {/* Username Field */}
                    <div className="flex items-center justify-between gap-2 bg-white border border-slate-100 px-2.5 py-1.5 rounded-lg">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-400 font-bold text-[10px] tracking-wider">User:</span>
                        <span className="font-mono text-slate-700 truncate">{staff.username || staff.identifier}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyToClipboard(staff.username || staff.identifier, usernameKey)}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 cursor-pointer"
                      >
                        {copiedField === usernameKey ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>

                    {/* Password Field Block */}
                    <div className="flex items-center justify-between gap-2 bg-white border border-slate-100 px-2.5 py-1.5 rounded-lg">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Key className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-400 font-bold text-[10px] tracking-wider">Pass:</span>
                        <span className="font-mono text-slate-700 truncate tracking-wide">
                          {isPasswordVisible ? (staff.password || 'No Password') : '••••••••'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(staff.id)}
                          className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 cursor-pointer"
                        >
                          {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          disabled={!isPasswordVisible}
                          onClick={() => handleCopyToClipboard(staff.password, passwordKey)}
                          className={`p-0.5 transition-colors ${isPasswordVisible ? 'text-slate-400 hover:text-slate-600 cursor-pointer' : 'text-slate-200 cursor-not-allowed'}`}
                        >
                          {copiedField === passwordKey ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Super-Admin Meta Information Matrix row */}
                  {currentUser?.role === 'super_admin' && staff.shop_id && (
                    <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400 sm:col-span-2 mt-0.5">
                      <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider">
                        Shop Key: {String(staff.shop_id).substring(0, 8)}...
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Strict Administrative Control Action Trigger */}
              <div className="flex items-center self-end sm:self-start sm:pt-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus(staff);
                  }}
                  className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold tracking-wider border transition-all active:scale-95 cursor-pointer shadow-xs ${
                    staff.approved 
                      ? 'bg-rose-50 text-rose-600 border-rose-200/50 hover:bg-rose-100/80 hover:text-rose-700' 
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100' 
                  }`}
                >
                  {staff.approved ? (
                    <>
                      <UserX className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{t.disableBtn || 'Disable'}</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{t.approveBtn || 'Enable'}</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Empty State Vector Fallback */}
      {salesStaff.length === 0 && (
        <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <p className="text-xs font-semibold text-slate-400">
            {t.noPersonnelRecorded || 'No personnel recorded under this branch structure.'}
          </p>
        </div>
      )}
    </div>
  );
}
