'use server';

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-auth';
import { type WaitlistEntry, statusLabels } from './constants';
import { toDateFromSerialized } from '@/types/academy';

import { logger } from '@/lib/logger';
const log = logger.scope('admin/waitlist/actions');

/**
 * Get all waitlist entries
 * SECURITY: Requires admin role
 */
export async function getWaitlistEntries(): Promise<{
  success: boolean;
  entries?: WaitlistEntry[];
  error?: string;
}> {
  // SECURITY: Verify admin role
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[getWaitlistEntries] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    const snapshot = await adminDb
      .collection('founding_waitlist')
      .orderBy('joinedAt', 'desc')
      .get();

    const entries: WaitlistEntry[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        email: data.email || '',
        joinedAt: toDateFromSerialized(data.joinedAt) || null,
        status: data.status || 'pending',
        source: data.source || 'unknown',
        notifications: data.notifications || {
          platformUpdates: true,
          newReleases: true,
          importantChanges: true,
        },
        accessCode: data.accessCode || null,
        accessCodeGeneratedAt: toDateFromSerialized(data.accessCodeGeneratedAt) || null,
        notes: data.notes || '',
      };
    });

    return {
      success: true,
      entries,
    };
  } catch (error) {
    log.error('Error fetching waitlist entries:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch waitlist',
    };
  }
}

/**
 * Update entry status
 * SECURITY: Requires admin role
 */
export async function updateEntryStatus(
  id: string,
  status: WaitlistEntry['status']
): Promise<{
  success: boolean;
  error?: string;
}> {
  // SECURITY: Verify admin role
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[updateEntryStatus] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    await adminDb.collection('founding_waitlist').doc(id).update({
      status,
      updatedAt: adminTimestamp.now(),
    });

    return { success: true };
  } catch (error) {
    log.error('Error updating entry status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update entry',
    };
  }
}

/**
 * Add notes to an entry
 * SECURITY: Requires admin role
 */
export async function updateEntryNotes(
  id: string,
  notes: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  // SECURITY: Verify admin role
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[updateEntryNotes] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    await adminDb.collection('founding_waitlist').doc(id).update({
      notes,
      updatedAt: adminTimestamp.now(),
    });

    return { success: true };
  } catch (error) {
    log.error('Error updating entry notes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update notes',
    };
  }
}

/**
 * Delete an entry
 * SECURITY: Requires admin role
 */
export async function deleteEntry(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // SECURITY: Verify admin role
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[deleteEntry] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    await adminDb.collection('founding_waitlist').doc(id).delete();
    return { success: true };
  } catch (error) {
    log.error('Error deleting entry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete entry',
    };
  }
}

/**
 * Bulk update status
 * SECURITY: Requires admin role
 */
export async function bulkUpdateStatus(
  ids: string[],
  status: WaitlistEntry['status']
): Promise<{
  success: boolean;
  updated: number;
  failed: number;
  error?: string;
}> {
  // SECURITY: Verify admin role
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[bulkUpdateStatus] Unauthorized access attempt');
    return { success: false, updated: 0, failed: ids.length, error: 'Unauthorized: Admin access required' };
  }

  if (ids.length === 0) {
    return { success: true, updated: 0, failed: 0 };
  }

  if (ids.length > 50) {
    return { success: false, updated: 0, failed: ids.length, error: 'Cannot update more than 50 entries at once' };
  }

  try {
    const batch = adminDb.batch();
    const now = adminTimestamp.now();

    for (const id of ids) {
      const docRef = adminDb.collection('founding_waitlist').doc(id);
      batch.update(docRef, {
        status,
        updatedAt: now,
      });
    }

    await batch.commit();

    return { success: true, updated: ids.length, failed: 0 };
  } catch (error) {
    log.error('Error in bulk status update:', error);
    return {
      success: false,
      updated: 0,
      failed: ids.length,
      error: error instanceof Error ? error.message : 'Failed to update entries',
    };
  }
}

/**
 * Bulk delete entries
 * SECURITY: Requires admin role
 */
export async function bulkDeleteEntries(ids: string[]): Promise<{
  success: boolean;
  deleted: number;
  failed: number;
  error?: string;
}> {
  // SECURITY: Verify admin role
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[bulkDeleteEntries] Unauthorized access attempt');
    return { success: false, deleted: 0, failed: ids.length, error: 'Unauthorized: Admin access required' };
  }

  if (ids.length === 0) {
    return { success: true, deleted: 0, failed: 0 };
  }

  if (ids.length > 50) {
    return { success: false, deleted: 0, failed: ids.length, error: 'Cannot delete more than 50 entries at once' };
  }

  try {
    const batch = adminDb.batch();

    for (const id of ids) {
      const docRef = adminDb.collection('founding_waitlist').doc(id);
      batch.delete(docRef);
    }

    await batch.commit();

    return { success: true, deleted: ids.length, failed: 0 };
  } catch (error) {
    log.error('Error in bulk delete:', error);
    return {
      success: false,
      deleted: 0,
      failed: ids.length,
      error: error instanceof Error ? error.message : 'Failed to delete entries',
    };
  }
}

// ============================================================================
// Export Operations
// ============================================================================

/**
 * Export waitlist entries to CSV format
 * SECURITY: Requires admin role
 */
export async function exportWaitlistToCSV(
  statusFilter?: WaitlistEntry['status'] | 'all'
): Promise<{
  success: boolean;
  csv?: string;
  filename?: string;
  error?: string;
}> {
  // SECURITY: Verify admin role
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[exportWaitlistToCSV] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    const result = await getWaitlistEntries();
    if (!result.success || !result.entries) {
      return { success: false, error: result.error || 'Failed to fetch waitlist' };
    }

    let entries = result.entries;

    // Apply filter
    if (statusFilter && statusFilter !== 'all') {
      entries = entries.filter(entry => entry.status === statusFilter);
    }

    // Build CSV header
    const headers = [
      'ID',
      'Email',
      'Status',
      'Source',
      'Platform Updates',
      'New Releases',
      'Important Changes',
      'Access Code',
      'Joined At',
      'Notes',
    ];

    // Helper to escape CSV fields
    const escapeCSV = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    // Build CSV rows
    const rows = entries.map(entry => [
      entry.id,
      entry.email,
      statusLabels[entry.status] || entry.status,
      entry.source,
      entry.notifications.platformUpdates ? 'Yes' : 'No',
      entry.notifications.newReleases ? 'Yes' : 'No',
      entry.notifications.importantChanges ? 'Yes' : 'No',
      entry.accessCode || '',
      entry.joinedAt?.toISOString() || '',
      escapeCSV(entry.notes || ''),
    ]);

    // Combine header and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    // Generate filename with date
    const date = new Date().toISOString().split('T')[0];
    const statusLabel = statusFilter && statusFilter !== 'all' ? `-${statusFilter}` : '';
    const filename = `waitlist${statusLabel}-${date}.csv`;

    return { success: true, csv: csvContent, filename };
  } catch (error) {
    log.error('Error exporting to CSV:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export waitlist',
    };
  }
}
