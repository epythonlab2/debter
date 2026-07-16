// src/components/auth/RegisterForm.tsx
import React, { useEffect } from 'react';
import { Contact, Briefcase, MapPin, User, Mail, KeyRound, Loader2, TrendingUp, Eye, EyeOff } from 'lucide-react';

interface RegisterFormProps {
  t?: any;
  fullName: string;
  formBusinessName: string;
  location: string;
  email: string;
  identifier: string;
  password: React.ComponentState;
  nameError: string;
  businessError: string;
  locationError: string;
  emailError: string;
  passwordErrorMsg: string;
  localValidationError: string;
  checkingPhone: boolean;
  showPassword: boolean;
  loading: boolean;
  setFullName: (val: string) => void;
  setBusinessName: (val: string) => void;
  setLocation: (val: string) => void;
  setEmail: (val: string) => void;
  setIdentifier: (val: string) => void;
  setPassword: (val: string) => void;
  setLocalValidationError: (val: string) => void;
  setIsIdentifierValid: (val: boolean) => void;
  setShowPassword: (val: boolean) => void;
  checkFullName: (val: string) => boolean;
  checkBusinessName: (val: string) => boolean;
  checkLocation: (val: string) => boolean;
  checkEmail: (val: string) => boolean;
  checkIdentifier: (val: string) => Promise<boolean>;
  checkPassword: (val: string) => boolean;
  
  // NEW: Platform-agnostic callback to handle native auto-detection
  onPhoneAutoDetect?: () => Promise<string | null>;
}

