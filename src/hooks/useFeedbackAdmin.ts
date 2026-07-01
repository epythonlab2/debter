// src/hooks/useFeedbackAdmin.ts
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../utils/supabaseClient';
import { dbService } from '../core/services/dbService';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface AdminFeedbackLog {
  feedbackId: string;
  userId: string | null;
  fullName: string | null;
  businessName: string | null;
  role: string | null;
  feedback: string;
  receivedAt: string;
  isArchived: boolean;
  submissionCount?: number;
}

// Global singletons to share a single Supabase channel connection across multiple component instances
let globalFeedbackChannel: RealtimeChannel | null = null;
const globalCallbacks = new Set<() => void>();

export function useFeedbackAdmin() {
  // State buckets for managing pagination and performance
  const [allLogs, setAllLogs] = useState<AdminFeedbackLog[]>([]);
  const [displayedLogs, setDisplayedLogs] = useState<AdminFeedbackLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  
  // Filtering and Searching parameters
  const [filterType, setFilterType] = useState<'all' | 'repeaters' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const ITEMS_PER_PAGE = 10;
  const pageRef = useRef<number>(1);
  const isMounted = useRef<boolean>(true);

  /**
   * Evaluates user behavior frequency patterns based on total systemic records.
   * Calculates how many times a unique user has submitted feedback entries.
   */
  const processFeedbackMetrics = useCallback((rawLogs: AdminFeedbackLog[]): AdminFeedbackLog[] => {
    const userFrequencyMap = rawLogs.reduce((acc: Record<string, number>, curr) => {
      if (curr.userId) {
        acc[curr.userId] = (acc[curr.userId] || 0) + 1;
      }
      return acc;
    }, {});

    return rawLogs.map(log => ({
      ...log,
      submissionCount: log.userId ? userFrequencyMap[log.userId] : 1
    }));
  }, []);

  /**
   * Computes filtered and queried data sets safely in memory before applying pagination loops.
   */
  const filteredAndSearchedLogs = useMemo(() => {
    const lowerQuery = searchQuery.trim().toLowerCase();

    return allLogs.filter(log => {
      const matchesSearch = !lowerQuery ||
        (log.fullName?.toLowerCase() || '').includes(lowerQuery) ||
        (log.feedback?.toLowerCase() || '').includes(lowerQuery) ||
        (log.businessName?.toLowerCase() || '').includes(lowerQuery);
      
      if (!matchesSearch) return false;
      if (filterType === 'archived') return log.isArchived === true;
      if (log.isArchived === true) return false;
      if (filterType === 'repeaters') return !!log.submissionCount && log.submissionCount > 2;
      
      return true;
    });
  }, [allLogs, filterType, searchQuery]);

  /**
   * Fetches full administration audit data logs from persistence layer.
   * @param isBackground - If true, performs a silent background fetch without showing the global loader
   */
  const fetchLogs = useCallback(async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      const data = await dbService.fetchUserFeedbackLogs();
      if (!isMounted.current) return;

      const processedLogs = processFeedbackMetrics((data || []) as AdminFeedbackLog[]);
      setAllLogs(processedLogs);

      // Calculates initial notification quantities from active datastore data sets
      if (!isBackground) {
        const initialUnread = processedLogs.filter(log => !log.isArchived).length;
        setUnreadCount(initialUnread);
      }
    } catch (err) {
      console.error("Failed fetching admin logs within custom hook:", err);
    } finally {
      if (isMounted.current && !isBackground) {
        setIsLoading(false);
      }
    }
  }, [processFeedbackMetrics]);

  // Sync current fetch references to shield asynchronous processing closures from stale state data
  const fetchLogsRef = useRef(fetchLogs);
  useEffect(() => {
    fetchLogsRef.current = fetchLogs;
  }, [fetchLogs]);

  /**
   * Appends the next segment of memory logs to the displayed user workspace array view.
   */
  const loadMoreItems = useCallback(() => {
    if (isFetchingMore || displayedLogs.length >= filteredAndSearchedLogs.length) return;
    
    setIsFetchingMore(true);
    
    // Tiny processing macro-task separation to smooth UI frame drop risks during heavy filtering shifts
    const timer = setTimeout(() => {
      if (!isMounted.current) return;
      const nextPage = pageRef.current + 1;
      const newSlice = filteredAndSearchedLogs.slice(0, nextPage * ITEMS_PER_PAGE);
      setDisplayedLogs(newSlice);
      pageRef.current = nextPage;
      setIsFetchingMore(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [isFetchingMore, displayedLogs.length, filteredAndSearchedLogs]);

  /**
   * Optimistically updates systemic records and syncs with datastore mutations.
   */
  const archiveFeedback = useCallback(async (feedbackId: string) => {
    // Optimistic UI updates
    setAllLogs(prev => 
      prev.map(log => log.feedbackId === feedbackId ? { ...log, isArchived: true } : log)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await dbService.archiveUserFeedback(feedbackId);
    } catch (err) {
      console.error("Failed executing archive mutation parameters:", err);
      // Revert logic loop safely triggerable via baseline hard refresh
      fetchLogsRef.current(true); 
    }
  }, []);

  /**
   * Component mount and realtime channel tracking engine configuration.
   */
  useEffect(() => {
    isMounted.current = true;
    fetchLogsRef.current(false);

    const handleInsertNotification = () => {
      setUnreadCount(prev => prev + 1);
      fetchLogsRef.current(true);
    };

    globalCallbacks.add(handleInsertNotification);

    // Singleton implementation to guard WebSocket channels against connection overflow
    if (!globalFeedbackChannel) {
      globalFeedbackChannel = supabase
        .channel('shared-admin-feedback-stream')
        .on(
          'postgres_changes', 
          { event: 'INSERT', table: 'feedback', schema: 'public' }, 
          () => {
            globalCallbacks.forEach(cb => cb());
          }
        )
        .subscribe();
    }

    return () => {
      isMounted.current = false;
      globalCallbacks.delete(handleInsertNotification);
      
      if (globalCallbacks.size === 0 && globalFeedbackChannel) {
        supabase.removeChannel(globalFeedbackChannel);
        globalFeedbackChannel = null;
      }
    };
  }, []);

  /**
   * Synchronizes user filter application changes with visual view arrays.
   */
  useEffect(() => {
    pageRef.current = 1;
    setDisplayedLogs(filteredAndSearchedLogs.slice(0, ITEMS_PER_PAGE));
  }, [filteredAndSearchedLogs]);

  return {
    logs: displayedLogs,
    hasMore: displayedLogs.length < filteredAndSearchedLogs.length,
    isLoading,
    isFetchingMore,
    unreadCount,
    filterType,
    setFilterType,
    searchQuery,
    setSearchQuery,
    archiveFeedback,
    clearNotifications: () => setUnreadCount(0),
    loadMoreItems,
    totalCount: filteredAndSearchedLogs.length
  };
}
