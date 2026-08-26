/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, FeedPost, Group, AppNote, AppNotification } from './types';
import { Language } from './utils/i18n';
import { Navbar } from './components/Navbar';
import { BottomNav, TabType } from './components/BottomNav';
import { NotificationsModal } from './components/NotificationsModal';
import { AuthModal } from './components/AuthModal';
import { FeedTab } from './components/FeedTab';
import { GroupsTab } from './components/GroupsTab';
import { NotesTab } from './components/NotesTab';
import { AccountTab } from './components/AccountTab';
import { AdminDashboard } from './components/AdminDashboard';
import { MediaViewerModal } from './components/MediaViewerModal';
import { safeFetchJson } from './utils/api';

export default function App() {
  // Session & Auth
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('ettl_session_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => currentUser?.role === 'admin');
  const [isAdminView, setIsAdminView] = useState<boolean>(() => currentUser?.role === 'admin');

  // Navigation & Settings
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('ettl_app_lang') as Language) || 'en';
  });

  // App Data
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [notes, setNotes] = useState<AppNote[]>([]);

  // Modals
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeMedia, setActiveMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

  // Persistence helpers
  const handleToggleLang = () => {
    const nextLang: Language = lang === 'en' ? 'bn' : 'en';
    setLang(nextLang);
    localStorage.setItem('ettl_app_lang', nextLang);
  };

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('ettl_app_lang', newLang);
  };

  const handleLoginSuccess = (user: User, adminFlag: boolean) => {
    setCurrentUser(user);
    setIsAdmin(adminFlag || user.role === 'admin');
    setIsAdminView(adminFlag || user.role === 'admin');
    localStorage.setItem('ettl_session_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAdmin(false);
    setIsAdminView(false);
    localStorage.removeItem('ettl_session_user');
    setActiveTab('feed');
  };

  const handleUpdateUser = (updated: User) => {
    setCurrentUser(updated);
    localStorage.setItem('ettl_session_user', JSON.stringify(updated));
  };

  // Fetch all core datasets
  const fetchFeed = async () => {
    const res = await safeFetchJson<{ posts: FeedPost[] }>('/api/feed');
    if (res.ok && res.data) {
      setFeedPosts(res.data.posts || []);
    }
  };

  const fetchGroups = async () => {
    const res = await safeFetchJson<{ groups: Group[] }>('/api/groups');
    if (res.ok && res.data) {
      setGroups(res.data.groups || []);
    }
  };

  const fetchNotes = async () => {
    if (!currentUser) return;
    const res = await safeFetchJson<{ notes: AppNote[] }>(`/api/notes?userId=${currentUser.id}`);
    if (res.ok && res.data) {
      setNotes(res.data.notes || []);
    }
  };

  const fetchNotifications = async () => {
    if (!currentUser) return;
    const res = await safeFetchJson<{ notifications: AppNotification[] }>(
      `/api/notifications?userId=${currentUser.id}`
    );
    if (res.ok && res.data) {
      setNotifications(res.data.notifications || []);
    }
  };

  const fetchAllData = () => {
    fetchFeed();
    fetchGroups();
    fetchNotes();
    fetchNotifications();
  };

  useEffect(() => {
    if (currentUser) {
      fetchAllData();

      // Real-time polling interval for live notifications and feed updates
      const interval = setInterval(() => {
        fetchNotifications();
        if (activeTab === 'feed') fetchFeed();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentUser?.id, activeTab]);

  const handleMarkAllNotificationsRead = async () => {
    if (!currentUser) return;
    const res = await safeFetchJson('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id }),
    });
    if (res.ok) {
      fetchNotifications();
    }
  };

  const handleMarkSingleNotificationRead = async (notificationId: string) => {
    if (!currentUser) return;
    const res = await safeFetchJson('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id, notificationId }),
    });
    if (res.ok) {
      fetchNotifications();
    }
  };

  const handleGoHome = () => {
    setIsAdminView(false);
    setActiveTab('feed');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (isAdminView) {
      setIsAdminView(false);
    } else if (activeTab !== 'feed') {
      setActiveTab('feed');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const canGoBack = isAdminView || activeTab !== 'feed';

  // If not logged in, display the Auth Screen
  if (!currentUser) {
    return <AuthModal onLoginSuccess={handleLoginSuccess} lang={lang} />;
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col selection:bg-amber-400 selection:text-slate-950 font-sans antialiased">
      {/* Top Fixed Navbar */}
      <Navbar
        user={currentUser}
        isAdmin={isAdmin}
        lang={lang}
        onToggleLang={handleToggleLang}
        notifications={notifications}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenAdmin={() => setIsAdminView(true)}
        isAdminView={isAdminView}
        onSwitchView={() => setIsAdminView(!isAdminView)}
        onRefresh={fetchAllData}
        onGoHome={handleGoHome}
        canGoBack={canGoBack}
        onBack={handleBack}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-4 pt-4 sm:pt-6">
        {isAdmin && isAdminView ? (
          <AdminDashboard
            currentUser={currentUser}
            onRefreshAll={fetchAllData}
            lang={lang}
            onViewMedia={(url, type) => setActiveMedia({ url, type })}
            onExitAdmin={() => setIsAdminView(false)}
          />
        ) : (
          <>
            {activeTab === 'feed' && (
              <FeedTab
                posts={feedPosts}
                currentUser={currentUser}
                onRefreshPosts={fetchFeed}
                lang={lang}
                onViewMedia={(url, type) => setActiveMedia({ url, type })}
              />
            )}

            {activeTab === 'groups' && (
              <GroupsTab
                groups={groups}
                currentUser={currentUser}
                onRefreshGroups={fetchGroups}
                lang={lang}
                onViewMedia={(url, type) => setActiveMedia({ url, type })}
              />
            )}

            {activeTab === 'notes' && (
              <NotesTab
                notes={notes}
                currentUser={currentUser}
                onRefreshNotes={fetchNotes}
                lang={lang}
              />
            )}

            {activeTab === 'account' && (
              <AccountTab
                currentUser={currentUser}
                onUpdateUser={handleUpdateUser}
                onLogout={handleLogout}
                lang={lang}
                onSetLang={handleSetLang}
                onOpenAdmin={() => setIsAdminView(!isAdminView)}
                isAdminView={isAdminView}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Fixed Navigation Bar with exactly 4 icons (always visible) */}
      {!isAdminView && (
        <BottomNav
          activeTab={activeTab}
          onChangeTab={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          lang={lang}
        />
      )}

      {/* Slide-over Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onMarkSingleRead={handleMarkSingleNotificationRead}
        lang={lang}
      />

      {/* Media Viewer Lightbox */}
      <MediaViewerModal
        media={activeMedia}
        onClose={() => setActiveMedia(null)}
      />
    </div>
  );
}
