// ============================================================================
// PORTFOLIO TYPES: Practice Evidence, Capability Statement, Achievements
// ============================================================================

import { type Timestamp } from 'firebase/firestore';

import type { CapabilityProficiency } from './ids';

// ============================================================================
// CAPABILITY VERIFICATION & PORTFOLIO TYPES
// ============================================================================

/**
 * Practice Evidence - Portfolio entry showing work products created during learning.
 * Emphasizes DOING over CONSUMING (capability over credential).
 */
export interface PracticeEvidence {
  /** Unique identifier */
  readonly id: string;
  /** User who created this evidence */
  readonly userId: string;
  /** Course/pathway this evidence is for */
  readonly pathwayId: string;
  /** Lesson/activity this evidence is for */
  readonly activityId: string;

  // What they created/did
  /** URL to actual work (Google Doc, PDF, etc.) */
  readonly workProduct?: string;
  /** Reflection on what was learned */
  readonly reflectionNote?: string;
  /** How they applied or will apply this learning */
  readonly applicationContext?: string;

  // Verification metrics
  /** Time spent on this activity in hours */
  readonly practiceHours: number;
  /** Competencies demonstrated */
  readonly demonstratedBehaviors: readonly string[];

  /** When evidence was created */
  readonly createdAt: Timestamp;
  /** When evidence was last updated */
  readonly updatedAt?: Timestamp;
}

/**
 * Capability Statement - Enhanced verification document with evidence.
 * Replaces traditional "certificate of completion" with demonstrated capability.
 */
export interface CapabilityStatement {
  /** Unique identifier */
  readonly id: string;
  /** User who earned this statement */
  readonly userId: string;
  /** Course/pathway this statement is for */
  readonly pathwayId: string;

  // Capability framing
  /** Name of the capability (e.g., "Signal Detection Proficiency") */
  readonly capabilityName: string;
  /** Achieved proficiency level */
  readonly proficiencyLevel: CapabilityProficiency;

  // Evidence of capability
  /** List of activities completed */
  readonly demonstratedActivities: readonly string[];
  /** URLs to portfolio evidence */
  readonly workProducts: readonly string[];
  /** Specific competencies demonstrated */
  readonly behaviorsMastered: readonly string[];
  /** Total time spent building this capability in hours */
  readonly practiceHours: number;

  // Verification data (for HR/external use)
  /** Unique verification code (e.g., "NVP-2025-12345") */
  readonly verificationCode: string;
  /** Public verification page URL */
  readonly verificationUrl: string;
  /** When statement was issued */
  readonly issuedAt: Timestamp;
  /** When statement expires (if applicable) */
  readonly expiresAt?: Timestamp;
  /** Whether statement has been revoked */
  readonly isRevoked: boolean;

  // Display metadata
  /** Pathway title for display */
  readonly pathwayTitle?: string;
  /** Pathway description for display */
  readonly pathwayDescription?: string;
}

// ============================================================================
// ACHIEVEMENT TYPES
// ============================================================================

/** Achievement category for grouping */
export type AchievementCategory = 'pathway' | 'assessment' | 'streak' | 'verification';

/** Achievement rarity tier */
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

/**
 * Achievement definition — a milestone practitioners can earn.
 * Achievements are derived from existing data (enrollments, completions, streaks, quiz scores).
 * No separate Firestore collection needed.
 */
export interface Achievement {
  /** Unique achievement identifier (e.g., 'first-enrollment') */
  readonly id: string;
  /** Display title */
  readonly title: string;
  /** Description of how to earn this achievement */
  readonly description: string;
  /** Emoji icon for display */
  readonly icon: string;
  /** Category for filtering */
  readonly category: AchievementCategory;
  /** Rarity tier affecting visual treatment */
  readonly rarity: AchievementRarity;
  /** Whether the practitioner has earned this */
  readonly earned: boolean;
  /** When earned (ISO string), undefined if not earned */
  readonly earnedAt?: string;
  /** Progress toward earning (0-100), only for progressive achievements */
  readonly progress?: number;
  /** Target value for progressive achievements */
  readonly target?: number;
  /** Current value for progressive achievements */
  readonly current?: number;
}

/**
 * Achievement summary for dashboard display.
 */
export interface AchievementSummary {
  /** Total achievements available */
  readonly total: number;
  /** Achievements earned */
  readonly earned: number;
  /** All achievement details */
  readonly achievements: readonly Achievement[];
  /** Most recently earned achievement (for toast notification) */
  readonly latest?: Achievement;
}
