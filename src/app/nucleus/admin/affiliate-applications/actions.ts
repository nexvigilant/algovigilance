'use server';

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-auth';
import {
  expertiseLabels,
  consultingInterestLabels,
} from '@/lib/schemas/affiliate';
import { sendAffiliateStatusUpdate, type AffiliateStatus } from '@/lib/email';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('affiliate-applications/actions');

export interface AffiliateApplication {
  id: string;
  programType: 'ambassador' | 'advisor';

  // Common fields
  firstName: string;
  lastName: string;
  email: string;
  linkedInProfile: string | null;
  currentRole: string;
  areaOfExpertise: string;
  motivation: string;

  // Ambassador-specific
  graduationDate?: string;
  programOfStudy?: string;
  institutionName?: string;
  careerInterests?: string[];

  // Advisor-specific
  yearsOfExperience?: number;
  currentCompany?: string;
  consultingInterest?: string;
  specializations?: string[];
  referralSource?: string;

  // Status tracking
  status: 'new' | 'reviewed' | 'interview' | 'approved' | 'declined' | 'waitlisted';
  read: boolean;
  readAt?: Date | null;
  applicationScore: number;
  notes?: string;
  reviewedBy?: string;
  reviewedAt?: Date | null;

  // Timestamps
  submittedAt: Date | null;
  updatedAt: Date | null;
  source?: string;
}

// NOTE: Labels are imported directly from '@/lib/schemas/affiliate' in client components
// 'use server' files can only export async functions

/**
 * Get all affiliate applications
 * SECURITY: Requires admin role
 */
export async function getAffiliateApplications(): Promise<{
  success: boolean;
  applications?: AffiliateApplication[];
  error?: string;
}> {
  // SECURITY: Verify admin role
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[getAffiliateApplications] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    const snapshot = await adminDb
      .collection('affiliate_applications')
      .orderBy('submittedAt', 'desc')
      .get();

    const applications: AffiliateApplication[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        programType: data.programType || 'ambassador',

        // Common fields
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        linkedInProfile: data.linkedInProfile || null,
        currentRole: data.currentRole || '',
        areaOfExpertise: data.areaOfExpertise || '',
        motivation: data.motivation || '',

        // Ambassador-specific
        graduationDate: data.graduationDate || undefined,
        programOfStudy: data.programOfStudy || undefined,
        institutionName: data.institutionName || undefined,
        careerInterests: data.careerInterests || undefined,

        // Advisor-specific
        yearsOfExperience: data.yearsOfExperience || undefined,
        currentCompany: data.currentCompany || undefined,
        consultingInterest: data.consultingInterest || undefined,
        specializations: data.specializations || undefined,
        referralSource: data.referralSource || undefined,

        // Status tracking
        status: data.status || 'new',
        read: data.read || false,
        readAt: data.readAt?.toDate ? toDateFromSerialized(data.readAt) : null,
        applicationScore: data.applicationScore || 0,
        notes: data.notes || '',
        reviewedBy: data.reviewedBy || undefined,
        reviewedAt: data.reviewedAt?.toDate ? toDateFromSerialized(data.reviewedAt) : null,

        // Timestamps
        submittedAt: data.submittedAt?.toDate ? toDateFromSerialized(data.submittedAt) : null,
        updatedAt: data.updatedAt?.toDate ? toDateFromSerialized(data.updatedAt) : null,
        source: data.source || '',
      };
    });

    return {
      success: true,
      applications,
    };
  } catch (error) {
    log.error('Error fetching affiliate applications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch applications',
    };
  }
}

/**
 * Update application status
 * SECURITY: Requires admin role
 * Sends status notification email to applicant for actionable statuses
 */
