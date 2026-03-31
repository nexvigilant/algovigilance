'use server';

import { ai } from '@/lib/ai/genkit';
import { z } from 'zod';

import { logger } from '@/lib/logger';
const log = logger.scope('flows/merge-content-correction');

// ============================================================================
// Schemas
// ============================================================================

const CorrectionAnalysisSchema = z.object({
  correctionType: z.enum([
    'factual_update',      // Incorrect fact needs updating
    'date_update',         // Date/timeline needs updating
    'statistic_update',    // Statistics need updating
    'source_update',       // Source reference needs updating
    'clarification',       // Content needs clarification (not wrong, but unclear)
    'addition',            // New information to add
    'removal',             // Content to remove
    'structural',          // Reorganization needed
  ]),
  targetSection: z.string().describe('The section heading or paragraph identifier where the correction applies'),
  originalText: z.string().describe('The specific text that needs correction'),
  confidence: z.number().min(0).max(1),
  explanation: z.string(),
});

const MergedContentSchema = z.object({
  success: z.boolean(),
  mergedContent: z.string().describe('The full MDX content with the correction intelligently merged'),
  changesSummary: z.string().describe('Brief summary of what was changed'),
  changesApplied: z.array(z.object({
    location: z.string(),
    original: z.string(),
    updated: z.string(),
  })),
  warnings: z.array(z.string()).optional(),
});

// ============================================================================
// Prompt Templates
// ============================================================================

const MERGE_PROMPT = `You are an expert content editor for AlgoVigilance, a professional pharmacovigilance and pharmaceutical education platform. Your task is to intelligently merge a correction into existing MDX content while maintaining the article's voice, style, and flow.

IMPORTANT RULES:
1. Preserve the MDX frontmatter exactly as-is (the --- delimited YAML at the top)
2. Maintain the article's existing voice and writing style
3. Only modify the sections directly affected by the correction
4. Do NOT add correction notes, update sections, or changelog entries
5. Make the correction appear as if the article was always written correctly
6. Preserve all existing formatting, markdown syntax, and structure
7. If the correction introduces new information, integrate it naturally

ORIGINAL MDX CONTENT:
"""
{{originalContent}}
"""

CORRECTION TO APPLY:
"""
{{correction}}
"""

{{#if issueTitle}}
ISSUE CONTEXT: {{issueTitle}}
{{/if}}

INSTRUCTIONS:
1. First, identify exactly what in the content needs to change
2. Then, rewrite ONLY the affected portions with the correction applied
3. Return the COMPLETE MDX content with corrections merged in
4. Do not add any correction notes, update sections, or changelog entries - the content should read as if it was always correct

Return a JSON object with:
- success: true if correction was applied successfully
- mergedContent: the complete MDX content with the correction merged in
- changesSummary: brief description of what was changed
- changesApplied: array of specific changes made (location, original text, updated text)
- warnings: any concerns about the correction (optional)`;

const ANALYSIS_PROMPT = `You are an expert content analyst for a pharmaceutical education platform. Analyze this correction request to understand what needs to be changed in the article.

ORIGINAL CONTENT:
"""
{{content}}
"""

CORRECTION REQUEST:
"""
{{correction}}
"""

{{#if issueTitle}}
ISSUE: {{issueTitle}}
{{/if}}

Analyze the correction and identify:
1. What type of correction this is
2. Which section of the content it affects
3. The specific text that needs to be changed
4. Your confidence in understanding the correction

Return a JSON object with:
- correctionType: one of [factual_update, date_update, statistic_update, source_update, clarification, addition, removal, structural]
- targetSection: the section heading or description of where the correction applies
- originalText: the specific text that needs correction (quote from the content)
- confidence: 0-1 confidence score
- explanation: explain what needs to change and why`;

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Analyze a correction to understand what needs to be changed
 */
