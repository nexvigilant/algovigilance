'use server';

import { ai } from '@/lib/ai/genkit';
import { z } from 'zod';

import { logger } from '@/lib/logger';
const log = logger.scope('ai/flows/generate-alo-content');
import type {
  KSBHook,
  KSBConcept,
  KSBActivity,
  KSBReflection,
  KSBActivityMetadata,
  RedPenConfig,
  TriageConfig,
  SynthesisConfig,
  CalculatorConfig,
  TimelineConfig,
  AuthorityLevel,
} from '@/types/pv-curriculum';
import type { KSBLibraryEntry, EnhancedCitation } from '@/lib/actions/ksb-builder';

// ============================================================================
// Schemas
// ============================================================================

const HookSchema = z.object({
  content: z.string(),
  scenarioType: z.enum(['real_world', 'case_study', 'challenge', 'question']),
});

const ExampleSchema = z.object({
  title: z.string(),
  content: z.string(),
  context: z.string().optional(),
});

const ResourceSchema = z.object({
  title: z.string(),
  url: z.string(),
  type: z.enum(['article', 'video', 'document', 'tool', 'reference']),
});

const ConceptSchema = z.object({
  content: z.string(),
  keyPoints: z.array(z.string()),
  examples: z.array(ExampleSchema),
  resources: z.array(ResourceSchema).optional(),
});

const RedPenErrorSchema = z.object({
  id: z.string(),
  location: z.string(),
  errorType: z.enum(['factual', 'procedural', 'regulatory', 'terminology', 'completeness', 'formatting']),
  severity: z.enum(['critical', 'major', 'minor']),
  explanation: z.string(),
  correctVersion: z.string().optional(),
});

const TriageOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
});

const TriageDecisionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  options: z.array(TriageOptionSchema),
  correctOptionId: z.string(),
  rationale: z.string(),
  followUp: z.string().optional(),
});

const SynthesisConstraintSchema = z.object({
  type: z.enum(['include', 'exclude', 'format', 'length', 'terminology']),
  description: z.string(),
  required: z.boolean(),
});

const SynthesisCriterionSchema = z.object({
  name: z.string(),
  description: z.string(),
  weight: z.number(),
  rubric: z.object({
    excellent: z.string(),
    good: z.string(),
    needsImprovement: z.string(),
  }),
});

const PortfolioArtifactConfigSchema = z.object({
  title: z.string(),
  description: z.string(),
  competencyTags: z.array(z.string()),
  artifactType: z.enum(['completion', 'creation', 'analysis', 'decision_log']),
});

const ReflectionSchema = z.object({
  prompt: z.string(),
  portfolioArtifact: PortfolioArtifactConfigSchema,
});

const MetadataSchema = z.object({
  version: z.string(),
  estimatedMinutes: z.number(),
  difficulty: z.enum(['foundational', 'intermediate', 'advanced']),
  prerequisites: z.array(z.string()),
  tags: z.array(z.string()),
});

// ============================================================================
// Generation Input
// ============================================================================

export interface ALOGenerationInput {
  ksbEntry: KSBLibraryEntry;
  domainId: string;
  domainName: string;
  ksbType: 'knowledge' | 'skill' | 'behavior' | 'ai_integration';
  proficiencyLevel: string;
  bloomLevel: string;
  activityEngineType: 'red_pen' | 'triage' | 'synthesis' | 'calculator' | 'timeline';
  contextualInfo?: string;

  // Enhanced research context (Phase 2)
  enhancedContext?: {
    // Full citation details for in-content references
    citations?: EnhancedCitation[];

    // Authority level for tone calibration
    authorityLevel?: AuthorityLevel;

    // Regulatory context
    regulatoryContext?: {
      primaryRegion: string;
      guidelines: string[];
      regionalVariations?: string[];
    };

    // Coverage indicators for content hints
    coverageAreas?: {
      definition: boolean;
      regulations: boolean;
      bestPractices: boolean;
      examples: boolean;
      assessmentCriteria: boolean;
    };

    // Data source indicator
    dataSource: 'research_data' | 'ksb_library' | 'basic_fields';
  };
}

