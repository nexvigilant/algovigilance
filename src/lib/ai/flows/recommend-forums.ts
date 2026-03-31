import { ai } from '../genkit';
import { z } from 'zod';

const RecommendForumsInputSchema = z.object({
  userInterests: z
    .array(z.string())
    .describe('User interests from profile or quiz (e.g., regulatory-affairs, clinical-trials)'),
  userCareerStage: z
    .enum(['practitioner', 'early-career', 'mid-career', 'senior', 'executive'])
    .optional()
    .describe('User career stage for relevance matching'),
  userGoals: z
    .array(z.string())
    .optional()
    .describe('User goals (e.g., career-transition, skill-building, networking)'),
  currentForumMemberships: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        category: z.string(),
        tags: z.array(z.string()).optional(),
      })
    )
    .optional()
    .describe('Forums the user is already a member of'),
  availableForums: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        category: z.string(),
        tags: z.array(z.string()).optional(),
        memberCount: z.number().optional(),
        activityLevel: z.enum(['low', 'medium', 'high']).optional(),
      })
    )
    .describe('Available forums to recommend from'),
  maxRecommendations: z
    .number()
    .min(1)
    .max(20)
    .default(10)
    .describe('Maximum number of forums to recommend'),
});

const RecommendForumsOutputSchema = z.object({
  recommendations: z
    .array(
      z.object({
        forumId: z.string().describe('ID of the recommended forum'),
        relevanceScore: z
          .number()
          .min(0)
          .max(100)
          .describe('Relevance score (0-100) based on user interests and goals'),
        matchReasons: z
          .array(z.string())
          .describe('Specific reasons why this forum matches the user (2-4 reasons)'),
        primaryMatchType: z
          .enum(['interest-based', 'career-stage', 'goal-aligned', 'trending', 'similar-members'])
          .describe('Primary reason for recommendation'),
        confidenceLevel: z
          .enum(['high', 'medium', 'low'])
          .describe('Confidence in this recommendation'),
      })
    )
    .min(1)
    .describe('Ranked list of recommended forums (highest relevance first)'),
  diversityNote: z
    .string()
    .optional()
    .describe('Note about recommendation diversity (if recommendations span multiple categories)'),
});

export type RecommendForumsInput = z.infer<typeof RecommendForumsInputSchema>;
export type RecommendForumsOutput = z.infer<typeof RecommendForumsOutputSchema>;

const recommendForumsPrompt = ai.definePrompt(
  {
    name: 'recommendForums',
    description:
      'Recommend forums to a healthcare professional based on their interests, career stage, and goals',
    input: { schema: RecommendForumsInputSchema },
    output: { schema: RecommendForumsOutputSchema },
  },
  async (input) => {
    const currentForumsList =
      input.currentForumMemberships && input.currentForumMemberships.length > 0
        ? input.currentForumMemberships.map((f) => `- ${f.name} (${f.category})`).join('\n')
        : 'None';

    const userGoalsList =
      input.userGoals && input.userGoals.length > 0
        ? input.userGoals.map((g) => `- ${g}`).join('\n')
        : 'Not specified';

    return {
      messages: [
        {
          role: 'user',
          content: [
            {
              text: `You are an expert community recommendation engine for AlgoVigilance, a platform for healthcare professionals transitioning to pharmaceutical industry roles.

# User Profile
**Interests**: ${input.userInterests.join(', ')}
**Career Stage**: ${input.userCareerStage || 'Not specified'}
**Goals**:
${userGoalsList}

# Current Forum Memberships
${currentForumsList}

# Available Forums (${input.availableForums.length} total)
${input.availableForums
  .map(
    (f) =>
      `**${f.name}** (ID: ${f.id})
- Description: ${f.description}
- Category: ${f.category}
- Tags: ${f.tags?.join(', ') || 'None'}
- Members: ${f.memberCount || 0}
- Activity: ${f.activityLevel || 'Unknown'}`
  )
  .join('\n\n')}

# Your Task
Analyze the user profile and recommend up to ${input.maxRecommendations} forums that would be most valuable for them.

## Recommendation Criteria
1. **Interest Alignment**: Match forums to user interests (regulatory affairs, clinical trials, drug safety, etc.)
2. **Career Stage Fit**: Consider forums appropriate for their career level
3. **Goal Alignment**: Prioritize forums that help achieve their stated goals
4. **Avoid Duplicates**: Don't recommend forums they're already members of
5. **Diversity**: Include forums from different categories if interests span multiple areas
6. **Activity Level**: Prefer forums with higher activity and engagement
7. **Community Size**: Balance between established communities and emerging ones

## Match Types
- **interest-based**: Forum directly matches user's stated interests
- **career-stage**: Forum is particularly relevant for their career level
- **goal-aligned**: Forum helps achieve specific goals (e.g., networking, skill-building)
- **trending**: Forum has high activity and could expose them to important discussions
- **similar-members**: Other users with similar profiles are active here

## Relevance Scoring (0-100)
- 90-100: Perfect match (strong interest alignment + goal alignment + appropriate career stage)
- 75-89: Excellent match (clear interest alignment + some goal/stage relevance)
- 60-74: Good match (moderate interest alignment or strong secondary factors)
- 40-59: Moderate match (tangential interest or valuable for networking)
- 0-39: Weak match (minimal alignment but still potentially valuable)

## Match Reasons
Provide 2-4 specific, actionable reasons why each forum is recommended. Be concrete:
- Good: "Matches your interest in regulatory affairs and has active discussions on FDA submissions"
- Bad: "This forum is relevant to your interests"

Good: "Perfect for early-career professionals building pharmaceutical skills"
Bad: "Good for career development"

## Confidence Levels
- **high**: Strong alignment with interests + goals + career stage
- **medium**: Clear alignment with interests OR goals, but not both
- **low**: Tangential match or exploratory recommendation

## Output
Return recommendations sorted by relevance score (highest first). Include a diversity note if recommendations span 3+ categories.`,
            },
          ],
        },
      ],
    };
  }
);

const recommendForumsFlow = ai.defineFlow(
  {
    name: 'recommendForums',
    inputSchema: RecommendForumsInputSchema,
    outputSchema: RecommendForumsOutputSchema,
  },
  async (input) => {
    const { output } = await recommendForumsPrompt(input);
    if (!output) {
      throw new Error('Failed to generate forum recommendations');
    }
    return output;
  }
);

export async function recommendForums(input: RecommendForumsInput): Promise<RecommendForumsOutput> {
  return recommendForumsFlow(input);
}
