import React, { useState } from 'react';
import { Bell, Globe, RefreshCw, ArrowLeft } from 'lucide-react';
import { User, AppNotification } from '../types';
import { translations, Language } from '../utils/i18n';
import { AdminModeSwitch } from './AdminModeSwitch';

interface NavbarProps {
  user: User | null;
  isAdmin: boolean;
  lang: Language;
  onToggleLang: () => void;
  notifications: AppNotification[];
  onOpenNotifications: () => void;
  onOpenAdmin: () => void;
  isAdminView: boolean;
  onSwitchView: () => void;
  onRefresh?: () => void;
  onGoHome?: () => void;
  canGoBack?: boolean;
  onBack?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  isAdmin,
  lang,
  onToggleLang,
  notifications,
  onOpenNotifications,
  isAdminView,
  onSwitchView,
  onRefresh,
  onGoHome,
  canGoBack,
  onBack,
}) => {
  const t = translations[lang];
  const unreadCount = notifications.filter((n) => !n.read).length;
  const [isSpinning, setIsSpinning] = useState(false);

  const handleRefreshClick = () => {
    setIsSpinning(true);
    if (onRefresh) {
      onRefresh();
    }
    setTimeout(() => setIsSpinning(false), 800);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between">
        {/* Left Side: Back Option + Brand Identity with WhatsApp + Messenger Hybrid Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Universal Back Button */}
          {canGoBack && (
            <button
              id="global-back-btn"
              type="button"
              onClick={onBack || onGoHome}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs border border-slate-200 shrink-0"
              title={lang === 'bn' ? 'ফিরে যান' : 'Back to Dashboard'}
            >
              <ArrowLeft className="w-4 h-4 text-slate-700 stroke-[2.5]" />
              <span className="inline">{lang === 'bn' ? 'ফিরে যান' : 'Back'}</span>
            </button>
          )}

          <button
            id="brand-logo-btn"
            type="button"
            onClick={onGoHome}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none transition-transform active:scale-98"
            title="Go to Main Dashboard"
          >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-[#25D366] via-[#00B2FE] to-[#006AFF] text-white shadow-md shadow-emerald-500/20 ring-2 ring-white overflow-hidden group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all">
            {/* Custom WhatsApp + Messenger Hybrid SVG Icon */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 text-white drop-shadow-xs group-hover:scale-105 transition-transform"
            >
              {/* Chat Speech Bubble Shape */}
              <path
                d="M12 2C6.477 2 2 6.253 2 11.5C2 13.568 2.705 15.482 3.905 17.025L3.06 20.474C2.96 20.884 3.35 21.242 3.75 21.109L7.545 19.845C8.892 20.575 10.407 21 12 21C17.523 21 22 16.747 22 11.5C22 6.253 17.523 2 12 2Z"
                fill="currentColor"
              />
              {/* Messenger Lightning Bolt inside WhatsApp Bubble */}
              <path
                d="M12.8 7.5L7.5 13.8H11.2L11.2 16.5L16.5 10.2H12.8V7.5Z"
                fill="#0F172A"
                fillOpacity="0.15"
              />
              <path
                d="M13.2 7L7.8 13.4H11.5L11.5 16.2L16.2 9.8H12.5V7H13.2Z"
                fill="#FFFFFF"
              />
            </svg>

            {/* Active Live Pulse Dot */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-slate-900 text-lg tracking-tight group-hover:text-blue-700 transition-colors">
                Bee <span className="text-emerald-500">Chat</span>
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black bg-gradient-to-r from-emerald-500/15 to-blue-500/15 text-blue-700 border border-blue-200">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
              {t.tagline}
            </p>
          </div>
        </button>
      </div>

        {/* Right Action Icons: Refresh, Language, Notification, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Admin Mode Switch for Administrators */}
          {isAdmin && (
            <div className="mr-1">
              <div className="hidden sm:block">
                <AdminModeSwitch
                  isAdminMode={isAdminView}
                  onToggle={onSwitchView}
                  lang={lang}
                  variant="pill"
                />
              </div>
              <div className="sm:hidden">
                <AdminModeSwitch
                  isAdminMode={isAdminView}
                  onToggle={onSwitchView}
                  lang={lang}
                  variant="compact"
                />
              </div>
            </div>
          )}

          {/* Refresh Option beside Language & Notification */}
          <button
            id="global-refresh-btn"
            onClick={handleRefreshClick}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-950 hover:bg-slate-100/90 active:scale-95 transition-all cursor-pointer"
            title="Refresh App & Data"
            aria-label="Refresh Data"
          >
            <RefreshCw
              className={`w-4 h-4 text-slate-700 ${
                isSpinning ? 'animate-spin text-emerald-500' : ''
              }`}
            />
          </button>

          {/* Language Toggle (Bangla - English) */}
          <button
            id="lang-toggle-btn"
            onClick={onToggleLang}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-100/90 hover:bg-slate-200/80 transition-colors"
            title="Change Language (English / বাংলা)"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span className="uppercase">{lang === 'en' ? 'BN' : 'EN'}</span>
          </button>

          {/* Top-Right Notification Bell */}
          {user && (
            <button
              id="notifications-bell-btn"
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-emerald-50/80 transition-colors focus:outline-none"
              title={t.notifications}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-[#25D366] to-[#006AFF] text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white animate-bounce">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* User Avatar */}
          {user && (
            <div className="flex items-center pl-1">
              <img
                src={
                  user.avatarUrl ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                    user.name
                  )}&backgroundColor=25D366`
                }
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-400 shadow-xs"
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
