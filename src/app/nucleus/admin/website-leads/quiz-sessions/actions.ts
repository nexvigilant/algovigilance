'use server';

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-auth';
import { type QuizSession, branchLabels, categoryLabels, statusLabels } from './constants';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('quiz-sessions/actions');

/**
 * Get all quiz sessions
 * SECURITY: Requires admin role
 */
export async function getQuizSessions(): Promise<{
  success: boolean;
  sessions?: QuizSession[];
  error?: string;
}> {
  // SECURITY: Verify admin role
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[getQuizSessions] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    const snapshot = await adminDb
      .collection('quiz_sessions')
      .orderBy('completedAt', 'desc')
      .get();

    const sessions: QuizSession[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        email: data.email || null,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        companyName: data.companyName || null,
        answers: data.answers || {},
        scores: data.scores || {
          strategic: 0,
          innovation: 0,
          tactical: 0,
          talent: 0,
          technology: 0,
        },
        tags: data.tags || [],
        branch: data.branch || null,
        primaryRecommendation: data.primaryRecommendation || null,
        secondaryRecommendations: data.secondaryRecommendations || [],
        status: data.status || 'incomplete',
        read: data.read || false,
        startedAt: toDateFromSerialized(data.startedAt) || null,
        completedAt: toDateFromSerialized(data.completedAt) || null,
        source: data.source || null,
        utmCampaign: data.utmCampaign || null,
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
      };
    });

    return {
      success: true,
      sessions,
    };
  } catch (error) {
    log.error('Error fetching quiz sessions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch sessions',
    };
  }
}

/**
 * Update session status
 * SECURITY: Requires admin role
 */
export async function updateSessionStatus(
  id: string,
  status: QuizSession['status']
): Promise<{
  success: boolean;
  error?: string;
}> {
  // SECURITY: Verify admin role
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[updateSessionStatus] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    await adminDb.collection('quiz_sessions').doc(id).update({
      status,
      read: true,
      updatedAt: adminTimestamp.now(),
    });

    return { success: true };
  } catch (error) {
    log.error('Error updating session status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update session',
    };
  }
}

/**
 * Mark session as read
 * SECURITY: Requires admin role
 */
export async function markSessionAsRead(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // SECURITY: Verify admin role
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[markSessionAsRead] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    await adminDb.collection('quiz_sessions').doc(id).update({
      read: true,
      readAt: adminTimestamp.now(),
    });

    return { success: true };
  } catch (error) {
    log.error('Error marking session as read:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update session',
    };
  }
}

/**
 * Delete a session
 * SECURITY: Requires admin role
 */
export async function deleteSession(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // SECURITY: Verify admin role
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[deleteSession] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    await adminDb.collection('quiz_sessions').doc(id).delete();
    return { success: true };
  } catch (error) {
    log.error('Error deleting session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete session',
    };
  }
}

/**
 * Export quiz sessions to CSV format
 * SECURITY: Requires admin role
 */
export async function exportQuizSessionsToCSV(
  statusFilter?: QuizSession['status'] | 'all'
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
    log.error('[exportQuizSessionsToCSV] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    const result = await getQuizSessions();
    if (!result.success || !result.sessions) {
      return { success: false, error: result.error || 'Failed to fetch sessions' };
    }

    let sessions = result.sessions;

    // Apply filter
    if (statusFilter && statusFilter !== 'all') {
      sessions = sessions.filter(s => s.status === statusFilter);
    }

    // Build CSV header
    const headers = [
      'ID',
      'Status',
      'Email',
      'First Name',
      'Last Name',
      'Company',
      'Branch',
      'Primary Recommendation',
      'Strategic Score',
      'Innovation Score',
      'Tactical Score',
      'Talent Score',
      'Technology Score',
      'Started At',
      'Completed At',
      'Source',
      'UTM Campaign',
    ];

    // Helper to escape CSV fields
    const escapeCSV = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    // Build CSV rows
    const rows = sessions.map(s => [
      s.id,
      statusLabels[s.status] || s.status,
      s.email || '',
      escapeCSV(s.firstName || ''),
      escapeCSV(s.lastName || ''),
      escapeCSV(s.companyName || ''),
      branchLabels[s.branch || ''] || '',
      categoryLabels[s.primaryRecommendation || ''] || s.primaryRecommendation || '',
      s.scores.strategic.toString(),
      s.scores.innovation.toString(),
      s.scores.tactical.toString(),
      s.scores.talent.toString(),
      s.scores.technology.toString(),
      s.startedAt?.toISOString() || '',
      s.completedAt?.toISOString() || '',
      s.source || '',
      s.utmCampaign || '',
    ]);

    // Combine header and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    // Generate filename with date
    const date = new Date().toISOString().split('T')[0];
    const statusLabel = statusFilter && statusFilter !== 'all' ? `-${statusFilter}` : '';
    const filename = `quiz-sessions${statusLabel}-${date}.csv`;

    return { success: true, csv: csvContent, filename };
  } catch (error) {
    log.error('Error exporting to CSV:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export sessions',
    };
  }
}
