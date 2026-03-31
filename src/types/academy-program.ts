/**
 * Academy Program Types
 *
 * Type definitions for structured multi-module programs in the Academy.
 * Programs wrap EPA pathways, KSBs, and assessments into sequenced
 * rotation experiences (e.g., APPE, IPPE, fellowship tracks).
 *
 * A Program is one level ABOVE individual EPAs:
 *   Program → Module → Activity → EPA/KSB references
 *
 * @remarks
 * Programs provide the sequencing, prerequisite gating, and milestone
 * tracking that individual EPA pathways lack. An EPA defines WHAT a
 * professional should do; a Program defines HOW to get there through
 * a structured rotation.
 *
 * Reference: APPE Program Definition Implementation Guide
 */

import type {
  FlexibleTimestamp,
  EPAId,
  KSBId,
  DomainId,
  ProficiencyLevel,
} from "./epa-pathway";

// ============================================================================
// BRANDED ID TYPES
// ============================================================================

/** Branded string type for Program IDs (e.g., "PROG-APPE-PV-2026") */
export type ProgramId = string & { readonly __brand: "ProgramId" };

/** Branded string type for Module IDs (e.g., "MOD-APPE-01") */
export type ModuleId = string & { readonly __brand: "ModuleId" };

/** Branded string type for Program Enrollment IDs */
export type ProgramEnrollmentId = string & {
  readonly __brand: "ProgramEnrollmentId";
};

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

/**
 * Program type classification.
 * - appe: Advanced Pharmacy Practice Experience (6-week rotation)
 * - ippe: Introductory Pharmacy Practice Experience
 * - fellowship: Extended post-graduate training
 * - certificate: Short-form professional development
 */
export type ProgramType = "appe" | "ippe" | "fellowship" | "certificate";

export const PROGRAM_TYPES: readonly ProgramType[] = [
  "appe",
  "ippe",
  "fellowship",
  "certificate",
] as const;

export function isProgramType(value: string): value is ProgramType {
  return PROGRAM_TYPES.includes(value as ProgramType);
}

/**
 * Program status for publishing workflow.
 */
export type ProgramStatus = "draft" | "review" | "published" | "archived";

export const PROGRAM_STATUSES: readonly ProgramStatus[] = [
  "draft",
  "review",
  "published",
  "archived",
] as const;

export function isProgramStatus(value: string): value is ProgramStatus {
  return PROGRAM_STATUSES.includes(value as ProgramStatus);
}

/**
 * Module status within a program enrollment.
 */
export type ModuleStatus = "locked" | "available" | "in_progress" | "completed";

export const MODULE_STATUSES: readonly ModuleStatus[] = [
  "locked",
  "available",
  "in_progress",
  "completed",
] as const;

export function isModuleStatus(value: string): value is ModuleStatus {
  return MODULE_STATUSES.includes(value as ModuleStatus);
}

/**
 * Program enrollment status.
 */
export type ProgramEnrollmentStatus =
  | "applied"
  | "accepted"
  | "active"
  | "on_hold"
  | "completed"
  | "withdrawn";

export const PROGRAM_ENROLLMENT_STATUSES: readonly ProgramEnrollmentStatus[] = [
  "applied",
  "accepted",
  "active",
  "on_hold",
  "completed",
  "withdrawn",
] as const;

export function isProgramEnrollmentStatus(
  value: string,
): value is ProgramEnrollmentStatus {
  return PROGRAM_ENROLLMENT_STATUSES.includes(value as ProgramEnrollmentStatus);
}

/**
 * Assessment method types available in program modules.
 */
export type AssessmentMethod =
  | "quiz"
  | "case_study"
  | "presentation"
  | "written_report"
  | "portfolio_artifact"
  | "preceptor_evaluation"
  | "peer_review"
  | "self_reflection";

export const ASSESSMENT_METHODS: readonly AssessmentMethod[] = [
  "quiz",
  "case_study",
  "presentation",
  "written_report",
  "portfolio_artifact",
  "preceptor_evaluation",
  "peer_review",
  "self_reflection",
] as const;

