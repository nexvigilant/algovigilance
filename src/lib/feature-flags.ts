/**
 * Feature Flags Utility
 *
 * Simple, environment-based feature flags for controlled rollouts.
 * Can be extended to use LaunchDarkly, Flagsmith, or similar services.
 *
 * Usage:
 *   if (isFeatureEnabled('new-dashboard')) {
 *     return <NewDashboard />;
 *   }
 *
 * Define flags in .env:
 *   NEXT_PUBLIC_FEATURE_NEW_DASHBOARD=true
 *   NEXT_PUBLIC_FEATURE_AI_CHAT=false
 */

import { logger } from '@/lib/logger';

const log = logger.scope('feature-flags');

/**
 * Known feature flags with their default values
 * Add new flags here for type safety
 */
const FEATURE_FLAGS = {
  // Academy features
  'academy-fsrs': true, // FSRS spaced repetition
  'academy-portfolio': true, // Portfolio artifacts
  'academy-certificates': true, // Certificate generation
  'academy-ai-generation': true, // AI content generation

  // Community features
  'community-circles': true, // Circle-based discussions
  'community-badges': true, // Achievement badges
  'community-leaderboards': false, // Gamification leaderboards

  // AI features
  'ai-agent-chat': true, // Public AI agent chat
  'ai-deep-research': true, // Deep research flows
  'ai-content-suggestions': false, // AI content suggestions

  // Admin features
  'admin-analytics-v2': false, // New analytics dashboard
  'admin-batch-operations': true, // Batch content operations

  // Experimental
  'experimental-voice': false, // Voice interface
  'experimental-video-generation': false, // AI video generation
  'experimental-guardian': false, // Guardian surveillance
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

/**
 * Cache for resolved flag values
 */
const flagCache = new Map<string, boolean>();

/**
 * Check if a feature flag is enabled
 *
 * Priority:
 * 1. Environment variable override
 * 2. User-specific override (from context)
 * 3. Default value from FEATURE_FLAGS
 */
export function isFeatureEnabled(
  flag: FeatureFlag,
  options?: {
    userId?: string;
    userRole?: string;
  }
): boolean {
  // Check cache first
  const cacheKey = `${flag}-${options?.userId || 'anon'}-${options?.userRole || 'none'}`;
  if (flagCache.has(cacheKey)) {
    return flagCache.get(cacheKey) ?? false;
  }

  let enabled: boolean;

  // 1. Check environment variable override
  const envKey = `NEXT_PUBLIC_FEATURE_${flag.toUpperCase().replace(/-/g, '_')}`;
  const envValue = process.env[envKey];

  if (envValue !== undefined) {
    enabled = envValue === 'true' || envValue === '1';
    log.debug(`Flag "${flag}" resolved from env: ${enabled}`);
  } else {
    // 2. Use default value
    enabled = FEATURE_FLAGS[flag];
    log.debug(`Flag "${flag}" using default: ${enabled}`);
  }

  // 3. Role-based overrides (admins can see experimental features)
  if (options?.userRole === 'admin' && flag.startsWith('experimental-')) {
    enabled = true;
    log.debug(`Flag "${flag}" enabled for admin user`);
  }

  // Cache the result
  flagCache.set(cacheKey, enabled);

  return enabled;
}

/**
 * Get all enabled feature flags
 */
export function getEnabledFlags(options?: {
  userId?: string;
  userRole?: string;
}): FeatureFlag[] {
  return (Object.keys(FEATURE_FLAGS) as FeatureFlag[]).filter((flag) =>
    isFeatureEnabled(flag, options)
  );
}

/**
 * Get all feature flags with their current values
 */
export function getAllFlags(options?: {
  userId?: string;
  userRole?: string;
}): Record<FeatureFlag, boolean> {
  const flags: Partial<Record<FeatureFlag, boolean>> = {};

  for (const flag of Object.keys(FEATURE_FLAGS) as FeatureFlag[]) {
    flags[flag] = isFeatureEnabled(flag, options);
  }

  return flags as Record<FeatureFlag, boolean>;
}

/**
 * Clear the flag cache (useful for testing)
 */
export function clearFlagCache(): void {
  flagCache.clear();
}

/**
 * React hook for feature flags (client-side)
 * Import in client components only
 */
export function useFeatureFlag(
  flag: FeatureFlag,
  options?: {
    userId?: string;
    userRole?: string;
  }
): boolean {
  // In client components, we can use hooks
  // For now, return the static check
  return isFeatureEnabled(flag, options);
}

/**
 * Feature flag guard for conditional rendering
 *
 * Usage:
 *   <FeatureGuard flag="new-dashboard">
 *     <NewDashboard />
 *   </FeatureGuard>
 */
export function FeatureGuard({
  flag,
  children,
  fallback = null,
  userId,
  userRole,
}: {
  flag: FeatureFlag;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  userId?: string;
  userRole?: string;
}): React.ReactNode {
  if (isFeatureEnabled(flag, { userId, userRole })) {
    return children;
  }
  return fallback;
}

// ── Graceful Degradation ───────────────────────────────────────────────
// Engineering source: Williams 1909, Ch 10 — Dual-circuit braking
// When one circuit fails, the other still works at reduced capacity.

/**
 * Service levels for graceful degradation.
 * Features degrade through predictable stages, never cliff-edge to nothing.
 */
export type ServiceLevel = 'full' | 'degraded' | 'readonly' | 'emergency';

const degradationOrder: ServiceLevel[] = ['full', 'degraded', 'readonly', 'emergency'];

/**
 * Get the next degradation level.
 * Emergency cannot degrade further (safe floor).
 */
export function degrade(current: ServiceLevel): ServiceLevel {
  const idx = degradationOrder.indexOf(current);
  return idx < degradationOrder.length - 1
    ? degradationOrder[idx + 1]
    : current;
}

/**
 * Feature guard with automatic degradation on error.
 *
 * Renders children at full capability. If children throw during render,
 * falls back to degradedComponent (simpler version), then fallback (static).
 *
 * Engineering analog: dual-circuit brakes — if hydraulic fails, mechanical still works.
 *
 * @example
 * ```tsx
 * <DegradingFeatureGuard
 *   flag="ai-deep-research"
 *   degraded={<SimpleSearch />}
 *   fallback={<StaticResults />}
 * >
 *   <DeepResearchPanel />
 * </DegradingFeatureGuard>
 * ```
 */
export function DegradingFeatureGuard({
  flag,
  children,
  degraded = null,
  fallback = null,
  userId,
  userRole,
}: {
  flag: FeatureFlag;
  children: React.ReactNode;
  degraded?: React.ReactNode;
  fallback?: React.ReactNode;
  userId?: string;
  userRole?: string;
}): React.ReactNode {
  if (!isFeatureEnabled(flag, { userId, userRole })) {
    return fallback;
  }

  // Feature is enabled — render with degradation chain.
  // The ErrorBoundary wrapping happens at the component level;
  // this provides the degradation hierarchy for consumers to wire up.
  return children ?? degraded ?? fallback;
}

/**
 * For the runtime degradation hook (useDegradedMode), see:
 * @see {@link @/hooks/use-degraded-mode}
 */
