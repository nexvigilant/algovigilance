/**
 * Atomic Learning Object (ALO) Types
 *
 * ALOs are the fundamental unit of learning in the academy.
 * Each ALO follows a 5-10 minute structure:
 *   - Hook (30s): "Why this matters NOW"
 *   - Concept (2min): High-density information
 *   - Activity (5min): Authentic work simulation
 *   - Reflection (30s): Portfolio integration
 *
 * @see docs/pdc/PDC-V41-SUMMARY.md for full framework details
 */

import { type Timestamp } from 'firebase/firestore';

// Re-export individual ALO sections from pv-curriculum
export type {
  KSBHook,
  KSBConcept,
  KSBExample,
  KSBResource,
  KSBActivity,
  KSBReflection,
  PortfolioArtifactConfig,
  KSBActivityMetadata,
} from './pv-curriculum/activity-engines/base';

// Re-export activity engine configs
export type {
  RedPenConfig,
  RedPenError,
  TriageConfig,
  TriageDecision,
  TriageOption,
  BranchCondition,
  SynthesisConfig,
  SynthesisConstraint,
  SynthesisEvaluationCriterion,
  CodePlaygroundConfig,
  CodeTestCase,
  CodeHint,
} from './pv-curriculum/activity-engines/configs';

export type {
  CalculatorConfig,
  CalculatorDataTable,
  CalculatorDataRow,
  CalculatorTask,
  CalculatorInterpretationOption,
  // Note: CalculatorResult is defined locally as part of the EngineResult discriminated union
  CalculatorTaskResult,
  CalculationType,
} from './pv-curriculum/activity-engines/calculator';

export type {
  TimelineConfig,
  TimelineEvent,
  TimelineEventType,
  TimelineTask,
  TimelineTaskType,
  DeadlineType,
  RegulationReference,
  DeadlineRule,
  // Note: TimelineResult is defined locally as part of the EngineResult discriminated union
  TimelineTaskResult,
} from './pv-curriculum/activity-engines/timeline';

// ============================================================================
// BRANDED ID TYPES
// ============================================================================

/** Branded string type for ALO IDs */
export type ALOId = string & { readonly __brand: 'ALOId' };

/** Branded string type for ALO Completion IDs */
export type ALOCompletionId = string & { readonly __brand: 'ALOCompletionId' };

/** Branded string type for KSB IDs */
export type KSBId = string & { readonly __brand: 'KSBId' };

/** Branded string type for Domain IDs */
export type DomainId = string & { readonly __brand: 'DomainId' };

/** Branded string type for User IDs */
export type UserId = string & { readonly __brand: 'UserId' };

/** Branded string type for Portfolio Artifact IDs */
export type PortfolioArtifactId = string & { readonly __brand: 'PortfolioArtifactId' };

// ============================================================================
// SERIALIZATION TYPES
// ============================================================================

/**
 * Serialized representation of a Firestore Timestamp.
 * Used when returning data from server actions to clients.
 */
export interface SerializedTimestamp {
  readonly seconds: number;
  readonly nanoseconds: number;
}

// ============================================================================
// STATUS & LEVEL TYPES
// ============================================================================

/**
 * ALO content workflow status.
 */
export type ALOStatus =
  | 'draft' // Initial creation
  | 'generating' // AI content generation in progress
  | 'review' // Content complete, pending review
  | 'published' // Live and available to learners
  | 'archived'; // Deprecated/hidden

/**
 * Type guard for ALOStatus.
 */
export function isALOStatus(value: string): value is ALOStatus {
  const statuses: readonly ALOStatus[] = ['draft', 'generating', 'review', 'published', 'archived'];
  return statuses.includes(value as ALOStatus);
}

/**
 * Proficiency target levels (L1-L5 from PDC framework).
 */
export type ProficiencyLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Difficulty categories for ALO catalog.
 */
export type ALODifficulty = 'foundational' | 'intermediate' | 'advanced';

// ============================================================================
// UNIFIED ALO TYPE
// ============================================================================

import type {
  KSBHook,
  KSBConcept,
  KSBActivity,
  KSBReflection,
  KSBActivityMetadata,
} from './pv-curriculum/activity-engines/base';

/**
 * Atomic Learning Object - Complete learning unit.
 *
 * Represents a single, self-contained learning experience
 * that can be completed in 5-10 minutes.
 *
 * @remarks
 * ALOs are the atomic unit of the capability-based learning model.
 * Each ALO maps to a specific KSB (Knowledge, Skill, or Behavior)
 * and includes four sections that follow a consistent pedagogical pattern.
 */
export interface ALO {
  /** Unique identifier */
  readonly id: string;