// Helper to format citations for prompts with fallback messaging
function formatCitationsForPrompt(citations: EnhancedCitation[] | undefined): string {
  if (!citations || citations.length === 0) {
    return '(No specific research sources provided - use established regulatory guidance and industry standards)';
  }

  // Sort by relevance score (highest first)
  const sorted = [...citations].sort((a, b) => b.relevanceScore - a.relevanceScore);

  return sorted.map(c => {
    const id = c.identifier ? `[${c.identifier}]` : '';
    const section = c.section ? ` (${c.section})` : '';
    return `- ${c.title}${id}${section} - ${c.source} (Relevance: ${c.relevanceScore}/5)`;
  }).join('\n');
}

// Default regulatory context when none is provided
const DEFAULT_REGULATORY_CONTEXT = {
  primaryRegion: 'Global (ICH)',
  guidelines: ['ICH E2A', 'ICH E2B(R3)', 'ICH E2C(R2)', 'ICH E2D', 'ICH E2E'],
  regionalVariations: ['FDA 21 CFR 314.80/600.80', 'EMA Volume 9A', 'PMDA GPSP'],
};

// Helper to get regulatory section with fallback
function formatRegulatoryContext(
  regulatoryContext: ALOGenerationInput['enhancedContext'],
  domainName: string
): string {
  // If enhanced context exists with regulatory info, use it
  if (regulatoryContext?.regulatoryContext) {
    const ctx = regulatoryContext.regulatoryContext;
    return `\n## Regulatory Context
- Primary Region: ${ctx.primaryRegion}
- Applicable Guidelines: ${ctx.guidelines.join(', ')}${
      ctx.regionalVariations?.length
        ? `\n- Regional Variations: ${ctx.regionalVariations.join('; ')}`
        : ''
    }`;
  }

  // Otherwise, provide default regulatory context with a note
  return `\n## Regulatory Context (Default - Domain: ${domainName})
- Primary Framework: ICH Pharmacovigilance Guidelines
- Key References: ${DEFAULT_REGULATORY_CONTEXT.guidelines.join(', ')}
- Regional Considerations: ${DEFAULT_REGULATORY_CONTEXT.regionalVariations.join(', ')}
- Note: Specific regulatory context was not provided - use general PV regulatory principles`;
}

// Helper to get authority tone guidance with fallback
function getAuthorityToneGuidance(level?: AuthorityLevel): string {
  // Default professional tone when no authority level specified
  const DEFAULT_TONE = 'Use professional, authoritative language appropriate for pharmacovigilance professionals. Balance regulatory requirements with practical guidance. When citing requirements, be specific about sources (e.g., "per ICH E2A", "as required by FDA regulations").';

  if (!level) return DEFAULT_TONE;

  const guidance: Record<AuthorityLevel, string> = {
    regulatory: 'Use definitive language. This is regulatory requirement - use "must", "shall", "required".',
    guidance: 'Use authoritative language. This is official guidance - use "should", "recommended", "expected".',
    industry_standard: 'Use confident language. This is accepted practice - use "typically", "standard practice", "commonly".',
    peer_reviewed: 'Use evidence-based language. Cite the research - use "studies show", "evidence suggests", "research indicates".',
    expert_opinion: 'Use qualified language. This is expert consensus - use "generally accepted", "experts recommend", "best practice suggests".',
    internal: 'Use organizational language. This is internal guidance - use "our approach", "company standard", "internal requirement".',
  };

  return guidance[level];
}

// Helper to format coverage gaps
function formatCoverageHints(coverageAreas?: ALOGenerationInput['enhancedContext']): string {
  if (!coverageAreas?.coverageAreas) return '';

  const { definition, regulations, bestPractices, examples, assessmentCriteria } = coverageAreas.coverageAreas;
  const hints: string[] = [];

  if (!definition) hints.push('Core definition needs emphasis');
  if (!regulations) hints.push('Regulatory requirements not fully documented - be cautious with compliance claims');
  if (!bestPractices) hints.push('Best practices not documented - focus on fundamentals');
  if (!examples) hints.push('Limited examples available - create realistic scenarios');
  if (!assessmentCriteria) hints.push('Assessment criteria unclear - define success measures');

  return hints.length > 0 ? `\nContent Hints:\n${hints.map(h => `- ${h}`).join('\n')}` : '';
}

// ============================================================================
// Generate Hook
// ============================================================================

