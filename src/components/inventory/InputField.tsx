// src/components/inventory/InputField.tsx
import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { InputFieldProps } from '../../types/inventory';

export interface ExtendedInputFieldProps extends InputFieldProps {
  disabled?: boolean;
  required?: boolean;
  name?: string;
  autoFocus?: boolean;
  error?: string | null;
}

const InputField = React.memo(
  forwardRef<HTMLInputElement, ExtendedInputFieldProps>(
    (
      {
        label,
        value,
        onChange,
        placeholder,
        type = 'text',
        min,
        inputMode,
        disabled = false,
        required = false,
        name,
        autoFocus = false,
        error = null
      },
      ref
    ) => (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="block text-slate-500 dark:text-slate-400 font-bold text-[11px] tracking-wider">
            {label}
            {<span className="text-rose-500 ml-0.5">*</span>}
          </label>
        </div>

        <div className="relative">
          <input
            ref={ref}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            min={min}
            inputMode={inputMode}
            disabled={disabled}
            required={required}
            autoFocus={autoFocus}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-normal disabled:opacity-60 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
              error
                ? 'border-rose-500/80 bg-rose-50/40 dark:bg-rose-950/20 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:border-[#1a5fb4] dark:focus:border-[#1a5fb4] focus:ring-4 focus:ring-[#1a5fb4]/10 focus:bg-white dark:focus:bg-slate-900'
            }`}
          />
        </div>

        {/* Inline Field Error Message */}
        {error && (
          <div className="flex items-center gap-1 mt-1 text-rose-500 dark:text-rose-400 text-[11px] font-medium animate-in fade-in duration-150">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    )
  )
);

InputField.displayName = 'InputField';

export default InputField;