// src/components/common/GlobalBroadcastBanner.tsx
import React, { useEffect, useState } from 'react';
import { useNotifications } from '../../core/context/NotificationContext';
import { Megaphone, AlertTriangle, ShieldAlert, X } from 'lucide-react';

interface GlobalBroadcastBannerProps {
  t?: Record<string, any>;
}

export function GlobalBroadcastBanner({ t = {} }: GlobalBroadcastBannerProps) {
  const { activeBroadcast, clearBroadcast } = useNotifications();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (activeBroadcast) {
      const dismissed = localStorage.getItem(`dismissed_broadcast_${activeBroadcast.id}`);
      setIsDismissed(!!dismissed);
    } else {
      setIsDismissed(false);
    }
  }, [activeBroadcast]);

  if (!activeBroadcast || isDismissed) return null;

  // FIXED: Low contrast theme objects mimicking clean slate card styles
  const themes: Record<string, { bg: string; border: string; iconColor: string; labelBg: string; icon: React.ComponentType<any>; label: string }> = {
    info: {
      bg: 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300',
      border: 'border-slate-200/60 dark:border-slate-800',
      iconColor: 'text-blue-600 dark:text-blue-400/80',
      labelBg: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400',
      icon: Megaphone,
      label: t.infoLabel || 'መረጃ'
    },
    warning: {
      bg: 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300',
      border: 'border-slate-200/60 dark:border-slate-800',
      iconColor: 'text-amber-600 dark:text-amber-400/80',
      labelBg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400',
      icon: AlertTriangle,
      label: t.warningLabel || 'ማስጠንቀቂያ'
    },
    critical: {
      bg: 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300',
      border: 'border-slate-200/60 dark:border-slate-800',
      iconColor: 'text-rose-600 dark:text-rose-400/80',
      labelBg: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400',
      icon: ShieldAlert,
      label: t.criticalLabel || 'አስቸኳይ'
    }
  };

  const activeTheme = themes[activeBroadcast.severity] || themes.info;
  const Icon = activeTheme.icon;

  const handleDismiss = () => {
    if (activeBroadcast?.id) {
      localStorage.setItem(`dismissed_broadcast_${activeBroadcast.id}`, 'true');
    }
    setIsDismissed(true);
    clearBroadcast(); 
  };

  return (
    <div className={`w-full ${activeTheme.bg} border-b ${activeTheme.border} px-4 py-2.5 transition-all duration-300 relative shadow-3xs flex items-center justify-between z-50 animate-in slide-in-from-top duration-300 font-sans antialiased`}>
      <div className="flex items-center gap-3 max-w-4xl mx-auto flex-1 justify-center pr-6">
        {/* Fixed: Icon now correctly reads activeTheme.iconColor */}
        <Icon className={`w-4 h-4 shrink-0 animate-bounce ${activeTheme.iconColor}`} />
        <p className="text-xs sm:text-sm font-medium tracking-wide text-center">
          {/* Fixed: Label background uses dynamic subtle color tints */}
          <span className={`mr-1.5 px-1.5 py-0.5 ${activeTheme.labelBg} rounded-md text-[10px] tracking-widest font-bold transition-colors`}>
            {activeTheme.label}
          </span>
          {/* Fixed: Erased pure text-white blocks to sit at soft contrast */}
          <span className="text-slate-600 dark:text-slate-400 font-normal">
            {activeBroadcast.message}
          </span>
        </p>
      </div>
      <button 
        type="button"
        onClick={handleDismiss}
        className="absolute right-3 p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer active:scale-90"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