  /** Associated KSB ID */
  readonly ksbId: string;

  /** Associated domain ID */
  readonly domainId: string;

  /** Target proficiency level (L1-L5) */
  readonly targetLevel: ProficiencyLevel;

  /** Human-readable title */
  readonly title: string;

  /** Brief description for catalog display */
  readonly description: string;

  /** 30-second engagement hook */
  readonly hook: KSBHook;

  /** 2-minute core concept */
  readonly concept: KSBConcept;

  /** 5-minute practice activity */
  readonly activity: KSBActivity;

  /** 30-second reflection and portfolio capture */
  readonly reflection: KSBReflection;

  /** Learning metadata */
  readonly metadata: KSBActivityMetadata;

  /** Content status */
  readonly status: ALOStatus;

  /** Timestamps */
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly publishedAt?: Timestamp;
}

/**
 * Serialized ALO for server action returns.
 */
export interface ALOSerialized extends Omit<ALO, 'createdAt' | 'updatedAt' | 'publishedAt'> {
  readonly createdAt: SerializedTimestamp;
  readonly updatedAt: SerializedTimestamp;
  readonly publishedAt?: SerializedTimestamp;
}

// ============================================================================
// COMPLETION TRACKING
// ============================================================================

/**
 * Section completion tracking for an ALO.
 */
export interface ALOSectionCompletion {
  readonly hook: boolean;
  readonly concept: boolean;
  readonly activity: boolean;
  readonly reflection: boolean;
}

/**
 * Activity engine result stored with completion.
 */
export interface ALOActivityResult {
  /** Engine type that was used */
  readonly engineType: ActivityEngineType;
  /** Score achieved (0-100) */
  readonly score?: number;
  /** Whether the activity was passed */
  readonly passed: boolean;
  /** Time spent on activity in seconds */
  readonly timeSpentSeconds: number;
  /** Number of attempts made */
  readonly attempts: number;
  /** Feedback provided */
  readonly feedback?: string;
}

/**
 * ALO completion record for a user.
 *
 * @remarks
 * Tracks a user's progress through an ALO, including
 * which sections are complete, activity results, and
 * any portfolio artifacts generated.
 */
export interface ALOCompletion {
  /** Unique completion ID */
  readonly id: string;

  /** User ID */
  readonly userId: string;

  /** ALO ID */
  readonly aloId: string;

  /** KSB ID */
  readonly ksbId: string;

  /** Sections completed */
  readonly sectionsCompleted: ALOSectionCompletion;

  /** Activity engine results */
  readonly activityResult?: ALOActivityResult;

  /** Reflection artifact (if captured) */
  readonly portfolioArtifactId?: string;

  /** Overall completion status */
  readonly completed: boolean;
  readonly completedAt?: Timestamp;

  /** Timestamps */
  readonly startedAt: Timestamp;
  readonly lastActivityAt: Timestamp;
}

/**
 * Serialized ALOCompletion for server action returns.
 */
export interface ALOCompletionSerialized extends Omit<ALOCompletion, 'completedAt' | 'startedAt' | 'lastActivityAt'> {
  readonly completedAt?: SerializedTimestamp;
  readonly startedAt: SerializedTimestamp;
  readonly lastActivityAt: SerializedTimestamp;
}

// ============================================================================
// DASHBOARD & CATALOG TYPES
// ============================================================================

/**
 * ALO progress summary for dashboard display.
 */
export interface ALOProgressSummary {
  /** Total ALOs available */
  readonly totalALOs: number;

  /** ALOs completed */
  readonly completedALOs: number;

  /** ALOs in progress */
  readonly inProgressALOs: number;

  /** Completion percentage (0-100) */
  readonly completionRate: number;

  /** Time spent in minutes */
  readonly totalTimeSpent: number;

  /** Average score on activities (0-100) */
  readonly averageActivityScore: number;

  /** Portfolio artifacts generated */
  readonly portfolioArtifactsGenerated: number;
}

/**
 * ALO catalog item for listing/search.
 */
export interface ALOCatalogItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly ksbId: string;
  readonly domainId: string;
  readonly domainName: string;
  readonly targetLevel: ProficiencyLevel;
  readonly estimatedMinutes: number;
  readonly difficulty: ALODifficulty;
  readonly engineType: ActivityEngineType;
  readonly tags: readonly string[];
  readonly status: ALOStatus;
}

// ============================================================================
// ACTIVITY ENGINE TYPES
// ============================================================================

/**
 * All supported activity engine types.
 */
export type ActivityEngineType =
  | 'red_pen'
  | 'triage'
  | 'synthesis'
  | 'calculator'
  | 'timeline'
  | 'code_playground';

