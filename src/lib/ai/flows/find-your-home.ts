import { ai } from '../genkit';
import { z } from 'zod';

const FindYourHomeInputSchema = z.object({
  userInterests: z
    .array(z.string())
    .describe('User interests from profile or quiz'),
  userCareerStage: z
    .enum(['practitioner', 'early-career', 'mid-career', 'senior', 'executive'])
    .optional()
    .describe('User career stage'),
  userGoals: z
    .array(z.string())
    .optional()
    .describe('User professional goals'),
  userBackground: z
    .string()
    .optional()
    .describe('User background/specialty (e.g., clinical pharmacist, nurse, physician)'),
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
    .describe('Available forums to analyze'),
});

const FindYourHomeOutputSchema = z.object({
  personalizedGreeting: z
    .string()
    .describe('Personalized greeting based on user profile (2-3 sentences)'),
  profileSummary: z
    .object({
      primaryInterests: z.array(z.string()).describe('Top 3-5 interests identified'),
      careerFocus: z.string().describe('Career stage and focus area'),
      recommendedPath: z
        .string()
        .describe('Recommended community engagement path (e.g., "skill-building", "networking", "transition")'),
    })
    .describe('Summary of user profile analysis'),
  topMatches: z
    .array(
      z.object({
        forumId: z.string(),
        matchScore: z.number().min(0).max(100).describe('Overall match score (0-100)'),
        fitLevel: z
          .enum(['perfect-fit', 'excellent-fit', 'good-fit'])
          .describe('Overall fit level'),
        matchBreakdown: z
          .object({
            interestAlignment: z.number().min(0).max(100).describe('Interest alignment score'),
            careerRelevance: z.number().min(0).max(100).describe('Career stage relevance'),
            goalAlignment: z.number().min(0).max(100).describe('Goal alignment score'),
            communityVibe: z.number().min(0).max(100).describe('Community vibe match'),
          })
          .describe('Detailed scoring breakdown'),
        whyThisForum: z
          .string()
          .describe('Compelling 2-3 sentence explanation of why this forum is perfect for them'),
        whatToExpect: z
          .string()
          .describe('What they can expect from this community (discussions, support, resources)'),
        suggestedFirstStep: z
          .string()
          .describe('Suggested first action in this forum (e.g., "Introduce yourself", "Ask about X")'),
      })
    )
    .min(3)
    .max(5)
    .describe('Top 3-5 forum matches ranked by fit'),
  additionalRecommendations: z
    .array(
      z.object({
        forumId: z.string(),
        matchScore: z.number().min(0).max(100),
        oneLinePitch: z
          .string()
          .describe('One-line pitch for why they should consider this forum'),
      })
    )
    .optional()
    .describe('Additional forums to explore (lower priority)'),
  communityInsights: z
    .object({
      yourArchetype: z
        .string()
        .describe('User archetype (e.g., "Career Transitioner", "Skill Builder", "Patient Safety Advocate")'),
      bestForums: z
        .array(z.string())
        .min(2)
        .max(3)
        .describe('Short list of forum names that are must-joins'),
      engagementTips: z
        .array(z.string())
        .min(3)
        .max(5)
        .describe('Personalized tips for getting the most from the community'),
    })
    .describe('High-level community insights and guidance'),
  nextSteps: z
    .array(z.string())
    .min(3)
    .max(5)
    .describe('Actionable next steps for getting started (ordered by priority)'),
});

export type FindYourHomeInput = z.infer<typeof FindYourHomeInputSchema>;
export type FindYourHomeOutput = z.infer<typeof FindYourHomeOutputSchema>;

