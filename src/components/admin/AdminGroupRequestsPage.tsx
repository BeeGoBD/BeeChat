import React from 'react';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  FolderLock,
  Phone,
  Calendar,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { Group, User } from '../../types';
import { safeFetchJson } from '../../utils/api';
import confetti from 'canvas-confetti';

interface AdminGroupRequestsPageProps {
  groups: Group[];
  users: User[];
  onRefreshAll: () => void;
}

export const AdminGroupRequestsPage: React.FC<AdminGroupRequestsPageProps> = ({
  groups,
  users,
  onRefreshAll,
}) => {
  // Collect all pending requests across all groups
  const allPendingRequests: Array<{
    group: Group;
    user: User | undefined;
    userId: string;
  }> = [];

  groups.forEach((group) => {
    group.pendingRequestUserIds.forEach((uId) => {
      const user = users.find((u) => u.id === uId);
      allPendingRequests.push({ group, user, userId: uId });
    });
  });

  const handleApprove = async (groupId: string, targetUserId: string) => {
    const res = await safeFetchJson(`/api/groups/${groupId}/approve-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId }),
    });
    if (res.ok) {
      onRefreshAll();
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } else {
      alert(res.error || 'Failed to approve request');
    }
  };

  const handleReject = async (groupId: string, targetUserId: string) => {
    const res = await safeFetchJson(`/api/groups/${groupId}/reject-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId }),
    });
    if (res.ok) {
      onRefreshAll();
    } else {
      alert(res.error || 'Failed to decline request');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-500" />
            <span>Group Joining Requests</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review and grant or decline employee access requests to private company channels.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-amber-100/80 border border-amber-200 text-amber-900 text-xs font-black self-start sm:self-auto">
          {allPendingRequests.length} Pending Approvals
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {allPendingRequests.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 stroke-1" />
            <p className="text-sm font-bold text-slate-800">All Group Requests Cleared</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              There are no pending employee requests waiting for approval at this moment.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {allPendingRequests.map(({ group, user, userId }) => (
              <div
                key={`${group.id}-${userId}`}
                className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* User Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={
                      user?.avatarUrl ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                        user?.name || 'User'
                      )}&backgroundColor=f59e0b`
                    }
                    alt={user?.name || 'Member'}
                    className="w-11 h-11 rounded-2xl object-cover ring-2 ring-slate-100 shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="font-extrabold text-sm text-slate-900 truncate block">
                      {user?.name || 'Member'}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                      <Phone className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>{user?.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Requested Group Info */}
                <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0"
                    style={{ backgroundColor: group.avatarColor || '#F59E0B' }}
                  >
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                      Requesting to join
                    </span>
                    <span className="font-bold text-xs text-slate-900 truncate block">
                      {group.name}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => handleApprove(group.id, userId)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Member</span>
                  </button>
                  <button
                    onClick={() => handleReject(group.id, userId)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-200 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
