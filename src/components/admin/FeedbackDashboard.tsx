// src/components/feedback/FeedbackDashboard.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useFeedbackAdmin } from '../../hooks/useFeedbackAdmin';
import { 
  Bell, MessageSquare, AlertTriangle, User, Building2, 
  ShieldAlert, RefreshCw, CheckCircle2, Search, Archive, Inbox
} from 'lucide-react';

interface FeedbackDashboardProps {
  t: any;
}

export function FeedbackDashboard({ t }: FeedbackDashboardProps) {
  const {
    logs, hasMore, isLoading, unreadCount,
    filterType, setFilterType, searchQuery, setSearchQuery,
    archiveFeedback, clearNotifications, loadMoreItems, totalCount
  } = useFeedbackAdmin();

  const [showNotificationPopover, setShowNotificationPopover] = useState(false);
  const observerTargetRef = useRef<HTMLDivElement | null>(null);

  // Lazy Loading Engine Integration
  useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreItems();
        }
      },
      { threshold: 0.1, rootMargin: '150px' }
    );

    const currentTarget = observerTargetRef.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [hasMore, isLoading, loadMoreItems]);

  const handleBellClick = () => {
    clearNotifications();
    setShowNotificationPopover(!showNotificationPopover);
  };

  // Standard UI Skeleton State matching app performance architecture
  if (isLoading) {
    return (
      <div 
        className="space-y-6 pb-8 text-slate-700 dark:text-slate-200 antialiased max-w-2xl mx-auto animate-pulse"
        style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}
      >
        <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full" />
        <div className="h-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl w-full" />
        {[1, 2, 3].map((n) => (
          <div key={n} className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl space-y-3">
            <div className="flex gap-2">
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-28" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-16" />
            </div>
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-5/6" />
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div 
      className="space-y-6 pb-8 text-slate-700 dark:text-slate-200 antialiased max-w-2xl mx-auto"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}
    >
      
      {/* SECTION: FILTER ELEMENT CHIPS - ALIGNED TO BRAND COLOR RULES */}
      <div className="bg-slate-100/80 dark:bg-slate-800/60 backdrop-blur-xs p-1.5 rounded-2xl border border-slate-200/40 dark:border-slate-700/50 flex gap-1 transition-colors">
        {(['all', 'repeaters', 'archived'] as const).map((filterOpt) => {
          const isActive = filterType === filterOpt;
          const labels = {
            all: t.allFeedbackLabel || "Active Inbox",
            repeaters: t.repeatersLabel || "Repeat Senders",
            archived: t.archivedLabel || "Archive Logs"
          };
          const Icons = {
            all: Inbox,
            repeaters: AlertTriangle,
            archived: Archive
          };
          const Icon = Icons[filterOpt];

          return (
            <button
              key={filterOpt}
              type="button"
              onClick={() => setFilterType(filterOpt)}
              className={`flex-1 text-center py-2.5 text-xs font-bold tracking-wider rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 ${
                isActive 
                  ? "text-white shadow-sm font-extrabold scale-[1.01]" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50"
              }`}
              style={{ backgroundColor: isActive ? '#1a5fb4' : undefined }}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{labels[filterOpt]}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono transition-colors ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300'}`}>
                {filterType === filterOpt ? totalCount : '•'}
              </span>
            </button>
          );
        })}
      </div>

      {/* SECTION: TELEMETRY CONTROL OVERVIEW UTILITIES PANEL */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-xs space-y-4 transition-colors">
        <label className="block text-xs font-bold tracking-widest text-slate-400 dark:text-slate-500">
          {t.feedbackSearchScope || "Telemetry Filter Engine"}
        </label>
        
        <div className="flex gap-3">
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-4 py-3 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/80 rounded-xl outline-none text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-slate-400 dark:focus:border-slate-600 focus:bg-white dark:focus:bg-slate-950 transition-all"
            />
          </div>

          <div className="relative shrink-0">
            <button 
              type="button"
              onClick={handleBellClick}
              className={`p-3 rounded-xl border transition-all cursor-pointer relative active:scale-95 flex items-center justify-center ${
                unreadCount > 0 
                  ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100/70 dark:hover:bg-rose-950/40' 
                  : 'bg-slate-50/80 dark:bg-slate-950/40 border-slate-200/70 dark:border-slate-800/80 hover:border-slate-400 dark:hover:border-slate-600 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-4.5 px-1 bg-rose-600 dark:bg-rose-500 text-white font-extrabold text-[9px] rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* FLOATING NOTIFICATION MODAL BRIDGE */}
            {showNotificationPopover && unreadCount > 0 && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-[11px] font-bold text-rose-600 dark:text-rose-400 tracking-wider">Unread Inbound Packets</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal font-medium">
                      There are {unreadCount} new feedback submissions ready to be parsed in the cluster queue layout.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION: FEEDBACK RENDERING LIST */}
      <div className="space-y-4">
        {logs.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl text-slate-400 dark:text-slate-500 text-sm font-medium transition-colors">
            {t.noFeedbackGeneric || "No telemetry records match this structural filtering mask."}
          </div>
        ) : (
          logs.map((log) => {
            const isSpamming = log.submissionCount && log.submissionCount > 2;

            return (
              <div 
                key={log.feedbackId} 
                className={`bg-white dark:bg-slate-900 border rounded-3xl p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4 shadow-xs transition-all duration-300 relative overflow-hidden ${
                  isSpamming && !log.isArchived 
                    ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/[0.15] dark:bg-amber-950/10' 
                    : 'border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                {/* Visual Accent Hover Border Accent Line */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-[4px] transition-all" 
                  style={{ backgroundColor: isSpamming ? '#f59e0b' : log.isArchived ? '#94a3b8' : '#1a5fb4' }}
                />

                <div className="space-y-3 flex-1 pl-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold tracking-tight">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-800 font-semibold">
                      <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {log.fullName || 'Anonymous User'}
                    </span>
                    
                    <span 
                      className="px-2.5 py-1 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 font-extrabold text-[11px] tracking-wider"
                      style={{ color: '#1a5fb4' }}
                    >
                      {log.role || 'user'}
                    </span>

                    {log.businessName && log.businessName !== 'N/A' && (
                      <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500 font-medium bg-slate-50/40 dark:bg-slate-800/30 px-2 py-1 rounded-lg border border-slate-100/50 dark:border-slate-800/50">
                        <Building2 className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" /> {log.businessName}
                      </span>
                    )}

                    {isSpamming && !log.isArchived && (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60 rounded-lg text-[10px] font-bold tracking-wider select-none">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> {t.repeatLog} ({log.submissionCount}x)
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {log.feedback}
                  </p>
                </div>

                {/* META METRIC ACTION PANEL BAR */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4 shrink-0 sm:min-w-[130px]">
                  <span className="text-xs font-mono text-slate-400 dark:text-slate-500 font-bold bg-slate-50 dark:bg-slate-800/60 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800">
                    {new Date(log.receivedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  
                  {!log.isArchived && (
                    <button
                      type="button"
                      onClick={() => archiveFeedback(log.feedbackId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 hover:border-emerald-200 dark:hover:border-emerald-800 rounded-xl text-xs font-bold tracking-wider transition-all cursor-pointer shadow-xs active:scale-95"
                      title={t.markAsResolvedArchive}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      {t.resolve}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* INFINITE LAZY LOAD OBSERVATION ELEMENT ANCHOR */}
        {hasMore && (
          <div 
            ref={observerTargetRef} 
            className="flex py-6 justify-center items-center w-full text-slate-400 dark:text-slate-500 text-xs gap-2.5 font-bold tracking-widest border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/40 dark:bg-slate-900/20 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ color: '#1a5fb4' }} />
            Syncing additional records...
          </div>
        )}
      </div>
    </div>
  );
}
