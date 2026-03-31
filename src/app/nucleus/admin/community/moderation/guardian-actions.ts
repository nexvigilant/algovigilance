'use server';

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getAuthenticatedUser } from '@/app/nucleus/community/actions/utils/auth';
import { DURATION_MS, MODERATION_TIME_RANGES_MS } from '@/lib/constants/timing';
import { toDateFromSerialized } from '@/types/academy';
import { logger } from '@/lib/logger';

const log = logger.scope('admin/moderation/guardian-actions');

/**
 * Guardian Protocol: Audit Trail Server Actions
 *
 * Stealth Mode: Optimized queries with minimal data transfer.
 * Returns aggregated metrics and recent activity for visualization.
 */

export interface AuditEvent {
  id: string;
  userId: string;
  activityId: string;
  type: string;
  risk: {
    score: number;
    flags: string[];
    requiresReview: boolean;
  };
  timestamp: Date;
}

export interface RiskVelocityPoint {
  timestamp: Date;
  score: number;
  eventCount: number;
}

export interface GuardianDashboardData {
  // Summary metrics
  totalAuditEvents: number;
  highRiskEvents: number;
  averageRiskScore: number;
  topRiskFlags: Array<{ flag: string; count: number }>;

  // Risk velocity data (for chart)
  riskVelocity: RiskVelocityPoint[];

  // Recent high-risk events
  recentEvents: AuditEvent[];

  // Circle/User hotspots
  hotspots: Array<{
    id: string;
    type: 'user' | 'circle';
    name: string;
    riskScore: number;
    eventCount: number;
  }>;
}

/**
 * Get Guardian Audit Dashboard Data
 * Stealth Mode: Single optimized query with server-side aggregation.
 */
