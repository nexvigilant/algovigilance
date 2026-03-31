/**
 * Course Validation Orchestrator
 *
 * Main entry point for validating courses.
 * Runs all validators and generates comprehensive validation report.
 *
 * @module infrastructure/course-validation/validate-course
 */

import type { Course } from '@/types/academy';

import { logger } from '@/lib/logger';
const log = logger.scope('academy/course-validation/validate-course');
import type {
  CourseValidationReport,
  ValidationConfig,
  ValidatorResult,
  ValidationIssue,
  ValidationCategory
} from './types';
import { DEFAULT_VALIDATION_CONFIG, VALIDATION_SCORE_THRESHOLDS } from './types';

// Import validators
import { validateStructure } from './validators/structure';
import { validateContent } from './validators/content';
import { validateAccessibility } from './validators/accessibility';
import { validateComponents } from './validators/components';
import { validateAssessment } from './validators/assessment';

/**
 * Validator registry
 */
const VALIDATORS: Record<
  ValidationCategory,
  (course: Course, config?: ValidationConfig) => Promise<ValidatorResult>
> = {
  structure: validateStructure,
  content: validateContent,
  accessibility: validateAccessibility,
  components: validateComponents,
  assessment: validateAssessment,
  metadata: async () => ({
    validator: 'metadata',
    status: 'pass',
    issues: [],
    metadata: { checksRun: 0, checksPassed: 0, checksFailed: 0, executionTimeMs: 0 }
  }) // Placeholder for future metadata validator
};

/**
 * Validate a course against all or specified validators
 *
 * @param course - Course to validate
 * @param config - Validation configuration
 * @returns Comprehensive validation report
 *
 * @example
 * ```typescript
 * import { validateCourse } from '@/infrastructure/course-validation/validate-course';
 *
 * const report = await validateCourse(course, {
 *   validators: ['structure', 'content', 'accessibility'],
 *   severityThreshold: 'warning',
 *   strictMode: false
 * });
 *
 * log.info(`Status: ${report.status}`);
 * log.info(`Score: ${report.summary.validationScore}/100`);
 * log.info(`Issues: ${report.summary.totalIssues}`);
 * ```
 */
