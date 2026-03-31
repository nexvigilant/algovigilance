'use server';

import { adminDb } from '@/lib/firebase-admin';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('operations/quality-dashboard-actions');

// ============================================================================
// Quality Metrics Types
// ============================================================================

export interface ContentQualityMetrics {
  overallScore: number;
  totalKSBs: number;
  byQualityTier: {
    excellent: number;  // 80-100
    good: number;       // 60-79
    fair: number;       // 40-59
    needsWork: number;  // 0-39
  };
  avgTimeToReview: number;    // hours
  avgTimeToPublish: number;   // hours
  rejectionRate: number;      // percentage
  contentHealthTrend: 'improving' | 'stable' | 'declining';
}

export interface DomainQualityReport {
  domainId: string;
  domainName: string;
  avgQualityScore: number;
  publishedCount: number;
  reviewCount: number;
  draftCount: number;
  issuesFound: ContentIssue[];
  lastActivity: string;
}

export interface ContentIssue {
  type: 'missing_content' | 'stale_content' | 'low_quality' | 'pending_review';
  severity: 'critical' | 'warning' | 'info';
  ksbId: string;
  ksbName: string;
  domainId: string;
  domainName: string;
  description: string;
  detectedAt: string;
}

export interface ReviewerPerformance {
  reviewerId: string;
  reviewerName: string;
  totalReviews: number;
  avgReviewTime: number; // hours
  approvalRate: number;  // percentage
  recentReviews: number; // last 7 days
}

// ============================================================================
// Get Overall Quality Metrics
// ============================================================================

export async function getContentQualityMetrics(): Promise<{
  success: boolean;
  metrics?: ContentQualityMetrics;
  error?: string;
}> {
  try {
    const domainsSnapshot = await adminDb.collection('pv_domains').get();

    let totalKSBs = 0;
    let totalQualityScore = 0;
    let scoredKSBs = 0;
    const byQualityTier = { excellent: 0, good: 0, fair: 0, needsWork: 0 };

    // Parallelize KSB fetching across domains for better performance
    const domainSettled = await Promise.allSettled(
      domainsSnapshot.docs.map(async (domainDoc) => {
        const ksbsSnapshot = await adminDb
          .collection('pv_domains')
          .doc(domainDoc.id)
          .collection('capability_components')
          .get();

        const stats = {
          count: ksbsSnapshot.size,
          qualitySum: 0,
          scored: 0,
          tiers: { excellent: 0, good: 0, fair: 0, needsWork: 0 },
        };

        ksbsSnapshot.docs.forEach((ksbDoc) => {
          const data = ksbDoc.data();
          if (data.qualityScore !== undefined) {
            stats.scored++;
            stats.qualitySum += data.qualityScore;

            if (data.qualityScore >= 80) stats.tiers.excellent++;
            else if (data.qualityScore >= 60) stats.tiers.good++;
            else if (data.qualityScore >= 40) stats.tiers.fair++;
            else stats.tiers.needsWork++;
          }
        });

        return stats;
      })
    );

    // Aggregate results from parallel fetches, skipping failed domains
    for (const result of domainSettled) {
      if (result.status === 'rejected') {
        log.warn('[getContentQualityMetrics] Domain KSB fetch failed, continuing with partial data:', result.reason);
      }
    }
    const domainResults = domainSettled
      .filter((result): result is PromiseFulfilledResult<{
        count: number;
        qualitySum: number;
        scored: number;
        tiers: { excellent: number; good: number; fair: number; needsWork: number };
      }> => result.status === 'fulfilled')
      .map((result) => result.value);

    domainResults.forEach((stats) => {
      totalKSBs += stats.count;
      scoredKSBs += stats.scored;
      totalQualityScore += stats.qualitySum;
      byQualityTier.excellent += stats.tiers.excellent;
      byQualityTier.good += stats.tiers.good;
      byQualityTier.fair += stats.tiers.fair;
      byQualityTier.needsWork += stats.tiers.needsWork;
    });

    // Get review timing metrics from activity logs
    const reviewLogsSnapshot = await adminDb
      .collection('content_activity_logs')
      .where('action', '==', 'review')
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    let totalReviewTime = 0;
    let reviewCount = 0;
    let rejectionCount = 0;

    reviewLogsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.reviewTimeHours) {
        totalReviewTime += data.reviewTimeHours;
        reviewCount++;
      }
      if (data.outcome === 'rejected') {
        rejectionCount++;
      }
    });

    // Get publish timing metrics
    const publishLogsSnapshot = await adminDb
      .collection('content_activity_logs')
      .where('action', '==', 'publish')
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    let totalPublishTime = 0;
    let publishCount = 0;

    publishLogsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.totalTimeHours) {
        totalPublishTime += data.totalTimeHours;
        publishCount++;
      }
    });

    // Calculate trend based on recent quality scores vs older ones
    const recentKSBs = await adminDb
      .collection('pv_domains')
      .doc(domainsSnapshot.docs[0]?.id || 'domain-1')
      .collection('capability_components')
      .where('alo_content.lastGeneratedAt', '!=', null)
      .orderBy('alo_content.lastGeneratedAt', 'desc')
      .limit(20)
      .get();

    let recentAvg = 0;
    let recentCount = 0;
    recentKSBs.docs.forEach((doc) => {
      const data = doc.data();
      if (data.qualityScore) {
        recentAvg += data.qualityScore;
        recentCount++;
      }
    });
    recentAvg = recentCount > 0 ? recentAvg / recentCount : 0;

    const overallScore = scoredKSBs > 0 ? Math.round(totalQualityScore / scoredKSBs) : 0;
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentAvg > overallScore + 5) trend = 'improving';
    else if (recentAvg < overallScore - 5) trend = 'declining';

    return {
      success: true,
      metrics: {
        overallScore,
        totalKSBs,
        byQualityTier,
        avgTimeToReview: reviewCount > 0 ? Math.round(totalReviewTime / reviewCount) : 0,
        avgTimeToPublish: publishCount > 0 ? Math.round(totalPublishTime / publishCount) : 0,
        rejectionRate: reviewCount > 0 ? Math.round((rejectionCount / reviewCount) * 100) : 0,
        contentHealthTrend: trend,
      },
    };
  } catch (error) {
    log.error('[getContentQualityMetrics] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch quality metrics',
    };
  }
}

