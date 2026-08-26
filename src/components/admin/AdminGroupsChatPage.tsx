import React, { useState, useEffect, useRef } from 'react';
import {
  FolderLock,
  Plus,
  Send,
  Image as ImageIcon,
  Smile,
  Sliders,
  Users,
  Shield,
  Trash2,
  ArrowLeft,
  X,
  Sparkles,
  Lock,
  Check,
  UserMinus,
  MessageSquare,
  Search,
} from 'lucide-react';
import { Group, GroupMessage, User } from '../../types';
import { safeFetchJson } from '../../utils/api';
import confetti from 'canvas-confetti';

interface AdminGroupsChatPageProps {
  groups: Group[];
  users: User[];
  currentUser: User;
  onRefreshAll: () => void;
  onViewMedia: (url: string, type: 'image' | 'video') => void;
}

const COMMON_EMOJIS = ['👍', '❤️', '🔥', '👏', '🎉', '🙌', '💯', '🚀', '✅', '😂', '🤝', '⭐'];

export const AdminGroupsChatPage: React.FC<AdminGroupsChatPageProps> = ({
  groups,
  users,
  currentUser,
  onRefreshAll,
  onViewMedia,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(groups[0] || null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);

  // Group creation modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#F59E0B');
  const [newGroupMode, setNewGroupMode] = useState<'everyone' | 'admin_only' | 'selected_members'>('everyone');

  // Group permissions modal
  const [showManageModal, setShowManageModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep selected group updated if list changes
  useEffect(() => {
    if (selectedGroup) {
      const found = groups.find((g) => g.id === selectedGroup.id);
      if (found) {
        setSelectedGroup(found);
      } else {
        setSelectedGroup(groups[0] || null);
      }
    } else if (groups.length > 0) {
      setSelectedGroup(groups[0]);
    }
  }, [groups]);

  // Fetch messages for selected group
  const fetchMessages = async (groupId: string) => {
    const res = await safeFetchJson<{ messages: GroupMessage[] }>(`/api/groups/${groupId}/messages`);
    if (res.ok && res.data) {
      setMessages(res.data.messages || []);
    }
  };

  useEffect(() => {
    if (!selectedGroup) {
      setMessages([]);
      return;
    }
    fetchMessages(selectedGroup.id);
    const interval = setInterval(() => {
      fetchMessages(selectedGroup.id);
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedGroup?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedGroup || (!inputText.trim() && !mediaUrl)) return;

    setIsSending(true);
    const res = await safeFetchJson(`/api/groups/${selectedGroup.id}/messages`, {
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
      setShowEmojiPicker(false);
      await fetchMessages(selectedGroup.id);
    } else {
      alert(res.error || 'Failed to send message.');
    }
  };

  // Toggle Reaction
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
      setShowReactionPicker(null);
      if (selectedGroup) fetchMessages(selectedGroup.id);
    }
  };

  // Create Group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const res = await safeFetchJson<{ group: Group }>('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminId: currentUser.id,
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
        avatarColor: newGroupColor,
        messagingMode: newGroupMode,
      }),
    });

    if (res.ok && res.data) {
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
      onRefreshAll();
      setSelectedGroup(res.data.group);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } else {
      alert(res.error || 'Failed to create group');
    }
  };

  // Delete Group
  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the group "${groupName}" and all its messages?`)) {
      return;
    }

    const res = await safeFetchJson(`/api/groups/${groupId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
      }
      onRefreshAll();
    } else {
      alert(res.error || 'Failed to delete group');
    }
  };

  // Update Permissions
  const handleUpdatePermissions = async (
    mode: 'everyone' | 'admin_only' | 'selected_members',
    allowedSenderIds: string[]
  ) => {
    if (!selectedGroup) return;
    const res = await safeFetchJson(`/api/groups/${selectedGroup.id}/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messagingMode: mode,
        allowedSenderIds,
      }),
    });
    if (res.ok) {
      setShowManageModal(false);
      onRefreshAll();
    }
  };

  // Remove Member
  const handleRemoveMember = async (userId: string) => {
    if (!selectedGroup) return;
    if (!window.confirm('Remove this member from the group?')) return;
    const res = await safeFetchJson(`/api/groups/${selectedGroup.id}/remove-member`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: userId }),
    });
    if (res.ok) {
      onRefreshAll();
    }
  };

  // File upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();
    reader.onload = () => {
      setMediaUrl(reader.result as string);
      setMediaType(isVideo ? 'video' : 'image');
    };
    reader.readAsDataURL(file);
  };

  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-amber-500" />
            <span>Groups & Live Team Communication</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create groups, chat with employees in real-time, react to messages, and manage access controls.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Group</span>
        </button>
      </div>

      {/* Main Workspace Layout (Two-column: Groups List & Live Chat) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden grid md:grid-cols-12 min-h-[620px]">
        {/* Left Side: Groups List */}
        <div
          className={`md:col-span-4 border-r border-slate-200 flex flex-col ${
            selectedGroup ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search Groups */}
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search groups..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Groups Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[560px]">
            {filteredGroups.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-3">
                <FolderLock className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">No groups created yet.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 underline"
                >
                  Create your first group
                </button>
              </div>
            ) : (
              filteredGroups.map((group) => {
                const isSelected = selectedGroup?.id === group.id;
                return (
                  <div
                    key={group.id}
                    onClick={() => setSelectedGroup(group)}
                    className={`p-3.5 transition-all cursor-pointer flex items-start justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-amber-50/80 border-l-4 border-amber-500'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-xs"
                        style={{ backgroundColor: group.avatarColor || '#F59E0B' }}
                      >
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-slate-900 truncate">
                            {group.name}
                          </h4>
                          {group.messagingMode === 'admin_only' && (
                            <span title="Admin Only Chat">
                              <Lock className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {group.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                          <span className="flex items-center gap-0.5">
                            <Users className="w-3 h-3 text-slate-400" />
                            {group.memberIds.length} members
                          </span>
                          {group.pendingRequestUserIds.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 font-bold">
                              {group.pendingRequestUserIds.length} pending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGroup(group.id, group.name);
                      }}
                      className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                      title="Delete Group"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Active Chat Room */}
        <div
          className={`md:col-span-8 flex flex-col bg-slate-50/50 ${
            !selectedGroup ? 'hidden md:flex items-center justify-center' : 'flex'
          }`}
        >
          {selectedGroup ? (
            <>
              {/* Chat Room Top Bar */}
              <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setSelectedGroup(null)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 md:hidden shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-xs"
                    style={{ backgroundColor: selectedGroup.avatarColor || '#F59E0B' }}
                  >
                    {selectedGroup.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {selectedGroup.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                        {selectedGroup.messagingMode.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      {selectedGroup.memberIds.length} members · {selectedGroup.description || 'Company chat'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setShowManageModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Permissions & Members</span>
                  </button>
                </div>
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 max-h-[460px] min-h-[380px]">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16 space-y-2">
                    <MessageSquare className="w-10 h-10 text-slate-300 stroke-1" />
                    <p className="text-xs font-bold text-slate-600">No messages in this group yet</p>
                    <p className="text-[11px] text-slate-400 text-center max-w-xs">
                      Send a message below to start communicating with your team in this channel.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === currentUser.id;
                    const isAdmin = msg.senderRole === 'admin';

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMe && (
                          <img
                            src={
                              msg.senderAvatar ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                msg.senderName
                              )}&backgroundColor=f59e0b`
                            }
                            alt={msg.senderName}
                            className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 mt-1 shrink-0"
                          />
                        )}

                        <div className={`max-w-[80%] sm:max-w-[70%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                          {/* Sender name & time */}
                          <div className={`flex items-center gap-1.5 text-[10px] ${isMe ? 'justify-end text-slate-400' : 'text-slate-500'}`}>
                            <span className="font-bold text-slate-800">{msg.senderName}</span>
                            {isAdmin && (
                              <span className="px-1 py-0.2 rounded bg-amber-500 text-slate-950 font-black text-[9px]">
                                ADMIN
                              </span>
                            )}
                            {msg.senderPhone && (
                              <span className="font-mono text-slate-400">({msg.senderPhone})</span>
                            )}
                            <span>· {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>

                          {/* Bubble Container */}
                          <div
                            className={`p-3 rounded-2xl relative group text-xs shadow-2xs ${
                              isMe
                                ? 'bg-slate-900 text-white rounded-br-none'
                                : 'bg-white text-slate-900 border border-slate-200/80 rounded-bl-none'
                            }`}
                          >
                            {msg.text && <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>}

                            {msg.mediaUrl && (
                              <div className="mt-2 rounded-xl overflow-hidden bg-slate-950/20 max-w-sm">
                                {msg.mediaType === 'video' ? (
                                  <video src={msg.mediaUrl} controls className="max-h-60 rounded-xl w-full" />
                                ) : (
                                  <img
                                    src={msg.mediaUrl}
                                    alt="attachment"
                                    className="max-h-60 rounded-xl object-cover cursor-pointer hover:opacity-95"
                                    onClick={() => onViewMedia(msg.mediaUrl!, 'image')}
                                  />
                                )}
                              </div>
                            )}

                            {/* Hover Reaction Trigger */}
                            <button
                              onClick={() => setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id)}
                              className={`absolute -top-3 ${
                                isMe ? '-left-3' : '-right-3'
                              } opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white rounded-full shadow-md border border-slate-200 text-slate-600 hover:text-amber-600 z-10`}
                              title="React"
                            >
                              <Smile className="w-3.5 h-3.5" />
                            </button>

                            {/* Reaction Picker Popup */}
                            {showReactionPicker === msg.id && (
                              <div
                                className={`absolute top-full mt-1 ${
                                  isMe ? 'right-0' : 'left-0'
                                } z-30 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xl flex items-center gap-1`}
                              >
                                {COMMON_EMOJIS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleToggleReaction(msg.id, emoji)}
                                    className="w-7 h-7 rounded-lg hover:bg-amber-50 text-base flex items-center justify-center transition-transform hover:scale-125"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Existing Reactions */}
                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(msg.reactions).map(([emoji, rawUserIds]) => {
                                const userIds = Array.isArray(rawUserIds) ? (rawUserIds as string[]) : [];
                                const didIReact = userIds.includes(currentUser.id);
                                return (
                                  <button
                                    key={emoji}
                                    onClick={() => handleToggleReaction(msg.id, emoji)}
                                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border transition-all ${
                                      didIReact
                                        ? 'bg-amber-100 border-amber-400 text-amber-950 font-black'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
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

                        {isMe && (
                          <img
                            src={
                              currentUser.avatarUrl ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=Admin&backgroundColor=f59e0b`
                            }
                            alt="Admin"
                            className="w-7 h-7 rounded-full object-cover ring-1 ring-amber-400 mt-1 shrink-0"
                          />
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Media Preview before send */}
              {mediaUrl && (
                <div className="px-4 py-2 bg-amber-50/80 border-t border-amber-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-900">Attachment Ready:</span>
                    {mediaType === 'image' ? (
                      <img src={mediaUrl} alt="preview" className="w-10 h-10 rounded-lg object-cover ring-1 ring-amber-300" />
                    ) : (
                      <span className="text-xs text-slate-700 font-mono">Video Selected</span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setMediaUrl(null);
                      setMediaType(null);
                    }}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Chat Input Bar */}
              <div className="p-3 bg-white border-t border-slate-200">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    title="Attach Photo or Video"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                      title="Emoji"
                    >
                      <Smile className="w-4 h-4" />
                    </button>

                    {showEmojiPicker && (
                      <div className="absolute bottom-full mb-2 left-0 z-30 bg-white border border-slate-200 rounded-2xl p-2 shadow-2xl grid grid-cols-6 gap-1 w-56">
                        {COMMON_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setInputText((prev) => prev + emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="w-8 h-8 rounded-lg hover:bg-amber-50 text-base flex items-center justify-center"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type official admin message..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-amber-500 focus:bg-white transition-all"
                  />

                  <button
                    type="submit"
                    disabled={isSending || (!inputText.trim() && !mediaUrl)}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:from-amber-600 hover:to-amber-700 disabled:opacity-40 transition-all shadow-xs cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <FolderLock className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-700">Select a group from the left</p>
              <p className="text-xs text-slate-400">
                Choose any group to start reading and sending messages as Admin.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Group */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <FolderLock className="w-5 h-5 text-amber-500" />
                <span>Create Company Group</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Group Name *</label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. ETTL Operations & Support"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="Purpose of this group..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Messaging Permission</label>
                <select
                  value={newGroupMode}
                  onChange={(e) => setNewGroupMode(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500"
                >
                  <option value="everyone">Everyone (All approved members can message)</option>
                  <option value="admin_only">Admin Only (Only Admin can message)</option>
                  <option value="selected_members">Selected Members Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Theme Color</label>
                <div className="flex items-center gap-2">
                  {['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewGroupColor(color)}
                      className={`w-7 h-7 rounded-xl transition-transform ${
                        newGroupColor === color ? 'scale-110 ring-2 ring-slate-900 ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Group Permissions & Members */}
      {showManageModal && selectedGroup && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl max-w-lg w-full space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-500" />
                <span>Group Permissions: {selectedGroup.name}</span>
              </h3>
              <button
                onClick={() => setShowManageModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Messaging Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { mode: 'everyone', label: 'Everyone' },
                  { mode: 'admin_only', label: 'Admin Only' },
                  { mode: 'selected_members', label: 'Selected' },
                ].map(({ mode, label }) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() =>
                      handleUpdatePermissions(mode as any, selectedGroup.allowedSenderIds || [])
                    }
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      selectedGroup.messagingMode === mode
                        ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Members List with authorized toggle and remove option */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Approved Members ({selectedGroup.memberIds.length})
                </span>
              </div>

              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto border border-slate-100 rounded-2xl">
                {selectedGroup.memberIds.map((mId) => {
                  const mUser = users.find((u) => u.id === mId);
                  const isSenderAllowed = selectedGroup.allowedSenderIds?.includes(mId);
                  const isUserAdmin = mUser?.role === 'admin';

                  return (
                    <div key={mId} className="p-2.5 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={
                            mUser?.avatarUrl ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                              mUser?.name || 'User'
                            )}&backgroundColor=f59e0b`
                          }
                          alt="avatar"
                          className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate">
                            {mUser?.name || 'Member'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {mUser?.phone}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {selectedGroup.messagingMode === 'selected_members' && !isUserAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              const newAllowed = isSenderAllowed
                                ? selectedGroup.allowedSenderIds.filter((id) => id !== mId)
                                : [...(selectedGroup.allowedSenderIds || []), mId];
                              handleUpdatePermissions(selectedGroup.messagingMode, newAllowed);
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                              isSenderAllowed
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {isSenderAllowed ? 'Can Send' : 'Muted'}
                          </button>
                        )}

                        {!isUserAdmin && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(mId)}
                            className="p-1 rounded-lg text-rose-600 hover:bg-rose-50"
                            title="Remove Member"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowManageModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
