'use server';

/**
 * Feedback Actions
 *
 * Server actions for handling user feedback submissions.
 * Stores feedback in Firestore 'feedback' collection.
 *
 * @module app/actions/feedback
 */

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import type {
  BugReportFormData,
  FeedbackFormData,
  FeatureRequestFormData,
  FeedbackType,
  SubmissionStatus,
} from '@/types/feedback';
import { logger } from '@/lib/logger';

const log = logger.scope('actions/feedback');

// ============================================================================
// TYPES
// ============================================================================

interface SubmissionMetadata {
  userAgent: string;
  screenSize: string;
  currentPath: string;
}

interface BugReportSubmission extends BugReportFormData {
  metadata: SubmissionMetadata;
  userId?: string;
  userEmail?: string;
}

interface FeedbackSubmission extends FeedbackFormData {
  metadata: SubmissionMetadata;
  userId?: string;
  userEmail?: string;
}

interface FeatureRequestSubmission extends FeatureRequestFormData {
  metadata: SubmissionMetadata;
  userId?: string;
  userEmail?: string;
}

interface SupportMessageData {
  subject: string;
  message: string;
  userId?: string;
  userEmail?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a base feedback document with common fields.
 */
function createFeedbackDoc(
  type: FeedbackType,
  metadata: SubmissionMetadata,
  userId?: string,
  userEmail?: string
) {
  return {
    type,
    userId: userId || 'anonymous',
    userEmail: userEmail || 'anonymous',
    createdAt: adminTimestamp.now(),
    status: 'new' as SubmissionStatus,
    metadata: {
      userAgent: metadata.userAgent,
      screenSize: metadata.screenSize,
      currentPath: metadata.currentPath,
      submittedAt: new Date().toISOString(),
    },
  };
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Submit a bug report
 *
 * Saves bug report to Firestore 'feedback' collection with type: 'bug'
 */
export async function submitBugReport(data: BugReportSubmission): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const docRef = await adminDb.collection('feedback').add({
      ...createFeedbackDoc('bug', data.metadata, data.userId, data.userEmail),
      bugReport: {
        description: data.description,
        stepsToReproduce: data.stepsToReproduce || '',
        expectedBehavior: data.expectedBehavior || '',
        severity: data.severity,
      },
    });

    log.info('[Feedback] Bug report saved:', {
      id: docRef.id,
      severity: data.severity,
      preview: data.description.substring(0, 50),
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    log.error('[Feedback] Failed to save bug report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Submit general feedback
 *
 * Saves feedback to Firestore 'feedback' collection with type: 'feedback'
 */
export async function submitFeedback(data: FeedbackSubmission): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const docRef = await adminDb.collection('feedback').add({
      ...createFeedbackDoc('feedback', data.metadata, data.userId, data.userEmail),
      feedback: {
        rating: data.rating,
        comment: data.comment,
      },
    });

    log.info('[Feedback] Feedback saved:', {
      id: docRef.id,
      rating: data.rating,
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    log.error('[Feedback] Failed to save feedback:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Submit a feature request
 *
 * Saves feature request to Firestore 'feedback' collection with type: 'feature_request'
 */
export async function submitFeatureRequest(data: FeatureRequestSubmission): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const docRef = await adminDb.collection('feedback').add({
      ...createFeedbackDoc('feature_request', data.metadata, data.userId, data.userEmail),
      featureRequest: {
        area: data.area,
        description: data.description,
        valueProposition: data.valueProposition || '',
      },
    });

    log.info('[Feedback] Feature request saved:', {
      id: docRef.id,
      area: data.area,
      preview: data.description.substring(0, 50),
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    log.error('[Feedback] Failed to save feature request:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Submit a support message
 *
 * Saves support message to Firestore 'feedback' collection with type: 'support'
 * Note: For production, consider integrating with a ticket system or email service.
 */
export async function submitSupportMessage(data: SupportMessageData): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const docRef = await adminDb.collection('feedback').add({
      type: 'support' as const,
      userId: data.userId || 'anonymous',
      userEmail: data.userEmail || 'anonymous',
      createdAt: adminTimestamp.now(),
      status: 'new' as SubmissionStatus,
      supportMessage: {
        subject: data.subject,
        message: data.message,
      },
    });

    log.info('[Feedback] Support message saved:', {
      id: docRef.id,
      subject: data.subject,
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    log.error('[Feedback] Failed to save support message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// ADMIN FUNCTIONS
// ============================================================================

/**
 * Get all feedback submissions (admin only)
 *
 * @param limit - Maximum number of submissions to return
 * @param status - Filter by status (optional)
 */
export async function getFeedbackSubmissions(
  limit: number = 50,
  status?: SubmissionStatus
): Promise<{ success: boolean; submissions?: unknown[]; error?: string }> {
  try {
    let query = adminDb
      .collection('feedback')
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    const submissions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, submissions };
  } catch (error) {
    log.error('[Feedback] Failed to get submissions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update feedback submission status (admin only)
 */
export async function updateFeedbackStatus(
  feedbackId: string,
  status: SubmissionStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    await adminDb.collection('feedback').doc(feedbackId).update({
      status,
      updatedAt: adminTimestamp.now(),
    });

    log.info('[Feedback] Status updated:', { feedbackId, status });

    return { success: true };
  } catch (error) {
    log.error('[Feedback] Failed to update status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
