import React from 'react';
import { Newspaper, Users, FileText, User as UserIcon } from 'lucide-react';
import { translations, Language } from '../utils/i18n';

export type TabType = 'feed' | 'groups' | 'notes' | 'account';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  lang: Language;
  unreadGroupsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  lang,
  unreadGroupsCount = 0,
}) => {
  const t = translations[lang];

  const navItems = [
    {
      id: 'feed' as TabType,
      label: t.navFeed,
      icon: Newspaper,
    },
    {
      id: 'groups' as TabType,
      label: t.navGroups,
      icon: Users,
      badge: unreadGroupsCount > 0 ? unreadGroupsCount : undefined,
    },
    {
      id: 'notes' as TabType,
      label: t.navNotes,
      icon: FileText,
    },
    {
      id: 'account' as TabType,
      label: t.navAccount,
      icon: UserIcon,
    },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
    >
      <div className="max-w-md mx-auto grid grid-cols-4 h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => onChangeTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 transition-all duration-200 ${
                isActive
                  ? 'text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              {/* Active Emerald to Messenger Blue Glow Bar */}
              {isActive && (
                <span className="absolute top-0 w-10 h-1 rounded-full bg-gradient-to-r from-[#25D366] via-[#00B2FE] to-[#006AFF] shadow-sm shadow-blue-500/50 animate-fadeIn" />
              )}

              <div
                className={`relative p-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-br from-emerald-500/15 to-blue-500/15 text-blue-600 scale-110 shadow-xs border border-blue-200/40'
                    : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="text-[11px] tracking-tight mt-0.5 select-none whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
