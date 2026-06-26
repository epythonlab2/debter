// src/context/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize state from localStorage fallback or default to 'system'
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('debter-theme') as ThemeMode) || 'system';
    }
    return 'system';
  });

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('debter-theme', newTheme);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Set up a media query listener for system preference matching
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = () => {
      // Clear out existing layout modifier utility states
      root.classList.remove('light', 'dark');

      if (theme === 'system') {
        const systemMode = mediaQuery.matches ? 'dark' : 'light';
        root.classList.add(systemMode);
      } else {
        root.classList.add(theme);
      }
    };

    // Run theme mutation mapping
    applyTheme();

    // Listen to OS landscape changes in real-time if set to system
    if (theme === 'system') {
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be wrapped inside a <ThemeProvider /> layout block');
  return context;
};
