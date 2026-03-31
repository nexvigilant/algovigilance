'use server';

/**
 * Threats Data Access Layer
 *
 * Server actions for Guardian threat event management.
 * Handles threat creation, retrieval, and status updates.
 */

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import {
  ThreatEventSchema,
  CreateThreatInputSchema,
  type ThreatEvent as _ThreatEventDB,
  type CreateThreatInput,
  type ThreatSeverity,
} from '@/lib/schemas/firestore';
import type { ThreatEvent } from '@/types';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('actions/threats');

// ============================================================================
// Threat Event Operations
// ============================================================================

/**
 * Get recent threat events
 *
 * @param limitCount - Number of threats to retrieve (default: 10)
 * @param onlyUnresolved - Only fetch unresolved threats (default: false)
 * @returns Array of threat events
 */
export async function getThreatEvents(
  limitCount: number = 10,
  onlyUnresolved: boolean = false
): Promise<ThreatEvent[]> {
  try {
    let query: FirebaseFirestore.Query = adminDb.collection('threats');

    // Filter by resolution status if requested
    if (onlyUnresolved) {
      query = query.where('isResolved', '==', false);
    }

    // Order by timestamp (most recent first) and limit
    const snapshot = await query
      .orderBy('timestamp', 'desc')
      .limit(limitCount)
      .get();

    // Convert to ThreatEvent format with validation
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const validated = ThreatEventSchema.parse({ id: docSnap.id, ...data });
      return {
        id: validated.id,
        event: validated.event,
        severity: validated.severity,
        action: validated.action,
        timestamp: toDateFromSerialized(validated.timestamp),
      };
    });
  } catch (error) {
    log.error('Error getting threat events:', error);
    return [];
  }
}

/**
 * Get a single threat event by ID
 *
 * @param threatId - Threat event ID
 * @returns Threat event or null if not found
 */
export async function getThreatEvent(
  threatId: string
): Promise<ThreatEvent | null> {
  try {
    const docSnap = await adminDb.collection('threats').doc(threatId).get();

    if (!docSnap.exists) return null;

    const data = docSnap.data();
    const validated = ThreatEventSchema.parse({ id: docSnap.id, ...data });

    return {
      id: validated.id,
      event: validated.event,
      severity: validated.severity,
      action: validated.action,
      timestamp: toDateFromSerialized(validated.timestamp),
    };
  } catch (error) {
    log.error('Error getting threat event:', error);
    return null;
  }
}

/**
 * Create a new threat event
 *
 * Admin-only operation for adding threat events to the system
 *
 * @param data - Threat event data
 * @returns Success status with optional threat ID
 */
