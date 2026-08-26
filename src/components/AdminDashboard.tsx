import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  LayoutDashboard,
  FolderLock,
  Users,
  UserCheck,
  Newspaper,
  FileText,
  ShieldAlert,
  Megaphone,
} from 'lucide-react';
import { User, Group, FeedPost, AppNote, AdminStats } from '../types';
import { translations, Language } from '../utils/i18n';
import { safeFetchJson } from '../utils/api';
import { AdminModeSwitch } from './AdminModeSwitch';

// Sub-pages
import { AdminOverviewPage } from './admin/AdminOverviewPage';
import { AdminGroupsChatPage } from './admin/AdminGroupsChatPage';
import { AdminMembersPage } from './admin/AdminMembersPage';
import { AdminGroupRequestsPage } from './admin/AdminGroupRequestsPage';
import { AdminFeedPage } from './admin/AdminFeedPage';
import { AdminNotesPage } from './admin/AdminNotesPage';
import { AdminDeletionsPage } from './admin/AdminDeletionsPage';
import { AdminBroadcastPage } from './admin/AdminBroadcastPage';

interface AdminDashboardProps {
  currentUser: User;
  onRefreshAll: () => void;
  lang: Language;
  onViewMedia: (url: string, type: 'image' | 'video') => void;
  onExitAdmin?: () => void;
}

export type AdminSubPage =
  | 'overview'
  | 'groups'
  | 'users'
  | 'group_requests'
  | 'feed'
  | 'notes'
  | 'deletions'
  | 'broadcast';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onRefreshAll,
  lang,
  onViewMedia,
  onExitAdmin,
}) => {
  const t = translations[lang];
  const [activeSubPage, setActiveSubPage] = useState<AdminSubPage>('overview');

  // Stats
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalPosts: 0,
    totalGroups: 0,
    totalNotes: 0,
    pendingJoinRequests: 0,
    pendingNoteDeletions: 0,
  });

  // Data collections
  const [usersList, setUsersList] = useState<User[]>([]);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [groupsList, setGroupsList] = useState<Group[]>([]);
  const [allNotes, setAllNotes] = useState<AppNote[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAdminData = async () => {
    setIsRefreshing(true);
    const [sRes, uRes, pRes, gRes, nRes] = await Promise.all([
      safeFetchJson<AdminStats>('/api/admin/stats'),
      safeFetchJson<{ users: User[] }>('/api/admin/users'),
      safeFetchJson<{ posts: FeedPost[] }>('/api/feed'),
      safeFetchJson<{ groups: Group[] }>('/api/groups'),
      safeFetchJson<{ notes: AppNote[] }>(`/api/notes?userId=${currentUser.id}&forAdmin=true`),
    ]);
    setIsRefreshing(false);

    if (sRes.ok && sRes.data) setStats(sRes.data);
    if (uRes.ok && uRes.data) setUsersList(uRes.data.users || []);
    if (pRes.ok && pRes.data) setFeedPosts(pRes.data.posts || []);
    if (gRes.ok && gRes.data) setGroupsList(gRes.data.groups || []);
    if (nRes.ok && nRes.data) setAllNotes(nRes.data.notes || []);
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRefresh = async () => {
    await fetchAdminData();
    onRefreshAll();
  };

  const pendingJoinCount = groupsList.reduce(
    (acc, g) => acc + g.pendingRequestUserIds.length,
    0
  );
  const pendingDeletionsCount = allNotes.filter((n) => n.isDeletionPending).length;

  const NAV_ITEMS = [
    {
      id: 'overview' as AdminSubPage,
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'groups' as AdminSubPage,
      label: 'Groups',
      icon: FolderLock,
      count: groupsList.length,
    },
    {
      id: 'users' as AdminSubPage,
      label: 'Members',
      icon: Users,
      count: usersList.length,
    },
    {
      id: 'group_requests' as AdminSubPage,
      label: 'Requests',
      icon: UserCheck,
      count: pendingJoinCount,
      alert: pendingJoinCount > 0,
    },
    {
      id: 'feed' as AdminSubPage,
      label: 'Feed',
      icon: Newspaper,
      count: feedPosts.length,
    },
    {
      id: 'notes' as AdminSubPage,
      label: 'Audit & Vault',
      icon: FileText,
      count: allNotes.length,
    },
    {
      id: 'deletions' as AdminSubPage,
      label: 'Approvals',
      icon: ShieldAlert,
      count: pendingDeletionsCount,
      alert: pendingDeletionsCount > 0,
    },
    {
      id: 'broadcast' as AdminSubPage,
      label: 'Broadcast',
      icon: Megaphone,
    },
  ];

  const currentNav = NAV_ITEMS.find((n) => n.id === activeSubPage) || NAV_ITEMS[0];
  const CurrentIcon = currentNav.icon;

  return (
    <div className="space-y-4 pb-12">
      {/* Interactive Mode Switch Banner on Admin Overview */}
      {activeSubPage === 'overview' && onExitAdmin && (
        <AdminModeSwitch
          isAdminMode={true}
          onToggle={onExitAdmin}
          lang={lang}
          variant="banner"
        />
      )}

      {/* Top Navigation Bar when inside any subpage */}
      {activeSubPage !== 'overview' && (
        <div className="sticky top-20 z-30 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              id="admin-back-to-overview-btn"
              onClick={() => {
                setActiveSubPage('overview');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer active:scale-95"
              title="Return to Admin Overview"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
              <span>Admin Overview</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 bg-slate-100 px-3 py-1.5 rounded-xl">
              <CurrentIcon className="w-4 h-4 text-blue-600" />
              <span>{currentNav.label}</span>
            </div>

            {onExitAdmin && (
              <AdminModeSwitch
                isAdminMode={true}
                onToggle={onExitAdmin}
                lang={lang}
                variant="compact"
              />
            )}
          </div>
        </div>
      )}

      {/* Render Active Dedicated Sub-Page */}
      {activeSubPage === 'overview' && (
        <AdminOverviewPage
          stats={stats}
          groups={groupsList}
          users={usersList}
          notes={allNotes}
          posts={feedPosts}
          onNavigateTo={(page) => {
            setActiveSubPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {activeSubPage === 'groups' && (
        <AdminGroupsChatPage
          groups={groupsList}
          users={usersList}
          currentUser={currentUser}
          onRefreshAll={handleRefresh}
          onViewMedia={onViewMedia}
        />
      )}

      {activeSubPage === 'users' && (
        <AdminMembersPage
          users={usersList}
          groups={groupsList}
          posts={feedPosts}
          notes={allNotes}
          currentUser={currentUser}
          onRefreshAll={handleRefresh}
        />
      )}

      {activeSubPage === 'group_requests' && (
        <AdminGroupRequestsPage
          groups={groupsList}
          users={usersList}
          onRefreshAll={handleRefresh}
        />
      )}

      {activeSubPage === 'feed' && (
        <AdminFeedPage
          posts={feedPosts}
          currentUser={currentUser}
          onRefreshAll={handleRefresh}
          onViewMedia={onViewMedia}
        />
      )}

      {activeSubPage === 'notes' && (
        <AdminNotesPage notes={allNotes} users={usersList} />
      )}

      {activeSubPage === 'deletions' && (
        <AdminDeletionsPage notes={allNotes} onRefreshAll={handleRefresh} />
      )}

      {activeSubPage === 'broadcast' && (
        <AdminBroadcastPage
          users={usersList}
          currentUser={currentUser}
          onRefreshAll={handleRefresh}
        />
      )}
    </div>
  );
};