export async function getGuardianDashboardData(
  timeRange: '24h' | '7d' | '30d' = '7d'
): Promise<{ success: boolean; data?: GuardianDashboardData; error?: string }> {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return { success: false, error: 'Unauthorized' };

    // Calculate time boundary
    const now = new Date();
    const timeRangeMs = MODERATION_TIME_RANGES_MS[timeRange];
    const startTime = new Date(now.getTime() - timeRangeMs);

    // Fetch audit trail within time range
    const auditSnapshot = await adminDb
      .collection('guardian_audit_trail')
      .where('timestamp', '>=', startTime)
      .orderBy('timestamp', 'desc')
      .limit(500) // Stealth Mode: Cap query size
      .get();

    if (auditSnapshot.empty) {
      return {
        success: true,
        data: {
          totalAuditEvents: 0,
          highRiskEvents: 0,
          averageRiskScore: 0,
          topRiskFlags: [],
          riskVelocity: [],
          recentEvents: [],
          hotspots: [],
        },
      };
    }

    // Server-side aggregation
    const events: AuditEvent[] = [];
    const flagCounts: Record<string, number> = {};
    const userRiskScores: Record<string, { total: number; count: number }> = {};
    let totalRiskScore = 0;
    let highRiskCount = 0;

    auditSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const event: AuditEvent = {
        id: doc.id,
        userId: data.userId,
        activityId: data.activityId,
        type: data.type,
        risk: data.risk,
        timestamp: toDateFromSerialized(
          data.timestamp as Parameters<typeof toDateFromSerialized>[0]
        ),
      };
      events.push(event);

      // Aggregate risk scores
      const riskScore = data.risk?.score || 0;
      totalRiskScore += riskScore;
      if (riskScore >= 50) highRiskCount++;

      // Count flags
      (data.risk?.flags || []).forEach((flag: string) => {
        flagCounts[flag] = (flagCounts[flag] || 0) + 1;
      });

      // Track user hotspots
      const userId = data.userId;
      if (!userRiskScores[userId]) {
        userRiskScores[userId] = { total: 0, count: 0 };
      }
      userRiskScores[userId].total += riskScore;
      userRiskScores[userId].count++;
    });

    // Calculate risk velocity (hourly buckets for 24h, daily for 7d/30d)
    const velocityBucketMs = timeRange === '24h' ? DURATION_MS.hour : DURATION_MS.day;
    const velocityBuckets: Record<number, { totalScore: number; count: number }> = {};

    events.forEach((event) => {
      const bucketTime = Math.floor(event.timestamp.getTime() / velocityBucketMs) * velocityBucketMs;
      if (!velocityBuckets[bucketTime]) {
        velocityBuckets[bucketTime] = { totalScore: 0, count: 0 };
      }
      velocityBuckets[bucketTime].totalScore += event.risk.score;
      velocityBuckets[bucketTime].count++;
    });

    const riskVelocity: RiskVelocityPoint[] = Object.entries(velocityBuckets)
      .map(([ts, data]) => ({
        timestamp: new Date(parseInt(ts)),
        score: data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
        eventCount: data.count,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Build hotspots (top 5 users by average risk)
    const hotspots = Object.entries(userRiskScores)
      .map(([userId, data]) => ({
        id: userId,
        type: 'user' as const,
        name: `User ${userId.substring(0, 8)}...`,
        riskScore: Math.round(data.total / data.count),
        eventCount: data.count,
      }))
      .filter((h) => h.riskScore >= 30)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5);

    // Top risk flags
    const topRiskFlags = Object.entries(flagCounts)
      .map(([flag, count]) => ({ flag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      success: true,
      data: {
        totalAuditEvents: events.length,
        highRiskEvents: highRiskCount,
        averageRiskScore: events.length > 0 ? Math.round(totalRiskScore / events.length) : 0,
        topRiskFlags,
        riskVelocity,
        recentEvents: events.slice(0, 10), // Only send most recent for display
        hotspots,
      },
    };
  } catch (error) {
    log.error('Failed to fetch Guardian dashboard data', { error });
    return { success: false, error: 'Failed to load audit data' };
  }
}

/**
 * Get detailed risk event for investigation
 */
export async function getAuditEventDetails(eventId: string): Promise<{
  success: boolean;
  event?: AuditEvent & { activityData?: unknown };
  error?: string;
}> {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return { success: false, error: 'Unauthorized' };

    const eventDoc = await adminDb.collection('guardian_audit_trail').doc(eventId).get();
    if (!eventDoc.exists) {
      return { success: false, error: 'Event not found' };
    }

    const data = eventDoc.data();
    if (!data) return { success: false, error: 'Event data is empty' };

    // Fetch associated activity if available
    let activityData = null;
    if (data.activityId && data.userId) {
      const activityDoc = await adminDb
        .collection(`users/${data.userId}/activities`)
        .doc(data.activityId)
        .get();
      if (activityDoc.exists) {
        activityData = activityDoc.data();
      }
    }

    return {
      success: true,
      event: {
        id: eventDoc.id,
        userId: data.userId,
        activityId: data.activityId,
        type: data.type,
        risk: data.risk,
        timestamp: toDateFromSerialized(
          data.timestamp as Parameters<typeof toDateFromSerialized>[0]
        ),
        activityData,
      },
    };
  } catch (error) {
    log.error('Failed to fetch audit event details', { error });
    return { success: false, error: 'Failed to load event details' };
  }
}

/**
 * Guardian Protocol: Proactive Quarantine
 * High-performance restriction of risky accounts.
 */
export async function quarantineUser(userId: string, reason: string): Promise<{ success: boolean; error?: string }> {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return { success: false, error: 'Unauthorized' };

    const batch = adminDb.batch();
    
    // 1. Mark user as quarantined/restricted
    const userRef = adminDb.collection('users').doc(userId);
    batch.update(userRef, {
      'status.isRestricted': true,
      'status.restrictionReason': reason,
      'status.restrictedAt': FieldValue.serverTimestamp(),
      'status.restrictedBy': authUser.uid,
    });

    // 2. Log to Guardian Audit Trail
    const auditRef = adminDb.collection('guardian_audit_trail').doc();
    batch.set(auditRef, {
      userId: authUser.uid,
      type: 'admin_quarantine_user',
      risk: { score: 0, flags: ['quarantine'], requiresReview: false },
      metadata: { targetUserId: userId, reason },
      timestamp: FieldValue.serverTimestamp(),
    });

    await batch.commit();
    log.info('User proactively quarantined', { adminId: authUser.uid, targetId: userId });
    
    return { success: true };
  } catch (error) {
    log.error('Quarantine failed', { error });
    return { success: false, error: 'Failed to execute quarantine' };
  }
}