export async function analyzeCorrection(
  content: string,
  correction: string,
  issueTitle?: string
): Promise<z.infer<typeof CorrectionAnalysisSchema>> {
  const prompt = ANALYSIS_PROMPT
    .replace('{{content}}', content)
    .replace('{{correction}}', correction)
    .replace('{{#if issueTitle}}', issueTitle ? '' : '<!--')
    .replace('{{issueTitle}}', issueTitle || '')
    .replace('{{/if}}', issueTitle ? '' : '-->');

  const response = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt,
    output: { schema: CorrectionAnalysisSchema },
    config: {
      temperature: 0.1, // Low temperature for accurate analysis
    },
  });

  if (!response.output) {
    throw new Error('Failed to analyze correction');
  }

  return response.output;
}

/**
 * Merge a correction into MDX content using AI
 */
export async function mergeContentCorrection(
  originalContent: string,
  correction: string,
  issueTitle?: string
): Promise<z.infer<typeof MergedContentSchema>> {
  // Build the prompt with template substitution
  let prompt = MERGE_PROMPT
    .replace('{{originalContent}}', originalContent)
    .replace('{{correction}}', correction);

  // Handle conditional issueTitle
  if (issueTitle) {
    prompt = prompt
      .replace('{{#if issueTitle}}', '')
      .replace('{{issueTitle}}', issueTitle)
      .replace('{{/if}}', '');
  } else {
    prompt = prompt
      .replace(/\{\{#if issueTitle\}\}[\s\S]*?\{\{\/if\}\}/g, '');
  }

  const response = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt,
    output: { schema: MergedContentSchema },
    config: {
      temperature: 0.2, // Slightly higher for more natural writing
      maxOutputTokens: 8192, // Large output for full MDX content
    },
  });

  if (!response.output) {
    throw new Error('Failed to merge correction');
  }

  return response.output;
}

/**
 * Apply a correction to MDX content with fallback to append mode
 */
export async function applyIntelligentCorrection(
  originalContent: string,
  correction: string,
  issueTitle?: string
): Promise<{
  content: string;
  method: 'ai_merge' | 'append';
  summary: string;
  changes?: Array<{ location: string; original: string; updated: string }>;
}> {
  try {
    // First, analyze the correction
    const analysis = await analyzeCorrection(originalContent, correction, issueTitle);

    // If low confidence, fall back to append mode
    if (analysis.confidence < 0.6) {
      log.debug('[ContentCorrection] Low confidence analysis, using append mode');
      return {
        content: appendCorrection(originalContent, correction, issueTitle),
        method: 'append',
        summary: 'Correction appended due to low confidence in automatic merging',
      };
    }

    // Attempt AI merge
    const mergeResult = await mergeContentCorrection(originalContent, correction, issueTitle);

    if (!mergeResult.success) {
      log.debug('[ContentCorrection] AI merge failed, using append mode');
      return {
        content: appendCorrection(originalContent, correction, issueTitle),
        method: 'append',
        summary: 'Correction appended due to merge failure',
      };
    }

    return {
      content: mergeResult.mergedContent,
      method: 'ai_merge',
      summary: mergeResult.changesSummary,
      changes: mergeResult.changesApplied.map((c) => ({
        location: c.location || 'Unknown',
        original: c.original || '',
        updated: c.updated || '',
      })),
    };
  } catch (error) {
    log.error('[ContentCorrection] AI merge error:', error);
    // Fall back to append mode on any error
    return {
      content: appendCorrection(originalContent, correction, issueTitle),
      method: 'append',
      summary: 'Correction appended due to processing error',
    };
  }
}

/**
 * Fallback: Append correction as a note at the end
 */
function appendCorrection(content: string, correction: string, issueTitle?: string): string {
  const date = new Date().toISOString().split('T')[0];

  // Check if there's already a corrections section
  if (content.includes('<!-- CONTENT CORRECTIONS -->')) {
    return content.replace(
      '<!-- CONTENT CORRECTIONS -->',
      `<!-- CONTENT CORRECTIONS -->

### Update (${date})

${issueTitle ? `**Issue:** ${issueTitle}\n\n` : ''}${correction}
`
    );
  }

  // Add new corrections section at the end
  return `${content}

---

<!-- CONTENT CORRECTIONS -->

### Update (${date})

${issueTitle ? `**Issue:** ${issueTitle}\n\n` : ''}${correction}
`;
}
