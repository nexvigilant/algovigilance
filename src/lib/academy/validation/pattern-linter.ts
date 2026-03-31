/**
 * Pattern Linter
 *
 * Scans codebase for anti-patterns and suggests improvements
 */

import * as fs from 'fs';
import * as path from 'path';

export interface LintIssue {
  file: string;
  line: number;
  pattern: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion: string;
}

export interface LintReport {
  totalFiles: number;
  totalIssues: number;
  errors: number;
  warnings: number;
  info: number;
  issues: LintIssue[];
}

/**
 * Anti-patterns to detect
 */
const ANTI_PATTERNS = [
  {
    name: 'manual-auth-check',
    pattern: /const\s+{\s*user.*loading.*}\s*=\s*useAuth\(\)/,
    severity: 'warning' as const,
    message: 'Manual auth check detected',
    suggestion: 'Use useProtectedPage() hook instead for automatic redirect',
  },
  {
    name: 'inline-metadata',
    pattern: /export\s+const\s+metadata\s*=\s*{\s*title:/,
    severity: 'info' as const,
    message: 'Inline metadata detected',
    suggestion: 'Consider using createMetadata() builder for consistency',
  },
  {
    name: 'missing-aria-label',
    pattern: /<button[^>]*(?!.*aria-label)(?!.*aria-labelledby)/,
    severity: 'warning' as const,
    message: 'Button without ARIA label',
    suggestion: 'Add aria-label or aria-labelledby for accessibility',
  },
  {
    name: 'console-log',
    pattern: /console\.log\(/,
    severity: 'info' as const,
    message: 'console.log found',
    suggestion: 'Remove console.log before production',
  },
];

/**
 * Run pattern linter on directory
 */
export async function lintPatterns(dirPath: string): Promise<LintReport> {
  const issues: LintIssue[] = [];
  let totalFiles = 0;

  const scanDirectory = (currentPath: string) => {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      // Skip node_modules, .next, etc.
      if (
        entry.name === 'node_modules' ||
        entry.name === '.next' ||
        entry.name === 'dist' ||
        entry.name === '.git'
      ) {
        continue;
      }

      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
        totalFiles++;
        const fileIssues = lintFile(fullPath);
        issues.push(...fileIssues);
      }
    }
  };

  scanDirectory(dirPath);

  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.filter((i) => i.severity === 'warning').length;
  const info = issues.filter((i) => i.severity === 'info').length;

  return {
    totalFiles,
    totalIssues: issues.length,
    errors,
    warnings,
    info,
    issues,
  };
}

/**
 * Lint a single file
 */
function lintFile(filePath: string): LintIssue[] {
  const issues: LintIssue[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (const pattern of ANTI_PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      if (pattern.pattern.test(lines[i])) {
        issues.push({
          file: filePath,
          line: i + 1,
          pattern: pattern.name,
          severity: pattern.severity,
          message: pattern.message,
          suggestion: pattern.suggestion,
        });
      }
    }
  }

  return issues;
}

/**
 * Format lint report
 */
export function formatLintReport(report: LintReport): string {
  let output = '\n';
  output += '═══════════════════════════════════════════════════════════\n';
  output += '  PATTERN LINT REPORT\n';
  output += '═══════════════════════════════════════════════════════════\n\n';
  output += `Files Scanned: ${report.totalFiles}\n`;
  output += `Total Issues: ${report.totalIssues}\n`;
  output += `  Errors: ${report.errors}\n`;
  output += `  Warnings: ${report.warnings}\n`;
  output += `  Info: ${report.info}\n\n`;

  if (report.issues.length > 0) {
    output += 'Issues:\n';
    output += '───────────────────────────────────────────────────────────\n';

    for (const issue of report.issues) {
      const icon =
        issue.severity === 'error' ? '✗' : issue.severity === 'warning' ? '⚠' : 'ℹ';
      const color =
        issue.severity === 'error'
          ? '\x1b[31m'
          : issue.severity === 'warning'
          ? '\x1b[33m'
          : '\x1b[36m';

      output += `${color}${icon}\x1b[0m ${issue.file}:${issue.line}\n`;
      output += `   ${issue.message}\n`;
      output += `   💡 ${issue.suggestion}\n\n`;
    }
  }

  output += '═══════════════════════════════════════════════════════════\n\n';

  return output;
}
