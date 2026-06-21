// src/hooks/useFeedback.ts
import { useState, useCallback } from 'react';
import { dbService } from '../core/services/dbService';

interface FeedbackLog {
  feedbackId: string;
  userId: string | null;
  fullName: string | null;
  businessName: string | null;
  role: string | null;
  feedback: string;
  receivedAt: string;
}

interface UseFeedbackOptions {
  currentUser?: { id: string } | null;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export function useFeedback(options?: UseFeedbackOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [feedbackLogs, setFeedbackLogs] = useState<FeedbackLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Submits a fresh feedback comment linked to the current user profile
   */
  const submitFeedback = async (comment: string) => {
    if (!comment.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setIsSuccess(false);

    try {
      await dbService.submitFeedback(comment, options?.currentUser?.id);
      setIsSuccess(true);
      options?.onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Database write operation failed';
      setError(errorMessage);
      options?.onError?.(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Fetches full feedback log profiles from the view layer (For Admin Views)
   */
  const fetchFeedbackLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    setError(null);
    try {
      const logs = await dbService.fetchUserFeedbackLogs();
      setFeedbackLogs(logs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retrieve view records';
      setError(errorMessage);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  const resetFeedbackState = () => {
    setIsSuccess(false);
    setError(null);
  };

  return {
    submitFeedback,
    fetchFeedbackLogs,
    feedbackLogs,
    isSubmitting,
    isSuccess,
    isLoadingLogs,
    error,
    resetFeedbackState,
  };
}
