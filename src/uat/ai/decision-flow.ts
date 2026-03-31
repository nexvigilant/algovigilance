/**
 * AI Decision Flow
 *
 * Genkit flow for AI-driven decision making in UAT agents.
 * Uses the existing Genkit infrastructure with Gemini.
 */

import { ai } from '@/lib/ai/genkit';
import { z } from 'zod';
import type { PageContext, InteractiveElement } from '../context/page-analyzer';
import type { PersonaConfig } from '../config';
import type { ActionRecord } from '../agents/base-agent';

// ============================================================================
// Schemas
// ============================================================================

const ActionTypeSchema = z.enum([
  'click',
  'fill',
  'select',
  'navigate',
  'scroll',
  'wait',
  'screenshot',
  'assert',
  'complete',
]);

const _AgentDecisionInputSchema = z.object({
  persona: z.object({
    id: z.string(),
    name: z.string(),
    goals: z.array(z.string()),
    explorationDepth: z.enum(['shallow', 'medium', 'deep']),
  }),
  pageContext: z.object({
    url: z.string(),
    title: z.string(),
    heading: z.string(),
    visibleElements: z.array(
      z.object({
        selector: z.string(),
        type: z.string(),
        text: z.string(),
        isEnabled: z.boolean(),
      })
    ),
    formFields: z.array(z.string()).optional(),
    errorMessages: z.array(z.string()),
    hasLoadingIndicator: z.boolean(),
  }),
  sessionHistory: z.array(
    z.object({
      action: z.string(),
      target: z.string().optional(),
      result: z.string(),
    })
  ),
  remainingGoals: z.array(z.string()),
  currentGoal: z.string().optional(),
  actionsRemaining: z.number(),
});

const AgentDecisionOutputSchema = z.object({
  nextAction: z.object({
    type: ActionTypeSchema,
    target: z.string().optional(),
    value: z.string().optional(),
    reasoning: z.string(),
  }),
  confidenceScore: z.number().min(0).max(1),
  detectedIssues: z.array(
    z.object({
      type: z.enum(['ui', 'ux', 'functional', 'accessibility', 'performance']),
      severity: z.enum(['critical', 'high', 'medium', 'low']),
      description: z.string(),
    })
  ),
  goalProgress: z.string().optional(),
  shouldContinue: z.boolean(),
});

// ============================================================================
// Types
// ============================================================================

export type AgentDecisionInput = z.infer<typeof _AgentDecisionInputSchema>;
export type AgentDecisionOutput = z.infer<typeof AgentDecisionOutputSchema>;

// ============================================================================
// Prompt Builder
// ============================================================================

function buildDecisionPrompt(input: AgentDecisionInput): string {
  const recentActions = input.sessionHistory.slice(-5);
  const elementsPreview = input.pageContext.visibleElements
    .slice(0, 15)
    .map((e) => `- [${e.type}] "${e.text.slice(0, 50)}" (${e.selector})`)
    .join('\n');

  return `You are a UAT (User Acceptance Testing) agent named "${input.persona.name}" testing a web application.

## Your Persona
- ID: ${input.persona.id}
- Exploration Depth: ${input.persona.explorationDepth}
- Goals: ${input.persona.goals.join(', ')}

## Current Page State
- URL: ${input.pageContext.url}
- Title: ${input.pageContext.title}
- Heading: ${input.pageContext.heading}
- Loading: ${input.pageContext.hasLoadingIndicator ? 'Yes' : 'No'}
${input.pageContext.errorMessages.length > 0 ? `- Errors: ${input.pageContext.errorMessages.join(', ')}` : ''}

## Available Interactive Elements
${elementsPreview}

## Recent Actions
${recentActions.map((a) => `- ${a.action}${a.target ? ` on "${a.target}"` : ''} → ${a.result}`).join('\n') || 'None yet'}

## Remaining Goals
${input.remainingGoals.map((g, i) => `${i + 1}. ${g}`).join('\n')}

## Current Focus
${input.currentGoal || 'No specific goal - explore freely'}

## Constraints
- Actions remaining: ${input.actionsRemaining}
- You must choose actions that progress toward goals
- Detect any UI, UX, or functional issues you observe
- If the page has errors, report them as issues

## Decision Required
Decide the next action to take. Consider:
1. What element should be interacted with?
2. Does this action progress toward a goal?
3. Are there any visible issues to report?
4. Should testing continue or complete?

Return a JSON object with your decision.`;
}

