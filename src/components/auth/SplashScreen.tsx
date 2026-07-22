// src/components/splash/SplashScreen.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { Loader2, WifiOff } from 'lucide-react';
import { DebterIcon } from '../layout/DebterIcon';

interface SplashScreenProps {
  onComplete?: () => void;
  lang?: 'en' | 'am';
  isFirstTime?: boolean; 
}

/**
 * Modern Splash Screen (Bilingual Localized Edition)
 * Operates purely client-side via predictable local intervals to ensure UI rendering stability 
 * even when launching completely offline or trapped behind captive network portals.
 */
export function SplashScreen({ onComplete, lang = 'en', isFirstTime = true }: SplashScreenProps) {
  const [progress, setProgress] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(typeof window !== 'undefined' ? navigator.onLine : true);

  // Monitor hardware connection events smoothly at boot
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Steady progress bar driver (~2.5 seconds total runtime)
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          if (onComplete) {
            // Defers termination by 200ms to guarantee render loops commit application state frame updates
            setTimeout(onComplete, 200);
          }
          return 100;
        }
        return prev + 1;
      });
    }, 25);

    return () => clearInterval(interval);
  }, [onComplete]);

  // Compute highly visible loading logs contextually depending on core initialization states
  const loadingText = useMemo(() => {
    if (isFirstTime) {
      if (progress < 40) return 'Booting Core / ማዕቀፉን በመጫን ላይ...';
      if (progress >= 40 && progress < 80) return 'Linking Database / ዳታቤዝ በማገናኘት ላይ...';
      return 'Verifying Session / መለያ በመፈተሽ ላይ...';
    }

    if (progress < 40) return lang === 'en' ? 'Booting Core...' : 'ማዕቀፉን በመጫን ላይ...';
    if (progress >= 40 && progress < 80) return lang === 'en' ? 'Linking Database...' : 'ዳታቤዝ በማገናኘት ላይ...';
    return lang === 'en' ? 'Verifying Session...' : 'መለያ በመፈተሽ ላይ...';
  }, [progress, isFirstTime, lang]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between items-center p-6 bg-[#021b3d] transition-all duration-1000 ease-in-out select-none overflow-hidden font-sans text-slate-100">
      
      {/* Top Status Bar Grid */}
      <div className="w-full flex justify-between items-center text-[10px] text-blue-200/40 tracking-wider font-mono px-4 mt-2">
        <span className="animate-pulse">SYS_INIT_OK</span>
        <span>V1.0.9</span>
      </div>

      {/* CENTER ENGINE: Branding Layout & Typography */}
      <div className="flex flex-col items-center justify-center flex-grow -translate-y-6">
        <div className="flex-shrink-0 mb-8">
          <DebterIcon size="lg" />
        </div>

        <div className="space-y-3 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-wider text-white flex items-center justify-center gap-1">
            DEBTER<span className="text-[#f5b700] font-normal">-ደብተር</span>
          </h1>
          
          {isFirstTime ? (
            <div className="space-y-1.5 max-w-sm mx-auto">
              <p className="text-blue-200/80 text-sm md:text-base font-light tracking-wide">
                Shop Daily Notebook
              </p>
              <div className="w-6 h-[1px] bg-slate-800/60 mx-auto" />
              <p className="text-blue-200/80 text-sm md:text-base font-light tracking-wide">
                የዕለት ሽያጭ መመዝገቢያ ደብተር
              </p>
            </div>
          ) : (
            <p className="text-blue-200/80 text-sm md:text-base font-light tracking-wide max-w-xs mx-auto">
              {lang === 'en' ? "Shop Daily Notebook" : "የዕለት ሽያጭ መመዝገቢያ ደብተር"}
            </p>
          )}
        </div>
      </div>

      {/* BOTTOM RUNTIME: Dynamic Progress Monitoring Matrix */}
      <div className="w-full max-w-xs flex flex-col items-center gap-4 mb-8">
        
        {/* Connection Intercept Banner: Transparently assures users they are safe to proceed offline */}
        {!isOnline && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium text-center animate-fade-in animate-pulse duration-1000">
            <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              {lang === 'en' 
                ? "No Internet access! You can still record sales." 
                : "የኢንተርኔት ግንኙነት የለም! ቢሆንም ሽያጭ መመዝገብ ይችላሉ።"}
            </span>
          </div>
        )}

        <div className="w-full flex justify-between text-xs text-blue-400 font-medium px-1 mt-1">
          <span className="flex items-center gap-2 max-w-[80%]">
            <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin flex-shrink-0" />
            <span className="text-blue-200/70 tracking-wide truncate">
              {loadingText}
            </span>
          </span>
          <span className="font-mono text-blue-200/80">{progress}%</span>
        </div>

        {/* Progress Tracker Track/Bar */}
        <div className="w-full h-1.5 bg-[#021126] rounded-full overflow-hidden border border-slate-800/40">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 via-blue-500 to-[#f5b700] rounded-full transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

    </div>
  );
}