export function isAssessmentMethod(value: string): value is AssessmentMethod {
  return ASSESSMENT_METHODS.includes(value as AssessmentMethod);
}

// ============================================================================
// LABELS
// ============================================================================

export const PROGRAM_TYPE_LABELS: Readonly<Record<ProgramType, string>> = {
  appe: "Advanced Practice Experience",
  ippe: "Introductory Practice Experience",
  fellowship: "Fellowship Program",
  certificate: "Certificate Program",
} as const;

export const MODULE_STATUS_LABELS: Readonly<Record<ModuleStatus, string>> = {
  locked: "Locked",
  available: "Available",
  in_progress: "In Progress",
  completed: "Completed",
} as const;

export const ENROLLMENT_STATUS_LABELS: Readonly<
  Record<ProgramEnrollmentStatus, string>
> = {
  applied: "Applied",
  accepted: "Accepted",
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
  withdrawn: "Withdrawn",
} as const;

export const ASSESSMENT_METHOD_LABELS: Readonly<
  Record<AssessmentMethod, string>
> = {
  quiz: "Quiz",
  case_study: "Case Study",
  presentation: "Presentation",
  written_report: "Written Report",
  portfolio_artifact: "Portfolio Artifact",
  preceptor_evaluation: "Preceptor Evaluation",
  peer_review: "Peer Review",
  self_reflection: "Self-Reflection",
} as const;

// ============================================================================
// MODULE DEFINITION
// ============================================================================

/**
 * A learning activity within a module.
 * Links to specific EPAs, KSBs, or standalone exercises.
 */
export interface ModuleActivity {
  /** Activity title */
  readonly title: string;
  /** What the learner will do */
  readonly description: string;
  /** EPA references this activity builds toward */
  readonly epaIds: readonly EPAId[];
  /** KSB references this activity addresses */
  readonly ksbIds: readonly KSBId[];
  /** How this activity is assessed */
  readonly assessmentMethods: readonly AssessmentMethod[];
  /** Target proficiency level for mapped KSBs */
  readonly targetLevel: ProficiencyLevel;
  /** Estimated hours to complete */
  readonly estimatedHours: number;
}

/**
 * Module-level learning objective.
 */
export interface ModuleLearningObjective {
  /** Objective statement (action verb + measurable outcome) */
  readonly statement: string;
  /** KSBs this objective maps to */
  readonly ksbIds: readonly KSBId[];
}

/**
 * A module within a program.
 * Modules are the primary unit of sequencing.
 *
 * Stored as subcollection: /programs/{programId}/modules/{moduleId}
 * OR as an embedded array in the program document (for small programs).
 */
export interface ProgramModule {
  /** Unique module identifier */
  readonly id: ModuleId;
  /** Module sequence number (1-based) */
  readonly sequenceNumber: number;
  /** Module title */
  readonly title: string;
  /** Module description */
  readonly description: string;
  /** Scheduled week(s) within the program (e.g., "Week 1", "Weeks 2-3") */
  readonly scheduledWeeks: string;
  /** Estimated total hours for this module */
  readonly estimatedHours: number;

  /** Learning objectives for this module */
  readonly learningObjectives: readonly ModuleLearningObjective[];
  /** Activities within this module */
  readonly activities: readonly ModuleActivity[];

  /** EPA pathways this module maps to */
  readonly epaIds: readonly EPAId[];
  /** PV domain IDs this module covers */
  readonly domainIds: readonly DomainId[];

  /** Module IDs that must be completed before this one unlocks */
  readonly prerequisites: readonly ModuleId[];

  /** ACPE Standards this module addresses (e.g., ["1", "3", "10"]) */
  readonly acpeStandards: readonly string[];
}

// ============================================================================
// PROGRAM DEFINITION
// ============================================================================

/**
 * Program-level success metric.
 * Maps to §2 of the APPE program definition.
 */
export interface ProgramMetric {
  /** Metric name (e.g., "EPA Achievement Rate") */
  readonly name: string;
  /** What is measured */
  readonly description: string;
  /** Category: student outcomes, program effectiveness, or operational */
  readonly category:
    | "student_outcomes"
    | "program_effectiveness"
    | "operational";
  /** Target value or range */
  readonly target: string;
  /** How it's measured */
  readonly measurementMethod: string;
}