export async function generateHook(input: ALOGenerationInput): Promise<KSBHook> {
  const prompt = `You are an expert instructional designer for pharmacovigilance professional development. Generate a compelling 30-second hook that immediately engages the learner.

## KSB Information
- Title: ${input.ksbEntry.title}
- Description: ${input.ksbEntry.description}
- Type: ${input.ksbType}
- Domain: ${input.domainName}
- Proficiency Level: ${input.proficiencyLevel}
- Bloom's Level: ${input.bloomLevel}
- Keywords: ${input.ksbEntry.keywords.join(', ')}
${input.contextualInfo ? `- Research Context: ${input.contextualInfo}` : ''}

## Requirements
- Create a hook that takes 30 seconds to read
- Make it immediately relevant to PV professionals
- Use one of these approaches:
  - real_world: A specific real-world scenario they might face
  - case_study: A brief case that illustrates the importance
  - challenge: A provocative challenge or problem
  - question: A thought-provoking question

The hook should:
- Create urgency or curiosity
- Connect to their daily work
- Lead naturally into the concept section`;

  const { output } = await ai.generate({
    prompt,
    output: { schema: HookSchema },
    config: { temperature: 0.7 },
  });

  if (!output) throw new Error('Failed to generate hook');
  return output;
}

// ============================================================================
// Generate Concept
// ============================================================================

export async function generateConcept(input: ALOGenerationInput): Promise<KSBConcept> {
  // Build enhanced sections with fallbacks for missing data
  const citationsSection = `\n## Available Sources\n${formatCitationsForPrompt(input.enhancedContext?.citations)}`;

  const toneGuidance = getAuthorityToneGuidance(input.enhancedContext?.authorityLevel);

  // Use the new fallback-aware regulatory context formatter
  const regulatorySection = formatRegulatoryContext(input.enhancedContext, input.domainName);

  const coverageHints = formatCoverageHints(input.enhancedContext);

  const prompt = `You are an expert in pharmacovigilance education. Generate a 2-minute concept section that delivers high-density, actionable information.

## KSB Information
- Title: ${input.ksbEntry.title}
- Description: ${input.ksbEntry.description}
- Type: ${input.ksbType}
- Domain: ${input.domainName}
- Proficiency Level: ${input.proficiencyLevel}
- Bloom's Level: ${input.bloomLevel}
- Keywords: ${input.ksbEntry.keywords.join(', ')}
- Data Source: ${input.enhancedContext?.dataSource || 'basic_fields'}
${citationsSection}${regulatorySection}${coverageHints}

## Tone Guidance
${toneGuidance}

## Requirements
Generate:
1. Main content (300-400 words) explaining the concept
2. 3-5 key points that summarize essential knowledge
3. 2-3 practical examples with context
4. 2-3 recommended resources (prioritize provided sources if available, otherwise use real regulatory guidance)

The content should:
- Be precise and professional
- Use the tone guidance provided above
- Reference specific guidelines/regulations when available (e.g., "per ICH E2A Section 3.2")
- Include regional variations if provided
- Provide immediately applicable information
- Avoid fluff or unnecessary padding`;

  const { output } = await ai.generate({
    prompt,
    output: { schema: ConceptSchema },
    config: { temperature: 0.5 },
  });

  if (!output) throw new Error('Failed to generate concept');
  return output;
}

// ============================================================================
// Generate Activity
// ============================================================================

export async function generateActivity(
  input: ALOGenerationInput
): Promise<KSBActivity> {
  const enginePrompts = {
    red_pen: generateRedPenActivity,
    triage: generateTriageActivity,
    synthesis: generateSynthesisActivity,
    calculator: generateCalculatorActivity,
    timeline: generateTimelineActivity,
  };

  return enginePrompts[input.activityEngineType](input);
}

async function generateRedPenActivity(input: ALOGenerationInput): Promise<KSBActivity> {
  const RedPenConfigSchema = z.object({
    documentContent: z.string(),
    documentType: z.enum(['case_narrative', 'safety_report', 'regulatory_submission', 'sop', 'protocol']),
    errors: z.array(RedPenErrorSchema),
    passingScore: z.number(),
    feedbackOnMiss: z.boolean(),
  });

  const prompt = `Generate a Red Pen (error detection) activity for pharmacovigilance training.

## KSB: ${input.ksbEntry.title}
Description: ${input.ksbEntry.description}
Level: ${input.proficiencyLevel}

## Requirements
Create a document (300-500 words) with 5-8 intentional errors that test this KSB.
Include a mix of:
- Critical errors (must catch)
- Major errors (important to catch)
- Minor errors (nice to catch)

The document should be realistic - something a PV professional would actually review.
Errors should be subtle enough to require knowledge of the KSB to detect.`;

  const { output } = await ai.generate({
    prompt,
    output: { schema: RedPenConfigSchema },
    config: { temperature: 0.6 },
  });

  if (!output) throw new Error('Failed to generate red pen activity');

  return {
    engineType: 'red_pen',
    instructions: `Review the following ${output.documentType.replace('_', ' ')} and identify all errors. Click on each error to mark it and select its type and severity. You need to find at least ${output.passingScore}% of the errors to pass.`,
    timeLimitMinutes: 5,
    config: output as RedPenConfig,
  };
}

