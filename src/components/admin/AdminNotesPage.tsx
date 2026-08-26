import React, { useState } from 'react';
import {
  FileText,
  DollarSign,
  KeyRound,
  Search,
  ArrowLeft,
  Eye,
  EyeOff,
  Copy,
  Check,
  User as UserIcon,
  Phone,
  Shield,
  ChevronRight,
  Clock,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { AppNote, PaymentNote, IdPasswordNote, User } from '../../types';

interface AdminNotesPageProps {
  notes: AppNote[];
  users: User[];
}

export const AdminNotesPage: React.FC<AdminNotesPageProps> = ({ notes, users }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [noteTypeFilter, setNoteTypeFilter] = useState<'payment' | 'id_password'>('payment');
  const [recordSearchQuery, setRecordSearchQuery] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleRevealPassword = (id: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter users by search query
  const filteredUsers = users.filter((u) => {
    const q = userSearchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      (u.department && u.department.toLowerCase().includes(q))
    );
  });

  // Calculate notes for a specific user
  const getUserNotes = (userId: string) => {
    return notes.filter((n) => n.userId === userId);
  };

  // If a user is selected, filter their notes by the selected tab (payment or id_password)
  const selectedUserNotes = selectedUser ? getUserNotes(selectedUser.id) : [];
  const selectedUserPayments = selectedUserNotes.filter((n) => n.type === 'payment') as PaymentNote[];
  const selectedUserIdPasswords = selectedUserNotes.filter((n) => n.type === 'id_password') as IdPasswordNote[];

  const activeNotesList =
    noteTypeFilter === 'payment'
      ? selectedUserPayments.filter((n) => {
          const q = recordSearchQuery.toLowerCase();
          return (
            n.title.toLowerCase().includes(q) ||
            n.whoPaid.toLowerCase().includes(q) ||
            n.reason.toLowerCase().includes(q) ||
            (n.optionalNotes && n.optionalNotes.toLowerCase().includes(q)) ||
            n.amount.toString().includes(q)
          );
        })
      : selectedUserIdPasswords.filter((n) => {
          const q = recordSearchQuery.toLowerCase();
          return (
            n.title.toLowerCase().includes(q) ||
            (n.usernameOrId && n.usernameOrId.toLowerCase().includes(q)) ||
            (n.content && n.content.toLowerCase().includes(q))
          );
        });

  return (
    <div className="space-y-4">
      {/* View 1: Registered Users Directory for Audit */}
      {!selectedUser ? (
        <div className="space-y-4">
          {/* Header Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-900 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4 text-amber-700" />
                </div>
                <h2 className="text-lg font-black text-slate-900">
                  Employee Vaults & Audit Records
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Select any registered user profile to inspect their payment logs, transactions, and secure credentials.
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                id="audit-user-search-input"
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search by name, phone..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-500 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          {/* Users List Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredUsers.length === 0 ? (
              <div className="sm:col-span-2 lg:col-span-3 bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200 space-y-2">
                <UserIcon className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                <p className="text-sm font-bold text-slate-700">No matching employees found</p>
                <p className="text-xs text-slate-400">
                  Try searching with a different name or phone number.
                </p>
              </div>
            ) : (
              filteredUsers.map((user) => {
                const userNotesList = getUserNotes(user.id);
                const paymentCount = userNotesList.filter((n) => n.type === 'payment').length;
                const passCount = userNotesList.filter((n) => n.type === 'id_password').length;

                return (
                  <button
                    key={user.id}
                    id={`audit-user-card-${user.id}`}
                    onClick={() => {
                      setSelectedUser(user);
                      setRecordSearchQuery('');
                    }}
                    className="bg-white hover:bg-amber-50/40 p-4 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-amber-400/80 transition-all text-left flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              user.avatarUrl ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                user.name
                              )}&backgroundColor=f59e0b`
                            }
                            alt={user.name}
                            className="w-11 h-11 rounded-2xl object-cover ring-2 ring-amber-400/50 shadow-xs group-hover:scale-105 transition-transform"
                          />
                          <div>
                            <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-amber-800 transition-colors flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {user.isBlocked && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-800">
                                  Suspended
                                </span>
                              )}
                            </h3>
                            <p className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{user.phone}</span>
                            </p>
                          </div>
                        </div>

                        <div className="w-7 h-7 rounded-xl bg-slate-100 group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center text-slate-400 transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>

                      {user.department && (
                        <p className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg w-fit mb-3">
                          {user.department}
                        </p>
                      )}
                    </div>

                    {/* Summary Badges for Payments & Notes */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 mt-2">
                      <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-100/80">
                        <span className="text-[10px] font-bold text-amber-800 block flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> Payments
                        </span>
                        <span className="text-sm font-black text-amber-950">
                          {paymentCount} {paymentCount === 1 ? 'Record' : 'Records'}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-blue-50/80 border border-blue-100/80">
                        <span className="text-[10px] font-bold text-blue-800 block flex items-center gap-1">
                          <KeyRound className="w-3 h-3" /> ID & Passwords
                        </span>
                        <span className="text-sm font-black text-blue-950">
                          {passCount} {passCount === 1 ? 'Entry' : 'Entries'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* View 2: Selected User's Detailed Audit View with 2 Main Options */
        <div className="space-y-4">
          {/* Top Bar with Back Button */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  id="audit-back-to-users-btn"
                  onClick={() => setSelectedUser(null)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to All Users</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <img
                    src={
                      selectedUser.avatarUrl ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                        selectedUser.name
                      )}&backgroundColor=f59e0b`
                    }
                    alt={selectedUser.name}
                    className="w-10 h-10 rounded-2xl object-cover ring-2 ring-amber-400 shadow-xs"
                  />
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                      {selectedUser.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      {selectedUser.phone} {selectedUser.department ? `• ${selectedUser.department}` : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Records Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={recordSearchQuery}
                  onChange={(e) => setRecordSearchQuery(e.target.value)}
                  placeholder={`Search ${selectedUser.name}'s records...`}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-500 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            {/* 2 Big Choice Buttons: Payment Notes vs ID & Password Notes */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                id="audit-tab-payment"
                onClick={() => setNoteTypeFilter('payment')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  noteTypeFilter === 'payment'
                    ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/30 text-amber-950 font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                      noteTypeFilter === 'payment'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm">৳ Payment Notes</h4>
                    <p className="text-xs text-slate-500">
                      Disbursements, payments & receipts
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-black ${
                    noteTypeFilter === 'payment'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {selectedUserPayments.length}
                </span>
              </button>

              <button
                id="audit-tab-id-password"
                onClick={() => setNoteTypeFilter('id_password')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  noteTypeFilter === 'id_password'
                    ? 'bg-blue-500/15 border-blue-500 ring-2 ring-blue-500/30 text-blue-950 font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                      noteTypeFilter === 'id_password'
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm">🔑 ID & Password Notes</h4>
                    <p className="text-xs text-slate-500">
                      Encrypted credentials & access codes
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-black ${
                    noteTypeFilter === 'id_password'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {selectedUserIdPasswords.length}
                </span>
              </button>
            </div>
          </div>

          {/* Active Option Records List */}
          <div className="grid gap-3">
            {activeNotesList.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center text-slate-400 border border-slate-200 space-y-2">
                <FileText className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                <p className="text-sm font-bold text-slate-700">
                  No {noteTypeFilter === 'payment' ? 'payment notes' : 'ID & password entries'} found
                </p>
                <p className="text-xs text-slate-400">
                  {selectedUser.name} has not recorded any{' '}
                  {noteTypeFilter === 'payment' ? 'payments' : 'credentials'} in this section yet.
                </p>
              </div>
            ) : (
              activeNotesList.map((note) => {
                const isPayment = note.type === 'payment';
                const payNote = isPayment ? (note as PaymentNote) : null;
                const idNote = !isPayment ? (note as IdPasswordNote) : null;

                return (
                  <div
                    key={note.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3"
                  >
                    {/* Header info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`p-2 rounded-xl text-xs font-black flex items-center gap-1 ${
                            isPayment ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                          }`}
                        >
                          {isPayment ? <DollarSign className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />}
                          <span>{isPayment ? 'Payment Record' : 'Credential Vault'}</span>
                        </span>
                        <h3 className="font-extrabold text-sm text-slate-900">{note.title}</h3>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {note.noteDate} {note.noteTime}
                        </span>
                        {note.isDeletionPending && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                            Deletion Pending
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body Details */}
                    {isPayment && payNote && (
                      <div className="space-y-3">
                        <div className="grid sm:grid-cols-3 gap-3 text-xs">
                          <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/70">
                            <span className="text-[10px] font-bold text-amber-800 uppercase block">
                              Amount (BDT)
                            </span>
                            <p className="text-xl font-black text-amber-950">
                              ৳ {payNote.amount.toLocaleString()}
                            </p>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">
                              Who Paid
                            </span>
                            <p className="font-bold text-slate-800 text-sm mt-0.5">{payNote.whoPaid}</p>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">
                              Payment Purpose
                            </span>
                            <p className="font-bold text-slate-800 text-sm mt-0.5">{payNote.reason}</p>
                          </div>
                        </div>

                        {payNote.optionalNotes && (
                          <div className="p-3 bg-slate-50 rounded-2xl text-slate-700 text-xs border border-slate-100">
                            <strong className="text-slate-900 block mb-0.5">Remarks / Details:</strong>
                            <p className="whitespace-pre-wrap">{payNote.optionalNotes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {!isPayment && idNote && (
                      <div className="space-y-2 text-xs">
                        <div className="grid sm:grid-cols-2 gap-2.5">
                          {idNote.usernameOrId && (
                            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                                  Username / ID
                                </span>
                                <span className="font-mono font-bold text-slate-900 text-sm">
                                  {idNote.usernameOrId}
                                </span>
                              </div>
                              <button
                                onClick={() => handleCopy(idNote.usernameOrId!, `usr-${idNote.id}`)}
                                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl transition-all"
                                title="Copy ID"
                              >
                                {copiedId === `usr-${idNote.id}` ? (
                                  <Check className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          )}

                          {idNote.password && (
                            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                                  Password / Secret
                                </span>
                                <span className="font-mono font-bold text-slate-900 text-sm">
                                  {revealedPasswords[idNote.id] ? idNote.password : '••••••••••••'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => toggleRevealPassword(idNote.id)}
                                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl transition-all"
                                  title={revealedPasswords[idNote.id] ? 'Hide' : 'Reveal'}
                                >
                                  {revealedPasswords[idNote.id] ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleCopy(idNote.password!, `pass-${idNote.id}`)}
                                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl transition-all"
                                  title="Copy Password"
                                >
                                  {copiedId === `pass-${idNote.id}` ? (
                                    <Check className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {idNote.content && (
                          <div className="p-3 bg-slate-50 rounded-2xl text-slate-700 text-xs border border-slate-100 whitespace-pre-wrap">
                            <strong className="text-slate-900 block mb-0.5">Secure Notes / Info:</strong>
                            {idNote.content}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
