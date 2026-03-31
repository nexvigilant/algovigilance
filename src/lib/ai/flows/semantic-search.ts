import { ai } from '../genkit';
import { z } from 'zod';

const SemanticSearchInputSchema = z.object({
  query: z
    .string()
    .min(3)
    .describe('User search query in natural language'),
  searchType: z
    .enum(['forums', 'posts', 'all'])
    .default('all')
    .describe('Type of content to search'),
  availableForums: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        category: z.string(),
        tags: z.array(z.string()).optional(),
      })
    )
    .optional()
    .describe('Available forums to search (required if searchType includes forums)'),
  availablePosts: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        content: z.string(),
        category: z.string(),
        tags: z.array(z.string()).optional(),
        forumName: z.string().optional(),
      })
    )
    .optional()
    .describe('Available posts to search (required if searchType includes posts)'),
  maxResults: z
    .number()
    .min(1)
    .max(50)
    .default(20)
    .describe('Maximum number of results to return'),
});

const SemanticSearchOutputSchema = z.object({
  forumResults: z
    .array(
      z.object({
        forumId: z.string().describe('ID of the matching forum'),
        relevanceScore: z
          .number()
          .min(0)
          .max(100)
          .describe('Semantic relevance score (0-100)'),
        matchReason: z
          .string()
          .describe('Specific explanation of why this forum matches the query'),
        matchedConcepts: z
          .array(z.string())
          .describe('Key concepts from query that this forum addresses'),
      })
    )
    .optional()
    .describe('Forums matching the search query (if searchType includes forums)'),
  postResults: z
    .array(
      z.object({
        postId: z.string().describe('ID of the matching post'),
        relevanceScore: z
          .number()
          .min(0)
          .max(100)
          .describe('Semantic relevance score (0-100)'),
        matchReason: z
          .string()
          .describe('Specific explanation of why this post matches the query'),
        matchedConcepts: z
          .array(z.string())
          .describe('Key concepts from query that this post addresses'),
        excerpt: z
          .string()
          .optional()
          .describe('Relevant excerpt from post content highlighting the match'),
      })
    )
    .optional()
    .describe('Posts matching the search query (if searchType includes posts)'),
  queryIntent: z
    .enum(['question', 'information-seeking', 'resource-finding', 'community-finding', 'general'])
    .describe('Detected intent of the search query'),
  suggestedRefinements: z
    .array(z.string())
    .optional()
    .describe('Suggested ways to refine the search (if results are too broad or too narrow)'),
  totalResults: z
    .number()
    .describe('Total number of results found (forums + posts)'),
});

export type SemanticSearchInput = z.infer<typeof SemanticSearchInputSchema>;
export type SemanticSearchOutput = z.infer<typeof SemanticSearchOutputSchema>;

const semanticSearchPrompt = ai.definePrompt(
  {
    name: 'semanticSearch',
    description:
      'Perform semantic search across forums and posts using natural language understanding',
    input: { schema: SemanticSearchInputSchema },
    output: { schema: SemanticSearchOutputSchema },
  },
  async (input) => {
    const forumsList =
      input.availableForums && input.searchType !== 'posts'
        ? input.availableForums
            .map(
              (f) =>
                `**Forum ID: ${f.id}**
Name: ${f.name}
Description: ${f.description}
Category: ${f.category}
Tags: ${f.tags?.join(', ') || 'None'}`
            )
            .join('\n\n')
        : 'Not searching forums';

    const postsList =
      input.availablePosts && input.searchType !== 'forums'
        ? input.availablePosts
            .map(
              (p) =>
                `**Post ID: ${p.id}**
Title: ${p.title}
Content: ${p.content.slice(0, 300)}${p.content.length > 300 ? '...' : ''}
Category: ${p.category}
Tags: ${p.tags?.join(', ') || 'None'}
Forum: ${p.forumName || 'Unknown'}`
            )
            .join('\n\n')
        : 'Not searching posts';

    return {
      messages: [
        {
          role: 'user',
          content: [
            {
              text: `You are an expert semantic search engine for AlgoVigilance, a platform for healthcare professionals transitioning to pharmaceutical industry roles.

# User Search Query
"${input.query}"

# Search Type
${input.searchType === 'all' ? 'Search both forums and posts' : `Search ${input.searchType} only`}

# Available Forums
${forumsList}

# Available Posts
${postsList}

# Your Task
Analyze the user's query and find the most semantically relevant content. Use natural language understanding to match intent, not just keywords.

## Search Principles
1. **Semantic Understanding**: Match by meaning, not just exact keywords
   - "career change" should match "professional transition", "switching roles"
   - "drug approval process" should match "regulatory submissions", "FDA review"

2. **Intent Detection**: Understand what the user is trying to accomplish
   - **question**: Seeking specific answer (e.g., "how to transition to regulatory?")
   - **information-seeking**: Learning about topic (e.g., "what is pharmacovigilance?")
   - **resource-finding**: Looking for guides/tools (e.g., "resume templates for pharma")
   - **community-finding**: Looking for like-minded people (e.g., "other clinical pharmacists")
   - **general**: Broad exploration

3. **Concept Matching**: Identify key concepts in query and match to content
   - Extract main topics, technical terms, career stages, goals
   - Match these concepts to forum descriptions and post content

4. **Relevance Scoring**: Score based on semantic match quality
   - 90-100: Direct semantic match (query concepts are primary focus of content)
   - 75-89: Strong match (query concepts are significantly addressed)
   - 60-74: Good match (query concepts are clearly relevant)
   - 40-59: Moderate match (query concepts are mentioned or related)
   - 0-39: Weak match (tangential relevance)

## Match Reasoning
For each result, provide a specific explanation:
- Good: "Directly addresses transitioning from clinical practice to regulatory roles, with focus on required skills"
- Bad: "Matches your search query"

## Matched Concepts
Extract 2-4 key concepts from the query that this result addresses:
- Example query: "How do I break into pharmacovigilance from nursing?"
- Matched concepts: ["pharmacovigilance", "career transition", "nursing background", "entry requirements"]

## Excerpts (Posts Only)
For post results, provide a relevant 100-150 character excerpt that highlights the match.

## Suggested Refinements
If results are:
- Too broad (>30 results): Suggest more specific queries
- Too narrow (<3 results): Suggest broader queries or related topics
- Ambiguous: Suggest ways to clarify intent

## Output Requirements
- Return up to ${input.maxResults} total results
- Sort by relevance score (highest first)
- Include both forums and posts if searchType is 'all'
- Only include results with relevance score ≥ 40
- Detect query intent based on phrasing and structure
- Provide 2-4 suggested refinements if helpful

## Important Context
This is a healthcare professional community focused on:
- Career transitions to pharmaceutical industry
- Regulatory affairs, clinical development, pharmacovigilance
- Professional development and skill-building
- Patient safety and drug oversight
- Independent vigilance intelligence`,
            },
          ],
        },
      ],
    };
  }
);

const semanticSearchFlow = ai.defineFlow(
  {
    name: 'semanticSearch',
    inputSchema: SemanticSearchInputSchema,
    outputSchema: SemanticSearchOutputSchema,
  },
  async (input) => {
    const { output } = await semanticSearchPrompt(input);
    if (!output) {
      throw new Error('Failed to perform semantic search');
    }
    return output;
  }
);

export async function semanticSearch(input: SemanticSearchInput): Promise<SemanticSearchOutput> {
  return semanticSearchFlow(input);
}
