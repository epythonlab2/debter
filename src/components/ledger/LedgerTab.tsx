// src/components/LedgerTab.tsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Calendar, Phone, CreditCard, Check, User, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Sale } from '../../types';

export interface GroupedSaleSection {
  date: string;
  total: number;
  items: Sale[];
}

export type LedgerPeriod = 'today' | 'yesterday' | 'weekly' | 'all';

export interface LedgerTabProps {
  ledgerToggle: "sales" | "dube";
  setLedgerToggle: (toggle: "sales" | "dube") => void;
  ledgerSearch: string;
  currentUser: any;
  setLedgerSearch: (search: string) => void;
  activePeriod: LedgerPeriod;
  setActivePeriod: (period: LedgerPeriod) => void;
  groupedSales: GroupedSaleSection[];
  filteredDubeRecords: Array<{
    id: string | number;
    buyer_name: string;
    buyer_phone: string;
    status: 'unpaid' | 'paid';
    created_at: string;
    amount: number;
  }>;
  setSettleDubeModal: (config: { isOpen: boolean; dubeId: string | number | null }) => void;
  t: any;
  lang: string;
}

const ITEMS_PER_PAGE = 15;

export default function LedgerTab({ 
  ledgerToggle, 
  setLedgerToggle, 
  ledgerSearch, 
  setLedgerSearch, 
  activePeriod = 'today',
  setActivePeriod,
  groupedSales = [], 
  filteredDubeRecords = [], 
  setSettleDubeModal,
  currentUser,
  t, 
  lang 
}: LedgerTabProps) {

  const [dubeStatusFilter, setDubeStatusFilter] = useState<'unpaid' | 'paid'>('unpaid');
  
  const [visibleSalesGroups, setVisibleSalesGroups] = useState(ITEMS_PER_PAGE);
  const [visibleDubeCount, setVisibleDubeCount] = useState(ITEMS_PER_PAGE);

  const salesSentinelRef = useRef<HTMLDivElement | null>(null);
  const dubeSentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleSalesGroups(ITEMS_PER_PAGE);
  }, [ledgerSearch, activePeriod, ledgerToggle]);

  useEffect(() => {
    setVisibleDubeCount(ITEMS_PER_PAGE);
  }, [ledgerSearch, dubeStatusFilter, ledgerToggle]);

  const activeToggleTheme = useMemo(() => {
    if (ledgerToggle === "sales") {
      return {
        bg: "bg-white border-slate-200/80 shadow-xs",
        textSales: "text-slate-900 font-semibold",
        textDube: "text-slate-500 hover:text-slate-700 font-medium",
        transform: "translateX(0%)"
      };
    }
    return {
      bg: "bg-slate-900 border-slate-950 shadow-xs",
      textSales: "text-slate-500 hover:text-slate-700 font-medium",
      textDube: "text-white font-semibold",
      transform: "translateX(100%)"
    };
  }, [ledgerToggle]);

  const partitionedDubeRecords = useMemo(() => {
    return filteredDubeRecords.filter(record => record.status === dubeStatusFilter);
  }, [filteredDubeRecords, dubeStatusFilter]);

  const lazyGroupedSales = useMemo(() => {
    return groupedSales.slice(0, visibleSalesGroups);
  }, [groupedSales, visibleSalesGroups]);

  const lazyDubeRecords = useMemo(() => {
    return partitionedDubeRecords.slice(0, visibleDubeCount);
  }, [partitionedDubeRecords, visibleDubeCount]);

  useEffect(() => {
    const observerOptions = { root: null, rootMargin: '200px', threshold: 0.1 };

    const salesObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && groupedSales.length > visibleSalesGroups) {
        setVisibleSalesGroups((prev) => prev + ITEMS_PER_PAGE);
      }
    }, observerOptions);

    const dubeObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && partitionedDubeRecords.length > visibleDubeCount) {
        setVisibleDubeCount((prev) => prev + ITEMS_PER_PAGE);
      }
    }, observerOptions);

    if (salesSentinelRef.current) salesObserver.observe(salesSentinelRef.current);
    if (dubeSentinelRef.current) dubeObserver.observe(dubeSentinelRef.current);

    return () => {
      salesObserver.disconnect();
      dubeObserver.disconnect();
    };
  }, [groupedSales.length, visibleSalesGroups, partitionedDubeRecords.length, visibleDubeCount, ledgerToggle]);

  return (
    <div className="space-y-4 antialiased selection:bg-[#1a5fb4]/10 px-0.5 font-sans">
      
      {/* SEGMENTED TOGGLE SWITCH */}
      <div className="relative grid grid-cols-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50 isolate gap-1">
        <div 
          className={`absolute top-1.5 bottom-1.5 left-1.5 rounded-xl transition-all duration-200 ease-out -z-10 border ${activeToggleTheme.bg}`}
          style={{
            width: 'calc(50% - 4px)',
            transform: activeToggleTheme.transform
          }}
        />

        <button
          type="button"
          onClick={() => setLedgerToggle("sales")}
          className={`py-2.5 text-xs tracking-wide rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none border border-transparent active:scale-[0.98] ${activeToggleTheme.textSales}`}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0 stroke-[2]" />
          <span>{t.salesLedgerToggle || "Sales Log"}</span>
        </button>

        <button
          type="button"
          onClick={() => setLedgerToggle("dube")}
          className={`py-2.5 text-xs tracking-wide rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none border border-transparent active:scale-[0.98] ${activeToggleTheme.textDube}`}
        >
          <CreditCard className="w-3.5 h-3.5 shrink-0 stroke-[2]" />
          <span>{t.dubeLedgerToggle || "Dube Credit"}</span>
        </button>
      </div>

      {/* FILTER INPUT DECK */}
      <div className="relative shadow-2xs rounded-2xl group h-11">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#1a5fb4] transition-colors stroke-[2]" />
        <input 
          type="text" 
          value={ledgerSearch}
          onChange={(e) => setLedgerSearch(e.target.value)}
          placeholder={ledgerToggle === "sales" ? (t.searchPlaceholder || "Search...") : (t.searchPlaceholder || "Search buyers...")}
          className="w-full h-full pl-11 pr-4 rounded-2xl border border-slate-200 bg-white text-sm text-slate-800 font-normal outline-none focus:border-[#1a5fb4] focus:ring-4 focus:ring-[#1a5fb4]/10 transition-all placeholder:text-slate-400 placeholder:font-normal"
        />
      </div>

      {/* DYNAMIC SUB-CONTEXT CONTROLS */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        {ledgerToggle === "sales" ? (
          (['today', 'yesterday', 'weekly', 'all'] as const).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setActivePeriod(period)}
              className={`px-4 py-2 rounded-xl text-xs font-medium tracking-wide border transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                activePeriod === period
                  ? "bg-[#1a5fb4] border-[#1a5fb4] text-white shadow-xs"
                  : "bg-white border-slate-200/80 text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              {period === 'today' ? (t.todayLabel || "Today") : 
               period === 'yesterday' ? (t.yesterdayLabel || "Yesterday") : 
               period === 'weekly' ? (t.weeklyLabel || "Past 7 Days") : (t.allLabel || "All Records")}
            </button>
          ))
        ) : (
          (['unpaid', 'paid'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setDubeStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-medium tracking-wide border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 ${
                dubeStatusFilter === status
                  ? "bg-[#1a5fb4] border-[#1a5fb4] text-white shadow-xs"
                  : "bg-white border-slate-200/80 text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              {status === 'unpaid' ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 group-hover:text-white shrink-0 stroke-[2]" />
                  <span>{t.unpaid || "Unpaid Credit"}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 group-hover:text-white shrink-0 stroke-[2]" />
                  <span>{t.paidInFull || "Settled Records"}</span>
                </>
              )}
            </button>
          ))
        )}
      </div>

      {/* LEDGER VIEWS FOR MATRIX SEGMENTS */}
      <div className="bg-white rounded-3xl border border-slate-200/70 shadow-2xs overflow-hidden relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-100 z-0" />

        {ledgerToggle === "sales" ? (
          /* SALES CONTAINER LAYER */
          <div className="relative z-10">
            {lazyGroupedSales.length === 0 ? (
              <div className="py-14 text-center text-slate-400 font-normal text-sm pl-8">
                {t.noSalesGeneric || "No transaction instances found matching metrics."}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {lazyGroupedSales.map((group, gIdx) => {
                  const firstSale = group.items?.[0] as any;
                  const salespersonName = firstSale?.recorded_by?.full_name || firstSale?.recorded_by_full_name || null;

                  return (
                    <div key={gIdx} className="pt-4 pb-3 pl-8 pr-4 space-y-2.5">
                      
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-dashed border-slate-100 pb-2 gap-2">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span className="font-semibold text-xs text-slate-500 flex items-center gap-1.5 shrink-0">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 stroke-[2]" />
                            {group.date}
                          </span>

                          {salespersonName && (
                            <span className="text-xs font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200/60 transition-all flex items-center gap-1 min-w-0">
                              <User className="w-2.5 h-2.5 text-slate-400" />
                              <span className="truncate max-w-[110px]">{salespersonName}</span>
                            </span>
                          )}
                        </div>
                        
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100/60 shadow-3xs shrink-0 self-start sm:self-auto">
                          {t.totalExcludingDube || "Total"}: {Number(group.total || 0).toLocaleString()} <span className="text-xs font-medium text-emerald-600">{t.currency || "ETB"}</span>
                        </span>
                      </div>

                      <div className="space-y-1">
                        {group.items?.map((sale) => {
                          const method = sale.paymentMethod || (sale as any).payment_method;
                          const isSettledCredit = (sale as any).is_settled_credit;

                          return (
                            <div key={sale.id} className="flex justify-between items-center py-2.5 hover:bg-slate-50/70 rounded-2xl px-2 -mx-1 transition-colors group">
                              <div className="space-y-1 max-w-[70%]">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-sm font-medium text-slate-800 tracking-tight truncate">
                                    {(() => {
                                      const fallbackName = sale.item_name || t.unregisteredItem || "Custom Item";
                                      const customNameString = (sale as any).customItemName || (sale as any).custom_item_name;
                                      return customNameString ? `${fallbackName} (${customNameString})` : fallbackName;
                                    })()}
                                  </p>
                                  
                                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded border tracking-wide scale-[0.95] origin-left ${
                                    method === 'dube' 
                                      ? isSettledCredit 
                                        ? "bg-slate-100 text-slate-600 border-slate-200" 
                                        : "bg-amber-50 text-amber-700 border-amber-100"  
                                      : method === 'transfer'
                                      ? "bg-blue-50 text-blue-700 border-blue-100"
                                      : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                  }`}>
                                    {method === 'dube' 
                                      ? isSettledCredit 
                                        ? `${t.dube || "Dube"} (${t.paidInFull || "Settled"})` 
                                        : (t.dube || "Dube") 
                                      : (method ? (t[method] || method) : (t.cash || "Cash"))}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 font-normal">
                                  {sale.quantity}x @ {Number(sale.price_sold || 0).toLocaleString()} {t.currency || "ETB"}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-semibold text-slate-900 tracking-tight pr-1">
                                  {(Number(sale.price_sold || 0) * Number(sale.quantity || 0)).toLocaleString()} <span className="text-xs text-slate-400 font-normal">{t.currency || "ETB"}</span>
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
            <div ref={salesSentinelRef} className="h-2 w-full bg-transparent" />
          </div>
        ) : (
          /* DUBE CONTAINER LAYER */
          <div className="relative z-10 divide-y divide-slate-100">
            {lazyDubeRecords.length === 0 ? (
              <div className="py-14 text-center text-slate-400 font-normal text-sm pl-8">
                {dubeStatusFilter === 'unpaid' ? (t.noUnpaidDube || "No pending active credits.") : (t.noPaidDube || "No cleared history records.")}
              </div>
            ) : (
              lazyDubeRecords.map((dube) => (
                <div 
                  key={dube.id} 
                  className={`pt-4 pb-4 pl-8 pr-4 flex justify-between items-center transition-colors hover:bg-slate-50/40 ${
                    dube.status !== 'unpaid' ? 'opacity-75' : ''
                  }`}
                >
                  <div className="space-y-1.5 max-w-[65%]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-sm text-slate-800 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0 stroke-[2]" />
                        {dube.buyer_name}
                      </span>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded border tracking-wide scale-[0.95] origin-left ${
                        dube.status === 'unpaid' 
                          ? "bg-rose-50 text-rose-700 border-rose-100" 
                          : "bg-emerald-50 text-emerald-700 border-emerald-100"
                      }`}>
                        {dube.status === 'unpaid' ? (t.unpaid || "Unpaid") : (t.paidInFull || "Settled")}
                      </span>
                    </div>
                    
                    <div className="flex flex-col gap-0.5">
                      <p className="text-xs text-slate-500 font-normal flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0 stroke-[2]" />
                        {dube.buyer_phone}
                      </p>
                      <p className="text-xs text-slate-400 font-normal">
                        {t.createdAtLabel || "Created:"} {dube.created_at}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right flex flex-col items-end gap-2 shrink-0">
                    <p className="text-sm font-semibold text-slate-900 tracking-tight">
                      {dube.amount.toLocaleString()} <span className="text-xs text-slate-400 font-normal">{t.currency || "ETB"}</span>
                    </p>
                    {dube.status === 'unpaid' ? (
                      currentUser?.role === 'admin' || currentUser?.role === 'super_admin' ? (
                        <button
                          type="button"
                          onClick={() => setSettleDubeModal({ isOpen: true, dubeId: dube.id })}
                          className="px-3 py-1.5 bg-[#1a5fb4] hover:bg-[#154b91] text-white rounded-xl text-xs font-medium tracking-wide shadow-xs transition-all flex items-center gap-1 active:scale-[0.96] cursor-pointer"
                        >
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          {t.markAsPaid || "Settle"}
                        </button>
                      ) : (
                        <span className="text-xs font-medium text-slate-400 px-2.5 py-0.5 bg-slate-50 rounded-lg border border-slate-200/60">
                          {t.unpaid || "Unpaid"}
                        </span>
                      )
                    ) : null}
                  </div>
                </div>
              ))
            )}
            <div ref={dubeSentinelRef} className="h-2 w-full bg-transparent" />
          </div>
        )}
      </div>
    </div>
  );
}
