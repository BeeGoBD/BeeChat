import { User, FeedPost, Group, GroupMessage, AppNote, AppNotification, AdminStats } from '../types';

const STORAGE_KEY = 'beechat_cloud_store_v2';

export interface LocalStoreData {
  users: Array<User & { passwordHash: string }>;
  posts: FeedPost[];
  groups: Group[];
  messages: GroupMessage[];
  notes: AppNote[];
  notifications: AppNotification[];
}

const DEFAULT_ADMIN: User & { passwordHash: string } = {
  id: 'admin-root',
  name: 'Bee Chat System Admin',
  phone: '01700000000',
  email: 'admin@zayettl.com',
  passwordHash: 'Work@ETTL2026.com#',
  role: 'admin',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  isBlocked: false,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const DEFAULT_GROUPS: Group[] = [
  {
    id: 'group-headquarters',
    name: 'Bee Chat Official Board',
    description: 'Company-wide official bulletins, administrative updates, and central discussions.',
    avatarColor: 'from-amber-500 to-emerald-600',
    icon: 'Shield',
    createdBy: 'admin-root',
    createdAt: '2026-01-01T00:00:00.000Z',
    messagingMode: 'everyone',
    allowedSenderIds: ['admin-root'],
    memberIds: ['admin-root'],
    pendingRequestUserIds: [],
  },
  {
    id: 'group-finance',
    name: 'Accounts & Billing Updates',
    description: 'Financial notifications, payment disbursement logs, and invoice receipts.',
    avatarColor: 'from-emerald-500 to-teal-600',
    icon: 'CreditCard',
    createdBy: 'admin-root',
    createdAt: '2026-01-01T00:00:00.000Z',
    messagingMode: 'admin_only',
    allowedSenderIds: ['admin-root'],
    memberIds: ['admin-root'],
    pendingRequestUserIds: [],
  },
  {
    id: 'group-support',
    name: 'General Helpdesk & Queries',
    description: 'Internal employee collaboration, peer support, and team communication.',
    avatarColor: 'from-blue-500 to-indigo-600',
    icon: 'MessageSquare',
    createdBy: 'admin-root',
    createdAt: '2026-01-01T00:00:00.000Z',
    messagingMode: 'everyone',
    allowedSenderIds: ['admin-root'],
    memberIds: ['admin-root'],
    pendingRequestUserIds: [],
  },
];

const DEFAULT_POSTS: FeedPost[] = [
  {
    id: 'post-welcome-1',
    authorId: 'admin-root',
    authorName: 'Bee Chat System Admin',
    authorPhone: '01700000000',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    authorRole: 'admin',
    content: 'Welcome to Bee Chat! A secure workspace for team feeds, messaging groups, payment tracking, and company communications. Stay connected with your team!',
    likes: [],
    comments: [
      {
        id: 'comment-1',
        postId: 'post-welcome-1',
        authorId: 'admin-root',
        authorName: 'Bee Chat System Admin',
        authorPhone: '01700000000',
        authorRole: 'admin',
        content: 'Feel free to post updates, share work photos, and join relevant team groups.',
        createdAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-init-1',
    recipientId: 'all',
    type: 'admin_broadcast',
    title: 'Welcome to Bee Chat',
    message: 'Your high-performance workspace is active. Manage your profile, connect in team groups, and track expenses securely.',
    readBy: [],
    createdAt: new Date().toISOString(),
  },
];

export function getLocalStore(): LocalStoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: LocalStoreData = {
        users: [DEFAULT_ADMIN],
        posts: DEFAULT_POSTS,
        groups: DEFAULT_GROUPS,
        messages: [],
        notes: [],
        notifications: DEFAULT_NOTIFICATIONS,
      };
      setLocalStore(initial);
      return initial;
    }
    const data = JSON.parse(raw) as LocalStoreData;
    // Guarantee admin exists with the exact password
    const adminIdx = data.users.findIndex((u) => u.email === 'admin@zayettl.com' || u.id === 'admin-root');
    if (adminIdx === -1) {
      data.users.push(DEFAULT_ADMIN);
    } else {
      data.users[adminIdx].passwordHash = 'Work@ETTL2026.com#';
      data.users[adminIdx].role = 'admin';
      data.users[adminIdx].isBlocked = false;
    }
    if (!data.groups || data.groups.length === 0) {
      data.groups = DEFAULT_GROUPS;
    }
    return data;
  } catch (err) {
    console.error('Error reading local store:', err);
    const initial: LocalStoreData = {
      users: [DEFAULT_ADMIN],
      posts: DEFAULT_POSTS,
      groups: DEFAULT_GROUPS,
      messages: [],
      notes: [],
      notifications: DEFAULT_NOTIFICATIONS,
    };
    return initial;
  }
}

