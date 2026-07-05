// src/components/inventory/InputField.tsx
import React from 'react';
import { InputFieldProps } from '../../types/inventory';

interface ExtendedInputFieldProps extends InputFieldProps {
  disabled?: boolean;
}

const InputField = React.memo(({ label, value, onChange, placeholder, type = "text", min, inputMode, disabled }: ExtendedInputFieldProps) => (
  <div className="space-y-1">
    <label className="block text-slate-500 dark:text-slate-400 font-bold text-[11px] tracking-wider uppercase">{label}</label>
    <input 
      type={type} 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder} 
      min={min} 
      inputMode={inputMode}
      disabled={disabled}
      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-[#1a5fb4] dark:focus:border-[#1a5fb4] focus:ring-4 focus:ring-[#1a5fb4]/10 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-normal transition-all duration-200 disabled:opacity-60 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500" 
      required 
    />
  </div>
));

InputField.displayName = 'InputField';
export default InputField;
