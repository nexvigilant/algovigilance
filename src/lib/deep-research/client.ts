/**
 * Gemini Deep Research Agent Client
 *
 * A service for executing autonomous research tasks using Google's
 * Gemini Deep Research Agent via the Interactions API.
 *
 * The Deep Research Agent is a multi-step process:
 * 1. Planning - Agent creates a research plan
 * 2. Searching - Agent searches the web (and your files if configured)
 * 3. Reading - Agent reads and analyzes sources
 * 4. Synthesizing - Agent produces a comprehensive report
 *
 * @see https://ai.google.dev/gemini-api/docs/deep-research
 */

import { GoogleGenAI } from '@google/genai';
import { logger } from '@/lib/logger';
import type {
  CreateInteractionOptions,
  FileSearchTool,
  Interaction,
  ResearchResult,
  StreamEvent,
  PVResearchRequest,
} from './types';

const log = logger.scope('DeepResearch');

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_AGENT = 'deep-research-pro-preview-12-2025';
const POLL_INTERVAL_MS = 10_000; // 10 seconds
const MAX_RESEARCH_TIME_MS = 60 * 60 * 1000; // 60 minutes (API limit)

// =============================================================================
// Client Class
// =============================================================================

export class DeepResearchClient {
  private client: GoogleGenAI;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.GOOGLE_GENAI_API_KEY;
    if (!key) {
      throw new Error(
        'GOOGLE_GENAI_API_KEY is required for Deep Research Agent. ' +
          'Add it to your environment variables.'
      );
    }
    this.client = new GoogleGenAI({ apiKey: key });
  }

  // ===========================================================================
  // Core Research Methods
  // ===========================================================================

  /**
   * Start a background research task and poll until completion
   *
   * @example
   * ```ts
   * const result = await client.research('Analyze TPU history and impact');
   * log.info(result.report);
   * ```
   */
  async research(query: string, options?: Partial<CreateInteractionOptions>): Promise<ResearchResult> {
    const startedAt = new Date();
    log.info('Starting deep research', { query: query.substring(0, 100) });

    // Start the research in background mode
    const interaction = await this.createInteraction({
      input: query,
      agent: options?.agent ?? DEFAULT_AGENT,
      background: true,
      agentConfig: {
        type: 'deep-research',
        thinking_summaries: 'auto',
      },
      ...options,
    });

    log.info('Research started', { interactionId: interaction.id });

    // Poll for completion
    const result = await this.pollForCompletion(interaction.id, startedAt);
    return result;
  }

  /**
   * Start a research task with streaming progress updates
   *
   * @example
   * ```ts
   * const stream = client.researchStream('Analyze drug safety trends');
   * for await (const event of stream) {
   *   if (event.type === 'thought') log.info('Thinking:', event.content);
   *   if (event.type === 'content') log.info('Content:', event.content);
   * }
   * ```
   */
  async *researchStream(
    query: string,
    options?: Partial<CreateInteractionOptions>
  ): AsyncGenerator<{ type: 'thought' | 'content' | 'complete'; content: string; interactionId?: string }> {
    log.info('Starting streaming research', { query: query.substring(0, 100) });

    const stream = await this.createStreamingInteraction({
      input: query,
      agent: options?.agent ?? DEFAULT_AGENT,
      background: true,
      stream: true,
      agentConfig: {
        type: 'deep-research',
        thinking_summaries: 'auto',
      },
      ...options,
    });

    let interactionId: string | undefined;
    let finalContent = '';

    for await (const event of stream) {
      if (event.eventType === 'interaction.start' && event.interaction) {
        interactionId = event.interaction.id;
        log.debug('Stream started', { interactionId });
      }

      if (event.eventType === 'content.delta' && event.delta) {
        if (event.delta.type === 'thought_summary') {
          const thought = event.delta.content?.text ?? '';
          yield { type: 'thought', content: thought, interactionId };
        } else if (event.delta.type === 'text') {
          const text = event.delta.text ?? '';
          finalContent += text;
          yield { type: 'content', content: text, interactionId };
        }
      }

      if (event.eventType === 'interaction.complete') {
        yield { type: 'complete', content: finalContent, interactionId };
      }
    }
  }

  /**
   * Ask a follow-up question about a previous research interaction
   */
  async followUp(previousInteractionId: string, question: string): Promise<string> {
    log.info('Asking follow-up question', { previousInteractionId });

    // Follow-ups use the standard model, not the deep research agent
    // SDK uses snake_case parameter names
    const interaction = await this.client.interactions.create({
      input: question,
      model: 'gemini-3-pro-preview',
      previous_interaction_id: previousInteractionId,
    });

    const lastOutput = interaction.outputs?.[interaction.outputs.length - 1];
    return (lastOutput as { text?: string })?.text ?? '';
  }

  // ===========================================================================
  // PV-Specific Research Methods
  // ===========================================================================

  /**
   * Conduct pharmacovigilance-focused research with structured output
   */
  async pvResearch(request: PVResearchRequest): Promise<ResearchResult> {
    const prompt = this.buildPVResearchPrompt(request);
    return this.research(prompt);
  }

  /**
   * Research drug safety signals and trends
   */
  async researchDrugSafety(drugName: string, adverseEvents?: string[]): Promise<ResearchResult> {
    const eventsContext = adverseEvents?.length
      ? `Focus on these adverse events: ${adverseEvents.join(', ')}.`
      : '';

    const prompt = `
Research the safety profile of ${drugName}.

${eventsContext}

Format the output as a technical safety report with the following structure:
1. Executive Summary (2-3 key findings for safety leaders)
2. Signal Detection Summary
   - Include a data table of reported adverse events with frequency estimates
   - Note any emerging signals or trends
3. Regulatory Actions
   - Recent label changes
   - Safety communications
   - Post-marketing requirements
4. Risk Management
   - Current risk minimization measures
   - REMS/RMP status if applicable
5. Comparative Safety
   - Safety profile vs. same-class drugs
6. Sources and Citations
   - Include all sources used

Target audience: Pharmacovigilance professionals
    `.trim();

    return this.research(prompt);
  }

  /**
   * Research regulatory landscape for a therapeutic area
   */
  async researchRegulatoryLandscape(
    therapeuticArea: string,
    regions: string[] = ['FDA', 'EMA', 'PMDA']
  ): Promise<ResearchResult> {
    const prompt = `
Research the current regulatory landscape for ${therapeuticArea}.

Analyze regulations and guidance from: ${regions.join(', ')}

Format the output as an intelligence brief with:
1. Executive Summary
2. Recent Regulatory Changes (include data table with date, agency, action)
3. Upcoming Guidance and Deadlines
4. Regional Differences
5. Impact Assessment for PV Operations
6. Recommended Actions
7. Sources

Target audience: Regulatory Affairs and PV executives
    `.trim();

    return this.research(prompt);
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private async createInteraction(options: CreateInteractionOptions): Promise<Interaction> {
    // SDK uses snake_case parameter names
    const response = await this.client.interactions.create({
      input: options.input,
      agent: options.agent ?? DEFAULT_AGENT,
      background: options.background ?? true,
      agent_config: options.agentConfig ? {
        type: 'deep-research',
        thinking_summaries: options.agentConfig.thinking_summaries,
      } : undefined,
      tools: options.tools?.map(tool => ({
        type: tool.type,
        file_search_store_names: (tool as FileSearchTool).fileSearchStoreNames,
      })),
      previous_interaction_id: options.previousInteractionId,
    });

    return {
      id: response.id ?? '',
      status: (response.status as Interaction['status']) ?? 'in_progress',
      outputs: response.outputs?.map((o) => ({ text: (o as { text?: string }).text ?? '' })) ?? [],
    };
  }

  private async *createStreamingInteraction(
    options: CreateInteractionOptions
  ): AsyncGenerator<StreamEvent> {
    // SDK uses snake_case parameter names
    const stream = await this.client.interactions.create({
      input: options.input,
      agent: options.agent ?? DEFAULT_AGENT,
      background: true,
      stream: true,
      agent_config: options.agentConfig ? {
        type: 'deep-research',
        thinking_summaries: options.agentConfig.thinking_summaries,
      } : undefined,
      tools: options.tools?.map(tool => ({
        type: tool.type,
        file_search_store_names: (tool as FileSearchTool).fileSearchStoreNames,
      })),
      previous_interaction_id: options.previousInteractionId,
    });

    // The stream is an async iterable of events
    for await (const chunk of stream as AsyncIterable<StreamEvent>) {
      yield chunk;
    }
  }

  private async pollForCompletion(interactionId: string, startedAt: Date): Promise<ResearchResult> {
    const thoughtSummaries: string[] = [];
    const startTime = Date.now();

    while (Date.now() - startTime < MAX_RESEARCH_TIME_MS) {
      const interaction = await this.client.interactions.get(interactionId);

      if (interaction.status === 'completed') {
        // Extract text from the last output (outputs are typed as a union of content types)
        const report = this.extractTextFromOutputs(interaction.outputs);
        log.info('Research completed', { interactionId });

        return {
          interactionId,
          status: 'completed',
          report,
          thoughtSummaries,
          startedAt,
          completedAt: new Date(),
        };
      }

      if (interaction.status === 'failed') {
        // The SDK Interaction type doesn't expose error details directly
        log.error('Research failed', { interactionId });
        return {
          interactionId,
          status: 'failed',
          report: '',
          error: 'Research task failed',
          thoughtSummaries,
          startedAt,
          completedAt: new Date(),
        };
      }

      log.debug('Research in progress, polling...', { interactionId });
      await this.sleep(POLL_INTERVAL_MS);
    }

    throw new Error(`Research timed out after ${MAX_RESEARCH_TIME_MS / 1000 / 60} minutes`);
  }

  /**
   * Extract text content from the SDK's typed outputs array
   */
  private extractTextFromOutputs(outputs?: unknown[]): string {
    if (!outputs || outputs.length === 0) return '';

    // Find the last text content in outputs
    for (let i = outputs.length - 1; i >= 0; i--) {
      const output = outputs[i] as { type?: string; text?: string };
      if (output?.type === 'text' && output?.text) {
        return output.text;
      }
    }
    return '';
  }

  private buildPVResearchPrompt(request: PVResearchRequest): string {
    const parts: string[] = [request.query];

    if (request.context) {
      const { drugNames, adverseEvents, therapeuticAreas, regulatoryRegions } = request.context;

      if (drugNames?.length) {
        parts.push(`\nDrugs of interest: ${drugNames.join(', ')}`);
      }
      if (adverseEvents?.length) {
        parts.push(`Adverse events to analyze: ${adverseEvents.join(', ')}`);
      }
      if (therapeuticAreas?.length) {
        parts.push(`Therapeutic areas: ${therapeuticAreas.join(', ')}`);
      }
      if (regulatoryRegions?.length) {
        parts.push(`Regulatory regions: ${regulatoryRegions.join(', ')}`);
      }
    }

    if (request.outputFormat) {
      const { includeDataTables, includeCitations, sections, targetAudience } = request.outputFormat;

      parts.push('\nOutput formatting requirements:');
      if (includeDataTables) parts.push('- Include data tables where applicable');
      if (includeCitations) parts.push('- Include citations for all claims');
      if (sections?.length) parts.push(`- Structure report with sections: ${sections.join(', ')}`);
      if (targetAudience) parts.push(`- Target audience: ${targetAudience}`);
    }

    return parts.join('\n');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let clientInstance: DeepResearchClient | null = null;

/**
 * Get the Deep Research client singleton
 *
 * @example
 * ```ts
 * const client = getDeepResearchClient();
 * const result = await client.research('...');
 * ```
 */
export function getDeepResearchClient(): DeepResearchClient {
  if (!clientInstance) {
    clientInstance = new DeepResearchClient();
  }
  return clientInstance;
}

/**
 * Create a new Deep Research client with custom configuration
 */
export function createDeepResearchClient(apiKey?: string): DeepResearchClient {
  return new DeepResearchClient(apiKey);
}
