// src/components/DashboardTab.tsx
import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Info, 
  Search, 
  Loader2, 
  ArrowUpRight, 
  TrendingUp, 
  ShoppingBag, 
  Landmark, 
  Globe, 
  Store, 
  Award, 
  Calendar, 
  Flame, 
  Gem,
  ShieldCheck
} from 'lucide-react';

/**
 * Valid operational time windows supported by the analytic pipeline calculation engine.
 */
export type TimeFilterType = 'today' | 'yesterday' | 'week' | 'month';

/**
 * Data layout payload parsed down directly from the processing business logic hooks.
 */
interface AnalyticsPayload {
  totalRevenue: number;
  grossCash: number;
  grossTele: number;
  grossDube: number;
  grossBank: number;
  totalOutstandingDube: number;
  salesCount: number;
  goalPercent?: number; 
  todayUnits?: number;  // Fallback property mapping for legacy backend data pipelines
  units?: number;       // Modern, range-agnostic item quantity counter property
  topItems?: Array<{ name: string; value: number }>; 
  last7Days?: Array<{ date: string; revenue: number }>;
  // Dynamic analysis peak anchors property schema configuration
  peaks?: {
    highestDayOfWeek: { dayName: string; revenue: number };
    highestMonthOfYear: { monthName: string; revenue: number };
  };
}

interface DashboardTabProps {
  currentUser: any;
  shops: any[]; 
  selectedShopFilter: string;
  setSelectedShopFilter: (val: string) => void;
  onSearchShops?: (query: string) => void; 
  isLoadingShops?: boolean;                  
  analytics: AnalyticsPayload;
  dailyGoal: number;
  handleUpdateGoal: (val: number) => void;
  t: any;
  lang: string;
  timeFilter: TimeFilterType;
  setTimeFilter: (val: TimeFilterType) => void;
}