const findYourHomePrompt = ai.definePrompt(
  {
    name: 'findYourHome',
    description:
      'Generate a comprehensive, personalized "Find Your Home" analysis for community onboarding',
    input: { schema: FindYourHomeInputSchema },
    output: { schema: FindYourHomeOutputSchema },
  },
  async (input) => {
    const userGoalsList =
      input.userGoals && input.userGoals.length > 0
        ? input.userGoals.join(', ')
        : 'Not specified';

    return {
      messages: [
        {
          role: 'user',
          content: [
            {
              text: `You are an expert community matchmaker for AlgoVigilance, a platform for healthcare professionals transitioning to pharmaceutical industry roles.

# User Profile
**Interests**: ${input.userInterests.join(', ')}
**Career Stage**: ${input.userCareerStage || 'Not specified'}
**Professional Goals**: ${userGoalsList}
**Background**: ${input.userBackground || 'Not specified'}

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
Create a comprehensive, personalized "Find Your Home" onboarding experience that helps this user discover where they belong in the AlgoVigilance community.

## Tone & Style
- **Warm & Welcoming**: Make them feel seen and understood
- **Empowering**: Focus on their potential and what they can achieve
- **Action-Oriented**: Clear next steps and concrete suggestions
- **Authentic**: No corporate fluff; speak to them as a peer who understands their journey

## Personalized Greeting
Write a 2-3 sentence greeting that:
- Acknowledges their specific background and journey
- Validates their goals and interests
- Sets a welcoming, empowering tone

Examples:
- "Welcome! As a clinical pharmacist looking to break into drug safety, you're in exactly the right place..."
- "You're here because you know there's a better path than burning out in clinical practice..."

## Profile Summary
Analyze their profile and identify:
- **Primary Interests**: Extract the 3-5 most important interests from their profile
- **Career Focus**: Synthesize their career stage and primary focus area (1 sentence)
- **Recommended Path**: Based on goals and interests, what's their ideal engagement path?
  - "skill-building": Focus on learning and professional development
  - "networking": Connect with peers and build relationships
  - "transition": Active career change, needs guidance and support
  - "leadership": Senior professional looking to give back/mentor
  - "advocacy": Patient safety and industry oversight focus

## Top Matches (3-5 Forums)
For each top match, provide:

### Match Score Breakdown
- **Interest Alignment** (0-100): How well forum topics match their interests
- **Career Relevance** (0-100): How appropriate for their career stage
- **Goal Alignment** (0-100): How well forum helps achieve their goals
- **Community Vibe** (0-100): Cultural/social fit with the community

### Overall Match Score
Average of the 4 breakdown scores, rounded to nearest integer.

### Fit Level
- **perfect-fit** (90-100): This forum was made for them
- **excellent-fit** (75-89): Highly recommended, strong alignment
- **good-fit** (60-74): Good option, worth exploring

### Why This Forum (2-3 sentences)
Compelling, specific explanation. Examples:
- Good: "This forum is perfect for early-career professionals making the clinical-to-regulatory leap. You'll find peers who've walked your exact path, plus mentors who remember what it's like to feel stuck in a system that doesn't value your expertise."
- Bad: "This forum matches your interests in regulatory affairs."

### What to Expect
One sentence describing the community experience:
- "Active discussions on FDA submissions, career transition stories, and resume reviews"
- "Supportive community for pharmacovigilance newcomers with weekly case studies and mentorship"

### Suggested First Step
Specific, actionable first action:
- "Introduce yourself in the welcome thread and share your clinical background"
- "Ask about the best regulatory certifications for career switchers"
- "Join the ongoing discussion about IND submissions"

## Community Insights

### User Archetype
Identify their community persona (1-3 words). Examples:
- "Career Transitioner" - actively changing roles
- "Skill Builder" - focused on professional development
- "Patient Safety Advocate" - mission-driven oversight
- "Industry Navigator" - learning industry landscape
- "Regulatory Expert in Training" - building regulatory expertise

### Best Forums (Must-Joins)
List 2-3 forum **names** they should absolutely join (just the names, no IDs).

### Engagement Tips
3-5 personalized tips for getting value from the community. Be specific:
- Good: "Don't lurk - introduce yourself within 48 hours. People here respond to authenticity."
- Bad: "Be active in the community."

Examples:
- "Share your clinical background openly - it's your superpower in safety discussions"
- "Don't wait to feel 'qualified' before contributing. Questions help everyone learn."
- "Connect with 3-5 people in your first week. DMs are welcome here."

## Next Steps
3-5 actionable next steps, ordered by priority. Be concrete:
- Good: "Join the Regulatory Affairs forum and introduce yourself in the welcome thread"
- Bad: "Explore the community"

Examples:
1. "Join [Forum Name] and introduce yourself with your background and goals"
2. "Read the top 3 posts in [Forum Name] to understand the community vibe"
3. "Post your first question in [Forum Name] about [specific topic]"
4. "Connect with [type of member] who share your background"

## Important Context
- This is a healthcare professional community focused on:
  - Career transitions FROM clinical/bedside roles TO pharmaceutical industry
  - Regulatory affairs, pharmacovigilance, clinical development, medical communications
  - Patient safety advocacy and independent drug oversight
  - Professional empowerment and escaping toxic healthcare systems

- Community values:
  - Capability over credentials
  - Transparency and authenticity
  - Independence from pharmaceutical company influence (for patient safety work)
  - "Build in public" culture

- Many users are burned out healthcare workers seeking better career paths
- Tone should be empowering, not patronizing
- Focus on action and results, not platitudes`,
            },
          ],
        },
      ],
    };
  }
);

const findYourHomeFlow = ai.defineFlow(
  {
    name: 'findYourHome',
    inputSchema: FindYourHomeInputSchema,
    outputSchema: FindYourHomeOutputSchema,
  },
  async (input) => {
    const { output } = await findYourHomePrompt(input);
    if (!output) {
      throw new Error('Failed to generate Find Your Home analysis');
    }
    return output;
  }
);

export async function findYourHome(input: FindYourHomeInput): Promise<FindYourHomeOutput> {
  return findYourHomeFlow(input);
}