export async function updateApplicationStatus(
  id: string,
  status: AffiliateApplication['status'],
  sendEmail: boolean = true
): Promise<{
  success: boolean;
  error?: string;
}> {
  // SECURITY: Verify admin role and get current admin user
  let adminContext: { uid: string; email?: string } | null = null;
  try {
    adminContext = await requireAdmin();
  } catch (error) {
    log.error('[updateApplicationStatus] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    // First, get the application data for email notification
    const applications = await getAffiliateApplications();
    const application = applications.applications?.find(app => app.id === id);

    // Update the status with audit trail
    await adminDb.collection('affiliate_applications').doc(id).update({
      status,
      read: true,
      updatedAt: adminTimestamp.now(),
      reviewedBy: adminContext?.email || adminContext?.uid || 'admin',
      reviewedAt: adminTimestamp.now(),
    });

    // Send email notification for actionable statuses
    if (sendEmail && application && ['approved', 'declined', 'interview', 'waitlisted'].includes(status)) {
      const institutionOrCompany = application.programType === 'ambassador'
        ? application.institutionName || ''
        : application.currentCompany || '';

      sendAffiliateStatusUpdate({
        firstName: application.firstName,
        lastName: application.lastName,
        email: application.email,
        programType: application.programType,
        institutionOrCompany,
        status: status as AffiliateStatus,
        notes: application.notes,
      });

      log.debug(`📧 Status email queued for ${application.email}: ${status}`);
    }

    return { success: true };
  } catch (error) {
    log.error('Error updating application status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update application',
    };
  }
}

/**
 * Add notes to an application
 * SECURITY: Requires admin role
 */
export async function updateApplicationNotes(
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
    log.error('[updateApplicationNotes] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    await adminDb.collection('affiliate_applications').doc(id).update({
      notes,
      updatedAt: adminTimestamp.now(),
    });

    return { success: true };
  } catch (error) {
    log.error('Error updating application notes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update notes',
    };
  }
}

/**
 * Mark application as read
 * SECURITY: Requires admin role
 */
export async function markApplicationAsRead(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // SECURITY: Verify admin role
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[markApplicationAsRead] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    await adminDb.collection('affiliate_applications').doc(id).update({
      read: true,
      readAt: adminTimestamp.now(),
    });

    return { success: true };
  } catch (error) {
    log.error('Error marking application as read:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update application',
    };
  }
}

/**
 * Delete an application
 * SECURITY: Requires admin role
 */
export async function deleteApplication(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // SECURITY: Verify admin role
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[deleteApplication] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    await adminDb.collection('affiliate_applications').doc(id).delete();
    return { success: true };
  } catch (error) {
    log.error('Error deleting application:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete application',
    };
  }
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Bulk update status for multiple applications
 * SECURITY: Requires admin role
 * Sends status emails only for actionable statuses
 */
export async function bulkUpdateApplicationStatus(
  ids: string[],
  status: AffiliateApplication['status'],
  sendEmails: boolean = true
): Promise<{
  success: boolean;
  updated: number;
  failed: number;
  error?: string;
}> {
  // SECURITY: Verify admin role
  let adminContext: { uid: string; email?: string } | null = null;
  try {
    adminContext = await requireAdmin();
  } catch (error) {
    log.error('[bulkUpdateApplicationStatus] Unauthorized access attempt');
    return { success: false, updated: 0, failed: ids.length, error: 'Unauthorized: Admin access required' };
  }

  if (ids.length === 0) {
    return { success: true, updated: 0, failed: 0 };
  }

  if (ids.length > 50) {
    return { success: false, updated: 0, failed: ids.length, error: 'Cannot update more than 50 applications at once' };
  }

  try {
    // Get all applications for email sending
    const applicationsResult = await getAffiliateApplications();
    const applicationsMap = new Map(
      applicationsResult.applications?.map(app => [app.id, app]) || []
    );

    // Use batch for efficient writes
    const batch = adminDb.batch();
    const now = adminTimestamp.now();

    for (const id of ids) {
      const docRef = adminDb.collection('affiliate_applications').doc(id);
      batch.update(docRef, {
        status,
        read: true,
        updatedAt: now,
        reviewedBy: adminContext?.email || adminContext?.uid || 'admin',
        reviewedAt: now,
      });
    }

    await batch.commit();

    // Send emails for actionable statuses (async, don't block)
    if (sendEmails && ['approved', 'declined', 'interview', 'waitlisted'].includes(status)) {
      for (const id of ids) {
        const application = applicationsMap.get(id);
        if (application) {
          const institutionOrCompany = application.programType === 'ambassador'
            ? application.institutionName || ''
            : application.currentCompany || '';

          sendAffiliateStatusUpdate({
            firstName: application.firstName,
            lastName: application.lastName,
            email: application.email,
            programType: application.programType,
            institutionOrCompany,
            status: status as AffiliateStatus,
          });
        }
      }
      log.debug(`📧 Bulk status emails queued for ${ids.length} applications: ${status}`);
    }

    return { success: true, updated: ids.length, failed: 0 };
  } catch (error) {
    log.error('Error in bulk status update:', error);
    return {
      success: false,
      updated: 0,
      failed: ids.length,
      error: error instanceof Error ? error.message : 'Failed to update applications',
    };
  }
}