// ============================================================================
// Get Domain Quality Reports
// ============================================================================

export async function getDomainQualityReports(): Promise<{
  success: boolean;
  reports?: DomainQualityReport[];
  error?: string;
}> {
  try {
    const domainsSnapshot = await adminDb.collection('pv_domains').get();

    // Parallelize domain report generation for better performance
    const reportSettled = await Promise.allSettled(
      domainsSnapshot.docs.map(async (domainDoc) => {
        const domainData = domainDoc.data();
        const ksbsSnapshot = await adminDb
          .collection('pv_domains')
          .doc(domainDoc.id)
          .collection('capability_components')
          .get();

        let totalQuality = 0;
        let scoredCount = 0;
        let publishedCount = 0;
        let reviewCount = 0;
        let draftCount = 0;
        let lastActivity = '';
        const issues: ContentIssue[] = [];

        ksbsSnapshot.docs.forEach((ksbDoc) => {
          const ksbData = ksbDoc.data();
          const status = ksbData.alo_content?.status || 'draft';

          if (status === 'published') publishedCount++;
          else if (status === 'review') reviewCount++;
          else draftCount++;

          if (ksbData.qualityScore !== undefined) {
            totalQuality += ksbData.qualityScore;
            scoredCount++;

            // Flag low quality content
            if (ksbData.qualityScore < 40) {
              issues.push({
                type: 'low_quality',
                severity: 'warning',
                ksbId: ksbDoc.id,
                ksbName: ksbData.title || ksbDoc.id,
                domainId: domainDoc.id,
                domainName: domainData.name || domainDoc.id,
                description: `Quality score is ${ksbData.qualityScore}%`,
                detectedAt: new Date().toISOString(),
              });
            }
          }

          // Check for stale content (review pending > 7 days)
          if (status === 'review' && ksbData.alo_content?.generatedAt) {
            const generatedAt = new Date(ksbData.alo_content.generatedAt);
            const daysSinceGeneration = Math.floor(
              (Date.now() - generatedAt.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (daysSinceGeneration > 7) {
              issues.push({
                type: 'pending_review',
                severity: 'warning',
                ksbId: ksbDoc.id,
                ksbName: ksbData.title || ksbDoc.id,
                domainId: domainDoc.id,
                domainName: domainData.name || domainDoc.id,
                description: `Pending review for ${daysSinceGeneration} days`,
                detectedAt: new Date().toISOString(),
              });
            }
          }

          // Track last activity
          const updateTime = toDateFromSerialized(ksbData.updatedAt)?.toISOString() || '';
          if (updateTime > lastActivity) {
            lastActivity = updateTime;
          }
        });

        return {
          domainId: domainDoc.id,
          domainName: domainData.name || `Domain ${domainDoc.id}`,
          avgQualityScore: scoredCount > 0 ? Math.round(totalQuality / scoredCount) : 0,
          publishedCount,
          reviewCount,
          draftCount,
          issuesFound: issues,
          lastActivity: lastActivity || new Date().toISOString(),
        };
      })
    );

    // Collect fulfilled results, log rejected domains
    const reports: DomainQualityReport[] = [];
    for (const result of reportSettled) {
      if (result.status === 'fulfilled') {
        reports.push(result.value);
      } else {
        log.warn('[getDomainQualityReports] Domain report generation failed, continuing with partial data:', result.reason);
      }
    }

    // Sort by issues count (most issues first)
    reports.sort((a, b) => b.issuesFound.length - a.issuesFound.length);

    return { success: true, reports };
  } catch (error) {
    log.error('[getDomainQualityReports] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch domain quality reports',
    };
  }
}

// ============================================================================
// Get Content Issues (Global)
// ============================================================================

export async function getContentIssues(limit: number = 20): Promise<{
  success: boolean;
  issues?: ContentIssue[];
  totalCount?: number;
  error?: string;
}> {
  try {
    const reportsResult = await getDomainQualityReports();
    if (!reportsResult.success || !reportsResult.reports) {
      return { success: false, error: reportsResult.error };
    }

    // Collect all issues
    const allIssues: ContentIssue[] = [];
    reportsResult.reports.forEach((report) => {
      allIssues.push(...report.issuesFound);
    });

    // Sort by severity (critical first)
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return {
      success: true,
      issues: allIssues.slice(0, limit),
      totalCount: allIssues.length,
    };
  } catch (error) {
    log.error('[getContentIssues] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch content issues',
    };
  }
}

// ============================================================================
// Get Reviewer Performance
// ============================================================================

export async function getReviewerPerformance(): Promise<{
  success: boolean;
  reviewers?: ReviewerPerformance[];
  error?: string;
}> {
  try {
    // Get review logs grouped by reviewer
    const reviewLogsSnapshot = await adminDb
      .collection('content_activity_logs')
      .where('action', 'in', ['review', 'approve', 'reject'])
      .orderBy('timestamp', 'desc')
      .limit(500)
      .get();

    const reviewerMap: Record<string, {
      name: string;
      totalReviews: number;
      totalTime: number;
      approvals: number;
      recentReviews: number;
    }> = {};

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    reviewLogsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const reviewerId = data.performedBy;
      const reviewerName = data.performedByName || 'Unknown';

      if (!reviewerMap[reviewerId]) {
        reviewerMap[reviewerId] = {
          name: reviewerName,
          totalReviews: 0,
          totalTime: 0,
          approvals: 0,
          recentReviews: 0,
        };
      }

      reviewerMap[reviewerId].totalReviews++;

      if (data.reviewTimeHours) {
        reviewerMap[reviewerId].totalTime += data.reviewTimeHours;
      }

      if (data.action === 'approve' || data.outcome === 'approved') {
        reviewerMap[reviewerId].approvals++;
      }

      const logDate = toDateFromSerialized(data.timestamp) || new Date();
      if (logDate > sevenDaysAgo) {
        reviewerMap[reviewerId].recentReviews++;
      }
    });

    const reviewers: ReviewerPerformance[] = Object.entries(reviewerMap).map(
      ([id, stats]) => ({
        reviewerId: id,
        reviewerName: stats.name,
        totalReviews: stats.totalReviews,
        avgReviewTime: stats.totalReviews > 0 ? Math.round(stats.totalTime / stats.totalReviews) : 0,
        approvalRate: stats.totalReviews > 0 ? Math.round((stats.approvals / stats.totalReviews) * 100) : 0,
        recentReviews: stats.recentReviews,
      })
    );

    // Sort by total reviews descending
    reviewers.sort((a, b) => b.totalReviews - a.totalReviews);

    return { success: true, reviewers };
  } catch (error) {
    log.error('[getReviewerPerformance] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch reviewer performance',
    };
  }
}

