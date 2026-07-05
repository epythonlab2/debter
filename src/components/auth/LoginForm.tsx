// src/components/auth/LoginForm.tsx
import React from 'react';
import { User, KeyRound, Loader2, TrendingUp, Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  t?: any;
  identifier: string;
  password: React.ComponentState;
  localValidationError: string;
  checkingPhone: boolean;
  showPassword: boolean;
  isVerifying: boolean;
  loading: boolean;
  passwordErrorMsg: string;
  setIdentifier: (val: string) => void;
  setPassword: (val: string) => void;
  setLocalValidationError: (val: string) => void;
  setIsIdentifierValid: (val: boolean) => void;
  setShowPassword: (val: boolean) => void;
  checkIdentifier: (val: string) => void;
  checkPassword: (val: string) => void;
  onRequestPasswordChange: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function LoginForm({
  t,
  identifier,
  password,
  localValidationError,
  checkingPhone,
  showPassword,
  isVerifying,
  loading,
  passwordErrorMsg,
  setIdentifier,
  setPassword,
  setLocalValidationError,
  setIsIdentifierValid,
  setShowPassword,
  checkIdentifier,
  checkPassword,
  onRequestPasswordChange,
}: LoginFormProps) {
  return (
    <>
      <div className="space-y-2">
        <label className="block text-xs font-semibold tracking-wider text-blue-200/60">
          {t?.phoneOrEmail || 'Phone Number or Email'}
        </label>
        <div className="relative group">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              setLocalValidationError('');
              setIsIdentifierValid(false);
            }}
            onBlur={(e) => checkIdentifier(e.target.value)}
            placeholder={t?.phonePlaceholder || '09xxxxxxxx'}
            className={`w-full pl-12 py-3.5 bg-[#021126]/40 border rounded-xl outline-none text-sm font-bold text-white transition-all ${
              localValidationError ? 'border-rose-500/50' : 'border-slate-800/80'
            } ${checkingPhone ? 'pr-12' : 'pr-4'}`}
            required
          />
          {checkingPhone && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
            </div>
          )}
        </div>
        {localValidationError && (
          <p className="text-xs font-medium text-rose-400 pt-0.5">{localValidationError}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="block text-xs font-semibold tracking-wider text-blue-200/60">
            {t?.password || 'Password'}
          </label>
          <button
            type="button"
            onClick={onRequestPasswordChange}
            disabled={isVerifying}
            className="text-xs font-bold text-[#f5b700] hover:text-white flex items-center gap-1 disabled:opacity-50"
          >
            {isVerifying && <Loader2 className="w-3 h-3 animate-spin" />}
            {t?.changePasswordLink || 'Change password?'}
          </button>
        </div>
        <div className="relative group">
          <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordErrorMsg) checkPassword(e.target.value);
            }}
            onBlur={(e) => checkPassword(e.target.value)}
            placeholder="••••••••••••"
            className={`w-full pl-12 pr-12 py-3.5 bg-[#021126]/40 border rounded-xl outline-none text-sm font-bold text-white ${
              passwordErrorMsg ? 'border-rose-500/50' : 'border-slate-800/80'
            }`}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {passwordErrorMsg && (
          <p className="text-xs font-medium text-rose-400 pt-0.5">{passwordErrorMsg}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || checkingPhone}
        className="w-full bg-[#024982] hover:bg-[#024982]/80 text-white font-bold py-4 rounded-xl text-sm mt-6 flex items-center justify-center transition-all"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        ) : (
          <span className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            {t?.login || 'Login'}
          </span>
        )}
      </button>
    </>
  );
}
