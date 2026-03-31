/**
 * Community Profile Types
 *
 * Types for user profiles, preferences, and interest profiling.
 *
 * @module types/community/profiles
 */

import type { CommunityUserId } from './branded-ids';
import type { FlexibleTimestamp } from './timestamps';
import type {
  MessageAllowType,
  ThemePreference,
  CommunityCareerStage,
  CommunityUserGoal,
  ActivityTimeOfDay,
  CompanySize,
  ExpertiseLevel,
  LearningStyle,
} from './enums';
import type { UserReputation, Badge } from './reputation';

// ============================================================================
// USER PREFERENCES
// ============================================================================

/**
 * Email notification settings.
 */
export interface EmailNotificationSettings {
  readonly replies: boolean;
  readonly reactions: boolean;
  readonly mentions: boolean;
  readonly messages: boolean;
  readonly badges: boolean;
}

/**
 * Push notification settings.
 */
export interface PushNotificationSettings {
  readonly replies: boolean;
  readonly reactions: boolean;
  readonly mentions: boolean;
  readonly messages: boolean;
}

/**
 * Privacy settings.
 */
export interface PrivacySettings {
  readonly showEmail: boolean;
  readonly showOnlineStatus: boolean;
  readonly allowMessages: MessageAllowType;
}

/**
 * User Preferences
 *
 * User notification and privacy settings.
 */
export interface UserPreferences {
  readonly emailNotifications: EmailNotificationSettings;
  readonly pushNotifications: PushNotificationSettings;
  readonly privacy: PrivacySettings;
  readonly theme: ThemePreference;
}

// ============================================================================
// USER PROFILE EXTENDED
// ============================================================================

/**
 * User Profile Extended
 *
 * Extended user profile with customization.
 *
 * @remarks
 * Contains full profile data including reputation, badges,
 * and preferences for display on profile pages.
 */
export interface UserProfileExtended {
  readonly userId: CommunityUserId;
  readonly name: string;
  readonly email: string;
  readonly avatar?: string | null;
  readonly bio?: string | null;
  readonly title?: string | null;
  readonly organization?: string | null;
  readonly location?: string | null;
  readonly website?: string | null;
  readonly linkedIn?: string | null;
  readonly twitter?: string | null;
  readonly specialties: readonly string[];
  readonly interests: readonly string[];
  readonly reputation: UserReputation;
  readonly joinedAt: FlexibleTimestamp;
  readonly postCount: number;
  readonly replyCount: number;
  readonly acceptedAnswerCount: number;
  readonly badges: readonly Badge[];
  readonly isOnline: boolean;
  readonly lastSeenAt?: FlexibleTimestamp;
  readonly preferences: UserPreferences;
}

// ============================================================================
// INTEREST PROFILING
// ============================================================================

/**
 * User activity pattern data.
 */
export interface ActivityPattern {
  readonly mostActiveTimeOfDay: ActivityTimeOfDay;
  readonly mostActiveDays: readonly string[];
  readonly avgEngagementPerWeek: number;
}

/**
 * Career context from discovery quiz.
 */
export interface CareerContext {
  readonly currentRole?: string;
  readonly currentIndustry?: string;
  readonly yearsExperience?: number;
  readonly companySize?: CompanySize;
}

/**
 * Professional connections from discovery quiz.
 */
export interface ProfessionalConnections {
  readonly organizations: readonly string[];
  readonly affiliations: readonly string[];
  readonly alumniNetworks: readonly string[];
}

/**
 * Skills profile from discovery quiz.
 */
export interface SkillsProfile {
  readonly currentSkills: readonly string[];
  readonly skillsToLearn: readonly string[];
  readonly strengthAreas: readonly string[];
}

/**
 * Exploration interests from discovery quiz.
 */
export interface ExplorationInterests {
  readonly pathways: readonly string[];
  readonly topics: readonly string[];
  readonly curiosities: readonly string[];
}

/**
 * Interest Area
 *
 * Specific area of interest with confidence level.
 *
 * @remarks
 * Tracked from user engagement patterns with AI-generated
 * confidence scores based on interaction frequency.
 */
export interface InterestArea {
  readonly topic: string;
  readonly confidence: number;
  readonly engagementCount: number;
  readonly firstEngaged: FlexibleTimestamp;
  readonly lastEngaged: FlexibleTimestamp;
}

/**
 * Expertise indicators.
 */
export interface ExpertiseIndicators {
  readonly acceptedAnswers: number;
  readonly helpfulReactions: number;
  readonly postsCreated: number;
  readonly qualityScore: number;
}

/**
 * Expertise Area
 *
 * Area where user has demonstrated expertise.
 *
 * @remarks
 * Calculated from quality metrics of user contributions
 * in specific topic areas.
 */
export interface ExpertiseArea {
  readonly topic: string;
  readonly level: ExpertiseLevel;
  readonly indicators: ExpertiseIndicators;
  readonly earnedAt: FlexibleTimestamp;
}

/**
 * User Interest Profile
 *
 * AI-generated profile of user's interests and expertise.
 *
 * @remarks
 * Built from user activity and discovery quiz responses,
 * used for personalized recommendations and matching.
 */
export interface UserInterestProfile {
  readonly userId: CommunityUserId;
  readonly interests: readonly InterestArea[];
  readonly expertise: readonly ExpertiseArea[];
  readonly careerStage: CommunityCareerStage;
  readonly goals: readonly CommunityUserGoal[];
  readonly topicsEngagedWith: readonly string[];
  readonly preferredCategories: readonly string[];
  readonly activityPattern: ActivityPattern;

  /** Step 1: Career Context */
  readonly careerContext?: CareerContext;

  /** Step 3: Professional Connections */
  readonly professionalConnections?: ProfessionalConnections;

  /** Step 4: Skills & Growth */
  readonly skillsProfile?: SkillsProfile;

  /** Step 5: Goals & Aspirations */
  readonly careerGoals?: readonly string[];

  /** Step 6: Interests & Exploration */
  readonly explorationInterests?: ExplorationInterests;

  /** Whether the enhanced quiz has been completed */
  readonly enhancedQuizCompleted?: boolean;
  readonly enhancedQuizCompletedAt?: FlexibleTimestamp;

  readonly lastAnalyzed: FlexibleTimestamp;
  readonly updatedAt: FlexibleTimestamp;
}

// ============================================================================
// ONBOARDING
// ============================================================================

/**
 * Onboarding quiz responses data.
 */
export interface OnboardingResponses {
  readonly currentRole?: string;
  readonly targetRole?: string;
  readonly experience?: string;
  readonly interests: readonly string[];
  readonly goals: readonly string[];
  readonly preferredTopics: readonly string[];
  readonly learningStyle?: LearningStyle;
}

/**
 * Onboarding Quiz Response
 *
 * User's responses during onboarding.
 *
 * @remarks
 * Used to build initial UserInterestProfile via AI analysis.
 */
export interface OnboardingQuizResponse {
  readonly userId: CommunityUserId;
  readonly responses: OnboardingResponses;
  readonly completedAt: FlexibleTimestamp;
  readonly processed: boolean;
}
