// ============================================================================
// EPA PATHWAY — BRANDED IDs, TIMESTAMPS, ENUMS, CONSTANTS, LABELS
// ============================================================================

import type { Timestamp } from 'firebase/firestore';

// ============================================================================
// BRANDED ID TYPES
// ============================================================================

/** Branded string type for EPA IDs (EPA-01, EPA-02, etc.) */
export type EPAId = string & { readonly __brand: 'EPAId' };

/** Branded string type for Domain IDs (D01, D02, etc.) */
export type DomainId = string & { readonly __brand: 'DomainId' };

/** Branded string type for CPA IDs */
export type CPAId = string & { readonly __brand: 'CPAId' };

/** Branded string type for KSB IDs */
export type KSBId = string & { readonly __brand: 'KSBId' };

/** Branded string type for Verification IDs */
export type VerificationId = string & { readonly __brand: 'VerificationId' };

/** @deprecated Use `VerificationId` instead */
export type CertificateId = VerificationId;

/** Branded string type for Portfolio Artifact IDs */
export type PortfolioArtifactId = string & { readonly __brand: 'PortfolioArtifactId' };

/** Branded string type for User IDs in EPA context */
export type EPAUserId = string & { readonly __brand: 'EPAUserId' };

// ============================================================================
// TIMESTAMP TYPES
// ============================================================================

/**
 * Flexible timestamp type supporting multiple formats.
 * Handles Firestore Timestamp, serialized form, Date, and ISO strings.
 *
 * @remarks
 * Use this for fields that may be serialized across server/client boundary.
 */
export type FlexibleTimestamp =
  | Timestamp
  | { seconds: number; nanoseconds: number }
  | Date
  | string;

/**
 * Legacy timestamp alias for backward compatibility.
 * @deprecated Use FlexibleTimestamp instead
 */
export type FirestoreTimestamp = FlexibleTimestamp;

// ============================================================================
// CORE EPA ENUMS
// ============================================================================

/**
 * EPA Tier classification.
 * - Core: EPA 1-10 (Foundation to Professional Practice)
 * - Executive: EPA 11-20 (Leadership and Transformation)
 * - Network: EPA 21 (Network Intelligence - Advanced)
 */
export type EPATier = 'Core' | 'Executive' | 'Network';

/** All valid EPA tiers. */
export const EPA_TIERS: readonly EPATier[] = ['Core', 'Executive', 'Network'] as const;

/** Type guard for EPATier. */
export function isEPATier(value: string): value is EPATier {
  return EPA_TIERS.includes(value as EPATier);
}

/** EPA Status for publishing workflow. */
export type EPAStatus = 'draft' | 'review' | 'published' | 'archived';

/** All valid EPA statuses. */
export const EPA_STATUSES: readonly EPAStatus[] = [
  'draft', 'review', 'published', 'archived'
] as const;

/** Type guard for EPAStatus. */
export function isEPAStatus(value: string): value is EPAStatus {
  return EPA_STATUSES.includes(value as EPAStatus);
}

/**
 * Proficiency Levels (L1-L5+).
 * Maps to entrustment/supervision requirements.
 */
export type ProficiencyLevel = 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L5+';

/** All valid proficiency levels in progression order. */
export const PROFICIENCY_LEVELS: readonly ProficiencyLevel[] = [
  'L1', 'L2', 'L3', 'L4', 'L5', 'L5+'
] as const;

/** Type guard for ProficiencyLevel. */
export function isProficiencyLevel(value: string): value is ProficiencyLevel {
  return PROFICIENCY_LEVELS.includes(value as ProficiencyLevel);
}

/**
 * Entrustment Level descriptions.
 * Defines supervision requirements at each level.
 */
export type EntrustmentLevel =
  | 'observation'      // L1: Can observe only
  | 'direct'           // L2: Direct supervision required
  | 'indirect'         // L3: Indirect supervision (available if needed)
  | 'remote'           // L4: Remote/retrospective supervision
  | 'independent'      // L5: Independent practice
  | 'supervisor';      // L5+: Can supervise others

/** All valid entrustment levels in progression order. */
export const ENTRUSTMENT_LEVELS: readonly EntrustmentLevel[] = [
  'observation', 'direct', 'indirect', 'remote', 'independent', 'supervisor'
] as const;

