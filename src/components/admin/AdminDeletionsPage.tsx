import React from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
  KeyRound,
  User,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { AppNote, PaymentNote, IdPasswordNote } from '../../types';
import { safeFetchJson } from '../../utils/api';
import confetti from 'canvas-confetti';

interface AdminDeletionsPageProps {
  notes: AppNote[];
  onRefreshAll: () => void;
}

export const AdminDeletionsPage: React.FC<AdminDeletionsPageProps> = ({
  notes,
  onRefreshAll,
}) => {
  const pendingNotes = notes.filter((n) => n.isDeletionPending);

  const handleApprove = async (noteId: string) => {
    const res = await safeFetchJson(`/api/notes/${noteId}/approve-delete`, {
      method: 'POST',
    });
    if (res.ok) {
      onRefreshAll();
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } else {
      alert(res.error || 'Failed to approve note deletion');
    }
  };

  const handleReject = async (noteId: string) => {
    const res = await safeFetchJson(`/api/notes/${noteId}/reject-delete`, {
      method: 'POST',
    });
    if (res.ok) {
      onRefreshAll();
    } else {
      alert(res.error || 'Failed to decline deletion');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <span>Note Deletion Approvals</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            To prevent accidental data loss or unauthorized tampering, employee note deletions require Admin sign-off.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-amber-100/80 border border-amber-200 text-amber-900 text-xs font-black self-start sm:self-auto">
          {pendingNotes.length} Pending Deletions
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {pendingNotes.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 stroke-1" />
            <p className="text-sm font-bold text-slate-800">No Deletion Requests</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              All records are secure. No employee has requested to delete financial or vault records.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingNotes.map((note) => {
              const isPayment = note.type === 'payment';
              const payNote = isPayment ? (note as PaymentNote) : null;

              return (
                <div
                  key={note.id}
                  className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`p-1.5 rounded-lg text-xs font-black flex items-center gap-1 ${
                          isPayment ? 'bg-amber-100 text-amber-900' : 'bg-slate-900 text-amber-400'
                        }`}
                      >
                        {isPayment ? <DollarSign className="w-3.5 h-3.5" /> : <KeyRound className="w-3.5 h-3.5" />}
                        <span>{isPayment ? 'Payment Note' : 'ID/Password Note'}</span>
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 truncate">{note.title}</h4>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>Owner: <strong>{note.userName}</strong> ({note.userPhone})</span>
                      <span>·</span>
                      <span>Recorded on: {note.noteDate}</span>
                    </div>

                    {isPayment && payNote && (
                      <p className="text-xs text-slate-700">
                        Amount: <strong className="text-amber-950">৳ {payNote.amount.toLocaleString()}</strong> · Reason: {payNote.reason} · Payer: {payNote.whoPaid}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(note.id)}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Delete</span>
                    </button>
                    <button
                      onClick={() => handleReject(note.id)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-200 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject & Keep</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
