'use server';

import { ai } from '@/lib/ai/genkit';
import { z } from 'zod';
import type { SynthesisConfig, AIEvaluation } from '@/types/pv-curriculum';

import { logger } from '@/lib/logger';
const log = logger.scope('flows/evaluate-synthesis');

// ============================================================================
// Schemas
// ============================================================================

const CriterionScoreSchema = z.object({
  criterion: z.string(),
  score: z.number().min(0).max(100),
  feedback: z.string(),
});

const EvaluationResponseSchema = z.object({
  overallScore: z.number().min(0).max(100),
  criteriaScores: z.array(CriterionScoreSchema),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
});

// ============================================================================
// Evaluation Flow
// ============================================================================

export async function evaluateSynthesis(
  userResponse: string,
  config: SynthesisConfig
): Promise<AIEvaluation> {
  const criteriaDescription = config.evaluationCriteria
    .map(
      (c) =>
        `- ${c.name} (weight: ${(c.weight * 100).toFixed(0)}%): ${c.description}\n` +
        `  Excellent: ${c.rubric.excellent}\n` +
        `  Good: ${c.rubric.good}\n` +
        `  Needs Improvement: ${c.rubric.needsImprovement}`
    )
    .join('\n\n');

  const constraintsDescription = config.constraints
    .map((c) => `- [${c.required ? 'Required' : 'Optional'}] ${c.type}: ${c.description}`)
    .join('\n');

  const prompt = `You are an expert evaluator for pharmacovigilance professional development. Evaluate the following user response based on the provided criteria.

## Task Prompt
${config.prompt}

## Expected Output Format
${config.outputFormat}

## Constraints
${constraintsDescription}

${config.exampleOutput ? `## Example Output\n${config.exampleOutput}` : ''}

## Evaluation Criteria
${criteriaDescription}

## User Response
${userResponse}

## Instructions
Evaluate the user's response against each criterion. Provide:
1. A score (0-100) for each criterion
2. Specific feedback for each criterion
3. Overall strengths (2-3 points)
4. Areas for improvement (2-3 points)
5. Calculate an overall weighted score

Be constructive and professional. Focus on helping the learner improve their pharmacovigilance skills.`;

  try {
    const { output } = await ai.generate({
      prompt,
      output: { schema: EvaluationResponseSchema },
      config: {
        temperature: 0.3, // Lower temperature for more consistent evaluation
      },
    });

    if (!output) {
      throw new Error('No output from AI evaluation');
    }

    return {
      overallScore: output.overallScore,
      criteriaScores: output.criteriaScores,
      strengths: output.strengths,
      improvements: output.improvements,
      modelUsed: 'googleai/gemini-2.5-flash',
      evaluatedAt: new Date(),
    };
  } catch (error) {
    log.error('Synthesis evaluation error:', error);
    throw new Error('Failed to evaluate synthesis response');
  }
}
