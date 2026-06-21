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

let globalFeedbackChannel: RealtimeChannel | null = null;
const globalCallbacks = new Set<() => void>();

export function useFeedbackAdmin() {
  const [allLogs, setAllLogs] = useState<AdminFeedbackLog[]>([]);
  const [displayedLogs, setDisplayedLogs] = useState<AdminFeedbackLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const [filterType, setFilterType] = useState<'all' | 'repeaters' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const ITEMS_PER_PAGE = 10;
  const pageRef = useRef(1);

  const processFeedbackMetrics = useCallback((rawLogs: any[]) => {
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

  // Compute filters safely above pagination hooks to protect your temporal layout states
  const filteredAndSearchedLogs = useMemo(() => {
    return allLogs.filter(log => {
      const matchesSearch = 
        (log.fullName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (log.feedback?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (log.businessName?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;
      if (filterType === 'archived') return log.isArchived === true;
      if (log.isArchived === true) return false;
      if (filterType === 'repeaters') return log.submissionCount && log.submissionCount > 2;
      
      return true;
    });
  }, [allLogs, filterType, searchQuery]);

  const fetchLogs = useCallback(async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      const data = await dbService.fetchUserFeedbackLogs();
      setAllLogs(processFeedbackMetrics(data as AdminFeedbackLog[]));
    } catch (err) {
      console.error("Failed fetching admin logs:", err);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  }, [processFeedbackMetrics]);

  const fetchLogsRef = useRef(fetchLogs);
  useEffect(() => {
    fetchLogsRef.current = fetchLogs;
  }, [fetchLogs]);

  const loadMoreItems = useCallback(() => {
    if (isFetchingMore || displayedLogs.length >= filteredAndSearchedLogs.length) return;
    
    setIsFetchingMore(true);
    setTimeout(() => {
      const nextPage = pageRef.current + 1;
      const newSlice = filteredAndSearchedLogs.slice(0, nextPage * ITEMS_PER_PAGE);
      setDisplayedLogs(newSlice);
      pageRef.current = nextPage;
      setIsFetchingMore(false);
    }, 200);
  }, [isFetchingMore, displayedLogs.length, filteredAndSearchedLogs]);

  const archiveFeedback = useCallback(async (feedbackId: string) => {
    // Optimistic UI update
    setAllLogs(prev => 
      prev.map(log => log.feedbackId === feedbackId ? { ...log, isArchived: true } : log)
    );
    try {
      await dbService.archiveUserFeedback(feedbackId);
    } catch (err) {
      console.error("Failed executing archive mutation parameters:", err);
      fetchLogsRef.current(true); 
    }
  }, []);

  useEffect(() => {
    fetchLogsRef.current(false);

    const handleInsertNotification = () => {
      setUnreadCount(prev => prev + 1);
      fetchLogsRef.current(true);
    };

    globalCallbacks.add(handleInsertNotification);

    if (!globalFeedbackChannel) {
      globalFeedbackChannel = supabase
        .channel('shared-admin-feedback-stream')
        .on('postgres_changes', { event: 'INSERT', table: 'feedback', schema: 'public' }, () => {
          globalCallbacks.forEach(cb => cb());
        })
        .subscribe();
    }

    return () => {
      globalCallbacks.delete(handleInsertNotification);
      if (globalCallbacks.size === 0 && globalFeedbackChannel) {
        supabase.removeChannel(globalFeedbackChannel);
        globalFeedbackChannel = null;
      }
    };
  }, []);

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
