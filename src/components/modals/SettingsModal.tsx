// src/components/modals/SettingsModal.tsx
import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, Store, MapPin, Mail, Key, Loader2, X, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * SECTION 1: INTERFACES & TYPE DEFINITIONS
 * Strict TypeScript typing for properties coming down from App core state, 
 * alongside localized status states for the inline message components.
 */
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    fullName?: string;
    shopName?: string;
    email?: string;
    location?: string;
  };
  onUpdateProfile: (data: { fullName: string; shopName: string; email: string; location: string }) => Promise<void>;
  onUpdatePassword: (data: { currentPassword: string; newPassword: string }) => Promise<void>;
  t: any; // Context localization translation definitions mapping Amharic/English blocks
}

type StatusNotice = {
  type: 'success' | 'error';
  message: string;
} | null;

export default function SettingsModal({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile,
  onUpdatePassword,
  t
}: SettingsModalProps) {
  
  /**
   * SECTION 2: APPLICATION RUNTIME STATE HOOKS
   * Localized states decoupling modal form updates from direct parent modifications
   * to guarantee zero keyboard latency shifts or input bounce conditions.
   */
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusNotice, setStatusNotice] = useState<StatusNotice>(null);

  // Profile Management Input Elements
  const [fullName, setFullName] = useState('');
  const [shopName, setShopName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');

  // Authentication/Security Credentials Management Elements
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  /**
   * SECTION 3: DOM LIFECYCLE & EFFECT SYNCHRONIZERS
   * Syncs raw state parameters whenever user contextual states switch dynamically 
   * or if the modal is hidden/displayed via app context actions.
   */
  useEffect(() => {
    if (isOpen) {
      // Flush structural notices safely to avoid stale toast caching indicators on mount
      setStatusNotice(null);
      if (currentUser) {
        setFullName(currentUser.fullName || '');
        setShopName(currentUser.shopName || '');
        setEmail(currentUser.email || '');
        setLocation(currentUser.location || '');
      }
    }
  }, [isOpen, currentUser]);

  // Clears active notification visibility flags during tab swaps
  useEffect(() => {
    setStatusNotice(null);
  }, [activeTab]);

  // Conditional early return avoiding unnecessary DOM mutations if window is flagged out
  if (!isOpen) return null;

  /**
   * SECTION 4: ASYNCHRONOUS FORM COMPLIANCE HANDLERS
   * Dispatches data matrices back up stream across async contexts.
   * Utilizes internal status catching to circumvent global toast layer-stack visibility bugs.
   */
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Thread race-condition blocker
    
    setStatusNotice(null);
    setIsSubmitting(true);
    
    try {
      // Dispatch dataset mutations upwards directly onto async store updates
      await onUpdateProfile({ fullName, shopName, email, location });
      
      // Inject immediate feedback parameters straight to internal notification elements
      setStatusNotice({
        type: 'success',
        message: t.profileUpdatedSuccess || (t.lang === 'ax' || !t.settings ? "የግል መረጃዎ ተስተካክሏል!" : "Profile modified successfully!")
      });
    } catch (err: any) {
      console.error("Profile mutation processing fault: ", err);
      setStatusNotice({
        type: 'error',
        message: err.message || "Failed to modify profile adjustments."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Thread race-condition blocker
    
    setStatusNotice(null);
    setIsSubmitting(true);

    try {
      // Dispatches security changes through DB Service integrations
      await onUpdatePassword({ currentPassword, newPassword });
      
      // Clear password field states post compilation for defensive app sanitation
      setCurrentPassword('');
      setNewPassword('');
      
      // Mount inline success layout alerts directly onto the modal's DOM tree
      setStatusNotice({
        type: 'success',
        message: t.passwordUpdatedSuccess || (t.lang === 'ax' || !t.settings ? "የይለፍ ቃልዎ ተቀይሯል!" : "Password updated successfully!")
      });
    } catch (err: any) {
      console.error("Authentication alteration processing fault: ", err);
      setStatusNotice({
        type: 'error',
        message: err.message || "Failed to update authentication credentials."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    /**
     * SECTION 5: MODAL WRAPPER LAYER (PORTAL DECOUPLED STACKING)
     * High absolute index configurations anchored firmly across view heights.
     */
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 antialiased select-none"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}
    >
      {/* BACKGROUND MATTE INTERFACES: Captures clicks outside core window frames to close view threads */}
      <div 
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity duration-300" 
        onClick={onClose} 
      />

      {/* CORE DISPLAY CANVAS LAYER */}
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.15)] overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300 transform scale-100">
        
        {/* SUBSECTION A: HEADER CONTROLS */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white rounded-xl text-slate-700 shadow-2xs border border-slate-200/60">
              {activeTab === 'profile' ? <User className="w-4 h-4 stroke-[2.25]" /> : <ShieldCheck className="w-4 h-4 stroke-[2.25]" />}
            </div>
            <h2 className="text-base font-extrabold text-slate-800 tracking-tight">
              {t.settings || "Settings"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SUBSECTION B: SEGMENTED SWITCH TOGGLE TABS */}
        <div className="px-5 pt-4 pb-1 bg-white">
          <div className="grid grid-cols-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200/40 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-3 rounded-lg text-xs font-bold tracking-wide transition-all duration-200 text-center cursor-pointer select-none border ${
                activeTab === 'profile'
                  ? "bg-[#1a5fb4] text-white shadow-xs border-[#154b91]"
                  : "text-slate-500 border-transparent hover:text-slate-800"
              }`}
            >
              {t.profileSettings || "Profile"}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`py-2 px-3 rounded-lg text-xs font-bold tracking-wide transition-all duration-200 text-center cursor-pointer select-none border ${
                activeTab === 'security'
                  ? "bg-[#1a5fb4] text-white shadow-xs border-[#154b91]"
                  : "text-slate-500 border-transparent hover:text-slate-800"
              }`}
            >
              {t.securitySettings || "Security"}
            </button>
          </div>
        </div>

        {/* SUBSECTION C: FORM PANEL DISPLAY ZONE */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* INLINE STATUS NOTICE HOOKS */}
          {statusNotice && (
            <div className={`p-3.5 rounded-xl border flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
              statusNotice.type === 'success' 
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50/60 border-rose-200 text-rose-800'
            }`}>
              {statusNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
              )}
              <span className="text-xs font-semibold leading-normal">{statusNotice.message}</span>
            </div>
          )}
          
          {/* PROFILE FORM ATTRIBUTES PANEL */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-black text-slate-400 tracking-wider uppercase">
                  <User className="w-3.5 h-3.5 text-slate-400 stroke-[2.25]" />
                  {t.fullName || "Owner Full Name"}
                </label>
                <input
                  type="text"
                  value={fullName}
                  disabled={isSubmitting}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t.fullNamePlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-sm bg-slate-50/50 font-bold text-slate-800 focus:bg-white focus:border-[#1a5fb4] focus:ring-4 focus:ring-[#1a5fb4]/5 transition-all disabled:opacity-60"
                  required
                />
              </div>

              {/* Shop Name */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-black text-slate-400 tracking-wider uppercase">
                  <Store className="w-3.5 h-3.5 text-slate-400 stroke-[2.25]" />
                  {t.shopName || "Shop Name"}
                </label>
                <input
                  type="text"
                  value={shopName}
                  disabled={isSubmitting}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder={t.shopNamePlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-sm bg-slate-50/50 font-bold text-slate-800 focus:bg-white focus:border-[#1a5fb4] focus:ring-4 focus:ring-[#1a5fb4]/5 transition-all disabled:opacity-60"
                  required
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-black text-slate-400 tracking-wider uppercase">
                  <Mail className="w-3.5 h-3.5 text-slate-400 stroke-[2.25]" />
                  {t.emailOptional || "Email Address"}
                </label>
                <input
                  type="email"
                  value={email}
                  disabled={isSubmitting}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@shop.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-sm bg-slate-50/50 font-bold text-slate-800 focus:bg-white focus:border-[#1a5fb4] focus:ring-4 focus:ring-[#1a5fb4]/5 transition-all disabled:opacity-60 font-mono"
                />
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-black text-slate-400 tracking-wider uppercase">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 stroke-[2.25]" />
                  {t.location || "Shop Location"}
                </label>
                <input
                  type="text"
                  value={location}
                  disabled={isSubmitting}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t.location}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-sm bg-slate-50/50 font-bold text-slate-800 focus:bg-white focus:border-[#1a5fb4] focus:ring-4 focus:ring-[#1a5fb4]/5 transition-all disabled:opacity-60"
                  required
                />
              </div>

              {/* Submit Profile Actions */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#1a5fb4] hover:bg-[#154b91] text-white py-3 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-xs font-bold tracking-wide cursor-pointer mt-4 disabled:bg-slate-200 disabled:text-slate-400 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>{t.savingProfile || "Saving Profile..."}</span>
                  </>
                ) : (
                  <span>{t.saveProfile || "Save Profile Changes"}</span>
                )}
              </button>
            </form>
          )}

          {/* SECURITY & PASSWORD CHANGE CONFIGURATION PANEL */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-black text-slate-400 tracking-wider uppercase">
                  <Key className="w-3.5 h-3.5 text-slate-400 stroke-[2.25]" />
                  {t.currentPasswordLabel || "Current Password"}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  disabled={isSubmitting}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-sm bg-slate-50/50 font-bold text-slate-800 focus:bg-white focus:border-[#1a5fb4] focus:ring-4 focus:ring-[#1a5fb4]/5 transition-all disabled:opacity-60 font-mono"
                  required
                />
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-black text-slate-400 tracking-wider uppercase">
                  <Key className="w-3.5 h-3.5 text-slate-400 stroke-[2.25]" />
                  {t.newPasswordLabel || "New Password"}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  disabled={isSubmitting}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-sm bg-slate-50/50 font-bold text-slate-800 focus:bg-white focus:border-[#1a5fb4] focus:ring-4 focus:ring-[#1a5fb4]/5 transition-all disabled:opacity-60 font-mono"
                  required
                />
              </div>

              {/* Submit Password Actions */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#1a5fb4] hover:bg-[#154b91] text-white py-3 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-xs font-bold tracking-wide cursor-pointer mt-4 disabled:bg-slate-200 disabled:text-slate-400 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>{t.updatingPassword || "Updating Password..."}</span>
                  </>
                ) : (
                  <span>{t.confirmChangeBtn || "Change Password"}</span>
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
