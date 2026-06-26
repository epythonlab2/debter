// src/components/modals/SettingsModal.tsx
import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, Store, MapPin, Mail, Key, Loader2, X, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

/**
 * Properties expected by the SettingsModal component.
 */
interface SettingsModalProps {
  /** Flag to manage modal visibility. */
  isOpen: boolean;
  /** Callback function triggered to close the modal layout. */
  onClose: () => void;
  /** Core profile context of the authenticated session identity. */
  currentUser: {
    fullName?: string;
    shopName?: string;
    email?: string;
    location?: string;
  };
  /** Callback handler executing asynchronous profile detail updates on the platform. */
  onUpdateProfile: (data: { fullName: string; shopName: string; email: string; location: string }) => Promise<void>;
  /** Callback handler executing authentication verification and table password updates. */
  onUpdatePassword: (data: { currentPassword: string; newPassword: string }) => Promise<void>;
  /** Dictionary containing localized translation keys for multi-language display contexts. */
  t: any; 
}

/**
 * Representation of inline action banner alerts.
 */
type StatusNotice = {
  /** Notice taxonomy configuration type. */
  type: 'success' | 'error';
  /** Action notification response text message payload. */
  message: string;
} | null;

/**
 * SettingsModal Component.
 * Renders a full tabbed modal interface enabling active user management mutations 
 * encompassing dynamic system shop profile attributes and direct account security overrides.
 *
 * @component
 * @param {SettingsModalProps} props - Properties mapping layout context parameters.
 */