async function generateTriageActivity(input: ALOGenerationInput): Promise<KSBActivity> {
  const TriageConfigSchema = z.object({
    scenario: z.string(),
    timeConstraint: z.number(),
    decisions: z.array(TriageDecisionSchema),
    scoringWeights: z.object({
      accuracy: z.number(),
      speed: z.number(),
      justification: z.number(),
    }),
  });

  const prompt = `Generate a Triage (rapid decision) activity for pharmacovigilance training.

## KSB: ${input.ksbEntry.title}
Description: ${input.ksbEntry.description}
Level: ${input.proficiencyLevel}

## Requirements
Create a triage scenario with 4-6 rapid-fire decisions.
Each decision should:
- Present a realistic PV scenario
- Have 3-4 clear options
- Have one definitively correct answer
- Include rationale explaining why

The scenario should simulate time pressure common in PV work.
Decisions should build on each other when possible.`;

  const { output } = await ai.generate({
    prompt,
    output: { schema: TriageConfigSchema },
    config: { temperature: 0.6 },
  });

  if (!output) throw new Error('Failed to generate triage activity');

  return {
    engineType: 'triage',
    instructions: `You have ${output.timeConstraint} seconds per decision. Read each scenario carefully and select the best course of action. Speed and accuracy both count toward your score.`,
    timeLimitMinutes: 5,
    config: output as TriageConfig,
  };
}

async function generateSynthesisActivity(input: ALOGenerationInput): Promise<KSBActivity> {
  const SynthesisConfigSchema = z.object({
    prompt: z.string(),
    outputFormat: z.enum(['narrative', 'structured', 'form', 'analysis', 'recommendation']),
    constraints: z.array(SynthesisConstraintSchema),
    evaluationCriteria: z.array(SynthesisCriterionSchema),
    exampleOutput: z.string().optional(),
    maxLength: z.number().optional(),
  });

  const prompt = `Generate a Synthesis (creation) activity for pharmacovigilance training.

## KSB: ${input.ksbEntry.title}
Description: ${input.ksbEntry.description}
Level: ${input.proficiencyLevel}

## Requirements
Create a synthesis task that requires the learner to produce work demonstrating this KSB.
Include:
- Clear prompt describing what to create
- 3-5 constraints (what to include/exclude)
- 3-4 evaluation criteria with rubrics
- Optional example output

The task should produce a portfolio-worthy artifact.
Evaluation criteria should be specific and measurable.`;

  const { output } = await ai.generate({
    prompt,
    output: { schema: SynthesisConfigSchema },
    config: { temperature: 0.6 },
  });

  if (!output) throw new Error('Failed to generate synthesis activity');

  return {
    engineType: 'synthesis',
    instructions: `Complete the following task. Your response will be evaluated by AI against the provided criteria. Take your time to produce quality work that demonstrates your competency.`,
    timeLimitMinutes: 5,
    config: output as SynthesisConfig,
  };
}

