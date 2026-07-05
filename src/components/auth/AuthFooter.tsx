// src/components/auth/AuthFooter.tsx
import React from 'react';

interface AuthFooterProps {
  t?: any;
  lang: 'en' | 'am';
  mustChangePassword: boolean;
  registrationComplete: boolean;
  isRegistering: boolean;
  setMustChangePassword: (val: boolean) => void;
  setIsRegistering: (val: boolean) => void;
}

export function AuthFooter({
  t,
  lang,
  mustChangePassword,
  registrationComplete,
  isRegistering,
  setMustChangePassword,
  setIsRegistering,
}: AuthFooterProps) {
  return (
    <div className="w-full max-w-md mx-auto text-center pt-5 relative z-20 border-t border-slate-800/60 flex-shrink-0">
      {mustChangePassword ? (
        <button
          type="button"
          onClick={() => setMustChangePassword(false)}
          className="text-blue-200/60 hover:text-[#f5b700] text-sm font-medium tracking-wide transition-colors cursor-pointer relative z-30 pointer-events-auto"
        >
          {t?.cancelReturn || 'Cancel and Return'}
        </button>
      ) : registrationComplete ? (
        <span className="text-xs font-medium text-blue-200/60 tracking-wide">
          {lang === 'am' ? 'የደብተር መለያዎ ተፈጥሯል' : 'Account Created Successfully'}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setIsRegistering(!isRegistering)}
          className="text-blue-200/60 hover:text-white text-sm font-medium tracking-wide transition-colors pointer-events-auto cursor-pointer relative z-30"
        >
          {isRegistering
            ? t?.hasAccount || 'Already have an account? Login'
            : t?.noAccount || "Don't have an account? Register"}
        </button>
      )}
    </div>
  );
}
