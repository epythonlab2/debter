// src/components/modals/UserDetailsDialog.tsx
import React from 'react';
import { X, Calendar, DollarSign, Activity, ActivitySquare, ShoppingBag, MapPin, Store } from 'lucide-react';

interface UserDetailsDialogProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  t: Record<string, any>;
  onToggleStatus: (user: any) => Promise<void> | void; // Add this line
}

export default function UserDetailsDialog({ user, isOpen, onClose, t }: UserDetailsDialogProps) {
  // -----------------------------------------------------------------
  // 1. CONDITIONAL GATEKEEPING
  // -----------------------------------------------------------------
  // Short-circuit execution if the dialogue container state is closed 
  // or if the identity data entity has not loaded or is undefined.
  if (!isOpen || !user) return null;

  // -----------------------------------------------------------------
  // 2. PROPERTY LOOKUP & FALLBACK NORMALIZATION
  // -----------------------------------------------------------------
  // Extracts numeric operational metrics and multi-field schemas. Evaluates 
  // nested object configurations gracefully to guard against structural shifts.
  const weeklySalesVolume = user.metrics?.weeklySalesCount || 0;
  const totalSalesAmount = user.metrics?.weeklySalesSum || 0;
  const activities = user.activities || [];
  
  // Dynamic attribute fallback chains ensuring UI layout stability 
  // regardless of relational business name structure variations.
  const resolvedShopName = user.shop_name || user.business_name || user.shopName || user.shop?.name;
  const resolvedLocation = user.location || user.address || user.shop?.location || user.shop?.address;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 antialiased selection:bg-[#1a5fb4]/20">
      {/* Backdrop Layer overlay - dismisses modal instance via safe blur boundary click handlers */}
      <div className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-xs" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* -----------------------------------------------------------------
            3. DIALOG HEADER BLOCK
            ----------------------------------------------------------------- */}
        {/* Displays the contextual localized profile type alongside the verified name indicators. */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/40">
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-wider">
              {t?.userOperationalProfile || 'User Operational Profile'}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">
              {user.full_name || user.name || t?.telemetryAudit || 'Telemetry Data Identity Audit'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* -----------------------------------------------------------------
            4. MAIN VIEWPORT CONTENT PANEL
            ----------------------------------------------------------------- */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
          
          {/* SECTION A: SYSTEM IDENTITY META GRID */}
          {/* Renders functional identity references (such as unique mobile identifiers/phone numbers) 
              and maps RBAC matrix permissions. */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/40">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold tracking-wider">{t?.accountIdentifier || 'Account Identifier'}</span>
              <span className="text-slate-800 dark:text-slate-200 font-mono text-[11px]">{user.identifier || user.phone || t?.noPhoneEntry || 'No Phone Entry'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold tracking-wider">{t?.assignedRole || 'Assigned Role'}</span>
              <span className="text-[#1a5fb4] dark:text-blue-400 font-black tracking-wide">{user.role || 'Salesperson'}</span>
            </div>
            
            {/* Extended Tenant Subcards: Displays node-level storefront configurations and addresses */}
            <div className="col-span-2 space-y-2.5 pt-2.5 border-t border-slate-200/40 dark:border-slate-800/50">
              {/* Business Entity Branch Row */}
              <div className="flex items-start gap-2 p-2 bg-slate-100/40 dark:bg-slate-800/20 border border-slate-200/20 dark:border-slate-700/40 rounded-xl">
                <Store className="w-4 h-4 text-[#1a5fb4] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-extrabold tracking-widest">{t?.businessShopName || 'Business / Shop Name'}</span>
                  <span className="text-slate-800 dark:text-slate-100 text-[11px] font-bold">
                    {resolvedShopName || t?.independentBranchLine || 'Independent Branch Line'}
                  </span>
                </div>
              </div>

              {/* Geolocation/Regional Mapping Row */}
              {resolvedLocation && (
                <div className="flex items-start gap-2 p-2 bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-700/60 rounded-xl">
                  <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-extrabold tracking-widest">{t?.operationalLocation || 'Operational Location'}</span>
                    <span className="text-slate-700 dark:text-slate-300 text-[11px] font-bold">{resolvedLocation}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION B: PERFORMANCE METRIC MONITORS */}
          {/* Tracks inventory dispatch counts and gross operational monetary transactions in local fiat (ETB) */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-black text-slate-400 tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#1a5fb4]" /> {t?.weeklyPerformanceMonitor || 'Weekly Performance Monitor'}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-[#1a5fb4]"><ShoppingBag className="w-4 h-4" /></div>
                <div>
                  <div className="text-lg font-black text-slate-800 dark:text-slate-100">{weeklySalesVolume}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{t?.salesDispatched || 'Sales Dispatched'}</div>
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-600"><DollarSign className="w-4 h-4" /></div>
                <div>
                  <div className="text-lg font-black text-slate-800 dark:text-slate-100">{totalSalesAmount.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{t?.grossAggregationEtb || 'Gross Aggregation (ETB)'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION C: OPERATIONAL TIMELINE HISTORY */}
          {/* Maps state changes, mutations, or inventory changes onto a sequential UI chronological axis */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-black text-slate-400 tracking-wider flex items-center gap-1.5">
              <ActivitySquare className="w-3.5 h-3.5 text-amber-500" /> {t?.historicOperationalLogs || 'Historic Operational Logs'}
            </h4>
            <div className="space-y-2 border-l-2 border-slate-100 dark:border-slate-800/80 ml-2 pl-4">
              {activities.length === 0 ? (
                <p className="text-slate-400 font-medium text-[11px]">
                  {t?.noLocalizedTimestampActionsCaptured || 'No localized timestamp actions captured during this lifecycle interval.'}
                </p>
              ) : (
                activities.map((act: any, idx: number) => (
                  <div key={idx} className="relative space-y-0.5 pb-2">
                    {/* Visual node alignment point on timeline vertical bar */}
                    <div className="absolute -left-[21px] mt-1 w-2 h-2 rounded-full bg-[#1a5fb4] shadow-xs" />
                    <div className="text-slate-800 dark:text-slate-200 font-bold">{act.action || t?.systemMutation || 'System Mutation Access'}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3" />
                      {new Date(act.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
