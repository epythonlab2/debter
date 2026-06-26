// src/components/SalesPersonForm.tsx
import React from 'react';
import { X } from 'lucide-react';

interface SalesPersonFormProps {
  isOpen: boolean;
  onClose: () => void;
  salesName: string;
  setSalesName: (val: string) => void;
  salesPhone: string;
  setSalesPhone: (val: string) => void;
  salesEmail: string;
  setSalesEmail: (val: string) => void;
  salesPassword: string;
  setSalesPassword: (val: string) => void;
  handleRegisterSalesperson: (e: React.FormEvent) => void;
  t: any;
}

/**
 * SalesPersonForm Component
 * Renders an optimized overlay modal sheet for creating and registering new shop sales personnel.
 */
export default function SalesPersonForm({
  isOpen, onClose, salesName, setSalesName, salesPhone, setSalesPhone,
  salesEmail, setSalesEmail, salesPassword, setSalesPassword,
  handleRegisterSalesperson, t
}: SalesPersonFormProps) {
  
  // Return early if the modal lifecycle state is disabled
  if (!isOpen) return null;

  // Modern input classes optimized for both light and dark backgrounds
  const baseInputClass = "w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 font-semibold text-sm placeholder:text-slate-400 placeholder:font-medium outline-none transition-all duration-200 focus:bg-white dark:focus:bg-slate-900 focus:border-[#1a5fb4] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#1a5fb4]/10 dark:focus:ring-blue-500/10";

  return (
    /* Modal Layer Base Container: Dismisses panel elegantly via backdrop blur clicks */
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 dark:bg-slate-950/60 backdrop-blur-xs animate-fade-in antialiased"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Ethiopic', sans-serif" }}
      onClick={onClose}
    >
      {/* Registration Layout Form Card Wrapper */}
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          handleRegisterSalesperson(e);
          onClose();
        }}
        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xl space-y-5 animate-scale-up transition-colors"
      >
        {/* Header Title Section */}
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 tracking-wider">
            {t.registerSalesperson || 'Register New Staff'}
          </h3>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all active:scale-90 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
        
        {/* Data Field Controls Group */}
        <div className="space-y-4">
          {/* Personnel Name Input Control */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wide">
              {t.fullNameLabel || 'Full Name'} <span className="text-rose-500 font-black">*</span>
            </label>
            <input 
              type="text" 
              value={salesName} 
              onChange={(e) => setSalesName(e.target.value)} 
              placeholder={t.fullNamePlaceholder}
              className={baseInputClass} 
              required 
            />
          </div>

          {/* Contact Identifier Control */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wide">
              {t.phoneOrEmail || 'Phone Number'} <span className="text-rose-500 font-black">*</span>
            </label>
            <input 
              type="tel" 
              value={salesPhone} 
              onChange={(e) => setSalesPhone(e.target.value)} 
              placeholder="09xxxxxxxx" 
              className={`${baseInputClass} font-mono`} 
              required 
            />
          </div>

          {/* Email Address Input Control */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wide">
              {t.emailOptional || 'Email Address'} <span className="text-slate-300 dark:text-slate-600 font-normal">(Optional)</span>
            </label>
            <input 
              type="type" 
              value={salesEmail} 
              onChange={(e) => setSalesEmail(e.target.value)} 
              placeholder="staff@example.com" 
              className={baseInputClass} 
            />
          </div>

          {/* Secure Access Credentials Password Control */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wide">
              {t.password || 'Login Password'}
            </label>
            <input 
              type="password" 
              value={salesPassword} 
              onChange={(e) => setSalesPassword(e.target.value)} 
              placeholder="••••••" 
              className={`${baseInputClass} ${salesPassword ? 'tracking-widest font-mono text-base py-2' : ''}`} 
            />
          </div>
        </div>

        {/* Form Submission Action Target Trigger */}
        <button 
          type="submit" 
          className="w-full bg-[#1a5fb4] dark:bg-blue-600 hover:bg-[#1a5fb4]/90 dark:hover:bg-blue-700 active:scale-[0.98] text-white font-black py-3.5 rounded-xl text-xs tracking-wider transition-all shadow-sm focus:ring-4 focus:ring-[#1a5fb4]/10 dark:focus:ring-blue-500/10 cursor-pointer"
        >
          {t.createSalesBtn || 'Create Account'}
        </button>
      </form>
    </div>
  );
}
