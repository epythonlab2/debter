// src/hooks/useAdmin.ts
import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface UserActivityCohort {
  user_id: string;
  full_name: string;
  identifier: string; 
  role: 'super_admin' | 'admin' | 'sales';
  shop_id: string | null;
  shop_name: string | null;
  shop_location: string | null; 
  approved: boolean;
  registration_date: string; 
  total_sales_count: number;
  total_sales_volume: number;
  last_sale_timestamp: string | null;
  activity_status: 'active' | 'inactive' | 'new';
  created_at?: string; 
  must_change_password?: boolean; 
}

interface UseAdminProps {
  currentUser: any;
  selectedShopFilter: string;
  syncCloudDatabases: () => Promise<void>;
  triggerToast: (message: string, type?: 'success' | 'error') => void;
  t: any;
}

export function useAdmin({
  currentUser,
  selectedShopFilter,
  syncCloudDatabases,
  triggerToast,
  t,
}: UseAdminProps) {
  const [cohortsRawData, setCohortsRawData] = useState<UserActivityCohort[]>([]);
  const [isLoadingCohorts, setIsLoadingCohorts] = useState<boolean>(false);

  const syncCohortsView = useCallback(async () => {
    if (!currentUser) return;
    if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') return;
    
    setIsLoadingCohorts(true);
    try {
      let query = supabase.from('view_shop_user_analytics').select('*');

      const targetShop = currentUser.role === 'super_admin'
        ? selectedShopFilter
        : currentUser.shop_id;

      if (targetShop && targetShop !== 'all') {
        query = query.eq('shop_id', targetShop);
      }

      const { data, error } = await query;
      if (error) throw error;

      setCohortsRawData((data as UserActivityCohort[]) || []);
    } catch (err: any) {
      console.error("Failed to fetch operational cohort metrics:", err);
    } finally {
      setIsLoadingCohorts(false);
    }
  }, [currentUser, selectedShopFilter]);

  useEffect(() => {
    syncCohortsView();
  }, [syncCohortsView]);

  const integratedUsersList = useMemo(() => {
    return cohortsRawData.map(cohort => ({
      ...cohort,
      id: cohort.user_id, 
      name: cohort.full_name,
      phone: cohort.identifier,
      created_at: cohort.registration_date, 
      business_name: cohort.shop_name || '', 
      location: cohort.shop_location || '', 
      must_change_password: cohort.must_change_password ?? false,
      metrics: {
        lastActiveTimestamp: cohort.last_sale_timestamp,
        weeklySalesCount: cohort.total_sales_count,
        weeklySalesSum: cohort.total_sales_volume
      }
    }));
  }, [cohortsRawData]);

  const separatedCohorts = useMemo(() => {
    return {
      activeUsers: integratedUsersList.filter(u => u.activity_status === 'active' && u.approved),
      newUsers: integratedUsersList.filter(u => u.activity_status === 'new' && u.approved),
      inactiveUsers: integratedUsersList.filter(u => u.activity_status === 'inactive' || !u.approved),
    };
  }, [integratedUsersList]);

  // 1. New Status Toggle Mutation (Approved / Suspended)
  const handleToggleUserStatus = useCallback(async (user: any) => {
    const targetId = user.id || user.user_id;
    const nextApprovedState = !user.approved;

    // Optimistic UI Update
    setCohortsRawData(prev => 
      prev.map(c => c.user_id === targetId ? { ...c, approved: nextApprovedState } : c)
    );

    try {
      // Must hit the base 'users' table because 'view_shop_user_analytics' is read-only
      const { error } = await supabase
        .from('users')
        .update({ approved: nextApprovedState })
        .eq('id', targetId);

      if (error) throw error;

      triggerToast(t.statusUpdated || "User status updated successfully", "success");
      
      await Promise.all([syncCloudDatabases(), syncCohortsView()]);
    } catch (err: any) {
      console.error("Failed to toggle status flag:", err);
      triggerToast(err.message || "Failed to alter account approval status", "error");
      syncCohortsView(); // Rollback local state using DB values
    }
  }, [syncCloudDatabases, syncCohortsView, triggerToast, t]);

  // 2. New Password Reset Requirement Toggle Mutation
  const handleTogglePasswordForce = useCallback(async (user: any) => {
    const targetId = user.id || user.user_id;
    const nextForceState = !user.must_change_password;

    // Optimistic UI Update
    setCohortsRawData(prev => 
      prev.map(c => c.user_id === targetId ? { ...c, must_change_password: nextForceState } : c)
    );

    try {
      const { error } = await supabase
        .from('users')
        .update({ must_change_password: nextForceState })
        .eq('id', targetId);

      if (error) throw error;

      triggerToast(t.passwordPolicyUpdated || "Password reset policy configured", "success");
      
      await Promise.all([syncCloudDatabases(), syncCohortsView()]);
    } catch (err: any) {
      console.error("Failed to toggle password control layer:", err);
      triggerToast(err.message || "Failed to update security directives", "error");
      syncCohortsView(); // Rollback local state using DB values
    }
  }, [syncCloudDatabases, syncCohortsView, triggerToast, t]);
  
  const handleRegisterSalesperson = useCallback(async (e: React.FormEvent, forms: any) => {
    e.preventDefault();
    if (!currentUser) return;

    const currentName = (forms.salesName || '').trim();
    const currentPhone = (forms.salesPhone || '').trim();
    const currentPassword = (forms.salesPassword || '').trim();
    const currentEmail = (forms.salesEmail || '').trim();

    if (!currentName) {
      triggerToast("Full name is required.", "error");
      return;
    }

    const targetShopId = currentUser.role === 'super_admin'
      ? (selectedShopFilter !== 'all' ? selectedShopFilter : null)
      : currentUser.shop_id;

    if (!targetShopId && currentUser.role === 'super_admin') {
      triggerToast("Super Admins must select a specific shop.", "error");
      return;
    }

    const isoNow = new Date().toISOString();
    const fallbackGeneratedId = `usr-${Date.now()}`;

    const optimisticCohortRecord: UserActivityCohort = {
      user_id: fallbackGeneratedId,
      full_name: currentName,
      identifier: currentPhone || `09${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: 'sales',
      shop_id: targetShopId,
      shop_name: null, 
      shop_location: null, 
      approved: true,
      registration_date: isoNow,
      total_sales_count: 0,
      total_sales_volume: 0,
      last_sale_timestamp: null,
      activity_status: 'new',
      must_change_password: false
    };

    try {
      setCohortsRawData(prev => [optimisticCohortRecord, ...prev]);

      const dbPayload = {
        id: optimisticCohortRecord.user_id,
        full_name: optimisticCohortRecord.full_name,
        identifier: optimisticCohortRecord.identifier,
        password: currentPassword || '123456',
        email: currentEmail || null,
        role: optimisticCohortRecord.role,
        shop_id: optimisticCohortRecord.shop_id || null,
        approved: optimisticCohortRecord.approved,
        created_by: currentUser.id,
        created_at: isoNow,
        must_change_password: false
      };

      const { error: insertError } = await supabase.from('users').insert([dbPayload]);
      if (insertError) throw insertError;

      triggerToast(t.salesPersonRegistered || "Registered successfully", "success");

      if (forms.setSalesName) forms.setSalesName('');
      if (forms.setSalesPhone) forms.setSalesPhone('');
      if (forms.setSalesPassword) forms.setSalesPassword('');
      if (forms.setSalesEmail) forms.setSalesEmail('');

      await Promise.all([
        syncCloudDatabases(),
        syncCohortsView()
      ]);
    } catch (err: any) {
      console.error("Staff Registration Failure:", err);
      setCohortsRawData(prev => prev.filter(u => u.user_id !== optimisticCohortRecord.user_id));
      triggerToast(err.message || "Failed to register profile", "error");
    }
  }, [currentUser, selectedShopFilter, triggerToast, syncCloudDatabases, syncCohortsView, t]);

  const handleDeleteUser = useCallback(async (userId: string) => {
    try {
      setCohortsRawData(prev => prev.filter(cohort => cohort.user_id !== userId));

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      triggerToast(t.accountDeletSuccess || "Account deleted successfully", "success");
      
      await Promise.all([
        syncCloudDatabases(),
        syncCohortsView()
      ]);
    } catch (err: any) {
      console.error("Single user delete operation failed:", err);
      triggerToast(err.message || "Failed to execute database delete operation", "error");
      syncCohortsView();
    }
  }, [syncCloudDatabases, syncCohortsView, triggerToast, t]);

  const handleBatchDeleteUsers = useCallback(async (userIds: string[]) => {
    if (!userIds || userIds.length === 0) return;
    
    try {
      setCohortsRawData(prev => prev.filter(cohort => !userIds.includes(cohort.user_id)));

      const { error } = await supabase
        .from('users')
        .delete()
        .in('id', userIds);

      if (error) throw error;

      const successMsg = typeof t.accountWiped === 'function' 
        ? t.accountWiped(userIds.length) 
        : `Successfully deleted ${userIds.length} accounts`;
        
      triggerToast(successMsg, "success");

      await Promise.all([
        syncCloudDatabases(),
        syncCohortsView()
      ]);
    } catch (err: any) {
      console.error("Multi-tenant batch cleanup crash context:", err);
      triggerToast(err.message || "Failed to delete batch records", "error");
      syncCohortsView();
    }
  }, [syncCloudDatabases, syncCohortsView, triggerToast, t]);

  return {
    users: integratedUsersList, 
    cohortsRawData,
    isLoadingCohorts,
    syncCohortsView,
    ...separatedCohorts,
    handleRegisterSalesperson,
    handleDeleteUser,
    handleBatchDeleteUsers,
    handleToggleUserStatus,       // Ensure these are returned to the UI component
    handleTogglePasswordForce     // Ensure these are returned to the UI component
  };
}
