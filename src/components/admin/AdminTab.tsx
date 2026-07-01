// src/components/AdminTab.tsx
import React, { useState, useMemo } from 'react';
import AdminControls from './AdminControls';
import Owners from './Owners';
import SalesPersonForm from './SalesPersonForm';
import StaffList from './StaffList';
import BroadcastModal from '../modals/BroadcastModal'; 
import { FeedbackDashboard } from './FeedbackDashboard';  
import { useFeedbackAdmin } from '../../hooks/useFeedbackAdmin';  
import { useNotifications } from '../../core/context/NotificationContext';
import { dbService } from '../../core/services/dbService';
import { 
  MessageSquare, ArrowLeft, Megaphone, UserPlus, 
  Flame, Clock, ShieldOff, AlertTriangle
} from 'lucide-react';

import UserSegmentTable from './UserSegmentTable';
import UserDetailsDialog from './UserDetailsDialog';

interface AdminTabProps {
  currentUser: { id: string; role: string; [key: string]: any } | null;
  shops?: any[];
  users?: any[];
  activeUsers?: any[];    
  newUsers?: any[];        
  inactiveUsers?: any[];  
  selectedShopFilter?: string;
  handleOpenShopModal: (mode: 'create' | 'edit', shop?: any) => void;
  
  // 🛡️ Top-level Custom Handlers
  handleDeleteUser: (id: string) => Promise<void> | void;
  handleBatchDeleteUsers: (ids: string[]) => Promise<void> | void;
  onToggleUserStatusComplete?: () => Promise<void> | void; 
  onTogglePasswordForce?: (user: any) => Promise<void> | void;
  
  salesName: string;
  setSalesName: (val: string) => void;
  salesPhone: string;
  setSalesPhone: (val: string) => void;
  salesEmail: string;
  setSalesEmail: (val: string) => void;
  salesPassword: string;
  setSalesPassword: (val: string) => void;
  handleRegisterSalesperson: (e: React.FormEvent) => void;
  t?: Record<string, any>;
  lang?: string;
  pageSize?: number;
  onPageSizeChange: (size: number) => void;
  onSearchChange: (query: string) => void;
}

