import React from 'react';
import {
  Shield,
  Users,
  FolderLock,
  Newspaper,
  FileText,
  UserCheck,
  ShieldAlert,
  Megaphone,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';
import { AdminStats, Group, User, AppNote, FeedPost } from '../../types';

interface AdminOverviewPageProps {
  stats: AdminStats;
  groups: Group[];
  users: User[];
  notes: AppNote[];
  posts: FeedPost[];
  onNavigateTo: (
    page:
      | 'overview'
      | 'groups'
      | 'users'
      | 'group_requests'
      | 'feed'
      | 'notes'
      | 'deletions'
      | 'broadcast'
  ) => void;
}

export const AdminOverviewPage: React.FC<AdminOverviewPageProps> = ({
  stats,
  groups,
  users,
  notes,
  posts,
  onNavigateTo,
}) => {
  const pendingRequests = groups.reduce((acc, g) => acc + g.pendingRequestUserIds.length, 0);
  const pendingDeletions = notes.filter((n) => n.isDeletionPending).length;

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid (Clickable to jump directly to the respective page!) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Members */}
        <div
          onClick={() => onNavigateTo('users')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-500 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Registered Members</span>
            <Users className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{users.length}</span>
            <span className="text-xs font-bold text-blue-600 group-hover:underline flex items-center gap-0.5">
              <span>Manage</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Active Groups */}
        <div
          onClick={() => onNavigateTo('groups')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-500 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Company Groups</span>
            <FolderLock className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{groups.length}</span>
            <span className="text-xs font-bold text-emerald-600 group-hover:underline flex items-center gap-0.5">
              <span>Open Chat</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Group Join Requests */}
        <div
          onClick={() => onNavigateTo('group_requests')}
          className={`p-4 sm:p-5 rounded-2xl border shadow-2xs hover:shadow-md cursor-pointer transition-all group ${
            pendingRequests > 0
              ? 'bg-blue-50/70 border-blue-300'
              : 'bg-white border-slate-200 hover:border-blue-400'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Join Requests</span>
            <UserCheck className={`w-4 h-4 ${pendingRequests > 0 ? 'text-blue-600' : 'text-slate-400'}`} />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{pendingRequests}</span>
            <span className="text-xs font-bold text-blue-600 group-hover:underline flex items-center gap-0.5">
              <span>Review</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Note Deletions Pending */}
        <div
          onClick={() => onNavigateTo('deletions')}
          className={`p-4 sm:p-5 rounded-2xl border shadow-2xs hover:shadow-md cursor-pointer transition-all group ${
            pendingDeletions > 0
              ? 'bg-rose-50/70 border-rose-300'
              : 'bg-white border-slate-200 hover:border-rose-400'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Deletion Requests</span>
            <ShieldAlert className={`w-4 h-4 ${pendingDeletions > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{pendingDeletions}</span>
            <span className="text-xs font-bold text-rose-600 group-hover:underline flex items-center gap-0.5">
              <span>Approve</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Quick Launchpad to All Dedicated Sections */}
      <div className="space-y-3">
        <h3 className="font-black text-xs text-slate-500 uppercase tracking-wider">
          Dedicated Management Hub
        </h3>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* 1. Groups & Live Chat */}
          <div
            onClick={() => onNavigateTo('groups')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-500 hover:shadow-md cursor-pointer transition-all flex items-start gap-3.5 group"
          >
            <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800 group-hover:scale-105 transition-transform shrink-0">
              <FolderLock className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center justify-between">
                <span>Groups & Live Chat</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Chat with teams, send messages, react with emojis, create groups, and manage permissions.
              </p>
            </div>
          </div>

          {/* 2. Employee Directory */}
          <div
            onClick={() => onNavigateTo('users')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-500 hover:shadow-md cursor-pointer transition-all flex items-start gap-3.5 group"
          >
            <div className="p-3 rounded-2xl bg-blue-100 text-blue-900 group-hover:scale-105 transition-transform shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center justify-between">
                <span>Member Directory</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Inspect registered Bangladesh members, access status, and suspend or activate accounts.
              </p>
            </div>
          </div>

          {/* 3. Group Join Requests */}
          <div
            onClick={() => onNavigateTo('group_requests')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-500 hover:shadow-md cursor-pointer transition-all flex items-start gap-3.5 group"
          >
            <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-900 group-hover:scale-105 transition-transform shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center justify-between">
                <span>Group Join Approvals</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Review and approve or reject member requests to join private company channels.
              </p>
            </div>
          </div>

          {/* 4. Feed Moderation */}
          <div
            onClick={() => onNavigateTo('feed')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-500 hover:shadow-md cursor-pointer transition-all flex items-start gap-3.5 group"
          >
            <div className="p-3 rounded-2xl bg-sky-100 text-sky-900 group-hover:scale-105 transition-transform shrink-0">
              <Newspaper className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center justify-between">
                <span>Feed Moderation</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Audit company feed posts, inspect images and videos, and delete inappropriate content.
              </p>
            </div>
          </div>

          {/* 5. Notes & Audit Trail */}
          <div
            onClick={() => onNavigateTo('notes')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-500 hover:shadow-md cursor-pointer transition-all flex items-start gap-3.5 group"
          >
            <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-900 group-hover:scale-105 transition-transform shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center justify-between">
                <span>Notes & Records Audit</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Audit employee financial payment transactions and encrypted ID/Password vault logs.
              </p>
            </div>
          </div>

          {/* 6. Broadcast Announcements */}
          <div
            onClick={() => onNavigateTo('broadcast')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-500 hover:shadow-md cursor-pointer transition-all flex items-start gap-3.5 group"
          >
            <div className="p-3 rounded-2xl bg-blue-100 text-blue-900 group-hover:scale-105 transition-transform shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center justify-between">
                <span>Company Broadcasts</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Send company-wide push notices or targeted alerts to individual team members.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
