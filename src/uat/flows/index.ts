/**
 * Flow Registry
 *
 * Exports all flow definitions for UAT agents.
 */

export { getServiceWizardFlow, executeServiceWizardFlow } from './service-wizard';
export { getPublicPagesFlow, executePublicPagesFlow } from './public-pages';
export { getOnboardingFlow, executeOnboardingFlow } from './onboarding';

import type { Page } from '@playwright/test';
import type { BaseAgent } from '../agents/base-agent';
import type { FlowConfig, FlowId } from '../config';
import { getServiceWizardFlow } from './service-wizard';
import { getPublicPagesFlow } from './public-pages';
import { getOnboardingFlow } from './onboarding';

export interface FlowResult {
  flowId: FlowId;
  completed: boolean;
  duration: number;
  errors: string[];
  data?: Record<string, unknown>;
}

/**
 * Get a flow executor by ID
 */
export function getFlow(flowId: FlowId): {
  id: string;
  execute: (agent: BaseAgent, page: Page, config: FlowConfig) => Promise<unknown>;
} | null {
  switch (flowId) {
    case 'service-wizard':
      return getServiceWizardFlow();
    case 'public-pages':
      return getPublicPagesFlow();
    case 'onboarding':
      return getOnboardingFlow();
    case 'academy':
    case 'community':
    case 'profile':
    case 'admin':
      // Placeholder - these flows will be implemented in future iterations
      return {
        id: flowId,
        execute: async () => ({
          completed: true,
          message: `Flow ${flowId} not yet implemented`,
        }),
      };
    default:
      return null;
  }
}

/**
 * Execute a flow by ID
 */
export async function executeFlow(
  flowId: FlowId,
  agent: BaseAgent,
  page: Page,
  config: FlowConfig
): Promise<FlowResult> {
  const startTime = Date.now();
  const flow = getFlow(flowId);

  if (!flow) {
    return {
      flowId,
      completed: false,
      duration: 0,
      errors: [`Flow "${flowId}" not found`],
    };
  }

  try {
    const result = await flow.execute(agent, page, config);
    return {
      flowId,
      completed: true,
      duration: Date.now() - startTime,
      errors: [],
      data: result as Record<string, unknown>,
    };
  } catch (error) {
    return {
      flowId,
      completed: false,
      duration: Date.now() - startTime,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}

/**
 * Get all available flow IDs
 */
export function getAvailableFlows(): FlowId[] {
  return ['service-wizard', 'public-pages', 'onboarding', 'academy', 'community', 'profile', 'admin'];
}
