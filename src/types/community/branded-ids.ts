/**
 * Community Branded ID Types
 *
 * Branded string types for type-safe ID handling throughout the community module.
 * These prevent accidentally mixing up IDs at compile time.
 *
 * @module types/community/branded-ids
 */

// ============================================================================
// BRANDED ID TYPES
// ============================================================================

/** Branded string type for Community Post IDs */
export type PostId = string & { readonly __brand: 'PostId' };

/** Branded string type for Reply IDs */
export type ReplyId = string & { readonly __brand: 'ReplyId' };

/** Branded string type for Forum IDs */
export type ForumId = string & { readonly __brand: 'ForumId' };

/** Branded string type for Community Space IDs */
export type SpaceId = string & { readonly __brand: 'SpaceId' };

/** Branded string type for Badge IDs */
export type BadgeId = string & { readonly __brand: 'BadgeId' };

/** Branded string type for Notification IDs */
export type NotificationId = string & { readonly __brand: 'NotificationId' };

/** Branded string type for Conversation IDs */
export type ConversationId = string & { readonly __brand: 'ConversationId' };

/** Branded string type for Direct Message IDs */
export type MessageId = string & { readonly __brand: 'MessageId' };

/** Branded string type for Vote IDs */
export type VoteId = string & { readonly __brand: 'VoteId' };

/** Branded string type for Reaction IDs */
export type ReactionId = string & { readonly __brand: 'ReactionId' };

/** Branded string type for Attachment IDs */
export type AttachmentId = string & { readonly __brand: 'AttachmentId' };

/** Branded string type for Space Resource IDs */
export type ResourceId = string & { readonly __brand: 'ResourceId' };

/** Branded string type for Space Event IDs */
export type EventId = string & { readonly __brand: 'EventId' };

/** Branded string type for Join Request IDs */
export type JoinRequestId = string & { readonly __brand: 'JoinRequestId' };

/** Branded string type for User IDs (community context) */
export type CommunityUserId = string & { readonly __brand: 'CommunityUserId' };
