import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

interface DbUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  passwordHash: string;
  role: 'user' | 'admin';
  avatarUrl?: string;
  isBlocked: boolean;
  createdAt: string;
}

interface DbComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhone: string;
  authorAvatar?: string;
  authorRole: 'user' | 'admin';
  content: string;
  createdAt: string;
}

interface DbPost {
  id: string;
  authorId: string;
  authorName: string;
  authorPhone: string;
  authorAvatar?: string;
  authorRole: 'user' | 'admin';
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  likes: string[];
  comments: DbComment[];
  createdAt: string;
}

interface DbGroup {
  id: string;
  name: string;
  description: string;
  avatarColor: string;
  icon?: string;
  createdBy: string;
  createdAt: string;
  messagingMode: 'everyone' | 'admin_only' | 'selected_members';
  allowedSenderIds: string[];
  memberIds: string[];
  pendingRequestUserIds: string[];
}

interface DbGroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderPhone?: string;
  senderAvatar?: string;
  senderRole: 'user' | 'admin';
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  reactions: Record<string, string[]>;
  createdAt: string;
}

interface DbNote {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  type: 'payment' | 'id_password';
  title: string;
  amount?: number;
  currency?: string;
  reason?: string;
  whoPaid?: string;
  optionalNotes?: string;
  content?: string;
  usernameOrId?: string;
  password?: string;
  urlOrApp?: string;
  noteDate: string;
  noteTime: string;
  createdAt: string;
  isDeletionPending: boolean;
  deletionRequestedAt?: string;
}

interface DbNotification {
  id: string;
  recipientId: string; // 'all' or specific user ID
  type: string;
  title: string;
  message: string;
  readBy: string[];
  createdAt: string;
  relatedId?: string;
}

interface DatabaseSchema {
  users: DbUser[];
  posts: DbPost[];
  groups: DbGroup[];
  messages: DbGroupMessage[];
  notes: DbNote[];
  notifications: DbNotification[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "ettl_store.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadDatabase(): DatabaseSchema {
  const defaultAdmin: DbUser = {
    id: "admin-root",
    name: "ETTL System Admin",
    phone: "01700000000",
    email: "admin@zayettl.com",
    passwordHash: "Work@ETTL2026.com#", // special credentials specified by prompt
    role: "admin",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    isBlocked: false,
    createdAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
  };

  if (!fs.existsSync(DB_FILE)) {
    const initialDb: DatabaseSchema = {
      users: [defaultAdmin],
      posts: [],
      groups: [],
      messages: [],
      notes: [],
      notifications: [],
    };
    saveDatabase(initialDb);
    return initialDb;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw) as DatabaseSchema;
    // ensure admin exists
    const adminIndex = parsed.users.findIndex((u) => u.email === "admin@zayettl.com");
    if (adminIndex === -1) {
      parsed.users.push(defaultAdmin);
      saveDatabase(parsed);
    } else {
      // ensure correct password if modified
      parsed.users[adminIndex].passwordHash = "Work@ETTL2026.com#";
      parsed.users[adminIndex].role = "admin";
      parsed.users[adminIndex].isBlocked = false;
    }
    return parsed;
  } catch (err) {
    console.error("Error reading db file, re-initializing:", err);
    const initialDb: DatabaseSchema = {
      users: [defaultAdmin],
      posts: [],
      groups: [],
      messages: [],
      notes: [],
      notifications: [],
    };
    saveDatabase(initialDb);
    return initialDb;
  }
}

function saveDatabase(db: DatabaseSchema) {
  try {
    const tempPath = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(db, null, 2), "utf-8");
    fs.renameSync(tempPath, DB_FILE);
  } catch (err) {
    console.error("Failed to save database:", err);
  }
}

