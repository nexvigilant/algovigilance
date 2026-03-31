import { ai } from '../genkit';
import { z } from 'zod';

/**
 * Input schema for forum metadata suggestion
 */
const SuggestForumMetadataInputSchema = z.object({
  name: z.string().describe('The proposed forum name'),
  description: z.string().describe('The proposed forum description'),
  userContext: z
    .object({
      interests: z.array(z.string()).optional(),
      experience: z.string().optional(),
      goals: z.array(z.string()).optional(),
    })
    .optional()
    .describe('Optional user context from their profile'),
});

export type SuggestForumMetadataInput = z.infer<
  typeof SuggestForumMetadataInputSchema
>;

/**
 * Output schema for forum metadata suggestions
 */
const SuggestForumMetadataOutputSchema = z.object({
  suggestedCategory: z
    .string()
    .describe('Recommended category for this forum'),
  suggestedTags: z
    .array(z.string())
    .min(3)
    .max(8)
    .describe('Recommended tags for discoverability'),
  targetAudience: z
    .array(z.string())
    .describe('Who this forum is best suited for'),
  keyThemes: z
    .array(z.string())
    .describe('Main themes and topics this forum will cover'),
  improvementSuggestions: z
    .string()
    .optional()
    .describe('Optional suggestions to improve the forum description'),
  similarForumWarning: z
    .string()
    .optional()
    .describe('Warning if a very similar forum might already exist'),
});

export type SuggestForumMetadataOutput = z.infer<
  typeof SuggestForumMetadataOutputSchema
>;

/**
 * Prompt for suggesting forum metadata
 */
const suggestForumMetadataPrompt = ai.definePrompt(
  {
    name: 'suggestForumMetadata',
    description:
      'Analyze a proposed forum and suggest optimal metadata for organization and discoverability',
    input: {
      schema: SuggestForumMetadataInputSchema,
    },
    output: {
      schema: SuggestForumMetadataOutputSchema,
    },
  },
  async (input) => {
    const userContextStr = input.userContext
      ? `

User Profile Context:
- Interests: ${input.userContext.interests?.join(', ') || 'Not provided'}
- Experience Level: ${input.userContext.experience || 'Not provided'}
- Goals: ${input.userContext.goals?.join(', ') || 'Not provided'}`
      : '';

    return {
      messages: [
        {
          role: 'user',
          content: [
            {
              text: `You are an intelligent community manager for a healthcare professional networking platform. Analyze the proposed forum and provide strategic metadata suggestions.

Context: This platform connects healthcare professionals transitioning to pharmaceutical industry roles. Forums cover topics like regulatory affairs, clinical trials, drug development, pharmacovigilance, medical writing, quality assurance, market access, and career development.

Proposed Forum:
Name: "${input.name}"
Description: "${input.description}"${userContextStr}

Your task:
1. Suggest the BEST category from these options:
   - Regulatory Affairs
   - Clinical Development
   - Drug Safety
   - Medical Communications
   - Quality & Compliance
   - Market Access & Economics
   - Career Development
   - General Discussion
   - Data Science & Biostatistics

2. Generate 3-8 relevant tags for discoverability. Tags should be:
   - Specific and actionable
   - Commonly searched by healthcare professionals
   - Related to pharmaceutical industry topics
   - Mix of broad and specific terms

3. Identify the target audience (who will benefit most from this forum)

4. Extract key themes this forum will cover

5. If the description is vague or could be improved, provide constructive suggestions

6. If this forum seems very similar to common existing forums (like "General Q&A" or "Career Advice"), warn the user and suggest how to make it more unique

Provide strategic, actionable suggestions that help this forum succeed and be discoverable by the right people.`,
            },
          ],
        },
      ],
    };
  }
);

/**
 * Flow for suggesting forum metadata
 */
const suggestForumMetadataFlow = ai.defineFlow(
  {
    name: 'suggestForumMetadata',
    inputSchema: SuggestForumMetadataInputSchema,
    outputSchema: SuggestForumMetadataOutputSchema,
  },
  async (input) => {
    const { output } = await suggestForumMetadataPrompt(input);
    if (!output) {
      throw new Error('Failed to generate forum metadata suggestions');
    }
    return output;
  }
);

/**
 * Server action to suggest forum metadata
 */
export async function suggestForumMetadata(
  input: SuggestForumMetadataInput
): Promise<SuggestForumMetadataOutput> {
  return suggestForumMetadataFlow(input);
}
