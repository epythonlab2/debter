// src/components/feedback/FeedbackDashboard.tsx
import React, { useEffect, useRef } from 'react';
import { useFeedbackAdmin } from '../../hooks/useFeedbackAdmin';
import { 
  AlertTriangle, User, Building2, 
  RefreshCw, CheckCircle2, Search, Archive, Inbox
} from 'lucide-react';

interface FeedbackDashboardProps {
  t: any; // Context-provided translation object
}

export function FeedbackDashboard({ t }: FeedbackDashboardProps) {
  // Fetch real-time feed states, handlers, and filters from the admin custom hook
  const {
    logs, hasMore, isLoading, unreadCount,
    filterType, setFilterType, searchQuery, setSearchQuery,
    archiveFeedback, loadMoreItems
  } = useFeedbackAdmin();

  // Target DOM anchor Node for implementing dynamic continuous scroll pagination
  const observerTargetRef = useRef<HTMLDivElement | null>(null);

  /**
   * Section: Intersection Observer for Infinite Scroll
   * Automatically fetches subsequent data pages as the loader element nears view.
   */
  useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreItems();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentTarget = observerTargetRef.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [hasMore, isLoading, loadMoreItems]);

  {/**
   * Section: Initial / Global Loading View
   * Renders a skeleton screen animation framework to maintain layout stability during initial pull.
   */}
  if (isLoading) {
    return (
      <div className="space-y-4 pb-12 text-slate-900 dark:text-slate-50 max-w-6xl mx-auto animate-pulse px-1 sm:px-2">
        <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
        <div className="h-12 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-full" />
        {[1, 2, 3].map((n) => (
          <div key={n} className="p-5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 rounded-xl space-y-3">
            <div className="flex gap-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" />
            </div>
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 text-slate-900 dark:text-slate-100 max-w-6xl mx-auto px-1 sm:px-2">
      
      {/**
       * Section: Dashboard Context Header
       * Declares dashboard contextual status and dynamic badge indicators.
       */}
      <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6 pt-2">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-100 dark:border-blue-900/50 shadow-xs shrink-0">
            <Inbox className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-normal">
              {t.feedbackDashboardSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/**
       * Section: Filtering Toolbar & Search Control
       * Contains stream segment navigation controls matched against asynchronous client queries.
       */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800">
        
        {/* Navigation Tabs */}
        <nav className="flex gap-6 -mb-px" aria-label="Feedback status tabs">
          {(['all', 'archived'] as const).map((filterOpt) => {
            const isActive = filterType === filterOpt;
            const labels = {
              all: t.allFeedbackLabel,
              archived: t.archivedLabel
            };
            const Icons = { all: Inbox, archived: Archive };
            const Icon = Icons[filterOpt];

            return (
              <button
                key={filterOpt}
                type="button"
                onClick={() => setFilterType(filterOpt)}
                className={`pb-3 text-sm font-medium transition-all cursor-pointer flex items-center gap-2 border-b-2 relative ${
                  isActive 
                    ? "border-blue-600 dark:border-blue-500 text-slate-900 dark:text-slate-50 font-semibold" 
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0 opacity-85" />
                <span>{labels[filterOpt]}</span>
              </button>
            );
          })}
        </nav>

        {/* Global Dataset Query Input */}
        <div className="relative flex items-center w-full md:w-72 pb-3 md:pb-2">
          <Search className="absolute left-3 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder || "Search entries..."}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
          />
        </div>
      </div>

      {/**
       * Section: Log Feed Collection
       * Responsible for rendering sequential feedback arrays, user details, and warning matrices.
       */}
      <div className="space-y-3">
        {/* Zero-state execution feedback wrapper */}
        {logs.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 text-sm">
            {t.noFeedbackGeneric}
          </div>
        ) : (
          logs.map((log) => {
            // Identify active submission spikes originating from identical users
            const isSpamming = log.submissionCount && log.submissionCount > 2;

            return (
              <div 
                key={log.feedbackId} 
                className={`bg-white dark:bg-slate-900 border rounded-xl p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 shadow-2xs hover:shadow-xs transition-all ${
                  isSpamming && !log.isArchived 
                    ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/10 dark:bg-amber-950/5' 
                    : 'border-slate-200 dark:border-slate-800/80'
                }`}
              >
                {/* Meta Attributes Panel */}
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                      <User className="w-3.5 h-3.5 text-slate-400" /> {log.fullName || 'Anonymous User'}
                    </span>
                    
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-[11px]">
                      {log.role || 'user'}
                    </span>

                    {log.businessName && log.businessName !== 'N/A' && (
                      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-800/60">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" /> {log.businessName}
                      </span>
                    )}

                    {/* Flood prevention UI trigger */}
                    {isSpamming && !log.isArchived && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-400 border border-amber-200/50 rounded-md font-medium text-[11px]">
                        <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" /> {t.repeatLog}
                      </span>
                    )}
                  </div>

                  {/* Body Content Container */}
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {log.feedback}
                  </p>
                </div>

                {/* Operations & Resolution Triggers */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0 sm:min-w-[140px] pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/60">
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    {new Date(log.receivedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  
                  {!log.isArchived && (
                    <button
                      type="button"
                      onClick={() => archiveFeedback(log.feedbackId)}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 hover:border-emerald-200 dark:hover:border-emerald-800 rounded-xl text-xs font-bold tracking-wider transition-all cursor-pointer shadow-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 active:scale-95"
                      title={t.markAsResolvedArchive}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{t.resolved}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/**
         * Section: Infinite Pagination Loader UI Anchor
         * Acts as the visual state trigger mapped directly to the active Intersection Observer interface.
         */}
        {hasMore && (
          <div 
            ref={observerTargetRef} 
            className="flex py-4 justify-center items-center w-full text-slate-400 dark:text-slate-500 text-xs gap-2 font-medium border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/10"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
            {t.loadingMore}
          </div>
        )}
      </div>
    </div>
  );
}