// ============================================================================
// Decision Flow
// ============================================================================

/**
 * Make an AI-driven decision about the next action
 */
export async function makeAgentDecision(input: AgentDecisionInput): Promise<AgentDecisionOutput> {
  const prompt = buildDecisionPrompt(input);

  const response = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt,
    output: { schema: AgentDecisionOutputSchema },
    config: {
      temperature: 0.3, // Some creativity, mostly deterministic
    },
  });

  const result = response.output;

  if (!result) {
    // Fallback decision if AI fails
    return {
      nextAction: {
        type: 'complete',
        reasoning: 'AI decision failed, ending session',
      },
      confidenceScore: 0,
      detectedIssues: [],
      shouldContinue: false,
    };
  }

  return result;
}

/**
 * Quick analysis of page for issues
 */
export async function analyzePageForIssues(
  pageContext: PageContext
): Promise<{ issues: AgentDecisionOutput['detectedIssues']; suggestions: string[] }> {
  const prompt = `Analyze this page state for UI/UX issues:

URL: ${pageContext.url}
Title: ${pageContext.title}
Heading: ${pageContext.heading}
Error Messages: ${pageContext.errorMessages.join(', ') || 'None'}
Alerts: ${pageContext.alerts.join(', ') || 'None'}
Loading Indicators: ${pageContext.loadingIndicators}
Forms with Errors: ${pageContext.forms.filter((f) => f.hasErrors).length}

Report any issues found and suggest improvements.`;

  const AnalysisSchema = z.object({
    issues: z.array(
      z.object({
        type: z.enum(['ui', 'ux', 'functional', 'accessibility', 'performance']),
        severity: z.enum(['critical', 'high', 'medium', 'low']),
        description: z.string(),
      })
    ),
    suggestions: z.array(z.string()),
  });

  const response = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt,
    output: { schema: AnalysisSchema },
    config: { temperature: 0.2 },
  });

  return response.output || { issues: [], suggestions: [] };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert page context to input format for AI
 */
export function prepareDecisionInput(params: {
  persona: PersonaConfig;
  pageContext: PageContext;
  actionHistory: ActionRecord[];
  remainingGoals: string[];
  currentGoal?: string;
  actionsRemaining: number;
}): AgentDecisionInput {
  return {
    persona: {
      id: params.persona.id,
      name: params.persona.name,
      goals: params.persona.goals,
      explorationDepth: params.persona.behaviorProfile.explorationDepth,
    },
    pageContext: {
      url: params.pageContext.url,
      title: params.pageContext.title,
      heading: params.pageContext.heading,
      visibleElements: params.pageContext.visibleElements.map((e) => ({
        selector: e.selector,
        type: e.type,
        text: e.text,
        isEnabled: e.isEnabled,
      })),
      formFields: params.pageContext.forms.flatMap((f) => f.fields.map((field) => field.label || field.name)),
      errorMessages: params.pageContext.errorMessages,
      hasLoadingIndicator: params.pageContext.loadingIndicators > 0,
    },
    sessionHistory: params.actionHistory.slice(-10).map((a) => ({
      action: a.action,
      target: a.target,
      result: a.result,
    })),
    remainingGoals: params.remainingGoals,
    currentGoal: params.currentGoal,
    actionsRemaining: params.actionsRemaining,
  };
}

/**
 * Validate that an action target exists on the page
 */
export function validateActionTarget(
  action: AgentDecisionOutput['nextAction'],
  pageContext: PageContext
): boolean {
  if (!action.target) return true; // No target needed

  // Check if target matches any visible element
  return pageContext.visibleElements.some(
    (e) =>
      e.selector === action.target ||
      e.text.toLowerCase().includes((action.target ?? '').toLowerCase()) ||
      e.testId === action.target
  );
}

/**
 * Suggest alternative targets if the chosen one isn't valid
 */
export function suggestAlternativeTargets(
  actionType: string,
  pageContext: PageContext
): InteractiveElement[] {
  const typeMap: Record<string, InteractiveElement['type'][]> = {
    click: ['button', 'link'],
    fill: ['input', 'textarea'],
    select: ['select'],
  };

  const validTypes = typeMap[actionType] || [];

  return pageContext.visibleElements
    .filter((e) => validTypes.includes(e.type) && e.isEnabled)
    .slice(0, 5);
}
