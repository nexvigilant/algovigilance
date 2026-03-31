/**
 * Rubric Consistency Validator for Synthesis Activities
 *
 * Ensures synthesis activity rubrics are:
 * - Measurable (not vague)
 * - Consistent across similar KSBs
 * - Properly weighted
 * - Clear for AI evaluation
 *
 * @module lib/manufacturing/rubric-validator
 */

import { logger } from '@/lib/logger';
import type { SynthesisConfig } from '@/types/alo';

const log = logger.scope('rubric-validator');

/**
 * Individual rubric criterion (from ALO types)
 */
export interface RubricCriterion {
  name: string;
  description: string;
  weight: number;
  rubric: {
    excellent: string;
    good: string;
    satisfactory: string;
    needsImprovement: string;
  };
}

/**
 * Issue found in a rubric
 */
export interface RubricIssue {
  criterion: string;
  issue:
    | 'vague_description'
    | 'unmeasurable'
    | 'inconsistent_weight'
    | 'missing_levels'
    | 'duplicate_criterion'
    | 'low_discrimination';
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

/**
 * Rubric consistency analysis result
 */
export interface RubricConsistencyResult {
  /** Number of criteria in the rubric */
  criteriaCount: number;
  /** Whether all criteria have quantifiable measures */
  hasQuantifiableMeasures: boolean;
  /** Overall language clarity assessment */
  languageClarity: 'vague' | 'moderate' | 'specific';
  /** Scoring granularity assessment */
  scoringGranularity: 'insufficient' | 'adequate' | 'excellent';
  /** Issues found during validation */
  issues: RubricIssue[];
  /** Matching template ID if rubric matches a known pattern */
  templateMatch?: string;
  /** Overall quality score (0-100) */
  qualityScore: number;
  /** Whether the rubric passes validation */
  isValid: boolean;
}

/**
 * Vague terms that should be avoided in rubrics
 */
const VAGUE_TERMS = [
  'good',
  'well',
  'appropriate',
  'adequate',
  'comprehensive',
  'sufficient',
  'proper',
  'reasonable',
  'suitable',
  'acceptable',
  'satisfactory',
  'nice',
  'okay',
  'fine',
  'decent',
];

/**
 * Measurable language patterns (regex)
 */
const MEASURABLE_PATTERNS = [
  /\d+/, // Numbers (e.g., "3 key points")
  /includes?\s/i, // "includes X"
  /contains?\s/i, // "contains X"
  /addresses?\s/i, // "addresses X"
  /identifies?\s/i, // "identifies X"
  /demonstrates?\s/i, // "demonstrates X"
  /provides?\s/i, // "provides X"
  /lists?\s/i, // "lists X"
  /explains?\s/i, // "explains X"
  /describes?\s/i, // "describes X"
  /all\s/i, // "all requirements"
  /each\s/i, // "each component"
  /no\s+errors?/i, // "no errors"
  /without\s/i, // "without mistakes"
  /correctly/i, // "correctly identifies"
  /accurately/i, // "accurately describes"
];

/**
 * Known rubric templates by domain/type
 */
const RUBRIC_TEMPLATES: Map<
  string,
  { name: string; criteriaNames: string[] }
> = new Map([
  [
    'adverse_event_documentation',
    {
      name: 'Adverse Event Documentation',
      criteriaNames: [
        'Completeness',
        'Accuracy',
        'Regulatory Compliance',
        'Professional Language',
      ],
    },
  ],
  [
    'signal_detection',
    {
      name: 'Signal Detection Analysis',
      criteriaNames: [
        'Statistical Rigor',
        'Clinical Interpretation',
        'Causality Assessment',
        'Recommendations',
      ],
    },
  ],
  [
    'case_narrative',
    {
      name: 'Case Narrative Writing',
      criteriaNames: [
        'Structure',
        'Medical Accuracy',
        'Timeline Clarity',
        'Regulatory Format',
      ],
    },
  ],
]);

/**
 * Validates a synthesis rubric for consistency and measurability
 */
export class RubricValidator {
  /**
   * Validates a synthesis rubric
   */
  validateRubric(
    rubric: RubricCriterion[] | SynthesisConfig['evaluationCriteria'],
    _context: {
      ksbType?: string;
      domainId?: string;
      domainName?: string;
    } = {}
  ): RubricConsistencyResult {
    const issues: RubricIssue[] = [];
    let qualityScore = 100;

    // Normalize rubric to RubricCriterion[]
    const criteria = this.normalizeRubric(rubric);

    if (criteria.length === 0) {
      return {
        criteriaCount: 0,
        hasQuantifiableMeasures: false,
        languageClarity: 'vague',
        scoringGranularity: 'insufficient',
        issues: [
          {
            criterion: 'Overall',
            issue: 'missing_levels',
            severity: 'high',
            suggestion: 'Rubric must have at least one criterion',
          },
        ],
        qualityScore: 0,
        isValid: false,
      };
    }

    // Check 1: Criteria count
    if (criteria.length < 2) {
      issues.push({
        criterion: 'Overall',
        issue: 'missing_levels',
        severity: 'medium',
        suggestion: 'Add more criteria for comprehensive assessment (recommended: 3-5)',
      });
      qualityScore -= 15;
    } else if (criteria.length > 6) {
      issues.push({
        criterion: 'Overall',
        issue: 'missing_levels',
        severity: 'low',
        suggestion: 'Consider consolidating criteria (recommended: 3-5)',
      });
      qualityScore -= 5;
    }

    // Check 2: Weight distribution
    const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      issues.push({
        criterion: 'Overall',
        issue: 'inconsistent_weight',
        severity: 'high',
        suggestion: `Weights sum to ${totalWeight.toFixed(2)}, should sum to 1.0`,
      });
      qualityScore -= 20;
    }