let db = loadDatabase();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Helper to strip sensitive user fields
  const safeUser = (u: DbUser) => ({
    id: u.id,
    name: u.name,
    phone: u.phone,
    email: u.email,
    role: u.role,
    avatarUrl: u.avatarUrl,
    isBlocked: u.isBlocked,
    createdAt: u.createdAt,
  });

  // Health
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================

  // Register
  app.post("/api/auth/register", (req, res) => {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ error: "Name, phone number, and password are required." });
    }

    // Normalize phone (strip spaces/dashes)
    const cleanPhone = phone.replace(/[\s\-]/g, "");
    // Validate BD phone: 01XXXXXXXXX or +8801XXXXXXXXX
    const bdPhoneRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;
    const match = cleanPhone.match(bdPhoneRegex);
    if (!match) {
      return res.status(400).json({
        error: "Please provide a valid 11-digit Bangladesh mobile number (e.g. 017XXXXXXXX).",
      });
    }

    const normalizedPhone = match[1]; // Always 11 digits: 01XXXXXXXXX

    // Check if phone already registered
    const existing = db.users.find((u) => u.phone === normalizedPhone);
    if (existing) {
      return res.status(400).json({
        error: "This Bangladesh mobile number is already registered. Please sign in instead.",
      });
    }

    const newUser: DbUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      phone: normalizedPhone,
      passwordHash: password,
      role: "user",
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}&backgroundColor=f59e0b`,
      isBlocked: false,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);

    // Auto-add new user to starter public groups if desired, or keep as open
    db.groups.forEach((g) => {
      if (g.id === "group-headquarters" && !g.memberIds.includes(newUser.id)) {
        g.memberIds.push(newUser.id);
      }
    });

    saveDatabase(db);
    return res.status(201).json({ user: safeUser(newUser) });
  });

  // Login
  app.post("/api/auth/login", (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: "Mobile number/email and password are required." });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // Check Admin Login (email: admin@zayettl.com / password: Work@ETTL2026.com#)
    if (
      cleanIdentifier === "admin@zayettl.com" ||
      cleanIdentifier === "admin" ||
      cleanIdentifier === "01700000000"
    ) {
      const admin = db.users.find((u) => u.email === "admin@zayettl.com" || u.role === "admin");
      if (admin && password === "Work@ETTL2026.com#") {
        return res.json({ user: safeUser(admin), isAdmin: true });
      }
    }

    // Normal user login with Bangladesh number
    const cleanPhone = cleanIdentifier.replace(/[\s\-]/g, "");
    const bdMatch = cleanPhone.match(/^(?:\+88|88)?(01[3-9]\d{8})$/);
    const searchPhone = bdMatch ? bdMatch[1] : cleanPhone;

    const user = db.users.find(
      (u) => u.phone === searchPhone || u.email?.toLowerCase() === cleanIdentifier
    );

    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ error: "Invalid mobile number or password." });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        error: "Your account has been suspended by company administration. Please contact Admin.",
      });
    }

    return res.json({ user: safeUser(user), isAdmin: user.role === "admin" });
  });

  // Profile Update
  app.put("/api/auth/profile", (req, res) => {
    const { userId, name, avatarUrl } = req.body;
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (name && name.trim()) user.name = name.trim();
    if (avatarUrl !== undefined) {
      user.avatarUrl = avatarUrl || undefined;
    }

    const updatedAvatar = user.avatarUrl;

    // Update in posts, comments, messages, notes
    db.posts.forEach((p) => {
      if (p.authorId === userId) {
        if (name) p.authorName = user.name;
        p.authorAvatar = updatedAvatar;
      }
      p.comments.forEach((c) => {
        if (c.authorId === userId) {
          if (name) c.authorName = user.name;
          c.authorAvatar = updatedAvatar;
        }
      });
    });

    db.messages.forEach((m) => {
      if (m.senderId === userId) {
        if (name) m.senderName = user.name;
        m.senderAvatar = updatedAvatar;
      }
    });

    db.notes.forEach((n) => {
      if (n.userId === userId && name) {
        n.userName = user.name;
      }
    });

    saveDatabase(db);
    return res.json({ user: safeUser(user) });
  });

  // Change Password
  app.put("/api/auth/change-password", (req, res) => {
    const { userId, oldPassword, newPassword } = req.body;
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (user.passwordHash !== oldPassword) {
      return res.status(400).json({ error: "Current password does not match." });
    }

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: "New password must be at least 4 characters." });
    }

    user.passwordHash = newPassword;
    saveDatabase(db);
    return res.json({ message: "Password updated successfully." });
  });

  // ==========================================
  // FEED POSTS
  // ==========================================

  app.get("/api/feed", (_req, res) => {
    const sorted = [...db.posts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json({ posts: sorted });
  });

  app.post("/api/feed", (req, res) => {
    const { authorId, content, mediaUrl, mediaType } = req.body;
    const user = db.users.find((u) => u.id === authorId);
    if (!user) {
      return res.status(404).json({ error: "Author not found." });
    }

    if (!content && !mediaUrl) {
      return res.status(400).json({ error: "Post must contain text or media." });
    }

    const newPost: DbPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      authorId: user.id,
      authorName: user.name,
      authorPhone: user.phone,
      authorAvatar: user.avatarUrl,
      authorRole: user.role,
      content: (content || "").trim(),
      mediaUrl,
      mediaType,
      likes: [],
      comments: [],
      createdAt: new Date().toISOString(),
    };

    db.posts.unshift(newPost);
    saveDatabase(db);
    return res.status(201).json({ post: newPost });
  });

  app.post("/api/feed/:id/like", (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;
    const post = db.posts.find((p) => p.id === id);
    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    const likedIndex = post.likes.indexOf(userId);
    if (likedIndex === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(likedIndex, 1);
    }

    saveDatabase(db);
    return res.json({ post });
  });

  app.post("/api/feed/:id/comment", (req, res) => {
    const { id } = req.params;
    const { authorId, content } = req.body;
    const post = db.posts.find((p) => p.id === id);
    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }
    const user = db.users.find((u) => u.id === authorId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Comment cannot be empty." });
    }

    const comment: DbComment = {
      id: `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      postId: id,
      authorId: user.id,
      authorName: user.name,
      authorPhone: user.phone,
      authorAvatar: user.avatarUrl,
      authorRole: user.role,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    post.comments.push(comment);
    saveDatabase(db);
    return res.status(201).json({ comment, post });
  });

  app.delete("/api/feed/:id", (req, res) => {
    const { id } = req.params;
    const userId = (req.body?.userId || req.query.userId || "") as string;
    const postIndex = db.posts.findIndex((p) => p.id === id);
    if (postIndex === -1) {
      return res.status(404).json({ error: "Post not found." });
    }

    const post = db.posts[postIndex];
    const requestingUser = db.users.find((u) => u.id === userId);

    // Admin can delete any post, or author can delete their own post
    if (requestingUser?.role !== "admin" && post.authorId !== userId) {
      return res.status(403).json({ error: "Permission denied to delete this post." });
    }

    db.posts.splice(postIndex, 1);
    saveDatabase(db);
    return res.json({ ok: true, message: "Post deleted successfully." });
  });

  // ==========================================
  // GROUPS & CHAT
  // ==========================================

  app.get("/api/groups", (_req, res) => {
    res.json({ groups: db.groups });
  });

  // Admin create group
  app.post("/api/groups", (req, res) => {
    const { adminId, name, description, avatarColor, messagingMode } = req.body;
    const admin = db.users.find((u) => u.id === adminId && u.role === "admin");
    if (!admin) {
      return res.status(403).json({ error: "Only Admin can create groups." });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Group name is required." });
    }

    const newGroup: DbGroup = {
      id: `grp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      description: (description || "").trim(),
      avatarColor: avatarColor || "#F59E0B",
      createdBy: admin.id,
      createdAt: new Date().toISOString(),
      messagingMode: messagingMode || "everyone",
      allowedSenderIds: [],
      memberIds: [admin.id],
      pendingRequestUserIds: [],
    };

    db.groups.push(newGroup);
    saveDatabase(db);
    return res.status(201).json({ group: newGroup });
  });

  // User request to join group
  app.post("/api/groups/:id/join-request", (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;
    const group = db.groups.find((g) => g.id === id);
    if (!group) return res.status(404).json({ error: "Group not found." });

    if (group.memberIds.includes(userId)) {
      return res.status(400).json({ error: "You are already a member of this group." });
    }

    if (!group.pendingRequestUserIds.includes(userId)) {
      group.pendingRequestUserIds.push(userId);
      saveDatabase(db);
    }

    return res.json({ group });
  });

  // Admin approve join request
  app.post("/api/groups/:id/approve-request", (req, res) => {
    const { id } = req.params;
    const { targetUserId } = req.body;
    const group = db.groups.find((g) => g.id === id);
    if (!group) return res.status(404).json({ error: "Group not found." });

    // Remove from pending
    group.pendingRequestUserIds = group.pendingRequestUserIds.filter((uId) => uId !== targetUserId);

    // Add to members
    if (!group.memberIds.includes(targetUserId)) {
      group.memberIds.push(targetUserId);
    }

    // Send notification to user
    const notif: DbNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      recipientId: targetUserId,
      type: "group_approved",
      title: "Group Request Approved",
      message: `Your request to join "${group.name}" has been approved by the Admin.`,
      readBy: [],
      createdAt: new Date().toISOString(),
      relatedId: group.id,
    };
    db.notifications.unshift(notif);

    saveDatabase(db);
    return res.json({ group, notification: notif });
  });

  // Admin reject join request
  app.post("/api/groups/:id/reject-request", (req, res) => {
    const { id } = req.params;
    const { targetUserId } = req.body;
    const group = db.groups.find((g) => g.id === id);
    if (!group) return res.status(404).json({ error: "Group not found." });

    group.pendingRequestUserIds = group.pendingRequestUserIds.filter((uId) => uId !== targetUserId);

    // Send notification to user
    const notif: DbNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      recipientId: targetUserId,
      type: "group_rejected",
      title: "Group Request Declined",
      message: `Your request to join "${group.name}" was not approved by the Admin.`,
      readBy: [],
      createdAt: new Date().toISOString(),
      relatedId: group.id,
    };
    db.notifications.unshift(notif);

    saveDatabase(db);
    return res.json({ group, notification: notif });
  });

  // Admin remove member
  app.post("/api/groups/:id/remove-member", (req, res) => {
    const { id } = req.params;
    const { targetUserId } = req.body;
    const group = db.groups.find((g) => g.id === id);
    if (!group) return res.status(404).json({ error: "Group not found." });

    group.memberIds = group.memberIds.filter((uId) => uId !== targetUserId);
    group.allowedSenderIds = group.allowedSenderIds.filter((uId) => uId !== targetUserId);

    // Send notification to user
    const notif: DbNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      recipientId: targetUserId,
      type: "group_removed",
      title: "Removed from Group",
      message: `You were removed from "${group.name}" by company administration.`,
      readBy: [],
      createdAt: new Date().toISOString(),
      relatedId: group.id,
    };
    db.notifications.unshift(notif);

    saveDatabase(db);
    return res.json({ group, notification: notif });
  });

  // Admin update permissions (messagingMode and allowedSenderIds)
  app.put("/api/groups/:id/permissions", (req, res) => {
    const { id } = req.params;
    const { messagingMode, allowedSenderIds } = req.body;
    const group = db.groups.find((g) => g.id === id);
    if (!group) return res.status(404).json({ error: "Group not found." });

    if (messagingMode) group.messagingMode = messagingMode;
    if (Array.isArray(allowedSenderIds)) group.allowedSenderIds = allowedSenderIds;

    saveDatabase(db);
    return res.json({ group });
  });

  // Admin delete group
  app.delete("/api/groups/:id", (req, res) => {
    const { id } = req.params;
    const groupIndex = db.groups.findIndex((g) => g.id === id);
    if (groupIndex === -1) return res.status(404).json({ error: "Group not found." });

    db.groups.splice(groupIndex, 1);
    // clean up group messages
    db.messages = db.messages.filter((m) => m.groupId !== id);

    saveDatabase(db);
    return res.json({ success: true, message: "Group deleted successfully." });
  });

  // Group Messages
  app.get("/api/groups/:id/messages", (req, res) => {
    const { id } = req.params;
    const messages = db.messages
      .filter((m) => m.groupId === id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    res.json({ messages });
  });

  app.post("/api/groups/:id/messages", (req, res) => {
    const { id } = req.params;
    const { senderId, text, mediaUrl, mediaType } = req.body;
    const group = db.groups.find((g) => g.id === id);
    if (!group) return res.status(404).json({ error: "Group not found." });

    const user = db.users.find((u) => u.id === senderId);
    if (!user) return res.status(404).json({ error: "User not found." });

    // Check membership
    if (!group.memberIds.includes(senderId) && user.role !== "admin") {
      return res.status(403).json({ error: "You must be an approved member to send messages." });
    }

    // Check messaging permission
    if (user.role !== "admin") {
      if (group.messagingMode === "admin_only") {
        return res.status(403).json({ error: "Only Admin can send messages in this group." });
      }
      if (
        group.messagingMode === "selected_members" &&
        !group.allowedSenderIds.includes(senderId)
      ) {
        return res.status(403).json({
          error: "You are not in the list of authorized senders for this group.",
        });
      }
    }

    if (!text && !mediaUrl) {
      return res.status(400).json({ error: "Message content or media is required." });
    }

    const newMsg: DbGroupMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      groupId: id,
      senderId: user.id,
      senderName: user.name,
      senderPhone: user.phone,
      senderAvatar: user.avatarUrl,
      senderRole: user.role,
      text: (text || "").trim(),
      mediaUrl,
      mediaType,
      reactions: {},
      createdAt: new Date().toISOString(),
    };

    db.messages.push(newMsg);
    saveDatabase(db);
    return res.status(201).json({ message: newMsg });
  });

  // Toggle reaction on message
  app.post("/api/groups/messages/:messageId/reaction", (req, res) => {
    const { messageId } = req.params;
    const { userId, emoji } = req.body;
    const msg = db.messages.find((m) => m.id === messageId);
    if (!msg) return res.status(404).json({ error: "Message not found." });

    if (!msg.reactions) msg.reactions = {};
    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];

    const userList = msg.reactions[emoji];
    const index = userList.indexOf(userId);
    if (index === -1) {
      userList.push(userId);
    } else {
      userList.splice(index, 1);
      if (userList.length === 0) {
        delete msg.reactions[emoji];
      }
    }

    saveDatabase(db);
    return res.json({ message: msg });
  });

  // ==========================================
  // NOTES & RECORDS
  // ==========================================

  // Get notes (user sees their own notes; admin can see all or filter)
  app.get("/api/notes", (req, res) => {
    const userId = req.query.userId as string;
    const forAdmin = req.query.forAdmin === "true";

    const requestingUser = db.users.find((u) => u.id === userId);
    if (forAdmin && requestingUser?.role === "admin") {
      const allNotes = [...db.notes].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return res.json({ notes: allNotes });
    }

    const userNotes = db.notes
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({ notes: userNotes });
  });

  // Create Payment Note
  app.post("/api/notes/payment", (req, res) => {
    const { userId, amount, reason, whoPaid, optionalNotes, noteDate, noteTime } = req.body;
    const user = db.users.find((u) => u.id === userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    if (!amount || !reason || !whoPaid) {
      return res.status(400).json({ error: "Amount, reason, and payer name are required." });
    }

    const now = new Date();
    const newNote: DbNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      type: "payment",
      title: `Payment: ৳${Number(amount).toLocaleString()} - ${reason}`,
      amount: Number(amount),
      currency: "BDT",
      reason: reason.trim(),
      whoPaid: whoPaid.trim(),
      optionalNotes: (optionalNotes || "").trim(),
      noteDate: noteDate || now.toISOString().split("T")[0],
      noteTime:
        noteTime ||
        now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
      createdAt: now.toISOString(),
      isDeletionPending: false,
    };

    db.notes.unshift(newNote);
    saveDatabase(db);
    return res.status(201).json({ note: newNote });
  });

  // Create ID & Password Note
  app.post("/api/notes/id-password", (req, res) => {
    const { userId, title, content, usernameOrId, password, urlOrApp, noteDate, noteTime } = req.body;
    const user = db.users.find((u) => u.id === userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title or account name is required." });
    }

    const now = new Date();
    const newNote: DbNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      type: "id_password",
      title: title.trim(),
      content: (content || "").trim(),
      usernameOrId: (usernameOrId || "").trim(),
      password: (password || "").trim(),
      urlOrApp: (urlOrApp || "").trim(),
      noteDate: noteDate || now.toISOString().split("T")[0],
      noteTime:
        noteTime ||
        now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
      createdAt: now.toISOString(),
      isDeletionPending: false,
    };

    db.notes.unshift(newNote);
    saveDatabase(db);
    return res.status(201).json({ note: newNote });
  });

  // Request Delete Note (User side)
  app.post("/api/notes/:id/request-delete", (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;
    const note = db.notes.find((n) => n.id === id);
    if (!note) return res.status(404).json({ error: "Record not found." });

    if (note.userId !== userId) {
      return res.status(403).json({ error: "You can only request deletion for your own notes." });
    }

    note.isDeletionPending = true;
    note.deletionRequestedAt = new Date().toISOString();
    saveDatabase(db);
    return res.json({ note, message: "Deletion request submitted to Admin." });
  });

  // Admin Approve Note Deletion
  app.post("/api/notes/:id/approve-delete", (req, res) => {
    const { id } = req.params;
    const noteIndex = db.notes.findIndex((n) => n.id === id);
    if (noteIndex === -1) return res.status(404).json({ error: "Record not found." });

    const note = db.notes[noteIndex];
    // Notify user
    const notif: DbNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      recipientId: note.userId,
      type: "note_delete_approved",
      title: "Note Deletion Approved",
      message: `Your deletion request for "${note.title}" has been approved. The record is permanently deleted.`,
      readBy: [],
      createdAt: new Date().toISOString(),
      relatedId: note.id,
    };
    db.notifications.unshift(notif);

    // Delete record permanently
    db.notes.splice(noteIndex, 1);
    saveDatabase(db);
    return res.json({ message: "Record deleted and user notified.", notification: notif });
  });

  // Admin Reject Note Deletion
  app.post("/api/notes/:id/reject-delete", (req, res) => {
    const { id } = req.params;
    const note = db.notes.find((n) => n.id === id);
    if (!note) return res.status(404).json({ error: "Record not found." });

    note.isDeletionPending = false;
    delete note.deletionRequestedAt;

    // Notify user
    const notif: DbNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      recipientId: note.userId,
      type: "note_delete_rejected",
      title: "Note Deletion Request Rejected",
      message: `Your request to delete "${note.title}" was declined by the Admin. The record has been retained.`,
      readBy: [],
      createdAt: new Date().toISOString(),
      relatedId: note.id,
    };
    db.notifications.unshift(notif);

    saveDatabase(db);
    return res.json({ note, notification: notif });
  });

  // ==========================================
  // NOTIFICATIONS & BROADCASTS
  // ==========================================

  app.get("/api/notifications", (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) return res.json({ notifications: [] });

    const currentUser = db.users.find((u) => u.id === userId);

    const userNotifs = db.notifications
      .filter((n) => {
        if (n.recipientId === "all") return true;
        if (n.recipientId === userId) return true;
        if (currentUser) {
          if (n.recipientId === "active_users" && !currentUser.isBlocked) return true;
          if (n.recipientId === "rejected_users" && currentUser.isBlocked) return true;
        }
        return false;
      })
      .map((n) => ({
        ...n,
        read: n.readBy.includes(userId),
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({ notifications: userNotifs });
  });

  app.post("/api/notifications/mark-read", (req, res) => {
    const { userId, notificationId } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID required." });

    const currentUser = db.users.find((u) => u.id === userId);

    if (notificationId) {
      const notif = db.notifications.find((n) => n.id === notificationId);
      if (notif && !notif.readBy.includes(userId)) {
        notif.readBy.push(userId);
      }
    } else {
      // Mark all eligible notifications as read for this user
      db.notifications.forEach((n) => {
        const isEligible =
          n.recipientId === "all" ||
          n.recipientId === userId ||
          (currentUser && n.recipientId === "active_users" && !currentUser.isBlocked) ||
          (currentUser && n.recipientId === "rejected_users" && currentUser.isBlocked);

        if (isEligible && !n.readBy.includes(userId)) {
          n.readBy.push(userId);
        }
      });
    }

    saveDatabase(db);
    return res.json({ success: true });
  });

  // Admin Broadcast notification
  app.post("/api/admin/broadcast", (req, res) => {
    const { adminId, recipientId, title, message } = req.body;
    const admin = db.users.find((u) => u.id === adminId && u.role === "admin");
    if (!admin) return res.status(403).json({ error: "Admin authorization required." });

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message content is required." });
    }

    const notif: DbNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      recipientId: recipientId || "all",
      type: "admin_broadcast",
      title: (title || "Official Admin Announcement").trim(),
      message: message.trim(),
      readBy: [],
      createdAt: new Date().toISOString(),
    };

    db.notifications.unshift(notif);
    saveDatabase(db);
    return res.status(201).json({ notification: notif });
  });

  // ==========================================
  // ADMIN DASHBOARD & CONTROLS
  // ==========================================

  app.get("/api/admin/stats", (_req, res) => {
    let pendingJoinRequests = 0;
    db.groups.forEach((g) => {
      pendingJoinRequests += g.pendingRequestUserIds.length;
    });

    const pendingNoteDeletions = db.notes.filter((n) => n.isDeletionPending).length;

    res.json({
      totalUsers: db.users.filter((u) => u.role !== "admin").length,
      totalPosts: db.posts.length,
      totalGroups: db.groups.length,
      totalNotes: db.notes.length,
      pendingJoinRequests,
      pendingNoteDeletions,
    });
  });

  app.get("/api/admin/users", (_req, res) => {
    const safeUsers = db.users
      .filter((u) => u.role !== "admin")
      .map(safeUser)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ users: safeUsers });
  });

  app.post("/api/admin/users/:id/toggle-block", (req, res) => {
    const { id } = req.params;
    const user = db.users.find((u) => u.id === id);
    if (!user) return res.status(404).json({ error: "User not found." });

    if (user.role === "admin") {
      return res.status(400).json({ error: "Cannot block administrator." });
    }

    user.isBlocked = !user.isBlocked;
    saveDatabase(db);
    return res.json({ user: safeUser(user) });
  });

  // Dedicated 404 handler for any unhandled /api requests to prevent HTML fallback
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.originalUrl} not found.` });
  });

  // Global error handler for API routes
  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled server error:", err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).json({ error: err?.message || "Internal server error occurred." });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ETTL PC Server running on port ${PORT}`);
  });
}

startServer();
