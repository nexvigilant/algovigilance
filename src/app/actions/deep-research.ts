'use server';

/**
 * Deep Research Actions
 *
 * Server actions for the Deep Research Agent powered by Gemini.
 * Uses the DeepResearchClient from @/lib/deep-research.
 *
 * @module app/actions/deep-research
 */

import type { PVResearchRequest } from '@/lib/deep-research';

import { logger } from '@/lib/logger';
const log = logger.scope('actions/deep-research');

// =============================================================================
// Types
// =============================================================================

export interface DeepResearchActionResult {
  success: boolean;
  error?: string;
  report?: string;
  sources?: string[];
  interactionId?: string;
  answer?: string;
}

// =============================================================================
// Client Helper
// =============================================================================

async function getClient() {
  const { getDeepResearchClient } = await import('@/lib/deep-research');
  return getDeepResearchClient();
}

// =============================================================================
// Actions
// =============================================================================

/**
 * Execute a general deep research query
 */
export async function executeDeepResearch(query: string): Promise<DeepResearchActionResult> {
  log.info('[DeepResearch] Query received:', query.substring(0, 50));

  try {
    const client = await getClient();
    const result = await client.research(query);

    if (result.status === 'failed') {
      return {
        success: false,
        error: result.error ?? 'Research task failed',
        interactionId: result.interactionId,
      };
    }

    return {
      success: true,
      report: result.report,
      interactionId: result.interactionId,
      sources: result.thoughtSummaries,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    log.error('[DeepResearch] Failed:', message);
    return {
      success: false,
      error: `Deep Research failed: ${message}`,
    };
  }
}

/**
 * Execute PV-specific research
 */
export async function executePVResearch(request: PVResearchRequest): Promise<DeepResearchActionResult> {
  log.info('[DeepResearch] PV research:', request.query?.substring(0, 50));

  try {
    const client = await getClient();
    const result = await client.pvResearch(request);

    if (result.status === 'failed') {
      return {
        success: false,
        error: result.error ?? 'PV Research task failed',
        interactionId: result.interactionId,
      };
    }

    return {
      success: true,
      report: result.report,
      interactionId: result.interactionId,
      sources: result.thoughtSummaries,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    log.error('[DeepResearch] PV research failed:', message);
    return {
      success: false,
      error: `PV Research failed: ${message}`,
    };
  }
}

/**
 * Research drug safety profile
 */
export async function researchDrugSafety(
  drugName: string,
  adverseEvents?: string[]
): Promise<DeepResearchActionResult> {
  log.info('[DeepResearch] Drug safety query:', drugName);

  try {
    const client = await getClient();
    const result = await client.researchDrugSafety(drugName, adverseEvents);

    if (result.status === 'failed') {
      return {
        success: false,
        error: result.error ?? 'Drug safety research failed',
        interactionId: result.interactionId,
      };
    }

    return {
      success: true,
      report: result.report,
      interactionId: result.interactionId,
      sources: result.thoughtSummaries,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    log.error('[DeepResearch] Drug safety failed:', message);
    return {
      success: false,
      error: `Drug Safety Research failed: ${message}`,
    };
  }
}

/**
 * Research regulatory landscape
 */
export async function researchRegulatoryLandscape(
  therapeuticArea: string,
  regions?: string[]
): Promise<DeepResearchActionResult> {
  log.info('[DeepResearch] Regulatory landscape query:', therapeuticArea);

  try {
    const client = await getClient();
    const result = await client.researchRegulatoryLandscape(therapeuticArea, regions);

    if (result.status === 'failed') {
      return {
        success: false,
        error: result.error ?? 'Regulatory research failed',
        interactionId: result.interactionId,
      };
    }

    return {
      success: true,
      report: result.report,
      interactionId: result.interactionId,
      sources: result.thoughtSummaries,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    log.error('[DeepResearch] Regulatory research failed:', message);
    return {
      success: false,
      error: `Regulatory Research failed: ${message}`,
    };
  }
}

/**
 * Ask follow-up question on previous research
 */
export async function askFollowUp(
  interactionId: string,
  question: string
): Promise<DeepResearchActionResult> {
  log.info('[DeepResearch] Follow-up question:', question.substring(0, 50));

  try {
    const client = await getClient();
    const answer = await client.followUp(interactionId, question);

    return {
      success: true,
      answer,
      interactionId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    log.error('[DeepResearch] Follow-up failed:', message);
    return {
      success: false,
      error: `Follow-up failed: ${message}`,
    };
  }
}
