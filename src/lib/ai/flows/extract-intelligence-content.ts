/**
 * Intelligence Content Extraction Flow
 *
 * Uses AI to analyze document text and extract structured content
 * for the Intelligence admin form.
 */

import { z } from 'zod';
import { ai } from '@/lib/ai/genkit';

// =============================================================================
// Input/Output Schemas
// =============================================================================

export const DocumentExtractionInputSchema = z.object({
  documentText: z.string().min(10, 'Document text is too short'),
  documentType: z.enum(['pdf', 'docx', 'markdown', 'text', 'gdocs']),
  filename: z.string().optional(),
});

export type DocumentExtractionInput = z.infer<typeof DocumentExtractionInputSchema>;

export const ContentTypeSchema = z.enum([
  'podcast',
  'publication',
  'perspective',
  'field-note',
  'signal',
]);

export const ExtractionResultSchema = z.object({
  // Core fields
  title: z.string().describe('The main title of the content'),
  description: z.string().max(200).describe('Brief description/summary, max 160 chars for SEO'),
  type: ContentTypeSchema.describe('The content type that best matches this document'),
  tags: z.array(z.string()).describe('Relevant topic tags (3-7 tags)'),
  body: z.string().describe('The main content body in markdown format'),
  author: z.string().optional().describe('Author name if mentioned'),

  // Type-specific fields (populated based on detected type)
  typeSpecificFields: z.object({
    // Podcast
    episodeNumber: z.number().optional(),
    seasonNumber: z.number().optional(),
    duration: z.number().optional().describe('Duration in minutes'),
    guests: z.array(z.string()).optional(),

    // Publication
    publicationType: z.enum(['whitepaper', 'research', 'report', 'guide']).optional(),
    executiveSummary: z.string().optional(),
    pageCount: z.number().optional(),

    // Perspective
    pullQuote: z.string().optional().describe('A compelling quote from the content'),
    isOpinion: z.boolean().optional(),

    // Field Note
    originalPlatform: z.enum(['linkedin', 'newsletter', 'medium']).optional(),

    // Signal
    signalStrength: z.enum(['emerging', 'developing', 'confirmed']).optional(),
    signalSource: z.enum(['regulatory', 'industry', 'research', 'market', 'technology']).optional(),
    impactAreas: z.array(z.string()).optional(),
    keyDataPoint: z.string().optional(),
  }).optional(),

  // Confidence scores (0-1)
  confidence: z.object({
    title: z.number().min(0).max(1),
    type: z.number().min(0).max(1),
    tags: z.number().min(0).max(1),
    overall: z.number().min(0).max(1),
  }),

  // Extraction notes
  notes: z.string().optional().describe('Any notes about the extraction or ambiguities'),
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

// =============================================================================
// Extraction Flow
// =============================================================================

export const extractIntelligenceContent = ai.defineFlow(
  {
    name: 'extractIntelligenceContent',
    inputSchema: DocumentExtractionInputSchema,
    outputSchema: ExtractionResultSchema,
  },
  async (input) => {
    const prompt = buildExtractionPrompt(input);

    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt,
      output: { schema: ExtractionResultSchema },
      config: {
        temperature: 0.3, // Lower temp for more consistent extraction
      },
    });

    if (!response.output) {
      throw new Error('AI extraction returned no output. Please try again.');
    }

    return response.output;
  }
);

// =============================================================================
// Prompt Builder
// =============================================================================

function buildExtractionPrompt(input: DocumentExtractionInput): string {
  return `You are an expert content analyst for AlgoVigilance, a pharmaceutical safety intelligence platform.

Analyze the following document and extract structured content for our Intelligence hub.

## Content Types
Choose the most appropriate type:
- **podcast**: Audio/video episode content, interviews, discussions
- **publication**: Formal documents like whitepapers, research papers, reports, guides
- **perspective**: Opinion pieces, analysis, commentary, thought leadership
- **field-note**: Short observations, quick takes, originally posted on social/newsletter
- **signal**: Industry signals, regulatory updates, market trends, early indicators

## Document Information
- **Source Type**: ${input.documentType}
${input.filename ? `- **Filename**: ${input.filename}` : ''}

## Document Content
<document>
${input.documentText}
</document>

## Extraction Instructions

1. **Title**: Extract or generate a compelling title (max 100 chars)

2. **Description**: Write a concise summary suitable for SEO and social sharing (max 160 chars)

3. **Type**: Select the best matching content type based on:
   - Podcast: mentions of episodes, guests, audio/video, interviews
   - Publication: formal structure, citations, executive summary, methodology
   - Perspective: first-person opinion, analysis, "I think/believe"
   - Field Note: short observations, originally from LinkedIn/newsletter
   - Signal: industry trends, regulatory news, market indicators

4. **Tags**: Generate 3-7 relevant tags from these categories:
   - Industry: pharmacovigilance, drug-safety, regulatory, clinical-trials
   - Topics: signal-detection, case-processing, risk-management, compliance
   - Skills: career, leadership, automation, ai-ml

5. **Body**: Format the main content as clean markdown:
   - Preserve headings structure
   - Keep bullet points and lists
   - Remove redundant whitespace
   - Do NOT include the title in the body

6. **Type-Specific Fields**: Based on the detected type, extract relevant fields:
   - Podcast: episode/season numbers, duration, guest names
   - Publication: type, executive summary, page count estimate
   - Perspective: pull quote, whether it's opinion-based
   - Field Note: original platform if mentioned
   - Signal: strength, source category, impact areas, key data point

7. **Confidence Scores**: Rate your confidence (0-1) for:
   - title: How well the title captures the content
   - type: How confident you are in the type classification
   - tags: How relevant the generated tags are
   - overall: Overall extraction quality

8. **Notes**: Add any notes about ambiguities or assumptions made

Return a valid JSON object matching the specified schema.`;
}

// =============================================================================
// Helper for running extraction
// =============================================================================

export async function runContentExtraction(
  documentText: string,
  documentType: DocumentExtractionInput['documentType'],
  filename?: string
): Promise<ExtractionResult> {
  const input: DocumentExtractionInput = {
    documentText,
    documentType,
    filename,
  };

  return extractIntelligenceContent(input);
}
