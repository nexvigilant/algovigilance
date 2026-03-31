/**
 * Quality Score Predictor for ALO Manufacturing Pipeline
 *
 * Predicts quality scores BEFORE generation to prevent wasted API calls.
 * Uses heuristics based on input characteristics that correlate with
 * low-quality outputs.
 *
 * @module lib/manufacturing/quality-predictor
 */

import { ActivityEngineMapper, type BloomLevel } from './engine-mapper';
import type { ALOGenerationInput } from '@/lib/ai/flows/generate-alo-content';

/**
 * Risk factor identified during prediction
 */
export interface RiskFactor {
  factor:
    | 'low_description_length'
    | 'vague_keywords'
    | 'complex_bloom_mismatch'
    | 'engine_type_mismatch'
    | 'missing_keywords'
    | 'low_specificity'
    | 'proficiency_bloom_gap';
  severity: 'low' | 'medium' | 'high';
  impact: number; // Estimated points deduction
  suggestion: string;
}

/**
 * Quality prediction result
 */
export interface QualityPrediction {
  predictedScore: number; // 0-100
  confidence: number; // 0-1
  riskFactors: RiskFactor[];
  recommendation: 'proceed' | 'adjust_input' | 'skip' | 'enhance_first';
  adjustments?: InputAdjustment[];
}

/**
 * Suggested automatic adjustment to input
 */
export interface InputAdjustment {
  field: string;
  currentValue: unknown;
  suggestedValue: unknown;
  reason: string;
}

/**
 * Bloom level numeric mapping for calculations
 */
const BLOOM_LEVEL_MAP: Record<string, number> = {
  remember: 1,
  understand: 2,
  apply: 3,
  analyze: 4,
  evaluate: 5,
  create: 6,
};

/**
 * Vague keywords that correlate with poor hook engagement
 */
const VAGUE_KEYWORDS = [
  'understand',
  'know',
  'learn',
  'basic',
  'general',
  'overview',
  'introduction',
  'fundamental',
  'core',
  'essential',
  'important',
];

/**
 * Strong action verbs that correlate with high-quality content
 */
const STRONG_ACTION_VERBS = [
  'analyze',
  'evaluate',
  'design',
  'implement',
  'investigate',
  'assess',
  'categorize',
  'distinguish',
  'compare',
  'synthesize',
  'formulate',
  'construct',
  'detect',
  'identify',
  'classify',
  'report',
  'document',
  'verify',
];

/**
 * Quality Score Predictor
 *
 * Analyzes ALO generation inputs to predict quality before generation,
 * saving API costs on likely-to-fail generations.
 */
export class QualityPredictor {
  private readonly descriptionMinWords = 20;
  private readonly keywordMinCount = 3;
  private readonly proficiencyBloomMaxGap = 2;

  /**
   * Predicts quality score before generation using heuristics
   */
  predictQuality(input: ALOGenerationInput): QualityPrediction {
    const riskFactors: RiskFactor[] = [];
    const adjustments: InputAdjustment[] = [];
    let predictedScore = 100;

    // Risk 1: Short description (correlates with vague concept generation)
    const descriptionWords = input.ksbEntry.description.trim().split(/\s+/).length;
    if (descriptionWords < this.descriptionMinWords) {
      riskFactors.push({
        factor: 'low_description_length',
        severity: descriptionWords < 10 ? 'high' : 'medium',
        impact: descriptionWords < 10 ? -20 : -15,
        suggestion: `Description has ${descriptionWords} words. Enrich to 20+ words for better concept generation.`,
      });
      predictedScore -= descriptionWords < 10 ? 20 : 15;
    }

    // Risk 2: Vague keywords (correlates with poor hook engagement)
    const vagueKeywords = (input.ksbEntry.keywords || []).filter((k) =>
      VAGUE_KEYWORDS.includes(k.toLowerCase())
    );
    if (vagueKeywords.length > 0) {
      riskFactors.push({
        factor: 'vague_keywords',
        severity: vagueKeywords.length > 2 ? 'medium' : 'low',
        impact: -3 * vagueKeywords.length,
        suggestion: `Replace vague keywords [${vagueKeywords.join(', ')}] with specific PV terminology.`,
      });
      predictedScore -= 3 * vagueKeywords.length;
    }

    // Risk 3: Missing keywords
    if (!input.ksbEntry.keywords || input.ksbEntry.keywords.length < this.keywordMinCount) {
      riskFactors.push({
        factor: 'missing_keywords',
        severity: 'medium',
        impact: -10,
        suggestion: `Only ${input.ksbEntry.keywords?.length || 0} keywords. Add at least 3 specific keywords.`,
      });
      predictedScore -= 10;
    }

    // Risk 4: Bloom level mismatch with proficiency level
    const bloomLevelNum = this.bloomToNumber(input.bloomLevel || 'understand');
    const proficiencyNum = parseInt(input.proficiencyLevel?.replace('L', '') || '2', 10);
    const levelGap = Math.abs(bloomLevelNum - proficiencyNum);

    if (levelGap > this.proficiencyBloomMaxGap) {
      riskFactors.push({
        factor: 'proficiency_bloom_gap',
        severity: 'high',
        impact: -20,
        suggestion: `Bloom level "${input.bloomLevel}" (${bloomLevelNum}) misaligned with proficiency "${input.proficiencyLevel}" (${proficiencyNum}). Gap: ${levelGap}`,
      });
      predictedScore -= 20;

      // Suggest adjustment
      const suggestedBloom = this.numberToBloom(proficiencyNum);
      adjustments.push({
        field: 'bloomLevel',
        currentValue: input.bloomLevel,
        suggestedValue: suggestedBloom,
        reason: 'Align Bloom level with proficiency level',
      });
    }

    // Risk 5: Engine type mismatch (e.g., calculator for behavior KSB)
    const appropriateEngine = ActivityEngineMapper.suggestEngine({
      type: input.ksbType,
      bloomLevel: input.bloomLevel || 'understand',
      title: input.ksbEntry.title,
      description: input.ksbEntry.description,
    });

    // Note: Excluding code_playground from comparison as it's not yet supported
    const supportedEngines = ['red_pen', 'triage', 'synthesis', 'calculator', 'timeline'];
    const normalizedSuggested = supportedEngines.includes(appropriateEngine)
      ? appropriateEngine
      : 'synthesis';

    if (normalizedSuggested !== input.activityEngineType) {
      riskFactors.push({
        factor: 'engine_type_mismatch',
        severity: 'medium',
        impact: -12,
        suggestion: `Consider "${normalizedSuggested}" instead of "${input.activityEngineType}" for ${input.ksbType} at ${input.bloomLevel} level.`,
      });
      predictedScore -= 12;

      adjustments.push({
        field: 'activityEngineType',
        currentValue: input.activityEngineType,
        suggestedValue: normalizedSuggested,
        reason: `Better engine match for ${input.ksbType} KSB`,
      });
    }

    // Risk 6: Low specificity in title/description
    const hasActionVerbs = STRONG_ACTION_VERBS.some(
      (verb) =>
        input.ksbEntry.title.toLowerCase().includes(verb) ||
        input.ksbEntry.description.toLowerCase().includes(verb)
    );
    if (!hasActionVerbs) {
      riskFactors.push({
        factor: 'low_specificity',
        severity: 'low',
        impact: -8,
        suggestion:
          'Add specific action verbs (analyze, evaluate, detect, classify) to title or description.',
      });
      predictedScore -= 8;
    }

    // Determine recommendation
    let recommendation: QualityPrediction['recommendation'] = 'proceed';
    if (predictedScore < 40) {
      recommendation = 'skip';
    } else if (predictedScore < 60) {
      recommendation = adjustments.length > 0 ? 'adjust_input' : 'enhance_first';
    } else if (predictedScore < 75 && adjustments.length > 0) {
      recommendation = 'adjust_input';
    }

    // Calculate confidence (lower with more risk factors)
    const confidence = Math.max(0.3, 0.95 - riskFactors.length * 0.1);

    return {
      predictedScore: Math.max(0, Math.min(100, predictedScore)),
      confidence,
      riskFactors,
      recommendation,
      adjustments: adjustments.length > 0 ? adjustments : undefined,
    };
  }

