import React from 'react';
import { X, CheckCheck, Bell, ShieldAlert, CheckCircle2, XCircle, UserMinus, Megaphone } from 'lucide-react';
import { AppNotification } from '../types';
import { translations, Language } from '../utils/i18n';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onMarkSingleRead: (id: string) => void;
  lang: Language;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onMarkSingleRead,
  lang,
}) => {
  if (!isOpen) return null;
  const t = translations[lang];

  const getIcon = (type: string) => {
    switch (type) {
      case 'group_approved':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'group_rejected':
        return <XCircle className="w-5 h-5 text-rose-500" />;
      case 'group_removed':
        return <UserMinus className="w-5 h-5 text-amber-600" />;
      case 'note_delete_approved':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'note_delete_rejected':
        return <XCircle className="w-5 h-5 text-rose-500" />;
      case 'admin_broadcast':
        return <Megaphone className="w-5 h-5 text-amber-600" />;
      default:
        return <Bell className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center sm:justify-end sm:p-4 bg-slate-950/40 backdrop-blur-xs animate-fadeIn">
      <div
        id="notifications-drawer"
        className="w-full sm:max-w-md bg-white h-full sm:h-auto sm:max-h-[85vh] sm:rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400/20 text-amber-700">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{t.notifications}</h3>
              <p className="text-xs text-slate-500">
                {notifications.filter((n) => !n.read).length} unread
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                id="mark-all-read-btn"
                onClick={onMarkAllRead}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-100/70 hover:bg-amber-200/70 transition-colors"
                title={t.markAllAsRead}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.markAllAsRead}</span>
              </button>
            )}
            <button
              id="close-notifications-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-100/50">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-300">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium">{t.noNotifications}</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.read && onMarkSingleRead(notif.id)}
                className={`pt-2.5 first:pt-0 p-3 rounded-xl transition-all cursor-pointer ${
                  notif.read
                    ? 'bg-white hover:bg-slate-50 border border-transparent text-slate-600'
                    : 'bg-amber-50/60 hover:bg-amber-50 border border-amber-200/70 text-slate-900 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-white shadow-xs shrink-0 mt-0.5 border border-slate-100">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`text-xs font-bold leading-snug truncate ${
                          notif.read ? 'text-slate-800' : 'text-slate-950 font-extrabold'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap break-words">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-400 font-medium block mt-1.5">
                      {new Date(notif.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
