/**
 * Gemini Deep Research Agent Types
 *
 * Type definitions for the Interactions API and Deep Research Agent.
 * Based on Google AI's Interactions API (Beta).
 *
 * @see https://ai.google.dev/gemini-api/docs/deep-research
 */

// =============================================================================
// Interaction Status
// =============================================================================

export type InteractionStatus = 'in_progress' | 'completed' | 'failed';

// =============================================================================
// Deep Research Configuration
// =============================================================================

export interface DeepResearchConfig {
  /**
   * Enable thinking summaries to receive intermediate reasoning steps
   * Required for streaming progress updates
   */
  thinkingSummaries?: 'auto' | 'none';
}

export interface FileSearchTool {
  type: 'file_search';
  fileSearchStoreNames: string[];
}

export type DeepResearchTool = FileSearchTool;

// =============================================================================
// Interaction Types
// =============================================================================

export interface InteractionOutput {
  text: string;
  type?: 'text' | 'thought_summary';
}

export interface Interaction {
  id: string;
  status: InteractionStatus;
  outputs: InteractionOutput[];
  error?: string;
  createdAt?: string;
}

// =============================================================================
// Create Interaction Options
// =============================================================================

export interface CreateInteractionOptions {
  /**
   * The research query or task to perform
   */
  input: string;

  /**
   * The agent to use. Defaults to deep-research-pro-preview-12-2025
   */
  agent?: string;

  /**
   * Must be true for Deep Research (required for long-running tasks)
   */
  background?: boolean;

  /**
   * Enable streaming for real-time progress updates
   */
  stream?: boolean;

  /**
   * Agent configuration including thinking summaries
   */
  agentConfig?: {
    type: 'deep-research';
    thinking_summaries?: 'auto' | 'none';
  };

  /**
   * Additional tools to provide (e.g., file_search for your own data)
   */
  tools?: DeepResearchTool[];

  /**
   * Previous interaction ID for follow-up questions
   */
  previousInteractionId?: string;
}

// =============================================================================
// Streaming Event Types
// =============================================================================

export type StreamEventType =
  | 'interaction.start'
  | 'content.delta'
  | 'interaction.complete'
  | 'error';

export interface StreamDelta {
  type: 'text' | 'thought_summary';
  text?: string;
  content?: {
    text: string;
  };
}

export interface StreamEvent {
  eventType: StreamEventType;
  eventId?: string;
  interaction?: Interaction;
  delta?: StreamDelta;
  error?: string;
}

// =============================================================================
// Research Result Types (Application-Specific)
// =============================================================================

export interface ResearchProgress {
  interactionId: string;
  status: InteractionStatus;
  currentPhase: 'planning' | 'searching' | 'reading' | 'synthesizing' | 'complete';
  thoughtSummaries: string[];
  partialContent: string;
  lastEventId?: string;
}

export interface ResearchResult {
  interactionId: string;
  status: 'completed' | 'failed';
  report: string;
  error?: string;
  thoughtSummaries: string[];
  startedAt: Date;
  completedAt: Date;
}

// =============================================================================
// PV-Specific Research Types
// =============================================================================

export interface PVResearchRequest {
  query: string;
  context?: {
    drugNames?: string[];
    adverseEvents?: string[];
    therapeuticAreas?: string[];
    regulatoryRegions?: string[];
  };
  outputFormat?: {
    includeDataTables?: boolean;
    includeCitations?: boolean;
    sections?: string[];
    targetAudience?: 'technical' | 'executive' | 'clinical';
  };
}

export interface PVResearchResult extends ResearchResult {
  metadata?: {
    drugsAnalyzed: string[];
    dataSourcesUsed: string[];
    regulatoryReferences: string[];
  };
}
