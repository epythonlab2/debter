// src/App.tsx
import React, { useMemo, useState, Suspense, lazy, useEffect } from 'react';
import { translations } from './constants/translations';
import { MessageSquare } from 'lucide-react';
import { supabase } from './utils/supabaseClient'; //  Direct client reference for live security gate syncs

/** * ==========================================
 * THEME CONTEXT SYSTEM (V4 Integrated Strategy)
 * ==========================================
 */
import { ThemeProvider } from './core/context/ThemeContext';

/** * ==========================================
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
 * MODALS & DIALOG OVERLAYS (Lazy-Loaded Named Exports)
 * ==========================================
 */
const DeleteConfirmModal = lazy(() => import('./components/modals/DeleteConfirmModal').then(m => ({ default: m.DeleteConfirmModal })));
const SettleDubeModal    = lazy(() => import('./components/modals/SettleDubeModal').then(m => ({ default: m.SettleDubeModal })));
const SimpleFeedbackForm = lazy(() => import('./components/layout/SimpleFeedbackForm').then(m => ({ default: m.SimpleFeedbackForm })));

/**
 * ==========================================
 * DYNAMIC TAB WORKSPACE COMPONENTS (Lazy-Loaded Default Exports)
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

// 📱 HARDWARE/BUILD METRICS FOR ENFORCED UPDATES
const CURRENT_VERSION_CODE = 9; // Your version 1.0.8 build is code 9

const ViewChunkLoader = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-24 space-y-4">
    <div className="w-6 h-6 border-2 border-[#1a5fb4] border-t-transparent rounded-full animate-spin" />
    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest antialiased">
      {message}
    </span>
  </div>
);

/**
 * Core application workbench view orchestration tier
 */
