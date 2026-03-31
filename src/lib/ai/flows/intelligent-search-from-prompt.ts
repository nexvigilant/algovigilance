'use server';

/**
 * @fileOverview An intelligent search AI agent that takes a natural language prompt and returns relevant results.
 *
 * - intelligentSearchFromPrompt - A function that handles the search process.
 * - IntelligentSearchFromPromptInput - The input type for the intelligentSearchFromPrompt function.
 * - IntelligentSearchFromPromptOutput - The return type for the intelligentSearchFromPrompt function.
 */

import {ai} from '@/lib/ai/genkit';
import {z} from 'genkit';

const IntelligentSearchFromPromptInputSchema = z.object({
  prompt: z.string().describe('A natural language search query.'),
});
export type IntelligentSearchFromPromptInput = z.infer<typeof IntelligentSearchFromPromptInputSchema>;

const IntelligentSearchFromPromptOutputSchema = z.object({
  results: z.array(z.string()).describe('An array of relevant search results.'),
});
export type IntelligentSearchFromPromptOutput = z.infer<typeof IntelligentSearchFromPromptOutputSchema>;

export async function intelligentSearchFromPrompt(input: IntelligentSearchFromPromptInput): Promise<IntelligentSearchFromPromptOutput> {
  return intelligentSearchFromPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentSearchFromPromptPrompt',
  input: {schema: IntelligentSearchFromPromptInputSchema},
  output: {schema: IntelligentSearchFromPromptOutputSchema},
  prompt: `You are an AI-powered search assistant for AlgoVigilance.
  Your job is to take the user's search query and return relevant results from across all AlgoVigilance knowledge bases and communications.
  The user's search query is: {{{prompt}}}
  Return an array of relevant search results.`,
});

const intelligentSearchFromPromptFlow = ai.defineFlow(
  {
    name: 'intelligentSearchFromPromptFlow',
    inputSchema: IntelligentSearchFromPromptInputSchema,
    outputSchema: IntelligentSearchFromPromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) throw new Error('AI flow returned no output');
    return output;
  }
);
