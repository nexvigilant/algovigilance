'use server';

/**
 * PRPaaS Billing Server Actions
 *
 * Handles subscription management, tier pricing, upgrade/downgrade
 * calculations, and revenue metrics for the PRPaaS platform.
 *
 * Pricing per architecture doc Section 2.1:
 *   Academic:   $250/mo   (strategic — seeds platform with data)
 *   Biotech:    $2,500/mo (core revenue driver)
 *   CRO:        $5,000/mo (marketplace publisher)
 *   Enterprise: $10,000/mo (full suite + dedicated support)
 *   Government: Custom negotiated
 *
 * Usage-based compute pricing:
 *   Compound scoring:      $0.01/compound
 *   ML prediction:         $0.05/prediction
 *   Virtual screening:     $50-500/campaign
 *   Knowledge graph query: $0.001/query
 *   Storage overage:       $0.10/GB/month
 *
 * Marketplace commission:
 *   CRO orders:    3-8% of order value
 *   AI models:     20-30% of model creator revenue
 *   Expert fees:   15% of engagement fees
 *   IP brokerage:  1-3% of deal value
 */

import {
  adminDb,
  adminFieldValue,
} from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { TIER_LIMITS, type SubscriptionTier } from './tenant';

const log = logger.scope('actions/billing');

// ============================================================================
// Types & Constants
// ============================================================================

export interface TierPricing {
  tier: SubscriptionTier;
  monthlyUsd: number;
  annualUsd: number;
  annualDiscount: number;
  perProgramSlot: number;
  perMemberSlot: number;
  perGbStorage: number;
  label: string;
  stripePriceId: string | null;
}

export interface UsageRate {
  compoundScoring: number;
  mlPrediction: number;
  virtualScreeningMin: number;
  virtualScreeningMax: number;
  knowledgeGraphQuery: number;
  storageOveragePerGb: number;
}

export interface UpgradeCost {
  fromTier: SubscriptionTier;
  toTier: SubscriptionTier;
  currentMonthly: number;
  newMonthly: number;
  monthlyDelta: number;
  proratedCharge: number;
  daysRemaining: number;
  annualImpact: number;
  isUpgrade: boolean;
}

export interface TenantBilling {
  tier: SubscriptionTier;
  status: 'active' | 'trial' | 'past_due' | 'canceled' | 'none';
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  monthlyBase: number;
  usageCharges: number;
  marketplaceCommission: number;
  totalMonthly: number;
  estimatedAnnual: number;
}

export interface RevenueMetrics {
  mrr: number;
  arr: number;
  arpu: number;
  tenantCount: number;
  tierDistribution: Record<SubscriptionTier, number>;
  subscriptionRevenue: number;
  usageRevenue: number;
  marketplaceRevenue: number;
  grossMargin: number;
}

/**
 * Tier pricing schedule — architecture doc Section 2.1
 * Annual discount: 2 months free (16.7% discount)
 */
const TIER_PRICES: Record<SubscriptionTier, TierPricing> = {
  academic: {
    tier: 'academic',
    monthlyUsd: 250,
    annualUsd: 2500,
    annualDiscount: 0.167,
    perProgramSlot: Math.round(250 / 3),       // $83.33
    perMemberSlot: Math.round(250 / 5),         // $50
    perGbStorage: 250 / 10,                     // $25/GB
    label: 'Academic',
    stripePriceId: null, // Set in production env
  },
  biotech: {
    tier: 'biotech',
    monthlyUsd: 2500,
    annualUsd: 25000,
    annualDiscount: 0.167,
    perProgramSlot: Math.round(2500 / 10),      // $250
    perMemberSlot: Math.round(2500 / 25),       // $100
    perGbStorage: 2500 / 100,                   // $25/GB
    label: 'Accelerator',
    stripePriceId: null,
  },
  cro: {
    tier: 'cro',
    monthlyUsd: 5000,
    annualUsd: 50000,
    annualDiscount: 0.167,
    perProgramSlot: Math.round(5000 / 50),      // $100
    perMemberSlot: Math.round(5000 / 100),      // $50
    perGbStorage: 5000 / 500,                   // $10/GB
    label: 'CRO Professional',
    stripePriceId: null,
  },
  enterprise: {
    tier: 'enterprise',
    monthlyUsd: 10000,
    annualUsd: 100000,
    annualDiscount: 0.167,
    perProgramSlot: Math.round(10000 / 200),    // $50
    perMemberSlot: Math.round(10000 / 500),     // $20
    perGbStorage: 10000 / 2000,                 // $5/GB
    label: 'Enterprise',
    stripePriceId: null,
  },
  government: {
    tier: 'government',
    monthlyUsd: 7500,
    annualUsd: 75000,
    annualDiscount: 0.167,
    perProgramSlot: Math.round(7500 / 100),     // $75
    perMemberSlot: Math.round(7500 / 200),      // $37.50
    perGbStorage: 7500 / 1000,                  // $7.50/GB
    label: 'Government',
    stripePriceId: null,
  },
};

