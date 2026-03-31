'use server';
/**
 * @fileOverview Summarizes search results to provide a concise overview.
 *
 * - summarizeSearchResults - A function that summarizes the search results.
 * - SummarizeSearchResultsInput - The input type for the summarizeSearchResults function.
 * - SummarizeSearchResultsOutput - The return type for the summarizeSearchResults function.
 */

import {ai} from '@/lib/ai/genkit';
import {z} from 'genkit';

const SummarizeSearchResultsInputSchema = z.object({
  query: z.string().describe('The original search query.'),
  results: z.array(z.string()).describe('The search results to summarize.'),
});
export type SummarizeSearchResultsInput = z.infer<typeof SummarizeSearchResultsInputSchema>;

const SummarizeSearchResultsOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the search results.'),
});
export type SummarizeSearchResultsOutput = z.infer<typeof SummarizeSearchResultsOutputSchema>;

export async function summarizeSearchResults(input: SummarizeSearchResultsInput): Promise<SummarizeSearchResultsOutput> {
  return summarizeSearchResultsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeSearchResultsPrompt',
  input: {schema: SummarizeSearchResultsInputSchema},
  output: {schema: SummarizeSearchResultsOutputSchema},
  prompt: `You are an expert summarizer, skilled at providing concise overviews of search results.

  Summarize the following search results related to the query "{{query}}". Highlight key insights and relevant information so the user can quickly grasp the overall context without reading every document.

  Search Results:
  {{#each results}}
  - {{{this}}}
  {{/each}}`,
});

const summarizeSearchResultsFlow = ai.defineFlow(
  {
    name: 'summarizeSearchResultsFlow',
    inputSchema: SummarizeSearchResultsInputSchema,
    outputSchema: SummarizeSearchResultsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) throw new Error('AI flow returned no output');
    return output;
  }
);
