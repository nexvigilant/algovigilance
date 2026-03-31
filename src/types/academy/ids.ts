// ============================================================================
// BRANDED ID TYPES
// ============================================================================
// Branded types prevent accidentally mixing up IDs at compile time.
// Example: passing a PathwayId where a UserId is expected will fail type checking.

/** Branded string type for User IDs */
export type UserId = string & { readonly __brand: 'UserId' };

/** Branded string type for Course IDs */
export type PathwayId = string & { readonly __brand: 'PathwayId' };

/** Branded string type for Lesson IDs */
export type ActivityId = string & { readonly __brand: 'ActivityId' };

/** Branded string type for Module IDs */
export type StageId = string & { readonly __brand: 'StageId' };

/** Branded string type for Enrollment IDs */
export type PathwayEnrollmentId = string & { readonly __brand: 'PathwayEnrollmentId' };

/** Branded string type for Certificate IDs */
export type VerificationId = string & { readonly __brand: 'VerificationId' };

/** Branded string type for Skill IDs */
export type SkillId = string & { readonly __brand: 'SkillId' };

/**
 * Helper to create a branded ID from a string.
 * Use when reading IDs from external sources (Firestore, API, etc.)
 * @example const userId = brandId<UserId>('abc123');
 */
export function brandId<T extends string>(id: string): T {
  return id as T;
}

// ============================================================================
// PROFICIENCY LEVELS
// ============================================================================

/**
 * Proficiency levels for skill assessment.
 * Used across courses, enrollments, and capability statements.
 */
export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/**
 * Capability-focused proficiency levels.
 * More nuanced than traditional difficulty levels.
 */
export type CapabilityProficiency = 'foundational' | 'proficient' | 'advanced' | 'master';

/**
 * Skill level for analytics and user profiles.
 */
export type SkillLevel = 'novice' | 'intermediate' | 'advanced' | 'expert';
