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
 * Modern Splash Screen (Bilingual Localized Edition)
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
    <div className="fixed inset-0 z-50 flex flex-col justify-between items-center p-6 bg-gradient-to-b from-[#070d19] to-[#040810] transition-all duration-1000 ease-in-out select-none overflow-hidden font-sans text-slate-100">
      
      {/* Top Status Bar Mock */}
      <div className="w-full flex justify-between items-center text-[10px] text-gray-500 tracking-wider font-mono px-4 mt-2">
        <span className="animate-pulse">SYS_INIT_OK</span>
        <span>V1.0.3</span>
      </div>

      {/* CENTER ENGINE: Branding, Core Logo, and Identity Title */}
      <div className="flex flex-col items-center justify-center flex-grow -translate-y-6">
        <div className="relative group mb-8">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-transparent rounded-3xl blur-xl opacity-60 scale-110" />
          <div className="flex-shrink-0 relative">
            <DebterIcon size="lg" />
          </div>
        </div>

        <div className="space-y-3 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-wider text-white flex items-center justify-center gap-1">
            DEBTER<span className="text-[#f5b700] font-normal">-ደብተር</span>
          </h1>
          
          {isFirstTime ? (
            <div className="space-y-1.5 max-w-sm mx-auto">
              <p className="text-gray-400 text-sm md:text-base font-light tracking-wide">
                Shop Daily Notebook
              </p>
              <div className="w-6 h-[1px] bg-slate-800/60 mx-auto" />
              <p className="text-gray-400 text-sm md:text-base font-light tracking-wide">
                የዕለት ሽያጭ መመዝገቢያ ደብተር
              </p>
            </div>
          ) : (
            <p className="text-gray-400 text-sm md:text-base font-light tracking-wide max-w-xs mx-auto">
              {lang === 'en' 
                ? "Shop Daily Notebook" 
                : "የዕለት ሽያጭ መመዝገቢያ ደብተር"}
            </p>
          )}
        </div>
      </div>

      {/* BOTTOM RUNTIME: Tracking Indicator and System Progress */}
      <div className="w-full max-w-xs flex flex-col items-center gap-4 mb-8">
        <div className="w-full flex justify-between text-xs text-blue-400 font-medium px-1">
          <span className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin flex-shrink-0" />
            <span className={isFirstTime ? "tracking-wide text-gray-400 font-medium" : "text-gray-400 tracking-wide"}>
              {getLoadingText()}
            </span>
          </span>
          <span className="font-mono text-slate-300">{progress}%</span>
        </div>

        {/* Progress Bar Tracker */}
        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-gray-800/80">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 via-blue-500 to-[#f5b700] rounded-full transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

    </div>
  );
}
