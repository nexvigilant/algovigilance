import { ai } from '../genkit';
import { z } from 'zod';

/**
 * Input schema for post metadata suggestion
 */
const SuggestPostMetadataInputSchema = z.object({
  title: z.string().describe('The post title'),
  content: z.string().describe('The post content/body'),
  availableCategories: z
    .array(z.string())
    .describe('List of available categories in the forum'),
  forumContext: z
    .object({
      name: z.string().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional()
    .describe('Optional context about the forum this post is in'),
});

export type SuggestPostMetadataInput = z.infer<typeof SuggestPostMetadataInputSchema>;

/**
 * Output schema for post metadata suggestions
 */
const SuggestPostMetadataOutputSchema = z.object({
  suggestedCategory: z.string().describe('Recommended category for this post'),
  suggestedTags: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe('Recommended tags for searchability (1-5 tags)'),
  postType: z
    .enum(['question', 'discussion', 'announcement', 'resource', 'help'])
    .describe('The type of post this appears to be'),
  urgency: z
    .enum(['low', 'medium', 'high'])
    .describe('How urgent or time-sensitive this post appears'),
  improvementSuggestions: z
    .string()
    .optional()
    .describe('Optional suggestions to improve the post title or content'),
  similarPostWarning: z
    .string()
    .optional()
    .describe('Warning if this appears to be a duplicate or very similar to common posts'),
});

export type SuggestPostMetadataOutput = z.infer<typeof SuggestPostMetadataOutputSchema>;

/**
 * Prompt for suggesting post metadata
 */
const suggestPostMetadataPrompt = ai.definePrompt(
  {
    name: 'suggestPostMetadata',
    description:
      'Analyze a post and suggest optimal metadata for organization and discoverability',
    input: {
      schema: SuggestPostMetadataInputSchema,
    },
    output: {
      schema: SuggestPostMetadataOutputSchema,
    },
  },
  async (input) => {
    const categoriesStr = input.availableCategories.join(', ');
    const forumContextStr = input.forumContext
      ? `

Forum Context:
- Forum Name: ${input.forumContext.name || 'Not provided'}
- Forum Description: ${input.forumContext.description || 'Not provided'}
- Forum Tags: ${input.forumContext.tags?.join(', ') || 'Not provided'}`
      : '';

    return {
      messages: [
        {
          role: 'user',
          content: [
            {
              text: `You are an intelligent community manager for a healthcare professional networking platform. Analyze this post and provide strategic metadata suggestions to maximize engagement and discoverability.

Context: This platform helps healthcare professionals transitioning to pharmaceutical industry roles. Posts cover topics like regulatory affairs, clinical trials, drug development, pharmacovigilance, medical writing, quality assurance, market access, career advice, and professional development.

Post to Analyze:
Title: "${input.title}"
Content: "${input.content}"

Available Categories: ${categoriesStr}${forumContextStr}

Your task:
1. **Suggest the BEST category** from the available options that fits this post's content and intent

2. **Generate 1-5 relevant tags** that:
   - Are specific and actionable
   - Help users find this post
   - Relate to pharmaceutical/healthcare professional topics
   - Balance broad appeal with specific relevance

3. **Determine post type**:
   - question: User is asking for help or information
   - discussion: Open-ended topic for conversation
   - announcement: News, update, or important information
   - resource: Sharing helpful materials, guides, or tools
   - help: Technical issue or problem-solving request

4. **Assess urgency**:
   - high: Time-sensitive, requires quick response (job opportunity, deadline, crisis)
   - medium: Important but not urgent (career advice, project help)
   - low: General discussion, sharing experiences

5. **Improvement suggestions** (if needed):
   - Is the title clear and specific?
   - Does the content provide enough context?
   - Are there spelling/grammar issues?
   - Could the post be more actionable?

6. **Similar post warning** (if applicable):
   - Does this seem like a frequently asked question?
   - Is this a common topic that might have existing discussions?
   - Suggest how to make it more unique or reference existing resources

Provide actionable, helpful suggestions that will improve this post's success in the community.`,
            },
          ],
        },
      ],
    };
  }
);

/**
 * Flow for suggesting post metadata
 */
const suggestPostMetadataFlow = ai.defineFlow(
  {
    name: 'suggestPostMetadata',
    inputSchema: SuggestPostMetadataInputSchema,
    outputSchema: SuggestPostMetadataOutputSchema,
  },
  async (input) => {
    const { output } = await suggestPostMetadataPrompt(input);
    if (!output) {
      throw new Error('Failed to generate post metadata suggestions');
    }
    return output;
  }
);

/**
 * Server action to suggest post metadata
 */
export async function suggestPostMetadata(
  input: SuggestPostMetadataInput
): Promise<SuggestPostMetadataOutput> {
  return suggestPostMetadataFlow(input);
}
