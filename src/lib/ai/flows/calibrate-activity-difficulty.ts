/**
 * AI-Powered Activity Difficulty Calibration
 *
 * Uses Gemini to analyze generated activities and verify that
 * their difficulty matches the target proficiency level.
 *
 * This prevents activities that are too easy or too hard for
 * the intended learner level.
 *
 * @module ai/flows/calibrate-activity-difficulty
 */

'use server';

import { ai } from '@/lib/ai/genkit';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import type { KSBActivity, ActivityEngineType } from '@/types/alo';

const log = logger.scope('difficulty-calibration');

/**
 * Input for difficulty calibration
 */
export interface DifficultyCalibrationInput {
  /** The generated activity to calibrate */
  activity: KSBActivity;
  /** Target proficiency level (1-5) */
  targetLevel: 1 | 2 | 3 | 4 | 5;
  /** Bloom's taxonomy level */
  bloomLevel: string;
  /** KSB type (knowledge, skill, behavior) */
  ksbType: 'knowledge' | 'skill' | 'behavior';
  /** Activity title for context */
  title: string;
  /** Domain name for context */
  domainName?: string;
}

/**
 * Calibration result schema for Genkit
 */
const DifficultyCalibrationSchema = z.object({
  /** Perceived proficiency level (1-5) */
  perceivedLevel: z.number().min(1).max(5),
  /** How well the activity aligns with target */
  alignment: z.enum(['too_easy', 'appropriate', 'too_hard']),
  /** Specific suggestions for adjusting difficulty */
  adjustmentSuggestions: z.array(z.string()),
  /** Estimated cognitive load */
  cognitiveLoad: z.enum(['low', 'medium', 'high']),
  /** Confidence in this assessment (0-1) */
  confidenceScore: z.number().min(0).max(1),
  /** Specific issues found */
  issues: z.array(
    z.object({
      area: z.string(),
      description: z.string(),
      severity: z.enum(['low', 'medium', 'high']),
    })
  ),
  /** Overall assessment summary */
  summary: z.string(),
});

export type DifficultyCalibration = z.infer<typeof DifficultyCalibrationSchema>;

/**
 * Proficiency level descriptions for the AI
 */
const PROFICIENCY_DESCRIPTIONS: Record<number, string> = {
  1: 'Novice - New to pharmacovigilance, needs step-by-step guidance, basic terminology only',
  2: 'Advanced Beginner - Understands basics, can follow procedures with some supervision',
  3: 'Competent - Works independently on routine tasks, applies knowledge to standard situations',
  4: 'Proficient - Handles complex situations, recognizes patterns, teaches others',
  5: 'Expert - Deep expertise, handles edge cases, innovates and improves processes',
};

/**
 * Engine-specific difficulty factors
 */
const ENGINE_DIFFICULTY_GUIDANCE: Record<ActivityEngineType, string> = {
  red_pen: `
    For Red Pen (error detection):
    - Level 1-2: Obvious errors, clear context, few distractors
    - Level 3: Mix of obvious and subtle errors, realistic context
    - Level 4-5: Subtle errors, ambiguous situations, multiple valid interpretations
  `,
  triage: `
    For Triage (classification):
    - Level 1-2: Clear categories, unambiguous items, immediate feedback
    - Level 3: Some ambiguity, requires reasoning, 3-4 categories
    - Level 4-5: Edge cases, overlapping categories, time pressure, no hints
  `,
  synthesis: `
    For Synthesis (creation):
    - Level 1-2: Clear templates, word count guidance, simple criteria
    - Level 3: Open-ended with structure, multiple aspects to address
    - Level 4-5: Complex scenarios, minimal scaffolding, professional standards
  `,
  calculator: `
    For Calculator (computation):
    - Level 1-2: Simple formulas, given values, step guidance
    - Level 3: Multiple steps, some derivation needed
    - Level 4-5: Complex formulas, clinical interpretation, edge cases
  `,
  timeline: `
    For Timeline (sequencing):
    - Level 1-2: Linear sequences, clear dependencies, few items
    - Level 3: Parallel paths, some ambiguity, 6-10 events
    - Level 4-5: Complex dependencies, concurrent activities, real-world messiness
  `,
  code_playground: `
    For Code Playground:
    - Level 1-2: Simple scripts, clear requirements, templates provided
    - Level 3: Moderate complexity, design choices required
    - Level 4-5: Architecture decisions, optimization, error handling
  `,
};