  /**
   * Applies recommended adjustments to input
   */
  applyAdjustments(
    input: ALOGenerationInput,
    prediction: QualityPrediction
  ): ALOGenerationInput {
    if (!prediction.adjustments || prediction.adjustments.length === 0) {
      return input;
    }

    const adjusted = { ...input };

    for (const adjustment of prediction.adjustments) {
      switch (adjustment.field) {
        case 'bloomLevel':
          adjusted.bloomLevel = adjustment.suggestedValue as string;
          break;
        case 'activityEngineType':
          adjusted.activityEngineType = adjustment.suggestedValue as typeof adjusted.activityEngineType;
          break;
      }
    }

    return adjusted;
  }

  /**
   * Converts Bloom level string to numeric value
   */
  private bloomToNumber(level: string): number {
    return BLOOM_LEVEL_MAP[level.toLowerCase()] || 3;
  }

  /**
   * Converts numeric value back to Bloom level string
   */
  private numberToBloom(num: number): BloomLevel {
    const clamped = Math.max(1, Math.min(6, num));
    const mapping: Record<number, BloomLevel> = {
      1: 'remember',
      2: 'understand',
      3: 'apply',
      4: 'analyze',
      5: 'evaluate',
      6: 'create',
    };
    return mapping[clamped];
  }

  /**
   * Batch prediction for multiple inputs
   */
  predictBatch(inputs: ALOGenerationInput[]): Map<string, QualityPrediction> {
    const results = new Map<string, QualityPrediction>();

    for (const input of inputs) {
      results.set(input.ksbEntry.id, this.predictQuality(input));
    }

    return results;
  }

  /**
   * Filters inputs based on prediction, returning only those worth generating
   */
  filterViableInputs(
    inputs: ALOGenerationInput[],
    options: {
      minScore?: number;
      allowAdjustments?: boolean;
    } = {}
  ): {
    viable: ALOGenerationInput[];
    skipped: Array<{ input: ALOGenerationInput; prediction: QualityPrediction }>;
    adjusted: Array<{ original: ALOGenerationInput; adjusted: ALOGenerationInput }>;
  } {
    const minScore = options.minScore ?? 50;
    const allowAdjustments = options.allowAdjustments ?? true;

    const viable: ALOGenerationInput[] = [];
    const skipped: Array<{ input: ALOGenerationInput; prediction: QualityPrediction }> = [];
    const adjusted: Array<{ original: ALOGenerationInput; adjusted: ALOGenerationInput }> = [];

    for (const input of inputs) {
      const prediction = this.predictQuality(input);

      if (prediction.recommendation === 'skip' || prediction.predictedScore < minScore) {
        skipped.push({ input, prediction });
        continue;
      }

      if (
        allowAdjustments &&
        prediction.recommendation === 'adjust_input' &&
        prediction.adjustments
      ) {
        const adjustedInput = this.applyAdjustments(input, prediction);
        viable.push(adjustedInput);
        adjusted.push({ original: input, adjusted: adjustedInput });
      } else {
        viable.push(input);
      }
    }

    return { viable, skipped, adjusted };
  }
}

/**
 * Singleton instance for convenience
 */
export const qualityPredictor = new QualityPredictor();
