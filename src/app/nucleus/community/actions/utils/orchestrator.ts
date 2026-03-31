'use server';

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getAuthenticatedUser } from './auth';
import { handleActionError, createSuccessResult, type ActionResult } from './errors';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const log = logger.scope('actions/utils/orchestrator');

/**
 * Guardian Protocol: Risk Assessment Schema
 */
const _RiskScoreSchema = z.object({
  score: z.number().min(0).max(100),
  flags: z.array(z.string()),
  requiresReview: z.boolean(),
});

/**
 * AlgoVigilance Activity Orchestrator
 * 
 * A unified event-driven system that intercepts user interactions and processes them
 * through optimized Firebase transactions or batches to minimize latency and I/O costs.
 */

export type ActivityType = 
  | 'post_created' 
  | 'reply_created' 
  | 'circle_joined' 
  | 'onboarding_milestone' 
  | 'search_performed' 
  | 'reaction_added'
  | 'profile_updated';

export interface ActivityMetadata {
  contentId?: string;
  contentType?: string;
  category?: string;
  topics?: readonly string[];
  milestone?: string;
  query?: string;
  score?: number;
  [key: string]: unknown;
}

export interface ActivityEvent {
  type: ActivityType;
  metadata: ActivityMetadata;
  timestamp?: Date;
}

/**
 * Guardian Protocol: Proactive Risk Assessment
 * Analyzes activity metadata for suspicious patterns before commit.
 */
function calculateRiskScore(event: ActivityEvent): z.infer<typeof _RiskScoreSchema> {
  let score = 0;
  const flags: string[] = [];

  // Pattern 1: Rapid search harvesting
  if (event.type === 'search_performed' && (event.metadata.query?.length || 0) < 3) {
    score += 10;
    flags.push('short_query_harvesting');
  }

  // Pattern 2: Suspicious topic keywords (pre-moderation)
  const suspiciousKeywords = ['leak', 'hack', 'exploit', 'bypass'];
  const hasSuspiciousTopic = event.metadata.topics?.some(t => 
    suspiciousKeywords.some(k => t.toLowerCase().includes(k))
  );
  if (hasSuspiciousTopic) {
    score += 40;
    flags.push('suspicious_topic_metadata');
  }

  // Pattern 3: Abnormal reaction volume (would ideally check historical velocity)
  if (event.type === 'reaction_added' && event.metadata.reactionType === 'celebrate') {
    // Just a placeholder for velocity logic
  }

  return {
    score,
    flags,
    requiresReview: score >= 50,
  };
}

/**
 * Orchestrates a single user activity with unified tracking and validation.
 */
export async function orchestrateActivity(event: ActivityEvent): Promise<ActionResult & { riskLevel?: string }> {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      log.warn('Unauthenticated activity blocked', { eventType: event.type });
      return { success: false, error: 'Authentication required' };
    }

    const userId = authUser.uid;
    const batch = adminDb.batch();

    // 1. Guardian Protocol: Proactive Risk Assessment
    const risk = calculateRiskScore(event);
    if (risk.score > 80) {
      log.error('High-risk activity blocked by Guardian Protocol', { userId, flags: risk.flags });
      return { success: false, error: 'Activity blocked for security review', riskLevel: 'high' };
    }

    // 2. Create centralized engagement record
    const activityRef = adminDb.collection(`users/${userId}/activities`).doc();
    batch.set(activityRef, {
      type: event.type,
      metadata: event.metadata,
      timestamp: FieldValue.serverTimestamp(),
      sessionId: authUser.auth_time || null,
      riskScore: risk.score,
      riskFlags: risk.flags,
    });
    
    // Create global audit trail if risky
    if (risk.requiresReview) {
      const auditRef = adminDb.collection('guardian_audit_trail').doc();
      batch.set(auditRef, {
        userId,
        activityId: activityRef.id,
        type: event.type,
        risk,
        timestamp: FieldValue.serverTimestamp(),
      });
    }

    // 2. Update interest profile (Denormalized topics)
    if (event.metadata.topics?.length || event.metadata.category) {
      const interestsRef = adminDb.doc(`users/${userId}/profile/interests`);
      const topicsToAdd = [...(event.metadata.topics || []), event.metadata.category].filter(Boolean) as string[];
      
      batch.set(interestsRef, {
        topicsEngagedWith: FieldValue.arrayUnion(...topicsToAdd),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    // 3. Update User Stats based on activity type
    const userRef = adminDb.collection('users').doc(userId);
    if (event.type === 'post_created') {
      batch.update(userRef, { 'stats.postCount': FieldValue.increment(1) });
    } else if (event.type === 'circle_joined') {
      batch.update(userRef, { 'stats.circlesJoined': FieldValue.increment(1) });
    }

    // Execute atomic update
    await batch.commit();
    
    log.debug('Activity orchestrated successfully', { userId, eventType: event.type });
    return createSuccessResult();
  } catch (error) {
    return handleActionError(error, 'orchestrateActivity');
  }
}

/**
 * Processes multiple activities in a single optimized execution.
 */
export async function orchestrateBatchActivities(events: ActivityEvent[]): Promise<ActionResult> {
  if (events.length === 0) return createSuccessResult();
  
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return { success: false, error: 'Authentication required' };

    const userId = authUser.uid;
    const batch = adminDb.batch();
    const userRef = adminDb.collection('users').doc(userId);
    const interestsRef = adminDb.doc(`users/${userId}/profile/interests`);
    
    const allTopics = new Set<string>();

    for (const event of events) {
      const activityRef = adminDb.collection(`users/${userId}/activities`).doc();
      batch.set(activityRef, {
        type: event.type,
        metadata: event.metadata,
        timestamp: FieldValue.serverTimestamp(),
        sessionId: authUser.auth_time || null,
      });

      if (event.metadata.topics) event.metadata.topics.forEach(t => allTopics.add(t));
      if (event.metadata.category) allTopics.add(event.metadata.category);

      // Handle stats increment in batch
      if (event.type === 'post_created') batch.update(userRef, { 'stats.postCount': FieldValue.increment(1) });
      if (event.type === 'circle_joined') batch.update(userRef, { 'stats.circlesJoined': FieldValue.increment(1) });
    }

    if (allTopics.size > 0) {
      batch.set(interestsRef, {
        topicsEngagedWith: FieldValue.arrayUnion(...Array.from(allTopics)),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    await batch.commit();
    return createSuccessResult();
  } catch (error) {
    return handleActionError(error, 'orchestrateBatchActivities');
  }
}
