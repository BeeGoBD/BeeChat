/**
 * Universal Offline-First & Static-Host-Proof API Layer
 * Guaranteed compatibility with Netlify, GitHub Pages, Vercel, Docker & Local Dev.
 * Bypasses all 404/405 static hosting errors seamlessly.
 */

import {
  getLocalStore,
  setLocalStore,
  localRegister,
  localLogin,
  localUpdateProfile,
  localChangePassword,
} from './localStore';
import { FeedPost, Group, GroupMessage, AppNote, AppNotification, AdminStats, User } from '../types';

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    // If backend returned valid JSON
    if (contentType.includes('application/json')) {
      try {
        const parsed = await res.json();
        // If successful JSON response from Express backend
        if (res.ok) {
          return { ok: true, status: res.status, data: parsed };
        }
        // If 400 Bad Request or 401 Unauthorized with validation message
        if (res.status === 400 || res.status === 401) {
          return { ok: false, status: res.status, error: parsed?.error || 'Invalid credentials or request', data: parsed };
        }
        // If server 404, 405, 500
        if (res.status === 404 || res.status === 405 || res.status >= 500) {
          return handleClientFallback<T>(url, options);
        }
        return { ok: false, status: res.status, error: parsed?.error || `Request failed (${res.status})`, data: parsed };
      } catch {
        return handleClientFallback<T>(url, options);
      }
    }

    // If backend returned HTML (Netlify 404, SPA index.html, Apache/Nginx 404/405 page)
    return handleClientFallback<T>(url, options);
  } catch {
    // Network unreachable, CORS, offline, or static deployment without backend
    return handleClientFallback<T>(url, options);
  }
}

