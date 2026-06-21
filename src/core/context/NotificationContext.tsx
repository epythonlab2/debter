// src/core/context/NotificationContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { supabase } from '../../utils/supabaseClient';

// 1. Updated Interface to include sendBroadcast signature

interface NotificationContextType {
  activeBroadcast: any;
  clearBroadcast: () => void;
  sendBroadcast: (payload: { message: string; severity: 'info' | 'warning' | 'critical'; createdAt: string }) => Promise<any[] | null>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [activeBroadcast, setActiveBroadcast] = useState<any>(null);

  useEffect(() => {
    // 1. HYDRATION PHASE: Fetch the absolute latest broadcast from the database right on mount
    const fetchLatestBroadcast = async () => {
      const { data, error } = await supabase
        .from('global_broadcasts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const record = data[0];
        
        // Only show it if the user hasn't explicitly dismissed this specific alert ID before
        const isDismissed = localStorage.getItem(`dismissed_broadcast_${record.id}`);
        if (!isDismissed) {
          setActiveBroadcast({
            id: String(record.id),
            message: record.message,
            severity: record.severity,
            createdAt: record.created_at,
          });
        }
      }
    };

    fetchLatestBroadcast();

    // 2. REAL-TIME PHASE: Listen for any live forms submitted while the user has the page open
    const unsubscribe = dbService.subscribeToGlobalBroadcasts((newBroadcast) => {
      setActiveBroadcast(newBroadcast);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const clearBroadcast = () => {
    setActiveBroadcast(null);
  };

  // 2. ADD THE MISSING FUNCTION HERE: Handles saving the data to Supabase
  const sendBroadcast = async (payload: { message: string; severity: 'info' | 'warning' | 'critical'; createdAt: string }) => {
    const { data, error } = await supabase
      .from('global_broadcasts')
      .insert([
        {
          message: payload.message,
          severity: payload.severity,
          created_at: payload.createdAt
        }
      ])
      .select();

    if (error) {
      throw error;
    }
    
    return data;
  };

  return (
    // 3. Now passing the newly defined function safely!
    <NotificationContext.Provider value={{ activeBroadcast, clearBroadcast, sendBroadcast }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