export async function createThreatEvent(
  data: CreateThreatInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Validate input
    const validatedData = CreateThreatInputSchema.parse(data);

    // Generate unique ID
    const id = `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const now = adminTimestamp.now();

    // Create threat document
    await adminDb.collection('threats').doc(id).set({
      id,
      event: validatedData.event,
      severity: validatedData.severity,
      action: validatedData.action,
      timestamp: now,
      source: validatedData.source,
      drugName: validatedData.drugName,
      description: validatedData.description,
      isResolved: validatedData.isResolved || false,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, id };
  } catch (error) {
    log.error('Error creating threat event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Mark a threat as resolved
 *
 * @param threatId - Threat event ID
 * @returns Success status with message
 */
export async function markThreatResolved(
  threatId: string
): Promise<{ success: boolean; message: string }> {
  try {
    await adminDb.collection('threats').doc(threatId).update({
      isResolved: true,
      updatedAt: adminTimestamp.now(),
    });

    return { success: true, message: 'Threat marked as resolved' };
  } catch (error) {
    log.error('Error marking threat as resolved:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update a threat event
 *
 * Admin-only operation for updating threat details
 *
 * @param threatId - Threat event ID
 * @param data - Partial threat data to update
 * @returns Success status with message
 */
export async function updateThreatEvent(
  threatId: string,
  data: Partial<CreateThreatInput>
): Promise<{ success: boolean; message: string }> {
  try {
    await adminDb.collection('threats').doc(threatId).update({
      ...data,
      updatedAt: adminTimestamp.now(),
    });

    return { success: true, message: 'Threat event updated successfully' };
  } catch (error) {
    log.error('Error updating threat event:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// Threat Statistics & Filtering
// ============================================================================

/**
 * Get threat events by severity
 *
 * @param severity - Threat severity level
 * @param limitCount - Number of threats to retrieve
 * @returns Array of threat events
 */
export async function getThreatsBySeverity(
  severity: ThreatSeverity,
  limitCount: number = 10
): Promise<ThreatEvent[]> {
  try {
    const snapshot = await adminDb
      .collection('threats')
      .where('severity', '==', severity)
      .orderBy('timestamp', 'desc')
      .limit(limitCount)
      .get();

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const validated = ThreatEventSchema.parse({ id: docSnap.id, ...data });
      return {
        id: validated.id,
        event: validated.event,
        severity: validated.severity,
        action: validated.action,
        timestamp: toDateFromSerialized(validated.timestamp),
      };
    });
  } catch (error) {
    log.error('Error getting threats by severity:', error);
    return [];
  }
}

/**
 * Get threat events by drug name
 *
 * @param drugName - Drug name to filter by
 * @param limitCount - Number of threats to retrieve
 * @returns Array of threat events
 */
export async function getThreatsByDrug(
  drugName: string,
  limitCount: number = 10
): Promise<ThreatEvent[]> {
  try {
    const snapshot = await adminDb
      .collection('threats')
      .where('drugName', '==', drugName)
      .orderBy('timestamp', 'desc')
      .limit(limitCount)
      .get();

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const validated = ThreatEventSchema.parse({ id: docSnap.id, ...data });
      return {
        id: validated.id,
        event: validated.event,
        severity: validated.severity,
        action: validated.action,
        timestamp: toDateFromSerialized(validated.timestamp),
      };
    });
  } catch (error) {
    log.error('Error getting threats by drug:', error);
    return [];
  }
}

/**
 * Get critical unresolved threats
 *
 * Useful for alerts and notifications
 *
 * @param limitCount - Number of threats to retrieve
 * @returns Array of critical threat events
 */
export async function getCriticalThreats(
  limitCount: number = 5
): Promise<ThreatEvent[]> {
  try {
    const snapshot = await adminDb
      .collection('threats')
      .where('severity', '==', 'critical')
      .where('isResolved', '==', false)
      .orderBy('timestamp', 'desc')
      .limit(limitCount)
      .get();

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const validated = ThreatEventSchema.parse({ id: docSnap.id, ...data });
      return {
        id: validated.id,
        event: validated.event,
        severity: validated.severity,
        action: validated.action,
        timestamp: toDateFromSerialized(validated.timestamp),
      };
    });
  } catch (error) {
    log.error('Error getting critical threats:', error);
    return [];
  }
}

// ============================================================================
// Bulk Operations (for data ingestion)
// ============================================================================

/**
 * Create multiple threat events in bulk
 *
 * Used for batch importing threat data from external sources (FDA, EMA, etc.)
 *
 * @param threats - Array of threat event data
 * @returns Summary of created threats
 */
export async function createThreatsBulk(
  threats: CreateThreatInput[]
): Promise<{
  success: boolean;
  created: number;
  failed: number;
  errors: string[];
}> {
  const results = {
    success: true,
    created: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    // Process threats sequentially to avoid overwhelming Firestore
    for (const threat of threats) {
      const result = await createThreatEvent(threat);
      if (result.success) {
        results.created++;
      } else {
        results.failed++;
        results.errors.push(result.error || 'Unknown error');
      }
    }

    if (results.failed > 0) {
      results.success = false;
    }

    return results;
  } catch (error) {
    log.error('Error creating threats in bulk:', error);
    return {
      success: false,
      created: results.created,
      failed: threats.length - results.created,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}