export default function DashboardTab({ 
  currentUser, 
  shops = [], 
  selectedShopFilter, 
  setSelectedShopFilter,
  onSearchShops,
  isLoadingShops = false,
  analytics, 
  dailyGoal, 
  handleUpdateGoal, 
  t, 
  timeFilter,
  setTimeFilter
}: DashboardTabProps) {
  const currentRole = currentUser?.role || "sales";
  const [shopQuery, setShopQuery] = useState('');

  // SECTION: REMOTE DATA ACCELERATION & DEBOUNCING
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (onSearchShops) {
        onSearchShops(shopQuery);
      }
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [shopQuery, onSearchShops]);

  // SECTION: PAYLOAD EXTRACTION ENGINE
  const salesCount = analytics?.salesCount ?? 0;
  const totalRevenue = analytics?.totalRevenue ?? 0;
  const grossCash = analytics?.grossCash ?? 0;
  const grossDube = analytics?.grossDube ?? 0;
  const grossBank = analytics?.grossBank ?? 0;
  const displayUnits = analytics?.units ?? analytics?.todayUnits ?? 0;
  const totalOutstandingDube = analytics?.totalOutstandingDube ?? 0;

  // SECTION: ACCOUNTING COMPUTATION RULES
  const displayRevenue = totalRevenue > 0 ? totalRevenue : grossCash;

  // 📊 Secondary Metric: True Gross Volume (Liquid Cash + Outstanding Credits Combined)
  const trueGrossRevenue = displayRevenue + totalOutstandingDube;

  // SECTION: PERFORMANCE EVALUATIONS
  const goalPercent = analytics?.goalPercent ?? (dailyGoal > 0 ? Math.min(100, Math.round((displayRevenue / dailyGoal) * 100)) : 0);

  const topItems = (analytics?.topItems ?? []).filter(item => item.value > 0);
  const last7Days = analytics?.last7Days ?? [];

  // SVG Circular Configuration Constants Unification
  const svgRadius = 22;
  const svgCircumference = 2 * Math.PI * svgRadius;
  const strokeDashoffset = svgCircumference - (Math.min(goalPercent, 100) / 100) * svgCircumference;

  /**
   * Helper utility calculating localized descriptors based on active time context selections.
   */
  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case 'yesterday': return t.yesterdayLabel;
      case 'week': return t.weeklyLabel;
      case 'month': return t.monthlyLabel || "This Month";
      default: return t.todayLabel;
    }
  };

  return (
    <div className="space-y-5 pb-2 text-slate-700 antialiased font-sans w-full p-0 m-0">
      
      {/* SECTION: TIME FILTER ELEMENT CHIPS - ALIGNED TO BRAND COLOR */}
      <div className="bg-slate-100/80 backdrop-blur-xs p-1.5 rounded-2xl border border-slate-200/40 flex gap-1">
        {(['today', 'yesterday', 'week', 'month'] as TimeFilterType[]).map((filterOpt) => {
          const isActive = timeFilter === filterOpt;
          const labels: Record<TimeFilterType, string> = {
            today: t.todayLabel,
            yesterday: t.yesterdayLabel || "Yesterday",
            week: t.weeklyLabel || "Last 7 Days",
            month: t.monthlyLabel || "This Month"
          };

          return (
            <button
              key={filterOpt}
              type="button"
              onClick={() => setTimeFilter(filterOpt)}
              className={`flex-1 text-center py-2.5 text-xs font-bold  tracking-wider rounded-xl transition-all duration-300 cursor-pointer ${
                isActive 
                  ? "text-white shadow-sm font-extrabold scale-[1.01]" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
              }`}
              style={{ backgroundColor: isActive ? '#1a5fb4' : undefined }}
            >
              {labels[filterOpt]}
            </button>
          );
        })}
      </div>

      {/* SECTION: SUPER ADMIN NETWORK MANAGEMENT ROUTER */}
      {currentRole === "super_admin" && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
          <label className="block text-xs font-bold  tracking-widest text-slate-400">
            {t.shopSelection || "Network Scope Selection"}
          </label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={shopQuery}
                onChange={(e) => setShopQuery(e.target.value)}
                placeholder="Search shops..."
                className="w-full pl-10 pr-10 py-3 bg-slate-50/80 border border-slate-200/70 rounded-xl outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white transition-all"
              />
              {isLoadingShops && (
                <div className="absolute right-3.5">
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                </div>
              )}
            </div>

            <div className="relative">
              <select 
                value={selectedShopFilter}
                onChange={(e) => setSelectedShopFilter(e.target.value)}
                className="w-full pl-10 pr-8 py-3 rounded-xl border border-slate-200/70 outline-none text-sm font-semibold text-slate-800 bg-slate-50/80 focus:border-slate-400 focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="all">{t.allShops || "All Channels Combined"}</option>
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <div className="absolute left-3.5 top-3.5 pointer-events-none flex items-center gap-1.5 text-slate-400">
                {selectedShopFilter === "all" ? <Globe className="w-4 h-4" /> : <Store className="w-4 h-4" />}
              </div>
              <div className="absolute right-3.5 top-4 pointer-events-none w-2 h-2 border-r-2 border-b-2 border-slate-400 transform rotate-45" />
            </div>
          </div>
        </div>
      )}

      {/* SECTION: CREDIT STATUS OVERVIEW COMPONENT (DUBE LEDGER) */}
      <div 
        className="relative overflow-hidden rounded-3xl p-6 text-white shadow-md space-y-5 border bg-gradient-to-br from-[#1a5fb4] to-[#134685] border-white/10"
      >
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-12 -bottom-8 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md border border-white/10">
            <CreditCard className="w-4 h-4 text-blue-100" />
            <span className="text-xs font-bold  tracking-widest text-blue-50">{t.dubeDebt || "Outstanding Credit"}</span>
          </div>
          <span className="text-xs font-bold bg-white/15 text-white px-3 py-1 rounded-lg border border-white/10 backdrop-blur-md  tracking-wider">
            {t.unpaidLedger}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-extrabold tracking-tight font-mono">{totalOutstandingDube.toLocaleString()}</span>
            <span className="text-sm font-bold  tracking-wider text-blue-200/80">{t.currency}</span>
          </div>
        </div>

        <div className="text-xs text-blue-100/80 flex items-start gap-2.5 pt-4 border-t border-white/10">
          <Info className="w-4 h-4 shrink-0 text-blue-200/80 mt-0.5" />
          <p className="leading-relaxed font-normal">
            {t.uncollectedLabel}
          </p>
        </div>
      </div>

      {/* SECTION: PRIMARY BUSINESS REVENUE CARD & TARGET SCALING MATRIX */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-400  tracking-widest flex items-center gap-1.5">
                <span>{t.totalExcludingDube || "Revenue"}</span>
                <span className="text-slate-400/70 font-medium lowercase">({getTimeFilterLabel()})</span>
              </h3>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-slate-900 tracking-tight font-mono">{displayRevenue.toLocaleString()}</span>
              <span className="text-sm font-bold text-slate-400  tracking-wider">{t.currency}</span>
            </div>
            
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50/60 px-2.5 py-1 rounded-md border border-emerald-100/50 flex items-center w-fit gap-1.5 select-none  tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{t.excludeUnpaidLabel}</span>
            </span>
          </div>

          <div className="w-full sm:w-auto text-left sm:text-right space-y-1.5 bg-slate-50/80 p-4 rounded-2xl border border-slate-100/70">
            <span className="text-xs text-slate-400 font-bold  block tracking-widest">
              {timeFilter === 'week' ? t.weeklyGoal : timeFilter === 'month' ? t.monthlyGoal : t.dailyGoalLabel}
            </span>
            <div className="flex items-center gap-2 justify-start sm:justify-end">
              <input 
                type="number" 
                value={timeFilter === 'week' ? dailyGoal * 7 : timeFilter === 'month' ? dailyGoal * 30 : dailyGoal}
                disabled={
                  timeFilter === 'week' || 
                  timeFilter === 'month' || 
                  !(currentRole === 'super_admin' || currentRole === 'admin')
                }
                onChange={(e) => handleUpdateGoal(Number(e.target.value))}
                className="w-28 px-2.5 py-1 text-left sm:text-right text-base font-bold text-slate-800 border border-slate-200 bg-white rounded-lg outline-none focus:border-slate-400 transition-all disabled:opacity-60 disabled:bg-slate-100 font-mono"
              />
              <span className="text-sm font-bold text-slate-400 ">{t.currency}</span>
            </div>
          </div>
        </div>

        {/* SECTION: PROGRESS STATUS BAR INDICATOR WITH INTERNAL PERCENTAGE CIRCLE */}
        <div className="flex items-center gap-4 bg-slate-50/60 p-4 rounded-2xl border border-slate-100/80">
          <div className="relative flex items-center justify-center shrink-0 bg-white p-1 rounded-full shadow-xs border border-slate-100">
            <svg className="w-14 h-14 transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r={svgRadius}
                className="stroke-slate-100"
                strokeWidth="3.5"
                fill="transparent"
              />
              <circle
                cx="28"
                cy="28"
                r={svgRadius}
                stroke="#1a5fb4"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={svgCircumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <span className="absolute text-xs font-bold text-slate-800 font-mono">
              {goalPercent}%
            </span>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-xs tracking-tight">
              <span className="flex items-center gap-1.5 font-bold  text-[#1a5fb4]">
                <TrendingUp className="w-4 h-4" />
                {t.completeLabel}
              </span>
              <span className="text-slate-400 font-semibold">
                {t.targetLabel} {(timeFilter === 'week' ? dailyGoal * 7 : timeFilter === 'month' ? dailyGoal * 30 : dailyGoal).toLocaleString()}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200/50 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500 shadow-xs bg-[#1a5fb4]"
                style={{ width: `${goalPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* SUB-SECTION: LIQUID VALUE ROUTE BREAKDOWN */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs text-slate-400 font-bold  tracking-widest">
          <div>{t.cash} <span className="text-slate-800 font-extrabold block text-base font-mono mt-1">{grossCash.toLocaleString()}</span></div>
          <div>{t.dube} <span className="text-slate-800 font-extrabold block text-base font-mono mt-1">{grossDube.toLocaleString()}</span></div>
          <div>{t.transfer} <span className="text-slate-800 font-extrabold block text-base font-mono mt-1">{grossBank.toLocaleString()}</span></div>
        </div>
      </div>

      {/* SECTION: TRIPLE STAT METRIC HORIZONTAL LAYOUT DECK */}
      <div className="grid grid-cols-3 gap-3">
        {/* CARD A: Total Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold  tracking-wider block">{t.totalRevenue || "Total"}</span>
            <Landmark className="w-4 h-4 opacity-40" />
          </div>
          <span className="text-xl font-extrabold text-slate-900 block tracking-tight font-mono">
            {trueGrossRevenue.toLocaleString()}
          </span>
        </div>
        
        {/* CARD B: Units */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold  tracking-wider block">{t.unitsSold || 'Units'}</span>
            <ShoppingBag className="w-4 h-4 opacity-40" />
          </div>
          <span className="text-xl font-extrabold text-slate-900 block tracking-tight font-mono">{displayUnits}</span>
        </div>
        
        {/* CARD C: Ticket */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold  tracking-wider block">{t.avgValue || 'Ticket'}</span>
            <ArrowUpRight className="w-4 h-4 opacity-40" />
          </div>
          <span className="text-xl font-extrabold text-slate-900 block tracking-tight font-mono">
            {salesCount > 0 
              ? (trueGrossRevenue / salesCount).toLocaleString(undefined, { maximumFractionDigits: 0 }) 
              : "0"}
          </span>
        </div>
      </div>

      {/* SECTION: PRODUCTIVITY LEADERSHIP PRODUCT PANEL */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs space-y-4">
        <h4 className="font-bold text-xs text-slate-800  tracking-widest flex items-center gap-2">
          <Award className="w-4 h-4 text-[#1a5fb4]" />
          <span>{t.topProducts} ({getTimeFilterLabel()})</span>
        </h4>
        {topItems.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6 font-medium">{t.noSalesGeneric || "No active sales found"}</p>
        ) : (
          <div className="space-y-4">
            {topItems.map((p, idx) => {
              const maxVal = topItems[0]?.value || 1;
              const ratio = Math.round((p.value / maxVal) * 100);
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center text-sm font-medium text-slate-700 gap-4">
                    <span className="font-semibold text-slate-600 truncate max-w-[220px]">
                      {p.name}
                    </span>
                    <span className="font-extrabold text-slate-900 shrink-0 font-mono">
                      {p.value.toLocaleString()} <span className="text-xs text-slate-400 font-bold font-sans ">{t.currency}</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100/60">
                    <div 
                      className="h-full rounded-full shadow-xs transition-all duration-500 bg-[#1a5fb4]" 
                      style={{ width: `${ratio}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION: HISTORICAL TREND VISUALIZATION COMPONENT */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs space-y-4">
        <h4 className="font-bold text-xs text-slate-800  tracking-widest flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{t.weeklyTrends || "Performance Trends"}</span>
        </h4>
        {last7Days.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6 font-medium">{t.trendLabel}</p>
        ) : (
          <div className="flex justify-between items-end h-32 pt-4 gap-3">
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
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                  <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white font-bold text-xs px-2 py-0.5 rounded-md shadow-sm z-10 pointer-events-none whitespace-nowrap font-mono">
                    {d.revenue.toLocaleString()}
                  </div>

                  <div className="w-full bg-slate-50 border border-slate-100/70 rounded-lg flex flex-col justify-end h-24 overflow-hidden">
                    <div 
                      className={`w-full rounded-t-md transition-all duration-500 shadow-xs ${
                        d.revenue > 0 ? "opacity-100" : "bg-slate-200/40"
                      }`}
                      style={{ 
                        height: `${heightPercent}%`, 
                        backgroundColor: d.revenue > 0 ? '#1a5fb4' : undefined 
                      }}
                    ></div>
                  </div>
                  <div className="text-center space-y-0.5">
                    <span className="text-xs font-bold text-slate-400 block  tracking-tight">
                      {translatedDateLabel}
                    </span>
                    <span className="text-xs font-extrabold text-slate-700 block font-mono">
                      {d.revenue > 0 ? `${Math.round(d.revenue / 1000)}${t.labelK}` : "0"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION: PERFORMANCE PEAK DECK */}
      {analytics?.peaks && (
        <div className="grid grid-cols-2 gap-3">
          {/* Peak Day Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold  tracking-wider block text-slate-400">
                {t.peakWeekday || "Peak Day"}
              </span>
              <Flame className="w-4 h-4 text-[#1a5fb4]" />
            </div>
            <div>
              <span className="text-lg font-extrabold text-slate-900 block tracking-tight truncate">
                {t.days?.[analytics.peaks.highestDayOfWeek.dayName] || analytics.peaks.highestDayOfWeek.dayName}
              </span>
              <span className="text-sm font-semibold text-slate-400 block pt-0.5 font-mono">
                {analytics.peaks.highestDayOfWeek.revenue.toLocaleString()} {t.currency}
              </span>
            </div>
          </div>

          {/* Peak Month Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold  tracking-wider block text-slate-400">
                {t.peakMonth || "Peak Month"}
              </span>
              <Gem className="w-4 h-4 text-[#1a5fb4]" />
            </div>
            <div>
              <span className="text-lg font-extrabold text-slate-900 block tracking-tight truncate">
                {t.months?.[analytics.peaks.highestMonthOfYear.monthName] || analytics.peaks.highestMonthOfYear.monthName}
              </span>
              <span className="text-sm font-semibold text-slate-400 block pt-0.5 font-mono">
                {analytics.peaks.highestMonthOfYear.revenue.toLocaleString()} {t.currency}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
