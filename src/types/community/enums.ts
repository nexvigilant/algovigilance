/**
 * Community Enums and Constants
 *
 * All enumeration types, constant arrays, and type guards for the community module.
 *
 * @module types/community/enums
 */

// ============================================================================
// CATEGORY & TYPE ENUMS
// ============================================================================

/**
 * Categories for community posts.
 */
export type PostCategory = 'general' | 'academy' | 'careers' | 'sentinel' | 'projects';

/**
 * All valid post categories.
 */
export const POST_CATEGORIES: readonly PostCategory[] = [
  'general', 'academy', 'careers', 'sentinel', 'projects'
] as const;

/**
 * Type guard for PostCategory.
 */
export function isPostCategory(value: string): value is PostCategory {
  return POST_CATEGORIES.includes(value as PostCategory);
}

/**
 * File types for post attachments.
 */
export type AttachmentFileType = 'image' | 'document' | 'pdf' | 'spreadsheet' | 'other';

/**
 * All valid attachment file types.
 */
export const ATTACHMENT_FILE_TYPES: readonly AttachmentFileType[] = [
  'image', 'document', 'pdf', 'spreadsheet', 'other'
] as const;

/**
 * Type guard for AttachmentFileType.
 */
export function isAttachmentFileType(value: string): value is AttachmentFileType {
  return ATTACHMENT_FILE_TYPES.includes(value as AttachmentFileType);
}

/**
 * Types of targets for votes and reactions.
 */
export type TargetType = 'post' | 'reply';

/**
 * All valid target types.
 */
export const TARGET_TYPES: readonly TargetType[] = ['post', 'reply'] as const;

/**
 * Type guard for TargetType.
 */
export function isTargetType(value: string): value is TargetType {
  return TARGET_TYPES.includes(value as TargetType);
}

/**
 * Vote types (upvote/downvote).
 */
export type VoteType = 'upvote' | 'downvote';

/**
 * All valid vote types.
 */
export const VOTE_TYPES: readonly VoteType[] = ['upvote', 'downvote'] as const;

/**
 * Type guard for VoteType.
 */
export function isVoteType(value: string): value is VoteType {
  return VOTE_TYPES.includes(value as VoteType);
}

/**
 * Reaction types for posts and replies.
 */
export type ReactionType = 'like' | 'love' | 'insightful' | 'helpful' | 'celebrate';

/**
 * All valid reaction types.
 */
export const REACTION_TYPES: readonly ReactionType[] = [
  'like', 'love', 'insightful', 'helpful', 'celebrate'
] as const;

/**
 * Type guard for ReactionType.
 */
export function isReactionType(value: string): value is ReactionType {
  return REACTION_TYPES.includes(value as ReactionType);
}

/**
 * Counts of each reaction type.
 */
export interface ReactionCounts {
  readonly like: number;
  readonly love: number;
  readonly insightful: number;
  readonly helpful: number;
  readonly celebrate: number;
}

/**
 * Creates empty reaction counts.
 */
export function createEmptyReactionCounts(): ReactionCounts {
  return { like: 0, love: 0, insightful: 0, helpful: 0, celebrate: 0 };
}

/**
 * Badge categories.
 */
export type BadgeCategory = 'participation' | 'quality' | 'milestone' | 'special';

/**
 * All valid badge categories.
 */
export const BADGE_CATEGORIES: readonly BadgeCategory[] = [
  'participation', 'quality', 'milestone', 'special'
] as const;

/**
 * Type guard for BadgeCategory.
 */
export function isBadgeCategory(value: string): value is BadgeCategory {
  return BADGE_CATEGORIES.includes(value as BadgeCategory);
}

/**
 * Badge rarity levels.
 */
export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/**
 * All valid badge rarities.
 */
export const BADGE_RARITIES: readonly BadgeRarity[] = [
  'common', 'uncommon', 'rare', 'epic', 'legendary'
] as const;

/**
 * Type guard for BadgeRarity.
 */