// ============================================================================
// Data Quality Audit Report
// ============================================================================

export interface DataAuditReport {
  timestamp: string;
  summary: {
    totalKSBs: number;
    validKSBs: number;
    invalidKSBs: number;
    skippedKSBs: number;
    alosCoverage: number; // percentage of KSBs with ALO content
    fsrsCardsTotal: number;
    orphanedEnrollments: number;
  };
  ksbValidationIssues: KSBValidationIssue[];
  skippedKSBs: SkippedKSBSummary[];
  aloQualityIssues: ALOQualityIssue[];
  recommendations: string[];
}

export interface KSBValidationIssue {
  ksbId: string;
  ksbCode: string;
  domainId: string;
  missingFields: string[];
  severity: 'critical' | 'warning';
}

export interface SkippedKSBSummary {
  ksbId: string;
  ksbCode: string;
  domainId: string;
  reason: string;
  skippedAt: string;
  retryable: boolean;
  suggestedActions: string[];
}

export interface ALOQualityIssue {
  ksbId: string;
  ksbCode: string;
  domainId: string;
  issue: string;
  qualityScore?: number;
  severity: 'critical' | 'warning' | 'info';
}

/**
 * Get comprehensive data quality audit report
 *
 * This function checks:
 * - KSBs missing required fields for generation
 * - Skipped KSBs from manufacturing pipeline
 * - ALO quality issues
 * - FSRS card coverage
 * - Orphaned enrollments
 */