export function setLocalStore(data: LocalStoreData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

function stripSensitiveUser(u: User & { passwordHash: string }): User {
  return {
    id: u.id,
    name: u.name,
    phone: u.phone,
    email: u.email,
    role: u.role,
    avatarUrl: u.avatarUrl,
    isBlocked: u.isBlocked,
    createdAt: u.createdAt,
  };
}

// Local Auth methods
export function localRegister(name: string, phone: string, password: string): { ok: boolean; user?: User; error?: string } {
  const store = getLocalStore();
  const cleanPhone = phone.replace(/[\s\-]/g, '');
  const bdMatch = cleanPhone.match(/^(?:\+88|88)?(01[3-9]\d{8})$/);
  if (!bdMatch) {
    return { ok: false, error: 'Please provide a valid 11-digit Bangladesh mobile number (e.g. 017XXXXXXXX).' };
  }
  const normalizedPhone = bdMatch[1];

  const existing = store.users.find((u) => u.phone === normalizedPhone);
  if (existing) {
    return { ok: false, error: 'This Bangladesh mobile number is already registered. Please sign in instead.' };
  }

  const newUser: User & { passwordHash: string } = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    phone: normalizedPhone,
    passwordHash: password,
    role: 'user',
    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}&backgroundColor=25D366`,
    isBlocked: false,
    createdAt: new Date().toISOString(),
  };

  store.users.push(newUser);
  // Add to default group
  const hq = store.groups.find((g) => g.id === 'group-headquarters');
  if (hq && !hq.memberIds.includes(newUser.id)) {
    hq.memberIds.push(newUser.id);
  }

  setLocalStore(store);
  return { ok: true, user: stripSensitiveUser(newUser) };
}

export function localLogin(identifier: string, password: string): { ok: boolean; user?: User; isAdmin?: boolean; error?: string } {
  const store = getLocalStore();
  const cleanIdentifier = identifier.trim().toLowerCase();

  // Admin login check
  if (cleanIdentifier === 'admin@zayettl.com' || cleanIdentifier === 'admin' || cleanIdentifier === '01700000000') {
    const admin = store.users.find((u) => u.email === 'admin@zayettl.com' || u.id === 'admin-root');
    if (admin && password === 'Work@ETTL2026.com#') {
      return { ok: true, user: stripSensitiveUser(admin), isAdmin: true };
    }
  }

  // Normal user login
  const cleanPhone = cleanIdentifier.replace(/[\s\-]/g, '');
  const bdMatch = cleanPhone.match(/^(?:\+88|88)?(01[3-9]\d{8})$/);
  const searchPhone = bdMatch ? bdMatch[1] : cleanPhone;

  const user = store.users.find(
    (u) => u.phone === searchPhone || u.email?.toLowerCase() === cleanIdentifier
  );

  if (!user || user.passwordHash !== password) {
    return { ok: false, error: 'Invalid mobile number or password.' };
  }

  if (user.isBlocked) {
    return { ok: false, error: 'Your account has been suspended by company administration. Please contact Admin.' };
  }

  return { ok: true, user: stripSensitiveUser(user), isAdmin: user.role === 'admin' };
}

export function localUpdateProfile(userId: string, data: { name?: string; avatarUrl?: string }): { ok: boolean; user?: User; error?: string } {
  const store = getLocalStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user) return { ok: false, error: 'User not found.' };

  if (data.name && data.name.trim()) {
    user.name = data.name.trim();
  }
  if (data.avatarUrl !== undefined) {
    user.avatarUrl = data.avatarUrl.trim() || undefined;
  }

  // Update in posts and comments
  store.posts.forEach((p) => {
    if (p.authorId === userId) {
      if (data.name) p.authorName = data.name;
      if (data.avatarUrl !== undefined) p.authorAvatar = data.avatarUrl || undefined;
    }
    p.comments.forEach((c) => {
      if (c.authorId === userId) {
        if (data.name) c.authorName = data.name;
        if (data.avatarUrl !== undefined) c.authorAvatar = data.avatarUrl || undefined;
      }
    });
  });

  // Update in messages
  store.messages.forEach((m) => {
    if (m.senderId === userId) {
      if (data.name) m.senderName = data.name;
      if (data.avatarUrl !== undefined) m.senderAvatar = data.avatarUrl || undefined;
    }
  });

  setLocalStore(store);
  return { ok: true, user: stripSensitiveUser(user) };
}

export function localChangePassword(userId: string, oldPass: string, newPass: string): { ok: boolean; error?: string } {
  const store = getLocalStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user) return { ok: false, error: 'User not found.' };
  if (user.passwordHash !== oldPass) {
    return { ok: false, error: 'Incorrect current password provided.' };
  }
  user.passwordHash = newPass;
  setLocalStore(store);
  return { ok: true };
}
