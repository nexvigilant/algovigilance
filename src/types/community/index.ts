/**
 * Community Types - Barrel Export
 *
 * Re-exports all community types for backward compatibility.
 * Import from '@/types/community' to get all types.
 *
 * @module types/community
 */

// ============================================================================
// BRANDED ID TYPES
// ============================================================================
export type {
  PostId,
  ReplyId,
  ForumId,
  SpaceId,
  BadgeId,
  NotificationId,
  ConversationId,
  MessageId,
  VoteId,
  ReactionId,
  AttachmentId,
  ResourceId,
  EventId,
  JoinRequestId,
  CommunityUserId,
} from './branded-ids';

// ============================================================================
// TIMESTAMP TYPES
// ============================================================================
export type { SerializedTimestamp, FlexibleTimestamp } from './timestamps';

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================
export type {
  PostCategory,
  AttachmentFileType,
  TargetType,
  VoteType,
  ReactionType,
  ReactionCounts,
  BadgeCategory,
  BadgeRarity,
  BadgeRequirementType,
  NotificationType,
  MessageAllowType,
  ThemePreference,
  ForumType,
  ForumStatus,
  JoinType,
  JoinRequestStatus,
  ActivityLevel,
  SpaceType,
  SpaceVisibility,
  MemberRole,
  ResourceType,
  CommunityCareerStage,
  CommunityUserGoal,
  ActivityTimeOfDay,
  CompanySize,
  ExpertiseLevel,
  AnalyticsPeriod,
  Sentiment,
  AnalysisTargetType,
  LearningStyle,
  RequestFormQuestionType,
} from './enums';

export {
  POST_CATEGORIES,
  isPostCategory,
  ATTACHMENT_FILE_TYPES,
  isAttachmentFileType,
  TARGET_TYPES,
  isTargetType,
  VOTE_TYPES,
  isVoteType,
  REACTION_TYPES,
  isReactionType,
  createEmptyReactionCounts,
  BADGE_CATEGORIES,
  isBadgeCategory,
  BADGE_RARITIES,
  isBadgeRarity,
  BADGE_REQUIREMENT_TYPES,
  isBadgeRequirementType,
  NOTIFICATION_TYPES,
  isNotificationType,
  MESSAGE_ALLOW_TYPES,
  isMessageAllowType,
  THEME_PREFERENCES,
  isThemePreference,
  FORUM_TYPES,
  isForumType,
  FORUM_STATUSES,
  isForumStatus,
  JOIN_TYPES,
  isJoinType,
  JOIN_REQUEST_STATUSES,
  isJoinRequestStatus,
  ACTIVITY_LEVELS,
  isActivityLevel,
  SPACE_TYPES,
  isSpaceType,
  SPACE_VISIBILITIES,
  isSpaceVisibility,
  MEMBER_ROLES,
  isMemberRole,
  RESOURCE_TYPES,
  isResourceType,
  COMMUNITY_CAREER_STAGES,
  isCommunityCareerStage,
  COMMUNITY_USER_GOALS,
  isCommunityUserGoal,
  ACTIVITY_TIMES_OF_DAY,
  isActivityTimeOfDay,
  COMPANY_SIZES,
  isCompanySize,
  EXPERTISE_LEVELS,
  isExpertiseLevel,
  ANALYTICS_PERIODS,
  isAnalyticsPeriod,
  SENTIMENTS,
  isSentiment,
  ANALYSIS_TARGET_TYPES,
  isAnalysisTargetType,
  LEARNING_STYLES,
  isLearningStyle,
  REQUEST_FORM_QUESTION_TYPES,
  isRequestFormQuestionType,
} from './enums';

// ============================================================================
// POST TYPES
// ============================================================================
export type {
  PostAttachment,
  CommunityPost,
  Reply,
  ForumCategory,
  Vote,
  Reaction,
  PostSearchResult,
} from './posts';

// ============================================================================
// REPUTATION TYPES
// ============================================================================
export type {
  BadgeRequirement,
  Achievement,
  UserReputation,
  Badge,
} from './reputation';

// ============================================================================
// MESSAGING TYPES
// ============================================================================
export type {
  NotificationMetadata,
  Notification,
  DirectMessage,
  ParticipantNames,
  ParticipantAvatars,
  UnreadCountByUser,
  Conversation,
} from './messaging';

// ============================================================================
// PROFILE TYPES
// ============================================================================
export type {
  EmailNotificationSettings,
  PushNotificationSettings,
  PrivacySettings,
  UserPreferences,
  UserProfileExtended,
  ActivityPattern,
  CareerContext,
  ProfessionalConnections,
  SkillsProfile,
  ExplorationInterests,
  InterestArea,
  ExpertiseIndicators,
  ExpertiseArea,
  UserInterestProfile,
  OnboardingResponses,
  OnboardingQuizResponse,
} from './profiles';

// ============================================================================
// FORUM TYPES
// ============================================================================
export type {
  ForumIntelligence,
  RequestFormQuestion,
  RequestFormConfig,
  ForumMembership,
  ForumStats,
  ForumMetadata,
  SmartForum,
  JoinRequestAnswer,
  JoinRequest,
  SpaceMemberRoles,
  SpaceMembership,
  SpaceSettings,
  SpaceResource,
  SpaceEvent,
  CommunitySpace,
} from './forums';

// ============================================================================
// RECOMMENDATION TYPES
// ============================================================================
export type {
  ForumRecommendation,
  ConnectionRecommendation,
  PostRecommendation,
  UserRecommendation,
} from './recommendations';

// ============================================================================
// ANALYTICS TYPES
// ============================================================================
export type {
  EngagementMetrics,
  GrowthMetrics,
  QualityMetrics,
  TrendingData,
  ForumAnalytics,
  ContentAnalysis,
  AnalysisRecommendations,
  AIAnalysisResult,
} from './analytics';

// ============================================================================
// MARKETPLACE & PRPAAS TYPES
// ============================================================================
export type {
  ExpertiseCategory,
  ExpertAvailability,
  EngagementType,
  ExpertProfile,
  ExpertListing,
  ExpertEngagement,
  CaseStudyCategory,
  CaseStudy,
  BenchmarkDimension,
  BenchmarkDataPoint,
  BenchmarkReport,
  PlatformPostMetadata,
} from './marketplace';

export {
  EXPERTISE_CATEGORIES,
  CASE_STUDY_CATEGORIES,
  BENCHMARK_DIMENSIONS,
} from './marketplace';
