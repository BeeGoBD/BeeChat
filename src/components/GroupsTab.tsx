import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Send,
  Image,
  Smile,
  Lock,
  Clock,
  Check,
  CheckCheck,
  ArrowLeft,
  Info,
  Shield,
  X,
  AlertCircle,
  Plus,
  Play,
} from 'lucide-react';
import { Group, GroupMessage, User } from '../types';
import { translations, Language } from '../utils/i18n';
import { safeFetchJson } from '../utils/api';

interface GroupsTabProps {
  groups: Group[];
  currentUser: User;
  onRefreshGroups: () => void;
  lang: Language;
  onViewMedia: (url: string, type: 'image' | 'video') => void;
}

const MESSAGE_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];

export const GroupsTab: React.FC<GroupsTabProps> = ({
  groups,
  currentUser,
  onRefreshGroups,
  lang,
  onViewMedia,
}) => {
  const t = translations[lang];
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [showEmojiMenu, setShowEmojiMenu] = useState<string | null>(null); // messageId
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load messages whenever active group changes
  const fetchMessages = async (groupId: string) => {
    const res = await safeFetchJson<{ messages: GroupMessage[] }>(`/api/groups/${groupId}/messages`);
    if (res.ok && res.data) {
      setMessages(res.data.messages || []);
    }
  };

  useEffect(() => {
    if (activeGroup) {
      setLoadingMessages(true);
      fetchMessages(activeGroup.id).finally(() => setLoadingMessages(false));

      // Real-time polling for active chat every 3s
      const interval = setInterval(() => {
        fetchMessages(activeGroup.id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeGroup?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleRequestJoin = async (groupId: string) => {
    const res = await safeFetchJson(`/api/groups/${groupId}/join-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id }),
    });
    if (res.ok) {
      onRefreshGroups();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isImage && !isVideo) {
      alert('Please upload an image or video file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setMediaUrl(reader.result as string);
      setMediaType(isVideo ? 'video' : 'image');
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup || (!inputText.trim() && !mediaUrl)) return;

    setIsSending(true);
    const res = await safeFetchJson(`/api/groups/${activeGroup.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: currentUser.id,
        text: inputText.trim(),
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaType || undefined,
      }),
    });
    setIsSending(false);

    if (res.ok) {
      setInputText('');
      setMediaUrl(null);
      setMediaType(null);
      await fetchMessages(activeGroup.id);
    } else {
      alert(res.error || 'Failed to send message.');
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    const res = await safeFetchJson(`/api/groups/messages/${messageId}/reaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        emoji,
      }),
    });
    if (res.ok) {
      setShowEmojiMenu(null);
      if (activeGroup) fetchMessages(activeGroup.id);
    }
  };

  // Check if current user can send message in active group
  const canSendMessage = () => {
    if (!activeGroup) return false;
    if (currentUser.role === 'admin') return true;
    if (!activeGroup.memberIds.includes(currentUser.id)) return false;

    if (activeGroup.messagingMode === 'admin_only') return false;
    if (activeGroup.messagingMode === 'selected_members') {
      return activeGroup.allowedSenderIds.includes(currentUser.id);
    }
    return true;
  };

  // If in Group Chat view
  if (activeGroup) {
    const isMember = activeGroup.memberIds.includes(currentUser.id) || currentUser.role === 'admin';
    const isPending = activeGroup.pendingRequestUserIds.includes(currentUser.id);
    const userCanChat = canSendMessage();

    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto bg-slate-50/50 rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-16">
        {/* Chat Header */}
        <div className="bg-white px-3 sm:px-4 py-3 border-b border-slate-200 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              id="back-to-groups-btn"
              onClick={() => setActiveGroup(null)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs border border-slate-200"
              title="Back to all groups"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden xs:inline sm:inline">Back</span>
            </button>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs shrink-0"
              style={{ backgroundColor: activeGroup.avatarColor || '#25D366' }}
            >
              {activeGroup.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight truncate max-w-[200px] sm:max-w-xs">
                {activeGroup.name}
              </h3>
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span>{activeGroup.memberIds.length} members</span>
                {activeGroup.messagingMode === 'admin_only' && (
                  <span className="inline-flex items-center text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-semibold">
                    <Lock className="w-2.5 h-2.5 mr-0.5" /> Admin Only
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            id="group-info-btn"
            onClick={() => setShowInfoModal(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title={t.groupInfo}
          >
            <Info className="w-5 h-5" />
          </button>
        </div>

        {/* Messaging Permission Banner */}
        {!userCanChat && isMember && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-xs font-semibold text-amber-900">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {activeGroup.messagingMode === 'admin_only'
                ? t.onlyAdminMessage
                : t.selectedMembersMessage}
            </span>
          </div>
        )}

        {!isMember && (
          <div className="bg-amber-100/80 border-b border-amber-300/80 px-4 py-3 flex items-center justify-between gap-2 text-xs font-bold text-amber-950">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              <span>You must be an approved member to participate in this group.</span>
            </div>
            {!isPending ? (
              <button
                onClick={() => handleRequestJoin(activeGroup.id)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-colors shadow-xs"
              >
                {t.requestToJoin}
              </button>
            ) : (
              <span className="px-2 py-1 rounded bg-amber-200/80 text-amber-900 text-xs">
                {t.pendingApproval}
              </span>
            )}
          </div>
        )}

        {/* Chat Messages Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Users className="w-10 h-10 text-slate-300" />
              <p className="text-xs font-medium">No messages yet in this group.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === currentUser.id;
              const hasReactions =
                msg.reactions && Object.keys(msg.reactions).length > 0;

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 group relative ${
                    isMine ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {/* Avatar if not mine */}
                  {!isMine && (
                    <img
                      src={
                        msg.senderAvatar ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          msg.senderName
                        )}&backgroundColor=f59e0b`
                      }
                      alt={msg.senderName}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 mb-1 shrink-0"
                    />
                  )}

                  <div
                    className={`max-w-[78%] sm:max-w-md rounded-2xl p-3 relative shadow-2xs transition-all ${
                      isMine
                        ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 rounded-br-xs font-medium'
                        : 'bg-white border border-slate-200/80 text-slate-900 rounded-bl-xs'
                    }`}
                  >
                    {/* Sender Name & Role if not mine */}
                    {!isMine && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-bold text-[11px] text-slate-900">
                          {msg.senderName}
                        </span>
                        {msg.senderRole === 'admin' && (
                          <span className="px-1 py-0.2 rounded text-[8px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                            ADMIN
                          </span>
                        )}
                      </div>
                    )}

                    {/* Media */}
                    {msg.mediaUrl && (
                      <div className="mb-2 rounded-xl overflow-hidden bg-slate-950 max-h-60 flex items-center justify-center cursor-pointer">
                        {msg.mediaType === 'video' ? (
                          <video
                            src={msg.mediaUrl}
                            controls
                            className="max-h-60 w-full object-contain"
                          />
                        ) : (
                          <img
                            src={msg.mediaUrl}
                            alt="Chat image"
                            onClick={() => onViewMedia(msg.mediaUrl!, 'image')}
                            className="max-h-60 w-full object-contain hover:opacity-95"
                          />
                        )}
                      </div>
                    )}

                    {/* Text */}
                    {msg.text && (
                      <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words">
                        {msg.text}
                      </p>
                    )}

                    {/* Timestamp & Status */}
                    <div
                      className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                        isMine ? 'text-slate-800' : 'text-slate-400'
                      }`}
                    >
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isMine && <CheckCheck className="w-3 h-3 text-slate-900" />}
                    </div>

                    {/* Reactions Pill Display */}
                    {hasReactions && (
                      <div className="flex flex-wrap gap-1 mt-1.5 -mb-1">
                        {Object.entries(msg.reactions).map(([emoji, ids]) => {
                          const userIds = Array.isArray(ids) ? (ids as string[]) : [];
                          return (
                            <button
                              key={emoji}
                              onClick={() => handleToggleReaction(msg.id, emoji)}
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs transition-transform active:scale-95 ${
                                userIds.includes(currentUser.id)
                                  ? 'bg-amber-100 border-amber-300 text-amber-950'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <span>{emoji}</span>
                              <span>{userIds.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Reaction Button (hover action) */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setShowEmojiMenu(showEmojiMenu === msg.id ? null : msg.id)
                      }
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-500 shadow-xs border border-slate-200 transition-opacity"
                      title="React"
                    >
                      <Smile className="w-3.5 h-3.5" />
                    </button>

                    {/* Emoji Reaction Selector */}
                    {showEmojiMenu === msg.id && (
                      <div className="absolute bottom-full mb-1 z-30 bg-white rounded-full p-1 shadow-lg border border-slate-200 flex items-center gap-1 animate-fadeIn">
                        {MESSAGE_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleToggleReaction(msg.id, emoji)}
                            className="p-1 hover:scale-125 transition-transform text-sm"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        {userCanChat ? (
          <form
            onSubmit={handleSendMessage}
            className="bg-white p-3 border-t border-slate-200 flex flex-col gap-2"
          >
            {/* Media Preview before send */}
            {mediaUrl && (
              <div className="relative inline-flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200 max-w-fit">
                {mediaType === 'video' ? (
                  <span className="text-xs font-semibold px-2 text-slate-700">
                    🎬 Video Attached
                  </span>
                ) : (
                  <img
                    src={mediaUrl}
                    alt="Media preview"
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMediaUrl(null);
                    setMediaType(null);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,video/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                title="Attach photo or video"
              >
                <Image className="w-5 h-5" />
              </button>

              <input
                id="group-chat-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t.typeMessage}
                className="flex-1 bg-slate-50 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition-all"
              />

              <button
                id="send-group-message-btn"
                type="submit"
                disabled={isSending || (!inputText.trim() && !mediaUrl)}
                className="p-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black shadow-sm disabled:opacity-40 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-slate-100 p-3 text-center text-xs text-slate-500 font-medium">
            {activeGroup.messagingMode === 'admin_only'
              ? t.onlyAdminMessage
              : isMember
              ? t.selectedMembersMessage
              : 'Join this group to participate in discussions.'}
          </div>
        )}

        {/* Group Info Modal */}
        {showInfoModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">{t.groupInfo}</h3>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center space-y-2">
                <div
                  className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-2xl font-black text-white shadow-md"
                  style={{ backgroundColor: activeGroup.avatarColor || '#F59E0B' }}
                >
                  {activeGroup.name.charAt(0)}
                </div>
                <h4 className="font-extrabold text-slate-900 text-base">
                  {activeGroup.name}
                </h4>
                <p className="text-xs text-slate-600">{activeGroup.description}</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3.5 space-y-2 border border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Total Members</span>
                  <span className="font-bold text-slate-800">
                    {activeGroup.memberIds.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Messaging Mode</span>
                  <span className="font-bold text-amber-800 capitalize">
                    {activeGroup.messagingMode.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Created Date</span>
                  <span className="font-bold text-slate-800">
                    {new Date(activeGroup.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowInfoModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Groups List View
  return (
    <div className="space-y-4 pb-20 max-w-2xl mx-auto">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {t.groupsTitle}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Company channels & department discussions
          </p>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">{t.noGroupsFound}</h3>
        </div>
      ) : (
        <div className="grid gap-3">
          {groups.map((group) => {
            const isMember =
              group.memberIds.includes(currentUser.id) || currentUser.role === 'admin';
            const isPending = group.pendingRequestUserIds.includes(currentUser.id);

            return (
              <div
                key={group.id}
                id={`group-card-${group.id}`}
                onClick={() => isMember && setActiveGroup(group)}
                className={`bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between gap-4 transition-all ${
                  isMember
                    ? 'hover:border-amber-300 hover:shadow-md cursor-pointer'
                    : 'bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-xs shrink-0"
                    style={{ backgroundColor: group.avatarColor || '#F59E0B' }}
                  >
                    {group.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                        {group.name}
                      </h4>
                      {group.messagingMode === 'admin_only' && (
                        <span className="p-0.5 rounded bg-amber-100 text-amber-800" title="Admin only">
                          <Lock className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate max-w-xs sm:max-w-md mt-0.5">
                      {group.description || 'Company discussions'}
                    </p>
                    <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                      {group.memberIds.length} {t.membersCount.replace('{count}', '')}
                    </span>
                  </div>
                </div>

                {/* Right Action */}
                <div className="shrink-0">
                  {isMember ? (
                    <button
                      id={`open-chat-btn-${group.id}`}
                      onClick={() => setActiveGroup(group)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-xs transition-colors"
                    >
                      Open Chat
                    </button>
                  ) : isPending ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300/60">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{t.pendingApproval}</span>
                    </span>
                  ) : (
                    <button
                      id={`request-join-btn-${group.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRequestJoin(group.id);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                    >
                      {t.requestToJoin}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
