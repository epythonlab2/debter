// src/components/SegmentedPaymentTabs.tsx
import React, { useMemo } from 'react';
import { CreditCard } from 'lucide-react';
import { PaymentMethodType } from './RecordSaleTab';
import { SalesTranslation } from '../../types/sales';

interface SegmentedPaymentTabsProps {
  paymentMethod: PaymentMethodType;
  isSubmitting: boolean;
  handlePaymentMethodChange: (method: PaymentMethodType) => void;
  t: SalesTranslation;
}

export const SegmentedPaymentTabs: React.FC<SegmentedPaymentTabsProps> = ({
  paymentMethod,
  isSubmitting,
  handlePaymentMethodChange,
  t,
}) => {
  const activeTabTheme = useMemo(() => {
    switch (paymentMethod) {
      case 'cash':
        return {
          bg: 'bg-emerald-600 dark:bg-emerald-500/10',
          border: 'border-emerald-700 dark:border-emerald-500/20',
          text: 'text-white dark:text-emerald-400 font-semibold',
          transform: 'translateX(0%)'
        };
      case 'transfer':
        return {
          bg: 'bg-white dark:bg-[#1a5fb4]/20',
          border: 'border-[#1a5fb4] dark:border-blue-500/30',
          text: 'text-[#1a5fb4] dark:text-blue-400 font-semibold',
          transform: 'translateX(calc(100% + 4px))'
        };
      case 'dube':
        return {
          bg: 'bg-slate-900 dark:bg-slate-800',
          border: 'border-slate-950 dark:border-slate-700',
          text: 'text-white dark:text-slate-200 font-semibold',
          transform: 'translateX(calc(200% + 8px))'
        };
      default:
        return {
          bg: 'bg-white dark:bg-slate-900',
          border: 'border-slate-200/80 dark:border-slate-800',
          text: 'text-slate-500 dark:text-slate-400',
          transform: 'translateX(0%)'
        };
    }
  }, [paymentMethod]);

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wide">
        <CreditCard className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 stroke-[2]" />
        {t.paymentMethod || "Payment Method"}
      </label>
      <div className="relative grid grid-cols-3 bg-slate-100/80 dark:bg-slate-950/60 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800 isolate gap-1">
        <div 
          className={`absolute top-1 bottom-1 left-1 rounded-lg transition-all duration-200 ease-out -z-10 shadow-3xs border ${activeTabTheme.bg} ${activeTabTheme.border}`}
          style={{
            width: 'calc(33.333% - 6px)',
            transform: activeTabTheme.transform
          }}
        />

        {[
          { id: "cash", label: t.cash || "Cash" },
          { id: "transfer", label: t.transfer || "Transfer" },
          { id: "dube", label: t.dube || "Dube" }
        ].map((method) => {
          const isActive = paymentMethod === method.id;
          return (
            <button
              key={method.id}
              type="button"
              disabled={isSubmitting}
              onClick={() => handlePaymentMethodChange(method.id as PaymentMethodType)}
              className={`py-2 px-1 rounded-lg text-xs font-medium transition-all text-center cursor-pointer disabled:opacity-50 select-none border border-transparent active:scale-[0.96] ${
                isActive 
                  ? activeTabTheme.text
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {method.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
