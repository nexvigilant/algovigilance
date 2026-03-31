'use server';

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import {
  moderateContent,
} from '@/lib/ai/flows/content-moderation';
import { createModerationCase, issueWarning } from '@/lib/actions/learners';
import { sendContentRemovedNotification } from './notification-service';
import { serializeForClient } from '@/lib/serialization-utils';
import type {
  ModerationRequest,
  ModerationResult,
  ModerationLog,
  AIModerationStats,
  ViolationCategory,
} from '@/types/ai-moderation';
import type {
  ViolationType,
  ContentType,
} from '@/types/learner-management';

import { logger } from '@/lib/logger';
const log = logger.scope('learners/moderation-actions');

// ============================================================================
// Type Conversion Helpers
// ============================================================================

/**
 * Safely convert ViolationCategory to ViolationType.
 * Maps categories that don't exist in ViolationType to 'other'.
 */
function toViolationType(category: ViolationCategory | undefined): ViolationType {
  if (!category || category === 'none') return 'other';
  if (category === 'medical_misinformation') return 'misinformation';
  // All other categories exist in both types
  return category as ViolationType;
}

/**
 * Assert contentType from ModerationRequest matches ContentType.
 * They have the same values, but TypeScript needs explicit typing.
 */
function asContentType(contentType: ModerationRequest['contentType']): ContentType {
  return contentType;
}

// ============================================================================
// Content Moderation with Logging
// ============================================================================

export async function moderateAndLogContent(
  request: ModerationRequest
): Promise<ModerationResult> {
  // Run moderation
  const result = await moderateContent(request);

  // Log to Firestore
  await logModerationResult(request, result);

  // Handle auto-actions
  if (result.autoActioned) {
    await handleAutoAction(request, result);
  } else if (result.requiresReview) {
    await createCaseForReview(request, result);
  }

  return result;
}

async function logModerationResult(
  request: ModerationRequest,
  result: ModerationResult
): Promise<string> {
  const logRef = await adminDb.collection('moderation_logs').add({
    contentId: request.contentId,
    contentType: request.contentType,
    authorId: request.authorId,
    contentSnapshot: request.content.slice(0, 500), // Limit snapshot size

    // Result
    approved: result.approved,
    requiresReview: result.requiresReview,
    autoActioned: result.autoActioned,
    overallRiskScore: result.overallRiskScore,
    confidenceScore: result.confidenceScore,
    violations: result.violations,
    primaryViolation: result.primaryViolation,
    recommendedAction: result.recommendedAction,
    modelUsed: result.modelUsed,
    analysisTimeMs: result.analysisTimeMs,
    tier: result.tier,

    // Timestamps
    createdAt: FieldValue.serverTimestamp(),
    actionTaken: result.recommendedAction,
    actionAutomatic: result.autoActioned,
  });

  return logRef.id;
}

async function handleAutoAction(
  request: ModerationRequest,
  result: ModerationResult
): Promise<void> {
  const systemUserId = 'system_ai_moderation';

  switch (result.recommendedAction) {
    case 'auto_warn':
      // Issue automated warning
      if (result.primaryViolation) {
        await issueWarning(
          {
            userId: request.authorId,
            level: result.violations[0]?.severity === 'high' ? 3 : 2,
            type: toViolationType(result.primaryViolation),
            message: `Automated warning: ${result.violations[0]?.explanation || 'Policy violation detected'}`,
            expiresInDays: 30,
          },
          systemUserId
        );
      }
      break;

    case 'auto_remove':
      // Create case and mark content for removal
      await createModerationCase(
        {
          reportedUserId: request.authorId,
          reportedContentId: request.contentId,
          reportedContentType: asContentType(request.contentType),
          contentSnapshot: request.content.slice(0, 500),
          priority: 'high',
          violationType: toViolationType(result.primaryViolation),
          description: `Auto-flagged by AI: ${result.violations[0]?.explanation}`,
          evidence: [...(result.violations[0]?.evidence || [])],
          source: 'ai_detection',
        },
        systemUserId
      );

      // Send notification to user about content removal
      await sendContentRemovedNotification(
        request.authorId,
        request.contentType,
        result.primaryViolation || 'Policy Violation',
        request.content
      );
      break;

    case 'auto_suspend':
      // Create high-priority case for immediate review
      await createModerationCase(
        {
          reportedUserId: request.authorId,
          reportedContentId: request.contentId,
          reportedContentType: asContentType(request.contentType),
          contentSnapshot: request.content.slice(0, 500),
          priority: 'critical',
          violationType: toViolationType(result.primaryViolation),
          description: `CRITICAL: Auto-flagged for suspension - ${result.violations[0]?.explanation}`,
          evidence: [...(result.violations[0]?.evidence || [])],
          source: 'ai_detection',
        },
        systemUserId
      );
      break;
  }
}

