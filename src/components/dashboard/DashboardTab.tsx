// src/components/DashboardTab.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  CreditCard, Info, Search, Loader2, ArrowUpRight, TrendingUp, 
  ShoppingBag, Landmark, Globe, Store, Award, Calendar, Flame, Gem, ShieldCheck 
} from 'lucide-react';

export type TimeFilterType = 'today' | 'yesterday' | 'week' | 'month';

interface AnalyticsPayload {
  totalRevenue: number;
  grossCash: number;
  grossDube: number;
  grossBank: number;
  totalOutstandingDube: number;
  salesCount: number;
  goalPercent?: number; 
  units?: number;       
  todayUnits?: number;  
  topItems?: Array<{ name: string; value: number }>; 
  last7Days?: Array<{ date: string; revenue: number }>;
  peaks?: {
    highestDayOfWeek: { dayName: string; revenue: number };
    highestMonthOfYear: { monthName: string; revenue: number };
  };
}

interface DashboardTabProps {
  currentUser: any;
  selectedShopFilter: string;
  setSelectedShopFilter: (val: string) => void;
  onFetchShopsFromAPI: (query: string) => Promise<any[]>; 
  analytics: AnalyticsPayload;
  dailyGoal: number;
  handleUpdateGoal: (val: number) => void;
  t: any;
  timeFilter: TimeFilterType;
  setTimeFilter: (val: TimeFilterType) => void;
}