export async function validateCourse(
  course: Course,
  config?: ValidationConfig
): Promise<CourseValidationReport> {
  // Merge with default config
  const finalConfig: ValidationConfig = {
    ...DEFAULT_VALIDATION_CONFIG,
    ...config
  };

  // Determine which validators to run
  const validatorsToRun = finalConfig.validators || Object.keys(VALIDATORS) as ValidationCategory[];

  // Run validators in parallel for performance
  const validatorPromises = validatorsToRun.map(async (validatorName) => {
    const validator = VALIDATORS[validatorName];
    if (!validator) {
      log.warn(`Unknown validator: ${validatorName}`);
      return null;
    }

    try {
      return await validator(course, finalConfig);
    } catch (error) {
      log.error(`Error running ${validatorName} validator:`, error);
      return {
        validator: validatorName,
        status: 'fail' as const,
        issues: [{
          id: `${validatorName}-error`,
          category: validatorName,
          severity: 'error' as const,
          message: `Validator error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          suggestion: 'Check validator implementation'
        }],
        metadata: {
          checksRun: 0,
          checksPassed: 0,
          checksFailed: 1,
          executionTimeMs: 0
        }
      };
    }
  });

  const validatorResults = (await Promise.all(validatorPromises)).filter(
    (result): result is ValidatorResult => result !== null
  );

  // Aggregate all issues
  let allIssues: ValidationIssue[] = [];
  for (const result of validatorResults) {
    allIssues = allIssues.concat(result.issues);
  }

  // Filter by severity threshold
  if (finalConfig.severityThreshold) {
    const thresholds = { info: 1, warning: 2, error: 3 };
    const minSeverity = thresholds[finalConfig.severityThreshold];
    allIssues = allIssues.filter(issue => thresholds[issue.severity] >= minSeverity);
  }

  // Limit issues per category
  if (finalConfig.maxIssuesPerCategory) {
    const issuesByCategory: Record<string, ValidationIssue[]> = {};
    for (const issue of allIssues) {
      if (!issuesByCategory[issue.category]) {
        issuesByCategory[issue.category] = [];
      }
      if (issuesByCategory[issue.category].length < finalConfig.maxIssuesPerCategory) {
        issuesByCategory[issue.category].push(issue);
      }
    }
    allIssues = Object.values(issuesByCategory).flat();
  }

  // Remove suggestions/docs if config says so
  if (!finalConfig.includeSuggestions) {
    allIssues = allIssues.map(issue => ({ ...issue, suggestion: undefined }));
  }
  if (!finalConfig.includeDocUrls) {
    allIssues = allIssues.map(issue => ({ ...issue, documentationUrl: undefined }));
  }

  // Count by severity
  const errors = allIssues.filter(i => i.severity === 'error').length;
  const warnings = allIssues.filter(i => i.severity === 'warning').length;
  const infos = allIssues.filter(i => i.severity === 'info').length;

  // Calculate validation score (0-100)
  const score = calculateValidationScore(validatorResults, allIssues, finalConfig);

  // Determine overall status
  let status: 'pass' | 'fail' | 'warning';
  if (errors > 0 || (finalConfig.strictMode && warnings > 0)) {
    status = 'fail';
  } else if (warnings > 0 || infos > 0) {
    status = 'warning';
  } else {
    status = 'pass';
  }

  // Generate recommendations
  const recommendations = generateRecommendations(validatorResults, allIssues, score);

  // Build report
  const report: CourseValidationReport = {
    status,
    courseId: course.id,
    courseTitle: course.title,
    timestamp: new Date(),
    validators: validatorResults,
    summary: {
      totalIssues: allIssues.length,
      errors,
      warnings,
      infos,
      validationScore: score
    },
    issues: allIssues,
    recommendations
  };

  return report;
}

/**
 * Calculate validation score (0-100)
 *
 * Score is based on:
 * - Number of checks passed vs failed
 * - Severity of issues
 * - Percentage of validators passing
 */
function calculateValidationScore(
  validatorResults: ValidatorResult[],
  issues: ValidationIssue[],
  config: ValidationConfig
): number {
  if (validatorResults.length === 0) {
    return 0;
  }

  // Calculate total checks
  const totalChecks = validatorResults.reduce((sum, r) => sum + (r.metadata?.checksRun || 0), 0);
  const totalPassed = validatorResults.reduce((sum, r) => sum + (r.metadata?.checksPassed || 0), 0);

  if (totalChecks === 0) {
    return 100; // No checks = perfect score
  }

  // Base score from pass rate
  let score = (totalPassed / totalChecks) * 100;

  // Penalty for errors (more severe)
  const errors = issues.filter(i => i.severity === 'error').length;
  score -= errors * 5; // -5 points per error

  // Penalty for warnings
  const warnings = issues.filter(i => i.severity === 'warning').length;
  score -= warnings * 2; // -2 points per warning

  // Penalty for infos
  const infos = issues.filter(i => i.severity === 'info').length;
  score -= infos * 0.5; // -0.5 points per info

  // Strict mode penalty
  if (config.strictMode && warnings > 0) {
    score -= 10; // Additional penalty in strict mode
  }

  // Clamp to 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Generate actionable recommendations based on validation results
 */
function generateRecommendations(
  validatorResults: ValidatorResult[],
  issues: ValidationIssue[],
  score: number
): string[] {
  const recommendations: string[] = [];

  // Score-based recommendations
  if (score >= VALIDATION_SCORE_THRESHOLDS.excellent) {
    recommendations.push('✅ Excellent quality! Course meets all validation standards.');
  } else if (score >= VALIDATION_SCORE_THRESHOLDS.good) {
    recommendations.push('✓ Good quality. Address minor issues before publishing.');
  } else if (score >= VALIDATION_SCORE_THRESHOLDS.acceptable) {
    recommendations.push('⚠️ Acceptable quality. Review and fix warnings for better learner experience.');
  } else if (score >= VALIDATION_SCORE_THRESHOLDS.needsWork) {
    recommendations.push('⚠️ Needs work. Significant improvements required before publishing.');
  } else {
    recommendations.push('❌ Critical issues found. Course cannot be published in current state.');
  }

  // Validator-specific recommendations
  const failedValidators = validatorResults.filter(r => r.status === 'fail');
  if (failedValidators.length > 0) {
    const names = failedValidators.map(v => v.validator).join(', ');
    recommendations.push(`Fix critical issues in: ${names}`);
  }

  // Issue category analysis
  const errorCategories = new Set(
    issues.filter(i => i.severity === 'error').map(i => i.category)
  );

  if (errorCategories.has('structure')) {
    recommendations.push('📋 Fix structure issues first - these prevent course from loading correctly');
  }

  if (errorCategories.has('assessment')) {
    recommendations.push('🎯 Quiz validation failed - ensure total points = 100 and all questions valid');
  }

  if (errorCategories.has('accessibility')) {
    recommendations.push('♿ Accessibility issues found - add alt text, fix heading hierarchy, ensure WCAG AA compliance');
  }

  if (errorCategories.has('content')) {
    recommendations.push('📝 Content quality issues - review learning objectives, heading structure, and writing standards');
  }

  if (errorCategories.has('components')) {
    recommendations.push('🎨 Component syntax issues - verify callouts, comparison tables, and numbered lists use correct format');
  }

  // Specific issue patterns
  const placeholderIssues = issues.filter(i => i.id.includes('placeholder'));
  if (placeholderIssues.length > 0) {
    recommendations.push(`🔧 Replace ${placeholderIssues.length} unreplaced {{PLACEHOLDER}} variables with actual content`);
  }

  const altTextIssues = issues.filter(i => i.id.includes('img-alt'));
  if (altTextIssues.length > 0) {
    recommendations.push('🖼️ Add alt text to all images for screen reader accessibility');
  }

  const pointsIssues = issues.filter(i => i.id.includes('total-points'));
  if (pointsIssues.length > 0) {
    recommendations.push('📊 Adjust quiz question points to total exactly 100');
  }

  // General guidance
  if (issues.length > 20) {
    recommendations.push(`📋 ${issues.length} total issues found - prioritize errors first, then warnings`);
  }

  return recommendations;
}

/**
 * Quick validation check (structure + content only, no detailed reporting)
 *
 * @param course - Course to validate
 * @returns True if course passes basic validation
 */
export async function quickValidate(course: Course): Promise<boolean> {
  const report = await validateCourse(course, {
    validators: ['structure', 'content'],
    severityThreshold: 'error',
    includeSuggestions: false,
    includeDocUrls: false
  });

  return report.status !== 'fail';
}

/**
 * Validate course for publishing (all validators, strict mode)
 *
 * @param course - Course to validate
 * @returns Validation report with strict checks
 */
export async function validateForPublishing(course: Course): Promise<CourseValidationReport> {
  return await validateCourse(course, {
    validators: ['structure', 'content', 'accessibility', 'components', 'assessment'],
    severityThreshold: 'info',
    strictMode: true,
    includeSuggestions: true,
    includeDocUrls: true
  });
}
