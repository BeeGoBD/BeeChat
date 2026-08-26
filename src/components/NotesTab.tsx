import React, { useState } from 'react';
import {
  Plus,
  Search,
  DollarSign,
  KeyRound,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  Clock,
  Calendar,
  User as UserIcon,
  FileText,
  AlertTriangle,
  X,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { AppNote, PaymentNote, IdPasswordNote, User } from '../types';
import { translations, Language } from '../utils/i18n';
import confetti from 'canvas-confetti';
import { safeFetchJson } from '../utils/api';

interface NotesTabProps {
  notes: AppNote[];
  currentUser: User;
  onRefreshNotes: () => void;
  lang: Language;
}

export const NotesTab: React.FC<NotesTabProps> = ({
  notes,
  currentUser,
  onRefreshNotes,
  lang,
}) => {
  const t = translations[lang];

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'payment' | 'id_password'>('all');

  // Floating button speed dial menu toggle
  const [showSpeedDial, setShowSpeedDial] = useState(false);

  // Modals for adding notes
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showIdPasswordModal, setShowIdPasswordModal] = useState(false);

  // Form states for Payment Note
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReason, setPaymentReason] = useState('');
  const [whoPaid, setWhoPaid] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentTime, setPaymentTime] = useState(
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  );

  // Form states for ID & Password Note
  const [idTitle, setIdTitle] = useState('');
  const [idUsername, setIdUsername] = useState('');
  const [idPassword, setIdPassword] = useState('');
  const [idUrl, setIdUrl] = useState('');
  const [idContent, setIdContent] = useState('');
  const [idDate, setIdDate] = useState(new Date().toISOString().split('T')[0]);
  const [idTime, setIdTime] = useState(
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  );

  // Deletion Request Confirmation Modal state
  const [noteToDelete, setNoteToDelete] = useState<AppNote | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View note details modal
  const [selectedNote, setSelectedNote] = useState<AppNote | null>(null);
  const [showPasswordSecret, setShowPasswordSecret] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreatePaymentNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAmount || !paymentReason.trim() || !whoPaid.trim()) return;

    setIsSubmitting(true);
    const res = await safeFetchJson('/api/notes/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        amount: Number(paymentAmount),
        reason: paymentReason.trim(),
        whoPaid: whoPaid.trim(),
        optionalNotes: paymentNotes.trim(),
        noteDate: paymentDate,
        noteTime: paymentTime,
      }),
    });
    setIsSubmitting(false);

    if (res.ok) {
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentReason('');
      setWhoPaid('');
      setPaymentNotes('');
      onRefreshNotes();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } else {
      alert(res.error || 'Failed to create payment note');
    }
  };

  const handleCreateIdPasswordNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idTitle.trim()) return;

    setIsSubmitting(true);
    const res = await safeFetchJson('/api/notes/id-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        title: idTitle.trim(),
        usernameOrId: idUsername.trim(),
        password: idPassword,
        urlOrApp: idUrl.trim(),
        content: idContent.trim(),
        noteDate: idDate,
        noteTime: idTime,
      }),
    });
    setIsSubmitting(false);

    if (res.ok) {
      setShowIdPasswordModal(false);
      setIdTitle('');
      setIdUsername('');
      setIdPassword('');
      setIdUrl('');
      setIdContent('');
      onRefreshNotes();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } else {
      alert(res.error || 'Failed to create ID & Password note');
    }
  };

  const handleConfirmDeleteRequest = async () => {
    if (!noteToDelete) return;
    setIsSubmitting(true);
    const res = await safeFetchJson(`/api/notes/${noteToDelete.id}/request-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id }),
    });
    setIsSubmitting(false);

    if (res.ok) {
      setNoteToDelete(null);
      if (selectedNote?.id === noteToDelete.id) {
        setSelectedNote(null);
      }
      onRefreshNotes();
    } else {
      alert(res.error || 'Failed to submit delete request');
    }
  };

  // Filter notes by search query and type
  const filteredNotes = notes.filter((n) => {
    if (filterType !== 'all' && n.type !== filterType) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    const matchTitle = n.title?.toLowerCase().includes(q);
    const matchDate = n.noteDate?.toLowerCase().includes(q);
    const matchTime = n.noteTime?.toLowerCase().includes(q);

    if (n.type === 'payment') {
      const pn = n as PaymentNote;
      return (
        matchTitle ||
        matchDate ||
        matchTime ||
        pn.reason?.toLowerCase().includes(q) ||
        pn.whoPaid?.toLowerCase().includes(q) ||
        pn.optionalNotes?.toLowerCase().includes(q) ||
        pn.amount.toString().includes(q)
      );
    } else {
      const inote = n as IdPasswordNote;
      return (
        matchTitle ||
        matchDate ||
        matchTime ||
        inote.content?.toLowerCase().includes(q) ||
        inote.usernameOrId?.toLowerCase().includes(q) ||
        inote.urlOrApp?.toLowerCase().includes(q)
      );
    }
  });

  return (
    <div className="space-y-4 pb-28 max-w-2xl mx-auto relative min-h-[calc(100vh-10rem)]">
      {/* Header & Filter Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              {t.notesTitle}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Encrypted company payment records & credential vault
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="search-notes-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchNotesPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-xs sm:text-sm text-slate-900 outline-none focus:border-amber-500 shadow-2xs transition-all"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            id="filter-all-notes-btn"
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterType === 'all'
                ? 'bg-slate-900 text-amber-400 shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t.filterAll} ({notes.length})
          </button>
          <button
            id="filter-payment-notes-btn"
            onClick={() => setFilterType('payment')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              filterType === 'payment'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>{t.filterPayment}</span>
          </button>
          <button
            id="filter-id-notes-btn"
            onClick={() => setFilterType('id_password')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              filterType === 'id_password'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{t.filterIdPassword}</span>
          </button>
        </div>
      </div>

      {/* Notes Cards List */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto text-amber-600">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">{t.noNotes}</h3>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredNotes.map((note) => {
            const isPayment = note.type === 'payment';
            const pNote = note as PaymentNote;
            const idNote = note as IdPasswordNote;

            return (
              <div
                key={note.id}
                id={`note-card-${note.id}`}
                onClick={() => setSelectedNote(note)}
                className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer relative overflow-hidden shadow-xs hover:shadow-md ${
                  note.isDeletionPending
                    ? 'border-rose-200 bg-rose-50/20'
                    : 'border-slate-200/80 hover:border-amber-300'
                }`}
              >
                {/* Deletion Pending Badge */}
                {note.isDeletionPending && (
                  <div className="mb-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 border border-rose-300 text-rose-800 text-[10px] font-bold">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{t.deletionPendingBadge}</span>
                  </div>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                        isPayment
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-900 text-amber-400'
                      }`}
                    >
                      {isPayment ? (
                        <span className="font-black text-base">৳</span>
                      ) : (
                        <KeyRound className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate">
                        {note.title}
                      </h4>

                      {isPayment ? (
                        <div className="mt-1 space-y-0.5">
                          <p className="text-xs font-black text-amber-600">
                            ৳{pNote.amount.toLocaleString()} BDT
                          </p>
                          <p className="text-xs text-slate-600 truncate">
                            <span className="text-slate-400 font-medium">Paid by:</span>{' '}
                            <span className="font-semibold">{pNote.whoPaid}</span>
                          </p>
                        </div>
                      ) : (
                        <div className="mt-1 space-y-0.5">
                          {idNote.usernameOrId && (
                            <p className="text-xs text-slate-600 font-mono truncate">
                              ID: {idNote.usernameOrId}
                            </p>
                          )}
                          {idNote.urlOrApp && (
                            <p className="text-xs text-slate-400 truncate">
                              {idNote.urlOrApp}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {note.noteDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {note.noteTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delete Request Button */}
                  {!note.isDeletionPending && (
                    <button
                      id={`request-delete-note-btn-${note.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setNoteToDelete(note);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title={t.deleteRequestNote}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating "+" Button with Speed-Dial options */}
      <div className="fixed bottom-20 right-5 z-40">
        {/* Speed-Dial Menu */}
        {showSpeedDial && (
          <div className="absolute bottom-16 right-0 mb-2 space-y-2.5 flex flex-col items-end animate-fadeIn">
            {/* Add ID & Password Note */}
            <button
              id="speed-dial-id-note-btn"
              onClick={() => {
                setShowSpeedDial(false);
                setShowIdPasswordModal(true);
              }}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-lg hover:bg-slate-50 transition-all group"
            >
              <span>{t.addIdPasswordNote}</span>
              <div className="p-1.5 rounded-xl bg-slate-900 text-amber-400 group-hover:scale-110 transition-transform">
                <KeyRound className="w-4 h-4" />
              </div>
            </button>

            {/* Add Payment Note */}
            <button
              id="speed-dial-payment-note-btn"
              onClick={() => {
                setShowSpeedDial(false);
                setShowPaymentModal(true);
              }}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-lg hover:bg-slate-50 transition-all group"
            >
              <span>{t.addPaymentNote}</span>
              <div className="p-1.5 rounded-xl bg-amber-500 text-slate-950 font-black group-hover:scale-110 transition-transform">
                <DollarSign className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}

        {/* Main Floating Trigger */}
        <button
          id="floating-add-note-btn"
          onClick={() => setShowSpeedDial(!showSpeedDial)}
          className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 text-slate-950 flex items-center justify-center shadow-xl shadow-amber-500/30 transition-all transform active:scale-90 cursor-pointer ${
            showSpeedDial ? 'rotate-45' : 'hover:scale-105'
          }`}
          title="Add New Record"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>

      {/* ======================================================== */}
      {/* ADD PAYMENT NOTE MODAL */}
      {/* ======================================================== */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-scaleUp">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-900 font-bold">
                  ৳
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {t.addPaymentNote}
                </h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePaymentNote} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.dateLabel}
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.timeLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentTime}
                    onChange={(e) => setPaymentTime(e.target.value)}
                    placeholder="e.g. 03:30 PM"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.amountLabel} *
                </label>
                <input
                  id="payment-amount-input"
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.reasonLabel} *
                </label>
                <input
                  id="payment-reason-input"
                  type="text"
                  required
                  value={paymentReason}
                  onChange={(e) => setPaymentReason(e.target.value)}
                  placeholder="e.g. Office Internet Bill & Server Hosting"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.whoPaidLabel} *
                </label>
                <input
                  id="payment-who-paid-input"
                  type="text"
                  required
                  value={whoPaid}
                  onChange={(e) => setWhoPaid(e.target.value)}
                  placeholder="Type name of person / department"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.optionalNotesLabel}
                </label>
                <textarea
                  rows={2}
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Reference number, transaction ID, or voucher memo..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <button
                id="save-payment-note-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs shadow-md hover:from-amber-500 hover:to-yellow-600 transition-all cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : t.saveNote}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADD ID & PASSWORD NOTE MODAL */}
      {/* ======================================================== */}
      {showIdPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-scaleUp">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-slate-900 text-amber-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {t.addIdPasswordNote}
                </h3>
              </div>
              <button
                onClick={() => setShowIdPasswordModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIdPasswordNote} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.dateLabel}
                  </label>
                  <input
                    type="date"
                    required
                    value={idDate}
                    onChange={(e) => setIdDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.timeLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={idTime}
                    onChange={(e) => setIdTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.noteTitleLabel} *
                </label>
                <input
                  id="id-note-title-input"
                  type="text"
                  required
                  value={idTitle}
                  onChange={(e) => setIdTitle(e.target.value)}
                  placeholder="e.g. AWS Cloud Console / Corporate Mail Admin"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.usernameLabel}
                </label>
                <input
                  type="text"
                  value={idUsername}
                  onChange={(e) => setIdUsername(e.target.value)}
                  placeholder="e.g. ops-lead@ettl.com or root_user"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.passwordSecretLabel}
                </label>
                <input
                  type="text"
                  value={idPassword}
                  onChange={(e) => setIdPassword(e.target.value)}
                  placeholder="Confidential password or secret key"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.urlLabel}
                </label>
                <input
                  type="text"
                  value={idUrl}
                  onChange={(e) => setIdUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.noteContentLabel}
                </label>
                <textarea
                  rows={3}
                  value={idContent}
                  onChange={(e) => setIdContent(e.target.value)}
                  placeholder="Additional security notes, 2FA recovery backup codes, IP whitelist requirements..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-amber-500 resize-none font-mono"
                />
              </div>

              <button
                id="save-id-note-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs shadow-md hover:from-amber-500 hover:to-yellow-600 transition-all cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : t.saveNote}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW NOTE DETAILS MODAL */}
      {/* ======================================================== */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-xl font-bold ${
                    selectedNote.type === 'payment'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-slate-900 text-amber-400'
                  }`}
                >
                  {selectedNote.type === 'payment' ? '৳' : <KeyRound className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                    {selectedNote.title}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {selectedNote.noteDate} at {selectedNote.noteTime}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedNote(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Note details content */}
            {selectedNote.type === 'payment' ? (
              <div className="space-y-3 text-xs">
                <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/70 text-center">
                  <span className="text-slate-500 font-semibold block">Total Amount</span>
                  <span className="text-2xl font-black text-amber-700">
                    ৳{(selectedNote as PaymentNote).amount.toLocaleString()} BDT
                  </span>
                </div>

                <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 font-bold block mb-0.5">Payer Name</span>
                    <span className="font-semibold text-slate-800 text-sm">
                      {(selectedNote as PaymentNote).whoPaid}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block mb-0.5">Reason / Purpose</span>
                    <span className="font-medium text-slate-700">
                      {(selectedNote as PaymentNote).reason}
                    </span>
                  </div>
                  {(selectedNote as PaymentNote).optionalNotes && (
                    <div>
                      <span className="text-slate-400 font-bold block mb-0.5">Remarks</span>
                      <p className="text-slate-600 whitespace-pre-wrap">
                        {(selectedNote as PaymentNote).optionalNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {(selectedNote as IdPasswordNote).usernameOrId && (
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold">
                        Username / ID
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {(selectedNote as IdPasswordNote).usernameOrId}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        handleCopy((selectedNote as IdPasswordNote).usernameOrId!, 'username')
                      }
                      className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
                    >
                      {copiedField === 'username' ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}

                {(selectedNote as IdPasswordNote).password && (
                  <div className="flex items-center justify-between p-3 bg-amber-50/60 rounded-xl border border-amber-200/70">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold">
                        Password / Secret
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {showPasswordSecret
                          ? (selectedNote as IdPasswordNote).password
                          : '••••••••••••••••'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowPasswordSecret(!showPasswordSecret)}
                        className="p-1.5 rounded-lg bg-white hover:bg-amber-100 text-amber-800 border border-amber-200"
                      >
                        {showPasswordSecret ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() =>
                          handleCopy((selectedNote as IdPasswordNote).password!, 'password')
                        }
                        className="p-1.5 rounded-lg bg-white hover:bg-amber-100 text-amber-800 border border-amber-200"
                      >
                        {copiedField === 'password' ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {(selectedNote as IdPasswordNote).urlOrApp && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] font-bold">URL / App</span>
                    <span className="font-medium text-slate-700 break-all">
                      {(selectedNote as IdPasswordNote).urlOrApp}
                    </span>
                  </div>
                )}

                {(selectedNote as IdPasswordNote).content && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] font-bold mb-1">
                      Secure Notes & Details
                    </span>
                    <p className="font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {(selectedNote as IdPasswordNote).content}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              {!selectedNote.isDeletionPending && (
                <button
                  id="detail-delete-request-btn"
                  onClick={() => {
                    setNoteToDelete(selectedNote);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.deleteRequestNote}</span>
                </button>
              )}
              <button
                onClick={() => setSelectedNote(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETION CONFIRMATION WORKFLOW MODAL */}
      {/* ======================================================== */}
      {noteToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 text-center animate-scaleUp">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="font-black text-slate-900 text-base">
              {t.deleteConfirmTitle}
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              {t.deleteConfirmMessage}
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-left">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                Target Record
              </span>
              <span className="font-bold text-slate-800 text-xs truncate block">
                {noteToDelete.title}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                id="cancel-delete-request-btn"
                type="button"
                onClick={() => setNoteToDelete(null)}
                className="py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                id="submit-delete-request-btn"
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDeleteRequest}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20"
              >
                {isSubmitting ? 'Sending...' : 'Confirm & Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
