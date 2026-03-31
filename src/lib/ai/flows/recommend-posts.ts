import { ai } from '../genkit';
import { z } from 'zod';

const RecommendPostsInputSchema = z.object({
  userInterests: z
    .array(z.string())
    .describe('User interests from profile or quiz'),
  userCareerStage: z
    .enum(['practitioner', 'early-career', 'mid-career', 'senior', 'executive'])
    .optional()
    .describe('User career stage for relevance matching'),
  readPostIds: z
    .array(z.string())
    .optional()
    .describe('IDs of posts the user has already read'),
  availablePosts: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        content: z.string().describe('Post content (first 500 chars)'),
        category: z.string(),
        tags: z.array(z.string()).optional(),
        forumName: z.string().optional(),
        postType: z
          .enum(['question', 'discussion', 'announcement', 'resource', 'help'])
          .optional(),
        urgency: z.enum(['low', 'medium', 'high']).optional(),
        createdAt: z.string().optional().describe('ISO date string'),
        replyCount: z.number().optional(),
      })
    )
    .describe('Available posts to recommend from'),
  maxRecommendations: z
    .number()
    .min(1)
    .max(20)
    .default(10)
    .describe('Maximum number of posts to recommend'),
  contextFilter: z
    .enum(['trending', 'unanswered-questions', 'resources', 'all'])
    .optional()
    .default('all')
    .describe('Filter posts by context'),
});

const RecommendPostsOutputSchema = z.object({
  recommendations: z
    .array(
      z.object({
        postId: z.string().describe('ID of the recommended post'),
        relevanceScore: z
          .number()
          .min(0)
          .max(100)
          .describe('Relevance score (0-100) based on user interests'),
        matchReasons: z
          .array(z.string())
          .describe('Specific reasons why this post is relevant (2-3 reasons)'),
        primaryMatchType: z
          .enum([
            'interest-based',
            'trending',
            'unanswered-help',
            'valuable-resource',
            'career-relevant',
          ])
          .describe('Primary reason for recommendation'),
        timelinessNote: z
          .string()
          .optional()
          .describe('Note about time-sensitive nature (for urgent posts or unanswered questions)'),
      })
    )
    .min(1)
    .describe('Ranked list of recommended posts (highest relevance first)'),
});

export type RecommendPostsInput = z.infer<typeof RecommendPostsInputSchema>;
export type RecommendPostsOutput = z.infer<typeof RecommendPostsOutputSchema>;

const recommendPostsPrompt = ai.definePrompt(
  {
    name: 'recommendPosts',
    description:
      'Recommend posts to a healthcare professional based on their interests and reading history',
    input: { schema: RecommendPostsInputSchema },
    output: { schema: RecommendPostsOutputSchema },
  },
  async (input) => {
    const contextNote =
      input.contextFilter === 'unanswered-questions'
        ? 'Prioritize questions that need answers'
        : input.contextFilter === 'resources'
        ? 'Prioritize valuable resources and guides'
        : input.contextFilter === 'trending'
        ? 'Prioritize popular and actively discussed posts'
        : 'Include a mix of questions, discussions, and resources';

    return {
      messages: [
        {
          role: 'user',
          content: [
            {
              text: `You are an expert content recommendation engine for AlgoVigilance, a platform for healthcare professionals transitioning to pharmaceutical industry roles.

# User Profile
**Interests**: ${input.userInterests.join(', ')}
**Career Stage**: ${input.userCareerStage || 'Not specified'}
**Already Read**: ${input.readPostIds?.length || 0} posts

# Context Filter
${contextNote}

# Available Posts (${input.availablePosts.length} total)
${input.availablePosts
  .map(
    (p) =>
      `**Post ID: ${p.id}**
Title: ${p.title}
Category: ${p.category}
Tags: ${p.tags?.join(', ') || 'None'}
Type: ${p.postType || 'Unknown'}
Urgency: ${p.urgency || 'Unknown'}
Forum: ${p.forumName || 'Unknown'}
Replies: ${p.replyCount || 0}
Created: ${p.createdAt || 'Unknown'}
Content Preview: ${p.content.slice(0, 200)}...`
  )
  .join('\n\n')}

# Your Task
Analyze the user profile and recommend up to ${input.maxRecommendations} posts that would be most valuable for them.

## Recommendation Criteria
1. **Interest Alignment**: Match posts to user interests
2. **Career Relevance**: Prioritize posts relevant to their career stage
3. **Avoid Read Posts**: Don't recommend posts they've already read
4. **Value Priority**: Prioritize based on context filter
5. **Timeliness**: For high urgency posts or unanswered questions, note time-sensitivity
6. **Engagement Potential**: Consider if user could meaningfully contribute

## Match Types
- **interest-based**: Post directly matches user's stated interests
- **trending**: Popular post with high engagement that's worth reading
- **unanswered-help**: Question that needs an answer (user might be able to help)
- **valuable-resource**: Resource or guide that builds skills in user's area
- **career-relevant**: Particularly relevant for their career stage or transition

## Relevance Scoring (0-100)
- 90-100: Perfect match (strong interest alignment + high value + timely)
- 75-89: Excellent match (clear interest alignment + valuable content)
- 60-74: Good match (moderate interest alignment or high secondary value)
- 40-59: Moderate match (tangential interest but still useful)
- 0-39: Weak match (minimal alignment but context-appropriate)

## Match Reasons
Provide 2-3 specific, actionable reasons. Be concrete:
- Good: "Addresses regulatory affairs question in your area of interest; has 0 replies so you could contribute"
- Bad: "This post is relevant to you"

Good: "Resource for early-career professionals transitioning from clinical to regulatory roles"
Bad: "Useful career resource"

## Timeliness Notes
For urgent posts or questions needing answers, add a note like:
- "Posted 2 hours ago, needs timely response"
- "High urgency flag - time-sensitive regulatory question"

## Output
Return recommendations sorted by relevance score (highest first).`,
            },
          ],
        },
      ],
    };
  }
);

const recommendPostsFlow = ai.defineFlow(
  {
    name: 'recommendPosts',
    inputSchema: RecommendPostsInputSchema,
    outputSchema: RecommendPostsOutputSchema,
  },
  async (input) => {
    const { output } = await recommendPostsPrompt(input);
    if (!output) {
      throw new Error('Failed to generate post recommendations');
    }
    return output;
  }
);

export async function recommendPosts(input: RecommendPostsInput): Promise<RecommendPostsOutput> {
  return recommendPostsFlow(input);
}
