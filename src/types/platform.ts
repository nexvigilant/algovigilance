/**
 * PRPaaS Platform Types
 *
 * Core types for the Pharmaceutical Research Platform as a Service.
 * Maps to AlgoVigilance module architecture: multi-tenant, tiered,
 * metered, marketplace-connected.
 *
 * @module types/platform
 */

// ============================================================================
// Subscription Tiers
// ============================================================================

export type SubscriptionTier = 'reader' | 'explorer' | 'accelerator' | 'enterprise' | 'academic' | 'custom';

export const SUBSCRIPTION_TIERS = ['reader', 'explorer', 'accelerator', 'enterprise', 'academic', 'custom'] as const;

export interface TierLimits {
  programs: number;        // 1, 5, unlimited, 3
  users: number;           // 3, 10, 50, 10
  storageGb: number;       // 5, 50, 500, 25
  virtualScreensPerMonth: number; // 0, 10, -1 (unlimited), 5
  marketplace: 'browse' | 'order' | 'negotiate';
  apiAccess: boolean;
  ssoEnabled: boolean;
  expertMarketplace: boolean;
  caseStudies: boolean;
  benchmarking: boolean;
  communityForums: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  reader: {
    programs: 0, users: 1, storageGb: 0, virtualScreensPerMonth: 0,
    marketplace: 'browse', apiAccess: false, ssoEnabled: false,
    expertMarketplace: false, caseStudies: false, benchmarking: false,
    communityForums: false,
  },
  explorer: {
    programs: 1, users: 3, storageGb: 5, virtualScreensPerMonth: 0,
    marketplace: 'browse', apiAccess: false, ssoEnabled: false,
    expertMarketplace: false, caseStudies: false, benchmarking: false,
    communityForums: true,
  },
  accelerator: {
    programs: 5, users: 10, storageGb: 50, virtualScreensPerMonth: 10,
    marketplace: 'order', apiAccess: true, ssoEnabled: false,
    expertMarketplace: true, caseStudies: true, benchmarking: true,
    communityForums: true,
  },
  enterprise: {
    programs: -1, users: 50, storageGb: 500, virtualScreensPerMonth: -1,
    marketplace: 'negotiate', apiAccess: true, ssoEnabled: true,
    expertMarketplace: true, caseStudies: true, benchmarking: true,
    communityForums: true,
  },
  academic: {
    programs: 3, users: 10, storageGb: 25, virtualScreensPerMonth: 5,
    marketplace: 'order', apiAccess: true, ssoEnabled: false,
    expertMarketplace: true, caseStudies: true, benchmarking: true,
    communityForums: true,
  },
  custom: {
    programs: -1, users: -1, storageGb: -1, virtualScreensPerMonth: -1,
    marketplace: 'negotiate', apiAccess: true, ssoEnabled: true,
    expertMarketplace: true, caseStudies: true, benchmarking: true,
    communityForums: true,
  },
};

// ============================================================================
// Tenant Context
// ============================================================================

/** Tenant context extracted from authenticated request */
export interface TenantContext {
  tenantId: string;
  userId: string;
  role: TenantUserRole;
  tier: SubscriptionTier;
  permissions: TenantPermissions;
}

export type TenantUserRole = 'owner' | 'admin' | 'scientist' | 'bd' | 'viewer' | 'external';

export interface TenantPermissions {
  canCreatePosts: boolean;
  canModerate: boolean;
  canAccessMarketplace: boolean;
  canPublishCaseStudies: boolean;
  canViewBenchmarks: boolean;
  canListAsExpert: boolean;
  canOrderCro: boolean;
}

/** Derive permissions from tier + role */
export function derivePermissions(tier: SubscriptionTier, role: TenantUserRole): TenantPermissions {
  const limits = TIER_LIMITS[tier];
  const isAdmin = role === 'owner' || role === 'admin';
  const isActive = role !== 'viewer' && role !== 'external';

  return {
    canCreatePosts: limits.communityForums && isActive,
    canModerate: isAdmin,
    canAccessMarketplace: limits.expertMarketplace && isActive,
    canPublishCaseStudies: limits.caseStudies && isActive,
    canViewBenchmarks: limits.benchmarking,
    canListAsExpert: limits.expertMarketplace && isActive,
    canOrderCro: limits.marketplace !== 'browse' && isActive,
  };
}

// ============================================================================
// Tenant Info (stored in Firestore)
// ============================================================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  tier: SubscriptionTier;
  status: 'active' | 'trial' | 'suspended' | 'offboarded';
  trialEndsAt?: string;
  settings: TenantSettings;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSettings {
  dataContributionOptIn: boolean;  // Opt-in to anonymized data aggregation
  defaultCommunityVisibility: 'tenant' | 'platform';
  enabledModules: string[];        // Which AlgoVigilance modules are active
}

export interface TenantUser {
  id: string;
  tenantId: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  role: TenantUserRole;
  status: 'active' | 'invited' | 'suspended';
  invitedBy?: string;
  createdAt: string;
}

// ============================================================================
// Metering
// ============================================================================

export type MeterType =
  | 'community_post_created'
  | 'community_search'
  | 'community_analysis'
  | 'marketplace_expert_view'
  | 'marketplace_engagement'
  | 'case_study_published'
  | 'benchmark_query'
  | 'ml_prediction'
  | 'api_call';

export interface MeterEvent {
  eventId: string;
  tenantId: string;
  userId: string;
  timestamp: string;
  meterType: MeterType;
  quantity: number;
  metadata: Record<string, string>;
}

// ============================================================================
// Feature Gates
// ============================================================================

export type FeatureGate =
  | 'premium_content'
  | 'community_forums'
  | 'expert_marketplace'
  | 'case_studies'
  | 'peer_benchmarking'
  | 'advanced_search'
  | 'content_analysis'
  | 'cro_ordering'
  | 'api_access';

/** Check if a tier has access to a feature */
export function isTierAllowed(tier: SubscriptionTier, gate: FeatureGate): boolean {
  const limits = TIER_LIMITS[tier];
  switch (gate) {
    case 'premium_content': return tier !== 'explorer'; // Reader+ gets premium content
    case 'community_forums': return limits.communityForums;
    case 'expert_marketplace': return limits.expertMarketplace;
    case 'case_studies': return limits.caseStudies;
    case 'peer_benchmarking': return limits.benchmarking;
    case 'advanced_search': return tier !== 'explorer';
    case 'content_analysis': return tier !== 'explorer';
    case 'cro_ordering': return limits.marketplace !== 'browse';
    case 'api_access': return limits.apiAccess;
  }
}
