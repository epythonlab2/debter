// src/components/admin/UserSegmentTable.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Check, X, Trash2, Eye, ShieldAlert, ShieldCheck, KeyRound } from 'lucide-react';

interface UserRecord {
  id: string | number;
  full_name?: string;
  name?: string;
  identifier?: string;
  phone?: string;
  email?: string;
  business_name?: string;
  role?: string;
  approved?: boolean;
  must_change_password?: boolean | string;
  mustChangePassword?: boolean | string;
}

interface UserSegmentTableProps {
  users: UserRecord[];
  type: 'new' | 'active' | 'inactive';
  onToggleStatus: (user: UserRecord) => void;
  onTogglePasswordForce?: (user: UserRecord) => void;
  onDeleteSingle: (id: string) => void;
  onDeleteMultiple?: (ids: string[]) => void;
  onViewDetails: (user: UserRecord) => void;
  t?: Record<string, string>;
}

export default function UserSegmentTable({
  users = [],
  type,
  onToggleStatus,
  onTogglePasswordForce,
  onDeleteSingle,
  onDeleteMultiple,
  onViewDetails,
  t
}: UserSegmentTableProps) {
  // -----------------------------------------------------------------
  // 1. SELECTION MATRIX STATE MANAGEMENT
  // -----------------------------------------------------------------
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Clear selections whenever the table view type or dataset changes
  useEffect(() => {
    setSelectedIds([]);
  }, [users, type]);

  // -----------------------------------------------------------------
  // 2. INTERACTION HANDLERS & MEMOIZED EVALUATIONS
  // -----------------------------------------------------------------
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(users.map(u => String(u.id)));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(item => item !== id));
  };

  const handleBatchDelete = () => {
    if (onDeleteMultiple && selectedIds.length > 0) {
      onDeleteMultiple(selectedIds);
      setSelectedIds([]);
    }
  };

  // Cache selection evaluation to prevent recalculating array on every paint
  const isAllSelected = useMemo(() => {
    if (users.length === 0) return false;
    const selectedSet = new Set(selectedIds);
    return users.every(u => selectedSet.has(String(u.id)));
  }, [users, selectedIds]);

  return (
    <div className="space-y-3">
      {/* 3. BATCH TRANSACTION OPERATIONAL BAR */}
      {type === 'inactive' && onDeleteMultiple && users.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800/80">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {t?.selected || 'Selected'}: {selectedIds.length} / {users.length}
          </span>
          <button
            type="button"
            disabled={selectedIds.length === 0}
            onClick={handleBatchDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 dark:disabled:text-slate-600 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t?.batchDeleteInactive || 'Batch Delete Inactive'}</span>
          </button>
        </div>
      )}

      {/* 4. MULTI-TENANT OPERATION TABLE SCHEMA */}
      <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/60 text-slate-400 dark:text-slate-500 text-[10px] font-black tracking-wider">
              {type === 'inactive' && (
                <th className="p-4 w-12">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={isAllSelected}
                    className="accent-[#1a5fb4] cursor-pointer"
                  />
                </th>
              )}
              <th className="p-4">{t?.userDetails || 'User Details'}</th>
              <th className="p-4">{t?.businessRole || 'Business / Role'}</th>
              <th className="p-4">{t?.statusFlag || 'Status Flag'}</th>
              <th className="p-4 text-right">{t?.actionsMatrix || 'Actions Matrix'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {users.length === 0 ? (
              <tr>
                <td colSpan={type === 'inactive' ? 5 : 4} className="text-center py-12 text-slate-400 dark:text-slate-500 font-medium">
                  {t?.noRecordsFound || 'No operational records match this segment window.'}
                </td>
              </tr>
            ) : (
              users.map(user => {
                const userIdStr = String(user.id);
                
                // Unified boolean parser for dynamic multi-variant API setups
                const mustChange = [user.must_change_password, user.mustChangePassword].some(
                  val => val === true || String(val).toLowerCase() === 'true'
                );

                return (
                  <tr key={userIdStr} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                    {type === 'inactive' && (
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(userIdStr)}
                          onChange={(e) => handleSelectOne(userIdStr, e.target.checked)}
                          className="accent-[#1a5fb4] cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="p-4">
                      <div className="font-bold text-slate-800 dark:text-slate-100">
                        {user.full_name || user.name || t?.defaultUser || 'Debter User'}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium font-mono truncate max-w-[180px]">
                        {user.identifier || user.phone || user.email}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800 dark:text-slate-200">{user.business_name || 'N/A'}</div>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-md font-bold tracking-wide">
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 items-start">
                        {user.approved ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                            <ShieldCheck className="w-3.5 h-3.5" /> {t?.activeStatus || 'Active'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-lg border border-amber-100 dark:border-amber-900/30">
                            <ShieldAlert className="w-3.5 h-3.5" /> {t?.suspended || 'Suspended'}
                          </span>
                        )}
                        
                        {mustChange && (
                          <span className="text-[9px] text-amber-700 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-900/40 px-1.5 py-0.5 rounded font-medium tracking-wide animate-pulse">
                            {t?.resetRequired || 'Reset Required'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* 👁️ View Action */}
                        <button
                          type="button"
                          onClick={() => onViewDetails(user)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          title={t?.viewDetailedLogs || 'View Detailed Logs'}
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* 🔑 Force Password Reset */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onTogglePasswordForce) onTogglePasswordForce(user);
                          }}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            mustChange
                              ? 'bg-amber-500 border-amber-600 text-white shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                          }`}
                          title={mustChange ? t?.cancelPasswordForce || "Clear" : t?.forcePasswordChange || "Force Change"}
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {/* ❌ Account Activation Toggle */}
                        <button
                          type="button"
                          onClick={() => onToggleStatus(user)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            user.approved
                              ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400'
                              : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                          }`}
                          title={user.approved ? t?.deactivateAccount || "Deactivate Account" : t?.activateAccount || "Activate Account"}
                        >
                          {user.approved ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        </button>

                        {/* 🗑️ Row Delete Action */}
                        <button
                          type="button"
                          onClick={() => onDeleteSingle(userIdStr)}
                          className="p-1.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          title={t?.deleteRecord || 'Delete Record'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
