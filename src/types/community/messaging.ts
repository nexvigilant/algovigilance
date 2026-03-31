/**
 * Community Messaging Types
 *
 * Types for notifications, direct messages, and conversations.
 *
 * @module types/community/messaging
 */

import type { Timestamp } from 'firebase/firestore';
import type {
  NotificationId,
  ConversationId,
  MessageId,
  PostId,
  ReplyId,
  BadgeId,
  CommunityUserId,
} from './branded-ids';
import type { FlexibleTimestamp } from './timestamps';
import type { NotificationType, ReactionType } from './enums';

// ============================================================================
// NOTIFICATIONS
// ============================================================================

/**
 * Notification metadata for different notification types.
 */
export interface NotificationMetadata {
  readonly postId?: PostId;
  readonly replyId?: ReplyId;
  readonly senderId?: CommunityUserId;
  readonly senderName?: string;
  readonly reactionType?: ReactionType;
  readonly badgeId?: BadgeId;
}

/**
 * Notification
 *
 * Represents a user notification.
 *
 * @remarks
 * Notifications are generated for various community events
 * and displayed in the user's notification center.
 */
export interface Notification {
  readonly id: NotificationId;
  readonly userId: CommunityUserId;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly read: boolean;
  readonly actionUrl?: string;
  readonly metadata?: NotificationMetadata;
  readonly createdAt: FlexibleTimestamp;
}

// ============================================================================
// DIRECT MESSAGES
// ============================================================================

/**
 * Direct Message
 *
 * Represents a private message between users.
 *
 * @remarks
 * Messages support rich text (HTML) and soft deletion
 * while maintaining conversation history.
 */
export interface DirectMessage {
  readonly id: MessageId;
  readonly conversationId: ConversationId;
  readonly senderId: CommunityUserId;
  readonly senderName: string;
  readonly senderAvatar?: string | null;
  readonly recipientId: CommunityUserId;
  readonly content: string;
  readonly contentHtml: string;
  readonly read: boolean;
  readonly readAt?: Timestamp | null;
  readonly isDeleted: boolean;
  readonly createdAt: FlexibleTimestamp;
  readonly updatedAt: FlexibleTimestamp;
}

// ============================================================================
// CONVERSATIONS
// ============================================================================

/**
 * Participant name mapping.
 */
export type ParticipantNames = Readonly<Record<string, string>>;

/**
 * Participant avatar mapping.
 */
export type ParticipantAvatars = Readonly<Record<string, string | null>>;

/**
 * Unread count mapping by user.
 */
export type UnreadCountByUser = Readonly<Record<string, number>>;

/**
 * Conversation
 *
 * Represents a message thread between two users.
 *
 * @remarks
 * Conversations track the overall thread state including
 * participant info and unread counts per user.
 */
export interface Conversation {
  readonly id: ConversationId;
  readonly participants: readonly CommunityUserId[];
  readonly participantNames: ParticipantNames;
  readonly participantAvatars: ParticipantAvatars;
  readonly lastMessage: string;
  readonly lastMessageAt: FlexibleTimestamp;
  readonly unreadCount: UnreadCountByUser;
  readonly createdAt: FlexibleTimestamp;
  readonly updatedAt: FlexibleTimestamp;
}