function MainDashboardApp() {
  const [adminSearch, setAdminSearch] = useState('');
  const [adminPageSize, setAdminPageSize] = useState(10);
  const [splashVisible, setSplashVisible] = useState(true);

  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isFeedbackExpanded, setIsFeedbackExpanded] = useState(true);

  // Forced update gating states
  const [mustUpdate, setMustUpdate] = useState(false);
  const [checkingVersion, setCheckingVersion] = useState(true);

  const db = useLocalStoragePipeline();
  const { lang, setLang } = db;

  // 1. VERIFY SYSTEM INTEGRITY AND ENFORCE VERSION UPDATES (Supabase Gate)
  useEffect(() => {
    async function verifyAppBuildVersion() {
      try {
        const { data, error } = await supabase
          .from('app_config')
          .select('value')
          .eq('key', 'min_version_required')
          .maybeSingle();

        if (error) throw error;

        if (data && data.value) {
          const requiredCode = parseInt(data.value, 10);
          if (CURRENT_VERSION_CODE < requiredCode) {
            setMustUpdate(true);
          }
        }
      } catch (err) {
        console.warn('[Version Gate Warning]: Failed to run integrity verification check.', err);
      } finally {
        setCheckingVersion(false);
      }
    }
    verifyAppBuildVersion();
  }, []);

  // Handle scrolling feedback bar contraction
  useEffect(() => {
    const handleScrollVisibility = () => {
      setIsFeedbackExpanded(window.scrollY <= 120);
    };
    window.addEventListener('scroll', handleScrollVisibility, { passive: true });
    return () => window.removeEventListener('scroll', handleScrollVisibility);
  }, []);

  // LIVE SECURITY CHECK GATE: Terminate stale cache instantly if account was disabled
  useEffect(() => {
    const verifyActiveSessionState = async () => {
      const cachedSession = localStorage.getItem('debter_v1_current_user');
      if (!cachedSession) return;

      // OFFLINE CHECK: If the device is offline, skip live server sync security checks
      if (typeof window !== 'undefined' && !window.navigator.onLine) {
        console.log('[Security Gate]: Device is offline. Bypassing live gate validations.');
        return;
      }

      try {
        const parsedUser = JSON.parse(cachedSession);
        if (!parsedUser?.id) return;

        // Fetch user parameters directly from backend production state
        const { data: serverUser, error } = await supabase
          .from('users')
          .select('approved, role')
          .eq('id', parsedUser.id)
          .maybeSingle();

        if (error) {
          // CHECK FOR NETWORK ERRORS: Don't panic if it's just a network disconnect
          if (error.message?.includes('Failed to fetch') || (error as any).status === 0) {
            console.warn('[Session Sync Warning]: Server unreachable. Preserving current offline session cache context.');
            return;
          }
          console.error('[Session Sync Error]: Failed to reach live validation gate.', error.message);
          return;
        }

        // If the workspace profile is unapproved/disabled, clear storage frames instantly
        if (serverUser && serverUser.approved === false && serverUser.role !== 'super_admin') {
          console.warn('[Forced Security Terminate]: Intercepted disabled pipeline payload session.');
          localStorage.removeItem('debter_v1_current_user');
          
          if (db.setCurrentUser) {
            db.setCurrentUser(null);
          } else {
            window.location.reload(); // Hard fallback layout pop back to login
          }
        }
      } catch (e: any) {
        // CATCH CONTEXT NETWORK FAILURE: Prevent network drops from throwing critical app crashes
        if (e?.message?.includes('Failed to fetch')) {
          console.warn('[Session Recovery Guard]: Suppressed offline fetch failure.');
        } else {
          console.error('[Session Recovery Guard Panic]:', e);
        }
      }
    };

    if (!db.loadingPipeline && !splashVisible) {
      verifyActiveSessionState();
    }
  }, [db.loadingPipeline, splashVisible, db.currentUser]);

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
    items: db.items,
    sales: db.sales,
    dailyGoal: safeDb.dailyGoal,
    setShops: db.setShops,
    setItems: db.setItems,
    setSales: db.setSales,
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
  
  // Show standard initialization loading screen during security/version queries
  if (db.loadingPipeline || splashVisible || checkingVersion) {
    return (
      <SplashScreen 
        lang={lang} 
        onComplete={() => setSplashVisible(false)} 
        isFirstTime={!safeDb.currentUser}
      />
    );
  }

  // STOP EXPLOITATION: Direct force blocking view if the user app build is deprecated
  if (mustUpdate) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center antialiased">
        <div className="max-w-sm w-full bg-slate-800 border border-slate-700/50 rounded-2xl p-6 shadow-2xl space-y-5">
          <div className="mx-auto w-12 h-12 bg-[#1a5fb4]/10 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-[#1a5fb4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Update Required</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              We've launched critical database structural updates in version 1.0.8. Please update your application via the Google Play Store to continue.
            </p>
          </div>
          <button 
            onClick={() => window.open('https://play.google.com/store/apps/details?id=YOUR_APP_PACKAGE_NAME', '_blank')}
            className="w-full bg-[#1a5fb4] hover:bg-[#154b91] text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-[#1a5fb4]/15 active:scale-[0.98]"
          >
            Update via Play Store
          </button>
        </div>
      </div>
    );
  }

  if (!safeDb.currentUser) {
    return (
      <div className="min-h-screen bg-slate-50/90 text-slate-500 dark:bg-[#070d19] flex items-center justify-center p-4 transition-colors duration-200">
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
      <div className="min-h-screen bg-slate-50/96 text-slate-800 dark:bg-[#070d19] dark:text-slate-100 flex flex-col transition-colors duration-200">
        <GlobalBroadcastBanner t={t} />
        <CustomToast toast={toastData} onClose={salesEngine.clearToast} />

        <Header
          lang={lang}
          setLang={setLang}
          currentUser={safeDb.currentUser}
          handleLogout={salesEngine.handleLogout}
          onUpdateProfile={db.handleUpdateProfile }
          onUpdatePassword={db.handleUpdatePassword}
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
                  {salesEngine.activeTab === 'dashboard' && (
                    <DashboardTab
                      currentUser={safeDb.currentUser}
                      onFetchShopsFromAPI={async (query: string) => {
                        salesEngine.setShopQuery(query);
                        return salesEngine.shops; 
                      }}
                      selectedShopFilter={salesEngine.selectedShopFilter}
                      setSelectedShopFilter={salesEngine.setSelectedShopFilter}
                      analytics={salesEngine.analytics}
                      dailyGoal={safeDb.dailyGoal}
                      handleUpdateGoal={db.handleUpdateGoal}
                      t={t}
                      timeFilter={salesEngine.timeFilter}
                      setTimeFilter={salesEngine.setTimeFilter} // Fixed: properly explicitly bound to engine scope
                    />
                  )}

                  {salesEngine.activeTab === 'entry' && (
                    <RecordSaleTab
                      {...salesEngine.forms}
                      paymentMethod={salesEngine.forms.paymentMethod as any}
                      setPaymentMethod={salesEngine.forms.setPaymentMethod as any}
                      saleQty={Number(salesEngine.forms.saleQty) || 0}
                      activeShopItems={salesEngine.activeShopItems ?? []}
                      items={salesEngine.items}
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
                      selectedShopFilter={salesEngine.selectedShopFilter} 
                      shops={db.shops || []}          
                      pageSize={adminPageSize}       
                      onPageSizeChange={setAdminPageSize} 
                      onSearchChange={setAdminSearch}
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
            isFeedbackExpanded={isFeedbackExpanded}
            onFeedbackClick={() => setIsFeedbackOpen(true)}
          />
        )}
      </div>
    </NotificationProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainDashboardApp />
    </ThemeProvider>
  );
}