export function isBadgeRarity(value: string): value is BadgeRarity {
  return BADGE_RARITIES.includes(value as BadgeRarity);
}

/**
 * Badge requirement types.
 */
export type BadgeRequirementType =
  | 'posts'
  | 'replies'
  | 'reactions'
  | 'accepted_answers'
  | 'reputation'
  | 'streak'
  | 'onboarding';

/**
 * All valid badge requirement types.
 */
export const BADGE_REQUIREMENT_TYPES: readonly BadgeRequirementType[] = [
  'posts', 'replies', 'reactions', 'accepted_answers', 'reputation', 'streak', 'onboarding'
] as const;

/**
 * Type guard for BadgeRequirementType.
 */
export function isBadgeRequirementType(value: string): value is BadgeRequirementType {
  return BADGE_REQUIREMENT_TYPES.includes(value as BadgeRequirementType);
}

/**
 * Notification types.
 */
export type NotificationType = 'reply' | 'reaction' | 'mention' | 'badge' | 'message' | 'system';

/**
 * All valid notification types.
 */
export const NOTIFICATION_TYPES: readonly NotificationType[] = [
  'reply', 'reaction', 'mention', 'badge', 'message', 'system'
] as const;

/**
 * Type guard for NotificationType.
 */
export function isNotificationType(value: string): value is NotificationType {
  return NOTIFICATION_TYPES.includes(value as NotificationType);
}

/**
 * Message privacy settings.
 */
export type MessageAllowType = 'everyone' | 'connections' | 'none';

/**
 * All valid message allow types.
 */
export const MESSAGE_ALLOW_TYPES: readonly MessageAllowType[] = [
  'everyone', 'connections', 'none'
] as const;

/**
 * Type guard for MessageAllowType.
 */
export function isMessageAllowType(value: string): value is MessageAllowType {
  return MESSAGE_ALLOW_TYPES.includes(value as MessageAllowType);
}

/**
 * UI theme preferences.
 */
export type ThemePreference = 'light' | 'dark' | 'system';

/**
 * All valid theme preferences.
 */
export const THEME_PREFERENCES: readonly ThemePreference[] = [
  'light', 'dark', 'system'
] as const;

/**
 * Type guard for ThemePreference.
 */
export function isThemePreference(value: string): value is ThemePreference {
  return THEME_PREFERENCES.includes(value as ThemePreference);
}

/**
 * Forum/Circle visibility types.
 */
export type ForumType = 'public' | 'private' | 'semi-private';

/**
 * All valid forum types.
 */
export const FORUM_TYPES: readonly ForumType[] = [
  'public', 'private', 'semi-private'
] as const;

/**
 * Type guard for ForumType.
 */
export function isForumType(value: string): value is ForumType {
  return FORUM_TYPES.includes(value as ForumType);
}

/**
 * Forum status.
 */
export type ForumStatus = 'active' | 'archived' | 'draft';

/**
 * All valid forum statuses.
 */
export const FORUM_STATUSES: readonly ForumStatus[] = [
  'active', 'archived', 'draft'
] as const;

/**
 * Type guard for ForumStatus.
 */
export function isForumStatus(value: string): value is ForumStatus {
  return FORUM_STATUSES.includes(value as ForumStatus);
}

/**
 * Join types for forums.
 */
export type JoinType = 'open' | 'request' | 'invite-only';

/**
 * All valid join types.
 */
export const JOIN_TYPES: readonly JoinType[] = [
  'open', 'request', 'invite-only'
] as const;

/**
 * Type guard for JoinType.
 */
export function isJoinType(value: string): value is JoinType {
  return JOIN_TYPES.includes(value as JoinType);
}

/**
 * Join request status.
 */
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected';

/**
 * All valid join request statuses.
 */
export const JOIN_REQUEST_STATUSES: readonly JoinRequestStatus[] = [
  'pending', 'approved', 'rejected'
] as const;

/**
 * Type guard for JoinRequestStatus.
 */
