/**
 * Quality Gates for ALO Content Validation
 *
 * Validates generated ALO content against structural, content,
 * and engagement quality standards before publishing.
 *
 * @module lib/manufacturing/quality-gates
 */

import { logger } from '@/lib/logger';
import type { ALO, KSBHook, KSBConcept, KSBActivity, KSBReflection } from '@/types/alo';
import type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationRules,
  BloomValidationResult,
} from '@/types/manufacturing';

const log = logger.scope('quality-gates');

/**
 * Default validation rules
 */
export const DEFAULT_VALIDATION_RULES: ValidationRules = {
  hook: {
    minWords: 30,
    maxWords: 150,
    requiresEngagementElement: true,
  },
  concept: {
    minKeyPoints: 3,
    maxKeyPoints: 5,
    requiresExample: true,
  },
  activity: {
    minItems: 3,
    maxItems: 10,
    requiresFeedback: true,
    requiresPassingThreshold: true,
  },
  reflection: {
    requiresPortfolioPrompt: true,
    requiresCompetencyTags: true,
  },
};

/**
 * Bloom's Taxonomy action verbs by level
 */
const BLOOM_VERBS: Record<string, string[]> = {
  remember: ['define', 'list', 'recall', 'identify', 'name', 'recognize', 'state'],
  understand: ['explain', 'describe', 'summarize', 'interpret', 'classify', 'compare'],
  apply: ['apply', 'demonstrate', 'calculate', 'use', 'implement', 'execute', 'solve'],
  analyze: ['analyze', 'differentiate', 'examine', 'investigate', 'distinguish', 'compare'],
  evaluate: ['evaluate', 'assess', 'judge', 'justify', 'critique', 'recommend', 'prioritize'],
  create: ['create', 'design', 'develop', 'construct', 'formulate', 'propose', 'synthesize'],
};

/**
 * Counts words in a string
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Validates the Hook section
 */
function validateHook(hook: KSBHook, rules: ValidationRules['hook']): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const suggestions: string[] = [];

  // Check word count
  const wordCount = countWords(hook.content);
  if (wordCount < rules.minWords) {
    errors.push({
      code: 'HOOK_TOO_SHORT',
      message: `Hook has ${wordCount} words, minimum is ${rules.minWords}`,
      field: 'hook.content',
      severity: 'error',
    });
  }
  if (wordCount > rules.maxWords) {
    warnings.push({
      code: 'HOOK_TOO_LONG',
      message: `Hook has ${wordCount} words, maximum recommended is ${rules.maxWords}`,
      field: 'hook.content',
    });
    suggestions.push('Consider condensing the hook to maintain engagement');
  }

  // Check scenario type
  const validScenarioTypes = ['real_world', 'case_study', 'challenge', 'question'];
  if (!validScenarioTypes.includes(hook.scenarioType)) {
    errors.push({
      code: 'INVALID_SCENARIO_TYPE',
      message: `Invalid scenario type: ${hook.scenarioType}`,
      field: 'hook.scenarioType',
      severity: 'error',
    });
  }

  // Check for engagement elements
  if (rules.requiresEngagementElement) {
    const hasQuestion = hook.content.includes('?');
    const hasChallenge = /imagine|consider|what if|picture this/i.test(hook.content);
    const hasRealWorld = /industry|professional|real|actual|recently/i.test(hook.content);

    if (!hasQuestion && !hasChallenge && !hasRealWorld) {
      warnings.push({
        code: 'MISSING_ENGAGEMENT',
        message: 'Hook lacks clear engagement element (question, challenge, or real-world context)',
        field: 'hook.content',
      });
      suggestions.push('Add a thought-provoking question or real-world scenario');
    }
  }

  const score = calculateSectionScore(errors.length, warnings.length, 25);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    score,
    suggestions,
  };
}

/**
 * Validates the Concept section
 */