export default function SettingsModal({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile,
  onUpdatePassword,
  t
}: SettingsModalProps) {
  
  /** Active navigational sub-pane context state pointer. */
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  /** Submission processing throttling switch state tracker. */
  const [isSubmitting, setIsSubmitting] = useState(false);
  /** Component response text log notice contextual state structure. */
  const [statusNotice, setStatusNotice] = useState<StatusNotice>(null);

  // Profile data controlled form states
  const [fullName, setFullName] = useState('');
  const [shopName, setShopName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');

  // Security data controlled form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Password structural input configuration rendering switches
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  /**
   * Cleans UI notification nodes and initializes controlled component value data strings
   * against active identity profiles upon component modal opening cycles.
   */
  useEffect(() => {
    if (isOpen) {
      setStatusNotice(null);
      setFullName(currentUser?.fullName || '');
      setShopName(currentUser?.shopName || '');
      setEmail(currentUser?.email || '');
      setLocation(currentUser?.location || '');
      setCurrentPassword('');
      setNewPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
    }
  }, [isOpen]); 

  /**
   * Resets active feedback notices when cycling between user panel tabs.
   */
  useEffect(() => {
    setStatusNotice(null);
  }, [activeTab]);

  if (!isOpen) return null;

  /**
   * Processes submission form actions targeting changes inside public profile variables.
   * * @param {React.FormEvent} e - Standard DOM synthetic Form Submit event argument context.
   */
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setStatusNotice(null);
    setIsSubmitting(true);
    
    try {
      await onUpdateProfile({ fullName, shopName, email, location });
      
      setStatusNotice({
        type: 'success',
        message: t.profileUpdatedSuccess || "Profile modified successfully!"
      });
    } catch (err: any) {
      console.error(err);
      setStatusNotice({
        type: 'error',
        message: err.message || "Failed to modify profile adjustments."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Evaluates layout password entries, triggering downstream backend authentication routines
   * to perform old credential checks prior to database state mutation calls.
   * * @param {React.FormEvent} e - Standard DOM synthetic Form Submit event argument context.
   */
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setStatusNotice(null);

    if (!currentPassword.trim() || !newPassword.trim()) {
      setStatusNotice({
        type: 'error',
        message: "Please fill out both password fields."
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await onUpdatePassword({ currentPassword, newPassword });
      
      setCurrentPassword('');
      setNewPassword('');
      
      setStatusNotice({
        type: 'success',
        message: t.passwordUpdatedSuccess || "Password updated successfully!"
      });
    } catch (err: any) {
      setStatusNotice({
        type: 'error',
        message: t.errorOldPassword || "Incorrect current password. Authentication failed."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 antialiased select-none"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}
    >
      <div 
        className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-md transition-opacity duration-300" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.15)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300 transform scale-100">
        
        {/* HEADER CONTROLS */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white dark:bg-slate-900 rounded-xl text-[#1a5fb4] dark:text-blue-400 shadow-2xs border border-slate-200/60 dark:border-slate-800">
              {activeTab === 'profile' ? <User className="w-4 h-4 stroke-[2.25]" /> : <ShieldCheck className="w-4 h-4 stroke-[2.25]" />}
            </div>
            <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              {t.settings || "Settings"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SWITCH TOGGLE TABS */}
        <div className="px-5 pt-4 pb-1 bg-white dark:bg-slate-900">
          <div className="bg-slate-200/50 dark:bg-slate-900/40 p-1 rounded-xl border border-slate-200/40 dark:border-slate-800/40 flex gap-1 transition-colors duration-150">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex-1 text-center py-2 text-xs font-bold tracking-wider rounded-lg transition-all duration-300 cursor-pointer select-none border border-transparent ${
                activeTab === 'profile'
                  ? "text-white shadow-xs font-extrabold scale-[1.01] border-[#154b91]"
                  : "text-slate-500 dark:text-slate-400 hover:text-[#1a5fb4] dark:hover:text-blue-400 hover:bg-white/60 dark:hover:bg-slate-800/50"
              }`}
              style={{ backgroundColor: activeTab === 'profile' ? '#1a5fb4' : undefined }}
            >
              {t.profileSettings || "Profile"}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`flex-1 text-center py-2 text-xs font-bold tracking-wider rounded-lg transition-all duration-300 cursor-pointer select-none border border-transparent ${
                activeTab === 'security'
                  ? "text-white shadow-xs font-extrabold scale-[1.01] border-[#154b91]"
                  : "text-slate-500 dark:text-slate-400 hover:text-[#1a5fb4] dark:hover:text-blue-400 hover:bg-white/60 dark:hover:bg-slate-800/50"
              }`}
              style={{ backgroundColor: activeTab === 'security' ? '#1a5fb4' : undefined }}
            >
              {t.securitySettings || "Security"}
            </button>
          </div>
        </div>

        {/* STATUS CONTAINER LAYER */}
        {statusNotice && (
          <div className="px-5 pt-3 bg-white dark:bg-slate-900 z-50 relative">
            <div 
              className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all duration-200 ${
                statusNotice.type === 'success' 
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-400' 
                  : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/30 text-rose-800 dark:text-rose-400'
              }`}
            >
              {statusNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-500" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600 dark:text-rose-500" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold leading-normal text-slate-700 dark:text-slate-300">
                  {statusNotice.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* MAIN PANEL CONTENT DISPLAY */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-white dark:bg-slate-900">
          
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-black text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                  <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 stroke-[2.25]" />
                  {t.fullName || "Owner Full Name"}
                </label>
                <input
                  type="text"
                  value={fullName}
                  disabled={isSubmitting}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t.fullNamePlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 outline-none text-sm bg-slate-50/50 dark:bg-slate-950/40 font-bold text-slate-800 dark:text-slate-200 focus:bg-white focus:dark:bg-slate-950 focus:border-[#1a5fb4] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#1a5fb4]/10 transition-all disabled:opacity-60 dark:placeholder:text-slate-600"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-black text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                  <Store className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 stroke-[2.25]" />
                  {t.shopName || "Shop Name"}
                </label>
                <input
                  type="text"
                  value={shopName}
                  disabled={isSubmitting}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder={t.shopNamePlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 outline-none text-sm bg-slate-50/50 dark:bg-slate-950/40 font-bold text-slate-800 dark:text-slate-200 focus:bg-white focus:dark:bg-slate-950 focus:border-[#1a5fb4] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#1a5fb4]/10 transition-all disabled:opacity-60 dark:placeholder:text-slate-600"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-black text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                  <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 stroke-[2.25]" />
                  {t.emailOptional || "Email Address"}
                </label>
                <input
                  type="email"
                  value={email}
                  disabled={isSubmitting}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@shop.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 outline-none text-sm bg-slate-50/50 dark:bg-slate-950/40 font-bold text-slate-800 dark:text-slate-200 focus:bg-white focus:dark:bg-slate-950 focus:border-[#1a5fb4] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#1a5fb4]/10 transition-all disabled:opacity-60 font-mono dark:placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-black text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 stroke-[2.25]" />
                  {t.location || "Shop Location"}
                </label>
                <input
                  type="text"
                  value={location}
                  disabled={isSubmitting}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t.location}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 outline-none text-sm bg-slate-50/50 dark:bg-slate-950/40 font-bold text-slate-800 dark:text-slate-200 focus:bg-white focus:dark:bg-slate-950 focus:border-[#1a5fb4] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#1a5fb4]/10 transition-all disabled:opacity-60 dark:placeholder:text-slate-600"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#1a5fb4] text-white py-3 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-xs font-bold tracking-wide cursor-pointer mt-4 focus:outline-none focus:ring-4 focus:ring-[#1a5fb4]/20 disabled:bg-slate-100 disabled:dark:bg-slate-950 disabled:text-slate-400 disabled:dark:text-slate-600 disabled:pointer-events-none"
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

          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-black text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                  <Key className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 stroke-[2.25]" />
                  {t.currentPasswordLabel || "Current Password"}
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    disabled={isSubmitting}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-11 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 outline-none text-sm bg-slate-50/50 dark:bg-slate-950/40 font-bold text-slate-800 dark:text-slate-200 focus:bg-white focus:dark:bg-slate-950 focus:border-[#1a5fb4] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#1a5fb4]/10 transition-all disabled:opacity-60 font-mono dark:placeholder:text-slate-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-black text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                  <Key className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 stroke-[2.25]" />
                  {t.newPasswordLabel || "New Password"}
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    disabled={isSubmitting}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-11 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 outline-none text-sm bg-slate-50/50 dark:bg-slate-950/40 font-bold text-slate-800 dark:text-slate-200 focus:bg-white focus:dark:bg-slate-950 focus:border-[#1a5fb4] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#1a5fb4]/10 transition-all disabled:opacity-60 font-mono dark:placeholder:text-slate-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#1a5fb4] text-white py-3 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-xs font-bold tracking-wide cursor-pointer mt-4 focus:outline-none focus:ring-4 focus:ring-[#1a5fb4]/20 disabled:bg-slate-100 disabled:dark:bg-slate-950 disabled:text-slate-400 disabled:dark:text-slate-600 disabled:pointer-events-none"
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
