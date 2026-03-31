'use server';

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-auth';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('contact-submissions/actions');

export interface ContactSubmission {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: Date | null;
  status: 'new' | 'read';
  read: boolean;
}

/**
 * Get all contact form submissions
 * SECURITY: Requires admin role
 */
export async function getContactSubmissions(): Promise<{
  success: boolean;
  submissions?: ContactSubmission[];
  error?: string;
}> {
  // SECURITY: Verify admin role
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[getContactSubmissions] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    const snapshot = await adminDb
      .collection('contact_submissions')
      .orderBy('submittedAt', 'desc')
      .get();

    const submissions: ContactSubmission[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        subject: data.subject || '',
        message: data.message || '',
        submittedAt: toDateFromSerialized(data.submittedAt) || null,
        status: data.status || 'new',
        read: data.read || false,
      };
    });

    return {
      success: true,
      submissions,
    };
  } catch (error) {
    log.error('Error fetching contact submissions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch submissions',
    };
  }
}

/**
 * Mark a submission as read
 * SECURITY: Requires admin role
 */
export async function markSubmissionAsRead(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // SECURITY: Verify admin role
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[markSubmissionAsRead] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    await adminDb.collection('contact_submissions').doc(id).update({
      status: 'read',
      read: true,
      readAt: adminTimestamp.now(),
    });

    return { success: true };
  } catch (error) {
    log.error('Error marking submission as read:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update submission',
    };
  }
}

/**
 * Delete a submission
 * SECURITY: Requires admin role
 */
export async function deleteSubmission(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // SECURITY: Verify admin role
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[deleteSubmission] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    await adminDb.collection('contact_submissions').doc(id).delete();
    return { success: true };
  } catch (error) {
    log.error('Error deleting submission:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete submission',
    };
  }
}

// ============================================================================
// Export Operations
// ============================================================================

/**
 * Export contact submissions to CSV format
 * SECURITY: Requires admin role
 */
export async function exportContactSubmissionsToCSV(
  statusFilter?: 'new' | 'read' | 'all'
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
    log.error('[exportContactSubmissionsToCSV] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    const result = await getContactSubmissions();
    if (!result.success || !result.submissions) {
      return { success: false, error: result.error || 'Failed to fetch submissions' };
    }

    let submissions = result.submissions;

    // Apply filter
    if (statusFilter && statusFilter !== 'all') {
      submissions = submissions.filter(sub => sub.status === statusFilter);
    }

    // Build CSV header
    const headers = [
      'ID',
      'Status',
      'First Name',
      'Last Name',
      'Email',
      'Subject',
      'Message',
      'Submitted At',
    ];

    // Helper to escape CSV fields
    const escapeCSV = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    // Build CSV rows
    const rows = submissions.map(sub => [
      sub.id,
      sub.status,
      escapeCSV(sub.firstName),
      escapeCSV(sub.lastName),
      sub.email,
      escapeCSV(sub.subject),
      escapeCSV(sub.message),
      sub.submittedAt?.toISOString() || '',
    ]);

    // Combine header and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    // Generate filename with date
    const date = new Date().toISOString().split('T')[0];
    const statusLabel = statusFilter && statusFilter !== 'all' ? `-${statusFilter}` : '';
    const filename = `contact-submissions${statusLabel}-${date}.csv`;

    return { success: true, csv: csvContent, filename };
  } catch (error) {
    log.error('Error exporting to CSV:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export submissions',
    };
  }
}
