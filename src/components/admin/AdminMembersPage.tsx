import React, { useState } from 'react';
import {
  Users,
  Search,
  Phone,
  Calendar,
  Shield,
  ShieldAlert,
  Ban,
  CheckCircle2,
  Eye,
  X,
  FileText,
  FolderLock,
  Newspaper,
} from 'lucide-react';
import { User, Group, FeedPost, AppNote } from '../../types';
import { safeFetchJson } from '../../utils/api';

interface AdminMembersPageProps {
  users: User[];
  groups: Group[];
  posts: FeedPost[];
  notes: AppNote[];
  currentUser: User;
  onRefreshAll: () => void;
}

export const AdminMembersPage: React.FC<AdminMembersPageProps> = ({
  users,
  groups,
  posts,
  notes,
  currentUser,
  onRefreshAll,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [selectedUserDetail, setSelectedUserDetail] = useState<User | null>(null);

  const handleToggleBlockUser = async (userId: string) => {
    const res = await safeFetchJson(`/api/admin/users/${userId}/toggle-block`, {
      method: 'POST',
    });
    if (res.ok) {
      onRefreshAll();
      if (selectedUserDetail?.id === userId) {
        setSelectedUserDetail((prev) =>
          prev ? { ...prev, isBlocked: !prev.isBlocked } : null
        );
      }
    } else {
      alert(res.error || 'Failed to update user status.');
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === 'active') return !user.isBlocked;
    if (statusFilter === 'suspended') return user.isBlocked;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            <span>Employee & Member Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit registered accounts, monitor authentication status, and manage authorization levels.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or number..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Filter Tabs & Stats Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Members ({users.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'active'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active ({users.filter((u) => !u.isBlocked).length})
          </button>
          <button
            onClick={() => setStatusFilter('suspended')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'suspended'
                ? 'bg-white text-rose-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Suspended ({users.filter((u) => u.isBlocked).length})
          </button>
        </div>
      </div>

      {/* Members Directory Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
            <p className="text-xs font-bold text-slate-700">No members matched your search</p>
            <p className="text-[11px] text-slate-400">
              Try adjusting your query or filter tab.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredUsers.map((user) => {
              const isAdmin = user.role === 'admin';
              const userGroups = groups.filter((g) => g.memberIds.includes(user.id));
              const userNotes = notes.filter((n) => n.userId === user.id);
              const userPosts = posts.filter((p) => p.authorId === user.id);

              return (
                <div
                  key={user.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left Column: Avatar & Name (Fixed layout, clean spacing) */}
                  <div className="flex items-center gap-3.5 min-w-0 sm:min-w-[240px]">
                    <div className="relative shrink-0">
                      <img
                        src={
                          user.avatarUrl ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                            user.name
                          )}&backgroundColor=f59e0b`
                        }
                        alt={user.name}
                        className="w-11 h-11 rounded-2xl object-cover ring-2 ring-slate-100"
                      />
                      {isAdmin && (
                        <div
                          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center ring-2 ring-white"
                          title="System Admin"
                        >
                          <Shield className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 truncate block">
                          {user.name}
                        </span>
                        {isAdmin && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 shrink-0">
                            Admin
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block truncate">
                        ID: {user.id.slice(0, 14)}
                      </span>
                    </div>
                  </div>

                  {/* Center-Left Column: Bangladesh Phone Number (Pill Badge to prevent overlap) */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200/80 text-slate-800 text-xs font-mono font-bold tracking-wide">
                      <Phone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{user.phone}</span>
                    </div>
                  </div>

                  {/* Center Column: Registration Date & Stats */}
                  <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{userGroups.length} groups</span>
                      <span>·</span>
                      <span>{userNotes.length} notes</span>
                    </div>
                  </div>

                  {/* Center-Right Column: Account Status Badge */}
                  <div className="shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        user.isBlocked
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {user.isBlocked ? (
                        <>
                          <Ban className="w-3 h-3" />
                          <span>Suspended</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active Access</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Right Column: Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedUserDetail(user)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors"
                      title="View Member Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>

                    {!isAdmin && (
                      <button
                        onClick={() => handleToggleBlockUser(user.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1 ${
                          user.isBlocked
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>{user.isBlocked ? 'Activate' : 'Suspend'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* User Details Drawer Modal */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-base">Employee Record Overview</h3>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <img
                src={
                  selectedUserDetail.avatarUrl ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                    selectedUserDetail.name
                  )}&backgroundColor=f59e0b`
                }
                alt={selectedUserDetail.name}
                className="w-12 h-12 rounded-2xl object-cover ring-1 ring-slate-200"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-extrabold text-sm text-slate-900 truncate">
                  {selectedUserDetail.name}
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono mt-0.5">
                  <Phone className="w-3 h-3 text-amber-600" />
                  <span>{selectedUserDetail.phone}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Groups</span>
                <p className="text-lg font-black text-slate-900">
                  {groups.filter((g) => g.memberIds.includes(selectedUserDetail.id)).length}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Notes</span>
                <p className="text-lg font-black text-slate-900">
                  {notes.filter((n) => n.userId === selectedUserDetail.id).length}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Posts</span>
                <p className="text-lg font-black text-slate-900">
                  {posts.filter((p) => p.authorId === selectedUserDetail.id).length}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Account ID</span>
                <span className="font-mono text-slate-700">{selectedUserDetail.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Joined Date</span>
                <span className="text-slate-700">
                  {new Date(selectedUserDetail.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Access Status</span>
                <span
                  className={`font-bold ${
                    selectedUserDetail.isBlocked ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {selectedUserDetail.isBlocked ? 'Suspended' : 'Active Authorization'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              {selectedUserDetail.role !== 'admin' && (
                <button
                  type="button"
                  onClick={() => handleToggleBlockUser(selectedUserDetail.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold ${
                    selectedUserDetail.isBlocked
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  {selectedUserDetail.isBlocked ? 'Activate Account' : 'Suspend Account'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedUserDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
