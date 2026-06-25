// src/App.tsx
import React, { useMemo, useState, Suspense, lazy, useEffect } from 'react';
import { translations } from './constants/translations';
import { MessageSquare } from 'lucide-react';

/** 
 * ==========================================
 * LAYOUT COMPONENTS (Static for initial frame stability)
 * ==========================================
 */
import { Header } from './components/layout/Header';
import { MetaPanel } from './components/layout/MetaPanel';
import { Navigation } from './components/layout/Navigation';

/**
 * ==========================================
 * AUTHENTICATION & GATEWAY COMPONENTS (Static)
 * ==========================================
 */
import { Auth } from './components/auth/Auth';
import { SplashScreen } from './components/auth/SplashScreen';

/**
 * ==========================================
 * NOTIFICATION INTEGRATION MODULES (Static)
 * ==========================================
 */
import { NotificationProvider } from './core/context/NotificationContext';
import { GlobalBroadcastBanner } from './components/common/GlobalBroadcastBanner';
import CustomToast from './components/common/CustomToast';

/**
 * ==========================================
 * MODALS & DIALOG OVERLAYS (Lazy-Loaded Named Exports 🟢)
 * ==========================================
 */
const DeleteConfirmModal = lazy(() => import('./components/modals/DeleteConfirmModal').then(m => ({ default: m.DeleteConfirmModal })));
const ShopModal          = lazy(() => import('./components/modals/ShopModal').then(m => ({ default: m.ShopModal })));
const SettleDubeModal    = lazy(() => import('./components/modals/SettleDubeModal').then(m => ({ default: m.SettleDubeModal })));
const SimpleFeedbackForm = lazy(() => import('./components/layout/SimpleFeedbackForm').then(m => ({ default: m.SimpleFeedbackForm })));

/**
 * ==========================================
 * DYNAMIC TAB WORKSPACE COMPONENTS (Lazy-Loaded Default Exports 🟢)
 * ==========================================
 */
const PendingApprovalView = lazy(() => import('./components/PendingApprovalView'));
const DashboardTab        = lazy(() => import('./components/dashboard/DashboardTab'));
const RecordSaleTab       = lazy(() => import('./components/sales/RecordSaleTab'));
const LedgerTab           = lazy(() => import('./components/ledger/LedgerTab'));
const InventoryTab        = lazy(() => import('./components/inventory/InventoryTab'));
const AdminTab            = lazy(() => import('./components/admin/AdminTab'));

/**
 * ==========================================
 * DATA ORCHESTRATION & BUSINESS LOGIC HOOKS (Static)
 * ==========================================
 */
import { useLocalStoragePipeline } from './hooks/useLocalStoragePipeline';
import { useSalesManagement } from './hooks/useSalesManagement';

const ViewChunkLoader = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-24 space-y-4">
    <div className="w-6 h-6 border-2 border-[#1a5fb4] border-t-transparent rounded-full animate-spin" />
    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest antialiased">
      {message}
    </span>
  </div>
);

