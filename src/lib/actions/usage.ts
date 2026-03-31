'use server';

/**
 * Usage Tracking Server Actions
 *
 * Tracks API calls, storage, and other metered usage per tenant.
 * Provides tier limit checking and usage summary for dashboards.
 *
 * Firestore collection: /tenants/{tenantId}/usage_events/{eventId}
 * Firestore document: /tenants/{tenantId}/usage_summary (aggregated)
 */

import {
  adminDb,
  adminFieldValue,
} from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { TIER_LIMITS, type SubscriptionTier } from './tenant';

const log = logger.scope('actions/usage');

// ============================================================================
// Types
// ============================================================================

export type UsageEventType =
  | 'api_call'
  | 'signal_detection'
  | 'program_created'
  | 'member_added'
  | 'storage_upload';

export interface UsageEvent {
  id: string;
  tenantId: string;
  userId: string;
  eventType: UsageEventType;
  quantity: number;
  metadata?: Record<string, string>;
  timestamp: FirebaseFirestore.FieldValue;
}

export interface UsageSummary {
  apiCalls: number;
  signalDetections: number;
  storageUsedMb: number;
  programCount: number;
  memberCount: number;
  period: string; // YYYY-MM format
  updatedAt: FirebaseFirestore.FieldValue;
}

export interface TierLimitCheck {
  allowed: boolean;
  current: number;
  max: number;
  limitName: string;
  utilizationPercent: number;
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Record a usage event
 */
export async function recordUsage(
  tenantId: string,
  userId: string,
  eventType: UsageEventType,
  quantity: number = 1,
  metadata?: Record<string, string>
): Promise<{ success: boolean }> {
  try {
    const eventRef = adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('usage_events')
      .doc();

    await eventRef.set({
      id: eventRef.id,
      tenantId,
      userId,
      eventType,
      quantity,
      metadata: metadata || null,
      timestamp: adminFieldValue.serverTimestamp(),
    });

    // Update aggregated summary for current period
    const period = new Date().toISOString().slice(0, 7); // YYYY-MM
    const summaryRef = adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('usage_summary')
      .doc(period);

    const fieldMap: Partial<Record<UsageEventType, string>> = {
      api_call: 'apiCalls',
      signal_detection: 'signalDetections',
    };

    const field = fieldMap[eventType];
    if (field) {
      await summaryRef.set(
        {
          [field]: adminFieldValue.increment(quantity),
          period,
          updatedAt: adminFieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    return { success: true };
  } catch (error) {
    log.error('Error recording usage', { error });
    return { success: false };
  }
}

/**
 * Get usage summary for the current billing period
 */
export async function getUsageSummary(
  tenantId: string
): Promise<UsageSummary> {
  try {
    const period = new Date().toISOString().slice(0, 7);
    const summaryDoc = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('usage_summary')
      .doc(period)
      .get();

    const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
    const tenantData = tenantDoc.data();

    const programsCount = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('programs')
      .where('status', 'in', ['active', 'paused'])
      .count()
      .get();

    const data = summaryDoc.exists ? summaryDoc.data() : {};

    return {
      apiCalls: data?.apiCalls || 0,
      signalDetections: data?.signalDetections || 0,
      storageUsedMb: data?.storageUsedMb || 0,
      programCount: programsCount.data().count,
      memberCount: tenantData?.memberCount || 1,
      period,
      updatedAt: data?.updatedAt || adminFieldValue.serverTimestamp(),
    };
  } catch (error) {
    log.error('Error getting usage summary', { error });
    return {
      apiCalls: 0,
      signalDetections: 0,
      storageUsedMb: 0,
      programCount: 0,
      memberCount: 1,
      period: new Date().toISOString().slice(0, 7),
      updatedAt: adminFieldValue.serverTimestamp(),
    };
  }
}

/**
 * Check a specific tier limit
 */
export async function checkTierLimit(
  tenantId: string,
  limitName: 'programs' | 'members' | 'storage'
): Promise<TierLimitCheck> {
  try {
    const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
    const tenantData = tenantDoc.data();
    const tier = (tenantData?.tier || 'academic') as SubscriptionTier;
    const limits = TIER_LIMITS[tier];

    let current = 0;
    let max = 0;

    switch (limitName) {
      case 'programs': {
        const count = await adminDb
          .collection('tenants')
          .doc(tenantId)
          .collection('programs')
          .where('status', 'in', ['active', 'paused'])
          .count()
          .get();
        current = count.data().count;
        max = limits.maxPrograms;
        break;
      }
      case 'members': {
        current = tenantData?.memberCount || 1;
        max = limits.maxTeamMembers;
        break;
      }
      case 'storage': {
        current = 0; // TODO: calculate from Cloud Storage
        max = limits.storageQuotaGb * 1024; // Convert to MB
        break;
      }
    }

    const utilizationPercent = max > 0 ? (current / max) * 100 : 0;

    return {
      allowed: current < max,
      current,
      max,
      limitName,
      utilizationPercent,
    };
  } catch (error) {
    log.error('Error checking tier limit', { error });
    return {
      allowed: false,
      current: 0,
      max: 0,
      limitName,
      utilizationPercent: 0,
    };
  }
}

/**
 * Get all tier limits with current usage for dashboard display
 */
export async function getTierLimitsWithUsage(
  tenantId: string
): Promise<{
  tier: SubscriptionTier;
  limits: Record<string, { current: number; max: number; percent: number }>;
}> {
  try {
    const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
    const tenantData = tenantDoc.data();
    const tier = (tenantData?.tier || 'academic') as SubscriptionTier;
    const tierLimits = TIER_LIMITS[tier];

    const programsCount = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('programs')
      .where('status', 'in', ['active', 'paused'])
      .count()
      .get();

    const programsCurrent = programsCount.data().count;
    const membersCurrent = tenantData?.memberCount || 1;

    return {
      tier,
      limits: {
        programs: {
          current: programsCurrent,
          max: tierLimits.maxPrograms,
          percent: tierLimits.maxPrograms > 0 ? (programsCurrent / tierLimits.maxPrograms) * 100 : 0,
        },
        members: {
          current: membersCurrent,
          max: tierLimits.maxTeamMembers,
          percent: tierLimits.maxTeamMembers > 0 ? (membersCurrent / tierLimits.maxTeamMembers) * 100 : 0,
        },
        storage: {
          current: 0,
          max: tierLimits.storageQuotaGb,
          percent: 0,
        },
        apiRate: {
          current: 0,
          max: tierLimits.apiRateLimitRpm,
          percent: 0,
        },
      },
    };
  } catch (error) {
    log.error('Error getting tier limits with usage', { error });
    return {
      tier: 'academic',
      limits: {
        programs: { current: 0, max: 3, percent: 0 },
        members: { current: 1, max: 5, percent: 20 },
        storage: { current: 0, max: 10, percent: 0 },
        apiRate: { current: 0, max: 60, percent: 0 },
      },
    };
  }
}