function validateConcept(concept: KSBConcept, rules: ValidationRules['concept']): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const suggestions: string[] = [];

  // Check key points
  const keyPointCount = concept.keyPoints?.length || 0;
  if (keyPointCount < rules.minKeyPoints) {
    errors.push({
      code: 'INSUFFICIENT_KEY_POINTS',
      message: `Concept has ${keyPointCount} key points, minimum is ${rules.minKeyPoints}`,
      field: 'concept.keyPoints',
      severity: 'error',
    });
  }
  if (keyPointCount > rules.maxKeyPoints) {
    warnings.push({
      code: 'TOO_MANY_KEY_POINTS',
      message: `Concept has ${keyPointCount} key points, maximum recommended is ${rules.maxKeyPoints}`,
      field: 'concept.keyPoints',
    });
    suggestions.push('Consider consolidating key points for better retention');
  }

  // Check for examples
  if (rules.requiresExample) {
    const hasExamples = concept.examples && concept.examples.length > 0;
    if (!hasExamples) {
      errors.push({
        code: 'MISSING_EXAMPLES',
        message: 'Concept requires at least one example',
        field: 'concept.examples',
        severity: 'error',
      });
    }
  }

  // Check content depth
  const contentWordCount = countWords(concept.content);
  if (contentWordCount < 100) {
    warnings.push({
      code: 'SHALLOW_CONTENT',
      message: 'Concept content may be too brief for adequate coverage',
      field: 'concept.content',
    });
    suggestions.push('Expand concept content with more detailed explanations');
  }

  const score = calculateSectionScore(errors.length, warnings.length, 30);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    score,
    suggestions,
  };
}

/**
 * Validates the Activity section
 */
function validateActivity(
  activity: KSBActivity,
  _rules: ValidationRules['activity']
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const suggestions: string[] = [];

  // Validate engine type
  const validEngines = ['red_pen', 'triage', 'synthesis', 'calculator', 'timeline', 'code_playground'];
  if (!validEngines.includes(activity.engineType)) {
    errors.push({
      code: 'INVALID_ENGINE_TYPE',
      message: `Invalid activity engine type: ${activity.engineType}`,
      field: 'activity.engineType',
      severity: 'critical',
    });
  }

  // Check instructions
  if (!activity.instructions || activity.instructions.length < 20) {
    errors.push({
      code: 'INSUFFICIENT_INSTRUCTIONS',
      message: 'Activity instructions are missing or too brief',
      field: 'activity.instructions',
      severity: 'error',
    });
  }

  // Validate config based on engine type
  const configResult = validateActivityConfig(activity);
  errors.push(...configResult.errors);
  warnings.push(...configResult.warnings);
  suggestions.push(...configResult.suggestions);

  // Check time limit
  if (!activity.timeLimitMinutes || activity.timeLimitMinutes < 1) {
    warnings.push({
      code: 'MISSING_TIME_LIMIT',
      message: 'Activity has no time limit specified',
      field: 'activity.timeLimitMinutes',
    });
  }

  const score = calculateSectionScore(errors.length, warnings.length, 30);

  return {
    valid: errors.filter((e) => e.severity === 'critical').length === 0,
    errors,
    warnings,
    score,
    suggestions,
  };
}

/**
 * Calculator answer validation result
 */
interface CalculatorValidationResult {
  valid: boolean;
  message?: string;
  computedValue?: number;
  expectedValue?: number;
}

/**
 * Common signal detection formulas for 2x2 contingency tables
 * Cells: a=drug+event, b=drug+no_event, c=no_drug+event, d=no_drug+no_event
 */
function computeSignalMetric(
  cells: { a: number; b: number; c: number; d: number },
  formula: string
): number | null {
  const { a, b, c, d } = cells;

  // Common formulas (case-insensitive matching)
  const normalizedFormula = formula.toLowerCase().replace(/\s+/g, '');

  if (normalizedFormula.includes('prr') || normalizedFormula.includes('proportionalreporting')) {
    // PRR = (a / (a + b)) / (c / (c + d))
    const drugRate = a / (a + b);
    const nonDrugRate = c / (c + d);
    return nonDrugRate === 0 ? null : drugRate / nonDrugRate;
  }

  if (normalizedFormula.includes('ror') || normalizedFormula.includes('reportingodd')) {
    // ROR = (a * d) / (b * c)
    return b * c === 0 ? null : (a * d) / (b * c);
  }

  if (normalizedFormula.includes('chi') || normalizedFormula.includes('χ²')) {
    // Chi-square = (n * (ad - bc)²) / ((a+b)(c+d)(a+c)(b+d))
    const n = a + b + c + d;
    const numerator = n * Math.pow(a * d - b * c, 2);
    const denominator = (a + b) * (c + d) * (a + c) * (b + d);
    return denominator === 0 ? null : numerator / denominator;
  }

  // For other formulas, we can't compute - return null to skip validation
  return null;
}

/**
 * Validates that a calculator task's expectedAnswer matches computed value
 */