    // Check 3: Duplicate criteria names
    const names = criteria.map((c) => c.name.toLowerCase());
    const duplicates = names.filter((name, idx) => names.indexOf(name) !== idx);
    if (duplicates.length > 0) {
      issues.push({
        criterion: duplicates[0],
        issue: 'duplicate_criterion',
        severity: 'high',
        suggestion: `Remove or rename duplicate criterion: ${duplicates[0]}`,
      });
      qualityScore -= 15;
    }

    // Check 4: Individual criterion validation
    let measurableCount = 0;
    let _clarityScore = 0;

    for (const criterion of criteria) {
      // Check measurability
      const isMeasurable = this.checkMeasurableLanguage(criterion);
      if (isMeasurable) {
        measurableCount++;
        _clarityScore += 1;
      } else {
        issues.push({
          criterion: criterion.name,
          issue: 'unmeasurable',
          severity: 'medium',
          suggestion: `Add specific measures (e.g., "includes 3+ key points" instead of "comprehensive")`,
        });
        qualityScore -= 5;
      }

      // Check for vague language in description
      const vagueInDescription = this.findVagueTerms(criterion.description);
      if (vagueInDescription.length > 0) {
        issues.push({
          criterion: criterion.name,
          issue: 'vague_description',
          severity: 'low',
          suggestion: `Replace vague terms [${vagueInDescription.join(', ')}] with specific language`,
        });
        qualityScore -= 3;
      }

      // Check rubric levels
      const levelIssues = this.validateRubricLevels(criterion);
      issues.push(...levelIssues);
      qualityScore -= levelIssues.length * 3;

      // Check discrimination between levels
      if (!this.hasGoodDiscrimination(criterion)) {
        issues.push({
          criterion: criterion.name,
          issue: 'low_discrimination',
          severity: 'low',
          suggestion: 'Make distinctions between rubric levels more clear and specific',
        });
        qualityScore -= 5;
      }
    }

    // Calculate language clarity
    const clarityRatio = measurableCount / criteria.length;
    const languageClarity: 'vague' | 'moderate' | 'specific' =
      clarityRatio >= 0.8 ? 'specific' : clarityRatio >= 0.5 ? 'moderate' : 'vague';

    // Calculate scoring granularity
    const hasAllLevels = criteria.every(
      (c) => c.rubric?.excellent && c.rubric?.good && c.rubric?.satisfactory
    );
    const scoringGranularity: 'insufficient' | 'adequate' | 'excellent' =
      !hasAllLevels ? 'insufficient' : criteria.length >= 3 ? 'excellent' : 'adequate';

    // Check template match
    const templateMatch = this.findMatchingTemplate(criteria);

    // Ensure score is within bounds
    qualityScore = Math.max(0, Math.min(100, qualityScore));

    const result: RubricConsistencyResult = {
      criteriaCount: criteria.length,
      hasQuantifiableMeasures: measurableCount === criteria.length,
      languageClarity,
      scoringGranularity,
      issues,
      templateMatch,
      qualityScore,
      isValid: qualityScore >= 60 && issues.filter((i) => i.severity === 'high').length === 0,
    };

    log.debug('Rubric validation complete', {
      criteriaCount: result.criteriaCount,
      qualityScore: result.qualityScore,
      issueCount: result.issues.length,
      isValid: result.isValid,
    });

    return result;
  }