/**
 * Usage-based pricing — architecture doc Section 2.1
 */
const USAGE_RATES: UsageRate = {
  compoundScoring: 0.01,
  mlPrediction: 0.05,
  virtualScreeningMin: 50,
  virtualScreeningMax: 500,
  knowledgeGraphQuery: 0.001,
  storageOveragePerGb: 0.10,
};

/**
 * Marketplace commission rates (percentage)
 */
const _MARKETPLACE_RATES = {
  croOrder: { min: 0.03, max: 0.08, default: 0.05 },
  aiModel: { min: 0.20, max: 0.30, default: 0.25 },
  expertFee: { min: 0.15, max: 0.15, default: 0.15 },
  ipBrokerage: { min: 0.01, max: 0.03, default: 0.02 },
};

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Get pricing for all tiers
 */
export async function getTierPricing(): Promise<TierPricing[]> {
  return Object.values(TIER_PRICES);
}

/**
 * Get usage rates
 */
export async function getUsageRates(): Promise<UsageRate> {
  return USAGE_RATES;
}

/**
 * Calculate prorated upgrade/downgrade cost
 *
 * Uses day-based proration:
 *   proratedCharge = (newMonthly - currentMonthly) * (daysRemaining / daysInPeriod)
 */
export async function calculateUpgradeCost(
  tenantId: string,
  targetTier: SubscriptionTier
): Promise<UpgradeCost> {
  try {
    const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
    const tenantData = tenantDoc.data();
    const currentTier = (tenantData?.tier || 'academic') as SubscriptionTier;

    const currentPrice = TIER_PRICES[currentTier];
    const newPrice = TIER_PRICES[targetTier];

    // Calculate proration based on remaining days in billing period
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysInMonth = endOfMonth.getDate();
    const daysRemaining = endOfMonth.getDate() - now.getDate();

    const monthlyDelta = newPrice.monthlyUsd - currentPrice.monthlyUsd;
    const proratedCharge = Math.round((monthlyDelta * (daysRemaining / daysInMonth)) * 100) / 100;
    const annualImpact = monthlyDelta * 12;

    return {
      fromTier: currentTier,
      toTier: targetTier,
      currentMonthly: currentPrice.monthlyUsd,
      newMonthly: newPrice.monthlyUsd,
      monthlyDelta,
      proratedCharge: Math.max(0, proratedCharge), // No negative proration on downgrades
      daysRemaining,
      annualImpact,
      isUpgrade: newPrice.monthlyUsd > currentPrice.monthlyUsd,
    };
  } catch (error) {
    log.error('Error calculating upgrade cost', { error });
    return {
      fromTier: 'academic',
      toTier: targetTier,
      currentMonthly: 0,
      newMonthly: TIER_PRICES[targetTier].monthlyUsd,
      monthlyDelta: TIER_PRICES[targetTier].monthlyUsd,
      proratedCharge: 0,
      daysRemaining: 0,
      annualImpact: TIER_PRICES[targetTier].monthlyUsd * 12,
      isUpgrade: true,
    };
  }
}

/**
 * Get current billing status for a tenant
 */
