import React, { useState, useRef } from 'react';
import {
  Heart,
  MessageCircle,
  Image,
  Video,
  Smile,
  Send,
  Trash2,
  MoreVertical,
  Clock,
  Sparkles,
  X,
  Play,
  CheckCircle,
} from 'lucide-react';
import { FeedPost, User } from '../types';
import { translations, Language } from '../utils/i18n';
import { safeFetchJson } from '../utils/api';

interface FeedTabProps {
  posts: FeedPost[];
  currentUser: User;
  onRefreshPosts: () => void;
  lang: Language;
  onViewMedia: (url: string, type: 'image' | 'video') => void;
}

const COMMON_EMOJIS = ['👍', '❤️', '🔥', '👏', '🎉', '🚀', '💯', '✨', '🙏', '😊', '💡', '✅'];

export const FeedTab: React.FC<FeedTabProps> = ({
  posts,
  currentUser,
  onRefreshPosts,
  lang,
  onViewMedia,
}) => {
  const t = translations[lang];
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  // Active comments drawer toggle per post ID
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState<Record<string, boolean>>({});
  const [postToDelete, setPostToDelete] = useState<FeedPost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle File Upload (Photos or Videos)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isImage && !isVideo) {
      alert('Please upload an image or video file.');
      return;
    }

    // Convert to base64 for persistent storage
    const reader = new FileReader();
    reader.onload = () => {
      setMediaUrl(reader.result as string);
      setMediaType(isVideo ? 'video' : 'image');
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !mediaUrl) return;

    setIsPosting(true);
    const res = await safeFetchJson('/api/feed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorId: currentUser.id,
        content: content.trim(),
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaType || undefined,
      }),
    });
    setIsPosting(false);

    if (res.ok) {
      setContent('');
      setMediaUrl(null);
      setMediaType(null);
      setShowEmojiPicker(false);
      onRefreshPosts();
    }
  };

  const handleToggleLike = async (postId: string) => {
    const res = await safeFetchJson(`/api/feed/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id }),
    });
    if (res.ok) {
      onRefreshPosts();
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    setIsSubmittingComment((prev) => ({ ...prev, [postId]: true }));
    const res = await safeFetchJson(`/api/feed/${postId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorId: currentUser.id,
        content: text,
      }),
    });
    setIsSubmittingComment((prev) => ({ ...prev, [postId]: false }));

    if (res.ok) {
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      onRefreshPosts();
    }
  };

  const handleConfirmDelete = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);
    const postId = postToDelete.id;

    try {
      const res = await safeFetchJson(`/api/feed/${postId}?userId=${currentUser.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });

      if (res.ok) {
        setPostToDelete(null);
        onRefreshPosts();
      } else {
        console.error('Delete post error:', res.error);
        setPostToDelete(null);
        onRefreshPosts();
      }
    } catch (err) {
      console.error('Error during post deletion:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 max-w-2xl mx-auto">
      {/* Create Post Composer */}
      <div
        id="feed-post-composer"
        className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs"
      >
        <div className="flex items-start gap-3">
          <img
            src={
              currentUser.avatarUrl ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                currentUser.name
              )}&backgroundColor=f59e0b`
            }
            alt={currentUser.name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400/80 shrink-0"
          />
          <div className="flex-1">
            <textarea
              id="post-caption-textarea"
              rows={2}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t.createPostPlaceholder}
              className="w-full resize-none text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 bg-transparent border-0 focus:ring-0 outline-none p-0"
            />

            {/* Media Attachment Preview */}
            {mediaUrl && (
              <div className="relative mt-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-950 max-h-72 flex items-center justify-center">
                {mediaType === 'video' ? (
                  <video src={mediaUrl} controls className="max-h-72 w-full object-contain" />
                ) : (
                  <img src={mediaUrl} alt="Upload preview" className="max-h-72 w-full object-contain" />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMediaUrl(null);
                    setMediaType(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white shadow-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Emoji Quick Bar */}
            {showEmojiPicker && (
              <div className="mt-3 p-2 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap gap-1.5 animate-fadeIn">
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setContent((prev) => prev + emoji)}
                    className="p-1.5 text-base hover:bg-amber-100 rounded-lg transition-transform hover:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Composer Footer Controls */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
              <div className="flex items-center gap-1 sm:gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,video/*"
                  className="hidden"
                />
                <button
                  id="attach-media-btn"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                >
                  <Image className="w-4 h-4 text-amber-500" />
                  <span className="hidden sm:inline">{t.photoOrVideo}</span>
                </button>

                <button
                  id="toggle-emoji-btn"
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                >
                  <Smile className="w-4 h-4 text-amber-500" />
                  <span className="hidden sm:inline">{t.emoji}</span>
                </button>
              </div>

              <button
                id="submit-post-btn"
                type="button"
                disabled={isPosting || (!content.trim() && !mediaUrl)}
                onClick={handleCreatePost}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
              >
                {isPosting ? (
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{t.postBtn}</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Posts List */}
      {posts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200/60 flex items-center justify-center mx-auto text-amber-500">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm sm:text-base">
            {t.feedTitle}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">{t.noPosts}</p>
        </div>
      ) : (
        posts.map((post) => {
          const isLiked = post.likes.includes(currentUser.id);
          const canDelete = currentUser.role === 'admin' || post.authorId === currentUser.id;
          const isCommentsOpen = expandedCommentsPostId === post.id;

          return (
            <article
              key={post.id}
              id={`feed-post-${post.id}`}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all hover:border-amber-200/80"
            >
              {/* Post Header */}
              <div className="p-4 sm:p-5 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      post.authorAvatar ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                        post.authorName
                      )}&backgroundColor=f59e0b`
                    }
                    alt={post.authorName}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                        {post.authorName}
                      </h4>
                      {post.authorRole === 'admin' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300/60">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(post.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Admin or Author Delete */}
                {canDelete && (
                  <button
                    id={`delete-post-${post.id}`}
                    onClick={() => setPostToDelete(post)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title={t.deletePost}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Post Text Content */}
              {post.content && (
                <div className="px-4 sm:px-5 pb-3 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {post.content}
                </div>
              )}

              {/* Post Media Attachment */}
              {post.mediaUrl && (
                <div className="bg-slate-950 max-h-[480px] overflow-hidden flex items-center justify-center relative cursor-pointer group">
                  {post.mediaType === 'video' ? (
                    <div
                      className="w-full relative"
                      onClick={() => onViewMedia(post.mediaUrl!, 'video')}
                    >
                      <video
                        src={post.mediaUrl}
                        controls
                        className="w-full max-h-[480px] object-contain"
                      />
                    </div>
                  ) : (
                    <img
                      src={post.mediaUrl}
                      alt="Post visual"
                      onClick={() => onViewMedia(post.mediaUrl!, 'image')}
                      className="w-full max-h-[480px] object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                    />
                  )}
                </div>
              )}

              {/* Counts Bar */}
              <div className="px-4 sm:px-5 py-2.5 flex items-center justify-between text-xs text-slate-500 border-b border-slate-100">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[9px]">
                    ❤️
                  </div>
                  <span className="font-semibold text-slate-700">
                    {post.likes.length}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    onClick={() =>
                      setExpandedCommentsPostId(isCommentsOpen ? null : post.id)
                    }
                    className="hover:text-slate-800 cursor-pointer font-medium"
                  >
                    {post.comments.length} {t.comment.toLowerCase()}s
                  </span>
                </div>
              </div>

              {/* Action Buttons: Like & Comment ONLY */}
              <div className="px-2 py-1 grid grid-cols-2 gap-1 bg-slate-50/50">
                <button
                  id={`like-post-btn-${post.id}`}
                  onClick={() => handleToggleLike(post.id)}
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                    isLiked
                      ? 'text-rose-600 bg-rose-50/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isLiked ? 'fill-rose-500 text-rose-500 scale-110' : ''
                    }`}
                  />
                  <span>{isLiked ? t.liked : t.like}</span>
                </button>

                <button
                  id={`comment-post-btn-${post.id}`}
                  onClick={() =>
                    setExpandedCommentsPostId(isCommentsOpen ? null : post.id)
                  }
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                    isCommentsOpen
                      ? 'text-amber-700 bg-amber-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <MessageCircle className="w-4 h-4 text-slate-500" />
                  <span>{t.comment}</span>
                </button>
              </div>

              {/* Comments Section Drawer */}
              {isCommentsOpen && (
                <div className="p-4 sm:p-5 bg-slate-50/80 border-t border-slate-100 space-y-3 animate-fadeIn">
                  {/* Comments List */}
                  {post.comments.length > 0 && (
                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {post.comments.map((cmt) => (
                        <div key={cmt.id} className="flex items-start gap-2.5">
                          <img
                            src={
                              cmt.authorAvatar ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                cmt.authorName
                              )}&backgroundColor=f59e0b`
                            }
                            alt={cmt.authorName}
                            className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 mt-0.5 shrink-0"
                          />
                          <div className="flex-1 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[11px] text-slate-900">
                                {cmt.authorName}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(cmt.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 mt-0.5 leading-normal break-words">
                              {cmt.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment Input Bar */}
                  <div className="flex items-center gap-2 pt-1">
                    <img
                      src={
                        currentUser.avatarUrl ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          currentUser.name
                        )}&backgroundColor=f59e0b`
                      }
                      alt={currentUser.name}
                      className="w-7 h-7 rounded-full object-cover shrink-0"
                    />
                    <div className="flex-1 relative flex items-center">
                      <input
                        id={`comment-input-${post.id}`}
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddComment(post.id);
                          }
                        }}
                        placeholder={t.writeComment}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-10 py-1.5 text-xs text-slate-900 outline-none focus:border-amber-500 transition-all"
                      />
                      <button
                        id={`send-comment-btn-${post.id}`}
                        onClick={() => handleAddComment(post.id)}
                        disabled={
                          !commentInputs[post.id]?.trim() ||
                          isSubmittingComment[post.id]
                        }
                        className="absolute right-1.5 p-1 rounded-lg text-amber-600 hover:text-amber-700 disabled:opacity-30"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </article>
          );
        })
      )}
      {/* Post Deletion Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div
            id="delete-post-modal"
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-scaleUp"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">
                {t.deletePostConfirm}
              </h3>
              <p className="text-xs text-slate-500">
                This post will be permanently deleted from the company feed. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setPostToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                id="confirm-delete-post-btn"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isDeleting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.deletePost}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