async function generateCalculatorActivity(input: ALOGenerationInput): Promise<KSBActivity> {
  // Simplified flat schema to avoid Gemini's nesting depth limit
  const SimpleCalculatorSchema = z.object({
    scenario: z.string(),
    tableTitle: z.string(),
    cellA: z.number().describe('Drug+Event cases'),
    cellB: z.number().describe('Drug only (no event)'),
    cellC: z.number().describe('Event only (no drug)'),
    cellD: z.number().describe('Neither drug nor event'),
    rowHeader: z.string(),
    colHeader: z.string(),
    task1_name: z.string(),
    task1_description: z.string(),
    task1_formula: z.string(),
    task1_expectedAnswer: z.number(),
    task1_hint: z.string(),
    task2_name: z.string(),
    task2_description: z.string(),
    task2_formula: z.string(),
    task2_expectedAnswer: z.number(),
    task2_hint: z.string(),
    interpretation_prompt: z.string(),
    interpretation_correctAnswer: z.string(),
    interpretation_explanation: z.string(),
  });

  const prompt = `Generate a Calculator activity for pharmacovigilance signal detection training.

## KSB: ${input.ksbEntry.title}
Description: ${input.ksbEntry.description}
Level: ${input.proficiencyLevel}
Domain: ${input.domainName}

## Instructions
Create a signal detection exercise using a 2x2 contingency table.

The table cells represent:
- cellA: Cases with BOTH the drug AND the adverse event
- cellB: Cases with the drug but NO event
- cellC: Cases with the event but NO drug exposure
- cellD: Cases with NEITHER drug nor event

Use realistic pharmacovigilance numbers (hundreds to thousands).

Create 2 calculation tasks:
1. PRR (Proportional Reporting Ratio) = (a/(a+b)) / (c/(c+d))
2. ROR (Reporting Odds Ratio) = (a*d) / (b*c)

CALCULATE THE EXPECTED ANSWERS CORRECTLY based on your cell values!

Include an interpretation question asking what the result means for signal detection.`;

  const { output } = await ai.generate({
    prompt,
    output: { schema: SimpleCalculatorSchema },
    config: { temperature: 0.5 },
  });

  if (!output) throw new Error('Failed to generate calculator activity');

  // Transform flat output to proper nested CalculatorConfig
  const config: CalculatorConfig = {
    scenario: output.scenario,
    dataTable: {
      type: '2x2',
      title: output.tableTitle,
      contingencyTable: {
        headers: { row: output.rowHeader, col: output.colHeader },
        cells: { a: output.cellA, b: output.cellB, c: output.cellC, d: output.cellD },
      },
    },
    calculations: [
      {
        id: 'task1',
        name: output.task1_name,
        description: output.task1_description,
        formula: output.task1_formula,
        expectedAnswer: output.task1_expectedAnswer,
        decimalPlaces: 2,
        partialCredit: true,
        hints: [output.task1_hint, `Formula: ${output.task1_formula}`],
        interpretation: {
          prompt: output.interpretation_prompt,
          options: [
            { id: 'signal', label: 'Potential signal detected', explanation: 'Value suggests disproportionate reporting' },
            { id: 'no_signal', label: 'No signal detected', explanation: 'Value does not indicate disproportionate reporting' },
            { id: 'borderline', label: 'Borderline - further analysis needed', explanation: 'Value is near threshold, additional data required' },
          ],
          correctOptionId: output.interpretation_correctAnswer.includes('signal') || output.task1_expectedAnswer > 2 ? 'signal' : 'no_signal',
        },
      },
      {
        id: 'task2',
        name: output.task2_name,
        description: output.task2_description,
        formula: output.task2_formula,
        expectedAnswer: output.task2_expectedAnswer,
        decimalPlaces: 2,
        partialCredit: true,
        hints: [output.task2_hint, `Formula: ${output.task2_formula}`],
      },
    ],
    showFormulas: true,
    tolerance: 0.05,
    calculatorAllowed: true,
  };

  return {
    engineType: 'calculator',
    instructions: `Complete the signal detection calculations using the provided 2x2 contingency table. Formulas are provided as hints. You may use a calculator.`,
    timeLimitMinutes: 5,
    config,
  };
}

