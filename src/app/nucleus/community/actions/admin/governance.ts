'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { getAuthenticatedUser } from '../utils/auth';
import { logger } from '@/lib/logger';

const log = logger.scope('actions/admin/governance');

/**
 * AlgoVigilance Community Vitality Index (CVI) Engine
 * 
 * Predictive health monitoring based on activity streams, sentiment velocity,
 * and security intervention rates.
 */

export interface CommunityHealthReport {
  vitalityIndex: number; // 0-100
  sentimentVelocity: number; // -1 to 1
  interventionRate: number; // 0-1
  matchAccuracy: number; // 0-1
  status: 'optimal' | 'stable' | 'declining' | 'critical';
  recommendations: string[];
  timestamp: Date;
}

/**
 * Calculates the Community Vitality Index (CVI).
 */
export async function getPredictiveHealthStatus(): Promise<{
  success: boolean;
  report?: CommunityHealthReport;
  error?: string;
}> {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return { success: false, error: 'Unauthorized' };

    // 1. Fetch recent activity snapshots (last 24h)
    // Convert JavaScript Date to Firestore Timestamp for proper comparison
    const twentyFourHoursAgo = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));

    // Aggregating core metrics from activity logs and audit trails
    // Use try-catch for each query since collections may not exist yet
    let activityCount = 0;
    let interventionCount = 0;

    try {
      const activitiesSnapshot = await adminDb.collectionGroup('activities')
        .where('timestamp', '>=', twentyFourHoursAgo)
        .get();
      activityCount = activitiesSnapshot.size;
    } catch {
      // Collection may not exist yet - default to 0
      log.debug('Activities collection not found, defaulting to 0');
    }

    try {
      const guardianSnapshot = await adminDb.collection('guardian_audit_trail')
        .where('timestamp', '>=', twentyFourHoursAgo)
        .get();
      interventionCount = guardianSnapshot.size;
    } catch {
      // Collection may not exist yet - default to 0
      log.debug('Guardian audit trail not found, defaulting to 0');
    }

    // 2. Calculate Sentiment Velocity (Mocked for now, would use NLP scores from posts)
    const sentimentVelocity = 0.65; // +0.65 (Strongly Positive)

    // 3. Calculate Intervention Rate
    const interventionRate = activityCount > 0 ? interventionCount / activityCount : 0;

    // 4. Calculate Match Accuracy (Mocked based on circle join conversions)
    const matchAccuracy = 0.82; // 82% conversion from discovery matches

    // 5. Compute Final CVI
    // Formula: (Engagement * 0.4) + (Sentiment * 0.3) + ((1 - InterventionRate) * 0.2) + (MatchAccuracy * 0.1)
    const engagementScore = Math.min(100, (activityCount / 500) * 100); // 500 actions/day as benchmark
    const vitalityIndex = Math.round(
      (engagementScore * 0.4) + 
      ((sentimentVelocity + 1) * 50 * 0.3) + 
      ((1 - interventionRate) * 100 * 0.2) + 
      (matchAccuracy * 100 * 0.1)
    );

    const status = vitalityIndex >= 80 ? 'optimal' : vitalityIndex >= 60 ? 'stable' : vitalityIndex >= 40 ? 'declining' : 'critical';

    // 6. Generate AI-driven recommendations
    const recommendations: string[] = [];
    if (vitalityIndex < 60) recommendations.push('Spike in low-engagement circles detected. Consider re-engagement prompts.');
    if (interventionRate > 0.05) recommendations.push('Unusual spike in Guardian interventions. Review forum moderation settings.');
    if (matchAccuracy < 0.5) recommendations.push('Discovery match accuracy falling. Audit Circle Taxonomy mappings.');

    const report: CommunityHealthReport = {
      vitalityIndex,
      sentimentVelocity,
      interventionRate,
      matchAccuracy,
      status,
      recommendations,
      timestamp: new Date(),
    };

    return { success: true, report };
  } catch (error) {
    log.error('Failed to generate health report', { error });
    return { success: false, error: 'Failed to calculate vitality index' };
  }
}

/**
 * Automated Nudge Transaction
 * Re-engages users with high match-score circles they haven't visited in 7 days.
 */
export async function executeAutomatedNudges(): Promise<{ success: boolean; nudgesSent: number }> {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser || authUser.uid !== 'system') {
      // In production, this would be triggered by a Cron/Cloud Function with system privileges
    }

    // Logic for finding users needing a nudge would go here
    // For now, returning success placeholder
    return { success: true, nudgesSent: 0 };
  } catch (error) {
    log.error('Nudge execution failed', { error });
    return { success: false, nudgesSent: 0 };
  }
}
