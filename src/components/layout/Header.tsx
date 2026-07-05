// src/components/layout/Header.tsx
import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Settings, User, Building, Palette, ChevronDown, Check, Sun, Moon, Laptop } from 'lucide-react';
import { DebterIcon } from './DebterIcon';
import SettingsModal from '../modals/SettingsModal'; 

// IMPORT THE THEME CONTEXT AND HOOK HERE
import { useTheme } from '@/core/context/ThemeContext';

interface HeaderProps {
  lang: 'en' | 'am';
  setLang: (lang: 'en' | 'am') => void;
  currentUser: any;
  handleLogout: () => void;
  /** Relational profile sync pipeline from useAuth hooks */
  onUpdateProfile: (data: { fullName: string; shopName: string; email: string; location: string }) => Promise<void>;
  /** Security profile password change engine from useAuth hooks */
  onUpdatePassword: (data: { currentPassword: string; newPassword: string }) => Promise<void>;
  t: any;
}

export function Header({ 
  lang, 
  setLang, 
  currentUser,
  handleLogout,
  onUpdateProfile,
  onUpdatePassword,
  t 
}: HeaderProps) {
  // CONSUME THE GLOBAL THEME STATE FROM YOUR CONTEXT ENGINE
  const { theme, setTheme } = useTheme();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // Close the main settings dropdown layout when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setIsThemeMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close nested theme toggle list box when clicking outside its own bounds
  useEffect(() => {
    function handleThemeClickOutside(event: MouseEvent) {
      if (
        isThemeMenuOpen && 
        themeMenuRef.current && 
        !themeMenuRef.current.contains(event.target as Node)
      ) {
        setIsThemeMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleThemeClickOutside);
    return () => document.removeEventListener('mousedown', handleThemeClickOutside);
  }, [isThemeMenuOpen]);

  // Helper mapping to render icons based on the current selection matrix state
  const getThemeIcon = (targetTheme: typeof theme) => {
    switch (targetTheme) {
      case 'light': return <Sun className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />;
      case 'dark': return <Moon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />;
      default: return <Laptop className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />;
    }
  };

  const getThemeLabel = (targetTheme: typeof theme) => {
    switch (targetTheme) {
      case 'light': return t.lightTheme || "Light Mode";
      case 'dark': return t.darkTheme || "Dark Mode";
      default: return t.systemTheme || "System Preference";
    }
  };

  return (
    <>
      {/* HEADER CONTAINER: Permanently dark brand identity bar (Solid background, no blur) */}
      <header className="sticky top-0 z-40 px-4 py-3 bg-[#022a61] border-b border-slate-800/60 shadow-2xl font-sans">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          
          {/* LEFT BRAND SECTION */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 relative group">
              <div className="absolute inset-0 bg-[#024982]/40 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              <DebterIcon size="sm" className="relative z-10 w-5 h-5 text-white" />
            </div>
            
            <div className="min-w-0 flex flex-col">
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white truncate leading-tight">
                {t.appName || 'Debter'}
                <span className="text-[#f1b434]">.</span>
              </h1>
              <p className="text-[10px] font-semibold tracking-wide text-blue-200/80 leading-none mt-1 select-none">
                {t.tagline}
              </p>
            </div>
          </div>

          {/* RIGHT CONTROLS SECTION */}
          <div className="flex items-center gap-3 flex-shrink-0 relative" ref={dropdownRef}>
            
            {/* Segmented Language Switcher Toggle */}
            <div className="bg-[#021b3d] p-1 rounded-lg flex items-center border border-slate-800/50">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 text-[11px] font-semibold tracking-wide rounded-md transition-all duration-150 cursor-pointer ${
                  lang === 'en'
                    ? "bg-[#024982] text-white shadow-md"
                    : "text-blue-200/70 hover:text-white"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('am')}
                className={`px-2.5 py-1 text-[11px] font-semibold tracking-wide rounded-md transition-all duration-150 cursor-pointer ${
                  lang === 'am'
                    ? "bg-[#024982] text-white shadow-md"
                    : "text-blue-200/70 hover:text-white"
                }`}
              >
                አማ
              </button>
            </div>
            
            {currentUser && (
              <>
                <div className="w-[1px] h-4 bg-slate-800/70" />
                
                {/* DROPDOWN CONTROLLER BUTTON */}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`p-2 rounded-md border transition-all duration-200 active:scale-[0.98] cursor-pointer relative z-50 ${
                    isDropdownOpen
                      ? "bg-[#024982] text-white border-[#025da6] shadow-[0_0_12px_rgba(2,93,166,0.3)]" 
                      : "bg-[#021b3d] text-blue-200/60 hover:text-white border-slate-800/50 hover:border-slate-700/60"
                  }`}
                  title={t.settings || "Settings"}
                >
                  <Settings className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-45' : ''}`} />
                </button>

                {/* THEME DYNAMIC DROPDOWN OVERLAY WRAPPER (Solid backgrounds, no blur) */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2.5 w-64 rounded-2xl border bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800 shadow-xl dark:shadow-[0_20px_40px_rgba(0,0,0,0.65)] p-2.5 animate-in fade-in slide-in-from-top-2 duration-200 z-50 space-y-2.5 transition-colors duration-200">
                    
                    {/* Profile Summary Card context box */}
                    <div className="px-3 py-3 bg-white dark:bg-black/30 border border-slate-300/30 dark:border-transparent rounded-xl flex flex-col gap-2.5">
                      <span className="text-[10px] font-medium tracking-wide text-slate-500 dark:text-slate-400 leading-none">
                        {t.accountInfo || "Account Status"}
                      </span>
                      
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-300/60 dark:bg-[#021126] border border-slate-300/40 dark:border-slate-800/70 rounded-lg text-slate-700 dark:text-blue-200/50 shrink-0">
                          <Building className="w-4 h-4 stroke-[2]" />
                        </div>
                        <div className="min-w-0 flex flex-col">
                          <span className="text-sm font-semibold text-slate-800 dark:text-white truncate leading-tight">
                            {currentUser.businessName || currentUser.business_name || t.appName || "Merchant"}
                          </span>
                          <span className="text-xs font-medium text-slate-500 dark:text-blue-200/60 truncate mt-1 leading-none">
                            {currentUser.fullName || currentUser.full_name || 'Administrator'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* APPREARANCE CAPABILITY WRAPPER */}
                    <div className="relative px-1" ref={themeMenuRef}>
                      <div className="flex items-center justify-between mb-1.5 px-2">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Palette className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-xs font-medium tracking-wide">
                            {t.themeSetting || "App Theme"}
                          </span>
                        </div>
                      </div>

                      {/* Custom Theme Dropdown Activator Box */}
                      <button
                        type="button"
                        onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                        className="w-full flex items-center justify-between bg-white dark:bg-[#021b3d] border border-slate-300 dark:border-slate-800/80 hover:border-slate-400 dark:hover:border-slate-700/80 text-slate-800 dark:text-blue-100 text-xs rounded-lg px-3 py-2 transition-all cursor-pointer font-medium active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-2">
                          {getThemeIcon(theme)}
                          <span>{getThemeLabel(theme)}</span>
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-blue-200/50 transition-transform duration-200 ${isThemeMenuOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Submenu Dropdown Dialog Box */}
                      {isThemeMenuOpen && (
                        <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-[#021b3d] border border-slate-300 dark:border-slate-800 rounded-lg shadow-2xl p-1 z-50 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                          {(['system', 'dark', 'light'] as const).map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                setTheme(option);
                                setIsThemeMenuOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer text-left ${
                                theme === option 
                                  ? "bg-slate-200 dark:bg-[#024982]/30 text-slate-900 dark:text-white border border-slate-300 dark:border-[#024982]/40" 
                                  : "text-slate-600 dark:text-blue-100/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-transparent"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                {getThemeIcon(option)}
                                <span>{getThemeLabel(option)}</span>
                              </div>
                              {theme === option && (
                                <Check className="w-3.5 h-3.5 text-[#025da6] stroke-[3]" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* INTERACTIVE ACTION SEGMENTS */}
                    <div className="space-y-0.5 pt-1 border-t border-slate-300 dark:border-slate-800/60">
                      {/* Edit Profile Settings */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsSettingsModalOpen(true);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-white dark:hover:bg-slate-800/80 text-sm font-medium tracking-wide text-slate-700 dark:text-blue-100/80 hover:text-slate-900 dark:hover:text-white flex items-center gap-3 transition-colors cursor-pointer group"
                      >
                        <Settings className="w-4 h-4 text-slate-400 dark:text-blue-200/50 group-hover:text-[#025da6] group-hover:rotate-45 transition-all duration-300" />
                        <span>{t.editProfile || "Edit Profile Settings"}</span>
                      </button>

                      {/* Explicit Interactive Termination Pipeline */}
                      <button 
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          handleLogout();
                        }} 
                        className="w-full group flex items-center justify-between py-2 px-3 rounded-lg text-sm font-medium tracking-wide text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:scale-[0.99] transition-all cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-rose-500 dark:text-rose-400/80" />
                          <span>{t.logout || "Log Out"}</span>
                        </div>
                        <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-0.5 duration-200 text-rose-500 dark:text-rose-400" />
                      </button>
                    </div>

                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </header>

      {/* RENDER SETTINGS MODAL INTERACTION GATEWAY */}
      <SettingsModal
        isOpen={isSettingsModalOpen && !!currentUser}
        onClose={() => setIsSettingsModalOpen(false)}
        currentUser={{
          fullName: currentUser?.fullName || currentUser?.full_name || '',
          shopName: currentUser?.businessName || currentUser?.business_name || '',
          email: currentUser?.email || '',
          location: currentUser?.location || ''
        }}
        onUpdateProfile={onUpdateProfile}
        onUpdatePassword={onUpdatePassword}
        t={t}
      />
    </>
  );
}
