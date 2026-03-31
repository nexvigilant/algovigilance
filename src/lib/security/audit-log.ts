'use server';

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('security/audit-log');

/**
 * Security event types for audit logging
 */
export type SecurityEventType =
  | 'auth_failed'
  | 'rate_limit_exceeded'
  | 'bot_detected'
  | 'injection_attempt'
  | 'unauthorized_access'
  | 'suspicious_pattern'
  | 'honeypot_triggered'
  | 'session_anomaly'
  | 'permission_denied';

/**
 * Security event structure for logging
 */
export interface SecurityEvent {
  type: SecurityEventType;
  ip: string;
  userAgent?: string;
  path?: string;
  userId?: string;
  details?: Record<string, unknown>;
  timestamp?: Date;
}

/**
 * Log security event to Firestore
 *
 * Collection: security_events (admin-only access via Firestore rules)
 *
 * @param event - Security event to log
 *
 * @example
 * ```ts
 * await logSecurityEvent({
 *   type: 'unauthorized_access',
 *   ip: '192.168.1.1',
 *   path: '/nucleus/admin',
 *   details: { reason: 'Missing authentication' }
 * });
 * ```
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  try {
    await adminDb.collection('security_events').add({
      ...event,
      timestamp: FieldValue.serverTimestamp(),
      environment: process.env.NODE_ENV,
    });

    // Console log for immediate visibility in server logs
    log.warn(`[SECURITY EVENT] ${event.type}:`, {
      ip: event.ip,
      path: event.path,
      userId: event.userId,
      details: event.details,
    });
  } catch (error) {
    // Don't let logging errors break the application
    log.error('[SECURITY] Failed to log security event:', error);
  }
}

/**
 * Get recent security events for monitoring dashboard
 *
 * @param limit - Maximum number of events to return
 * @param eventTypes - Optional filter by event types
 * @returns Array of security events
 */
export async function getRecentSecurityEvents(
  limit = 100,
  eventTypes?: SecurityEventType[]
): Promise<SecurityEvent[]> {
  try {
    let query = adminDb
      .collection('security_events')
      .orderBy('timestamp', 'desc')
      .limit(limit);

    if (eventTypes && eventTypes.length > 0) {
      query = query.where('type', 'in', eventTypes);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      timestamp: toDateFromSerialized(doc.data().timestamp),
    })) as SecurityEvent[];
  } catch (error) {
    log.error('[SECURITY] Failed to get security events:', error);
    return [];
  }
}

/**
 * Get security event counts by type for the last N hours
 *
 * @param hours - Number of hours to look back
 * @returns Map of event type to count
 */
export async function getSecurityEventCounts(
  hours = 24
): Promise<Record<SecurityEventType, number>> {
  try {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    const snapshot = await adminDb
      .collection('security_events')
      .where('timestamp', '>=', cutoff)
      .get();

    const counts: Record<string, number> = {};

    for (const doc of snapshot.docs) {
      const type = doc.data().type as SecurityEventType;
      counts[type] = (counts[type] || 0) + 1;
    }

    return counts as Record<SecurityEventType, number>;
  } catch (error) {
    log.error('[SECURITY] Failed to get event counts:', error);
    return {} as Record<SecurityEventType, number>;
  }
}