export default function AdminTab(props: AdminTabProps) {
  const {
    currentUser, 
    shops = [], 
    users = [],
    activeUsers = [],    
    newUsers = [],        
    inactiveUsers = [],  
    selectedShopFilter = 'all',
    handleOpenShopModal, 
    
    handleDeleteUser,
    handleBatchDeleteUsers, 
    onToggleUserStatusComplete,
    onTogglePasswordForce,
    
    salesName, setSalesName, 
    salesPhone, setSalesPhone,
    salesEmail, setSalesEmail, 
    salesPassword, setSalesPassword,
    handleRegisterSalesperson, 
    t = {}, 
    pageSize = 10,
    onPageSizeChange
  } = props;

  // -----------------------------------------------------------------
  // 1. APPLICATION VIEW & LOCAL STATE TRACKING
  // -----------------------------------------------------------------
  const [activeSubView, setActiveSubView] = useState<'main' | 'feedback'>('main');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  
  // Local overrides for UI optimizations during asynchronous interactions
  const [optimisticOverrides, setOptimisticOverrides] = useState<Record<string, Partial<any>>>({});
  const [locallyDeletedIds, setLocallyDeletedIds] = useState<Set<string>>(new Set());

  const [userSegmentTab, setUserSegmentTab] = useState<'new' | 'active' | 'inactive'>('active');
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<any | null>(null);

  const [pendingBatchDeleteIds, setPendingBatchDeleteIds] = useState<string[] | null>(null);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);

  const [pendingSingleDeleteId, setPendingSingleDeleteId] = useState<string | null>(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);

  const { unreadCount } = useFeedbackAdmin();
  const { sendBroadcast } = useNotifications();

  // -----------------------------------------------------------------
  // 2. SEARCH & STATE COMBINATOR LOGIC (CRITICAL PERFORMANCE FIX)
  // -----------------------------------------------------------------
  const applyOptimisticModifications = (rawList: any[]) => {
    return rawList
      .filter(u => !locallyDeletedIds.has(String(u.id)))
      .map(u => {
        if (optimisticOverrides[u.id]) {
          return { ...u, ...optimisticOverrides[u.id] };
        }
        return u;
      });
  };

  const applySearchFilter = (userList: any[]) => {
    const query = localSearch.toLowerCase().trim();
    if (!query) return userList;

    return userList.filter(u => {
      const name = (u.full_name || u.name || u.displayName || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const phone = (u.identifier || u.phone || '').toLowerCase();
      const business = (u.business_name || u.businessName || u.shop_name || u.shopName || '').toLowerCase();
      const userLocation = (u.location || u.address || '').toLowerCase();
      const role = (u.role || '').toLowerCase();

      const assignedShop = shops.find(s => String(s.id) === String(u.shop_id || u.shopId));
      const assignedShopName = assignedShop ? (assignedShop.name || '').toLowerCase() : '';
      const assignedShopLoc = assignedShop ? (assignedShop.location || assignedShop.address || '').toLowerCase() : '';

      return (
        name.includes(query) || 
        email.includes(query) || 
        phone.includes(query) || 
        business.includes(query) || 
        userLocation.includes(query) ||
        role.includes(query) ||
        assignedShopName.includes(query) ||
        assignedShopLoc.includes(query)
      );
    });
  };

  const categorizedSegments = useMemo(() => {
    return {
      activeUsers: applySearchFilter(applyOptimisticModifications(activeUsers)),
      newUsers: applySearchFilter(applyOptimisticModifications(newUsers)),
      inactiveUsers: applySearchFilter(applyOptimisticModifications(inactiveUsers))
    };
  }, [activeUsers, newUsers, inactiveUsers, localSearch, shops, optimisticOverrides, locallyDeletedIds]);

  const filteredUsers = useMemo(() => {
    return applySearchFilter(applyOptimisticModifications(users));
  }, [users, localSearch, shops, optimisticOverrides, locallyDeletedIds]);

  const localStaffMembers = useMemo(() => {
    return filteredUsers.filter(u => u.role === 'sales' || u.role === 'salesperson');
  }, [filteredUsers]);

  const currentRole = currentUser?.role || "sales";
  const hasAccessToTelemetry = currentRole === 'super_admin';

  // -----------------------------------------------------------------
  // 3. ACTIONS & API COMMITS
  // -----------------------------------------------------------------
  const handleToggleUserStatus = async (user: any) => {
    const newStatus = !user.approved;
    
    setOptimisticOverrides(prev => ({
      ...prev,
      [user.id]: { ...prev[user.id], approved: newStatus }
    }));

    try {
      await dbService.updateUserApproval(user.id, newStatus);
      if (onToggleUserStatusComplete) {
        await onToggleUserStatusComplete();
      }
    } catch (err) {
      console.error("State modification execution failure:", err);
      setOptimisticOverrides(prev => {
        const updated = { ...prev };
        if (updated[user.id]) {
          updated[user.id].approved = user.approved;
        }
        return updated;
      });
    }
  };

  const handleTogglePasswordForceLocal = async (user: any) => {
    const currentFlag = !!(user.must_change_password || user.mustChangePassword);
    const targetFlag = !currentFlag;

    setOptimisticOverrides(prev => ({
      ...prev,
      [user.id]: { 
        ...prev[user.id], 
        must_change_password: targetFlag, 
        mustChangePassword: targetFlag 
      }
    }));

    try {
      if (onTogglePasswordForce) {
        await onTogglePasswordForce(user);
      } else {
        await dbService.updateUserPasswordPermission(user.id, targetFlag);
      }
      if (onToggleUserStatusComplete) {
        await onToggleUserStatusComplete();
      }
    } catch (err) {
      console.error("Failed to commit modern password flag status:", err);
      setOptimisticOverrides(prev => {
        const updated = { ...prev };
        if (updated[user.id]) {
          updated[user.id].must_change_password = currentFlag;
          updated[user.id].mustChangePassword = currentFlag;
        }
        return updated;
      });
    }
  };

  const handleInitiateSingleDelete = (id: string) => {
    setPendingSingleDeleteId(id);
  };

  const handleConfirmSingleDelete = async () => {
    if (!pendingSingleDeleteId) return;
    setIsDeletingSingle(true);
    
    const idToWipe = pendingSingleDeleteId;
    setLocallyDeletedIds(prev => {
      const next = new Set(prev);
      next.add(String(idToWipe));
      return next;
    });

    try {
      if (handleDeleteUser) {
        await handleDeleteUser(idToWipe);
      }
    } catch (err) {
      console.error("Single deletion failure:", err);
      setLocallyDeletedIds(prev => {
        const next = new Set(prev);
        next.delete(String(idToWipe));
        return next;
      });
    } finally {
      setIsDeletingSingle(false);
      setPendingSingleDeleteId(null);
    }
  };

  const handleInitiateBatchDelete = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    setPendingBatchDeleteIds(ids.map(id => String(id)));
  };

  const handleConfirmBatchDelete = async () => {
    if (!pendingBatchDeleteIds) return;
    setIsDeletingBatch(true);
    
    const idsToWipe = [...pendingBatchDeleteIds];
    setLocallyDeletedIds(prev => {
      const next = new Set(prev);
      idsToWipe.forEach(id => next.add(String(id)));
      return next;
    });

    try {
      if (handleBatchDeleteUsers) {
        await handleBatchDeleteUsers(idsToWipe);
      }
    } catch (err) {
      console.error("Batch deletion failure:", err);
      setLocallyDeletedIds(prev => {
        const next = new Set(prev);
        idsToWipe.forEach(id => next.delete(String(id)));
        return next;
      });
    } finally {
      setIsDeletingBatch(false);
      setPendingBatchDeleteIds(null);
    }
  };

  if (activeSubView === 'feedback' && hasAccessToTelemetry) {
    return (
      <div 
        className="space-y-5 pb-2 text-slate-700 dark:text-slate-200 antialiased w-full p-0 m-0"
        style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}
      >
        <button
          onClick={() => setActiveSubView('main')}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/80 transition-all cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToAdminDesk}
        </button>
        <FeedbackDashboard t={t} />
      </div>
    );
  }

  return (
    <div 
      className="space-y-5 pb-2 text-slate-700 dark:text-slate-200 antialiased w-full p-0 m-0"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}
    >
      
      {/* HEADER ACTIONS PANEL */}
      {(currentRole === "super_admin" || currentRole === "admin") && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl transition-colors duration-150">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-widest">
              {currentRole === "super_admin" 
                ? (t.systemControlMatrix || 'System Control Matrix') 
                : (t.branchControlDesk)
              }
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
              {currentRole === "super_admin" 
                ? (t.adjustTenantStates) 
                : (t.manageLocalStaff)
              }
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {currentRole === 'admin' && (
              <button 
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-xl text-xs font-bold tracking-wider transition-all active:scale-95 cursor-pointer"
                style={{ backgroundColor: '#1a5fb4' }}
              >
                <UserPlus className="w-4 h-4" />
                <span>{t.registerSalesperson}</span>
              </button>
            )}

            {currentRole === "super_admin" && (
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-xl text-xs font-bold tracking-wider transition-all bg-amber-600 hover:bg-amber-700 active:scale-95 cursor-pointer"
              >
                <Megaphone className="w-4 h-4" />
                <span>{t.sendBroadcast}</span>
              </button>
            )}

            {currentRole === "super_admin" && hasAccessToTelemetry && (
              <button
                type="button"
                onClick={() => setActiveSubView('feedback')}
                className="relative flex items-center justify-center gap-2.5 px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/80 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 tracking-wider transition-all cursor-pointer active:scale-95"
              >
                <MessageSquare className="w-4 h-4" style={{ color: '#1a5fb4' }} />
                <span>{t.feedback}</span>
                
                {unreadCount > 0 && (
                  <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-black text-white bg-rose-500 dark:bg-rose-600 rounded-full shadow-sm shadow-rose-500/20 animate-in fade-in zoom-in-75 duration-200 tabular-nums">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* SEARCH AND CONTROLS */}
      <AdminControls
        localSearch={localSearch}
        setLocalSearch={setLocalSearch}
        pageSize={pageSize}
        onPageSizeChange={onPageSizeChange}
        t={t}
      />

      {/* SUPER ADMIN SEGMENT VIEW */}
      {currentRole === "super_admin" && (
        <div className="space-y-5 transition-all duration-300">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2">
            <button
              type="button"
              onClick={() => setUserSegmentTab('active')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${userSegmentTab === 'active' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200/50' : 'text-slate-400'}`}
            >
              <Flame className="w-3.5 h-3.5" />
              {t.active} ({categorizedSegments.activeUsers.length})
            </button>
            <button
              type="button"
              onClick={() => setUserSegmentTab('new')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${userSegmentTab === 'new' ? 'bg-blue-50 dark:bg-blue-950/40 text-[#1a5fb4]' : 'text-slate-400'}`}
            >
              <Clock className="w-3.5 h-3.5" />
              {t.new } ({categorizedSegments.newUsers.length})
            </button>
            <button
              type="button"
              onClick={() => setUserSegmentTab('inactive')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${userSegmentTab === 'inactive' ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200/50' : 'text-slate-400'}`}
            >
              <ShieldOff className="w-3.5 h-3.5" />
              {t.dormant} ({categorizedSegments.inactiveUsers.length})
            </button>
          </div>

          <div className="transition-all duration-200">
            {userSegmentTab === 'active' && (
              <UserSegmentTable 
                users={categorizedSegments.activeUsers}
                type="active"
                onToggleStatus={handleToggleUserStatus}
                onTogglePasswordForce={handleTogglePasswordForceLocal}
                onDeleteSingle={handleInitiateSingleDelete}
                onDeleteMultiple={handleInitiateBatchDelete}
                onViewDetails={(u: any) => {
                  const shopId = u.shop_id || u.shopId;
                  const userShop = shops.find(s => String(s.id) === String(shopId));
                  setSelectedUserForDetails({
                    ...u,
                    business_name: userShop ? userShop.name : (u.business_name || u.businessName || ''),
                    location: userShop ? (userShop.location || userShop.address) : (u.location || '')
                  });
                }}
                t={t}
              />
            )}
            {userSegmentTab === 'new' && (
              <UserSegmentTable 
                users={categorizedSegments.newUsers}
                type="new"
                onToggleStatus={handleToggleUserStatus}
                onTogglePasswordForce={handleTogglePasswordForceLocal}
                onDeleteSingle={handleInitiateSingleDelete}
                onDeleteMultiple={handleInitiateBatchDelete}
                onViewDetails={(u: any) => {
                  const shopId = u.shop_id || u.shopId;
                  const userShop = shops.find(s => String(s.id) === String(shopId));
                  setSelectedUserForDetails({
                    ...u,
                    business_name: userShop ? userShop.name : (u.business_name || u.businessName || ''),
                    location: userShop ? (userShop.location || userShop.address) : (u.location || '')
                  });
                }}
                t={t}
              />
            )}
            {userSegmentTab === 'inactive' && (
              <UserSegmentTable 
                users={categorizedSegments.inactiveUsers}
                type="inactive"
                onToggleStatus={handleToggleUserStatus}
                onTogglePasswordForce={handleTogglePasswordForceLocal}
                onDeleteSingle={handleInitiateSingleDelete}
                onDeleteMultiple={handleInitiateBatchDelete}
                onViewDetails={(u: any) => {
                  const shopId = u.shop_id || u.shopId;
                  const userShop = shops.find(s => String(s.id) === String(shopId));
                  setSelectedUserForDetails({
                    ...u,
                    business_name: userShop ? userShop.name : (u.business_name || u.businessName || ''),
                    location: userShop ? (userShop.location || userShop.address) : (u.location || '')
                  });
                }}
                t={t}
              />
            )}
          </div>
        </div>
      )}

      {/* SHOP OWNER (ADMIN) VIEW */}
      {currentRole === 'admin' && (
        <div className="flex flex-col gap-5 transition-all duration-300">
          <SalesPersonForm
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            salesName={salesName}
            setSalesName={setSalesName}
            salesPhone={salesPhone}
            setSalesPhone={setSalesPhone}
            salesEmail={salesEmail}
            setSalesEmail={setSalesEmail}
            salesPassword={salesPassword}
            setSalesPassword={setSalesPassword}
            handleRegisterSalesperson={handleRegisterSalesperson}
            t={t}
          />
          
          <StaffList 
            users={localStaffMembers || []}
            currentUser={currentUser} 
            selectedShopFilter={selectedShopFilter} 
            onToggleStatus={handleToggleUserStatus}
            t={t} 
            {...({ triggerDeleteConfirm: handleInitiateSingleDelete } as any)}
          />
        </div>
      )}

      {/* MODALS & DIALOGS COMPONENTS */}
      <BroadcastModal 
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        onSendBroadcast={sendBroadcast}
        t={t}
      />

      {selectedUserForDetails && (
        <UserDetailsDialog 
          user={selectedUserForDetails}
          isOpen={!!selectedUserForDetails}
          onClose={() => setSelectedUserForDetails(null)}
          onToggleStatus={handleToggleUserStatus}
          t={t}
        />
      )}

      {/* SINGLE USER DELETION CONFIRMATION DIALOG */}
      {pendingSingleDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-wider">
                  {t.confirmDeletionTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {t.deleteAccountInfo}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingSingle}
                onClick={() => setPendingSingleDeleteId(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 border border-slate-200/40 dark:border-slate-700/60 rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {t.cancelBtn || "አንሳ"}
              </button>
              <button
                type="button"
                disabled={isDeletingSingle}
                onClick={handleConfirmSingleDelete}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-lg shadow-rose-600/10 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isDeletingSingle && (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span>{t.deleteAccount}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH DELETION CONFIRMATION DIALOG */}
      {pendingBatchDeleteIds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-wider">
                  {t.batchDeleteInactive}
                </h3>
                <p 
                  className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: t.wipeOut ? t.wipeOut(pendingBatchDeleteIds.length) : `${pendingBatchDeleteIds.length} አካውንቶችን ያጥፉ` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingBatch}
                onClick={() => setPendingBatchDeleteIds(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 border border-slate-200/40 dark:border-slate-700/60 rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                disabled={isDeletingBatch}
                onClick={handleConfirmBatchDelete}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-lg shadow-rose-600/10 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isDeletingBatch && (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span>{t.wipeSelected}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
