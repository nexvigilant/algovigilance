/**
 * Course Validation Types
 *
 * Type definitions for the modular course validation system.
 * Supports detailed error reporting with context and suggestions.
 *
 * @module infrastructure/course-validation/types
 */

import type { Course } from '@/types/academy';

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

/**
 * Severity levels for validation issues
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * Validation categories (matches validators)
 */
export type ValidationCategory =
  | 'structure'
  | 'content'
  | 'accessibility'
  | 'components'
  | 'assessment'
  | 'metadata';

/**
 * Individual validation issue
 */
export interface ValidationIssue {
  /** Unique issue ID (for tracking/filtering) */
  id: string;
  /** Category of validation check */
  category: ValidationCategory;
  /** Severity level */
  severity: ValidationSeverity;
  /** Human-readable error message */
  message: string;
  /** Location context (module/lesson identifier) */
  location?: {
    moduleId?: string;
    moduleName?: string;
    lessonId?: string;
    lessonName?: string;
    field?: string;
  };
  /** Content preview (show problematic content) */
  contentPreview?: string;
  /** Actionable suggestion for fixing */
  suggestion?: string;
  /** Reference to documentation */
  documentationUrl?: string;
}

/**
 * Validation result from a single validator
 */
export interface ValidatorResult {
  /** Validator name/category */
  validator: ValidationCategory;
  /** Overall validation status for this category */
  status: 'pass' | 'fail' | 'warning';
  /** Validation issues found */
  issues: ValidationIssue[];
  /** Metadata about validation run */
  metadata?: {
    checksRun: number;
    checksPassed: number;
    checksFailed: number;
    executionTimeMs: number;
  };
}

/**
 * Complete validation report for a course
 */
export interface CourseValidationReport {
  /** Overall validation status */
  status: 'pass' | 'fail' | 'warning';
  /** Course being validated */
  courseId: string;
  courseTitle: string;
  /** Validation timestamp */
  timestamp: Date;
  /** Results from each validator */
  validators: ValidatorResult[];
  /** Summary statistics */
  summary: {
    totalIssues: number;
    errors: number;
    warnings: number;
    infos: number;
    validationScore: number; // 0-100
  };
  /** Aggregated issues (all validators) */
  issues: ValidationIssue[];
  /** Recommendations for fixing issues */
  recommendations?: string[];
}

// ============================================================================
// VALIDATOR CONFIGURATION
// ============================================================================

/**
 * Configuration for validation run
 */
export interface ValidationConfig {
  /** Validators to run (omit to run all) */
  validators?: ValidationCategory[];
  /** Severity threshold (only report issues >= threshold) */
  severityThreshold?: ValidationSeverity;
  /** Whether to include suggestions in output */
  includeSuggestions?: boolean;
  /** Whether to include documentation URLs */
  includeDocUrls?: boolean;
  /** Maximum issues to report per category */
  maxIssuesPerCategory?: number;
  /** Strict mode (warnings treated as errors) */
  strictMode?: boolean;
}

/**
 * Validator function signature
 */
export type ValidatorFunction = (course: Course, config?: ValidationConfig) => Promise<ValidatorResult>;

// ============================================================================
// VALIDATION RULES
// ============================================================================

/**
 * Rule definition for content validation
 */
export interface ValidationRule {
  id: string;
  category: ValidationCategory;
  severity: ValidationSeverity;
  description: string;
  check: (course: Course) => boolean | Promise<boolean>;
  getMessage: (context?: unknown) => string;
  getSuggestion?: (context?: unknown) => string;
  documentationUrl?: string;
}

// ============================================================================
// COMPONENT VALIDATION TYPES
// ============================================================================

/**
 * Auto-detecting component types
 */
export type ComponentType =
  | 'learning-objectives'
  | 'callout-career-critical'
  | 'callout-capability-accelerator'
  | 'callout-red-flag'
  | 'callout-real-world'
  | 'callout-data-point'
  | 'comparison-table'
  | 'numbered-list-card';

/**
 * Component detection result
 */
export interface ComponentDetectionResult {
  type: ComponentType;
  detected: boolean;
  location: {
    lessonId: string;
    lessonTitle: string;
  };
  /** Problematic syntax if detection failed */
  issues?: Array<{
    problem: string;
    suggestion: string;
  }>;
}

// ============================================================================
// ACCESSIBILITY VALIDATION TYPES
// ============================================================================

/**
 * WCAG compliance level
 */
export type WCAGLevel = 'A' | 'AA' | 'AAA';

/**
 * WCAG success criterion
 */
export interface WCAGCriterion {
  id: string; // e.g., "1.4.3"
  level: WCAGLevel;
  title: string;
  description: string;
  checkFunction: (content: string) => boolean;
}

/**
 * Accessibility check result
 */
export interface AccessibilityCheckResult {
  criterion: string;
  passed: boolean;
  issues: Array<{
    element?: string;
    problem: string;
    suggestion: string;
  }>;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Issue filter options
 */
export interface IssueFilter {
  category?: ValidationCategory;
  severity?: ValidationSeverity;
  location?: {
    moduleId?: string;
    lessonId?: string;
  };
}

/**
 * Validation statistics
 */
export interface ValidationStatistics {
  totalCourses: number;
  totalModules: number;
  totalLessons: number;
  totalQuizzes: number;
  avgValidationScore: number;
  commonIssues: Array<{
    issueId: string;
    count: number;
    percentage: number;
  }>;
}

// ============================================================================
// EXPORT CONSTANTS
// ============================================================================

/**
 * Validation severity order (for sorting)
 */
export const SEVERITY_ORDER: Record<ValidationSeverity, number> = {
  error: 3,
  warning: 2,
  info: 1
};

/**
 * Validation score thresholds
 */
export const VALIDATION_SCORE_THRESHOLDS = {
  excellent: 95,
  good: 85,
  acceptable: 70,
  needsWork: 50,
  critical: 0
} as const;

/**
 * Default validation configuration
 */
export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  validators: ['structure', 'content', 'accessibility', 'components', 'assessment'],
  severityThreshold: 'info',
  includeSuggestions: true,
  includeDocUrls: true,
  maxIssuesPerCategory: 50,
  strictMode: false
};