async function generateTimelineActivity(input: ALOGenerationInput): Promise<KSBActivity> {
  // Simplified flat schema to avoid Gemini's nesting depth limit
  const SimpleTimelineSchema = z.object({
    scenario: z.string(),
    // Events (flattened) - Each event can be Day 0
    event1_title: z.string(),
    event1_date: z.string().describe('ISO format YYYY-MM-DD'),
    event1_type: z.enum(['awareness', 'receipt', 'onset', 'death', 'hospitalization', 'submission', 'follow_up_received', 'assessment', 'database_entry', 'other']),
    event1_isDay0: z.boolean().describe('Set to true if this is Day 0 - only ONE event should be Day 0'),
    event2_title: z.string(),
    event2_date: z.string(),
    event2_type: z.enum(['awareness', 'receipt', 'onset', 'death', 'hospitalization', 'submission', 'follow_up_received', 'assessment', 'database_entry', 'other']),
    event2_isDay0: z.boolean().describe('Set to true if this is Day 0 - only ONE event should be Day 0'),
    event3_title: z.string(),
    event3_date: z.string(),
    event3_type: z.enum(['awareness', 'receipt', 'onset', 'death', 'hospitalization', 'submission', 'follow_up_received', 'assessment', 'database_entry', 'other']),
    event3_isDay0: z.boolean().describe('Set to true if this is Day 0 - only ONE event should be Day 0'),
    event4_title: z.string(),
    event4_date: z.string(),
    event4_type: z.enum(['awareness', 'receipt', 'onset', 'death', 'hospitalization', 'submission', 'follow_up_received', 'assessment', 'database_entry', 'other']),
    event4_isDay0: z.boolean().describe('Set to true if this is Day 0 - only ONE event should be Day 0'),
    // Tasks
    task1_question: z.string(),
    task1_type: z.enum(['identify_day0', 'calculate_deadline', 'determine_expedited']),
    task1_answer: z.string(),
    task1_explanation: z.string(),
    task2_question: z.string(),
    task2_type: z.enum(['identify_day0', 'calculate_deadline', 'determine_expedited']),
    task2_answer: z.string(),
    task2_explanation: z.string(),
    // Regulation
    regulation_name: z.string(),
    regulation_source: z.string(),
    regulation_deadlineDays: z.number(),
    regulation_summary: z.string(),
  });

  const prompt = `Generate a Timeline (regulatory deadline) activity for pharmacovigilance training.

## KSB: ${input.ksbEntry.title}
Description: ${input.ksbEntry.description}
Level: ${input.proficiencyLevel}
Domain: ${input.domainName}

## Requirements
Create a timeline activity testing PV reporting deadlines.

Generate a realistic case scenario with 4 events using dates in 2024.
One event MUST be Day 0 (set event1_isDay0, event2_isDay0 etc to true for the Day 0 event).

Event types: awareness (when company learns), receipt (document received), onset (symptom start), death, hospitalization, submission, follow_up_received, assessment, database_entry, other

Create 2 tasks:
1. Day 0 identification - ask which event is Day 0
2. Deadline calculation - ask when the report is due (e.g., "15 days from Day 0")

Key rules:
- Day 0 = date company first receives minimum reportable information
- FDA 15-day reports: serious, unexpected, and possibly related events
- FDA 7-day reports: fatal/life-threatening unexpected events

Include the applicable regulation (FDA IND safety, FDA NDA, EMA, or ICH E2D).`;

  const { output } = await ai.generate({
    prompt,
    output: { schema: SimpleTimelineSchema },
    config: { temperature: 0.5 },
  });

  if (!output) throw new Error('Failed to generate timeline activity');

  // Validate Day 0 assignment - exactly one event must be marked as Day 0
  const day0Flags = [output.event1_isDay0, output.event2_isDay0, output.event3_isDay0, output.event4_isDay0];
  const day0Count = day0Flags.filter(Boolean).length;

  if (day0Count === 0) {
    // If AI didn't mark any event as Day 0, default to the first 'awareness' or 'receipt' type
    // This is the most common Day 0 scenario in PV
    const awarenessIndex = [output.event1_type, output.event2_type, output.event3_type, output.event4_type]
      .findIndex(t => t === 'awareness' || t === 'receipt');
    if (awarenessIndex >= 0) {
      day0Flags[awarenessIndex] = true;
    } else {
      // Fallback: mark first event as Day 0
      day0Flags[0] = true;
    }
    log.warn(`Timeline activity for KSB ${input.ksbEntry.id}: No Day 0 marked, auto-assigned to event ${awarenessIndex >= 0 ? awarenessIndex + 1 : 1}`);
  } else if (day0Count > 1) {
    // If multiple Day 0s marked, keep only the first one (chronologically by date)
    const eventDates = [
      { idx: 0, date: output.event1_date },
      { idx: 1, date: output.event2_date },
      { idx: 2, date: output.event3_date },
      { idx: 3, date: output.event4_date },
    ].filter((_, i) => day0Flags[i]).sort((a, b) => a.date.localeCompare(b.date));

    // Keep only the earliest Day 0
    for (let i = 0; i < 4; i++) {
      day0Flags[i] = i === eventDates[0].idx;
    }
    log.warn(`Timeline activity for KSB ${input.ksbEntry.id}: Multiple Day 0s marked, using earliest event ${eventDates[0].idx + 1}`);
  }

  // Transform flat output to proper nested TimelineConfig
  const config: TimelineConfig = {
    scenario: output.scenario,
    events: [
      { id: 'e1', title: output.event1_title, description: output.event1_title, date: output.event1_date, type: output.event1_type, isDay0: day0Flags[0] },
      { id: 'e2', title: output.event2_title, description: output.event2_title, date: output.event2_date, type: output.event2_type, isDay0: day0Flags[1] },
      { id: 'e3', title: output.event3_title, description: output.event3_title, date: output.event3_date, type: output.event3_type, isDay0: day0Flags[2] },
      { id: 'e4', title: output.event4_title, description: output.event4_title, date: output.event4_date, type: output.event4_type, isDay0: day0Flags[3] },
    ],
    tasks: [
      {
        id: 't1',
        taskType: output.task1_type,
        question: output.task1_question,
        correctAnswer: output.task1_answer,
        explanation: output.task1_explanation,
        points: 25,
        partialCredit: false,
      },
      {
        id: 't2',
        taskType: output.task2_type,
        question: output.task2_question,
        correctAnswer: output.task2_answer,
        explanation: output.task2_explanation,
        points: 25,
        partialCredit: true,
        toleranceDays: 1,
      },
    ],
    regulations: [
      {
        id: 'reg1',
        name: output.regulation_name,
        source: output.regulation_source,
        jurisdiction: output.regulation_source.toLowerCase().includes('fda') ? 'fda' : output.regulation_source.toLowerCase().includes('ema') ? 'ema' : 'ich',
        summary: output.regulation_summary,
        requirement: output.regulation_summary,
        deadlineDays: output.regulation_deadlineDays,
      },
    ],
    showCalendar: true,
    allowReordering: false,
  };

  return {
    engineType: 'timeline',
    instructions: `Analyze the case timeline and complete the deadline tasks. Pay careful attention to Day 0 determination rules and applicable regulations.`,
    timeLimitMinutes: 5,
    config,
  };
}

