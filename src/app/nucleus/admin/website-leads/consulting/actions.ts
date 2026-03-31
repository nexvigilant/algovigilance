'use server';

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-auth';
import {
  type ConsultingInquiry,
  companyTypeLabels,
  companySizeLabels,
  categoryLabels,
  budgetLabels,
  timelineLabels,
  statusLabels,
} from './constants';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('consulting-leads/actions');

/**
 * Get all consulting inquiries
 * SECURITY: Requires admin role
 */
export async function getConsultingInquiries(): Promise<{
  success: boolean;
  inquiries?: ConsultingInquiry[];
  error?: string;
}> {
  // SECURITY: Verify admin role
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[getConsultingInquiries] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    const snapshot = await adminDb
      .collection('consulting_inquiries')
      .orderBy('leadScore', 'desc')
      .orderBy('submittedAt', 'desc')
      .get();

    const inquiries: ConsultingInquiry[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        jobTitle: data.jobTitle || null,
        companyName: data.companyName || '',
        companyType: data.companyType || '',
        companySize: data.companySize || '',
        consultingCategory: data.consultingCategory || '',
        budgetRange: data.budgetRange || '',
        timeline: data.timeline || '',
        challengeDescription: data.challengeDescription || '',
        submittedAt: toDateFromSerialized(data.submittedAt) || null,
        status: data.status || 'new',
        read: data.read || false,
        leadScore: data.leadScore || 0,
        notes: data.notes || '',
        source: data.source || '',
      };
    });

    return {
      success: true,
      inquiries,
    };
  } catch (error) {
    log.error('Error fetching consulting inquiries:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch inquiries',
    };
  }
}

/**
 * Update inquiry status
 * SECURITY: Requires admin role
 */
export async function updateInquiryStatus(
  id: string,
  status: ConsultingInquiry['status']
): Promise<{
  success: boolean;
  error?: string;
}> {
  // SECURITY: Verify admin role
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[updateInquiryStatus] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    await adminDb.collection('consulting_inquiries').doc(id).update({
      status,
      read: true,
      updatedAt: adminTimestamp.now(),
    });

    return { success: true };
  } catch (error) {
    log.error('Error updating inquiry status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update inquiry',
    };
  }
}

/**
 * Add notes to an inquiry
 * SECURITY: Requires admin role
 */
export async function updateInquiryNotes(
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
    log.error('[updateInquiryNotes] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    await adminDb.collection('consulting_inquiries').doc(id).update({
      notes,
      updatedAt: adminTimestamp.now(),
    });

    return { success: true };
  } catch (error) {
    log.error('Error updating inquiry notes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update notes',
    };
  }
}

/**
 * Mark inquiry as read
 * SECURITY: Requires admin role
 */
export async function markInquiryAsRead(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // SECURITY: Verify admin role
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[markInquiryAsRead] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    await adminDb.collection('consulting_inquiries').doc(id).update({
      read: true,
      readAt: adminTimestamp.now(),
    });

    return { success: true };
  } catch (error) {
    log.error('Error marking inquiry as read:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update inquiry',
    };
  }
}

/**
 * Delete an inquiry
 * SECURITY: Requires admin role
 */
export async function deleteInquiry(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // SECURITY: Verify admin role
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[deleteInquiry] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    await adminDb.collection('consulting_inquiries').doc(id).delete();
    return { success: true };
  } catch (error) {
    log.error('Error deleting inquiry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete inquiry',
    };
  }
}

// ============================================================================
// Export Operations
// ============================================================================

/**
 * Export consulting inquiries to CSV format
 * SECURITY: Requires admin role
 */
export async function exportConsultingInquiriesToCSV(
  statusFilter?: ConsultingInquiry['status'] | 'all',
  categoryFilter?: string
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
    log.error('[exportConsultingInquiriesToCSV] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    const result = await getConsultingInquiries();
    if (!result.success || !result.inquiries) {
      return { success: false, error: result.error || 'Failed to fetch inquiries' };
    }

    let inquiries = result.inquiries;

    // Apply filters
    if (statusFilter && statusFilter !== 'all') {
      inquiries = inquiries.filter(inq => inq.status === statusFilter);
    }
    if (categoryFilter && categoryFilter !== 'all') {
      inquiries = inquiries.filter(inq => inq.consultingCategory === categoryFilter);
    }

    // Build CSV header
    const headers = [
      'ID',
      'Status',
      'Lead Score',
      'First Name',
      'Last Name',
      'Email',
      'Job Title',
      'Company Name',
      'Company Type',
      'Company Size',
      'Consulting Category',
      'Budget Range',
      'Timeline',
      'Challenge Description',
      'Source',
      'Submitted At',
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
    const rows = inquiries.map(inq => [
      inq.id,
      statusLabels[inq.status] || inq.status,
      inq.leadScore.toString(),
      escapeCSV(inq.firstName),
      escapeCSV(inq.lastName),
      inq.email,
      escapeCSV(inq.jobTitle || ''),
      escapeCSV(inq.companyName),
      companyTypeLabels[inq.companyType] || inq.companyType,
      companySizeLabels[inq.companySize] || inq.companySize,
      categoryLabels[inq.consultingCategory] || inq.consultingCategory,
      budgetLabels[inq.budgetRange] || inq.budgetRange,
      timelineLabels[inq.timeline] || inq.timeline,
      escapeCSV(inq.challengeDescription),
      inq.source || '',
      inq.submittedAt?.toISOString() || '',
      escapeCSV(inq.notes || ''),
    ]);

    // Combine header and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    // Generate filename with date
    const date = new Date().toISOString().split('T')[0];
    const statusLabel = statusFilter && statusFilter !== 'all' ? `-${statusFilter}` : '';
    const categoryLabel = categoryFilter && categoryFilter !== 'all' ? `-${categoryFilter}` : '';
    const filename = `consulting-inquiries${statusLabel}${categoryLabel}-${date}.csv`;

    return { success: true, csv: csvContent, filename };
  } catch (error) {
    log.error('Error exporting to CSV:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export inquiries',
    };
  }
}