export async function getDataQualityAudit(): Promise<{
  success: boolean;
  report?: DataAuditReport;
  error?: string;
}> {
  try {
    const timestamp = new Date().toISOString();
    const ksbValidationIssues: KSBValidationIssue[] = [];
    const aloQualityIssues: ALOQualityIssue[] = [];
    const recommendations: string[] = [];

    // Required fields for ALO generation
    // Note: 'itemDescription' is the actual field, 'description' is a fallback
    const requiredFields = ['type', 'itemName'];
    const descriptionFields = ['itemDescription', 'description']; // Check either
    const recommendedFields = ['bloomLevel', 'proficiencyLevel', 'keywords'];

    // 1. Fetch all domains and KSBs
    log.info('[getDataQualityAudit] Starting data quality audit...');
    const domainsSnapshot = await adminDb.collection('pv_domains').get();

    let totalKSBs = 0;
    let validKSBs = 0;
    let ksbsWithALO = 0;

    // Process each domain in parallel
    const domainResults = await Promise.all(
      domainsSnapshot.docs.map(async (domainDoc) => {
        const ksbsSnapshot = await adminDb
          .collection('pv_domains')
          .doc(domainDoc.id)
          .collection('capability_components')
          .get();

        const domainStats = {
          total: ksbsSnapshot.size,
          valid: 0,
          withALO: 0,
          issues: [] as KSBValidationIssue[],
          aloIssues: [] as ALOQualityIssue[],
        };

        ksbsSnapshot.docs.forEach((ksbDoc) => {
          const ksbData = ksbDoc.data();
          const missingRequired: string[] = [];
          const missingRecommended: string[] = [];

          // Check required fields
          for (const field of requiredFields) {
            const value = ksbData[field];
            if (!value || (typeof value === 'string' && value.trim() === '')) {
              missingRequired.push(field);
            }
          }

          // Check description (either itemDescription or description)
          const hasDescription = descriptionFields.some((field) => {
            const value = ksbData[field];
            return value && (typeof value !== 'string' || value.trim() !== '');
          });
          if (!hasDescription) {
            missingRequired.push('itemDescription');
          }

          // Check recommended fields
          for (const field of recommendedFields) {
            const value = ksbData[field];
            if (!value || (typeof value === 'string' && value.trim() === '')) {
              missingRecommended.push(field);
            }
            // Special check for keywords array
            if (field === 'keywords' && (!Array.isArray(value) || value.length === 0)) {
              if (!missingRecommended.includes('keywords')) {
                missingRecommended.push('keywords');
              }
            }
          }

          // Track validation issues
          if (missingRequired.length > 0) {
            domainStats.issues.push({
              ksbId: ksbDoc.id,
              ksbCode: ksbData.code || ksbDoc.id,
              domainId: domainDoc.id,
              missingFields: missingRequired,
              severity: 'critical',
            });
          } else if (missingRecommended.length > 0) {
            domainStats.issues.push({
              ksbId: ksbDoc.id,
              ksbCode: ksbData.code || ksbDoc.id,
              domainId: domainDoc.id,
              missingFields: missingRecommended,
              severity: 'warning',
            });
            domainStats.valid++; // Still valid, just has warnings
          } else {
            domainStats.valid++;
          }

          // Check ALO content
          if (ksbData.alo_content) {
            domainStats.withALO++;

            // Check for ALO quality issues
            const aloContent = ksbData.alo_content;
            const qualityScore = ksbData.qualityScore;

            // Missing sections
            const missingSections: string[] = [];
            if (!aloContent.hook) missingSections.push('hook');
            if (!aloContent.concept) missingSections.push('concept');
            if (!aloContent.activity) missingSections.push('activity');
            if (!aloContent.reflection) missingSections.push('reflection');

            if (missingSections.length > 0) {
              domainStats.aloIssues.push({
                ksbId: ksbDoc.id,
                ksbCode: ksbData.code || ksbDoc.id,
                domainId: domainDoc.id,
                issue: `Missing ALO sections: ${missingSections.join(', ')}`,
                qualityScore,
                severity: missingSections.length > 2 ? 'critical' : 'warning',
              });
            }

            // Low quality score
            if (qualityScore !== undefined && qualityScore < 40) {
              domainStats.aloIssues.push({
                ksbId: ksbDoc.id,
                ksbCode: ksbData.code || ksbDoc.id,
                domainId: domainDoc.id,
                issue: `Low quality score: ${qualityScore}%`,
                qualityScore,
                severity: qualityScore < 20 ? 'critical' : 'warning',
              });
            }
          }
        });

        return domainStats;
      })
    );

    // Aggregate results
    for (const stats of domainResults) {
      totalKSBs += stats.total;
      validKSBs += stats.valid;
      ksbsWithALO += stats.withALO;
      ksbValidationIssues.push(...stats.issues);
      aloQualityIssues.push(...stats.aloIssues);
    }

    // 2. Fetch skipped KSBs from manufacturing pipeline
    log.info('[getDataQualityAudit] Checking skipped KSBs...');
    const skippedSnapshot = await adminDb
      .collection('manufacturing_skipped')
      .where('status', '==', 'pending_review')
      .orderBy('skippedAt', 'desc')
      .limit(100)
      .get();

    const skippedKSBs: SkippedKSBSummary[] = skippedSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ksbId: doc.id,
        ksbCode: data.ksbCode || doc.id,
        domainId: data.domainId || 'unknown',
        reason: data.reason || 'unknown',
        skippedAt: toDateFromSerialized(data.skippedAt)?.toISOString() || new Date().toISOString(),
        retryable: data.retryable ?? false,
        suggestedActions: data.suggestedActions || [],
      };
    });

    // 3. Count FSRS cards across all users (sample check)
    log.info('[getDataQualityAudit] Checking FSRS coverage...');
    let fsrsCardsTotal = 0;
    const usersSnapshot = await adminDb.collection('users').limit(50).get();

    const fsrsResults = await Promise.all(
      usersSnapshot.docs.map(async (userDoc) => {
        const cardsSnapshot = await adminDb
          .collection(`users/${userDoc.id}/fsrs_cards`)
          .get();
        return cardsSnapshot.size;
      })
    );
    fsrsCardsTotal = fsrsResults.reduce((sum, count) => sum + count, 0);

    // 4. Check for orphaned enrollments
    log.info('[getDataQualityAudit] Checking orphaned enrollments...');
    let orphanedEnrollments = 0;

    // Get all course IDs
    const coursesSnapshot = await adminDb.collection('courses').get();
    const validCourseIds = new Set(coursesSnapshot.docs.map((d) => d.id));

    // Check enrollments
    const enrollmentCheckResults = await Promise.all(
      usersSnapshot.docs.slice(0, 20).map(async (userDoc) => {
        const enrollmentsSnapshot = await adminDb
          .collection(`users/${userDoc.id}/enrollments`)
          .get();

        let orphaned = 0;
        enrollmentsSnapshot.docs.forEach((enrollDoc) => {
          const courseId = enrollDoc.data().courseId;
          if (courseId && !validCourseIds.has(courseId)) {
            orphaned++;
          }
        });
        return orphaned;
      })
    );
    orphanedEnrollments = enrollmentCheckResults.reduce((sum, count) => sum + count, 0);

    // 5. Generate recommendations
    const invalidCount = ksbValidationIssues.filter((i) => i.severity === 'critical').length;
    const warningCount = ksbValidationIssues.filter((i) => i.severity === 'warning').length;
    const skippedCount = skippedKSBs.length;
    const retryableCount = skippedKSBs.filter((s) => s.retryable).length;
    const aloCoverage = totalKSBs > 0 ? Math.round((ksbsWithALO / totalKSBs) * 100) : 0;

    if (invalidCount > 0) {
      recommendations.push(
        `Fix ${invalidCount} KSBs with missing required fields (type, itemName, description) before generation`
      );
    }

    if (warningCount > 10) {
      recommendations.push(
        `Review ${warningCount} KSBs with missing recommended fields (bloomLevel, proficiencyLevel, keywords)`
      );
    }

    if (retryableCount > 0) {
      recommendations.push(
        `${retryableCount} skipped KSBs can be retried after fixing underlying issues`
      );
    }

    if (aloCoverage < 10) {
      recommendations.push(
        `ALO coverage is low (${aloCoverage}%). Consider running batch generation for prioritized domains.`
      );
    }

    if (aloQualityIssues.filter((i) => i.severity === 'critical').length > 5) {
      recommendations.push(
        'Multiple ALOs have critical quality issues. Review and regenerate affected content.'
      );
    }

    if (orphanedEnrollments > 0) {
      recommendations.push(
        `Found ${orphanedEnrollments} orphaned enrollments referencing deleted courses. Consider cleanup.`
      );
    }

    if (fsrsCardsTotal === 0 && totalKSBs > 0) {
      recommendations.push(
        'No FSRS cards found. Run `npm run fsrs:init:all` to initialize spaced repetition cards.'
      );
    }

    // Sort issues by severity
    ksbValidationIssues.sort((a, b) => {
      const order = { critical: 0, warning: 1 };
      return order[a.severity] - order[b.severity];
    });

    aloQualityIssues.sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 };
      return order[a.severity] - order[b.severity];
    });

    log.info('[getDataQualityAudit] Audit complete', {
      totalKSBs,
      validKSBs,
      skippedCount,
      aloCoverage,
    });

    return {
      success: true,
      report: {
        timestamp,
        summary: {
          totalKSBs,
          validKSBs,
          invalidKSBs: invalidCount,
          skippedKSBs: skippedCount,
          alosCoverage: aloCoverage,
          fsrsCardsTotal,
          orphanedEnrollments,
        },
        ksbValidationIssues: ksbValidationIssues.slice(0, 50), // Limit for UI
        skippedKSBs,
        aloQualityIssues: aloQualityIssues.slice(0, 50), // Limit for UI
        recommendations,
      },
    };
  } catch (error) {
    log.error('[getDataQualityAudit] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate data quality audit',
    };
  }
}