// ============================================================================
// Generate Reflection
// ============================================================================

export async function generateReflection(input: ALOGenerationInput): Promise<KSBReflection> {
  const prompt = `Generate a reflection section for pharmacovigilance training.

## KSB: ${input.ksbEntry.title}
Description: ${input.ksbEntry.description}
Domain: ${input.domainName}
Activity Type: ${input.activityEngineType}

## Requirements
Create:
1. A reflection prompt (1-2 sentences) that helps learners consolidate their learning
2. Portfolio artifact configuration for capturing their work

The reflection should:
- Connect the activity to their professional practice
- Encourage application of the learning
- Be completable in 30 seconds`;

  const { output } = await ai.generate({
    prompt,
    output: { schema: ReflectionSchema },
    config: { temperature: 0.6 },
  });

  if (!output) throw new Error('Failed to generate reflection');
  return output;
}

// ============================================================================
// Generate Metadata
// ============================================================================

export async function generateMetadata(input: ALOGenerationInput): Promise<KSBActivityMetadata> {
  const prompt = `Generate metadata for a pharmacovigilance learning activity.

## KSB: ${input.ksbEntry.title}
Type: ${input.ksbType}
Level: ${input.proficiencyLevel}
Domain: ${input.domainName}
Keywords: ${input.ksbEntry.keywords.join(', ')}

## Requirements
Generate:
- Difficulty level based on proficiency
- Estimated time (typically 7-10 minutes total)
- Relevant tags for searchability
- No prerequisites for now (will be added later)`;

  const { output } = await ai.generate({
    prompt,
    output: { schema: MetadataSchema },
    config: { temperature: 0.3 },
  });

  if (!output) throw new Error('Failed to generate metadata');

  return {
    ...output,
    completionCriteria: {
      minimumScore: 70,
      requiredSections: ['hook', 'concept', 'activity', 'reflection'],
    },
  };
}

// ============================================================================
// Generate Full ALO Content
// ============================================================================

export interface ALOContent {
  hook: KSBHook;
  concept: KSBConcept;
  activity: KSBActivity;
  reflection: KSBReflection;
  activityMetadata: KSBActivityMetadata;
}

export async function generateFullALOContent(input: ALOGenerationInput): Promise<ALOContent> {
  // Generate all sections in parallel for efficiency
  const [hook, concept, activity, reflection, metadata] = await Promise.all([
    generateHook(input),
    generateConcept(input),
    generateActivity(input),
    generateReflection(input),
    generateMetadata(input),
  ]);

  return {
    hook,
    concept,
    activity,
    reflection,
    activityMetadata: metadata,
  };
}