export async function getTenantBilling(
  tenantId: string
): Promise<TenantBilling> {
  try {
    const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
    const tenantData = tenantDoc.data();
    const tier = (tenantData?.tier || 'academic') as SubscriptionTier;
    const pricing = TIER_PRICES[tier];

    // Get usage charges for current period
    const period = new Date().toISOString().slice(0, 7);
    const usageDoc = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('usage_summary')
      .doc(period)
      .get();

    const usage = usageDoc.exists ? usageDoc.data() : {};

    // Calculate usage-based charges
    const compoundCharges = (usage?.compoundsScoredCount || 0) * USAGE_RATES.compoundScoring;
    const mlCharges = (usage?.mlPredictionCount || 0) * USAGE_RATES.mlPrediction;
    const kgCharges = (usage?.kgQueryCount || 0) * USAGE_RATES.knowledgeGraphQuery;

    // Storage overage (usage above tier allocation)
    const storageUsedGb = (usage?.storageUsedMb || 0) / 1024;
    const storageOverage = Math.max(0, storageUsedGb - TIER_LIMITS[tier].storageQuotaGb);
    const storageCharges = storageOverage * USAGE_RATES.storageOveragePerGb;

    const usageCharges = Math.round((compoundCharges + mlCharges + kgCharges + storageCharges) * 100) / 100;

    // Marketplace commission earned (platform revenue)
    const marketplaceCommission = Math.round((usage?.marketplaceCommission || 0) * 100) / 100;

    const totalMonthly = pricing.monthlyUsd + usageCharges;

    // Billing period (current month)
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    return {
      tier,
      status: tenantData?.status === 'active' ? 'active' : 'none',
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      monthlyBase: pricing.monthlyUsd,
      usageCharges,
      marketplaceCommission,
      totalMonthly,
      estimatedAnnual: totalMonthly * 12,
    };
  } catch (error) {
    log.error('Error getting tenant billing', { error });
    return {
      tier: 'academic',
      status: 'none',
      currentPeriodStart: null,
      currentPeriodEnd: null,
      monthlyBase: 250,
      usageCharges: 0,
      marketplaceCommission: 0,
      totalMonthly: 250,
      estimatedAnnual: 3000,
    };
  }
}

/**
 * Calculate estimated usage cost for given quantities
 *
 * Used by the cost estimator widget in the analytics dashboard
 */
export async function estimateUsageCost(input: {
  compounds?: number;
  mlPredictions?: number;
  screeningCampaigns?: number;
  kgQueries?: number;
  storageGb?: number;
  tier: SubscriptionTier;
}): Promise<{
  breakdown: { item: string; quantity: number; rate: number; cost: number }[];
  totalUsage: number;
  baseSubscription: number;
  totalEstimate: number;
}> {
  const storageAlloc = TIER_LIMITS[input.tier].storageQuotaGb;
  const storageOverage = Math.max(0, (input.storageGb || 0) - storageAlloc);

  const breakdown = [
    {
      item: 'Compound Scoring',
      quantity: input.compounds || 0,
      rate: USAGE_RATES.compoundScoring,
      cost: (input.compounds || 0) * USAGE_RATES.compoundScoring,
    },
    {
      item: 'ML Predictions',
      quantity: input.mlPredictions || 0,
      rate: USAGE_RATES.mlPrediction,
      cost: (input.mlPredictions || 0) * USAGE_RATES.mlPrediction,
    },
    {
      item: 'Screening Campaigns',
      quantity: input.screeningCampaigns || 0,
      rate: (USAGE_RATES.virtualScreeningMin + USAGE_RATES.virtualScreeningMax) / 2,
      cost: (input.screeningCampaigns || 0) * (USAGE_RATES.virtualScreeningMin + USAGE_RATES.virtualScreeningMax) / 2,
    },
    {
      item: 'Knowledge Graph Queries',
      quantity: input.kgQueries || 0,
      rate: USAGE_RATES.knowledgeGraphQuery,
      cost: (input.kgQueries || 0) * USAGE_RATES.knowledgeGraphQuery,
    },
    {
      item: 'Storage Overage',
      quantity: storageOverage,
      rate: USAGE_RATES.storageOveragePerGb,
      cost: storageOverage * USAGE_RATES.storageOveragePerGb,
    },
  ].filter(b => b.quantity > 0);

  const totalUsage = Math.round(breakdown.reduce((sum, b) => sum + b.cost, 0) * 100) / 100;
  const baseSubscription = TIER_PRICES[input.tier].monthlyUsd;

  return {
    breakdown,
    totalUsage,
    baseSubscription,
    totalEstimate: baseSubscription + totalUsage,
  };
}