function validateCalculatorAnswer(
  cells: { a: number; b: number; c: number; d: number },
  task: { name: string; formula?: string; expectedAnswer: number; decimalPlaces?: number }
): CalculatorValidationResult {
  // If no formula provided, we can't validate
  if (!task.formula) {
    return { valid: true };
  }

  const computed = computeSignalMetric(cells, task.formula);

  // If we can't compute (unsupported formula), skip validation
  if (computed === null) {
    return { valid: true };
  }

  // Compare with tolerance based on decimal places
  const tolerance = Math.pow(10, -(task.decimalPlaces || 2));
  const diff = Math.abs(computed - task.expectedAnswer);

  if (diff > tolerance) {
    return {
      valid: false,
      message: `Expected ${task.expectedAnswer} but computed ${computed.toFixed(task.decimalPlaces || 2)} from contingency table`,
      computedValue: computed,
      expectedValue: task.expectedAnswer,
    };
  }

  return { valid: true, computedValue: computed, expectedValue: task.expectedAnswer };
}

/**
 * Validates activity config based on engine type
 */
function validateActivityConfig(activity: KSBActivity): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const suggestions: string[] = [];

  // Helper to safely access nested config properties
  function cfg(key: string): Record<string, unknown> | null {
    const val = (activity.config as unknown as Record<string, unknown>)[key];
    if (val && typeof val === 'object') return val as Record<string, unknown>;
    return null;
  }
  function cfgArr(key: string): unknown[] | null {
    const val = (activity.config as unknown as Record<string, unknown>)[key];
    if (Array.isArray(val)) return val;
    return null;
  }
  function cfgVal(key: string): unknown {
    return (activity.config as unknown as Record<string, unknown>)[key];
  }

  const config = activity.config as unknown as Record<string, unknown>;
  if (!config) {
    errors.push({
      code: 'MISSING_CONFIG',
      message: 'Activity config is missing',
      field: 'activity.config',
      severity: 'critical',
    });
    return { valid: false, errors, warnings, score: 0, suggestions };
  }

  switch (activity.engineType) {
    case 'red_pen': {
      const doc = cfg('document');
      if (!doc || !doc.content) {
        errors.push({
          code: 'REDPEN_MISSING_DOCUMENT',
          message: 'Red Pen activity requires document content',
          field: 'activity.config.document',
          severity: 'error',
        });
      }
      const errs = cfgArr('errors');
      if (!errs || errs.length < 3) {
        warnings.push({
          code: 'REDPEN_FEW_ERRORS',
          message: 'Red Pen activity should have at least 3 errors to detect',
          field: 'activity.config.errors',
        });
      }
      break;
    }

    case 'triage': {
      if (!cfgVal('scenario')) {
        errors.push({
          code: 'TRIAGE_MISSING_SCENARIO',
          message: 'Triage activity requires a scenario',
          field: 'activity.config.scenario',
          severity: 'error',
        });
      }
      const decisions = cfgArr('decisions');
      if (!decisions || decisions.length < 3) {
        warnings.push({
          code: 'TRIAGE_FEW_DECISIONS',
          message: 'Triage activity should have at least 3 decision points',
          field: 'activity.config.decisions',
        });
      }
      break;
    }

    case 'synthesis': {
      if (!cfgVal('prompt')) {
        errors.push({
          code: 'SYNTHESIS_MISSING_PROMPT',
          message: 'Synthesis activity requires a prompt',
          field: 'activity.config.prompt',
          severity: 'error',
        });
      }
      const rubric = cfg('rubric');
      const rubricCriteria = rubric ? (rubric.criteria as unknown[]) : null;
      if (!rubricCriteria || !Array.isArray(rubricCriteria) || rubricCriteria.length < 2) {
        warnings.push({
          code: 'SYNTHESIS_WEAK_RUBRIC',
          message: 'Synthesis activity should have at least 2 rubric criteria',
          field: 'activity.config.rubric',
        });
      }
      break;
    }

    case 'calculator': {
      const dataTable = cfg('dataTable');
      if (!dataTable) {
        errors.push({
          code: 'CALCULATOR_MISSING_DATA',
          message: 'Calculator activity requires a data table',
          field: 'activity.config.dataTable',
          severity: 'error',
        });
      }
      const tasks = cfgArr('tasks');
      if (!tasks || tasks.length < 1) {
        errors.push({
          code: 'CALCULATOR_NO_TASKS',
          message: 'Calculator activity requires at least one calculation task',
          field: 'activity.config.tasks',
          severity: 'error',
        });
      }
      // Validate computed values against contingency table (if 2x2)
      if (dataTable?.type === '2x2' && dataTable.contingencyTable && tasks) {
        const contingencyTable = dataTable.contingencyTable as Record<string, unknown>;
        const cells = contingencyTable.cells as { a: number; b: number; c: number; d: number };
        // Validate each task's expectedAnswer against computed values
        for (const task of tasks) {
          const validationResult = validateCalculatorAnswer(cells, task as { name: string; formula?: string; expectedAnswer: number; decimalPlaces?: number });
          if (!validationResult.valid) {
            const typedTask = task as { name: string; id: string };
            warnings.push({
              code: 'CALCULATOR_INVALID_ANSWER',
              message: `Task "${typedTask.name}": ${validationResult.message}`,
              field: `activity.config.tasks.${typedTask.id}`,
            });
            suggestions.push(`Review the expectedAnswer for task "${typedTask.name}" - it may not match the contingency table values`);
          }
        }
      }
      break;
    }

    case 'timeline': {
      const events = cfgArr('events');
      if (!events || events.length < 3) {
        errors.push({
          code: 'TIMELINE_FEW_EVENTS',
          message: 'Timeline activity requires at least 3 events',
          field: 'activity.config.events',
          severity: 'error',
        });
      }
      // Validate Day 0 presence - exactly one event should be marked as Day 0
      if (events && events.length > 0) {
        const day0Events = events.filter((e) => (e as { isDay0?: boolean }).isDay0 === true);
        if (day0Events.length === 0) {
          errors.push({
            code: 'TIMELINE_NO_DAY0',
            message: 'Timeline activity must have exactly one event marked as Day 0 (isDay0: true)',
            field: 'activity.config.events',
            severity: 'error',
          });
          suggestions.push('Ensure one event has isDay0: true - typically the awareness or receipt event');
        } else if (day0Events.length > 1) {
          errors.push({
            code: 'TIMELINE_MULTIPLE_DAY0',
            message: `Timeline activity has ${day0Events.length} events marked as Day 0 - only one is allowed`,
            field: 'activity.config.events',
            severity: 'error',
          });
          suggestions.push('Only one event can be Day 0 - choose the earliest date when minimum reportable information was received');
        }
      }
      // Validate regulations presence
      const regulations = cfgArr('regulations');
      if (!regulations || regulations.length === 0) {
        warnings.push({
          code: 'TIMELINE_NO_REGULATIONS',
          message: 'Timeline activity should reference applicable regulations',
          field: 'activity.config.regulations',
        });
      }
      break;
    }

    case 'code_playground':
      if (!cfgVal('starterCode') && !cfgVal('instructions')) {
        warnings.push({
          code: 'PLAYGROUND_NO_STARTER',
          message: 'Code playground should have starter code or detailed instructions',
          field: 'activity.config',
        });
      }
      break;
  }

  return { valid: errors.length === 0, errors, warnings, score: 0, suggestions };
}

