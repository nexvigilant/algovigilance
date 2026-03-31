/**
 * Community Forums Types
 *
 * Types for smart forums, circles, spaces, and membership.
 *
 * @module types/community/forums
 */

import type { CircleTags, CircleAuthority } from '../circle-taxonomy';
import type { CircleTemplateId } from '../circle-templates';
import type {
  ForumId,
  SpaceId,
  ResourceId,
  EventId,
  JoinRequestId,
  CommunityUserId,
} from './branded-ids';
import type { FlexibleTimestamp } from './timestamps';
import type {
  ForumType,
  ForumStatus,
  JoinType,
  JoinRequestStatus,
  ActivityLevel,
  SpaceType,
  SpaceVisibility,
  MemberRole,
  ResourceType,
  RequestFormQuestionType,
} from './enums';

// ============================================================================
// FORUM INTELLIGENCE
// ============================================================================

/**
 * Forum AI intelligence data.
 */
export interface ForumIntelligence {
  readonly topicEmbedding?: string;
  readonly keyThemes: readonly string[];
  readonly targetAudience: readonly string[];
  readonly similarForums: readonly ForumId[];
  readonly qualityScore: number;
}

// ============================================================================
// REQUEST FORMS
// ============================================================================

/**
 * Request form question configuration.
 */
export interface RequestFormQuestion {
  readonly id: string;
  readonly type: RequestFormQuestionType;
  readonly label: string;
  readonly placeholder?: string;
  readonly required: boolean;
  readonly options?: readonly string[];
}

/**
 * Custom join request form configuration.
 */
export interface RequestFormConfig {
  readonly enabled: boolean;
  readonly questions: readonly RequestFormQuestion[];
  readonly introMessage?: string;
}

// ============================================================================
// FORUM MEMBERSHIP
// ============================================================================

/**
 * Forum membership data.
 */
export interface ForumMembership {
  readonly memberIds: readonly CommunityUserId[];
  readonly moderatorIds: readonly CommunityUserId[];
  readonly memberCount: number;
  readonly joinType: JoinType;
  readonly pendingRequests: readonly CommunityUserId[];
  readonly requestForm?: RequestFormConfig;
}

// ============================================================================
// FORUM STATISTICS
// ============================================================================

/**
 * Forum statistics.
 */
export interface ForumStats {
  readonly postCount: number;
  readonly activeMembers: number;
  readonly avgResponseTime: number;
  readonly activityLevel: ActivityLevel;
  readonly weeklyGrowth: number;
}

// ============================================================================
// FORUM METADATA
// ============================================================================

/**
 * Forum metadata.
 */
export interface ForumMetadata {
  readonly icon?: string;
  readonly coverImage?: string;
  readonly rules?: readonly string[];
  readonly welcomeMessage?: string;
  readonly isPinned: boolean;
  readonly isFeatured: boolean;
  readonly isArchived: boolean;
  readonly requiredPathway?: string;
  readonly minProgress?: number;
}

// ============================================================================
// SMART FORUM
// ============================================================================

/**
 * Smart Forum
 *
 * Extended forum with AI-powered features.
 *
 * @remarks
 * SmartForum extends basic forum functionality with AI intelligence,
 * Circle system integration, and sophisticated membership management.
 */
export interface SmartForum {
  readonly id: ForumId;
  readonly name: string;
  readonly description: string;
  readonly type: ForumType;
  readonly category: string;
  readonly tags: readonly string[];
  readonly status: ForumStatus;
  readonly aiGenerated: boolean;
  readonly createdBy: CommunityUserId;
  readonly createdAt: FlexibleTimestamp;

  /** AI Intelligence data */
  readonly intelligence: ForumIntelligence;

  /** Membership configuration */
  readonly membership: ForumMembership;

  /** Forum statistics */
  readonly stats: ForumStats;

  /** Forum metadata */
  readonly metadata: ForumMetadata;

