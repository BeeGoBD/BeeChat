export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  phone: string; // Bangladesh number, e.g. 01712345678
  email?: string; // e.g. admin@zayettl.com
  role: UserRole;
  avatarUrl?: string;
  isBlocked: boolean;
  createdAt: string;
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhone: string;
  authorAvatar?: string;
  authorRole: UserRole;
  content: string;
  createdAt: string;
}

export interface FeedPost {
  id: string;
  authorId: string;
  authorName: string;
  authorPhone: string;
  authorAvatar?: string;
  authorRole: UserRole;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  likes: string[]; // array of userIds
  comments: PostComment[];
  createdAt: string;
}

export type MessagingMode = 'everyone' | 'admin_only' | 'selected_members';

export interface Group {
  id: string;
  name: string;
  description: string;
  avatarColor: string;
  icon?: string;
  createdBy: string;
  createdAt: string;
  messagingMode: MessagingMode;
  allowedSenderIds: string[]; // specific user IDs if messagingMode === 'selected_members'
  memberIds: string[];
  pendingRequestUserIds: string[];
}

export interface MessageReaction {
  [emoji: string]: string[]; // emoji -> list of userIds
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderPhone?: string;
  senderAvatar?: string;
  senderRole: UserRole;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  reactions: MessageReaction;
  createdAt: string;
}

export interface PaymentNote {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  type: 'payment';
  title: string;
  amount: number;
  currency: string;
  reason: string;
  whoPaid: string;
  optionalNotes?: string;
  noteDate: string;
  noteTime: string;
  createdAt: string;
  isDeletionPending: boolean;
  deletionRequestedAt?: string;
}

export interface IdPasswordNote {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  type: 'id_password';
  title: string;
  content: string;
  usernameOrId?: string;
  password?: string;
  urlOrApp?: string;
  noteDate: string;
  noteTime: string;
  createdAt: string;
  isDeletionPending: boolean;
  deletionRequestedAt?: string;
}

export type AppNote = PaymentNote | IdPasswordNote;

export type NotificationType =
  | 'group_approved'
  | 'group_rejected'
  | 'group_removed'
  | 'note_delete_approved'
  | 'note_delete_rejected'
  | 'admin_broadcast'
  | 'info';

export interface AppNotification {
  id: string;
  recipientId: string; // 'all' or specific user ID
  type: NotificationType;
  title: string;
  message: string;
  readBy: string[]; // user IDs who have marked read
  createdAt: string;
  relatedId?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  totalGroups: number;
  totalNotes: number;
  pendingJoinRequests: number;
  pendingNoteDeletions: number;
}
