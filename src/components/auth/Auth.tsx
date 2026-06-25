// src/components/auth/Auth.tsx
import React, { useEffect, useRef, useState } from 'react';
import { User, MapPin, KeyRound, Contact, Mail, Briefcase, TrendingUp, Loader2, CheckCircle2, Eye, EyeOff, LogIn } from 'lucide-react'; 
import { UserProfile } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { DebterIcon } from '../layout/DebterIcon';
import { supabase } from '../../utils/supabaseClient'; // Ensure supabase is imported here

interface AuthProps {
  onAuthSuccess: (user: UserProfile) => void;
  t?: any;
  lang?: 'en' | 'am';
  onLangChange?: React.Dispatch<React.SetStateAction<'en' | 'am'>>;
}

export function Auth({ onAuthSuccess, t, lang = 'en', onLangChange }: AuthProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [checkingPhone, setCheckingPhone] = useState<boolean>(false);
  
  // Cache check to avoid redundant database hits on form submission
  const [isIdentifierValid, setIsIdentifierValid] = useState<boolean>(false);
  const [lastCheckedIdentifier, setLastCheckedIdentifier] = useState<string>('');
  
  // Controls keeping the success screen open post-registration
  const [registrationComplete, setRegistrationComplete] = useState<boolean>(false);

  // Specific error channels to avoid overlapping messages
  const [localValidationError, setLocalValidationError] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [businessError, setBusinessError] = useState<string>('');
  const [locationError, setLocationError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string>('');

  // States for password visibility toggle
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

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

  // Clear errors when context switches
  const clearAllLocalErrors = () => {
    setLocalValidationError('');
    setNameError('');
    setBusinessError('');
    setLocationError('');
    setEmailError('');
    setPasswordErrorMsg('');
    setIsIdentifierValid(false);
    setLastCheckedIdentifier('');
    setRegistrationComplete(false);
  };

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
    clearAllLocalErrors();
    setShowPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  }, [isRegistering, mustChangePassword, setChangePasswordError]);

  // Validates standard Ethiopian phone patterns (09..., 07..., or +251...) or falls back to basic email syntax
  const validatePhoneIdentifier = (input: string): boolean => {
    const cleaned = input.trim();
    if (!cleaned) return false;
    if (cleaned.includes('@')) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned);
    }
    const ethiopianPhoneRegex = /^(?:\+251[79]\d{8}|0[79]\d{8})$/;
    return ethiopianPhoneRegex.test(cleaned);
  };

  const validateFullName = (input: string): boolean => {
    const trimmed = input.trim();
    if (!trimmed) return false;
    const nameRegex = /^[a-zA-Z\u1200-\u137F\s\-]+$/;
    if (!nameRegex.test(trimmed)) return false;
    const nameParts = trimmed.split(/\s+/);
    return nameParts.length >= 2 && nameParts.every(part => part.length >= 2);
  };

  // --- ASYNC EXPLOIT & UNIQUE PHONE CHECKER ---
  const checkIdentifier = async (val: string) => {
    const cleanedVal = val.trim();
    
    if (isIdentifierValid && lastCheckedIdentifier === cleanedVal) {
      return true;
    }

    if (!validatePhoneIdentifier(cleanedVal)) {
      setLocalValidationError(t?.errorInvalidPhone || 'Please enter a valid phone number (09xxxxxxxx / +251xxxxxxxx) or email.');
      setIsIdentifierValid(false);
      return false;
    }

    if (isRegistering) {
      setCheckingPhone(true);
      try {
        const client = typeof supabase !== 'undefined' ? supabase : (window as any).supabase;
        if (client) {
          const { data, error } = await client
            .from('users')
            .select('id')
            .eq('identifier', cleanedVal)
            .maybeSingle();

          if (!error && data) {
            const dupMessage = lang === 'am'
              ? 'ይህ ስልክ ቁጥር ቀድሞ በሌላ መለያ ተመዝግቧል።'
              : 'This phone number is already registered to another account.';
            setLocalValidationError(dupMessage);
            setIsIdentifierValid(false);
            return false;
          }
        }
      } catch (err) {
        console.error("Async user duplicate lookup crashed:", err);
      } finally {
        setCheckingPhone(false);
      }
    }

    setLocalValidationError('');
    setIsIdentifierValid(true);
    setLastCheckedIdentifier(cleanedVal);
    return true;
  };

  const checkFullName = (val: string) => {
    if (!validateFullName(val)) {
      setNameError(t?.errorInvalidName || 'Enter your full first and last name. Numbers or symbols are not allowed.');
      return false;
    }
    setNameError('');
    return true;
  };

  const checkBusinessName = (val: string) => {
    if (!val || val.trim().length < 2) {
      setBusinessError(t?.errorInvalidBusiness || 'Business name must be at least 2 characters long.');
      return false;
    }
    setBusinessError('');
    return true;
  };

  const checkLocation = (val: string) => {
    if (!val || val.trim().length < 2) {
      setLocationError(t?.errorInvalidLocation || 'Please enter a valid shop address or city location.');
      return false;
    }
    setLocationError('');
    return true;
  };

  const checkEmail = (val: string) => {
    if (val && val.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val.trim())) {
        setEmailError(t?.errorInvalidEmail || 'Please provide a valid email format or leave it blank.');
        return false;
      }
    }
    setEmailError('');
    return true;
  };

  const checkPassword = (val: string) => {
    if (!val || val.length < 4) {
      setPasswordErrorMsg(t?.errorPasswordShort || 'Password security must be at least 4 characters.');
      return false;
    }
    setPasswordErrorMsg('');
    return true;
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (checkingPhone) return;
    
    const isIdValid = await checkIdentifier(identifier);
    let isRegValid = true;

    if (isRegistering) {
      const isNameValid = checkFullName(fullName);
      const isBizValid = checkBusinessName(formBusinessName);
      const isLocValid = checkLocation(location);
      const isMailValid = checkEmail(email);
      const isPassValid = checkPassword(password);
      
      isRegValid = isNameValid && isBizValid && isLocValid && isMailValid && isPassValid;
    }

    if (!isIdValid || !isRegValid) return;

    await handleSubmit(e);
    
    // If registering succeeded, explicitly pause on this panel to display success details
    if (isRegistering) {
      setRegistrationComplete(true);
    }
  };

  const handleUpdatePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setChangePasswordError('');

    if (!newPassword || newPassword.length < 4) {
      setChangePasswordError(t?.errorPasswordShort || 'New password security must be at least 4 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangePasswordError(t?.errorPasswordMismatch || 'Passwords do not match. Please verify.');
      return;
    }

    await updatePassword(e, t);
  };

  const handleRequestPasswordChange = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation(); 
    setChangePasswordError('');
    clearAllLocalErrors();

    if (!identifier || identifier.trim() === '') {
      setChangePasswordError(t?.errorIdEmpty || 'Please fill in your Phone Number or Email address first.');
      return;
    }

    if (!validatePhoneIdentifier(identifier)) {
      setLocalValidationError(t?.errorInvalidPhone || 'Please enter a valid phone number or identifier context.');
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

  const globalServerErr = errorMsg || changePasswordError;

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 w-full h-full bg-gradient-to-b from-[#070d19] to-[#040810] flex flex-col justify-between p-6 sm:p-12 z-50 select-none overflow-x-hidden font-sans ${
        mustChangePassword ? 'overflow-y-hidden' : isRegistering ? 'overflow-y-auto' : 'overflow-y-hidden'
      }`}
    >
      {/* Background Ambient Glows */}
      <div className="absolute -right-32 -top-32 w-[600px] h-[600px] bg-[#1a5fb4]/10 rounded-full blur-[140px] pointer-events-none animate-pulse" style={{ animationDuration: '6000ms' }} />
      <div className="absolute -left-40 -bottom-40 w-[500px] h-[500px] bg-blue-950/20 rounded-full blur-[100px] pointer-events-none" />
      
      {/* HEADER SECTION */}
      <div className="w-full max-w-xl mx-auto flex items-center justify-between relative z-20 flex-shrink-0 border-b border-gray-800/40 pb-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative group">
            <div className="absolute inset-0 bg-[#1a5fb4]/20 rounded-xl blur-md opacity-70 group-hover:scale-110 transition-transform" />
            <div className="relative bg-[#040810] p-2.5 rounded-xl border border-gray-800">
              <DebterIcon size="sm" /> 
            </div>
          </div>
          <div className="min-w-0">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-wider truncate">
              {t?.appName || 'Debter'}{' '}
            </h2>
            <p className="text-xs font-semibold tracking-widest text-gray-400 mt-0.5">{getViewModeText()}</p>
          </div>
        </div>

        {/* TOGGLE SWITCH STYLE SELECTOR */}
        {onLangChange && (
          <div className="flex items-center gap-2 relative z-30 pointer-events-auto">
            <button
              type="button"
              onClick={toggleLanguage}
              className="relative w-22 h-8 bg-[#040810]/90 rounded-full p-1 border border-gray-800 cursor-pointer outline-none transition-all duration-300"
            >
              <div 
                className={`absolute top-0.5 bottom-0.5 left-0.5 rounded-full bg-[#1a5fb4] shadow-md transition-all duration-300 transform w-[38px] ${
                  lang === 'am' ? 'translate-x-[42px]' : 'translate-x-0'
                }`}
              />
              <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-extrabold tracking-wider select-none pointer-events-none">
                <span className={`transition-colors duration-200 ${lang === 'en' ? 'text-white' : 'text-gray-500'}`}>EN</span>
                <span className={`transition-colors duration-200 ${lang === 'am' ? 'text-white' : 'text-gray-500'}`}>አማ</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* MIDDLE CONTAINER PANEL */}
      <div className={`w-full max-w-md mx-auto relative z-20 space-y-6 ${mustChangePassword ? 'my-auto py-2' : 'my-auto py-8'}`}>
        {mustChangePassword ? (
          <div className="space-y-5 animate-fade-in">
            <div className="space-y-1">
              <h3 className="text-xl md:text-2xl font-bold text-white tracking-wide">
                {t?.updateSecurity || 'Update Account Security'}
              </h3>
              <p className="text-sm md:text-base font-light tracking-wide text-gray-400 leading-relaxed truncate">
                {t?.newPasswordFor || 'New password for:'} <span className="text-[#f5b700] font-medium">{identifier}</span>
              </p>
            </div>

            {changePasswordError && (
              <div className="text-sm font-medium text-rose-400 bg-rose-950/20 border border-rose-900/30 rounded-xl p-4 text-center tracking-wide backdrop-blur-xs select-text pointer-events-auto relative z-30">
                {changePasswordError.includes('https://t.me/') ? (
                  <span className="inline">
                    {changePasswordError.split('https://t.me/')[0]}
                    <a 
                      href="https://t.me/debter16" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[#f5b700] underline hover:text-white mx-1 font-bold inline pointer-events-auto cursor-pointer"
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

            <form onSubmit={handleUpdatePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold tracking-wider text-gray-400">
                  {t?.newPasswordLabel || 'New Password'}
                </label>
                <div className="relative group">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#1a5fb4] transition-colors" />
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder={t?.placeholderPassword || "••••••••••••"} 
                    className="w-full pl-12 pr-12 py-3.5 bg-[#040810]/40 border border-gray-800 rounded-xl outline-none text-sm font-medium text-white focus:bg-[#040810]/80 focus:border-[#1a5fb4] transition-all" 
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold tracking-wider text-gray-400">
                  {t?.confirmPasswordLabel || 'Confirm Password'}
                </label>
                <div className="relative group">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#1a5fb4] transition-colors" />
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder={t?.placeholderPassword || "••••••••••••"} 
                    className="w-full pl-12 pr-12 py-3.5 bg-[#040810]/40 border border-gray-800 rounded-xl outline-none text-sm font-medium text-white focus:bg-[#040810]/80 focus:border-[#1a5fb4] transition-all" 
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={changePasswordLoading} className="w-full bg-[#1a5fb4] hover:bg-[#1a5fb4]/90 text-white font-bold py-4 px-4 rounded-xl text-sm tracking-wide disabled:opacity-50 mt-4 shadow-[0_4px_20px_rgba(26,95,180,0.25)] flex items-center justify-center cursor-pointer transition-all">
                {changePasswordLoading ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-white stroke-[2.5]" />
                    {t?.confirmChangeBtn || 'Confirm Change'}
                  </span>
                )}
              </button>
            </form>
          </div>
        ) : (
          <>
            {globalServerErr && (
              <div className="text-sm font-medium text-rose-400 bg-rose-950/20 border border-rose-900/30 rounded-xl p-4 text-center tracking-wide animate-fade-in backdrop-blur-xs select-text pointer-events-auto relative z-30">
                {globalServerErr.includes('https://t.me/') ? (
                  <span className="inline">
                    {globalServerErr.split('https://t.me/')[0]}
                    <a 
                      href="https://t.me/debter16" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[#f5b700] underline hover:text-white mx-1 font-bold inline pointer-events-auto cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      https://t.me/debter16
                    </a>
                    {globalServerErr.split('https://t.me/debter16')[1] || ''}
                  </span>
                ) : (
                  globalServerErr
                )}
              </div>
            )}

            {/* SUCCESS SCREEN INTERCEPT DISPLAY */}
            {registrationComplete && successMsg ? (
              <div className="space-y-6 text-center animate-fade-in p-2">
                <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-2xl p-6 backdrop-blur-xs flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 stroke-[2]" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-wide">
                    {t?.regSuccess}
                  </h3>
                  <p className="text-sm text-gray-300 leading-relaxed font-light tracking-wide">
                    {successMsg}
                  </p>
                </div>

                <button 
                  type="button" 
                  onClick={() => {
                    clearAllLocalErrors();
                    setIsRegistering(false);
                  }}
                  className="w-full bg-[#1a5fb4] hover:bg-[#1a5fb4]/90 text-white font-bold py-4 px-4 rounded-xl text-sm tracking-wide shadow-[0_4px_20px_rgba(26,95,180,0.25)] flex items-center justify-center gap-2 cursor-pointer relative z-30 transition-all duration-200 group"
                >
                  <LogIn className="w-5 h-5 text-white stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
                  {t?.login || 'Login Now'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {isRegistering && (
                  <div className="space-y-4 border-b border-gray-800/60 pb-5 mb-5 animate-fade-in">
                    
                    {/* FULL NAME */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold tracking-wider text-gray-400">{t?.fullNameLabel || 'Full Name'}</label>
                      <div className="relative group">
                        <Contact className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#1a5fb4] transition-colors" />
                        <input 
                          type="text" 
                          value={fullName} 
                          onChange={(e) => { setFullName(e.target.value); if (nameError) checkFullName(e.target.value); }} 
                          onBlur={(e) => checkFullName(e.target.value)}
                          placeholder={t?.namePlaceholder || "First Last"} 
                          className={`w-full pl-12 pr-4 py-3.5 bg-[#040810]/40 border rounded-xl outline-none text-sm font-medium text-white focus:bg-[#040810]/80 transition-all ${nameError ? 'border-rose-500/50 focus:border-rose-500' : 'border-gray-800 focus:border-[#1a5fb4]'}`}
                          required={isRegistering} 
                        />
                      </div>
                      {nameError && (
                        <p className="text-xs font-medium text-rose-400 animate-fade-in pt-0.5 tracking-wide">{nameError}</p>
                      )}
                    </div>

                    {/* BUSINESS NAME */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold tracking-wider text-gray-400">{t?.businessName || 'Business Name'}</label>
                      <div className="relative group">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#1a5fb4] transition-colors" />
                        <input 
                          type="text" 
                          value={formBusinessName} 
                          onChange={(e) => { setBusinessName(e.target.value); if (businessError) checkBusinessName(e.target.value); }} 
                          onBlur={(e) => checkBusinessName(e.target.value)}
                          placeholder={t?.shopNamePlaceholder || "Shop Name"} 
                          className={`w-full pl-12 pr-4 py-3.5 bg-[#040810]/40 border rounded-xl outline-none text-sm font-medium text-white focus:bg-[#040810]/80 transition-all ${businessError ? 'border-rose-500/50 focus:border-rose-500' : 'border-gray-800 focus:border-[#1a5fb4]'}`}
                          required={isRegistering} 
                        />
                      </div>
                      {businessError && (
                        <p className="text-xs font-medium text-rose-400 animate-fade-in pt-0.5 tracking-wide">{businessError}</p>
                      )}
                    </div>

                    {/* LOCATION */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold tracking-wider text-gray-400">{t?.location || 'Location'}</label>
                      <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#1a5fb4] transition-colors" />
                        <input 
                          type="text" 
                          value={location} 
                          onChange={(e) => { setLocation(e.target.value); if (locationError) checkLocation(e.target.value); }} 
                          onBlur={(e) => checkLocation(e.target.value)}
                          placeholder={t?.locationPlaceholder || "City, District"} 
                          className={`w-full pl-12 pr-4 py-3.5 bg-[#040810]/40 border rounded-xl outline-none text-sm font-medium text-white focus:bg-[#040810]/80 transition-all ${locationError ? 'border-rose-500/50 focus:border-rose-500' : 'border-gray-800 focus:border-[#1a5fb4]'}`}
                          required={isRegistering} 
                        />
                      </div>
                      {locationError && (
                        <p className="text-xs font-medium text-rose-400 animate-fade-in pt-0.5 tracking-wide">{locationError}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* IDENTIFIER */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold tracking-wider text-gray-400">{t?.phoneOrEmail || 'Phone Number or Email'}</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#1a5fb4] transition-colors" />
                    <input 
                      type="text" 
                      value={identifier} 
                      onChange={(e) => { 
                        setIdentifier(e.target.value); 
                        if (localValidationError) setLocalValidationError('');
                        setIsIdentifierValid(false); 
                      }} 
                      onBlur={(e) => checkIdentifier(e.target.value)}
                      placeholder={t?.phonePlaceholder || "09xxxxxxxx"} 
                      className={`w-full pl-12 py-3.5 bg-[#040810]/40 border rounded-xl outline-none text-sm font-bold text-white focus:bg-[#040810]/80 transition-all ${localValidationError ? 'border-rose-500/50 focus:border-rose-500' : 'border-gray-800 focus:border-[#1a5fb4]'} ${checkingPhone ? 'pr-12' : 'pr-4'}`}
                      required 
                    />
                    {checkingPhone && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                      </div>
                    )}
                  </div>
                  {localValidationError && (
                    <p className="text-xs font-medium text-rose-400 animate-fade-in pt-0.5 tracking-wide">{localValidationError}</p>
                  )}
                </div>

                {/* OPTIONAL EMAIL */}
                {isRegistering && (
                  <div className="space-y-2 animate-fade-in">
                    <label className="block text-xs font-semibold tracking-wider text-gray-400">{t.ownerEmail}</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#1a5fb4] transition-colors" />
                      <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => { setEmail(e.target.value); if (emailError) checkEmail(e.target.value); }} 
                        onBlur={(e) => checkEmail(e.target.value)}
                        placeholder="owner@shop.com" 
                        className={`w-full pl-12 pr-4 py-3.5 bg-[#040810]/40 border rounded-xl outline-none text-sm font-medium text-white focus:bg-[#040810]/80 transition-all ${emailError ? 'border-rose-500/50 focus:border-rose-500' : 'border-gray-800 focus:border-[#1a5fb4]'}`}
                      />
                    </div>
                    {emailError && (
                      <p className="text-xs font-medium text-rose-400 animate-fade-in pt-0.5 tracking-wide">{emailError}</p>
                    )}
                  </div>
                )}

                {/* PASSWORD */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-semibold tracking-wider text-gray-400">{t?.password || 'Password'}</label>
                    {!isRegistering && (
                      <button
                        type="button" 
                        onClick={handleRequestPasswordChange}
                        disabled={isVerifying}
                        className="text-xs font-bold text-[#f5b700] hover:text-white transition-colors cursor-pointer outline-none focus:underline flex items-center gap-1 relative z-30 pointer-events-auto disabled:opacity-50"
                      >
                        {isVerifying && <Loader2 className="w-3 h-3 animate-spin" />}
                        {t?.changePasswordLink || 'Change password?'}
                      </button>
                    )}
                  </div>
                  
                  <div className="relative group">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#1a5fb4] transition-colors" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={(e) => { setPassword(e.target.value); if (passwordErrorMsg) checkPassword(e.target.value); }} 
                      onBlur={(e) => checkPassword(e.target.value)}
                      placeholder="••••••••••••" 
                      className={`w-full pl-12 pr-12 py-3.5 bg-[#040810]/40 border rounded-xl outline-none text-sm font-bold text-white focus:bg-[#040810]/80 transition-all ${passwordErrorMsg ? 'border-rose-500/50 focus:border-rose-500' : 'border-gray-800 focus:border-[#1a5fb4]'}`}
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrorMsg && (
                    <p className="text-xs font-medium text-rose-400 animate-fade-in pt-0.5 tracking-wide">{passwordErrorMsg}</p>
                  )}
                </div>

                <button type="submit" disabled={loading || checkingPhone} className="w-full bg-[#1a5fb4] hover:bg-[#1a5fb4]/90 text-white font-bold py-4 px-4 rounded-xl text-sm tracking-wide mt-6 shadow-[0_4px_20px_rgba(26,95,180,0.25)] flex items-center justify-center cursor-pointer relative z-30 pointer-events-auto disabled:opacity-50 transition-all">
                  {loading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <span className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-white stroke-[2.5]" />{isRegistering ? (t?.signup || 'Sign Up') : (t?.login || 'Login')}</span>}
                </button>
              </form>
            )}
          </>
        )}
      </div>

      {/* FOOTER */}
      <div className="w-full max-w-md mx-auto text-center pt-5 relative z-20 border-t border-gray-800/60 flex-shrink-0">
        {mustChangePassword ? (
          <button type="button" onClick={() => setMustChangePassword(false)} className="text-gray-400 hover:text-[#f5b700] text-sm font-medium tracking-wide transition-colors cursor-pointer relative z-30 pointer-events-auto">
            {t?.cancelReturn || 'Cancel and Return'}
          </button>
        ) : registrationComplete ? (
          <span className="text-xs font-medium text-gray-400 tracking-wide">
            {lang === 'am' ? 'የደብተር መለያዎ ተፈጥሯል' : 'Account Created Successfully'}
          </span>
        ) : (
          <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="text-gray-400 hover:text-white text-sm font-medium tracking-wide transition-colors pointer-events-auto cursor-pointer relative z-30">
            {isRegistering ? (t?.hasAccount || 'Already have an account? Login') : (t?.noAccount || "Don't have an account? Register")}
          </button>
        )}
      </div>
    </div>
  );
}
