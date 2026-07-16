// src/components/auth/Auth.tsx
import React, { useEffect, useRef, useState } from 'react';
import { LogIn, CheckCircle2 } from 'lucide-react'; 
import { UserProfile } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { DebterIcon } from '../layout/DebterIcon';
import { supabase } from '../../utils/supabaseClient';

// Import newly separated view modules
import { AuthFooter } from './AuthFooter';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ResetPasswordForm } from './ResetPasswordForm';

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
  
  const [isIdentifierValid, setIsIdentifierValid] = useState<boolean>(false);
  const [lastCheckedIdentifier, setLastCheckedIdentifier] = useState<string>('');
  const [registrationComplete, setRegistrationComplete] = useState<boolean>(false);

  // Field validation states
  const [localValidationError, setLocalValidationError] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [businessError, setBusinessError] = useState<string>('');
  const [locationError, setLocationError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string>('');

  // Password visibility states
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  
  const [role, setRole] = useState<'admin' | 'lottery'>('admin');

  const handleInterceptAuthSuccess = (user: UserProfile) => {
    // Check both potential approval property variants for security
    const isUnapproved = user && (user.approved === false || (user as any).is_approve === false);
    
    if (isUnapproved && user.role !== 'super_admin') {
      const notApprovedMsg = lang === 'am'
        ? 'መለያዎ ገና አልጸደቀም። እባክዎ አስተዳዳሪውን ያነጋግሩ።'
        : 'Your account is pending approval. Please contact the administrator.';
      setLocalValidationError(notApprovedMsg);
      localStorage.removeItem('debter_v1_current_user');
      return;
    }

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
    setChangePasswordError,
    logout 
  } = actions as any;

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

  // --- HYDRATION HOOK (HARDENED REJECTION SCHEME) ---
  useEffect(() => {
    try {
      const persistedUser = localStorage.getItem('debter_v1_current_user');
      if (persistedUser) {
        const parsedUser: UserProfile = JSON.parse(persistedUser);
        
        // Match defensive structural checks exactly with useLocalStoragePipeline
        const isUnapproved = parsedUser && (parsedUser.approved === false || (parsedUser as any).is_approve === false);

        if (isUnapproved && parsedUser.role !== 'super_admin') {
          localStorage.removeItem('debter_v1_current_user');
          setLocalValidationError(lang === 'am' ? 'መለያዎ ገና አልጸደቀም።' : 'Your account is pending approval.');
          
          if (logout) {
            logout();
          }
          return; 
        }

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
  }, [onAuthSuccess, setMustChangePassword, lang, logout]); 

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

  // Validations
  const validatePhoneIdentifier = (input: string): boolean => {
    const cleaned = input.trim();
    if (!cleaned) return false;
    if (cleaned.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned);
    return /^(?:\+251[79]\d{8}|0[79]\d{8})$/.test(cleaned);
  };

  const validateFullName = (input: string): boolean => {
    const trimmed = input.trim();
    if (!trimmed) return false;
    const nameParts = trimmed.split(/\s+/);
    return /^[a-zA-Z\u1200-\u137F\s\-]+$/.test(trimmed) && nameParts.length >= 2 && nameParts.every(part => part.length >= 2);
  };

  const checkIdentifier = async (val: string) => {
    const cleanedVal = val.trim();
    if (isIdentifierValid && lastCheckedIdentifier === cleanedVal) return true;
    if (!validatePhoneIdentifier(cleanedVal)) {
      setLocalValidationError(t?.errorInvalidPhone);
      setIsIdentifierValid(false);
      return false;
    }

    if (isRegistering) {
      setCheckingPhone(true);
      try {
        const client = typeof supabase !== 'undefined' ? supabase : (window as any).supabase;
        if (client) {
          const { data, error } = await client.from('users').select('id').eq('identifier', cleanedVal).maybeSingle();
          if (!error && data) {
            setLocalValidationError(lang === 'am' ? 'ይህ ስልክ ቁጥር ቀድሞ በሌላ መለያ ተመዝግቧል።' : 'This phone number is already registered to another account.');
            setIsIdentifierValid(false);
            return false;
          }
        }
      } catch (err) {
        console.error("User duplicate lookup crashed:", err);
      } finally {
        setCheckingPhone(false);
      }
    }
    setLocalValidationError('');
    setIsIdentifierValid(true);
    setLastCheckedIdentifier(cleanedVal);
    return true;
  };

  const checkFullName = (val: string) => { if (!validateFullName(val)) { setNameError(t?.errorInvalidName); return false; } setNameError(''); return true; };
  const checkBusinessName = (val: string) => { if (!val || val.trim().length < 2) { setBusinessError(t?.errorInvalidBusiness); return false; } setBusinessError(''); return true; };
  const checkLocation = (val: string) => { if (!val || val.trim().length < 2) { setLocationError(t?.errorInvalidLocation); return false; } setLocationError(''); return true; };
  const checkEmail = (val: string) => { if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) { setEmailError(t?.errorInvalidEmail); return false; } setEmailError(''); return true; };
  const checkPassword = (val: string) => { if (!val || val.length < 4) { setPasswordErrorMsg(t?.errorPasswordShort); return false; } setPasswordErrorMsg(''); return true; };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (checkingPhone) return;
    
    const isIdValid = await checkIdentifier(identifier);
    let isRegValid = true;

    if (isRegistering) {
      isRegValid = checkFullName(fullName) && checkBusinessName(formBusinessName) && checkLocation(location) && checkEmail(email) && checkPassword(password);
    }

    if (!isIdValid || !isRegValid) return;
    await handleSubmit(e);
    
    if (isRegistering) setRegistrationComplete(true);
  };

  const handleUpdatePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setChangePasswordError('');
    if (!newPassword || newPassword.length < 4) { setChangePasswordError(t?.errorPasswordShort); return; }
    if (newPassword !== confirmPassword) { setChangePasswordError(t?.errorPasswordMismatch); return; }
    await updatePassword(e, t);
  };

  const handleRequestPasswordChange = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); e.stopPropagation();
    setChangePasswordError('');
    clearAllLocalErrors();

    if (!identifier || identifier.trim() === '') { setChangePasswordError(t?.errorIdEmpty); return; }
    if (!validatePhoneIdentifier(identifier)) { setLocalValidationError(t?.errorInvalidPhone); return; }

    setIsVerifying(true);
    try {
      const userExists = verifyUserExists ? await verifyUserExists(identifier) : false;
      if (!userExists) { setChangePasswordError(t?.errorAccessDenied); return; }
      setMustChangePassword(true);
    } catch {
      setChangePasswordError(t?.errorValidationFailed);
    } finally {
      setIsVerifying(false);
    }
  };

  const globalServerErr = errorMsg || changePasswordError;

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 w-full h-full bg-[#021b3d] flex flex-col justify-between p-6 sm:p-12 z-50 select-none overflow-x-hidden font-sans ${
        mustChangePassword ? 'overflow-y-hidden' : isRegistering ? 'overflow-y-auto' : 'overflow-y-hidden'
      }`}
    >
      {/* HEADER SECTION */}
      <div className="w-full max-w-xl mx-auto flex items-center justify-between relative z-20 flex-shrink-0 border-b border-slate-800/60 pb-4">
        <div className="flex items-center gap-4 min-w-0">
          <DebterIcon size="sm" /> 
          <div className="min-w-0">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-wider truncate">{t?.appName || 'Debter'}</h2>
            <p className="text-xs font-semibold tracking-widest text-blue-200/60 mt-0.5">
              {mustChangePassword ? (t?.resetPassword || 'Reset Password') : isRegistering ? (t?.signup || 'Sign Up') : (t?.login || 'Login')}
            </p>
          </div>
        </div>

        {onLangChange && (
          <button type="button" onClick={() => onLangChange(lang === 'en' ? 'am' : 'en')} className="relative w-22 h-8 bg-[#021126] rounded-full p-1 border border-slate-800/80 cursor-pointer outline-none">
            <div className={`absolute top-0.5 bottom-0.5 left-0.5 rounded-full bg-[#024982] shadow-sm transition-all duration-300 w-[38px] ${lang === 'am' ? 'translate-x-[42px]' : 'translate-x-0'}`} />
            <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-extrabold tracking-wider pointer-events-none">
              <span className={lang === 'en' ? 'text-white' : 'text-blue-200/40'}>EN</span>
              <span className={lang === 'am' ? 'text-white' : 'text-blue-200/40'}>አማ</span>
            </div>
          </button>
        )}
      </div>

      {/* MIDDLE CONTAINER PANEL */}
      <div className={`w-full max-w-md mx-auto relative z-20 space-y-6 ${mustChangePassword ? 'my-auto py-2' : 'my-auto py-8'}`}>
        {globalServerErr && (
          <div className="text-sm font-medium text-rose-400 bg-rose-950/20 border border-rose-900/30 rounded-xl p-4 text-center tracking-wide select-text relative z-30">
            {globalServerErr.includes('https://t.me/') ? (
              <span>
                {globalServerErr.split('https://t.me/')[0]}
                <a href="https://t.me/debter16" target="_blank" rel="noopener noreferrer" className="text-[#f5b700] underline mx-1 font-bold">https://t.me/debter16</a>
                {globalServerErr.split('https://t.me/debter16')[1] || ''}
              </span>
            ) : globalServerErr}
          </div>
        )}

        {mustChangePassword ? (
          <ResetPasswordForm 
            t={t} identifier={identifier} 
            newPassword={newPassword} 
            confirmPassword={confirmPassword}
            changePasswordLoading={changePasswordLoading} 
            showNewPassword={showNewPassword} 
            showConfirmPassword={showConfirmPassword}
            setNewPassword={setNewPassword} 
            setConfirmPassword={setConfirmPassword} 
            setShowNewPassword={setShowNewPassword} 
            setShowConfirmPassword={setShowConfirmPassword}
            onSubmit={handleUpdatePasswordSubmit}
          />
        ) : registrationComplete && successMsg ? (
          <div className="space-y-6 text-center p-2">
            <div className="bg-emerald-950/10 border border-emerald-900/30 rounded-2xl p-6 flex flex-col items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">{t?.regSuccess}</h3>
              <p className="text-sm text-blue-200/80 font-light">{successMsg}</p>
            </div>
            <button type="button" onClick={() => { clearAllLocalErrors(); setIsRegistering(false); }} className="w-full bg-[#024982] hover:bg-[#024982]/80 text-white font-bold py-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all duration-200 group">
              <LogIn className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              {t?.login || 'Login Now'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {isRegistering ? (
              <RegisterForm 
		  t={t} 
		  fullName={fullName} 
		  formBusinessName={formBusinessName} 
		  location={location} 
		  email={email} 
		  identifier={identifier} 
		  password={password}
		  nameError={nameError} 
		  businessError={businessError} 
		  locationError={locationError} 
		  emailError={emailError} 
		  passwordErrorMsg={passwordErrorMsg} 
		  localValidationError={localValidationError} 
		  checkingPhone={checkingPhone} 
		  showPassword={showPassword}
		  setFullName={setFullName} 
		  setBusinessName={setBusinessName} 
		  setLocation={setLocation} 
		  setEmail={setEmail} 
		  setIdentifier={setIdentifier} 
		  setPassword={setPassword} 
		  setLocalValidationError={setLocalValidationError} 
		  setIsIdentifierValid={setIsIdentifierValid} 
		  setShowPassword={setShowPassword}
		  checkFullName={checkFullName} 
		  checkBusinessName={checkBusinessName} 
		  checkLocation={checkLocation} 
		  checkEmail={checkEmail} 
		  checkIdentifier={checkIdentifier} 
		  checkPassword={checkPassword}
		  loading={loading}
		  
		/>
            ) : (
              <LoginForm 
                t={t} 
                identifier={identifier} 
                password={password} 
                localValidationError={localValidationError} 
                checkingPhone={checkingPhone} 
                showPassword={showPassword} 
                isVerifying={isVerifying} 
                loading={loading} 
                passwordErrorMsg={passwordErrorMsg}
                setIdentifier={setIdentifier} 
                setPassword={setPassword} 
                setLocalValidationError={setLocalValidationError} 
                setIsIdentifierValid={setIsIdentifierValid} 
                setShowPassword={setShowPassword}
                checkIdentifier={checkIdentifier} 
                checkPassword={checkPassword} 
	        onRequestPasswordChange={handleRequestPasswordChange}
              />
            )}
          </form>
        )}
      </div>

      {/* FOOTER SECTION */}
      <AuthFooter 
        t={t} lang={lang} 
        mustChangePassword={mustChangePassword} 
        registrationComplete={registrationComplete} 
        isRegistering={isRegistering}
        setMustChangePassword={setMustChangePassword} 
        setIsRegistering={setIsRegistering}
      />
    </div>
  );
}
