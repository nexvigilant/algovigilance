// ============================================================================
// LEARNING TYPES: Learning Path, Review, Skills & Capability Tracking
// ============================================================================

import { type Timestamp } from 'firebase/firestore';

import type { ProficiencyLevel } from './ids';
import type { CapabilityPathway, PathwayEnrollment } from './core';

// ============================================================================
// LEARNING PATH TYPES
// ============================================================================

/**
 * Learning path grouping multiple courses into a curriculum.
 * Defines prerequisites and skills gained.
 */
export interface LearningPath {
  /** Unique identifier */
  readonly id: string;
  /** Path title */
  readonly title: string;
  /** Path description */
  readonly description: string;

  /** Ordered list of course IDs in this path */
  readonly courseIds: readonly string[];
  /** Prerequisite paths or courses */
  readonly prerequisites?: readonly string[];

  /** Total estimated duration in minutes */
  readonly estimatedDuration: number;
  /** Skills developed by completing this path */
  readonly skillsGained: readonly string[];

  /** When path was created */
  readonly createdAt: Timestamp;
  /** When path was last updated */
  readonly updatedAt: Timestamp;
}

// ============================================================================
// REVIEW TYPES
// ============================================================================

/**
 * User review of a course.
 */
export interface PathwayReview {
  /** Unique identifier */
  readonly id: string;
  /** Course being reviewed */
  readonly courseId: string;
  /** User who wrote the review */
  readonly userId: string;
  /** User's display name */
  readonly userDisplayName: string;

  /** Star rating (1-5) */
  readonly rating: number;
  /** Review comment */
  readonly comment?: string;

  /** When review was created */
  readonly createdAt: Timestamp;
  /** When review was last updated */
  readonly updatedAt?: Timestamp;

  /** Number of users who found this helpful */
  readonly helpfulCount?: number;
}

/**
 * Aggregate rating statistics for a course.
 */
export interface PathwayRatingStats {
  /** Course these stats are for */
  readonly courseId: string;
  /** Average rating (0-5) */
  readonly averageRating: number;
  /** Total number of reviews */
  readonly totalReviews: number;
  /** Distribution of ratings by star count */
  readonly ratingDistribution: {
    readonly 1: number;
    readonly 2: number;
    readonly 3: number;
    readonly 4: number;
    readonly 5: number;
  };
}

/**
 * Pathway with enrollment data for display.
 */
export interface PathwayWithEnrollment extends CapabilityPathway {
  /** User's enrollment if enrolled */
  readonly enrollment?: PathwayEnrollment;
  /** Quick check if user is enrolled */
  readonly isEnrolled: boolean;
}

// ============================================================================
// SKILLS & CAPABILITY TRACKING TYPES
// ============================================================================

/** Skill category for classification */
export type SkillCategory = 'technical' | 'regulatory' | 'clinical' | 'business' | 'soft-skill';

/** How a skill was acquired */
export type SkillAcquisitionSource = 'course' | 'endorsement' | 'self-reported';

/**
 * Skill definition for capability tracking.
 */
export interface Skill {
  /** Unique identifier */
  readonly id: string;
  /** Skill name */
  readonly name: string;
  /** Skill description */
  readonly description: string;
  /** Category for classification */
  readonly category: SkillCategory;

  // Hierarchy
  /** Parent skill ID for nested skill trees */
  readonly parentSkillId?: string;
  /** Child skill IDs */
  readonly subSkills?: readonly string[];

  // Industry alignment
  /** Whether this is a recognized pharmaceutical industry skill */
  readonly industryStandard?: boolean;
  /** Job roles that require this skill */
  readonly associatedRoles?: readonly string[];

  /** When skill was created */
  readonly createdAt: Timestamp;
  /** When skill was last updated */
  readonly updatedAt: Timestamp;
}

/**
 * Mapping of skills developed by a course.
 */
export interface PathwaySkillMapping {
  /** Course ID */
  readonly courseId: string;
  /** Skills developed with proficiency levels */
  readonly skills: readonly {
    readonly skillId: string;
    readonly proficiencyLevel: ProficiencyLevel;
    /** True if this is a primary learning outcome */
    readonly primarySkill: boolean;
  }[];
}

/**
 * User's skill profile tracking all acquired skills.
 */
export interface UserSkillProfile {
  /** User ID */
  readonly userId: string;
  /** All acquired skills */
  readonly skills: readonly {
    readonly skillId: string;
    readonly proficiencyLevel: ProficiencyLevel;
    readonly acquiredFrom: SkillAcquisitionSource;
    /** Course IDs or endorsement IDs that granted this skill */
    readonly sourceIds: readonly string[];
    readonly lastUpdated: Timestamp;
  }[];

  // Goals
  /** Skills user wants to learn */
  readonly targetSkills?: readonly string[];
  /** Target role/career path */
  readonly careerPath?: string;

  /** When profile was last updated */
  readonly updatedAt: Timestamp;
}

/**
 * Analysis of skill gaps for a target role.
 */
export interface SkillGapAnalysis {
  /** User ID */
  readonly userId: string;
  /** Target role being analyzed */
  readonly targetRole: string;
  /** Skills required for the role */
  readonly requiredSkills: readonly string[];
  /** Skills user currently has */
  readonly currentSkills: readonly string[];
  /** Detailed gap analysis */
  readonly skillGaps: readonly {
    readonly skillId: string;
    readonly currentLevel?: ProficiencyLevel;
    readonly requiredLevel: ProficiencyLevel;
    /** Course IDs that teach this skill */
    readonly recommendedCourses: readonly string[];
  }[];
  /** Overall completion percentage (0-100) */
  readonly completionPercentage: number;
  /** Estimated time to close gaps in minutes */
  readonly estimatedLearningTime: number;
}