export function isJoinRequestStatus(value: string): value is JoinRequestStatus {
  return JOIN_REQUEST_STATUSES.includes(value as JoinRequestStatus);
}

/**
 * Forum activity levels.
 */
export type ActivityLevel = 'high' | 'medium' | 'low';

/**
 * All valid activity levels.
 */
export const ACTIVITY_LEVELS: readonly ActivityLevel[] = [
  'high', 'medium', 'low'
] as const;

/**
 * Type guard for ActivityLevel.
 */
export function isActivityLevel(value: string): value is ActivityLevel {
  return ACTIVITY_LEVELS.includes(value as ActivityLevel);
}

/**
 * Community space types.
 */
export type SpaceType = 'interest-group' | 'study-group' | 'local-chapter' | 'specialty' | 'custom';

/**
 * All valid space types.
 */
export const SPACE_TYPES: readonly SpaceType[] = [
  'interest-group', 'study-group', 'local-chapter', 'specialty', 'custom'
] as const;

/**
 * Type guard for SpaceType.
 */
export function isSpaceType(value: string): value is SpaceType {
  return SPACE_TYPES.includes(value as SpaceType);
}

/**
 * Space visibility.
 */
export type SpaceVisibility = 'public' | 'private';

/**
 * All valid space visibilities.
 */
export const SPACE_VISIBILITIES: readonly SpaceVisibility[] = [
  'public', 'private'
] as const;

/**
 * Type guard for SpaceVisibility.
 */
export function isSpaceVisibility(value: string): value is SpaceVisibility {
  return SPACE_VISIBILITIES.includes(value as SpaceVisibility);
}

/**
 * Member roles within spaces.
 */
export type MemberRole = 'owner' | 'moderator' | 'member';

/**
 * All valid member roles.
 */
export const MEMBER_ROLES: readonly MemberRole[] = [
  'owner', 'moderator', 'member'
] as const;

/**
 * Type guard for MemberRole.
 */
export function isMemberRole(value: string): value is MemberRole {
  return MEMBER_ROLES.includes(value as MemberRole);
}

/**
 * Resource types within spaces.
 */
export type ResourceType = 'document' | 'link' | 'video' | 'guide' | 'tool';

/**
 * All valid resource types.
 */
export const RESOURCE_TYPES: readonly ResourceType[] = [
  'document', 'link', 'video', 'guide', 'tool'
] as const;

/**
 * Type guard for ResourceType.
 */
export function isResourceType(value: string): value is ResourceType {
  return RESOURCE_TYPES.includes(value as ResourceType);
}

/**
 * Community career stages (differs from circle-taxonomy for community context).
 */
export type CommunityCareerStage =
  | 'practitioner'
  | 'transitioning'
  | 'early-career'
  | 'mid-career'
  | 'senior'
  | 'expert';

/**
 * All valid community career stages.
 */
export const COMMUNITY_CAREER_STAGES: readonly CommunityCareerStage[] = [
  'practitioner', 'transitioning', 'early-career', 'mid-career', 'senior', 'expert'
] as const;

/**
 * Type guard for CommunityCareerStage.
 */
export function isCommunityCareerStage(value: string): value is CommunityCareerStage {
  return COMMUNITY_CAREER_STAGES.includes(value as CommunityCareerStage);
}

/**
 * User goals within the community.
 */
export type CommunityUserGoal =
  | 'networking'
  | 'learning'
  | 'job-seeking'
  | 'mentoring'
  | 'sharing-knowledge';

/**
 * All valid community user goals.
 */
export const COMMUNITY_USER_GOALS: readonly CommunityUserGoal[] = [
  'networking', 'learning', 'job-seeking', 'mentoring', 'sharing-knowledge'
] as const;

/**
 * Type guard for CommunityUserGoal.
 */
export function isCommunityUserGoal(value: string): value is CommunityUserGoal {
  return COMMUNITY_USER_GOALS.includes(value as CommunityUserGoal);
}

/**
 * Activity time of day.
 */
export type ActivityTimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

