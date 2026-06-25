// src/components/AdminTab.tsx
import React, { useState, useEffect, useMemo } from 'react';
import AdminControls from './AdminControls';
import ShopManagement from './ShopManagement';
import Owners from './Owners';
import SalesPersonForm from './SalesPersonForm';
import StaffList from './StaffList';
import BroadcastModal from '../modals/BroadcastModal'; 
import { FeedbackDashboard } from './FeedbackDashboard';  
import { useFeedbackAdmin } from '../../hooks/useFeedbackAdmin';  
import { dbService } from '../../core/services/dbService';
import { useNotifications } from '../../core/context/NotificationContext';
import { MessageSquare, ArrowLeft, Megaphone, UserPlus, Store, ShieldAlert, Users, Calendar, Mail, Phone, Check, X, Building } from 'lucide-react';

interface AdminTabProps {
  currentUser: { id: string; role: string; [key: string]: any } | null;
  shops?: any[];
  users?: any[];
  selectedShopFilter?: string;
  handleOpenShopModal: (mode: 'create' | 'edit', shop?: any) => void;
  triggerDeleteConfirm: (type: 'user' | 'shop' | 'item' | 'sale', id: string) => void;
  handleApproveOwner?: (id: string, approved: boolean) => Promise<void> | void;
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
    selectedShopFilter = 'all',
    handleOpenShopModal, 
    triggerDeleteConfirm, 
    salesName, setSalesName, 
    salesPhone, setSalesPhone,
    salesEmail, setSalesEmail, 
    salesPassword, setSalesPassword,
    handleRegisterSalesperson, 
    t = {}, 
    lang,
    pageSize = 10,
    onPageSizeChange, 
    onSearchChange
  } = props;

  // -----------------------------------------------------------------
  // 1. APPLICATION VIEW & LOCAL STATE TRACKING
  // -----------------------------------------------------------------
  const [activeSubView, setActiveSubView] = useState<'main' | 'feedback'>('main');
  const [superTab, setSuperTab] = useState<'shops' | 'pending' | 'approved'>('shops');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [localUsers, setLocalUsers] = useState(users);

  const { unreadCount } = useFeedbackAdmin();
  const { sendBroadcast } = useNotifications();

  // -----------------------------------------------------------------
  // 2. LIFECYCLE SYNC EFFECTS & LOCAL MEMO FILTERING
  // -----------------------------------------------------------------
  useEffect(() => {
    setLocalUsers(prevLocal => {
      return users.map(incomingUser => {
        const matchingLocal = prevLocal.find(u => u.id === incomingUser.id);
        if (matchingLocal) {
          return { 
            ...incomingUser, 
            approved: matchingLocal.approved,
            onChangePassword: matchingLocal.onChangePassword
          };
        }
        return incomingUser;
      });
    });
  }, [users]);

  const filteredShops = useMemo(() => {
    const query = localSearch.toLowerCase().trim();
    if (!query) return shops;

    return shops.filter(s => {
      const shopName = (s.name || '').toLowerCase();
      const shopLocation = (s.location || s.address || '').toLowerCase();
      const businessName = (s.business_name || s.businessName || '').toLowerCase();
      const ownerName = (s.full_name || s.name || s.displayName || '').toLowerCase();
      const phoneNumber = (s.identifier || s.phone || '').toLowerCase();

      return (
        shopName.includes(query) ||
        shopLocation.includes(query) ||
        businessName.includes(query) ||
        ownerName.includes(query) ||
        phoneNumber.includes(query)
      );
    });
  }, [shops, localSearch]);

  const filteredUsers = useMemo(() => {
    const query = localSearch.toLowerCase().trim();
    if (!query) return localUsers;

    return localUsers.filter(u => {
      const name = (u.full_name || u.name || u.displayName || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const phone = (u.identifier || u.phone || '').toLowerCase();
      const business = (u.business_name || u.businessName || '').toLowerCase();
      const userLocation = (u.location || u.address || '').toLowerCase();
      const role = (u.role || '').toLowerCase();

      const assignedShop = shops.find(s => String(s.id) === String(u.shop_id || u.shopId));
      const assignedShopName = assignedShop ? (assignedShop.name || '').toLowerCase() : '';
      const assignedShopLoc = assignedShop ? (assignedShop.location || assignedShop.address || '').toLowerCase() : '';
      const explicitShopName = (u.shopName || u.shop_name || '').toLowerCase();

      return (
        name.includes(query) || 
        email.includes(query) || 
        phone.includes(query) || 
        business.includes(query) || 
        userLocation.includes(query) ||
        role.includes(query) ||
        assignedShopName.includes(query) ||
        assignedShopLoc.includes(query) ||
        explicitShopName.includes(query)
      );
    });
  }, [localUsers, localSearch, shops]);

  const ownerEntities = useMemo(() => {
    return filteredUsers.filter(u => u.role === 'owner' || u.role === 'admin');
  }, [filteredUsers]);

  const pendingCount = useMemo(() => {
    return ownerEntities.filter(u => !u.approved).length;
  }, [ownerEntities]);

  const approvedCount = useMemo(() => {
    return ownerEntities.filter(u => u.approved).length;
  }, [ownerEntities]);

  const pendingOwnersList = useMemo(() => {
    return ownerEntities.filter(u => !u.approved);
  }, [ownerEntities]);

  const approvedOwnersList = useMemo(() => {
    return ownerEntities.filter(u => u.approved);
  }, [ownerEntities]);

  // -----------------------------------------------------------------
  // 3. ROLE CONFIGURATIONS & AUTHORIZATION CHECKERS
  // -----------------------------------------------------------------
  const currentRole = currentUser?.role || "sales";
  const hasAccessToTelemetry = currentRole === 'super_admin';

  // -----------------------------------------------------------------
  // 4. INLINE ACTION PERSISTENCE HANDLERS
  // -----------------------------------------------------------------
  const handleToggleUserStatus = async (user: any) => {
    const newStatus = !user.approved;
    setLocalUsers(prev => prev.map(u => u.id === user.id ? { ...u, approved: newStatus } : u));
    try {
      await dbService.updateUserApproval(user.id, newStatus);
    } catch (err) {
      console.error("Failed to update user approval status profile:", err);
      setLocalUsers(prev => prev.map(u => u.id === user.id ? { ...u, approved: user.approved } : u));
    }
  };
  
  const handleOwnerApproval = async (id: string, approved: boolean) => {
    setLocalUsers(prev => prev.map(u => u.id === id ? { ...u, approved: approved } : u));
    try {
      await dbService.updateUserApproval(id, approved);
    } catch (err) {
      console.error("Database validation state conversion failed:", err);
      setLocalUsers(prev => prev.map(u => u.id === id ? { ...u, approved: !approved } : u));
    }
  };

  const handleTogglePasswordPermission = async (id: string, forceChange: boolean) => {
    setLocalUsers(prev => prev.map(u => u.id === id ? { ...u, onChangePassword: forceChange } : u));
    try {
      await dbService.updateUserPasswordPermission(id, forceChange);
    } catch (err) {
      console.error("Database updating password change permission state conversion failed:", err);
      setLocalUsers(prev => prev.map(u => u.id === id ? { ...u, onChangePassword: !forceChange } : u));
    }
  };

  if (activeSubView === 'feedback' && hasAccessToTelemetry) {
    return (
      <div 
        className="space-y-5 pb-2 text-slate-700 antialiased w-full p-0 m-0 animate-in fade-in slide-in-from-bottom-2 duration-300"
        style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}
      >
        <button
          onClick={() => setActiveSubView('main')}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100/80 hover:bg-white/60 border border-slate-200/60 rounded-xl transition-all cursor-pointer active:scale-95 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToAdminDesk || "Back to Admin Desk"}
        </button>
        <FeedbackDashboard t={t} />
      </div>
    );
  }

  return (
    <div 
      className="space-y-5 pb-2 text-slate-700 antialiased w-full p-0 m-0 animate-in fade-in duration-200"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}
    >
      
      {(currentRole === "super_admin" || currentRole === "admin") && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border border-slate-100 rounded-3xl shadow-xs">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-slate-800 tracking-widest">
              {currentRole === "super_admin" 
                ? (t.systemControlMatrix || "System Control Matrix") 
                : (t.branchControlDesk || "Branch Control Desk")
              }
            </h2>
            <p className="text-xs text-slate-400 font-semibold">
              {currentRole === "super_admin" 
                ? (t.adjustTenantStates || "Adjust multi-tenant environment states") 
                : (t.manageLocalStaff || "Manage branch staff access and registration")
              }
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {currentRole === 'admin' && (
              <button 
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-xl text-xs font-bold tracking-wider transition-all hover:bg-opacity-95 hover:shadow-md active:scale-95 shadow-xs cursor-pointer"
                style={{ backgroundColor: '#1a5fb4' }}
              >
                <UserPlus className="w-4 h-4" />
                <span>{t.registerSalesperson || 'Register New Staff'}</span>
              </button>
            )}

            {currentRole === "super_admin" && (
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-xl text-xs font-bold tracking-wider transition-all bg-amber-600 hover:bg-amber-700 active:scale-95 shadow-xs cursor-pointer"
              >
                <Megaphone className="w-4 h-4" />
                <span>{t.sendBroadcast || 'Send Broadcast'}</span>
              </button>
            )}

            {currentRole === "super_admin" && hasAccessToTelemetry && (
              <button
                type="button"
                onClick={() => setActiveSubView('feedback')}
                className="relative flex items-center justify-center gap-2.5 px-4 py-2.5 bg-slate-50/80 border border-slate-200/70 hover:border-slate-300 hover:bg-white rounded-xl text-xs font-bold text-slate-600 tracking-wider transition-all cursor-pointer active:scale-95 shadow-xs hover:shadow-sm hover:-translate-y-0.5"
              >
                <MessageSquare className="w-4 h-4" style={{ color: '#1a5fb4' }} />
                <span>{t.userFeedbackHub || "User Feedback Hub"}</span>
                
                {unreadCount > 0 && (
                  <span className="flex h-2 w-2 relative ml-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      <AdminControls
        localSearch={localSearch}
        setLocalSearch={setLocalSearch}
        pageSize={pageSize}
        onPageSizeChange={onPageSizeChange}
        t={t}
      />

      {currentRole === "super_admin" && (
        <div className="space-y-5 transition-all duration-300">
          
          {/* ✅ HIGH-DENSITY MODERN PILL NAVIGATION */}
          <div className="bg-slate-100/80 backdrop-blur-xs p-1 rounded-xl border border-slate-200/40 flex gap-1 max-w-sm">
            <button
              type="button"
              onClick={() => setSuperTab('shops')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-semibold tracking-wide rounded-lg transition-all duration-300 cursor-pointer ${
                superTab === 'shops'
                  ? 'text-[#1a5fb4] bg-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Store className="w-3.5 h-3.5 shrink-0" />
              <span>{t.shopsTabLabel || "Shops"}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${superTab === 'shops' ? 'bg-blue-50 text-[#1a5fb4]' : 'bg-slate-200/50 text-slate-500'}`}>
                {filteredShops.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSuperTab('pending')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-semibold tracking-wide rounded-lg transition-all duration-300 cursor-pointer ${
                superTab === 'pending'
                  ? 'text-amber-700 bg-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>{t.pendingOwners || "Pending"}</span>
              {pendingCount > 0 ? (
                <span className="bg-amber-100 text-amber-800 text-xs px-1.5 py-0.5 rounded-md font-bold animate-pulse">
                  {pendingCount}
                </span>
              ) : (
                <span className="text-xs px-1.5 py-0.5 bg-slate-200/50 text-slate-500 rounded-md font-bold">0</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSuperTab('approved')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-semibold tracking-wide rounded-lg transition-all duration-300 cursor-pointer ${
                superTab === 'approved'
                  ? 'text-emerald-700 bg-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>{t.ownerLabel || "Approved Users"}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${superTab === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200/50 text-slate-500'}`}>
                {approvedCount}
              </span>
            </button>
          </div>

          <div className="animate-in fade-in-50 duration-200">
            {superTab === 'shops' && (
              <ShopManagement 
                shops={filteredShops} 
                users={filteredUsers}
                handleOpenShopModal={handleOpenShopModal} 
                triggerDeleteConfirm={(type, id) => triggerDeleteConfirm(type, String(id))} 
                t={t} 
              />
            )}

            {superTab === 'pending' && (
              <div className="space-y-3">
                {pendingOwnersList.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <p className="text-xs font-medium text-slate-400">
                      {t.noPendingOwners || "No match or missing pending approvals found."}
                    </p>
                  </div>
                ) : (
                  pendingOwnersList.map((user) => (
                    <div 
                      key={user.id} 
                      className="p-5 bg-white border border-slate-100 rounded-3xl shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-800">
                            {user.full_name || user.name || user.displayName || 'Unknown Applicant'}
                          </h4>
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold tracking-wider">
                            {user.role || 'owner'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
                          {user.business_name && (
                            <div className="flex items-center gap-1.5 font-medium text-slate-700">
                              <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{user.business_name}</span>
                            </div>
                          )}
                          {user.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </div>
                          )}
                          {(user.identifier || user.phone) && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{user.identifier || user.phone}</span>
                            </div>
                          )}
                          {user.createdAt && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>
                                {new Date(user.createdAt).toLocaleDateString(undefined, { 
                                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => triggerDeleteConfirm('user', user.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/60 hover:border-rose-100 rounded-xl transition-all cursor-pointer"
                          title={t.rejectApplication || "Reject Application"}
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOwnerApproval(user.id, true)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{t.approveBtn || "Approve"}</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {superTab === 'approved' && (
              <Owners 
                users={approvedOwnersList} 
                handleApproveOwner={handleOwnerApproval} 
                handleChangePasswordPermission={handleTogglePasswordPermission}
                t={t} 
              />
            )}
          </div>
        </div>
      )}

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
            users={filteredUsers} 
            currentUser={currentUser} 
            selectedShopFilter={selectedShopFilter} 
            onToggleStatus={handleToggleUserStatus}
            t={t} 
          />
        </div>
      )}

      <BroadcastModal 
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        onSendBroadcast={sendBroadcast}
        t={t}
      />

    </div>
  );
}
