/**
 * Platform Module — PRPaaS Infrastructure
 *
 * Barrel export for tenant context, metering, and tier gating.
 * Import: `import { getTenantContext, emitMeterEvent, withFeatureGate } from '@/lib/platform'`
 */

export { getTenantContext, getTenantInfo } from './tenant';
export { emitMeterEvent, meterCommunityAction, meterMarketplaceAction } from './metering';
export { checkFeatureGate, withFeatureGate, checkPermission } from './tier-gates';