export function RegisterForm({
  t, fullName, formBusinessName, location, email, identifier, password,
  nameError, businessError, locationError, emailError, passwordErrorMsg,
  localValidationError, checkingPhone, showPassword, loading,
  setFullName, setBusinessName, setLocation, setEmail, setIdentifier, setPassword,
  setLocalValidationError, setIsIdentifierValid, setShowPassword,
  checkFullName, checkBusinessName, checkLocation, checkEmail, checkIdentifier, checkPassword,
  onPhoneAutoDetect
}: RegisterFormProps) {

  // Helper to dynamically check if the user is typing a phone number
  const isPhonePattern = (val: string) => {
    // If it starts with a plus, space, or digit, treat it as a phone input
    return /^[+\d\s]/.test(val);
  };

  // Trigger Native Android Auto-detection on focus
  const handleIdentifierFocus = async () => {
    // If the parent screen provided an auto-detection utility, trigger it here
    if (onPhoneAutoDetect) {
      try {
        const detectedPhone = await onPhoneAutoDetect();
        if (detectedPhone) {
          // Update your React state with the detected phone number
          setIdentifier(detectedPhone);
          setLocalValidationError('');
          setIsIdentifierValid(false);
        }
      } catch (err) {
        console.warn("Native phone hint selection failed or was closed:", err);
      }
    }
  };

  return (
    <>
      <div className="space-y-4 border-b border-slate-800/60 pb-5 mb-5 animate-fade-in">
        <div className="space-y-2">
          <label className="block text-xs font-semibold tracking-wider text-blue-200/60">{t?.fullNameLabel || 'Full Name'}</label>
          <div className="relative group">
            <Contact className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              value={fullName} 
              onChange={(e) => { setFullName(e.target.value); if (nameError) checkFullName(e.target.value); }} 
              onBlur={(e) => checkFullName(e.target.value)} 
              placeholder={t?.namePlaceholder || "First Last"} 
              className={`w-full pl-12 pr-4 py-3.5 bg-[#021126]/40 border rounded-xl text-sm text-white ${nameError ? 'border-rose-500/50' : 'border-slate-800/80'}`} 
              required 
            />
          </div>
          {nameError && <p className="text-xs font-medium text-rose-400 pt-0.5">{nameError}</p>}
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold tracking-wider text-blue-200/60">{t?.businessName || 'Business Name'}</label>
          <div className="relative group">
            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              value={formBusinessName} 
              onChange={(e) => { setBusinessName(e.target.value); if (businessError) checkBusinessName(e.target.value); }} 
              onBlur={(e) => checkBusinessName(e.target.value)} 
              placeholder={t?.shopNamePlaceholder || "Shop Name"} 
              className={`w-full pl-12 pr-4 py-3.5 bg-[#021126]/40 border rounded-xl text-sm text-white ${businessError ? 'border-rose-500/50' : 'border-slate-800/80'}`} 
              required 
            />
          </div>
          {businessError && <p className="text-xs font-medium text-rose-400 pt-0.5">{businessError}</p>}
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold tracking-wider text-blue-200/60">{t?.location || 'Location'}</label>
          <div className="relative group">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              value={location} 
              onChange={(e) => { setLocation(e.target.value); if (locationError) checkLocation(e.target.value); }} 
              onBlur={(e) => checkLocation(e.target.value)} 
              placeholder={t?.locationPlaceholder || "City, District"} 
              className={`w-full pl-12 pr-4 py-3.5 bg-[#021126]/40 border rounded-xl text-sm text-white ${locationError ? 'border-rose-500/50' : 'border-slate-800/80'}`} 
              required 
            />
          </div>
          {locationError && <p className="text-xs font-medium text-rose-400 pt-0.5">{locationError}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold tracking-wider text-blue-200/60">{t?.phoneOrEmail || 'Phone Number or Email'}</label>
        <div className="relative group">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            // 1. Dynamic input types optimized for hybrid/Android keyboards
            type={isPhonePattern(identifier) ? "tel" : "email"} 
            inputMode={isPhonePattern(identifier) ? "tel" : "email"}
            
            // 2. Browser/WebView OS Autofill tags
            name="username"
            id="username"
            autoComplete="username billing tel email"
            
            value={identifier} 
            onFocus={handleIdentifierFocus} // Trigger auto-detection here
            onChange={(e) => { 
              setIdentifier(e.target.value); 
              setLocalValidationError(''); 
              setIsIdentifierValid(false); 
            }} 
            onBlur={(e) => checkIdentifier(e.target.value)} 
            placeholder={t?.phonePlaceholder || "09xxxxxxxx"} 
            className={`w-full pl-12 py-3.5 bg-[#021126]/40 border rounded-xl text-sm text-white ${localValidationError ? 'border-rose-500/50' : 'border-slate-800/80'}`} 
            required 
          />
          {checkingPhone && <div className="absolute right-4 top-1/2 -translate-y-1/2"><Loader2 className="w-4 h-4 text-slate-500 animate-spin" /></div>}
        </div>
        {localValidationError && <p className="text-xs font-medium text-rose-400 pt-0.5">{localValidationError}</p>}
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold tracking-wider text-blue-200/60">{t?.ownerEmail || 'Owner Email'}</label>
        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="email" 
            name="email"
            autoComplete="email"
            value={email} 
            onChange={(e) => { setEmail(e.target.value); if (emailError) checkEmail(e.target.value); }} 
            onBlur={(e) => checkEmail(e.target.value)} 
            placeholder="owner@shop.com" 
            className={`w-full pl-12 pr-4 py-3.5 bg-[#021126]/40 border rounded-xl text-sm text-white ${emailError ? 'border-rose-500/50' : 'border-slate-800/80'}`} 
          />
        </div>
        {emailError && <p className="text-xs font-medium text-rose-400 pt-0.5">{emailError}</p>}
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold tracking-wider text-blue-200/60">{t?.password || 'Password'}</label>
        <div className="relative group">
          <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type={showPassword ? "text" : "password"} 
            name="new-password"
            autoComplete="new-password"
            value={password} 
            onChange={(e) => { setPassword(e.target.value); if (passwordErrorMsg) checkPassword(e.target.value); }} 
            onBlur={(e) => checkPassword(e.target.value)} 
            placeholder="••••••••••••" 
            className={`w-full pl-12 pr-12 py-3.5 bg-[#021126]/40 border rounded-xl text-sm text-white ${passwordErrorMsg ? 'border-rose-500/50' : 'border-slate-800/80'}`} 
            required 
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
        </div>
        {passwordErrorMsg && <p className="text-xs font-medium text-rose-400 pt-0.5">{passwordErrorMsg}</p>}
      </div>

      <button type="submit" disabled={loading || checkingPhone} className="w-full bg-[#024982] hover:bg-[#024982]/80 text-white font-bold py-4 rounded-xl text-sm mt-6 flex items-center justify-center transition-all">
        {loading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <span className="flex items-center gap-2"><TrendingUp className="w-5 h-5 stroke-[2.5]" />{t?.signup || 'Sign Up'}</span>}
      </button>
    </>
  );
}