/**
 * Bulk delete applications
 * SECURITY: Requires admin role
 */
export async function bulkDeleteApplications(ids: string[]): Promise<{
  success: boolean;
  deleted: number;
  failed: number;
  error?: string;
}> {
  // SECURITY: Verify admin role
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[bulkDeleteApplications] Unauthorized access attempt');
    return { success: false, deleted: 0, failed: ids.length, error: 'Unauthorized: Admin access required' };
  }

  if (ids.length === 0) {
    return { success: true, deleted: 0, failed: 0 };
  }

  if (ids.length > 50) {
    return { success: false, deleted: 0, failed: ids.length, error: 'Cannot delete more than 50 applications at once' };
  }

  try {
    const batch = adminDb.batch();

    for (const id of ids) {
      const docRef = adminDb.collection('affiliate_applications').doc(id);
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
      error: error instanceof Error ? error.message : 'Failed to delete applications',
    };
  }
}

// ============================================================================
// Export Operations
// ============================================================================

/**
 * Export applications to CSV format
 * SECURITY: Requires admin role
 */
export async function exportApplicationsToCSV(
  programFilter?: 'ambassador' | 'advisor' | 'all',
  statusFilter?: AffiliateApplication['status'] | 'all'
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
    log.error('[exportApplicationsToCSV] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    const result = await getAffiliateApplications();
    if (!result.success || !result.applications) {
      return { success: false, error: result.error || 'Failed to fetch applications' };
    }

    let applications = result.applications;

    // Apply filters
    if (programFilter && programFilter !== 'all') {
      applications = applications.filter(app => app.programType === programFilter);
    }
    if (statusFilter && statusFilter !== 'all') {
      applications = applications.filter(app => app.status === statusFilter);
    }

    // Build CSV header
    const headers = [
      'ID',
      'Program',
      'Status',
      'Score',
      'First Name',
      'Last Name',
      'Email',
      'LinkedIn',
      'Current Role',
      'Institution/Company',
      'Years Experience',
      'Area of Expertise',
      'Consulting Interest',
      'Motivation',
      'Submitted At',
      'Reviewed By',
      'Reviewed At',
      'Notes',
    ];

    // Helper to escape CSV fields (wrap in quotes, escape internal quotes)
    const escapeCSV = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    // Build CSV rows
    const rows = applications.map(app => {
      const institutionOrCompany = app.programType === 'ambassador'
        ? app.institutionName || ''
        : app.currentCompany || '';

      return [
        app.id,
        app.programType,
        app.status,
        app.applicationScore.toString(),
        escapeCSV(app.firstName),
        escapeCSV(app.lastName),
        app.email,
        app.linkedInProfile || '',
        escapeCSV(app.currentRole),
        escapeCSV(institutionOrCompany),
        app.yearsOfExperience?.toString() || '',
        escapeCSV(expertiseLabels[app.areaOfExpertise] || app.areaOfExpertise),
        escapeCSV(app.consultingInterest ? consultingInterestLabels[app.consultingInterest] || app.consultingInterest : ''),
        escapeCSV(app.motivation || ''),
        app.submittedAt?.toISOString() || '',
        app.reviewedBy || '',
        app.reviewedAt?.toISOString() || '',
        escapeCSV(app.notes || ''),
      ];
    });

    // Combine header and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    // Generate filename with date
    const date = new Date().toISOString().split('T')[0];
    const filterLabel = programFilter && programFilter !== 'all' ? `-${programFilter}` : '';
    const statusLabel = statusFilter && statusFilter !== 'all' ? `-${statusFilter}` : '';
    const filename = `affiliate-applications${filterLabel}${statusLabel}-${date}.csv`;

    return { success: true, csv: csvContent, filename };
  } catch (error) {
    log.error('Error exporting to CSV:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export applications',
    };
  }
}