/**
 * Validates the Reflection section
 */
function validateReflection(
  reflection: KSBReflection,
  rules: ValidationRules['reflection']
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const suggestions: string[] = [];

  // Check prompt
  if (!reflection.prompt || reflection.prompt.length < 20) {
    errors.push({
      code: 'REFLECTION_NO_PROMPT',
      message: 'Reflection requires a meaningful prompt',
      field: 'reflection.prompt',
      severity: 'error',
    });
  }

  // Check portfolio artifact config
  if (rules.requiresPortfolioPrompt) {
    if (!reflection.portfolioArtifact) {
      warnings.push({
        code: 'MISSING_PORTFOLIO_CONFIG',
        message: 'Reflection should configure portfolio artifact capture',
        field: 'reflection.portfolioArtifact',
      });
      suggestions.push('Add portfolio artifact configuration for competency evidence');
    }
  }

  if (rules.requiresCompetencyTags && reflection.portfolioArtifact) {
    if (!reflection.portfolioArtifact.competencyTags?.length) {
      warnings.push({
        code: 'MISSING_COMPETENCY_TAGS',
        message: 'Portfolio artifact should have competency tags',
        field: 'reflection.portfolioArtifact.competencyTags',
      });
    }
  }

  const score = calculateSectionScore(errors.length, warnings.length, 15);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    score,
    suggestions,
  };
}

/**
 * Calculates section score based on errors and warnings
 */
function calculateSectionScore(
  errorCount: number,
  warningCount: number,
  maxScore: number
): number {
  const errorPenalty = errorCount * 10;
  const warningPenalty = warningCount * 3;
  return Math.max(0, maxScore - errorPenalty - warningPenalty);
}

