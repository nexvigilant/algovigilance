/**
 * Triage Scenario Validator
 *
 * Validates branching Triage configurations to ensure:
 * - All paths are reachable and lead to valid endpoints
 * - No orphaned or unreachable decision nodes
 * - Branch conditions reference valid decisions
 * - No infinite loops in decision trees
 */

import type { TriageConfig, TriageDecision, BranchCondition } from '@/types/pv-curriculum/activity-engines/configs';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  stats: ValidationStats;
}

export interface ValidationError {
  type: 'unreachable' | 'no_endpoint' | 'invalid_reference' | 'cycle' | 'missing_start' | 'empty_options';
  message: string;
  nodeId?: string;
  path?: string[];
}

export interface ValidationWarning {
  type: 'dead_end' | 'single_path' | 'missing_feedback' | 'long_path';
  message: string;
  nodeId?: string;
}

export interface ValidationStats {
  totalDecisions: number;
  totalOptions: number;
  reachableDecisions: number;
  endpointDecisions: number;
  maxPathLength: number;
  averageOptionsPerDecision: number;
  branchingFactor: number;
}

/**
 * Validate a Triage scenario configuration
 */
export function validateTriageScenario(config: TriageConfig): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Build decision map for quick lookup
  const decisionMap = new Map<string, TriageDecision>(
    config.decisions.map((d) => [d.id, d])
  );

  // Basic validation
  if (!config.startDecisionId) {
    errors.push({
      type: 'missing_start',
      message: 'Configuration is missing startDecisionId',
    });
  } else if (!decisionMap.has(config.startDecisionId)) {
    errors.push({
      type: 'invalid_reference',
      message: `startDecisionId "${config.startDecisionId}" does not exist`,
      nodeId: config.startDecisionId,
    });
  }

  // Check for empty decisions
  for (const decision of config.decisions) {
    if (!decision.options || decision.options.length === 0) {
      // Only error if it's not an endpoint
      if (!config.endDecisionIds?.includes(decision.id)) {
        warnings.push({
          type: 'dead_end',
          message: `Decision "${decision.id}" has no options but is not marked as endpoint`,
          nodeId: decision.id,
        });
      }
    }
  }

  // Find reachable nodes
  const reachable = findReachableNodes(config, decisionMap);

  // Check for unreachable nodes
  for (const decision of config.decisions) {
    if (!reachable.has(decision.id)) {
      errors.push({
        type: 'unreachable',
        message: `Decision "${decision.id}" is not reachable from start`,
        nodeId: decision.id,
      });
    }
  }

  // Check all paths lead to endpoints
  const pathsResult = findAllPaths(config, decisionMap);

  for (const incompletePath of pathsResult.incompletePaths) {
    errors.push({
      type: 'no_endpoint',
      message: `Path does not reach an endpoint: ${incompletePath.join(' -> ')}`,
      path: incompletePath,
      nodeId: incompletePath[incompletePath.length - 1],
    });
  }

  // Check for cycles
  for (const cycle of pathsResult.cycles) {
    errors.push({
      type: 'cycle',
      message: `Cycle detected: ${cycle.join(' -> ')}`,
      path: cycle,
    });
  }

  // Validate option references
  for (const decision of config.decisions) {
    for (const option of decision.options || []) {
      if (option.nextDecisionId && !decisionMap.has(option.nextDecisionId)) {
        errors.push({
          type: 'invalid_reference',
          message: `Option "${option.id}" in decision "${decision.id}" references non-existent decision "${option.nextDecisionId}"`,
          nodeId: decision.id,
        });
      }

      // Check showCondition references
      if (option.showCondition) {
        const conditionErrors = validateCondition(option.showCondition, decisionMap);
        errors.push(...conditionErrors);
      }
    }
  }

  // Validate branch conditions
  for (const decision of config.decisions) {
    for (const option of decision.options || []) {
      if (option.showCondition) {
        const conditionWarnings = checkConditionWarnings(option.showCondition, decision.id);
        warnings.push(...conditionWarnings);
      }
    }
  }

  // Warnings for best practices
  if (pathsResult.maxPathLength > 10) {
    warnings.push({
      type: 'long_path',
      message: `Maximum path length is ${pathsResult.maxPathLength} decisions, consider simplifying`,
    });
  }

  const totalOptions = config.decisions.reduce(
    (sum, d) => sum + (d.options?.length || 0),
    0
  );

  const avgOptions = config.decisions.length > 0
    ? totalOptions / config.decisions.length
    : 0;

  if (avgOptions < 2 && config.decisions.length > 2) {
    warnings.push({
      type: 'single_path',
      message: 'Most decisions have only one option - this may be too linear',
    });
  }

  // Check for missing feedback
  for (const decision of config.decisions) {
    for (const option of decision.options || []) {
      if (!option.explanation && !option.feedback) {
        warnings.push({
          type: 'missing_feedback',
          message: `Option "${option.id}" in decision "${decision.id}" has no explanation or feedback`,
          nodeId: decision.id,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalDecisions: config.decisions.length,
      totalOptions,
      reachableDecisions: reachable.size,
      endpointDecisions: config.endDecisionIds?.length || 0,
      maxPathLength: pathsResult.maxPathLength,
      averageOptionsPerDecision: Math.round(avgOptions * 100) / 100,
      branchingFactor: calculateBranchingFactor(config),
    },
  };
}

/**
 * Find all nodes reachable from start using BFS
 */
function findReachableNodes(
  config: TriageConfig,
  decisionMap: Map<string, TriageDecision>
): Set<string> {
  const reachable = new Set<string>();

  if (!config.startDecisionId) return reachable;

  const queue: string[] = [config.startDecisionId];

  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (nodeId === undefined) break;

    if (reachable.has(nodeId)) continue;
    reachable.add(nodeId);

    const decision = decisionMap.get(nodeId);
    if (!decision) continue;

    for (const option of decision.options || []) {
      if (option.nextDecisionId && !reachable.has(option.nextDecisionId)) {
        queue.push(option.nextDecisionId);
      }
    }
  }

  return reachable;
}

/**
 * Find all paths through the decision tree using DFS
 */
function findAllPaths(
  config: TriageConfig,
  decisionMap: Map<string, TriageDecision>
): {
  completePaths: string[][];
  incompletePaths: string[][];
  cycles: string[][];
  maxPathLength: number;
} {
  const completePaths: string[][] = [];
  const incompletePaths: string[][] = [];
  const cycles: string[][] = [];
  let maxPathLength = 0;

  const endDecisionIds = new Set(config.endDecisionIds || []);

  if (!config.startDecisionId) {
    return { completePaths, incompletePaths, cycles, maxPathLength: 0 };
  }

  function dfs(nodeId: string, path: string[], visited: Set<string>) {
    // Cycle detection
    if (visited.has(nodeId)) {
      const cycleStart = path.indexOf(nodeId);
      if (cycleStart >= 0) {
        cycles.push([...path.slice(cycleStart), nodeId]);
      }
      return;
    }

    const newPath = [...path, nodeId];
    visited.add(nodeId);

    const decision = decisionMap.get(nodeId);

    // Check if this is an endpoint
    if (endDecisionIds.has(nodeId)) {
      completePaths.push(newPath);
      maxPathLength = Math.max(maxPathLength, newPath.length);
      visited.delete(nodeId);
      return;
    }

    // No options means dead end (if not endpoint)
    if (!decision || !decision.options || decision.options.length === 0) {
      incompletePaths.push(newPath);
      visited.delete(nodeId);
      return;
    }

    // Check if any option leads somewhere
    const hasValidNext = decision.options.some((o) => o.nextDecisionId);
    if (!hasValidNext) {
      // All options lead to completion (implicit endpoint)
      completePaths.push(newPath);
      maxPathLength = Math.max(maxPathLength, newPath.length);
      visited.delete(nodeId);
      return;
    }

    // Explore each option
    for (const option of decision.options) {
      if (option.nextDecisionId) {
        dfs(option.nextDecisionId, newPath, visited);
      }
    }

    visited.delete(nodeId);
  }

  dfs(config.startDecisionId, [], new Set());

  return { completePaths, incompletePaths, cycles, maxPathLength };
}

/**
 * Validate a branch condition
 */
function validateCondition(
  condition: BranchCondition,
  decisionMap: Map<string, TriageDecision>
): ValidationError[] {
  const errors: ValidationError[] = [];

  switch (condition.type) {
    case 'previous_answer':
      if (condition.decisionId && !decisionMap.has(condition.decisionId)) {
        errors.push({
          type: 'invalid_reference',
          message: `Branch condition references non-existent decision "${condition.decisionId}"`,
          nodeId: condition.decisionId,
        });
      }
      break;

    case 'all_of':
    case 'any_of':
      if (condition.conditions) {
        for (const subCondition of condition.conditions) {
          errors.push(...validateCondition(subCondition, decisionMap));
        }
      }
      break;
  }

  return errors;
}

/**
 * Check for condition best practice warnings
 */
function checkConditionWarnings(
  condition: BranchCondition,
  contextDecisionId: string
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  if (condition.type === 'all_of' || condition.type === 'any_of') {
    if (!condition.conditions || condition.conditions.length < 2) {
      warnings.push({
        type: 'single_path',
        message: `Compound condition "${condition.type}" has fewer than 2 conditions`,
        nodeId: contextDecisionId,
      });
    }
  }

  return warnings;
}

/**
 * Calculate the branching factor (average number of unique next decisions per node)
 */
function calculateBranchingFactor(config: TriageConfig): number {
  let totalBranches = 0;
  let nodesWithBranches = 0;

  for (const decision of config.decisions) {
    const uniqueNextIds = new Set(
      (decision.options || [])
        .map((o) => o.nextDecisionId)
        .filter(Boolean)
    );

    if (uniqueNextIds.size > 0) {
      totalBranches += uniqueNextIds.size;
      nodesWithBranches++;
    }
  }

  return nodesWithBranches > 0
    ? Math.round((totalBranches / nodesWithBranches) * 100) / 100
    : 0;
}

/**
 * Pretty print validation results
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];

  lines.push('Triage Scenario Validation Results');
  lines.push('='.repeat(40));
  lines.push('');

  // Status
  lines.push(`Status: ${result.valid ? '✅ VALID' : '❌ INVALID'}`);
  lines.push('');

  // Stats
  lines.push('Statistics:');
  lines.push(`  - Total decisions: ${result.stats.totalDecisions}`);
  lines.push(`  - Total options: ${result.stats.totalOptions}`);
  lines.push(`  - Reachable decisions: ${result.stats.reachableDecisions}`);
  lines.push(`  - Endpoint decisions: ${result.stats.endpointDecisions}`);
  lines.push(`  - Max path length: ${result.stats.maxPathLength}`);
  lines.push(`  - Avg options/decision: ${result.stats.averageOptionsPerDecision}`);
  lines.push(`  - Branching factor: ${result.stats.branchingFactor}`);
  lines.push('');

  // Errors
  if (result.errors.length > 0) {
    lines.push(`Errors (${result.errors.length}):`);
    for (const error of result.errors) {
      lines.push(`  ❌ [${error.type}] ${error.message}`);
    }
    lines.push('');
  }

  // Warnings
  if (result.warnings.length > 0) {
    lines.push(`Warnings (${result.warnings.length}):`);
    for (const warning of result.warnings) {
      lines.push(`  ⚠️  [${warning.type}] ${warning.message}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
