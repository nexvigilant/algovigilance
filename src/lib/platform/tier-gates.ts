'use server';

/**
 * Tier-Based Feature Gating
 *
 * Enforces subscription tier limits on community features.
 * Maps to PRPaaS tier matrix: Explorer → Accelerator → Enterprise → Academic.
 *
 * Every gated operation checks tier BEFORE execution.
 * This is the Next.js equivalent of Rust's TenantContext compile-time enforcement.
 */

import type { TenantContext, FeatureGate } from '@/types/platform';
import { isTierAllowed } from '@/types/platform';
import { getTenantContext } from './tenant';
import { logger } from '@/lib/logger';

const log = logger.scope('platform/tier-gates');

export interface GateResult {
  allowed: boolean;
  reason?: string;
  requiredTier?: string;
}

/**
 * Check if the current user's tier allows a feature.
 * Returns GateResult with reason if blocked.
 */
export async function checkFeatureGate(gate: FeatureGate): Promise<GateResult> {
  const ctx = await getTenantContext();
  if (!ctx) {
    return { allowed: false, reason: 'Not authenticated' };
  }

  if (isTierAllowed(ctx.tier, gate)) {
    return { allowed: true };
  }

  const upgradeMap: Record<FeatureGate, string> = {
    premium_content: 'reader',
    community_forums: 'explorer',
    expert_marketplace: 'accelerator',
    case_studies: 'accelerator',
    peer_benchmarking: 'accelerator',
    advanced_search: 'accelerator',
    content_analysis: 'accelerator',
    cro_ordering: 'accelerator',
    api_access: 'accelerator',
  };

  return {
    allowed: false,
    reason: `This feature requires the ${upgradeMap[gate]} tier or higher.`,
    requiredTier: upgradeMap[gate],
  };
}

/**
 * Guard a server action with a feature gate.
 * Returns the tenant context if allowed, or an error response.
 */
export async function withFeatureGate<T>(
  gate: FeatureGate,
  action: (ctx: TenantContext) => Promise<T>,
): Promise<{ success: true; data: T } | { success: false; error: string; requiredTier?: string }> {
  const ctx = await getTenantContext();
  if (!ctx) {
    return { success: false, error: 'Not authenticated. Please sign in.' };
  }

  if (!isTierAllowed(ctx.tier, gate)) {
    const gateResult = await checkFeatureGate(gate);
    log.info(`Tier gate blocked: ${gate} for tier=${ctx.tier} tenant=${ctx.tenantId}`);
    return {
      success: false,
      error: gateResult.reason || 'Feature not available on your current plan.',
      requiredTier: gateResult.requiredTier,
    };
  }

  try {
    const data = await action(ctx);
    return { success: true, data };
  } catch (error) {
    log.error(`Gated action failed: ${gate}`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Check permission from TenantContext.
 * For fine-grained role-based checks within a tier.
 */
export function checkPermission(
  ctx: TenantContext,
  permission: keyof TenantContext['permissions'],
): GateResult {
  if (ctx.permissions[permission]) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: `Your role (${ctx.role}) does not have permission for this action.`,
  };
}