function handleClientFallback<T>(url: string, options?: RequestInit): { ok: boolean; status: number; data?: T; error?: string } {
  const method = (options?.method || 'GET').toUpperCase();
  const path = url.split('?')[0];
  const query = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
  let body: any = {};
  if (options?.body) {
    try {
      body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    } catch {
      body = {};
    }
  }
  const store = getLocalStore();

  try {
    // 1. Auth Register
    if (path === '/api/auth/register' && method === 'POST') {
      const result = localRegister(body.name, body.phone, body.password);
      if (result.ok) {
        return { ok: true, status: 201, data: { user: result.user } as unknown as T };
      }
      return { ok: false, status: 400, error: result.error };
    }

    // 2. Auth Login
    if (path === '/api/auth/login' && method === 'POST') {
      const result = localLogin(body.identifier, body.password);
      if (result.ok) {
        return { ok: true, status: 200, data: { user: result.user, isAdmin: result.isAdmin } as unknown as T };
      }
      return { ok: false, status: 401, error: result.error };
    }

    // 3. Profile Update
    if (path === '/api/auth/profile' && (method === 'PUT' || method === 'POST')) {
      const result = localUpdateProfile(body.userId, { name: body.name, avatarUrl: body.avatarUrl });
      if (result.ok) {
        return { ok: true, status: 200, data: { user: result.user } as unknown as T };
      }
      return { ok: false, status: 400, error: result.error };
    }

    // 4. Change Password
    if (path === '/api/auth/change-password' && (method === 'PUT' || method === 'POST')) {
      const result = localChangePassword(body.userId, body.oldPassword, body.newPassword);
      if (result.ok) {
        return { ok: true, status: 200, data: { success: true } as unknown as T };
      }
      return { ok: false, status: 400, error: result.error };
    }

    // 5. Feed Posts
    if (path === '/api/feed' && method === 'GET') {
      return { ok: true, status: 200, data: { posts: store.posts } as unknown as T };
    }

    if (path === '/api/feed' && method === 'POST') {
      const author = store.users.find((u) => u.id === body.authorId);
      const newPost: FeedPost = {
        id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        authorId: body.authorId,
        authorName: body.authorName || author?.name || 'User',
        authorPhone: body.authorPhone || author?.phone || '',
        authorAvatar: body.authorAvatar || author?.avatarUrl,
        authorRole: body.authorRole || author?.role || 'user',
        content: body.content,
        mediaUrl: body.mediaUrl,
        mediaType: body.mediaType,
        likes: [],
        comments: [],
        createdAt: new Date().toISOString(),
      };
      store.posts.unshift(newPost);
      setLocalStore(store);
      return { ok: true, status: 201, data: { post: newPost } as unknown as T };
    }

    // 6. Like Post
    if (path.match(/\/api\/feed\/[^\/]+\/like/) && method === 'POST') {
      const postId = path.split('/')[3];
      const post = store.posts.find((p) => p.id === postId);
      if (post) {
        const userId = body.userId;
        const exists = post.likes.includes(userId);
        if (exists) {
          post.likes = post.likes.filter((id) => id !== userId);
        } else {
          post.likes.push(userId);
        }
        setLocalStore(store);
        return { ok: true, status: 200, data: { post } as unknown as T };
      }
      return { ok: false, status: 404, error: 'Post not found' };
    }

    // 7. Comment on Post
    if (path.match(/\/api\/feed\/[^\/]+\/comment/) && method === 'POST') {
      const postId = path.split('/')[3];
      const post = store.posts.find((p) => p.id === postId);
      if (post) {
        const author = store.users.find((u) => u.id === body.authorId);
        const newComment = {
          id: `comment_${Date.now()}`,
          postId,
          authorId: body.authorId,
          authorName: body.authorName || author?.name || 'User',
          authorPhone: body.authorPhone || author?.phone || '',
          authorAvatar: body.authorAvatar || author?.avatarUrl,
          authorRole: body.authorRole || author?.role || 'user',
          content: body.content,
          createdAt: new Date().toISOString(),
        };
        post.comments.push(newComment);
        setLocalStore(store);
        return { ok: true, status: 201, data: { comment: newComment } as unknown as T };
      }
      return { ok: false, status: 404, error: 'Post not found' };
    }

    // 8. Delete Post
    if (path.match(/\/api\/feed\/[^\/]+$/) && method === 'DELETE') {
      const postId = path.split('/')[3];
      store.posts = store.posts.filter((p) => p.id !== postId);
      setLocalStore(store);
      return { ok: true, status: 200, data: { success: true } as unknown as T };
    }

    // 9. Groups
    if (path === '/api/groups' && method === 'GET') {
      return { ok: true, status: 200, data: { groups: store.groups } as unknown as T };
    }

    if (path === '/api/groups' && method === 'POST') {
      const newGroup: Group = {
        id: `group_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: body.name.trim(),
        description: body.description?.trim() || '',
        avatarColor: body.avatarColor || 'from-amber-500 to-emerald-600',
        icon: body.icon || 'Users',
        createdBy: body.createdBy,
        createdAt: new Date().toISOString(),
        messagingMode: body.messagingMode || 'everyone',
        allowedSenderIds: [body.createdBy],
        memberIds: [body.createdBy],
        pendingRequestUserIds: [],
      };
      store.groups.push(newGroup);
      setLocalStore(store);
      return { ok: true, status: 201, data: { group: newGroup } as unknown as T };
    }

    if (path.match(/\/api\/groups\/[^\/]+\/join-request/) && method === 'POST') {
      const groupId = path.split('/')[3];
      const group = store.groups.find((g) => g.id === groupId);
      if (group) {
        if (!group.pendingRequestUserIds) group.pendingRequestUserIds = [];
        if (!group.pendingRequestUserIds.includes(body.userId)) {
          group.pendingRequestUserIds.push(body.userId);
        }
        setLocalStore(store);
        return { ok: true, status: 200, data: { success: true, group } as unknown as T };
      }
      return { ok: false, status: 404, error: 'Group not found' };
    }

    if (path.match(/\/api\/groups\/[^\/]+\/approve-request/) && method === 'POST') {
      const groupId = path.split('/')[3];
      const group = store.groups.find((g) => g.id === groupId);
      if (group) {
        group.pendingRequestUserIds = (group.pendingRequestUserIds || []).filter((id) => id !== body.userId);
        if (!group.memberIds.includes(body.userId)) {
          group.memberIds.push(body.userId);
        }
        setLocalStore(store);
        return { ok: true, status: 200, data: { success: true, group } as unknown as T };
      }
      return { ok: false, status: 404, error: 'Group not found' };
    }

    if (path.match(/\/api\/groups\/[^\/]+\/reject-request/) && method === 'POST') {
      const groupId = path.split('/')[3];
      const group = store.groups.find((g) => g.id === groupId);
      if (group) {
        group.pendingRequestUserIds = (group.pendingRequestUserIds || []).filter((id) => id !== body.userId);
        setLocalStore(store);
        return { ok: true, status: 200, data: { success: true, group } as unknown as T };
      }
      return { ok: false, status: 404, error: 'Group not found' };
    }

    if (path.match(/\/api\/groups\/[^\/]+\/permissions/) && (method === 'PUT' || method === 'POST')) {
      const groupId = path.split('/')[3];
      const group = store.groups.find((g) => g.id === groupId);
      if (group) {
        if (body.messagingMode) group.messagingMode = body.messagingMode;
        if (body.allowedSenderIds) group.allowedSenderIds = body.allowedSenderIds;
        setLocalStore(store);
        return { ok: true, status: 200, data: { group } as unknown as T };
      }
      return { ok: false, status: 404, error: 'Group not found' };
    }

    if (path.match(/\/api\/groups\/[^\/]+\/remove-member/) && method === 'POST') {
      const groupId = path.split('/')[3];
      const group = store.groups.find((g) => g.id === groupId);
      if (group) {
        group.memberIds = group.memberIds.filter((id) => id !== body.userId);
        group.allowedSenderIds = (group.allowedSenderIds || []).filter((id) => id !== body.userId);
        setLocalStore(store);
        return { ok: true, status: 200, data: { group } as unknown as T };
      }
      return { ok: false, status: 404, error: 'Group not found' };
    }

    if (path.match(/\/api\/groups\/[^\/]+$/) && method === 'DELETE') {
      const groupId = path.split('/')[3];
      store.groups = store.groups.filter((g) => g.id !== groupId);
      store.messages = store.messages.filter((m) => m.groupId !== groupId);
      setLocalStore(store);
      return { ok: true, status: 200, data: { success: true } as unknown as T };
    }

    // 10. Messages in Group
    if (path.match(/\/api\/groups\/[^\/]+\/messages/) && method === 'GET') {
      const groupId = path.split('/')[3];
      const msgs = store.messages.filter((m) => m.groupId === groupId);
      return { ok: true, status: 200, data: { messages: msgs } as unknown as T };
    }

    if (path.match(/\/api\/groups\/[^\/]+\/messages/) && method === 'POST') {
      const groupId = path.split('/')[3];
      const sender = store.users.find((u) => u.id === body.senderId);
      const newMsg: GroupMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        groupId,
        senderId: body.senderId,
        senderName: body.senderName || sender?.name || 'Member',
        senderPhone: body.senderPhone || sender?.phone || '',
        senderAvatar: body.senderAvatar || sender?.avatarUrl,
        senderRole: body.senderRole || sender?.role || 'user',
        text: body.text || '',
        mediaUrl: body.mediaUrl,
        mediaType: body.mediaType,
        reactions: {},
        createdAt: new Date().toISOString(),
      };
      store.messages.push(newMsg);
      setLocalStore(store);
      return { ok: true, status: 201, data: { message: newMsg } as unknown as T };
    }

    if (path.match(/\/api\/groups\/messages\/[^\/]+\/reaction/) && method === 'POST') {
      const messageId = path.split('/')[4];
      const msg = store.messages.find((m) => m.id === messageId);
      if (msg) {
        if (!msg.reactions) msg.reactions = {};
        const emoji = body.emoji;
        const userId = body.userId;
        if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
        if (msg.reactions[emoji].includes(userId)) {
          msg.reactions[emoji] = msg.reactions[emoji].filter((id) => id !== userId);
          if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
        } else {
          msg.reactions[emoji].push(userId);
        }
        setLocalStore(store);
        return { ok: true, status: 200, data: { message: msg } as unknown as T };
      }
      return { ok: false, status: 404, error: 'Message not found' };
    }

    // 11. Notes
    if (path === '/api/notes' && method === 'GET') {
      const userId = query.get('userId');
      const forAdmin = query.get('forAdmin') === 'true';
      const filtered = userId && !forAdmin ? store.notes.filter((n) => n.userId === userId) : store.notes;
      return { ok: true, status: 200, data: { notes: filtered } as unknown as T };
    }

    if (path === '/api/notes/payment' && method === 'POST') {
      const user = store.users.find((u) => u.id === body.userId);
      const newNote: AppNote = {
        id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: body.userId,
        userName: user?.name || 'User',
        userPhone: user?.phone || '',
        type: 'payment',
        title: `${body.whoPaid} - ৳${body.amount}`,
        amount: Number(body.amount),
        currency: 'BDT',
        reason: body.reason,
        whoPaid: body.whoPaid,
        optionalNotes: body.optionalNotes || '',
        noteDate: body.noteDate || new Date().toISOString().split('T')[0],
        noteTime: body.noteTime || new Date().toTimeString().slice(0, 5),
        createdAt: new Date().toISOString(),
        isDeletionPending: false,
      };
      store.notes.unshift(newNote);
      setLocalStore(store);
      return { ok: true, status: 201, data: { note: newNote } as unknown as T };
    }

    if (path === '/api/notes/id-password' && method === 'POST') {
      const user = store.users.find((u) => u.id === body.userId);
      const newNote: AppNote = {
        id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: body.userId,
        userName: user?.name || 'User',
        userPhone: user?.phone || '',
        type: 'id_password',
        title: body.title,
        usernameOrId: body.usernameOrId || '',
        password: body.password || '',
        urlOrApp: body.urlOrApp || '',
        content: body.content || '',
        noteDate: body.noteDate || new Date().toISOString().split('T')[0],
        noteTime: body.noteTime || new Date().toTimeString().slice(0, 5),
        createdAt: new Date().toISOString(),
        isDeletionPending: false,
      };
      store.notes.unshift(newNote);
      setLocalStore(store);
      return { ok: true, status: 201, data: { note: newNote } as unknown as T };
    }

    if (path.match(/\/api\/notes\/[^\/]+\/request-delete/) && method === 'POST') {
      const noteId = path.split('/')[3];
      const note = store.notes.find((n) => n.id === noteId);
      if (note) {
        note.isDeletionPending = true;
        note.deletionRequestedAt = new Date().toISOString();
        setLocalStore(store);
        return { ok: true, status: 200, data: { note } as unknown as T };
      }
      return { ok: false, status: 404, error: 'Note not found' };
    }

    if (path.match(/\/api\/notes\/[^\/]+\/approve-delete/) && method === 'POST') {
      const noteId = path.split('/')[3];
      store.notes = store.notes.filter((n) => n.id !== noteId);
      setLocalStore(store);
      return { ok: true, status: 200, data: { success: true } as unknown as T };
    }

    if (path.match(/\/api\/notes\/[^\/]+\/reject-delete/) && method === 'POST') {
      const noteId = path.split('/')[3];
      const note = store.notes.find((n) => n.id === noteId);
      if (note) {
        note.isDeletionPending = false;
        note.deletionRequestedAt = undefined;
        setLocalStore(store);
        return { ok: true, status: 200, data: { note } as unknown as T };
      }
      return { ok: false, status: 404, error: 'Note not found' };
    }

    // 12. Notifications
    if (path === '/api/notifications' && method === 'GET') {
      const userId = query.get('userId');
      const filtered = store.notifications.filter(
        (n) => n.recipientId === 'all' || n.recipientId === userId
      );
      return { ok: true, status: 200, data: { notifications: filtered } as unknown as T };
    }

    if ((path === '/api/notifications/read' || path === '/api/notifications/mark-read') && method === 'POST') {
      const userId = body.userId;
      const notifId = body.notificationId;
      store.notifications.forEach((n) => {
        if (!notifId || n.id === notifId) {
          if (!n.readBy.includes(userId)) {
            n.readBy.push(userId);
          }
        }
      });
      setLocalStore(store);
      return { ok: true, status: 200, data: { success: true } as unknown as T };
    }

    // 13. Admin Routes
    if (path === '/api/admin/stats' && method === 'GET') {
      let pendingJoinRequests = 0;
      store.groups.forEach((g) => {
        pendingJoinRequests += g.pendingRequestUserIds?.length || 0;
      });
      const pendingNoteDeletions = store.notes.filter((n) => n.isDeletionPending).length;

      const stats: AdminStats = {
        totalUsers: store.users.filter((u) => u.role !== 'admin').length,
        totalPosts: store.posts.length,
        totalGroups: store.groups.length,
        totalNotes: store.notes.length,
        pendingJoinRequests,
        pendingNoteDeletions,
      };
      return { ok: true, status: 200, data: stats as unknown as T };
    }

    if (path === '/api/admin/users' && method === 'GET') {
      const nonAdmins = store.users.filter((u) => u.role !== 'admin').map((u) => ({
        id: u.id,
        name: u.name,
        phone: u.phone,
        email: u.email,
        role: u.role,
        avatarUrl: u.avatarUrl,
        isBlocked: u.isBlocked,
        createdAt: u.createdAt,
      }));
      return { ok: true, status: 200, data: { users: nonAdmins } as unknown as T };
    }

    if (path.match(/\/api\/admin\/users\/[^\/]+\/toggle-block/) && method === 'POST') {
      const userId = path.split('/')[4];
      const user = store.users.find((u) => u.id === userId);
      if (user) {
        user.isBlocked = !user.isBlocked;
        setLocalStore(store);
        return { ok: true, status: 200, data: { user } as unknown as T };
      }
      return { ok: false, status: 404, error: 'User not found' };
    }

    if (path === '/api/admin/broadcast' && method === 'POST') {
      const newNotif: AppNotification = {
        id: `notif_${Date.now()}`,
        recipientId: body.recipientId || 'all',
        type: 'admin_broadcast',
        title: body.title || 'Official Announcement',
        message: body.message,
        readBy: [],
        createdAt: new Date().toISOString(),
      };
      store.notifications.unshift(newNotif);
      setLocalStore(store);
      return { ok: true, status: 201, data: { notification: newNotif } as unknown as T };
    }

    // Catch-all
    return { ok: true, status: 200, data: {} as unknown as T };
  } catch (err: any) {
    console.error('Local fallback handler error:', err);
    return { ok: false, status: 500, error: err.message || 'Operation failed' };
  }
}