async function createCaseForReview(
  request: ModerationRequest,
  result: ModerationResult
): Promise<void> {
  const systemUserId = 'system_ai_moderation';

  // Determine priority based on risk score
  let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium';
  if (result.overallRiskScore > 0.8) priority = 'high';
  else if (result.overallRiskScore > 0.9) priority = 'critical';
  else if (result.overallRiskScore < 0.4) priority = 'low';

  await createModerationCase(
    {
      reportedUserId: request.authorId,
      reportedContentId: request.contentId,
      reportedContentType: asContentType(request.contentType),
      contentSnapshot: request.content.slice(0, 500),
      priority,
      violationType: toViolationType(result.primaryViolation),
      description: `AI flagged for review (risk: ${(result.overallRiskScore * 100).toFixed(0)}%): ${result.violations[0]?.explanation || 'Potential policy concern'}`,
      evidence: result.violations.flatMap((v) => [...v.evidence]),
      source: 'ai_detection',
    },
    systemUserId
  );
}

// ============================================================================
// Convenience Functions for Content Types
// ============================================================================

export async function moderatePostContent(
  postId: string,
  content: string,
  authorId: string,
  title?: string
): Promise<ModerationResult> {
  return moderateAndLogContent({
    contentId: postId,
    contentType: 'post',
    content: title ? `Title: ${title}\n\n${content}` : content,
    authorId,
    metadata: { title },
  });
}

export async function moderateCommentContent(
  commentId: string,
  content: string,
  authorId: string,
  parentId: string
): Promise<ModerationResult> {
  return moderateAndLogContent({
    contentId: commentId,
    contentType: 'comment',
    content,
    authorId,
    metadata: { parentId },
  });
}

export async function moderateMessageContent(
  messageId: string,
  content: string,
  authorId: string
): Promise<ModerationResult> {
  return moderateAndLogContent({
    contentId: messageId,
    contentType: 'message',
    content,
    authorId,
  });
}

// ============================================================================
// Dashboard Stats
// ============================================================================

export async function getAIModerationStats(
  days: number = 7
): Promise<AIModerationStats> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const snapshot = await adminDb
      .collection('moderation_logs')
      .where('createdAt', '>=', adminTimestamp.fromDate(startDate))
      .orderBy('createdAt', 'desc')
      .get();

    let totalScanned = 0;
    let autoApproved = 0;
    let autoActioned = 0;
    let flaggedForReview = 0;
    let falsePositives = 0;
    let actionsOverridden = 0;
    let totalConfidence = 0;
    let totalProcessingTime = 0;
    const violationsByCategory = {} as Record<ViolationCategory, number>;

    snapshot.forEach((doc) => {
      const data = doc.data();
      totalScanned++;

      if (data.approved && !data.requiresReview) {
        autoApproved++;
      }

      if (data.autoActioned) {
        autoActioned++;
      }

      if (data.requiresReview) {
        flaggedForReview++;
      }

      if (data.actionOverriddenBy) {
        actionsOverridden++;
        // Count as false positive if overridden to approve
        if (data.actionTaken === 'approve' && data.recommendedAction !== 'approve') {
          falsePositives++;
        }
      }

      totalConfidence += data.confidenceScore || 0;
      totalProcessingTime += data.analysisTimeMs || 0;

      // Count violations by category
      if (data.primaryViolation) {
        const category = data.primaryViolation as ViolationCategory;
        violationsByCategory[category] =
          (violationsByCategory[category] || 0) + 1;
      }
    });

    const stats: AIModerationStats = {
      totalScanned,
      autoApproved,
      autoActioned,
      flaggedForReview,
      falsePositives,
      avgConfidence: totalScanned > 0 ? totalConfidence / totalScanned : 0,
      avgProcessingTime: totalScanned > 0 ? totalProcessingTime / totalScanned : 0,
      violationsByCategory,
      actionsOverridden,
    };

    return stats;
  } catch (error) {
    log.error('Error fetching AI moderation stats:', error);
    throw new Error('Failed to fetch AI moderation stats');
  }
}

export async function getModerationLogs(
  filters: {
    contentType?: string;
    requiresReview?: boolean;
    autoActioned?: boolean;
    limit?: number;
  } = {}
): Promise<ModerationLog[]> {
  try {
    let query = adminDb
      .collection('moderation_logs')
      .orderBy('createdAt', 'desc')
      .limit(filters.limit || 100);

    if (filters.contentType) {
      query = query.where('contentType', '==', filters.contentType);
    }

    if (filters.requiresReview !== undefined) {
      query = query.where('requiresReview', '==', filters.requiresReview);
    }

    if (filters.autoActioned !== undefined) {
      query = query.where('autoActioned', '==', filters.autoActioned);
    }

    const snapshot = await query.get();
    // Serialize timestamps for server-to-client boundary safety
    return snapshot.docs.map((doc) =>
      serializeForClient({
        logId: doc.id,
        ...doc.data(),
      })
    ) as ModerationLog[];
  } catch (error) {
    log.error('Error fetching moderation logs:', error);
    throw new Error('Failed to fetch moderation logs');
  }
}

export async function overrideModerationAction(
  logId: string,
  newAction: string,
  reason: string,
  moderatorId: string
): Promise<void> {
  try {
    await adminDb.collection('moderation_logs').doc(logId).update({
      actionTaken: newAction,
      actionOverriddenBy: moderatorId,
      actionOverrideReason: reason,
      reviewedAt: adminTimestamp.now(),
      reviewedBy: moderatorId,
    });
  } catch (error) {
    log.error('Error overriding moderation action:', error);
    throw new Error('Failed to override moderation action');
  }
}