/**
 * All valid activity times of day.
 */
export const ACTIVITY_TIMES_OF_DAY: readonly ActivityTimeOfDay[] = [
  'morning', 'afternoon', 'evening', 'night'
] as const;

/**
 * Type guard for ActivityTimeOfDay.
 */
export function isActivityTimeOfDay(value: string): value is ActivityTimeOfDay {
  return ACTIVITY_TIMES_OF_DAY.includes(value as ActivityTimeOfDay);
}

/**
 * Company size categories.
 */
export type CompanySize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise';

/**
 * All valid company sizes.
 */
export const COMPANY_SIZES: readonly CompanySize[] = [
  'startup', 'small', 'medium', 'large', 'enterprise'
] as const;

/**
 * Type guard for CompanySize.
 */
export function isCompanySize(value: string): value is CompanySize {
  return COMPANY_SIZES.includes(value as CompanySize);
}

/**
 * Expertise levels.
 */
export type ExpertiseLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/**
 * All valid expertise levels.
 */
export const EXPERTISE_LEVELS: readonly ExpertiseLevel[] = [
  'beginner', 'intermediate', 'advanced', 'expert'
] as const;

/**
 * Type guard for ExpertiseLevel.
 */
export function isExpertiseLevel(value: string): value is ExpertiseLevel {
  return EXPERTISE_LEVELS.includes(value as ExpertiseLevel);
}

/**
 * Analytics period types.
 */
export type AnalyticsPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

/**
 * All valid analytics periods.
 */
export const ANALYTICS_PERIODS: readonly AnalyticsPeriod[] = [
  'day', 'week', 'month', 'quarter', 'year'
] as const;

/**
 * Type guard for AnalyticsPeriod.
 */
export function isAnalyticsPeriod(value: string): value is AnalyticsPeriod {
  return ANALYTICS_PERIODS.includes(value as AnalyticsPeriod);
}

/**
 * Sentiment analysis results.
 */
export type Sentiment = 'positive' | 'neutral' | 'negative' | 'mixed';

/**
 * All valid sentiments.
 */
export const SENTIMENTS: readonly Sentiment[] = [
  'positive', 'neutral', 'negative', 'mixed'
] as const;

/**
 * Type guard for Sentiment.
 */
export function isSentiment(value: string): value is Sentiment {
  return SENTIMENTS.includes(value as Sentiment);
}

/**
 * AI analysis target types.
 */
export type AnalysisTargetType = 'post' | 'user' | 'forum';

/**
 * All valid analysis target types.
 */
export const ANALYSIS_TARGET_TYPES: readonly AnalysisTargetType[] = [
  'post', 'user', 'forum'
] as const;

/**
 * Type guard for AnalysisTargetType.
 */
export function isAnalysisTargetType(value: string): value is AnalysisTargetType {
  return ANALYSIS_TARGET_TYPES.includes(value as AnalysisTargetType);
}

/**
 * Learning styles for onboarding.
 */
export type LearningStyle = 'visual' | 'reading' | 'hands-on' | 'discussion';

/**
 * All valid learning styles.
 */
export const LEARNING_STYLES: readonly LearningStyle[] = [
  'visual', 'reading', 'hands-on', 'discussion'
] as const;

/**
 * Type guard for LearningStyle.
 */
export function isLearningStyle(value: string): value is LearningStyle {
  return LEARNING_STYLES.includes(value as LearningStyle);
}

/**
 * Request form question types.
 */
export type RequestFormQuestionType = 'text' | 'textarea' | 'select' | 'multiselect';

/**
 * All valid request form question types.
 */
export const REQUEST_FORM_QUESTION_TYPES: readonly RequestFormQuestionType[] = [
  'text', 'textarea', 'select', 'multiselect'
] as const;

/**
 * Type guard for RequestFormQuestionType.
 */
export function isRequestFormQuestionType(value: string): value is RequestFormQuestionType {
  return REQUEST_FORM_QUESTION_TYPES.includes(value as RequestFormQuestionType);
}