  /**
   * Normalizes various rubric formats to standard RubricCriterion[]
   */
  private normalizeRubric(
    rubric: unknown
  ): RubricCriterion[] {
    if (!rubric || !Array.isArray(rubric)) {
      return [];
    }

    return rubric.map((item: unknown) => {
      const criterion = item as Record<string, unknown>;
      return {
        name: String(criterion.name || criterion.criterion || 'Unknown'),
        description: String(criterion.description || ''),
        weight: Number(criterion.weight) || 0.25,
        rubric: {
          excellent: String((criterion.rubric as Record<string, unknown>)?.excellent || ''),
          good: String((criterion.rubric as Record<string, unknown>)?.good || ''),
          satisfactory: String((criterion.rubric as Record<string, unknown>)?.satisfactory || ''),
          needsImprovement: String(
            (criterion.rubric as Record<string, unknown>)?.needsImprovement || ''
          ),
        },
      };
    });
  }

  /**
   * Checks if a criterion has measurable language
   */
  private checkMeasurableLanguage(criterion: RubricCriterion): boolean {
    const textToCheck = [
      criterion.description,
      criterion.rubric.excellent,
      criterion.rubric.good,
    ].join(' ');

    return MEASURABLE_PATTERNS.some((pattern) => pattern.test(textToCheck));
  }

  /**
   * Finds vague terms in text
   */
  private findVagueTerms(text: string): string[] {
    const lowered = text.toLowerCase();
    return VAGUE_TERMS.filter((term) => lowered.includes(term));
  }

  /**
   * Validates rubric level descriptions
   */
  private validateRubricLevels(criterion: RubricCriterion): RubricIssue[] {
    const issues: RubricIssue[] = [];
    const { rubric } = criterion;

    if (!rubric.excellent || rubric.excellent.length < 10) {
      issues.push({
        criterion: criterion.name,
        issue: 'vague_description',
        severity: 'medium',
        suggestion: 'Add detailed description for "excellent" level',
      });
    }

    if (!rubric.needsImprovement || rubric.needsImprovement.length < 10) {
      issues.push({
        criterion: criterion.name,
        issue: 'vague_description',
        severity: 'low',
        suggestion: 'Add detailed description for "needs improvement" level',
      });
    }

    // Check if levels are too similar
    if (
      rubric.excellent &&
      rubric.good &&
      this.textSimilarity(rubric.excellent, rubric.good) > 0.8
    ) {
      issues.push({
        criterion: criterion.name,
        issue: 'low_discrimination',
        severity: 'medium',
        suggestion: '"Excellent" and "Good" descriptions are too similar',
      });
    }

    return issues;
  }

  /**
   * Checks if rubric has good discrimination between levels
   */
  private hasGoodDiscrimination(criterion: RubricCriterion): boolean {
    const { rubric } = criterion;
    if (!rubric.excellent || !rubric.good || !rubric.satisfactory) {
      return false;
    }

    // Check that each level is meaningfully different
    const excellentLen = rubric.excellent.length;
    const goodLen = rubric.good.length;
    const satisfactoryLen = rubric.satisfactory.length;

    // Simple heuristic: longer descriptions at higher levels suggest more detail
    return excellentLen >= goodLen * 0.5 && goodLen >= satisfactoryLen * 0.5;
  }

  /**
   * Simple text similarity using word overlap
   */
  private textSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Finds matching rubric template
   */
  private findMatchingTemplate(
    criteria: RubricCriterion[]
  ): string | undefined {
    const criteriaNames = criteria.map((c) => c.name.toLowerCase());

    for (const [_key, template] of RUBRIC_TEMPLATES) {
      const templateNames = template.criteriaNames.map((n) => n.toLowerCase());
      const matchCount = templateNames.filter((t) =>
        criteriaNames.some((c) => c.includes(t) || t.includes(c))
      ).length;

      if (matchCount >= templateNames.length * 0.6) {
        return template.name;
      }
    }

    return undefined;
  }

  /**
   * Suggests improvements for a rubric
   */
  suggestImprovements(result: RubricConsistencyResult): string[] {
    const suggestions: string[] = [];

    // Priority order based on severity
    const highPriority = result.issues.filter((i) => i.severity === 'high');
    const mediumPriority = result.issues.filter((i) => i.severity === 'medium');

    for (const issue of highPriority) {
      suggestions.push(`🔴 [${issue.criterion}] ${issue.suggestion}`);
    }

    for (const issue of mediumPriority.slice(0, 3)) {
      suggestions.push(`🟡 [${issue.criterion}] ${issue.suggestion}`);
    }

    // General suggestions
    if (result.languageClarity === 'vague') {
      suggestions.push(
        '📝 Add specific numbers and action verbs to all criteria descriptions'
      );
    }

    if (result.scoringGranularity === 'insufficient') {
      suggestions.push(
        '📊 Ensure all criteria have complete rubric levels (excellent, good, satisfactory, needs improvement)'
      );
    }

    if (result.criteriaCount < 3) {
      suggestions.push('➕ Add more evaluation criteria for comprehensive assessment');
    }

    return suggestions;
  }
}

/**
 * Singleton instance
 */
export const rubricValidator = new RubricValidator();
