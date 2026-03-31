/**
 * Error Detection Types
 *
 * Defines error categories, severity levels, and the structure
 * of detected errors for UAT reporting.
 */

/**
 * Categories of errors that can be detected
 */
export type ErrorCategory =
  | 'functional' // Feature doesn't work as expected
  | 'ui' // Visual/layout issues
  | 'ux' // Poor user experience (confusing, slow, etc.)
  | 'accessibility' // a11y violations
  | 'performance' // Slow responses, timeouts
  | 'security' // Security-related issues
  | 'content'; // Missing/incorrect content

/**
 * Severity levels for detected errors
 */
export type Severity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Specific error types within categories
 */
export type ErrorType =
  // Functional
  | 'broken_link'
  | 'form_submission_failed'
  | 'navigation_failed'
  | 'data_not_loading'
  | 'auth_flow_broken'
  | 'api_error'
  | 'feature_not_working'
  // UI
  | 'element_overlap'
  | 'unresponsive_button'
  | 'layout_broken'
  | 'image_not_loading'
  | 'style_missing'
  // UX
  | 'missing_feedback'
  | 'confusing_navigation'
  | 'slow_response'
  | 'unclear_error_message'
  | 'dead_end'
  // Accessibility
  | 'missing_alt_text'
  | 'low_contrast'
  | 'keyboard_trap'
  | 'missing_labels'
  | 'focus_not_visible'
  // Performance
  | 'slow_page_load'
  | 'timeout'
  | 'memory_issue'
  // Security
  | 'sensitive_data_exposed'
  | 'insecure_form'
  // Content
  | 'empty_state_unclear'
  | 'truncated_text'
  | 'broken_image'
  | 'outdated_content';

/**
 * Evidence captured for an error
 */
export interface ErrorEvidence {
  screenshot?: string;
  videoTimestamp?: number;
  consoleOutput?: string;
  networkRequest?: {
    url: string;
    method: string;
    status: number;
    response?: string;
  };
  selector?: string;
  expectedValue?: string;
  actualValue?: string;
  stackTrace?: string;
  [key: string]: unknown;
}

/**
 * A detected error
 */
export interface DetectedError {
  id: string;
  category: ErrorCategory;
  type?: ErrorType;
  severity: Severity;
  title: string;
  description: string;
  url: string;
  timestamp: number;
  screenshot?: string;
  evidence: ErrorEvidence;
  steps?: string[];
  suggestedFix?: string;
  aiConfidence?: number;
}

/**
 * Determine severity based on error type and context
 */
export function determineSeverity(
  category: ErrorCategory,
  type?: ErrorType,
  context?: { isBlockingFlow: boolean; affectsData: boolean }
): Severity {
  // Critical: Blocks user flow or affects data integrity
  if (context?.isBlockingFlow || context?.affectsData) {
    return 'critical';
  }

  // Category-based defaults
  const severityMap: Record<ErrorCategory, Severity> = {
    functional: 'high',
    security: 'critical',
    performance: 'medium',
    accessibility: 'medium',
    ui: 'low',
    ux: 'medium',
    content: 'low',
  };

  // Type-specific overrides
  const typeSeverityMap: Partial<Record<ErrorType, Severity>> = {
    api_error: 'critical',
    auth_flow_broken: 'critical',
    form_submission_failed: 'high',
    data_not_loading: 'high',
    timeout: 'high',
    sensitive_data_exposed: 'critical',
    keyboard_trap: 'high',
    broken_link: 'medium',
    slow_response: 'medium',
    image_not_loading: 'low',
    truncated_text: 'low',
  };

  if (type && typeSeverityMap[type]) {
    return typeSeverityMap[type];
  }

  return severityMap[category];
}

/**
 * Create a detected error with defaults
 */
export function createError(params: {
  category: ErrorCategory;
  type?: ErrorType;
  title: string;
  description: string;
  url: string;
  evidence?: ErrorEvidence;
  severity?: Severity;
  suggestedFix?: string;
}): DetectedError {
  const severity = params.severity || determineSeverity(params.category, params.type);

  return {
    id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    category: params.category,
    type: params.type,
    severity,
    title: params.title,
    description: params.description,
    url: params.url,
    timestamp: Date.now(),
    evidence: params.evidence || {},
    suggestedFix: params.suggestedFix,
  };
}

/**
 * Group errors by severity
 */
export function groupErrorsBySeverity(errors: DetectedError[]): Record<Severity, DetectedError[]> {
  return {
    critical: errors.filter((e) => e.severity === 'critical'),
    high: errors.filter((e) => e.severity === 'high'),
    medium: errors.filter((e) => e.severity === 'medium'),
    low: errors.filter((e) => e.severity === 'low'),
  };
}

/**
 * Group errors by category
 */
export function groupErrorsByCategory(errors: DetectedError[]): Record<ErrorCategory, DetectedError[]> {
  const groups: Record<ErrorCategory, DetectedError[]> = {
    functional: [],
    ui: [],
    ux: [],
    accessibility: [],
    performance: [],
    security: [],
    content: [],
  };

  for (const error of errors) {
    groups[error.category].push(error);
  }

  return groups;
}

/**
 * Calculate error statistics
 */
export function calculateErrorStats(errors: DetectedError[]): {
  total: number;
  bySeverity: Record<Severity, number>;
  byCategory: Record<ErrorCategory, number>;
  criticalCount: number;
  highCount: number;
} {
  const bySeverity = groupErrorsBySeverity(errors);
  const byCategory = groupErrorsByCategory(errors);

  return {
    total: errors.length,
    bySeverity: {
      critical: bySeverity.critical.length,
      high: bySeverity.high.length,
      medium: bySeverity.medium.length,
      low: bySeverity.low.length,
    },
    byCategory: {
      functional: byCategory.functional.length,
      ui: byCategory.ui.length,
      ux: byCategory.ux.length,
      accessibility: byCategory.accessibility.length,
      performance: byCategory.performance.length,
      security: byCategory.security.length,
      content: byCategory.content.length,
    },
    criticalCount: bySeverity.critical.length,
    highCount: bySeverity.high.length,
  };
}
