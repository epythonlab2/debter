// src/components/splash/SplashScreen.tsx
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { DebterIcon } from '../layout/DebterIcon';

interface SplashScreenProps {
  onComplete?: () => void;
  lang?: 'en' | 'am';
  isFirstTime?: boolean; 
}

/**
 * Modern High-Contrast Splash Screen (Bilingual Localized Edition)
 * Configured with an extended runtime duration for complete data hydration safety.
 */
export function SplashScreen({ onComplete, lang = 'en', isFirstTime = true }: SplashScreenProps) {
  const [progress, setProgress] = React.useState(0);

  useEffect(() => {
    // Increments by 1% every 25ms (~2.5 seconds total runtime) for a smooth, steady boot pacing
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          if (onComplete) {
            // An intentional 200ms delay to give state frames time to commit cleanly
            setTimeout(onComplete, 200);
          }
          return 100;
        }
        return prev + 1;
      });
    }, 25);

    return () => clearInterval(interval);
  }, [onComplete]);

  // Dynamic helper to resolve active initialization logs based on app state
  const getLoadingText = () => {
    if (isFirstTime) {
      if (progress < 40) return 'Booting Core / ማዕቀፉን በመጫን ላይ...';
      if (progress >= 40 && progress < 80) return 'Linking Database / ዳታቤዝ በማገናኘት ላይ...';
      return 'Verifying Session / መለያ በመፈተሽ ላይ...';
    }

    if (progress < 40) return lang === 'en' ? 'Booting Core...' : 'ማዕቀፉን በመጫን ላይ...';
    if (progress >= 40 && progress < 80) return lang === 'en' ? 'Linking Database...' : 'ዳታቤዝ በማገናኘት ላይ...';
    return lang === 'en' ? 'Verifying Session...' : 'መለያ በመፈተሽ ላይ...';
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-between p-12 z-50 select-none overflow-hidden">
      
      {/* Decorative Branding Background Graphic using brand hex #1a5fb4 */}
      <div 
        className="absolute -right-24 -top-24 w-96 h-96 bg-[#1a5fb4]/10 rounded-full blur-3xl pointer-events-none animate-pulse" 
        style={{ animationDuration: '3000ms' }} 
      />
      <div className="absolute -left-24 -bottom-24 w-96 h-96 bg-slate-900/40 rounded-full blur-3xl pointer-events-none" />

      {/* Top Spacer info bar */}
      <div className="w-full flex justify-between items-center opacity-30 z-10">
        <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
          SYS_INIT_OK
        </span>
        <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
          v1.0.0
        </span>
      </div>

      {/* CENTER ENGINE: Branding, Core Logo, and Identity Title */}
      <div className="flex flex-col items-center space-y-6 relative z-10 text-center">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#1a5fb4]/20 to-transparent rounded-3xl blur-xl opacity-60 scale-110" />
          <div className="flex-shrink-0 relative">
            <DebterIcon size="lg" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">
            Debter-ደብተር
          </h1>
          
          {isFirstTime ? (
            <div className="space-y-1.5 max-w-sm mx-auto">
              <p className="text-xs font-extrabold text-slate-200 tracking-wide uppercase leading-relaxed">
                Shop Daily Notebook
              </p>
              <div className="w-6 h-[1px] bg-slate-800 mx-auto" />
              <p className="text-xs font-medium text-slate-400 tracking-normal leading-relaxed">
                የዕለት ሽያጭ መመዝገቢያ ደብተር
              </p>
            </div>
          ) : (
            <p className="text-xs font-extrabold text-slate-400 tracking-widest uppercase max-w-xs mx-auto leading-relaxed">
              {lang === 'en' 
                ? "Shop Daily Notebook" 
                : "የዕለት ሽያጭ መመዝገቢያ ደብተር"}
            </p>
          )}
        </div>
      </div>

      {/* BOTTOM RUNTIME: Tracking Indicator and System Progress */}
      <div className="w-full max-w-xs space-y-4 relative z-10">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wide">
          <div className="flex items-center gap-2 text-slate-300">
            <Loader2 className="w-3.5 h-3.5 text-[#1a5fb4] animate-spin flex-shrink-0" />
            <span className={isFirstTime ? "text-[10px] tracking-normal normal-case font-semibold text-slate-400" : "text-slate-400"}>
              {getLoadingText()}
            </span>
          </div>
          <span className="text-[#1a5fb4] tabular-nums font-mono font-bold">
            {progress}%
          </span>
        </div>

        <div className="h-1.5 w-full bg-slate-900 border border-slate-800/60 rounded-full overflow-hidden p-0.5">
          <div 
            className="h-full bg-[#1a5fb4] rounded-full transition-all duration-75 ease-out shadow-[0_0_8px_rgba(26,95,180,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

    </div>
  );
}