/**
 * Calibrates an activity's difficulty against target level
 *
 * @param input - Activity and target level information
 * @returns Calibration result with alignment assessment and suggestions
 */
export async function calibrateActivityDifficulty(
  input: DifficultyCalibrationInput
): Promise<DifficultyCalibration> {
  const startTime = Date.now();

  try {
    const engineGuidance =
      ENGINE_DIFFICULTY_GUIDANCE[input.activity.engineType] || '';
    const levelDescription = PROFICIENCY_DESCRIPTIONS[input.targetLevel];

    const prompt = `You are an expert in pharmacovigilance training design and instructional design theory.
Analyze the following activity and determine if its difficulty matches the target proficiency level.

## Target Context
- **Target Proficiency Level**: ${input.targetLevel}/5 - ${levelDescription}
- **Bloom's Taxonomy Level**: ${input.bloomLevel}
- **KSB Type**: ${input.ksbType}
- **Activity Title**: ${input.title}
${input.domainName ? `- **Domain**: ${input.domainName}` : ''}

## Activity Details
- **Engine Type**: ${input.activity.engineType}
- **Instructions**: ${input.activity.instructions}
- **Configuration**: ${JSON.stringify(input.activity.config, null, 2)}

## Engine-Specific Guidance
${engineGuidance}

## Your Task
Evaluate the activity against these criteria:

1. **Cognitive Complexity**: Does the task require the right level of thinking for the target level?
   - Appropriate vocabulary complexity
   - Decision-making complexity
   - Prior knowledge assumptions

2. **Scaffolding**: Is there appropriate support for the target level?
   - Instructions clarity
   - Hints/guidance availability
   - Example quality

3. **Challenge Level**: Is the activity appropriately challenging?
   - Time pressure reasonableness
   - Error tolerance
   - Feedback granularity

4. **Real-World Fidelity**: Does complexity match professional expectations?
   - Scenario realism
   - Edge case handling
   - Professional standards alignment

Provide your assessment with:
- A perceived difficulty level (1-5)
- Whether the activity is too_easy, appropriate, or too_hard
- Specific, actionable suggestions for adjustment if needed
- Confidence in your assessment

Be calibrated: most well-designed activities should be "appropriate". Only flag issues if there's genuine misalignment.`;

    const { output } = await ai.generate({
      prompt,
      output: { schema: DifficultyCalibrationSchema },
      config: {
        temperature: 0.3, // Lower temp for consistent assessment
      },
    });

    if (!output) {
      throw new Error('AI failed to generate calibration output');
    }

    const duration = Date.now() - startTime;
    log.debug('Difficulty calibration complete', {
      title: input.title,
      targetLevel: input.targetLevel,
      perceivedLevel: output.perceivedLevel,
      alignment: output.alignment,
      duration,
    });

    return output;
  } catch (error) {
    log.error('Difficulty calibration failed', { error, title: input.title });

    // Return a safe default on failure
    return {
      perceivedLevel: input.targetLevel,
      alignment: 'appropriate',
      adjustmentSuggestions: [],
      cognitiveLoad: 'medium',
      confidenceScore: 0,
      issues: [
        {
          area: 'Calibration',
          description: 'AI calibration failed, manual review recommended',
          severity: 'medium',
        },
      ],
      summary: 'Calibration could not be completed. Manual review is recommended.',
    };
  }
}

/**
 * Batch calibrate multiple activities
 */
