/**
 * Validation Report Formatter
 *
 * Formats CourseValidationReport for CLI output with colors and structure.
 *
 * @module infrastructure/course-validation/format-report
 */

import type { CourseValidationReport, ValidationIssue, ValidationSeverity } from './types';

import { logger } from '@/lib/logger';
const log = logger.scope('academy/course-validation/format-report');

/**
 * ANSI color codes for terminal output
 */
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

/**
 * Severity styling
 */
const SEVERITY_STYLE: Record<ValidationSeverity, { color: string; icon: string }> = {
  error: { color: COLORS.red, icon: '✗' },
  warning: { color: COLORS.yellow, icon: '⚠' },
  info: { color: COLORS.blue, icon: 'ℹ' }
};

/**
 * Format validation report for CLI output
 *
 * @param report - Validation report to format
 * @param options - Formatting options
 * @returns Formatted string for console output
 */
export function formatReport(
  report: CourseValidationReport,
  options: {
    detailed?: boolean;
    showSuggestions?: boolean;
    groupByCategory?: boolean;
  } = {}
): string {
  const {
    detailed = true,
    showSuggestions = true,
    groupByCategory = true
  } = options;

  const lines: string[] = [];

  // Header
  lines.push('');
  lines.push(`${COLORS.bright}═══════════════════════════════════════════════════════════${COLORS.reset}`);
  lines.push(`${COLORS.bright}  COURSE VALIDATION REPORT${COLORS.reset}`);
  lines.push(`${COLORS.bright}═══════════════════════════════════════════════════════════${COLORS.reset}`);
  lines.push('');

  // Course info
  lines.push(`${COLORS.cyan}Course:${COLORS.reset} ${report.courseTitle}`);
  lines.push(`${COLORS.cyan}ID:${COLORS.reset} ${report.courseId}`);
  lines.push(`${COLORS.cyan}Timestamp:${COLORS.reset} ${report.timestamp.toLocaleString()}`);
  lines.push('');

  // Overall status with score
  const statusColor = report.status === 'pass' ? COLORS.green :
                      report.status === 'warning' ? COLORS.yellow : COLORS.red;
  const statusIcon = report.status === 'pass' ? '✓' :
                     report.status === 'warning' ? '⚠' : '✗';

  lines.push(`${COLORS.bright}Status:${COLORS.reset} ${statusColor}${statusIcon} ${report.status.toUpperCase()}${COLORS.reset}`);
  lines.push(`${COLORS.bright}Validation Score:${COLORS.reset} ${getScoreDisplay(report.summary.validationScore)}`);
  lines.push('');

  // Summary statistics
  lines.push(`${COLORS.bright}──────────────────────────────────────────────────────────${COLORS.reset}`);
  lines.push(`${COLORS.bright}SUMMARY${COLORS.reset}`);
  lines.push(`${COLORS.bright}──────────────────────────────────────────────────────────${COLORS.reset}`);
  lines.push('');
  lines.push(`  Total Issues:    ${report.summary.totalIssues}`);
  lines.push(`  ${COLORS.red}● Errors:${COLORS.reset}        ${report.summary.errors}`);
  lines.push(`  ${COLORS.yellow}● Warnings:${COLORS.reset}      ${report.summary.warnings}`);
  lines.push(`  ${COLORS.blue}● Info:${COLORS.reset}          ${report.summary.infos}`);
  lines.push('');

  // Validator results
  lines.push(`${COLORS.bright}──────────────────────────────────────────────────────────${COLORS.reset}`);
  lines.push(`${COLORS.bright}VALIDATORS${COLORS.reset}`);
  lines.push(`${COLORS.bright}──────────────────────────────────────────────────────────${COLORS.reset}`);
  lines.push('');

  for (const validator of report.validators) {
    const vStatusColor = validator.status === 'pass' ? COLORS.green :
                         validator.status === 'warning' ? COLORS.yellow : COLORS.red;
    const vStatusIcon = validator.status === 'pass' ? '✓' :
                        validator.status === 'warning' ? '⚠' : '✗';

    const meta = validator.metadata;
    const passRate = meta ? Math.round((meta.checksPassed / meta.checksRun) * 100) : 0;

    lines.push(`  ${vStatusColor}${vStatusIcon}${COLORS.reset} ${COLORS.bright}${validator.validator}${COLORS.reset}`);
    if (meta) {
      lines.push(`    Checks: ${meta.checksPassed}/${meta.checksRun} passed (${passRate}%)`);
      lines.push(`    Issues: ${validator.issues.length}`);
      lines.push(`    Time: ${meta.executionTimeMs}ms`);
    }
    lines.push('');
  }

  // Issues (detailed)
  if (detailed && report.issues.length > 0) {
    lines.push(`${COLORS.bright}──────────────────────────────────────────────────────────${COLORS.reset}`);
    lines.push(`${COLORS.bright}ISSUES${COLORS.reset}`);
    lines.push(`${COLORS.bright}──────────────────────────────────────────────────────────${COLORS.reset}`);
    lines.push('');

    if (groupByCategory) {
      // Group issues by category
      const byCategory: Record<string, ValidationIssue[]> = {};
      for (const issue of report.issues) {
        if (!byCategory[issue.category]) {
          byCategory[issue.category] = [];
        }
        byCategory[issue.category].push(issue);
      }

      for (const [category, issues] of Object.entries(byCategory)) {
        lines.push(`${COLORS.cyan}▶ ${category.toUpperCase()}${COLORS.reset} (${issues.length} issues)`);
        lines.push('');

        for (const issue of issues) {
          lines.push(formatIssue(issue, { showSuggestions, indent: 2 }));
        }

        lines.push('');
      }
    } else {
      // Flat list
      for (const issue of report.issues) {
        lines.push(formatIssue(issue, { showSuggestions, indent: 0 }));
      }
    }
  }

  // Recommendations
  if (report.recommendations && report.recommendations.length > 0) {
    lines.push(`${COLORS.bright}──────────────────────────────────────────────────────────${COLORS.reset}`);
    lines.push(`${COLORS.bright}RECOMMENDATIONS${COLORS.reset}`);
    lines.push(`${COLORS.bright}──────────────────────────────────────────────────────────${COLORS.reset}`);
    lines.push('');

    for (const rec of report.recommendations) {
      lines.push(`  ${rec}`);
    }
    lines.push('');
  }

  // Footer
  lines.push(`${COLORS.bright}═══════════════════════════════════════════════════════════${COLORS.reset}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Format a single validation issue
 */
function formatIssue(
  issue: ValidationIssue,
  options: { showSuggestions?: boolean; indent?: number } = {}
): string {
  const { showSuggestions = true, indent = 0 } = options;
  const style = SEVERITY_STYLE[issue.severity];
  const prefix = ' '.repeat(indent);
  const lines: string[] = [];

  // Issue header
  lines.push(`${prefix}${style.color}${style.icon} ${issue.severity.toUpperCase()}${COLORS.reset} ${issue.message}`);

  // Location
  if (issue.location) {
    const loc = issue.location;
    const parts = [];
    if (loc.moduleName) parts.push(`Module: ${loc.moduleName}`);
    if (loc.lessonName) parts.push(`Lesson: ${loc.lessonName}`);
    if (loc.field) parts.push(`Field: ${loc.field}`);

    if (parts.length > 0) {
      lines.push(`${prefix}  ${COLORS.gray}${parts.join(' | ')}${COLORS.reset}`);
    }
  }

  // Content preview
  if (issue.contentPreview) {
    const preview = issue.contentPreview.length > 80
      ? issue.contentPreview.slice(0, 77) + '...'
      : issue.contentPreview;
    lines.push(`${prefix}  ${COLORS.gray}Content: ${preview}${COLORS.reset}`);
  }

  // Suggestion
  if (showSuggestions && issue.suggestion) {
    lines.push(`${prefix}  ${COLORS.green}💡 ${issue.suggestion}${COLORS.reset}`);
  }

  // Documentation URL
  if (issue.documentationUrl) {
    lines.push(`${prefix}  ${COLORS.blue}📘 ${issue.documentationUrl}${COLORS.reset}`);
  }

  lines.push('');

  return lines.join('\n');
}

/**
 * Get colored score display
 */
function getScoreDisplay(score: number): string {
  let color: string;
  let rating: string;

  if (score >= 95) {
    color = COLORS.green;
    rating = 'Excellent';
  } else if (score >= 85) {
    color = COLORS.green;
    rating = 'Good';
  } else if (score >= 70) {
    color = COLORS.yellow;
    rating = 'Acceptable';
  } else if (score >= 50) {
    color = COLORS.yellow;
    rating = 'Needs Work';
  } else {
    color = COLORS.red;
    rating = 'Critical';
  }

  return `${color}${score}/100${COLORS.reset} (${rating})`;
}

/**
 * Format report summary (compact version)
 */
export function formatSummary(report: CourseValidationReport): string {
  const statusColor = report.status === 'pass' ? COLORS.green :
                      report.status === 'warning' ? COLORS.yellow : COLORS.red;
  const statusIcon = report.status === 'pass' ? '✓' :
                     report.status === 'warning' ? '⚠' : '✗';

  return [
    '',
    `${COLORS.bright}Validation Summary${COLORS.reset}`,
    `  Status: ${statusColor}${statusIcon} ${report.status.toUpperCase()}${COLORS.reset}`,
    `  Score: ${getScoreDisplay(report.summary.validationScore)}`,
    `  Issues: ${report.summary.errors} errors, ${report.summary.warnings} warnings, ${report.summary.infos} info`,
    ''
  ].join('\n');
}

/**
 * Format report as JSON (for programmatic consumption)
 */
export function formatJSON(report: CourseValidationReport, pretty: boolean = true): string {
  return JSON.stringify(report, null, pretty ? 2 : 0);
}

/**
 * Export report to file (JSON format)
 */
export async function exportReport(report: CourseValidationReport, filePath: string): Promise<void> {
  const fs = await import('fs');
  const json = formatJSON(report, true);
  fs.writeFileSync(filePath, json, 'utf8');
  log.info(`${COLORS.green}✓${COLORS.reset} Report exported to: ${filePath}`);
}
