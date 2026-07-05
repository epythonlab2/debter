// src/components/auth/ResetPasswordForm.tsx
import React from 'react';
import { KeyRound, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface ResetPasswordFormProps {
  t?: any;
  identifier: string;
  newPassword: React.ComponentState;
  confirmPassword: React.ComponentState;
  changePasswordLoading: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  setNewPassword: (val: string) => void;
  setConfirmPassword: (val: string) => void;
  setShowNewPassword: (val: boolean) => void;
  setShowConfirmPassword: (val: boolean) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function ResetPasswordForm({
  t,
  identifier,
  newPassword,
  confirmPassword,
  changePasswordLoading,
  showNewPassword,
  showConfirmPassword,
  setNewPassword,
  setConfirmPassword,
  setShowNewPassword,
  setShowConfirmPassword,
  onSubmit,
}: ResetPasswordFormProps) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-white">{t?.updateSecurity || 'Update Account Security'}</h3>
        <p className="text-sm font-light text-blue-200/70">
          {t?.newPasswordFor || 'New password for:'} <span className="text-[#f5b700] font-medium">{identifier}</span>
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-xs font-semibold tracking-wider text-blue-200/60">
            {t?.newPasswordLabel || 'New Password'}
          </label>
          <div className="relative group">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t?.placeholderPassword || '••••••••••••'}
              className="w-full pl-12 pr-12 py-3.5 bg-[#021126]/60 border border-slate-800/80 rounded-xl text-sm text-white outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold tracking-wider text-blue-200/60">
            {t?.confirmPasswordLabel || 'Confirm Password'}
          </label>
          <div className="relative group">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t?.placeholderPassword || '••••••••••••'}
              className="w-full pl-12 pr-12 py-3.5 bg-[#021126]/60 border border-slate-800/80 rounded-xl text-sm text-white outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={changePasswordLoading}
          className="w-full bg-[#024982] hover:bg-[#024982]/80 text-white font-bold py-4 rounded-xl text-sm mt-4 flex items-center justify-center transition-all"
        >
          {changePasswordLoading ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              {t?.confirmChangeBtn || 'Confirm Change'}
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
