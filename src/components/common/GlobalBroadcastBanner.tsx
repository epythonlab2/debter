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

  // FIXED: Explicitly type the themes mapping signature using a Record utility
  const themes: Record<string, { bg: string; border: string; icon: React.ComponentType<any>; label: string }> = {
    info: {
      bg: 'bg-blue-600',
      border: 'border-blue-700',
      icon: Megaphone,
      label: t.infoLabel || 'መረጃ'
    },
    warning: {
      bg: 'bg-amber-500',
      border: 'border-amber-600',
      icon: AlertTriangle,
      label: t.warningLabel || 'ማስጠንቀቂያ'
    },
    critical: {
      bg: 'bg-rose-600',
      border: 'border-rose-700',
      icon: ShieldAlert,
      label: t.criticalLabel || 'አስቸኳይ'
    }
  };

  // Now TypeScript accepts index resolution smoothly
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
    <div className={`w-full ${activeTheme.bg} text-white border-b ${activeTheme.border} px-4 py-2.5 transition-all duration-300 relative shadow-sm flex items-center justify-between z-50 animate-in slide-in-from-top duration-300 font-sans antialiased`}>
      <div className="flex items-center gap-3 max-w-4xl mx-auto flex-1 justify-center pr-6">
        <Icon className="w-4 h-4 shrink-0 animate-bounce" />
        <p className="text-xs sm:text-sm font-bold tracking-wide text-center">
          <span className="uppercase opacity-90 mr-1.5 px-1.5 py-0.5 bg-black/15 rounded-md text-[10px] tracking-widest font-black">
            {activeTheme.label}
          </span>
          {activeBroadcast.message}
        </p>
      </div>
      <button 
        type="button"
        onClick={handleDismiss}
        className="absolute right-3 p-1 rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-white cursor-pointer active:scale-90"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