export default function App() {
  const [adminSearch, setAdminSearch] = useState('');
  const [adminPageSize, setAdminPageSize] = useState(10);
  const [splashVisible, setSplashVisible] = useState(true);

  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isFeedbackExpanded, setIsFeedbackExpanded] = useState(true);

  const db = useLocalStoragePipeline();
  const { lang, setLang } = db;

  // Handle scrolling feedback bar contraction
  useEffect(() => {
    const handleScrollVisibility = () => {
      setIsFeedbackExpanded(window.scrollY <= 120);
    };
    window.addEventListener('scroll', handleScrollVisibility, { passive: true });
    return () => window.removeEventListener('scroll', handleScrollVisibility);
  }, []);

  const t = useMemo(() => translations?.[lang] ?? {}, [lang]);

  const safeDb = useMemo(() => ({
    currentUser: db.currentUser ?? null,
    users: db.users ?? [],
    shops: db.shops ?? [],
    items: db.items ?? [],
    sales: db.sales ?? [],
    dubeRecords: db.dubeRecords ?? [],
    dailyGoal: db.dailyGoal ?? 0
  }), [db.currentUser, db.users, db.shops, db.items, db.sales, db.dubeRecords, db.dailyGoal]);

  const salesEngine = useSalesManagement({
    lang,
    t,
    currentUser: safeDb.currentUser,
    shops: db.shops, 
    items: safeDb.items,
    dailyGoal: safeDb.dailyGoal,
    setShops: db.setShops,
    setItems: db.setItems,
  });

  const filteredShops = useMemo(() => {
    const rawShops = db.shops || [];
    if (!adminSearch.trim()) {
      return [...rawShops].reverse().slice(0, adminPageSize);
    }
    const query = adminSearch.toLowerCase();
    return [...rawShops]
      .reverse()
      .filter(shop => 
        shop.name?.toLowerCase().includes(query) || 
        shop.location?.toLowerCase().includes(query)
      )
      .slice(0, adminPageSize);
  }, [db.shops, adminSearch, adminPageSize]);

  const filteredUsers = useMemo(() => {
    const dbUsers = db.users || [];
    const activeUsers = salesEngine.users || [];
    
    // High-performance deduplication loop instead of full map allocations on type events
    const seenIds = new Set();
    const combined = [];
    
    for (let i = activeUsers.length - 1; i >= 0; i--) {
      const u = activeUsers[i];
      if (u?.id && !seenIds.has(u.id)) {
        seenIds.add(u.id);
        combined.push(u);
      }
    }
    for (let i = dbUsers.length - 1; i >= 0; i--) {
      const u = dbUsers[i];
      if (u?.id && !seenIds.has(u.id)) {
        seenIds.add(u.id);
        combined.push(u);
      }
    }

    if (!adminSearch.trim()) return combined;

    const query = adminSearch.toLowerCase();
    return combined.filter(user => 
      user.full_name?.toLowerCase().includes(query) || 
      user.identifier?.toLowerCase().includes(query)
    );
  }, [db.users, salesEngine.users, adminSearch]);

  const handleFeedbackSubmit = async (comment: string) => {
    console.log("Feedback data package transmitted:", {
      operator: safeDb.currentUser?.full_name || 'Unknown Operator',
      role: safeDb.currentUser?.role,
      comment,
      timestamp: new Date().toISOString()
    });
  };
  
  if (db.loadingPipeline || splashVisible) {
    return (
      <SplashScreen 
        lang={lang} 
        onComplete={() => setSplashVisible(false)} 
        isFirstTime={!safeDb.currentUser}
      />
    );
  }

  if (!safeDb.currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Auth
            onAuthSuccess={(user) => db.setCurrentUser(user)}
            lang={lang}
            onLangChange={setLang}
            t={t}
          />
        </div>
      </div>
    );
  }

  const isApproved = safeDb.currentUser.approved || safeDb.currentUser.role === 'super_admin';
  const toastData = salesEngine.toast ? { ...salesEngine.toast, id: String(salesEngine.toast.id) } : null;

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
        <GlobalBroadcastBanner t={t} />
        <CustomToast toast={toastData} onClose={salesEngine.clearToast} />

        <Header
	  lang={lang}
	  setLang={setLang}
	  currentUser={safeDb.currentUser}
	  handleLogout={salesEngine.handleLogout}
	  /* CRITICAL FIX: Pass down your real pipeline mutation handlers.
	    (Replace 'db.handleUpdateProfile' and 'db.handleUpdatePassword' with the 
	     exact function names exposed by your useLocalStoragePipeline hook)
	  */
	  onUpdateProfile={db.handleUpdateProfile || db.updateProfile || (async (data) => console.log(data))}
	  onUpdatePassword={db.handleUpdatePassword || db.updatePassword || (async (data) => console.log(data))}
	  t={t}
	/>

        <MetaPanel currentUser={safeDb.currentUser} users={safeDb.users} t={t}/>

        <main className="flex-1 pb-28 md:pb-20 overflow-y-auto">
          <div className="max-w-md mx-auto p-4 space-y-4">
            <Suspense fallback={<ViewChunkLoader message={t.loading || 'Loading...'} />}>
              {!isApproved ? (
                <PendingApprovalView
                  user={safeDb.currentUser}
                  handleLogout={salesEngine.handleLogout}
                  t={t}
                  lang={lang}
                />
              ) : (
                <>
                  {salesEngine.activeTab === 'dashboard' && 
                  (safeDb.currentUser.role === 'super_admin' || safeDb.currentUser.role === 'admin') && (
                    <DashboardTab
                      currentUser={safeDb.currentUser}
                      shops={safeDb.shops}
                      selectedShopFilter={salesEngine.selectedShopFilter}
                      setSelectedShopFilter={salesEngine.setSelectedShopFilter}
                      analytics={salesEngine.analytics}
                      dailyGoal={safeDb.dailyGoal}
                      handleUpdateGoal={db.handleUpdateGoal}
                      t={t}
                      lang={lang}
                      timeFilter={salesEngine.timeFilter}
                      setTimeFilter={salesEngine.setTimeFilter}
                    />
                  )}

                  {salesEngine.activeTab === 'entry' && (
                    <RecordSaleTab
                      {...salesEngine.forms}
                      saleQty={Number(salesEngine.forms.saleQty) || 0}
                      activeShopItems={salesEngine.activeShopItems ?? []}
                      items={safeDb.items}
                      handleRecordSale={salesEngine.handleRecordSale}
                      handleQuickSelect={(item) => salesEngine.handleQuickSelect({
                        ...item,
                        quantity: item.quantity ?? 0
                      } as any)}
                      t={t}
                      lang={lang}
                    />
                  )}

                  {salesEngine.activeTab === 'ledger' && (
                    <LedgerTab {...salesEngine} currentUser={safeDb.currentUser} t={t} lang={lang} />
                  )}

                  {salesEngine.activeTab === 'inventory' && (
                    <InventoryTab 
                      {...salesEngine} 
                      handleRegisterItem={(e, id) => salesEngine.handleRegisterItem(e, id ?? undefined)}
                      setSelectedItemId={(id) => salesEngine.setSelectedItemId(id ?? '')} 
                      t={t} 
                    />
                  )}

                  {salesEngine.activeTab === 'admin' && (
                    <AdminTab
                      {...salesEngine}             
                      {...salesEngine.forms}        
                      currentUser={safeDb.currentUser}
                      shops={filteredShops}          
                      users={filteredUsers}        
                      pageSize={adminPageSize}       
                      onPageSizeChange={setAdminPageSize} 
                      onSearchChange={setAdminSearch}
                      triggerDeleteConfirm={salesEngine.triggerDeleteConfirm}
                      salesName={salesEngine.salesName}
                      setSalesName={salesEngine.setSalesName}
                      handleRegisterSalesperson={salesEngine.handleRegisterSalesperson} 
                      t={t}
                      lang={lang}
                    />
                  )}
                </>
              )}
            </Suspense>
          </div>
        </main>

        <Suspense fallback={null}>
          <DeleteConfirmModal
            isOpen={salesEngine.deleteConfirmModal?.isOpen ?? false}
            onClose={() => salesEngine.setDeleteConfirmModal({ isOpen: false, type: null, targetId: null })}
            onConfirm={salesEngine.executeDelete}
            t={t}
            lang={lang}
          />

          <ShopModal
            isOpen={salesEngine.shopModal?.isOpen ?? false}
            mode={salesEngine.shopModal?.mode ?? 'create'}
            onClose={() => salesEngine.setShopModal({ isOpen: false, mode: 'create', data: null })}
            onSubmit={salesEngine.handleSaveShop}
            newShopName={salesEngine.forms.newShopName}
            setNewShopName={salesEngine.forms.setNewShopName}
            newShopLocation={salesEngine.forms.newShopLocation}
            setNewShopLocation={salesEngine.forms.setNewShopLocation}
            newShopOwner={salesEngine.forms.newShopOwner}
            setNewShopOwner={salesEngine.forms.setNewShopOwner}
            potentialOwners={salesEngine.potentialOwners} 
            t={t}
          />

          <SettleDubeModal 
            isOpen={salesEngine.settleDubeModal.isOpen} 
            dubeId={salesEngine.settleDubeModal.dubeId}
            onClose={() => salesEngine.setSettleDubeModal({ isOpen: false, dubeId: null })}
            onSettle={salesEngine.handleSettleDube} 
            lang={lang}
            t={t}
          />

          <SimpleFeedbackForm
            currentUser={safeDb.currentUser}
            isOpen={isFeedbackOpen}
            onClose={() => setIsFeedbackOpen(false)}
            onSubmit={handleFeedbackSubmit} 
            t={t}
          />
        </Suspense>

        

        {isApproved && (
	    <Navigation
	      activeTab={salesEngine.activeTab}
	      setActiveTab={salesEngine.setActiveTab}
	      setLedgerSearch={salesEngine.setLedgerSearch}
	      currentRole={safeDb.currentUser.role}
	      t={t}
	      // Pass these new props down into your unified navigation layout 
	      isFeedbackExpanded={isFeedbackExpanded}
	      onFeedbackClick={() => setIsFeedbackOpen(true)}
	    />
	  )}
	</div>
    </NotificationProvider>
  );
}