/**
 * Validates Bloom's Taxonomy alignment
 */
export function validateBloomAlignment(
  content: string,
  declaredLevel: string
): BloomValidationResult {
  const normalizedLevel = declaredLevel.toLowerCase();
  const targetVerbs = BLOOM_VERBS[normalizedLevel] || [];
  const allVerbs = Object.entries(BLOOM_VERBS);

  // Find verbs in content
  const foundVerbs: string[] = [];
  const verbMatches: Record<string, number> = {};

  for (const [level, verbs] of allVerbs) {
    verbMatches[level] = 0;
    for (const verb of verbs) {
      const regex = new RegExp(`\\b${verb}\\w*\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        foundVerbs.push(...matches);
        verbMatches[level] += matches.length;
      }
    }
  }

  // Determine detected level
  let detectedLevel = normalizedLevel;
  let maxMatches = 0;
  for (const [level, count] of Object.entries(verbMatches)) {
    if (count > maxMatches) {
      maxMatches = count;
      detectedLevel = level;
    }
  }

  const bloomLevelOrder = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
  const declaredIndex = bloomLevelOrder.indexOf(normalizedLevel);
  const detectedIndex = bloomLevelOrder.indexOf(detectedLevel);
  const alignment = Math.abs(declaredIndex - detectedIndex) <= 1;

  const suggestions: string[] = [];
  if (!alignment) {
    suggestions.push(
      `Content uses ${detectedLevel}-level verbs but targets ${normalizedLevel} level`
    );
    suggestions.push(`Consider using more verbs like: ${targetVerbs.slice(0, 3).join(', ')}`);
  }

  return {
    declaredLevel: declaredIndex + 1,
    detectedLevel: detectedIndex + 1,
    alignment,
    actionVerbs: foundVerbs.slice(0, 10),
    confidence: maxMatches > 3 ? 0.8 : 0.5,
    suggestions,
  };
}

/**
 * Runs all quality gates on an ALO
 */
export function runQualityGates(
  alo: ALO,
  rules: ValidationRules = DEFAULT_VALIDATION_RULES
): ValidationResult {
  log.debug(`Running quality gates for ALO ${alo.id}`);

  const hookResult = validateHook(alo.hook, rules.hook);
  const conceptResult = validateConcept(alo.concept, rules.concept);
  const activityResult = validateActivity(alo.activity, rules.activity);
  const reflectionResult = validateReflection(alo.reflection, rules.reflection);

  // Aggregate results
  const allErrors = [
    ...hookResult.errors,
    ...conceptResult.errors,
    ...activityResult.errors,
    ...reflectionResult.errors,
  ];

  const allWarnings = [
    ...hookResult.warnings,
    ...conceptResult.warnings,
    ...activityResult.warnings,
    ...reflectionResult.warnings,
  ];

  const allSuggestions = [
    ...hookResult.suggestions,
    ...conceptResult.suggestions,
    ...activityResult.suggestions,
    ...reflectionResult.suggestions,
  ];

  const totalScore =
    hookResult.score + conceptResult.score + activityResult.score + reflectionResult.score;

  const hasBlockingErrors = allErrors.some((e) => e.severity === 'critical');

  log.info(`Quality gates complete for ALO ${alo.id}`, {
    score: totalScore,
    errors: allErrors.length,
    warnings: allWarnings.length,
    passed: !hasBlockingErrors,
  });

  return {
    valid: !hasBlockingErrors && allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    score: totalScore,
    suggestions: allSuggestions,
  };
}

/**
 * Runs quality gates and returns a pass/fail with summary
 */
export function checkQuality(alo: ALO): {
  passed: boolean;
  score: number;
  summary: string;
  issues: string[];
} {
  const result = runQualityGates(alo);

  const issues = [
    ...result.errors.map((e) => `❌ ${e.message}`),
    ...result.warnings.map((w) => `⚠️ ${w.message}`),
  ];

  let summary = '';
  if (result.score >= 90) {
    summary = 'Excellent quality - ready for publishing';
  } else if (result.score >= 70) {
    summary = 'Good quality - minor improvements recommended';
  } else if (result.score >= 50) {
    summary = 'Fair quality - review required before publishing';
  } else {
    summary = 'Poor quality - significant revisions needed';
  }

  return {
    passed: result.valid && result.score >= 70,
    score: result.score,
    summary,
    issues,
  };
}
