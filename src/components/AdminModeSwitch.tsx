import React from 'react';
import { Shield, LayoutGrid, Sparkles } from 'lucide-react';
import { Language } from '../utils/i18n';

interface AdminModeSwitchProps {
  isAdminMode: boolean;
  onToggle: () => void;
  lang?: Language;
  variant?: 'banner' | 'pill' | 'compact';
}

export const AdminModeSwitch: React.FC<AdminModeSwitchProps> = ({
  isAdminMode,
  onToggle,
  lang = 'en',
  variant = 'banner',
}) => {
  if (variant === 'pill') {
    return (
      <div
        id="admin-mode-pill-toggle"
        role="group"
        aria-label="Workspace View Selector"
        className="inline-flex items-center p-1 bg-slate-100/90 rounded-2xl border border-slate-200/90 shadow-2xs select-none"
      >
        {/* User Dashboard Tab */}
        <button
          type="button"
          onClick={() => {
            if (isAdminMode) onToggle();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            !isAdminMode
              ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200/80 font-black'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutGrid className={`w-3.5 h-3.5 ${!isAdminMode ? 'text-blue-600' : 'text-slate-400'}`} />
          <span>Dashboard</span>
        </button>

        {/* Admin Control Center Tab */}
        <button
          type="button"
          onClick={() => {
            if (!isAdminMode) onToggle();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isAdminMode
              ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-xs font-black'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Admin Control</span>
        </button>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">
          {isAdminMode ? 'Admin Mode' : 'Dashboard'}
        </span>
        <button
          id="admin-compact-toggle-btn"
          type="button"
          role="switch"
          aria-checked={isAdminMode}
          onClick={onToggle}
          className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isAdminMode ? 'bg-gradient-to-r from-emerald-500 to-blue-600' : 'bg-slate-300'
          }`}
          title={isAdminMode ? 'Switch to User Dashboard' : 'Switch to Admin Control Center'}
        >
          <span className="sr-only">Toggle Admin Control Center</span>
          <span
            className={`pointer-events-none flex items-center justify-center h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              isAdminMode ? 'translate-x-6' : 'translate-x-0'
            }`}
          >
            {isAdminMode ? (
              <Shield className="w-3.5 h-3.5 text-blue-600" />
            ) : (
              <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
            )}
          </span>
        </button>
      </div>
    );
  }

  // Default 'banner' variant: Elegant executive slider bar
  return (
    <div
      id="admin-control-switch-banner"
      className="bg-white rounded-3xl p-3 sm:p-4 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3"
    >
      {/* Left: Status and description */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
            isAdminMode
              ? 'bg-gradient-to-br from-emerald-500/20 to-blue-500/20 text-blue-700 ring-2 ring-blue-200'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-black text-slate-900">
              Admin Control Center
            </h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black ${
                isAdminMode
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  isAdminMode ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              {isAdminMode ? 'ACTIVE' : 'STANDBY'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {isAdminMode
              ? 'Currently in Admin Control mode. Toggle switch to return to Dashboard.'
              : 'Switch ON to enter Admin Control Center and manage company records.'}
          </p>
        </div>
      </div>

      {/* Right: Interactive Dual-Slider Switch */}
      <div className="flex items-center gap-3 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 w-full sm:w-auto justify-center sm:justify-end">
        {/* Option 1: User Dashboard */}
        <button
          id="switch-option-dashboard"
          type="button"
          onClick={() => {
            if (isAdminMode) onToggle();
          }}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            !isAdminMode
              ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200/90 font-black scale-102'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutGrid className={`w-3.5 h-3.5 ${!isAdminMode ? 'text-blue-600' : 'text-slate-400'}`} />
          <span>Dashboard</span>
        </button>

        {/* Option 2: Admin Control */}
        <button
          id="switch-option-admin"
          type="button"
          onClick={() => {
            if (!isAdminMode) onToggle();
          }}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isAdminMode
              ? 'bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-600 text-white shadow-md ring-1 ring-blue-400 font-black scale-102'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Admin Control</span>
        </button>
      </div>
    </div>
  );
};