/**
 * Get platform revenue metrics (admin only)
 *
 * Calculates MRR, ARR, ARPU per architecture doc Section 2.2:
 *   Target ARPU: $5,300/mo ($63,600/year)
 *   Target gross margin: 75-80%
 */
export async function getRevenueMetrics(): Promise<RevenueMetrics> {
  try {
    // Count tenants by tier
    const tenantsSnapshot = await adminDb
      .collection('tenants')
      .where('status', '==', 'active')
      .get();

    const tierDistribution: Record<SubscriptionTier, number> = {
      academic: 0,
      biotech: 0,
      cro: 0,
      enterprise: 0,
      government: 0,
    };

    let subscriptionRevenue = 0;

    for (const doc of tenantsSnapshot.docs) {
      const tier = (doc.data().tier || 'academic') as SubscriptionTier;
      tierDistribution[tier]++;
      subscriptionRevenue += TIER_PRICES[tier].monthlyUsd;
    }

    const tenantCount = tenantsSnapshot.size;

    // Get aggregate usage revenue for current period
    const period = new Date().toISOString().slice(0, 7);
    const usageDocs = await adminDb
      .collectionGroup('usage_summary')
      .where('period', '==', period)
      .get();

    let usageRevenue = 0;
    let marketplaceRevenue = 0;

    for (const doc of usageDocs.docs) {
      const data = doc.data();
      usageRevenue += (data.compoundsScoredCount || 0) * USAGE_RATES.compoundScoring;
      usageRevenue += (data.mlPredictionCount || 0) * USAGE_RATES.mlPrediction;
      usageRevenue += (data.kgQueryCount || 0) * USAGE_RATES.knowledgeGraphQuery;
      marketplaceRevenue += data.marketplaceCommission || 0;
    }

    const mrr = subscriptionRevenue + Math.round(usageRevenue) + Math.round(marketplaceRevenue);
    const arr = mrr * 12;
    const arpu = tenantCount > 0 ? Math.round(mrr / tenantCount) : 0;

    // Gross margin: target 75-80%, infrastructure ~$200-500/tenant/mo
    const estimatedInfraPerTenant = 350; // midpoint
    const grossMargin = tenantCount > 0
      ? Math.round(((mrr - (estimatedInfraPerTenant * tenantCount)) / mrr) * 100) / 100
      : 0.78; // default target

    return {
      mrr,
      arr,
      arpu,
      tenantCount,
      tierDistribution,
      subscriptionRevenue,
      usageRevenue: Math.round(usageRevenue * 100) / 100,
      marketplaceRevenue: Math.round(marketplaceRevenue * 100) / 100,
      grossMargin,
    };
  } catch (error) {
    log.error('Error calculating revenue metrics', { error });
    return {
      mrr: 0,
      arr: 0,
      arpu: 0,
      tenantCount: 0,
      tierDistribution: { academic: 0, biotech: 0, cro: 0, enterprise: 0, government: 0 },
      subscriptionRevenue: 0,
      usageRevenue: 0,
      marketplaceRevenue: 0,
      grossMargin: 0,
    };
  }
}

/**
 * Record a billing event (subscription change, payment, etc.)
 */
export async function recordBillingEvent(
  tenantId: string,
  eventType: 'subscription_started' | 'tier_changed' | 'payment_received' | 'payment_failed' | 'subscription_canceled',
  details: Record<string, unknown>
): Promise<{ success: boolean }> {
  try {
    await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('billing_events')
      .doc()
      .set({
        tenantId,
        eventType,
        details,
        timestamp: adminFieldValue.serverTimestamp(),
      });

    return { success: true };
  } catch (error) {
    log.error('Error recording billing event', { error });
    return { success: false };
  }
}