/**
 * Complete Program definition.
 * Stored in Firestore: /programs/{programId}
 *
 * A Program is the top-level container for structured learning experiences.
 * It sequences modules, enforces prerequisites, tracks milestones, and
 * connects to the EPA/KSB framework for competency measurement.
 */
export interface AcademyProgram {
  // Identity
  /** Unique program identifier */
  readonly id: ProgramId;
  /** Full program name */
  readonly name: string;
  /** Short display name */
  readonly shortName: string;
  /** Program description */
  readonly description: string;
  /** Program type classification */
  readonly type: ProgramType;

  // Publishing
  /** Current status */
  readonly status: ProgramStatus;
  /** Program version (semver-style, e.g., "3.0") */
  readonly version: string;

  // Structure
  /** Ordered modules (embedded for programs with ≤10 modules) */
  readonly modules: readonly ProgramModule[];
  /** Total estimated hours across all modules */
  readonly totalEstimatedHours: number;
  /** Total scheduled weeks */
  readonly totalWeeks: number;

  // Framework alignment
  /** All EPA IDs covered across all modules */
  readonly coveredEPAIds: readonly EPAId[];
  /** All PV domain IDs covered */
  readonly coveredDomainIds: readonly DomainId[];
  /** ACPE Standards addressed (union across modules) */
  readonly acpeStandards: readonly string[];
  /** Program-level success metrics */
  readonly metrics: readonly ProgramMetric[];

  // Philosophy & goals (§1 of APPE definition)
  /** Program philosophy statement */
  readonly philosophy: string;
  /** Program goals */
  readonly goals: readonly string[];

  // Metadata
  /** Target audience description */
  readonly targetAudience: string;
  /** Prerequisites for program admission */
  readonly admissionPrerequisites: readonly string[];
  /** Academic institution partner (if applicable) */
  readonly academicPartner?: string;

  // Timestamps
  readonly createdAt: FlexibleTimestamp;
  readonly updatedAt: FlexibleTimestamp;
  readonly publishedAt?: FlexibleTimestamp;
}

// ============================================================================
// PROGRAM ENROLLMENT (User Progress)
// ============================================================================

/**
 * Per-module progress within a program enrollment.
 */
export interface ModuleProgress {
  /** Module ID */
  readonly moduleId: ModuleId;
  /** Current status */
  readonly status: ModuleStatus;
  /** Percentage complete (0-100) */
  readonly completionPercent: number;
  /** Activities completed out of total */
  readonly activitiesCompleted: number;
  /** Total activities in module */
  readonly activitiesTotal: number;
  /** When the learner started this module */
  readonly startedAt?: FlexibleTimestamp;
  /** When the learner completed this module */
  readonly completedAt?: FlexibleTimestamp;
  /** Preceptor notes or feedback */
  readonly preceptorNotes?: string;
}

/**
 * Program enrollment — a user's journey through a program.
 * Stored in Firestore: /program_enrollments/{enrollmentId}
 */
export interface ProgramEnrollment {
  /** Unique enrollment ID */
  readonly id: ProgramEnrollmentId;
  /** User ID (Firebase Auth UID) */
  readonly userId: string;
  /** Program ID */
  readonly programId: ProgramId;

  /** Current enrollment status */
  readonly status: ProgramEnrollmentStatus;
  /** Per-module progress */
  readonly moduleProgress: readonly ModuleProgress[];
  /** Current active module (the one the learner is working on) */
  readonly currentModuleId?: ModuleId;
  /** Overall completion percentage (0-100) */
  readonly overallCompletionPercent: number;

  /** Cohort identifier (e.g., "Spring 2026") */
  readonly cohort?: string;
  /** Assigned preceptor name */
  readonly preceptor?: string;
  /** Academic institution */
  readonly institution?: string;

  // Timestamps
  readonly enrolledAt: FlexibleTimestamp;
  readonly startedAt?: FlexibleTimestamp;
  readonly completedAt?: FlexibleTimestamp;
  readonly updatedAt: FlexibleTimestamp;
}

