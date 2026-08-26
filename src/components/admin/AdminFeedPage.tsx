import React, { useState } from 'react';
import {
  Newspaper,
  Trash2,
  Search,
  MessageSquare,
  Heart,
  Calendar,
  Phone,
  Shield,
} from 'lucide-react';
import { FeedPost, User } from '../../types';
import { safeFetchJson } from '../../utils/api';

interface AdminFeedPageProps {
  posts: FeedPost[];
  currentUser: User;
  onRefreshAll: () => void;
  onViewMedia: (url: string, type: 'image' | 'video') => void;
}

export const AdminFeedPage: React.FC<AdminFeedPageProps> = ({
  posts,
  currentUser,
  onRefreshAll,
  onViewMedia,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [postToDelete, setPostToDelete] = useState<FeedPost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
        onRefreshAll();
      } else {
        setPostToDelete(null);
        onRefreshAll();
      }
    } catch (err) {
      console.error('Error deleting post:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPosts = posts.filter(
    (p) =>
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.authorPhone.includes(searchQuery)
  );

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-amber-500" />
            <span>Feed & Content Moderation</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit public updates posted by employees, inspect media uploads, and remove guideline violations.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts or author..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Feed List */}
      <div className="space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center text-slate-400 border border-slate-200 space-y-2">
            <Newspaper className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
            <p className="text-sm font-bold text-slate-700">No feed posts found</p>
            <p className="text-xs text-slate-400">
              When employees post company updates or photos, they will appear here for audit.
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isAdmin = post.authorRole === 'admin';

            return (
              <div
                key={post.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3"
              >
                {/* Top Author Bar */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        post.authorAvatar ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          post.authorName
                        )}&backgroundColor=f59e0b`
                      }
                      alt={post.authorName}
                      className="w-10 h-10 rounded-2xl object-cover ring-2 ring-slate-100"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-slate-900">{post.authorName}</span>
                        {isAdmin && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                        <span>{post.authorPhone}</span>
                        <span>·</span>
                        <span>{new Date(post.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setPostToDelete(post)}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 border border-rose-200 transition-colors cursor-pointer"
                    title="Delete Post"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>

                {/* Content */}
                {post.content && (
                  <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {post.content}
                  </p>
                )}

                {/* Media */}
                {post.mediaUrl && (
                  <div className="rounded-2xl overflow-hidden bg-slate-950/10 max-w-md">
                    {post.mediaType === 'video' ? (
                      <video src={post.mediaUrl} controls className="max-h-80 w-full rounded-2xl" />
                    ) : (
                      <img
                        src={post.mediaUrl}
                        alt="attachment"
                        className="max-h-80 w-full object-cover cursor-pointer hover:opacity-95 rounded-2xl"
                        onClick={() => onViewMedia(post.mediaUrl!, 'image')}
                      />
                    )}
                  </div>
                )}

                {/* Metrics */}
                <div className="flex items-center gap-4 pt-2 border-t border-slate-100 text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    {post.likes.length} Likes
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    {post.comments.length} Comments
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Admin Post Deletion Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div
            id="admin-delete-post-modal"
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-scaleUp"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">
                Delete Post as Admin?
              </h3>
              <p className="text-xs text-slate-500">
                This post by <span className="font-bold text-slate-800">{postToDelete.authorName}</span> will be permanently removed from the feed.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setPostToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="admin-confirm-delete-btn"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isDeleting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
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