export default function DashboardTab({ 
  currentUser, 
  selectedShopFilter, 
  setSelectedShopFilter,
  onFetchShopsFromAPI,
  analytics, 
  dailyGoal, 
  handleUpdateGoal, 
  t, 
  timeFilter,
  setTimeFilter
}: DashboardTabProps) {
  const currentRole = currentUser?.role || "sales";
  
  // =========================================================================
  // --- COMBOBOX STATE MANAGEMENT ---
  // =========================================================================
  const [shopQuery, setShopQuery] = useState('');
  const [visibleShops, setVisibleShops] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedShopName, setSelectedShopName] = useState(t.allShops || "All Channels Combined");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [activeTrendBar, setActiveTrendBar] = useState<number | null>(null);

  // Synchronize layout labels on component remount when coming from other view tabs
  useEffect(() => {
    if (selectedShopFilter === 'all') {
      setSelectedShopName(t.allShops || "All Channels Combined");
      return;
    }

    // Resolve name from current active list window or fall back to an active ecosystem check
    const localMatch = visibleShops.find(s => String(s.id) === String(selectedShopFilter));
    if (localMatch) {
      setSelectedShopName(localMatch.name);
    } else {
      // Run single passive structural index match to resolve selected channel label text
      onFetchShopsFromAPI('').then(results => {
        const remoteMatch = results?.find(s => String(s.id) === String(selectedShopFilter));
        if (remoteMatch) {
          setSelectedShopName(remoteMatch.name);
        }
      }).catch(err => console.error("Error matching scope labels", err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShopFilter, t.allShops]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // =========================================================================
  // --- SERVER-SIDE DEBOUNCED SEARCH FETCH PIPELINE ---
  // =========================================================================
  useEffect(() => {
    if (!isDropdownOpen) return;

    setIsSearching(true); 
    
    const delayDebounce = setTimeout(async () => {
      try {
        const results = await onFetchShopsFromAPI(shopQuery);
        setVisibleShops(results || []);
      } catch (err) {
        console.error("Failed fetching paginated scope records", err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(delayDebounce);
  }, [shopQuery, isDropdownOpen, onFetchShopsFromAPI]);

  // =========================================================================
  // --- DATA PAYLOAD METRIC EXTRACTION ---
  // =========================================================================
  const salesCount = analytics?.salesCount ?? 0;
  const totalRevenue = analytics?.totalRevenue ?? 0;
  const grossCash = analytics?.grossCash ?? 0;
  const grossDube = analytics?.grossDube ?? 0;
  const grossBank = analytics?.grossBank ?? 0;
  const displayUnits = analytics?.units ?? analytics?.todayUnits ?? 0;
  const totalOutstandingDube = analytics?.totalOutstandingDube ?? 0;
  const displayRevenue = totalRevenue > 0 ? totalRevenue : grossCash;
  const trueGrossRevenue = displayRevenue + totalOutstandingDube;
  const goalPercent = analytics?.goalPercent ?? (dailyGoal > 0 ? Math.min(100, Math.round((displayRevenue / dailyGoal) * 100)) : 0);
  const topItems = (analytics?.topItems ?? []).filter(item => item.value > 0);
  const last7Days = analytics?.last7Days ?? [];

  const svgRadius = 22;
  const svgCircumference = 2 * Math.PI * svgRadius;
  const strokeDashoffset = svgCircumference - (Math.min(goalPercent, 100) / 100) * svgCircumference;

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case 'yesterday': return t.yesterdayLabel;
      case 'week': return t.weeklyLabel;
      case 'month': return t.monthlyLabel || "This Month";
      default: return t.todayLabel;
    }
  };

  return (
    <div 
      className="space-y-5 pb-2 text-slate-700 dark:text-slate-200 antialiased w-full p-0 m-0"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}
    >
      {/* TIME WINDOW FILTER TABS */}
      <div className="bg-slate-200/50 dark:bg-slate-900/60 backdrop-blur-xs p-1.5 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 flex gap-1">
        {(['today', 'yesterday', 'week', 'month'] as TimeFilterType[]).map((filterOpt) => {
          const isActive = timeFilter === filterOpt;
          const labels: Record<TimeFilterType, string> = {
            today: t.todayLabel, yesterday: t.yesterdayLabel || "Yesterday",
            week: t.weeklyLabel || "Last 7 Days", month: t.monthlyLabel || "This Month"
          };
          return (
            <button
              key={filterOpt}
              type="button"
              onClick={() => setTimeFilter(filterOpt)}
              className={`flex-1 text-center py-2.5 text-xs font-bold tracking-wider rounded-xl transition-all duration-300 cursor-pointer ${
                isActive ? "text-white shadow-xs font-extrabold scale-[1.01]" : "text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50"
              }`}
              style={{ backgroundColor: isActive ? '#1a5fb4' : undefined }}
            >
              {labels[filterOpt]}
            </button>
          );
        })}
      </div>

      {/* CUSTOM COMBOBOX WRAPPER ZONE */}
      {currentRole === "super_admin" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-xs space-y-4">
          <label className="block text-xs font-bold tracking-widest text-slate-400 dark:text-slate-500">
            {t.shopSelection || "Network Scope Selection"}
          </label>
          
          <div ref={dropdownRef} className="relative w-full">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={shopQuery}
                onFocus={() => {
                  setIsDropdownOpen(true);
                  if (visibleShops.length === 0) {
                    setIsSearching(true);
                  }
                }}
                onChange={(e) => setShopQuery(e.target.value)}
                placeholder={`${t.searchShops || "Search channels..."} (Currently: ${selectedShopName})`}
                className="w-full pl-10 pr-10 py-3 bg-slate-50/80 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 rounded-xl outline-none text-sm font-semibold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:border-[#1a5fb4] dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-all"
              />
              <div className="absolute right-3.5 flex items-center gap-2">
                {isSearching && <Loader2 className="w-4 h-4 text-[#1a5fb4] animate-spin" />}
                <div className="w-2 h-2 border-r-2 border-b-2 border-slate-400 transform rotate-45 pointer-events-none mb-1" />
              </div>
            </div>

            {/* FLOATING DROPDOWN OVERLAY PANEL */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto p-1.5 space-y-0.5">
                
                <button
                  type="button"
                  onClick={() => {
                    setSelectedShopFilter("all");
                    setSelectedShopName(t.allShops || "All Channels Combined");
                    setIsDropdownOpen(false);
                    setShopQuery('');
                  }}
                  className={`w-full text-left px-3 py-2.5 text-xs font-bold tracking-wide rounded-lg flex items-center gap-2 cursor-pointer transition-colors ${
                    selectedShopFilter === 'all' 
                      ? "bg-blue-50 dark:bg-blue-950/40 text-[#1a5fb4] dark:text-blue-400" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                  }`}
                >
                  <Globe className="w-4 h-4 shrink-0" />
                  <span>{t.allShops || "All Channels Combined"}</span>
                </button>

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                {visibleShops.length === 0 ? (
                  <div className="text-center py-4 text-xs font-medium text-slate-400">
                    {isSearching 
			  ? (t.queryingIndexes || "Querying Ecosystem Indexes...") 
			  : (t.noChannelsMatch || "No channels match criteria")}
                  </div>
                ) : (
                  visibleShops.map((s) => {
                    const isSelected = selectedShopFilter === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedShopFilter(s.id);
                          setSelectedShopName(s.name);
                          setIsDropdownOpen(false);
                          setShopQuery('');
                        }}
                        className={`w-full text-left px-3 py-2.5 text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer transition-colors ${
                          isSelected 
                            ? "bg-blue-50 dark:bg-blue-950/40 text-[#1a5fb4] dark:text-blue-400 font-bold" 
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                        }`}
                      >
                        <Store className="w-4 h-4 shrink-0 text-slate-400" />
                        <span className="truncate">{s.name}</span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* OUTSTANDING CREDIT BANNER (DUBE LEDGER) */}
      <div className="relative overflow-hidden rounded-3xl p-6 text-white shadow-md space-y-5 border bg-gradient-to-br from-[#1a5fb4] to-[#134685] border-white/10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md border border-white/10">
            <CreditCard className="w-4 h-4 text-blue-100" />
            <span className="text-xs font-bold tracking-widest text-blue-50">{t.dubeDebt || "Outstanding Credit"}</span>
          </div>
          <span className="text-xs font-bold bg-white/15 text-white px-3 py-1 rounded-lg border border-white/10 tracking-wider">
            {t.unpaidLedger}
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-extrabold tracking-tight font-mono">{totalOutstandingDube.toLocaleString()}</span>
            <span className="text-sm font-bold tracking-wider text-blue-200/80">{t.currency}</span>
          </div>
        </div>
        <div className="text-xs text-blue-100/80 flex items-start gap-2.5 pt-4 border-t border-white/10">
          <Info className="w-4 h-4 shrink-0 text-blue-200/80 mt-0.5" />
          <p className="leading-relaxed">{t.uncollectedLabel}</p>
        </div>
      </div>

      {/* REVENUE CONTROLLERS */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest flex items-center gap-1.5">
                <span>{t.totalExcludingDube || "Revenue"}</span>
                <span className="text-slate-400/70 dark:text-slate-500/70 font-medium lowercase">({getTimeFilterLabel()})</span>
              </h3>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">{displayRevenue.toLocaleString()}</span>
              <span className="text-sm font-bold text-slate-400 dark:text-slate-500 tracking-wider">{t.currency}</span>
            </div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-100/50 dark:border-emerald-900/50 flex items-center w-fit gap-1.5 tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>{t.excludeUnpaidLabel}</span>
            </span>
          </div>

          <div className="w-full sm:w-auto text-left sm:text-right space-y-1.5 bg-slate-50/80 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100/70 dark:border-slate-800/60">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-bold block tracking-widest">
              {timeFilter === 'week' ? t.weeklyGoal : timeFilter === 'month' ? t.monthlyGoal : t.dailyGoalLabel}
            </span>
            <div className="flex items-center gap-2 justify-start sm:justify-end">
              <input 
                type="number" 
                value={timeFilter === 'week' ? dailyGoal * 7 : timeFilter === 'month' ? dailyGoal * 30 : dailyGoal}
                disabled={timeFilter === 'week' || timeFilter === 'month' || !(currentRole === 'super_admin' || currentRole === 'admin')}
                onChange={(e) => handleUpdateGoal(Number(e.target.value))}
                className="w-28 px-2.5 py-1 text-left sm:text-right text-base font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg outline-none focus:border-[#1a5fb4] font-mono"
              />
              <span className="text-sm font-bold text-slate-400 dark:text-slate-500">{t.currency}</span>
            </div>
          </div>
        </div>

        {/* PROGRESS METRICS */}
        <div className="flex items-center gap-4 bg-slate-50/60 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100/80 dark:border-slate-800/60">
          <div className="relative flex items-center justify-center shrink-0 bg-white dark:bg-slate-900 p-1 rounded-full border border-slate-100 dark:border-slate-800">
            <svg className="w-14 h-14 transform -rotate-90">
              <circle cx="28" cy="28" r={svgRadius} className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="3.5" fill="transparent" />
              <circle
                cx="28" cy="28" r={svgRadius} stroke="#1a5fb4" strokeWidth="4" fill="transparent"
                strokeDasharray={svgCircumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <span className="absolute text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">{goalPercent}%</span>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-xs tracking-tight">
              <span className="flex items-center gap-1.5 font-bold text-[#1a5fb4] dark:text-blue-400">
                <TrendingUp className="w-4 h-4" />
                {t.completeLabel}
              </span>
              <span className="text-slate-400 dark:text-slate-500 font-semibold">
                {t.targetLabel} {(timeFilter === 'week' ? dailyGoal * 7 : timeFilter === 'month' ? dailyGoal * 30 : dailyGoal).toLocaleString()}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200/50 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-[#1a5fb4]" style={{ width: `${goalPercent}%` }}></div>
            </div>
          </div>
        </div>

        {/* PAYMENT SPLITS */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 font-bold tracking-widest">
          <div>{t.cash} <span className="text-slate-800 dark:text-slate-200 font-mono font-extrabold block text-base mt-1">{grossCash.toLocaleString()}</span></div>
          <div>{t.dube} <span className="text-slate-800 dark:text-slate-200 font-mono font-extrabold block text-base mt-1">{grossDube.toLocaleString()}</span></div>
          <div>{t.transfer} <span className="text-slate-800 dark:text-slate-200 font-mono font-extrabold block text-base mt-1">{grossBank.toLocaleString()}</span></div>
        </div>
      </div>

      {/* METRIC SCOREBOARD CARDS GRID */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500">
            <span className="text-xs font-bold tracking-wider block">{t.totalRevenue || "Total"}</span>
            <Landmark className="w-4 h-4 text-[#1a5fb4] dark:text-blue-400 opacity-80" />
          </div>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white block tracking-tight font-mono">{trueGrossRevenue.toLocaleString()}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500">
            <span className="text-xs font-bold tracking-wider block">{t.unitsSold || 'Units'}</span>
            <ShoppingBag className="w-4 h-4 text-[#1a5fb4] dark:text-blue-400 opacity-80" />
          </div>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white block tracking-tight font-mono">{displayUnits}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500">
            <span className="text-xs font-bold tracking-wider block">{t.avgValue || 'Ticket'}</span>
            <ArrowUpRight className="w-4 h-4 text-[#1a5fb4] dark:text-blue-400 opacity-80" />
          </div>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white block tracking-tight font-mono">
            {salesCount > 0 ? (trueGrossRevenue / salesCount).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "0"}
          </span>
        </div>
      </div>

      {/* TOP PRODUCTS RANKINGS */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 shadow-xs space-y-4">
        <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 tracking-widest flex items-center gap-2">
          <Award className="w-4 h-4 text-[#1a5fb4] dark:text-blue-400" />
          <span>{t.topProducts} ({getTimeFilterLabel()})</span>
        </h4>
        {topItems.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6 font-medium">{t.noSalesGeneric || "No active sales found"}</p>
        ) : (
          <div className="space-y-4">
            {topItems.map((p, idx) => {
              const maxVal = topItems[0]?.value || 1;
              const ratio = Math.round((p.value / maxVal) * 100);
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center text-sm font-medium text-slate-700 dark:text-slate-300 gap-4">
                    <span className="font-semibold text-slate-600 dark:text-slate-400 truncate max-w-[220px]">{p.name}</span>
                    <span className="font-extrabold text-slate-900 dark:text-white shrink-0 font-mono">
                      {p.value.toLocaleString()} <span className="text-xs text-slate-400 font-bold font-sans">{t.currency}</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-50 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-100/60 dark:border-slate-800/40">
                    <div className="h-full rounded-full bg-[#1a5fb4]" style={{ width: `${ratio}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* WEEKLY TREND VISUALIZATION */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 shadow-xs space-y-4">
        <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 tracking-widest flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#1a5fb4] dark:text-blue-400" />
          <span>{t.weeklyTrends || "Performance Trends"}</span>
        </h4>
        {last7Days.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6 font-medium">{t.trendLabel}</p>
        ) : (
          <div className="flex justify-between items-end h-36 pt-10 gap-3 relative">
            {last7Days.map((d, idx) => {
              const maxVal = Math.max(...last7Days.map(item => item.revenue), 1000);
              const heightPercent = Math.max(15, Math.round((d.revenue / maxVal) * 100));
              let translatedDateLabel = d.date;
              if (idx === last7Days.length - 1) { 
                translatedDateLabel = t.todayLabel || "Today";
              } else {
                const dayKey = d.date as 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
                translatedDateLabel = t.days?.[dayKey] || d.date;
              }
              return (
                <div 
                  key={idx} tabIndex={0}
                  className="flex-1 flex flex-col items-center gap-2 group relative cursor-pointer select-none outline-hidden"
                  onMouseEnter={() => setActiveTrendBar(idx)} onMouseLeave={() => setActiveTrendBar(null)}
                  onClick={() => setActiveTrendBar(activeTrendBar === idx ? null : idx)}
                >
                  <div className={`absolute bottom-[108px] left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs px-2 py-1 rounded-md shadow-md z-30 transition-all duration-150 pointer-events-none whitespace-nowrap font-mono ${activeTrendBar === idx ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
                    {d.revenue.toLocaleString()}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-800" />
                  </div>
                  <div className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100/70 dark:border-slate-800/60 rounded-lg flex flex-col justify-end h-24 overflow-hidden">
                    <div className={`w-full rounded-t-md transition-all duration-500 ${d.revenue > 0 ? "opacity-100" : "bg-slate-200/40"}`} style={{ height: `${heightPercent}%`, backgroundColor: d.revenue > 0 ? '#1a5fb4' : undefined }}></div>
                  </div>
                  <div className="text-center space-y-0.5">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block tracking-tight">{translatedDateLabel}</span>
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block font-mono">{d.revenue > 0 ? `${Math.round(d.revenue / 1000)}${t.labelK}` : "0"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ANALYSIS PERFORMANCE PEAK DECK */}
      {analytics?.peaks && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 dark:text-slate-500">
              <span className="text-xs font-bold tracking-wider block">{t.peakWeekday || "Peak Day"}</span>
              <Flame className="w-4 h-4 text-[#1a5fb4]" />
            </div>
            <div>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white block truncate">{t.days?.[analytics.peaks.highestDayOfWeek.dayName] || analytics.peaks.highestDayOfWeek.dayName}</span>
              <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 block pt-0.5 font-mono">{analytics.peaks.highestDayOfWeek.revenue.toLocaleString()} {t.currency}</span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 dark:text-slate-500">
              <span className="text-xs font-bold tracking-wider block">{t.peakMonth || "Peak Month"}</span>
              <Gem className="w-4 h-4 text-[#1a5fb4]" />
            </div>
            <div>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white block truncate">{t.months?.[analytics.peaks.highestMonthOfYear.monthName] || analytics.peaks.highestMonthOfYear.monthName}</span>
              <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 block pt-0.5 font-mono">{analytics.peaks.highestMonthOfYear.revenue.toLocaleString()} {t.currency}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