  /** Template used to create this circle (if any) */
  readonly templateId?: CircleTemplateId;

  /** Multi-dimensional tags for discovery */
  readonly circleTags?: CircleTags;

  /** Whether this is an official or community-created circle */
  readonly authority: CircleAuthority;

  /** Whether the organization affiliation has been verified */
  readonly verifiedOrganization?: boolean;

  /** Rank for featuring on homepage (lower = higher priority) */
  readonly featuredRank?: number;

  /** Computed match score for user recommendations (0-100) */
  readonly matchScore?: number;

  readonly updatedAt: FlexibleTimestamp;
}

// ============================================================================
// JOIN REQUESTS
// ============================================================================

/**
 * Join request form answer.
 */
export interface JoinRequestAnswer {
  readonly questionId: string;
  readonly questionLabel: string;
  readonly answer: string | readonly string[];
}

/**
 * Join Request
 *
 * Request to join a circle/forum with custom form answers.
 *
 * @remarks
 * Stored in: forums/{forumId}/join_requests/{requestId}
 */
export interface JoinRequest {
  readonly id: JoinRequestId;
  readonly forumId: ForumId;
  readonly userId: CommunityUserId;
  readonly userName?: string;
  readonly userEmail?: string;
  readonly status: JoinRequestStatus;
  readonly answers?: readonly JoinRequestAnswer[];
  readonly message?: string;
  readonly createdAt: FlexibleTimestamp;
  readonly reviewedAt?: FlexibleTimestamp;
  readonly reviewedBy?: CommunityUserId;
  readonly reviewNote?: string;
}

// ============================================================================
// COMMUNITY SPACES
// ============================================================================

/**
 * Space member roles mapping.
 */
export type SpaceMemberRoles = Readonly<Record<string, MemberRole>>;

/**
 * Space membership data.
 */
export interface SpaceMembership {
  readonly memberIds: readonly CommunityUserId[];
  readonly roles: SpaceMemberRoles;
  readonly memberCount: number;
}

/**
 * Space settings.
 */
export interface SpaceSettings {
  readonly allowMemberInvites: boolean;
  readonly allowForumCreation: boolean;
  readonly requireApproval: boolean;
  readonly isDiscoverable: boolean;
}

/**
 * Space Resource
 *
 * Shared resource within a community space.
 */
export interface SpaceResource {
  readonly id: ResourceId;
  readonly title: string;
  readonly description: string;
  readonly type: ResourceType;
  readonly url: string;
  readonly uploadedBy: CommunityUserId;
  readonly uploadedAt: FlexibleTimestamp;
}

/**
 * Space Event
 *
 * Event organized within a community space.
 */
export interface SpaceEvent {
  readonly id: EventId;
  readonly title: string;
  readonly description: string;
  readonly startTime: FlexibleTimestamp;
  readonly endTime: FlexibleTimestamp;
  readonly location?: string;
  readonly virtualLink?: string;
  readonly attendees: readonly CommunityUserId[];
  readonly createdBy: CommunityUserId;
  readonly createdAt: FlexibleTimestamp;
}

/**
 * Community Space
 *
 * Collection of forums organized by theme.
 *
 * @remarks
 * Spaces provide organizational hierarchy above forums,
 * grouping related discussions and resources together.
 */
export interface CommunitySpace {
  readonly id: SpaceId;
  readonly name: string;
  readonly description: string;
  readonly type: SpaceType;
  readonly visibility: SpaceVisibility;
  readonly icon?: string;
  readonly coverImage?: string;
  readonly members: SpaceMembership;
  readonly linkedForums: readonly ForumId[];
  readonly resources: readonly SpaceResource[];
  readonly events: readonly SpaceEvent[];
  readonly settings: SpaceSettings;
  readonly createdBy: CommunityUserId;
  readonly createdAt: FlexibleTimestamp;
  readonly updatedAt: FlexibleTimestamp;
}
