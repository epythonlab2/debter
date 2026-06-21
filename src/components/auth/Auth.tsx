// src/components/auth/Auth.tsx
import React, { useEffect, useRef, useState } from 'react';
import { User, MapPin, KeyRound, Contact, Mail, Briefcase, TrendingUp, Loader2, CheckCircle2 } from 'lucide-react'; 
import { UserProfile } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { DebterIcon } from '../layout/DebterIcon';

interface AuthProps {
  onAuthSuccess: (user: UserProfile) => void;
  t?: any;
  lang?: 'en' | 'am';
  onLangChange?: React.Dispatch<React.SetStateAction<'en' | 'am'>>;
}

export function Auth({ onAuthSuccess, t, lang = 'en', onLangChange }: AuthProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  
  const handleInterceptAuthSuccess = (user: UserProfile) => {
    try {
      localStorage.setItem('debter_v1_current_user', JSON.stringify(user));
    } catch (err) {
      console.error("Failed to write persistent session:", err);
    }
    onAuthSuccess(user);
  };

  const { state, actions } = useAuth({ onAuthSuccess: handleInterceptAuthSuccess, lang });
  
  const {
    isRegistering,
    identifier,
    fullName, 
    password,
    email,
    businessName: formBusinessName,
    location, 
    errorMsg,
    successMsg,
    loading,
    newPassword,
    confirmPassword,
    changePasswordError,
    changePasswordLoading,
    mustChangePassword
  } = state;

  const {
    setIsRegistering,
    setIdentifier,
    setFullName, 
    setPassword,
    setEmail,
    setBusinessName, 
    setLocation, 
    handleSubmit,
    verifyUserExists,
    updatePassword, 
    setNewPassword,
    setConfirmPassword,
    setMustChangePassword,
    setChangePasswordError
  } = actions as any;

  useEffect(() => {
    try {
      const persistedUser = localStorage.getItem('debter_v1_current_user');
      if (persistedUser) {
        const parsedUser: UserProfile = JSON.parse(persistedUser);
        if (parsedUser && !(parsedUser as any).must_change_password) {
          onAuthSuccess(parsedUser);
        } else if (parsedUser && (parsedUser as any).must_change_password) {
          setMustChangePassword(true);
        }
      }
    } catch (e) {
      console.error("Failed to restore session profile:", e);
      localStorage.removeItem('debter_v1_current_user'); 
    }
  }, [onAuthSuccess, setMustChangePassword]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    setChangePasswordError('');
  }, [isRegistering, mustChangePassword, setChangePasswordError]);

  const handleRequestPasswordChange = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation(); 
    setChangePasswordError('');

    if (!identifier || identifier.trim() === '') {
      setChangePasswordError(t?.errorIdEmpty || 'Please fill in your Phone Number or Email address first.');
      return;
    }

    setIsVerifying(true);
    try {
      const userExists = verifyUserExists ? await verifyUserExists(identifier) : false;
      if (!userExists) {
        setChangePasswordError(t?.errorAccessDenied || 'Access Denied: No profile registry found matching this identifier.');
        return;
      }
      setMustChangePassword(true);
    } catch (err: any) {
      setChangePasswordError(t?.errorValidationFailed || 'User validation failed. Please check network connections.');
    } finally {
      setIsVerifying(false);
    }
  };

  const toggleLanguage = () => {
    if (onLangChange) {
      onLangChange(lang === 'en' ? 'am' : 'en');
    }
  };

  const getViewModeText = () => {
    if (mustChangePassword) return t?.resetPassword || 'Reset Password';
    if (isRegistering) return t?.signup || 'Sign Up';
    return t?.login || 'Login';
  };

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 w-full h-full bg-slate-950 flex flex-col justify-between p-6 sm:p-12 z-50 select-none overflow-x-hidden ${
        mustChangePassword ? 'overflow-y-hidden' : isRegistering ? 'overflow-y-auto' : 'overflow-y-hidden'
      }`}
    >
      <div className="absolute -right-32 -top-32 w-[600px] h-[600px] bg-[#1a5fb4]/10 rounded-full blur-[140px] pointer-events-none animate-pulse" style={{ animationDuration: '6000ms' }} />
      <div className="absolute -left-40 -bottom-40 w-[500px] h-[500px] bg-slate-900/60 rounded-full blur-[100px] pointer-events-none" />
      
      {/* HEADER SECTION WITH BRANDING AND TOGGLE SWITCH STYLE */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between relative z-20 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative group">
            <div className="absolute inset-0 bg-[#1a5fb4]/20 rounded-xl blur-md opacity-70 group-hover:scale-110 transition-transform" />
            <div className="relative bg-slate-900 p-2 rounded-xl border border-slate-800">
              <DebterIcon size="sm" /> 
            </div>
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-black text-white tracking-tight uppercase truncate">{t?.appName || 'Habesha Ledger Pro'}</h2>
            <p className="text-[9px] font-mono font-bold text-slate-500 tracking-widest uppercase">{getViewModeText()}</p>
          </div>
        </div>

        {/* TOGGLE SWITCH STYLE SELECTOR */}
        {onLangChange && (
          <div className="flex items-center gap-2 relative z-30 pointer-events-auto">
            <button
              type="button"
              onClick={toggleLanguage}
              className="relative w-20 h-7 bg-slate-900/90 rounded-full p-1 border border-slate-800/80 cursor-pointer outline-none transition-all duration-300"
            >
              {/* Dynamic sliding track knob */}
              <div 
                className={`absolute top-0.5 bottom-0.5 left-0.5 rounded-full bg-[#1a5fb4] shadow-md transition-all duration-300 transform w-[36px] ${
                  lang === 'am' ? 'translate-x-[38px]' : 'translate-x-0'
                }`}
              />
              
              {/* Labels sitting over the slider */}
              <div className="absolute inset-0 flex items-center justify-between px-2.5 text-[8.5px] font-mono font-black tracking-tighter uppercase select-none pointer-events-none">
                <span className={`transition-colors duration-200 ${lang === 'en' ? 'text-white font-black' : 'text-slate-500 font-medium'}`}>EN</span>
                <span className={`transition-colors duration-200 ${lang === 'am' ? 'text-white font-black' : 'text-slate-500 font-medium'}`}>አማ</span>
              </div>
            </button>
          </div>
        )}
      </div>

      <div className={`w-full max-w-md mx-auto relative z-20 space-y-5 ${mustChangePassword ? 'my-auto py-2' : 'my-auto py-8'}`}>
        {mustChangePassword ? (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white tracking-tight">
                {t?.updateSecurity || 'Update Account Security'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed truncate">
                {t?.newPasswordFor || 'New password for:'} <span className="text-[#1a5fb4] font-mono font-bold">{identifier}</span>
              </p>
            </div>

            {changePasswordError && (
              <div className="text-xs font-semibold text-rose-400 bg-rose-950/30 border border-rose-900/40 rounded-xl p-3 text-center tracking-wide backdrop-blur-xs select-text pointer-events-auto relative z-30">
                {changePasswordError.includes('https://t.me/') ? (
                  <span className="inline">
                    {changePasswordError.split('https://t.me/')[0]}
                    <a 
                      href="https://t.me/debter16" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[#1a5fb4] underline hover:text-white mx-1 font-bold inline pointer-events-auto cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      https://t.me/debter16
                    </a>
                    {changePasswordError.split('https://t.me/debter16')[1] || ''}
                  </span>
                ) : (
                  changePasswordError
                )}
              </div>
            )}

            <form onSubmit={(e) => updatePassword(e, t)} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
                  {t?.newPasswordLabel || 'New Password'}
                </label>
                <div className="relative group">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-[#1a5fb4] transition-colors" />
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder={t?.placeholderPassword || "••••••••••••"} 
                    className="w-full pl-12 pr-4 py-3 bg-slate-900/40 border border-slate-800 rounded-xl outline-none text-sm font-bold text-white focus:bg-slate-900/80 focus:border-[#1a5fb4] transition-all" 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
                  {t?.confirmPasswordLabel || 'Confirm Password'}
                </label>
                <div className="relative group">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-[#1a5fb4] transition-colors" />
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder={t?.placeholderPassword || "••••••••••••"} 
                    className="w-full pl-12 pr-4 py-3 bg-slate-900/40 border border-slate-800 rounded-xl outline-none text-sm font-bold text-white focus:bg-slate-900/80 focus:border-[#1a5fb4] transition-all" 
                    required 
                  />
                </div>
              </div>

              <button type="submit" disabled={changePasswordLoading} className="w-full bg-[#1a5fb4] hover:bg-[#1a5fb4]/90 text-white font-mono font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest disabled:opacity-50 mt-4 shadow-[0_4px_20px_rgba(26,95,180,0.25)] flex items-center justify-center cursor-pointer">
                {changePasswordLoading ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-white stroke-[2.5]" />
                    {t?.confirmChangeBtn || 'Confirm Change'}
                  </span>
                )}
              </button>
            </form>
          </div>
        ) : (
          <>
            {(errorMsg || changePasswordError) && (
              <div className="text-xs font-semibold text-rose-400 bg-rose-950/30 border border-rose-900/40 rounded-xl p-4 text-center tracking-wide animate-fade-in backdrop-blur-xs select-text pointer-events-auto relative z-30">
                {(() => {
                  const activeError = errorMsg || changePasswordError;
                  if (activeError.includes('https://t.me/')) {
                    return (
                      <span className="inline">
                        {activeError.split('https://t.me/')[0]}
                        <a 
                          href="https://t.me/debter16" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[#1a5fb4] underline hover:text-white mx-1 font-bold inline pointer-events-auto cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          https://t.me/debter16
                        </a>
                        {activeError.split('https://t.me/debter16')[1] || ''}
                      </span>
                    );
                  }
                  return activeError;
                })()}
              </div>
            )}
            {successMsg && (
              <div className="text-xs font-semibold text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 rounded-xl p-4 text-center tracking-wide animate-fade-in backdrop-blur-xs">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegistering && (
                <div className="space-y-4 border-b border-slate-900 pb-5 mb-5 animate-fade-in">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">{t?.fullNameLabel || 'Full Name'}</label>
                    <div className="relative group">
                      <Contact className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-[#1a5fb4] transition-colors" />
                      <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t?.namePlaceholder} className="w-full pl-12 pr-4 py-3.5 bg-slate-900/40 border border-slate-800 rounded-xl outline-none text-sm font-medium text-white focus:bg-slate-900/80 focus:border-[#1a5fb4] transition-all" required={isRegistering} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">{t?.businessName || 'Business Name'}</label>
                    <div className="relative group">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-[#1a5fb4] transition-colors" />
                      <input type="text" value={formBusinessName} onChange={(e) => setBusinessName(e.target.value)} placeholder={t?.shopNamePlaceholder} className="w-full pl-12 pr-4 py-3.5 bg-slate-900/40 border border-slate-800 rounded-xl outline-none text-sm font-medium text-white focus:bg-slate-900/80 focus:border-[#1a5fb4] transition-all" required={isRegistering} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">{t?.location || 'Location'}</label>
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-[#1a5fb4] transition-colors" />
                      <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t?.locationPlaceholder} className="w-full pl-12 pr-4 py-3.5 bg-slate-900/40 border border-slate-800 rounded-xl outline-none text-sm font-medium text-white focus:bg-slate-900/80 focus:border-[#1a5fb4] transition-all" required={isRegistering} />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">{t?.phoneOrEmail || 'Phone Number or Email'}</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-[#1a5fb4] transition-colors" />
                  <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder={t?.phonePlaceholder} className="w-full pl-12 pr-4 py-3.5 bg-slate-900/40 border border-slate-800 rounded-xl outline-none text-sm font-bold text-white focus:bg-slate-900/80 focus:border-[#1a5fb4] transition-all" required />
                </div>
              </div>

              {isRegistering && (
                <div className="space-y-2 animate-fade-in">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Email (Optional)</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-[#1a5fb4] transition-colors" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@shop.com" className="w-full pl-12 pr-4 py-3.5 bg-slate-900/40 border border-slate-800 rounded-xl outline-none text-sm font-medium text-white focus:bg-slate-900/80 focus:border-[#1a5fb4] transition-all" />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">{t?.password || 'Password'}</label>
                  {!isRegistering && (
                    <button
                      type="button" 
                      onClick={handleRequestPasswordChange}
                      disabled={isVerifying}
                      className="text-[10px] font-sans font-bold text-[#1a5fb4] hover:text-white transition-colors cursor-pointer outline-none focus:underline flex items-center gap-1 relative z-30 pointer-events-auto disabled:opacity-50"
                    >
                      {isVerifying && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                      {t?.changePasswordLink || 'Change password?'}
                    </button>
                  )}
                </div>
                
                <div className="relative group">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-[#1a5fb4] transition-colors" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" className="w-full pl-12 pr-4 py-3.5 bg-slate-900/40 border border-slate-800 rounded-xl outline-none text-sm font-bold text-white focus:bg-slate-900/80 focus:border-[#1a5fb4] transition-all" required />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-[#1a5fb4] hover:bg-[#1a5fb4]/90 text-white font-mono font-bold py-4 px-4 rounded-xl text-xs uppercase tracking-widest mt-8 shadow-[0_4px_20px_rgba(26,95,180,0.25)] flex items-center justify-center cursor-pointer relative z-30 pointer-events-auto">
                {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-white stroke-[2.5]" />{isRegistering ? (t?.signup || 'Sign Up') : (t?.login || 'Login')}</span>}
              </button>
            </form>
          </>
        )}
      </div>

      <div className="w-full max-w-md mx-auto text-center pt-4 relative z-20 border-t border-slate-900 flex-shrink-0">
        {mustChangePassword ? (
          <button type="button" onClick={() => setMustChangePassword(false)} className="text-slate-500 hover:text-white text-xs font-bold tracking-wide uppercase transition-colors cursor-pointer relative z-30 pointer-events-auto">
            {t?.cancelReturn || 'Cancel and Return'}
          </button>
        ) : (
          <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="text-slate-500 hover:text-white text-xs font-bold tracking-wide uppercase transition-colors pointer-events-auto cursor-pointer relative z-30">{isRegistering ? (t?.hasAccount || 'Already have an account? Login') : (t?.noAccount || "Don't have an account? Register")}</button>
        )}
      </div>
    </div>
  );
}
