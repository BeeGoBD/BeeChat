import React, { useState } from 'react';
import {
  Megaphone,
  Send,
  Users,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Sparkles,
  UserCheck,
  UserX,
  User as UserIcon,
  Search,
  Check,
} from 'lucide-react';
import { User } from '../../types';
import { safeFetchJson } from '../../utils/api';
import confetti from 'canvas-confetti';

interface AdminBroadcastPageProps {
  users: User[];
  currentUser: User;
  onRefreshAll: () => void;
}

type AudienceTarget = 'all' | 'active_users' | 'rejected_users' | 'individual';

export const AdminBroadcastPage: React.FC<AdminBroadcastPageProps> = ({
  users,
  currentUser,
  onRefreshAll,
}) => {
  const [audienceType, setAudienceType] = useState<AudienceTarget>('all');
  const [selectedIndividualUser, setSelectedIndividualUser] = useState<string>(
    users[0]?.id || ''
  );
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);

  const activeUsers = users.filter((u) => !u.isBlocked);
  const rejectedUsers = users.filter((u) => u.isBlocked);

  // Calculate actual recipient ID for server
  const getRecipientId = () => {
    if (audienceType === 'individual') {
      return selectedIndividualUser;
    }
    return audienceType;
  };

  // Get recipient count preview
  const getRecipientCountText = () => {
    switch (audienceType) {
      case 'all':
        return `All ${users.length} registered members (both active & suspended)`;
      case 'active_users':
        return `${activeUsers.length} active approved employees`;
      case 'rejected_users':
        return `${rejectedUsers.length} suspended/rejected users`;
      case 'individual':
        const target = users.find((u) => u.id === selectedIndividualUser);
        return target ? `Individual: ${target.name} (${target.phone})` : '1 selected user';
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    const recipientId = getRecipientId();
    if (audienceType === 'individual' && !recipientId) {
      alert('Please select an individual recipient.');
      return;
    }

    setIsSending(true);
    const res = await safeFetchJson('/api/admin/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminId: currentUser.id,
        recipientId,
        title: broadcastTitle.trim() || 'Official Notice',
        message: broadcastMessage.trim(),
      }),
    });
    setIsSending(false);

    if (res.ok) {
      setBroadcastTitle('');
      setBroadcastMessage('');
      setBroadcastSent(true);
      setTimeout(() => setBroadcastSent(false), 4000);
      onRefreshAll();
      confetti({ particleCount: 55, spread: 70, origin: { y: 0.6 } });
    } else {
      alert(res.error || 'Failed to send notification.');
    }
  };

  const filteredIndividualUsers = users.filter((u) => {
    const q = userSearchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.phone.includes(q);
  });

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-blue-600" />
            <span>Targeted Notifications & Broadcasts</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dispatch announcements to all users, active approved members, rejected users, or specific individuals.
          </p>
        </div>
      </div>

      {/* Broadcast Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#25D366] via-[#00B2FE] to-[#006AFF] flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-black">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-black text-base text-slate-900">Push Notification Dispatcher</h3>
            <p className="text-xs text-slate-500">
              Immediate inbox alerts and notification badges will be delivered to chosen recipients.
            </p>
          </div>
        </div>

        {broadcastSent && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">Notification Broadcasted Successfully!</p>
              <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                Delivered to {getRecipientCountText()}.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSendBroadcast} className="space-y-5">
          {/* 4 Audience Targeting Selectors */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-900">
              Choose Target Audience *
            </label>

            <div className="grid sm:grid-cols-2 gap-2.5">
              {/* Option 1: All Users (Approved + Rejected) */}
              <button
                type="button"
                id="audience-target-all"
                onClick={() => setAudienceType('all')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  audienceType === 'all'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-blue-500/40'
                    : 'bg-slate-50 border-slate-200/90 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                      audienceType === 'all' ? 'bg-gradient-to-r from-emerald-500 to-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black">All Users</h4>
                    <p className="text-[10px] opacity-75">Approved & Rejected</p>
                  </div>
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-blue-500/20">
                  {users.length}
                </span>
              </button>

              {/* Option 2: All Active / Approved Users */}
              <button
                type="button"
                id="audience-target-active"
                onClick={() => setAudienceType('active_users')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  audienceType === 'active_users'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-900 shadow-sm ring-2 ring-emerald-400/40'
                    : 'bg-slate-50 border-slate-200/90 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                      audienceType === 'active_users'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black">All Active Users</h4>
                    <p className="text-[10px] opacity-75">Approved Members Only</p>
                  </div>
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-500/20">
                  {activeUsers.length}
                </span>
              </button>

              {/* Option 3: All Suspended / Rejected Users */}
              <button
                type="button"
                id="audience-target-rejected"
                onClick={() => setAudienceType('rejected_users')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  audienceType === 'rejected_users'
                    ? 'bg-rose-950 text-rose-300 border-rose-900 shadow-sm ring-2 ring-rose-400/40'
                    : 'bg-slate-50 border-slate-200/90 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                      audienceType === 'rejected_users'
                        ? 'bg-rose-500 text-white'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    <UserX className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black">All Rejected Users</h4>
                    <p className="text-[10px] opacity-75">Suspended / Blocked</p>
                  </div>
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-rose-500/20">
                  {rejectedUsers.length}
                </span>
              </button>

              {/* Option 4: Individual User */}
              <button
                type="button"
                id="audience-target-individual"
                onClick={() => setAudienceType('individual')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  audienceType === 'individual'
                    ? 'bg-blue-950 text-blue-300 border-blue-900 shadow-sm ring-2 ring-blue-400/40'
                    : 'bg-slate-50 border-slate-200/90 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                      audienceType === 'individual' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black">Individual User</h4>
                    <p className="text-[10px] opacity-75">Specific Single Recipient</p>
                  </div>
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-blue-500/20">
                  1 User
                </span>
              </button>
            </div>
          </div>

          {/* If Individual selected, show User Search & Selector */}
          {audienceType === 'individual' && (
            <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200/80 space-y-3">
              <label className="block text-xs font-bold text-blue-950">
                Select Individual Recipient *
              </label>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Filter by employee name or phone..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-blue-200 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {filteredIndividualUsers.length === 0 ? (
                  <p className="text-xs text-slate-400 p-2 text-center">No matching employees</p>
                ) : (
                  filteredIndividualUsers.map((u) => {
                    const isSelected = selectedIndividualUser === u.id;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setSelectedIndividualUser(u.id)}
                        className={`w-full p-2 rounded-xl text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : 'bg-white text-slate-800 hover:bg-blue-100/60 border border-slate-200/60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              u.avatarUrl ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                u.name
                              )}&backgroundColor=25D366`
                            }
                            alt={u.name}
                            className="w-6 h-6 rounded-full object-cover ring-1 ring-emerald-400"
                          />
                          <span>{u.name}</span>
                          <span className={`font-mono text-[11px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                            ({u.phone})
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Notice Subject / Heading
            </label>
            <input
              type="text"
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              placeholder="e.g. Urgent System Notice, Meeting Reminder, or Payment Update"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Notice Content / Message *
            </label>
            <textarea
              rows={4}
              required
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Enter official announcement text here..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={isSending || !broadcastMessage.trim()}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#25D366] via-[#00B2FE] to-[#006AFF] text-white font-black text-xs shadow-md hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <Send className="w-4 h-4" />
            <span>
              {isSending
                ? 'Broadcasting Message...'
                : `Dispatch Notification to ${getRecipientCountText()}`}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