/** Type guard for EntrustmentLevel. */
export function isEntrustmentLevel(value: string): value is EntrustmentLevel {
  return ENTRUSTMENT_LEVELS.includes(value as EntrustmentLevel);
}

/** Progress status for an EPA enrollment. */
export type EPAProgressStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'certified';

/** All valid EPA progress statuses. */
export const EPA_PROGRESS_STATUSES: readonly EPAProgressStatus[] = [
  'not_started', 'in_progress', 'completed', 'certified'
] as const;

/** Type guard for EPAProgressStatus. */
export function isEPAProgressStatus(value: string): value is EPAProgressStatus {
  return EPA_PROGRESS_STATUSES.includes(value as EPAProgressStatus);
}

/** Activity types for KSB completion. */
export type ActivityType = 'red_pen' | 'triage' | 'synthesis' | 'assessment';

/** All valid activity types. */
export const ACTIVITY_TYPES: readonly ActivityType[] = [
  'red_pen', 'triage', 'synthesis', 'assessment'
] as const;

/** Type guard for ActivityType. */
export function isActivityType(value: string): value is ActivityType {
  return ACTIVITY_TYPES.includes(value as ActivityType);
}

/** Difficulty level for pathways. */
export type PathwayDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/** All valid pathway difficulties. */
export const PATHWAY_DIFFICULTIES: readonly PathwayDifficulty[] = [
  'beginner', 'intermediate', 'advanced', 'expert'
] as const;

/** Type guard for PathwayDifficulty. */
export function isPathwayDifficulty(value: string): value is PathwayDifficulty {
  return PATHWAY_DIFFICULTIES.includes(value as PathwayDifficulty);
}

/** Source of EPA enrollment. */
export type EnrollmentSource = 'catalog' | 'recommendation' | 'admin_assigned';

/** All valid enrollment sources. */
export const ENROLLMENT_SOURCES: readonly EnrollmentSource[] = [
  'catalog', 'recommendation', 'admin_assigned'
] as const;

/** Type guard for EnrollmentSource. */
export function isEnrollmentSource(value: string): value is EnrollmentSource {
  return ENROLLMENT_SOURCES.includes(value as EnrollmentSource);
}

// ============================================================================
// LEVEL MAPPINGS & LABELS
// ============================================================================

/** Mapping between Proficiency and Entrustment levels. */
export const PROFICIENCY_ENTRUSTMENT_MAP: Readonly<Record<ProficiencyLevel, EntrustmentLevel>> = {
  'L1': 'observation',
  'L2': 'direct',
  'L3': 'indirect',
  'L4': 'remote',
  'L5': 'independent',
  'L5+': 'supervisor',
} as const;

/** Human-readable labels for proficiency levels. */
export const PROFICIENCY_LABELS: Readonly<Record<ProficiencyLevel, string>> = {
  'L1': 'Foundational',
  'L2': 'Developing',
  'L3': 'Competent',
  'L4': 'Proficient',
  'L5': 'Expert',
  'L5+': 'Thought Leader',
} as const;

/** Human-readable descriptions for entrustment levels. */
export const ENTRUSTMENT_DESCRIPTIONS: Readonly<Record<EntrustmentLevel, string>> = {
  'observation': 'Observation Only - Cannot perform independently',
  'direct': 'Direct Supervision - Supervisor present during activity',
  'indirect': 'Indirect Supervision - Supervisor available if needed',
  'remote': 'Remote Supervision - Retrospective review only',
  'independent': 'Independent Practice - Full autonomy',
  'supervisor': 'Can Supervise Others - Teaching capability',
} as const;

/** Human-readable labels for activity types. */
export const ACTIVITY_TYPE_LABELS: Readonly<Record<ActivityType, string>> = {
  'red_pen': 'Red Pen Review',
  'triage': 'Triage Exercise',
  'synthesis': 'Synthesis Activity',
  'assessment': 'Formal Assessment',
} as const;

/** Human-readable labels for pathway difficulties. */
export const DIFFICULTY_LABELS: Readonly<Record<PathwayDifficulty, string>> = {
  'beginner': 'Beginner',
  'intermediate': 'Intermediate',
  'advanced': 'Advanced',
  'expert': 'Expert',
} as const;