export async function calibrateActivitiesBatch(
  inputs: DifficultyCalibrationInput[]
): Promise<Map<string, DifficultyCalibration>> {
  const results = new Map<string, DifficultyCalibration>();

  // Process in parallel with concurrency limit
  const BATCH_SIZE = 5;
  for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
    const batch = inputs.slice(i, i + BATCH_SIZE);
    const calibrations = await Promise.all(
      batch.map((input) => calibrateActivityDifficulty(input))
    );

    batch.forEach((input, idx) => {
      results.set(input.title, calibrations[idx]);
    });
  }

  return results;
}

/**
 * Quick check if activity likely needs calibration review
 *
 * Uses heuristics before expensive AI call
 */
export function needsCalibrationReview(
  activity: KSBActivity,
  targetLevel: number
): boolean {
  const config = activity.config as unknown as Record<string, unknown>;

  // Check for obvious misalignments
  const instructionLength = activity.instructions.split(' ').length;

  // Too short instructions for high levels
  if (targetLevel >= 4 && instructionLength < 30) {
    return true;
  }

  // Too complex instructions for low levels
  if (targetLevel <= 2 && instructionLength > 100) {
    return true;
  }

  // Engine-specific checks
  switch (activity.engineType) {
    case 'red_pen': {
      const errors = (config.errors as unknown[]) || [];
      // Too few errors for high level
      if (targetLevel >= 4 && errors.length < 5) return true;
      // Too many errors for low level
      if (targetLevel <= 2 && errors.length > 8) return true;
      break;
    }
    case 'triage': {
      const categories = (config.categories as unknown[]) || [];
      const items = (config.items as unknown[]) || [];
      // Complexity mismatch
      if (targetLevel >= 4 && categories.length < 4) return true;
      if (targetLevel <= 2 && items.length > 10) return true;
      break;
    }
    case 'synthesis': {
      const criteria = (config.evaluationCriteria as unknown[]) || [];
      // Too many criteria for low level
      if (targetLevel <= 2 && criteria.length > 4) return true;
      break;
    }
  }

  return false;
}

/**
 * Suggests difficulty adjustments based on calibration result
 */
export function generateAdjustmentPlan(
  calibration: DifficultyCalibration,
  activity: KSBActivity,
  targetLevel: number
): {
  shouldAdjust: boolean;
  priority: 'low' | 'medium' | 'high';
  adjustments: Array<{
    type: 'increase_difficulty' | 'decrease_difficulty' | 'improve_scaffolding' | 'clarify_instructions';
    suggestion: string;
  }>;
} {
  if (calibration.alignment === 'appropriate') {
    return { shouldAdjust: false, priority: 'low', adjustments: [] };
  }

  const levelGap = Math.abs(calibration.perceivedLevel - targetLevel);
  const priority = levelGap >= 2 ? 'high' : levelGap >= 1 ? 'medium' : 'low';

  const adjustments: Array<{
    type: 'increase_difficulty' | 'decrease_difficulty' | 'improve_scaffolding' | 'clarify_instructions';
    suggestion: string;
  }> = [];

  if (calibration.alignment === 'too_easy') {
    adjustments.push({
      type: 'increase_difficulty',
      suggestion: calibration.adjustmentSuggestions[0] || 'Add more complex scenarios',
    });
  } else if (calibration.alignment === 'too_hard') {
    adjustments.push({
      type: 'decrease_difficulty',
      suggestion: calibration.adjustmentSuggestions[0] || 'Simplify requirements',
    });

    if (calibration.cognitiveLoad === 'high') {
      adjustments.push({
        type: 'improve_scaffolding',
        suggestion: 'Add step-by-step guidance or hints',
      });
    }
  }

  // Add instruction clarity if confidence is low
  if (calibration.confidenceScore < 0.6) {
    adjustments.push({
      type: 'clarify_instructions',
      suggestion: 'Make instructions more explicit and structured',
    });
  }

  return {
    shouldAdjust: true,
    priority,
    adjustments,
  };
}
