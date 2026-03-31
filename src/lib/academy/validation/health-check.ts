/**
 * Infrastructure Health Check System
 *
 * Validates that all infrastructure components are properly configured
 * and functioning correctly.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface HealthCheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: Record<string, unknown>;
}

export interface ValidationReport {
  timestamp: string;
  totalChecks: number;
  passed: number;
  failed: number;
  warnings: number;
  results: HealthCheckResult[];
}

/**
 * Run all infrastructure health checks
 */
export async function runHealthChecks(): Promise<ValidationReport> {
  const results: HealthCheckResult[] = [];

  // Check builders
  results.push(await checkBuilders());

  // Check hooks
  results.push(await checkHooks());

  // Check compositions
  results.push(await checkCompositions());

  // Check types
  results.push(await checkTypes());

  // Check testing utilities
  results.push(await checkTestingUtils());

  // Check scripts
  results.push(await checkScripts());

  // Check course validation system
  results.push(await checkCourseValidation());

  // Check documentation
  results.push(await checkDocumentation());

  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  const warnings = results.filter((r) => r.status === 'warn').length;

  return {
    timestamp: new Date().toISOString(),
    totalChecks: results.length,
    passed,
    failed,
    warnings,
    results,
  };
}

/**
 * Check builders
 */
async function checkBuilders(): Promise<HealthCheckResult> {
  try {
    const buildersPath = path.join(process.cwd(), 'infrastructure', 'builders');

    const requiredBuilders = ['page-builder.ts', 'form-builder.ts'];

    const missingBuilders: string[] = [];

    for (const builder of requiredBuilders) {
      const builderPath = path.join(buildersPath, builder);
      if (!fs.existsSync(builderPath)) {
        missingBuilders.push(builder);
      }
    }

    if (missingBuilders.length > 0) {
      return {
        name: 'Builders',
        status: 'fail',
        message: `Missing builders: ${missingBuilders.join(', ')}`,
      };
    }

    return {
      name: 'Builders',
      status: 'pass',
      message: 'All builders present',
      details: { builders: requiredBuilders },
    };
  } catch (error) {
    return {
      name: 'Builders',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check hooks
 */
async function checkHooks(): Promise<HealthCheckResult> {
  try {
    const hooksPath = path.join(process.cwd(), 'infrastructure', 'hooks');

    const requiredHooks = [
      'use-protected-page.tsx',
      'use-server-action-form.tsx',
      'use-analytics-tracking.tsx',
    ];

    const advancedHooks = [
      'advanced/use-paginated-query.tsx',
      'advanced/use-optimistic-update.tsx',
      'advanced/use-infinite-scroll.tsx',
      'advanced/use-debounce.tsx',
      'advanced/use-media-query.tsx',
      'advanced/use-render-performance.tsx',
    ];

    const allHooks = [...requiredHooks, ...advancedHooks];
    const missingHooks: string[] = [];

    for (const hook of allHooks) {
      const hookPath = path.join(hooksPath, hook);
      if (!fs.existsSync(hookPath)) {
        missingHooks.push(hook);
      }
    }

    if (missingHooks.length > 0) {
      return {
        name: 'Hooks',
        status: 'warn',
        message: `Some hooks missing: ${missingHooks.join(', ')}`,
      };
    }

    return {
      name: 'Hooks',
      status: 'pass',
      message: 'All hooks present',
      details: { totalHooks: allHooks.length },
    };
  } catch (error) {
    return {
      name: 'Hooks',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check compositions
 */
async function checkCompositions(): Promise<HealthCheckResult> {
  try {
    const compositionsPath = path.join(process.cwd(), 'infrastructure', 'compositions');

    const requiredCompositions = [
      'data-table/DataTableWithFilters.tsx',
      'modal-form/ModalForm.tsx',
      'dashboard-card/DashboardCard.tsx',
      'async-select/AsyncSelect.tsx',
      'file-upload/FileUpload.tsx',
    ];

    const missingCompositions: string[] = [];

    for (const composition of requiredCompositions) {
      const compositionPath = path.join(compositionsPath, composition);
      if (!fs.existsSync(compositionPath)) {
        missingCompositions.push(composition);
      }
    }

    if (missingCompositions.length > 0) {
      return {
        name: 'Compositions',
        status: 'warn',
        message: `Some compositions missing: ${missingCompositions.join(', ')}`,
      };
    }

    return {
      name: 'Compositions',
      status: 'pass',
      message: 'All compositions present',
      details: { totalCompositions: requiredCompositions.length },
    };
  } catch (error) {
    return {
      name: 'Compositions',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check types
 */
async function checkTypes(): Promise<HealthCheckResult> {
  try {
    const typesPath = path.join(process.cwd(), 'infrastructure', 'types');

    const requiredTypes = ['common.ts', 'guards.ts', 'utilities.ts'];

    const missingTypes: string[] = [];

    for (const type of requiredTypes) {
      const typePath = path.join(typesPath, type);
      if (!fs.existsSync(typePath)) {
        missingTypes.push(type);
      }
    }

    if (missingTypes.length > 0) {
      return {
        name: 'Types',
        status: 'fail',
        message: `Missing type files: ${missingTypes.join(', ')}`,
      };
    }

    return {
      name: 'Types',
      status: 'pass',
      message: 'All type files present',
      details: { typeFiles: requiredTypes },
    };
  } catch (error) {
    return {
      name: 'Types',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check testing utilities
 */
async function checkTestingUtils(): Promise<HealthCheckResult> {
  try {
    const testingPath = path.join(process.cwd(), 'infrastructure', 'testing');

    const requiredUtils = [
      'utils/mock-auth.tsx',
      'utils/mock-firestore.ts',
      'fixtures/users.ts',
      'fixtures/courses.ts',
      'fixtures/community.ts',
    ];

    const missingUtils: string[] = [];

    for (const util of requiredUtils) {
      const utilPath = path.join(testingPath, util);
      if (!fs.existsSync(utilPath)) {
        missingUtils.push(util);
      }
    }

    if (missingUtils.length > 0) {
      return {
        name: 'Testing Utilities',
        status: 'warn',
        message: `Some testing utilities missing: ${missingUtils.join(', ')}`,
      };
    }

    return {
      name: 'Testing Utilities',
      status: 'pass',
      message: 'All testing utilities present',
      details: { totalUtils: requiredUtils.length },
    };
  } catch (error) {
    return {
      name: 'Testing Utilities',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check scripts
 */
async function checkScripts(): Promise<HealthCheckResult> {
  try {
    const scriptsPath = path.join(process.cwd(), 'infrastructure', 'scripts');

    const requiredScripts = [
      'create-page.ts',
      'create-component.ts',
      'create-action.ts',
    ];

    const missingScripts: string[] = [];

    for (const script of requiredScripts) {
      const scriptPath = path.join(scriptsPath, script);
      if (!fs.existsSync(scriptPath)) {
        missingScripts.push(script);
      }
    }

    if (missingScripts.length > 0) {
      return {
        name: 'Scripts',
        status: 'fail',
        message: `Missing scripts: ${missingScripts.join(', ')}`,
      };
    }

    return {
      name: 'Scripts',
      status: 'pass',
      message: 'All generator scripts present',
      details: { scripts: requiredScripts },
    };
  } catch (error) {
    return {
      name: 'Scripts',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check course validation system
 */
async function checkCourseValidation(): Promise<HealthCheckResult> {
  try {
    const validationPath = path.join(process.cwd(), 'infrastructure', 'course-validation');

    const requiredFiles = [
      'types.ts',
      'validate-course.ts',
      'format-report.ts',
      'validators/structure.ts',
      'validators/content.ts',
      'validators/accessibility.ts',
      'validators/components.ts',
      'validators/assessment.ts',
    ];

    const missingFiles: string[] = [];

    for (const file of requiredFiles) {
      const filePath = path.join(validationPath, file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      }
    }

    // Check for CLI script
    const cliScript = path.join(process.cwd(), 'scripts', 'validate-course.ts');
    if (!fs.existsSync(cliScript)) {
      missingFiles.push('scripts/validate-course.ts');
    }

    // Check for mock generators
    const mockGenerators = path.join(process.cwd(), 'infrastructure', 'testing', 'mock-course-generators.ts');
    if (!fs.existsSync(mockGenerators)) {
      missingFiles.push('testing/mock-course-generators.ts');
    }

    if (missingFiles.length > 0) {
      return {
        name: 'Course Validation',
        status: 'fail',
        message: `Missing course validation files: ${missingFiles.join(', ')}`,
      };
    }

    return {
      name: 'Course Validation',
      status: 'pass',
      message: 'Course validation system complete',
      details: {
        validators: 5,
        totalFiles: requiredFiles.length + 2
      },
    };
  } catch (error) {
    return {
      name: 'Course Validation',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check documentation
 */
async function checkDocumentation(): Promise<HealthCheckResult> {
  try {
    const docsPath = path.join(process.cwd(), 'infrastructure', 'docs');

    const requiredDocs = [
      'GETTING-STARTED.md',
      'BUILDERS.md',
      'HOOKS.md',
    ];

    const missingDocs: string[] = [];

    for (const doc of requiredDocs) {
      const docPath = path.join(docsPath, doc);
      if (!fs.existsSync(docPath)) {
        missingDocs.push(doc);
      }
    }

    if (missingDocs.length > 0) {
      return {
        name: 'Documentation',
        status: 'warn',
        message: `Some documentation missing: ${missingDocs.join(', ')}`,
      };
    }

    return {
      name: 'Documentation',
      status: 'pass',
      message: 'All documentation present',
      details: { docs: requiredDocs },
    };
  } catch (error) {
    return {
      name: 'Documentation',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Format validation report for console output
 */
export function formatReport(report: ValidationReport): string {
  let output = '\n';
  output += '═══════════════════════════════════════════════════════════\n';
  output += '  INFRASTRUCTURE HEALTH CHECK REPORT\n';
  output += '═══════════════════════════════════════════════════════════\n\n';
  output += `Timestamp: ${report.timestamp}\n`;
  output += `Total Checks: ${report.totalChecks}\n`;
  output += `✓ Passed: ${report.passed}\n`;
  output += `✗ Failed: ${report.failed}\n`;
  output += `⚠ Warnings: ${report.warnings}\n\n`;

  output += 'Results:\n';
  output += '───────────────────────────────────────────────────────────\n';

  for (const result of report.results) {
    const icon = result.status === 'pass' ? '✓' : result.status === 'fail' ? '✗' : '⚠';
    const color = result.status === 'pass' ? '\x1b[32m' : result.status === 'fail' ? '\x1b[31m' : '\x1b[33m';
    const reset = '\x1b[0m';

    output += `${color}${icon}${reset} ${result.name}: ${result.message}\n`;

    if (result.details) {
      output += `   ${JSON.stringify(result.details)}\n`;
    }
  }

  output += '═══════════════════════════════════════════════════════════\n';

  const overallStatus = report.failed === 0 ? 'PASS' : 'FAIL';
  const statusColor = report.failed === 0 ? '\x1b[32m' : '\x1b[31m';

  output += `\n${statusColor}Overall Status: ${overallStatus}\x1b[0m\n\n`;

  return output;
}
