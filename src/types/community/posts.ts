/**
 * Community Posts Types
 *
 * Types for posts, replies, attachments, votes, and reactions.
 *
 * @module types/community/posts
 */

import type { PostId, ReplyId, AttachmentId, VoteId, ReactionId, CommunityUserId } from './branded-ids';
import type { FlexibleTimestamp } from './timestamps';
import type {
  PostCategory,
  AttachmentFileType,
  TargetType,
  VoteType,
  ReactionType,
  ReactionCounts,
} from './enums';

// ============================================================================
// POST ATTACHMENTS
// ============================================================================

/**
 * Post Attachment
 *
 * Represents a file attached to a post.
 *
 * @remarks
 * Attachments are stored in Firebase Storage and referenced by URL.
 * The fileType helps determine appropriate preview/display behavior.
 */
export interface PostAttachment {
  readonly id: AttachmentId;
  readonly fileName: string;
  readonly fileUrl: string;
  readonly fileSize: number;
  readonly fileType: AttachmentFileType;
  readonly mimeType: string;
  readonly uploadedAt: FlexibleTimestamp;
}

// ============================================================================
// COMMUNITY POST
// ============================================================================

/**
 * Community Post
 *
 * Represents a forum post in the community.
 *
 * @remarks
 * Posts are the primary content unit in the community platform.
 * They support rich text (HTML), attachments, reactions, and threading.
 */
export interface CommunityPost {
  readonly id: PostId;
  readonly title: string;
  readonly content: string;
  readonly contentHtml: string;
  readonly authorId: CommunityUserId;
  readonly authorName: string;
  readonly authorAvatar?: string | null;
  readonly category: PostCategory;
  readonly tags: readonly string[];
  readonly attachments?: readonly PostAttachment[];
  readonly upvotes: number;
  readonly downvotes: number;
  readonly reactionCounts: ReactionCounts;
  readonly replyCount: number;
  readonly isPinned: boolean;
  readonly isLocked: boolean;
  readonly isHidden: boolean;
  readonly viewCount: number;
  readonly lastActivityAt: FlexibleTimestamp;
  readonly createdAt: FlexibleTimestamp;
  readonly updatedAt: FlexibleTimestamp;
}

// ============================================================================
// REPLIES
// ============================================================================

/**
 * Reply to a Community Post
 *
 * Represents a reply to a forum post.
 *
 * @remarks
 * Replies support threading via parentReplyId, enabling
 * nested conversation structures within a post.
 */
export interface Reply {
  readonly id: ReplyId;
  readonly postId: PostId;
  readonly content: string;
  readonly contentHtml: string;
  readonly authorId: CommunityUserId;
  readonly authorName: string;
  readonly authorAvatar?: string | null;
  readonly parentReplyId?: ReplyId | null;
  readonly upvotes: number;
  readonly downvotes: number;
  readonly reactionCounts: ReactionCounts;
  readonly isAcceptedAnswer: boolean;
  readonly mentions: readonly CommunityUserId[];
  readonly isHidden: boolean;
  readonly createdAt: FlexibleTimestamp;
  readonly updatedAt: FlexibleTimestamp;
}

// ============================================================================
// FORUM CATEGORY
// ============================================================================

/**
 * Forum Category
 *
 * Represents a forum category with statistics.
 *
 * @remarks
 * Categories organize posts and provide summary statistics
 * for browsing the community.
 */
export interface ForumCategory {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly postCount: number;
  readonly latestPost?: CommunityPost | null;
}

// ============================================================================
// VOTES & REACTIONS
// ============================================================================

/**
 * Vote
 *
 * Represents a user's vote on a post or reply.
 *
 * @remarks
 * Votes are stored separately to enable fast counting
 * and prevent duplicate voting.
 */
export interface Vote {
  readonly id: VoteId;
  readonly userId: CommunityUserId;
  readonly targetId: PostId | ReplyId;
  readonly targetType: TargetType;
  readonly voteType: VoteType;
  readonly createdAt: FlexibleTimestamp;
}

/**
 * Reaction
 *
 * Represents an emoji reaction on a post or reply.
 *
 * @remarks
 * Reactions provide more nuanced feedback than simple votes,
 * enabling categorized emotional responses.
 */
export interface Reaction {
  readonly id: ReactionId;
  readonly userId: CommunityUserId;
  readonly userName: string;
  readonly targetId: PostId | ReplyId;
  readonly targetType: TargetType;
  readonly reactionType: ReactionType;
  readonly createdAt: FlexibleTimestamp;
}

// ============================================================================
// SEARCH RESULTS
// ============================================================================

/**
 * Post Search Result
 *
 * Extended post data with search relevance.
 *
 * @remarks
 * Returned from search operations with relevance scoring
 * and matched field information for highlighting.
 */
export interface PostSearchResult extends CommunityPost {
  readonly relevanceScore: number;
  readonly matchedFields: readonly string[];
  readonly excerpt: string;
}
