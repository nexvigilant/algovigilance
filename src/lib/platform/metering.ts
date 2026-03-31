'use server';

/**
 * Metering Engine
 *
 * Tracks billable and usage events for the PRPaaS platform.
 * Phase 1: Firestore-backed event log.
 * Phase 2+: Pub/Sub events → BigQuery aggregation → Stripe usage records.
 *
 * Maps to PRPaaS MeterEvent structure.
 */

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { MeterType, MeterEvent } from '@/types/platform';
import { logger } from '@/lib/logger';

const log = logger.scope('platform/metering');

/**
 * Emit a meter event (fire-and-forget).
 *
 * Phase 1: Writes to Firestore `usage_events` collection.
 * Phase 2+: Publishes to Pub/Sub topic for async aggregation.
 */
export async function emitMeterEvent(
  tenantId: string,
  userId: string,
  meterType: MeterType,
  quantity: number = 1,
  metadata: Record<string, string> = {},
): Promise<void> {
  try {
    const event: Omit<MeterEvent, 'eventId'> = {
      tenantId,
      userId,
      timestamp: new Date().toISOString(),
      meterType,
      quantity,
      metadata,
    };

    // Fire-and-forget write to Firestore
    await adminDb.collection('usage_events').add({
      ...event,
      createdAt: FieldValue.serverTimestamp(),
    });

    log.debug(`Meter: ${meterType} x${quantity} tenant=${tenantId}`);
  } catch (error) {
    // Metering failures must never block the user operation
    log.debug('Meter event failed (non-blocking):', error);
  }
}

/**
 * Convenience: meter a community action.
 * Wraps emitMeterEvent with community-specific metadata.
 */
export async function meterCommunityAction(
  tenantId: string,
  userId: string,
  action: 'post_created' | 'search' | 'analysis' | 'case_study_published' | 'benchmark_query' | 'benchmark_viewed',
  metadata: Record<string, string> = {},
): Promise<void> {
  const meterTypeMap: Record<string, MeterType> = {
    post_created: 'community_post_created',
    search: 'community_search',
    analysis: 'community_analysis',
    case_study_published: 'case_study_published',
    benchmark_query: 'benchmark_query',
    benchmark_viewed: 'benchmark_query',
  };

  return emitMeterEvent(
    tenantId,
    userId,
    meterTypeMap[action],
    1,
    { source: 'community', ...metadata },
  );
}

/**
 * Convenience: meter a marketplace action.
 */
export async function meterMarketplaceAction(
  tenantId: string,
  userId: string,
  action: 'expert_view' | 'engagement' | 'expert_search',
  metadata: Record<string, string> = {},
): Promise<void> {
  const meterTypeMap: Record<string, MeterType> = {
    expert_view: 'marketplace_expert_view',
    engagement: 'marketplace_engagement',
    expert_search: 'marketplace_expert_view',
  };

  return emitMeterEvent(
    tenantId,
    userId,
    meterTypeMap[action],
    1,
    { source: 'marketplace', ...metadata },
  );
}