// ============================================================================
// PROGRAM RESOURCES (preceptor-facing operational guides)
// ============================================================================

/** Branded string type for Resource IDs */
export type ProgramResourceId = string & {
  readonly __brand: "ProgramResourceId";
};

/**
 * Resource category — maps to APPE folder structure.
 */
export type ResourceCategory =
  | "strategic_planning"
  | "process_planning"
  | "monitoring_governance"
  | "special_considerations"
  | "closeout"
  | "implementation"
  | "reference";

export const RESOURCE_CATEGORIES: readonly ResourceCategory[] = [
  "strategic_planning",
  "process_planning",
  "monitoring_governance",
  "special_considerations",
  "closeout",
  "implementation",
  "reference",
] as const;

export function isResourceCategory(value: string): value is ResourceCategory {
  return RESOURCE_CATEGORIES.includes(value as ResourceCategory);
}

export const RESOURCE_CATEGORY_LABELS: Readonly<
  Record<ResourceCategory, string>
> = {
  strategic_planning: "Strategic Planning",
  process_planning: "Process Planning",
  monitoring_governance: "Monitoring & Governance",
  special_considerations: "Special Considerations",
  closeout: "Program Closeout",
  implementation: "Implementation",
  reference: "Reference",
} as const;

/**
 * Resource audience — who this guide is for.
 */
export type ResourceAudience = "preceptor" | "student" | "admin" | "all";

/**
 * A section within a resource guide.
 * Each section has a title, description, and structured content.
 */
export interface ResourceSection {
  /** Section title (e.g., "Coordinate with IT for Student Laptop Preparation") */
  readonly title: string;
  /** Section description */
  readonly description: string;
  /** Key components / bullet points */
  readonly components: readonly string[];
  /** Implementation steps */
  readonly implementationSteps: readonly string[];
}

/**
 * A program resource — operational guide attached to a program.
 * Stored in Firestore: /program_resources/{resourceId}
 */
export interface ProgramResource {
  readonly id: ProgramResourceId;
  /** Parent program ID */
  readonly programId: ProgramId;
  /** Resource title */
  readonly title: string;
  /** Brief description */
  readonly description: string;
  /** Category for grouping */
  readonly category: ResourceCategory;
  /** Target audience */
  readonly audience: ResourceAudience;
  /** Sequence within category */
  readonly sequenceNumber: number;
  /** Structured sections of the guide */
  readonly sections: readonly ResourceSection[];
  /** Related module IDs (which daily modules use this resource) */
  readonly relatedModuleIds: readonly ModuleId[];
  /** Full markdown content (original guide text) */
  readonly markdownContent: string;
  /** Source file path (for provenance) */
  readonly sourceFile: string;

  readonly createdAt: FlexibleTimestamp;
  readonly updatedAt: FlexibleTimestamp;
}

// ============================================================================
// CATALOG TYPES (lightweight, for listing pages)
// ============================================================================

/**
 * Lightweight program card for catalog display.
 */
export interface ProgramCatalogCard {
  readonly id: ProgramId;
  readonly name: string;
  readonly shortName: string;
  readonly type: ProgramType;
  readonly status: ProgramStatus;
  readonly description: string;
  readonly totalWeeks: number;
  readonly totalEstimatedHours: number;
  readonly moduleCount: number;
  readonly coveredEPACount: number;
  readonly coveredDomainCount: number;
  readonly targetAudience: string;
}

/**
 * Converts a full AcademyProgram to a catalog card.
 */
export function toProgramCatalogCard(
  program: AcademyProgram,
): ProgramCatalogCard {
  return {
    id: program.id,
    name: program.name,
    shortName: program.shortName,
    type: program.type,
    status: program.status,
    description: program.description,
    totalWeeks: program.totalWeeks,
    totalEstimatedHours: program.totalEstimatedHours,
    moduleCount: program.modules.length,
    coveredEPACount: program.coveredEPAIds.length,
    coveredDomainCount: program.coveredDomainIds.length,
    targetAudience: program.targetAudience,
  };
}