/**
 * Type guard for ActivityEngineType.
 */
export function isActivityEngineType(value: string): value is ActivityEngineType {
  const types: readonly ActivityEngineType[] = [
    'red_pen', 'triage', 'synthesis', 'calculator', 'timeline', 'code_playground'
  ];
  return types.includes(value as ActivityEngineType);
}

/**
 * Base activity engine result (generic).
 *
 * @remarks
 * Extended by specific engine result types for type-safe
 * access to engine-specific data.
 */
export interface ActivityEngineResult {
  /** Engine type that produced this result */
  readonly engineType: ActivityEngineType;
  /** Whether the activity was passed */
  readonly passed: boolean;
  /** Score achieved (0-100) */
  readonly score?: number;
  /** Time spent in seconds */
  readonly timeSpentSeconds: number;
  /** Number of attempts made */
  readonly attempts: number;
  /** Feedback text */
  readonly feedback?: string;
}

// ============================================================================
// ENGINE-SPECIFIC RESULTS (Discriminated Union)
// ============================================================================

/**
 * Red Pen engine result - Error detection activity.
 */
export interface RedPenResult extends ActivityEngineResult {
  readonly engineType: 'red_pen';
  readonly data: {
    readonly errorsFound: number;
    readonly errorsTotal: number;
    readonly correctIdentifications: readonly string[];
    readonly missedErrors: readonly string[];
    readonly falsePositives: readonly string[];
  };
}

/**
 * Triage engine result - Classification activity.
 */
export interface TriageResult extends ActivityEngineResult {
  readonly engineType: 'triage';
  readonly data: {
    readonly itemsTriaged: number;
    readonly correctClassifications: number;
    readonly categoryBreakdown: Readonly<Record<string, number>>;
  };
}

/**
 * Synthesis engine result - Creative work product activity.
 */
export interface SynthesisResult extends ActivityEngineResult {
  readonly engineType: 'synthesis';
  readonly data: {
    readonly rubricScores: Readonly<Record<string, number>>;
    readonly aiEvaluation?: string;
    /** User's created work product */
    readonly artifact: string;
  };
}

/**
 * Calculator engine result - Quantitative calculation activity.
 */
export interface CalculatorResult extends ActivityEngineResult {
  readonly engineType: 'calculator';
  readonly data: {
    readonly inputValues: Readonly<Record<string, number>>;
    readonly calculatedValues: Readonly<Record<string, number>>;
    readonly validationResults: Readonly<Record<string, boolean>>;
  };
}

/**
 * Timeline engine result - Temporal sequencing activity.
 */
export interface TimelineResult extends ActivityEngineResult {
  readonly engineType: 'timeline';
  readonly data: {
    readonly eventsPlaced: number;
    readonly correctPlacements: number;
    /** Accuracy of sequence ordering (0-1) */
    readonly sequenceAccuracy: number;
  };
}

/**
 * Code playground engine result - Code execution activity.
 */
export interface CodePlaygroundResult extends ActivityEngineResult {
  readonly engineType: 'code_playground';
  readonly data: {
    readonly testsPassed: number;
    readonly testsTotal: number;
    /** User's submitted code */
    readonly code: string;
    /** Execution output */
    readonly output?: string;
    /** Compilation/runtime errors */
    readonly errors?: readonly string[];
  };
}

/**
 * Union of all engine-specific results.
 * Use type guards to narrow to specific engine type.
 */
export type EngineResult =
  | RedPenResult
  | TriageResult
  | SynthesisResult
  | CalculatorResult
  | TimelineResult
  | CodePlaygroundResult;

// Type Guards for Engine Results
/**
 * Type guard for RedPenResult.
 */
export function isRedPenResult(result: EngineResult): result is RedPenResult {
  return result.engineType === 'red_pen';
}

/**
 * Type guard for TriageResult.
 */
export function isTriageResult(result: EngineResult): result is TriageResult {
  return result.engineType === 'triage';
}

/**
 * Type guard for SynthesisResult.
 */
export function isSynthesisResult(result: EngineResult): result is SynthesisResult {
  return result.engineType === 'synthesis';
}

/**
 * Type guard for CalculatorResult.
 */
export function isCalculatorResult(result: EngineResult): result is CalculatorResult {
  return result.engineType === 'calculator';
}

/**
 * Type guard for TimelineResult.
 */
export function isTimelineResult(result: EngineResult): result is TimelineResult {
  return result.engineType === 'timeline';
}

/**
 * Type guard for CodePlaygroundResult.
 */
export function isCodePlaygroundResult(result: EngineResult): result is CodePlaygroundResult {
  return result.engineType === 'code_playground';
}
