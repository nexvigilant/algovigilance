'use server';

import { adminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-auth';
import type { KSBContentStatus } from '@/types/pv-curriculum';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('operations/operations-actions');

// ============================================================================
// Operations Dashboard Types
// ============================================================================

export interface DomainOperationsStats {
  domainId: string;
  domainName: string;
  total: number;
  byStatus: Record<KSBContentStatus, number>;
  readyForGeneration: number;
  needsReview: number;
  published: number;
  completionPercent: number;
}

export interface GlobalOperationsStats {
  totalKSBs: number;
  totalDomains: number;
  byStatus: Record<KSBContentStatus, number>;
  readyForGeneration: number;
  needsReview: number;
  publishedPercent: number;
  domains: DomainOperationsStats[];
  lastUpdated: string;
}

export interface ContentQueueItem {
  id: string;
  domainId: string;
  domainName: string;
  itemName: string;
  type: 'knowledge' | 'skill' | 'behavior' | 'ai_integration';
  status: KSBContentStatus;
  qualityScore?: number;
  hasResearch: boolean;
  lastModified?: string;
  modifiedBy?: string;
  assigneeId?: string;
  assigneeName?: string;
}

export interface RecentActivityItem {
  id: string;
  type: 'generation' | 'review' | 'publish' | 'research';
  ksbId: string;
  domainId: string;
  description: string;
  performedBy: string;
  performedAt: string;
}

export interface BatchOperationResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors?: string[];
}

// ============================================================================
// Fetch Global Operations Stats
// ============================================================================

export async function getGlobalOperationsStats(): Promise<{
  success: boolean;
  stats?: GlobalOperationsStats;
  error?: string;
}> {
  try {
    // Get all domains
    const domainsSnapshot = await adminDb.collection('pv_domains').get();
    const domains: DomainOperationsStats[] = [];

    const globalByStatus: Record<KSBContentStatus, number> = {
      draft: 0,
      generating: 0,
      review: 0,
      published: 0,
      archived: 0,
    };

    let totalKSBs = 0;
    let totalReadyForGeneration = 0;
    let totalNeedsReview = 0;

    // Process each domain
    for (const domainDoc of domainsSnapshot.docs) {
      const domainData = domainDoc.data();
      const domainId = domainDoc.id;
      const domainName = domainData.name || `Domain ${domainId}`;

      // Get all KSBs for this domain
      const ksbsSnapshot = await adminDb
        .collection('pv_domains')
        .doc(domainId)
        .collection('capability_components')
        .get();

      const byStatus: Record<KSBContentStatus, number> = {
        draft: 0,
        generating: 0,
        review: 0,
        published: 0,
        archived: 0,
      };

      let readyForGeneration = 0;

      ksbsSnapshot.docs.forEach((ksbDoc) => {
        const ksb = ksbDoc.data();
        const status: KSBContentStatus = ksb.status || 'draft';
        byStatus[status]++;
        globalByStatus[status]++;

        // Count ready for generation (draft with research)
        if (status === 'draft' && ksb.research?.sourceCount > 0) {
          readyForGeneration++;
          totalReadyForGeneration++;
        }
      });

      const total = ksbsSnapshot.size;
      totalKSBs += total;
      totalNeedsReview += byStatus.review;

      domains.push({
        domainId,
        domainName,
        total,
        byStatus,
        readyForGeneration,
        needsReview: byStatus.review,
        published: byStatus.published,
        completionPercent: total > 0 ? Math.round((byStatus.published / total) * 100) : 0,
      });
    }

    // Sort domains by needs review (most urgent first)
    domains.sort((a, b) => b.needsReview - a.needsReview);

    const stats: GlobalOperationsStats = {
      totalKSBs,
      totalDomains: domainsSnapshot.size,
      byStatus: globalByStatus,
      readyForGeneration: totalReadyForGeneration,
      needsReview: totalNeedsReview,
      publishedPercent: totalKSBs > 0 ? Math.round((globalByStatus.published / totalKSBs) * 100) : 0,
      domains,
      lastUpdated: new Date().toISOString(),
    };

    return { success: true, stats };
  } catch (error) {
    log.error('[getGlobalOperationsStats] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch operations stats',
    };
  }
}

// ============================================================================
// Fetch Content Queues
// ============================================================================

export async function getContentQueue(
  queueType: 'ready_for_generation' | 'needs_review' | 'recently_published',
  limit: number = 20,
  assigneeFilter?: string // Optional: filter by assigned user ID
): Promise<{
  success: boolean;
  items?: ContentQueueItem[];
  error?: string;
}> {
  try {
    const items: ContentQueueItem[] = [];

    // Get all domains
    const domainsSnapshot = await adminDb.collection('pv_domains').get();
    const domainMap = new Map<string, string>();
    domainsSnapshot.docs.forEach((doc) => {
      domainMap.set(doc.id, doc.data().name || `Domain ${doc.id}`);
    });

    // Get domain assignments for enrichment
    const assignmentsSnapshot = await adminDb
      .collection('content_assignments')
      .where('assignmentType', '==', 'domain')
      .where('status', '==', 'active')
      .get();

    const domainAssignments = new Map<string, { assigneeId: string; assigneeName: string }>();
    assignmentsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.domainId) {
        domainAssignments.set(data.domainId, {
          assigneeId: data.assigneeId,
          assigneeName: data.assigneeName,
        });
      }
    });

    // If filtering by assignee, get their assigned domains
    const assignedDomainIds = assigneeFilter
      ? new Set(
          Array.from(domainAssignments.entries())
            .filter(([, assignment]) => assignment.assigneeId === assigneeFilter)
            .map(([domainId]) => domainId)
        )
      : null;

    // Query each domain for matching KSBs
    for (const domainDoc of domainsSnapshot.docs) {
      const domainId = domainDoc.id;

      // Skip domains not assigned to the filtered user
      if (assignedDomainIds && !assignedDomainIds.has(domainId)) {
        continue;
      }

      const collectionRef = adminDb
        .collection('pv_domains')
        .doc(domainId)
        .collection('capability_components');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = collectionRef;

      // Apply filters based on queue type
      if (queueType === 'ready_for_generation') {
        query = query.where('status', '==', 'draft');
      } else if (queueType === 'needs_review') {
        query = query.where('status', '==', 'review');
      } else if (queueType === 'recently_published') {
        query = query.where('status', '==', 'published');
      }

      const snapshot = await query.limit(limit).get();
      const assignment = domainAssignments.get(domainId);

      snapshot.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
        const ksb = doc.data();

        // For ready_for_generation, only include those with research
        if (queueType === 'ready_for_generation' && !ksb.research?.sourceCount) {
          return;
        }

        items.push({
          id: doc.id,
          domainId,
          domainName: domainMap.get(domainId) || domainId,
          itemName: ksb.itemName || doc.id,
          type: ksb.type || 'knowledge',
          status: ksb.status || 'draft',
          qualityScore: ksb.coverageScore?.overall,
          hasResearch: !!(ksb.research?.sourceCount > 0),
          lastModified: toDateFromSerialized(ksb.updatedAt)?.toISOString() || undefined,
          modifiedBy: ksb.workflow?.lastModifiedBy,
          assigneeId: assignment?.assigneeId,
          assigneeName: assignment?.assigneeName,
        });
      });

      if (items.length >= limit) break;
    }

    // Sort by last modified for recently published
    if (queueType === 'recently_published') {
      items.sort((a, b) => {
        const aDate = a.lastModified ? new Date(a.lastModified).getTime() : 0;
        const bDate = b.lastModified ? new Date(b.lastModified).getTime() : 0;
        return bDate - aDate;
      });
    }

    return { success: true, items: items.slice(0, limit) };
  } catch (error) {
    log.error('[getContentQueue] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch content queue',
    };
  }
}

// ============================================================================
// Fetch Recent Activity
// ============================================================================

export async function getRecentOperationsActivity(
  limit: number = 15
): Promise<{
  success: boolean;
  activities?: RecentActivityItem[];
  error?: string;
}> {
  try {
    // Fetch recent status changes
    const statusChangesSnapshot = await adminDb
      .collection('ksb_status_changes')
      .orderBy('changedAt', 'desc')
      .limit(limit)
      .get();

    const activities: RecentActivityItem[] = statusChangesSnapshot.docs.map((doc) => {
      const data = doc.data();

      let type: RecentActivityItem['type'] = 'review';
      let description = `Status changed: ${data.previousStatus} → ${data.newStatus}`;

      if (data.newStatus === 'published') {
        type = 'publish';
        description = `Published content`;
      } else if (data.newStatus === 'review' && data.previousStatus === 'generating') {
        type = 'generation';
        description = `AI content generated`;
      }

      if (data.comment) {
        description += `: ${data.comment}`;
      }

      return {
        id: doc.id,
        type,
        ksbId: data.ksbId,
        domainId: data.domainId,
        description,
        performedBy: data.changedBy || 'system',
        performedAt: toDateFromSerialized(data.changedAt)?.toISOString() || new Date().toISOString(),
      };
    });

    return { success: true, activities };
  } catch (error) {
    log.error('[getRecentOperationsActivity] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch activity',
    };
  }
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Batch generate content for multiple KSBs
 */
export async function batchGenerateContent(
  items: { domainId: string; ksbId: string }[],
  activityEngineType: 'red_pen' | 'triage' | 'synthesis',
  userId: string
): Promise<BatchOperationResult> {
  try {
    await requireAdmin();

    let processedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Import the generation function dynamically to avoid circular deps
    const { generateALOContent } = await import('@/lib/actions/ksb-builder');

    for (const item of items) {
      try {
        const result = await generateALOContent(
          item.domainId,
          item.ksbId,
          activityEngineType,
          userId,
          { bypassQualityGates: false }
        );

        if (result.success) {
          processedCount++;
        } else {
          failedCount++;
          errors.push(`${item.ksbId}: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        failedCount++;
        errors.push(`${item.ksbId}: ${error instanceof Error ? error.message : 'Failed'}`);
      }
    }

    return {
      success: failedCount === 0,
      processedCount,
      failedCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    log.error('[batchGenerateContent] Error:', error);
    return {
      success: false,
      processedCount: 0,
      failedCount: items.length,
      errors: [error instanceof Error ? error.message : 'Batch operation failed'],
    };
  }
}

/**
 * Batch publish approved content
 */
export async function batchPublishContent(
  items: { domainId: string; ksbId: string }[],
  userId: string,
  reviewNotes?: string
): Promise<BatchOperationResult> {
  try {
    await requireAdmin();

    let processedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    const { publishKSB } = await import('@/lib/actions/ksb-builder');

    for (const item of items) {
      try {
        const result = await publishKSB(item.domainId, item.ksbId, userId, reviewNotes);

        if (result.success) {
          processedCount++;
        } else {
          failedCount++;
          errors.push(`${item.ksbId}: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        failedCount++;
        errors.push(`${item.ksbId}: ${error instanceof Error ? error.message : 'Failed'}`);
      }
    }

    return {
      success: failedCount === 0,
      processedCount,
      failedCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    log.error('[batchPublishContent] Error:', error);
    return {
      success: false,
      processedCount: 0,
      failedCount: items.length,
      errors: [error instanceof Error ? error.message : 'Batch operation failed'],
    };
  }
}

// ============================================================================
// Team Performance Metrics
// ============================================================================

export interface TeamMemberMetrics {
  memberId: string;
  memberName: string;
  memberEmail: string;
  assignedDomains: number;
  totalKSBs: number;
  publishedKSBs: number;
  reviewPending: number;
  readyToGenerate: number;
  completionRate: number;
  recentActivity: number; // Activity count in last 7 days
}

export interface TeamPerformanceStats {
  members: TeamMemberMetrics[];
  totalAssignedDomains: number;
  totalUnassignedDomains: number;
  overallCompletionRate: number;
  topPerformer?: { name: string; completionRate: number };
  lastUpdated: string;
}

export async function getTeamPerformanceStats(): Promise<{
  success: boolean;
  stats?: TeamPerformanceStats;
  error?: string;
}> {
  try {
    // Get all active domain assignments
    const assignmentsSnapshot = await adminDb
      .collection('content_assignments')
      .where('assignmentType', '==', 'domain')
      .where('status', '==', 'active')
      .get();

    // Group assignments by member
    const memberAssignments = new Map<string, {
      name: string;
      email: string;
      domains: string[];
    }>();

    assignmentsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const memberId = data.assigneeId;

      if (!memberAssignments.has(memberId)) {
        memberAssignments.set(memberId, {
          name: data.assigneeName,
          email: data.assigneeEmail,
          domains: [],
        });
      }

      if (data.domainId) {
        memberAssignments.get(memberId)?.domains.push(data.domainId);
      }
    });

    // Get all domains for unassigned count
    const domainsSnapshot = await adminDb.collection('pv_domains').get();
    const assignedDomainIds = new Set<string>();
    memberAssignments.forEach((member) => {
      member.domains.forEach((d) => assignedDomainIds.add(d));
    });

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivitySnapshot = await adminDb
      .collection('ksb_status_changes')
      .where('changedAt', '>=', sevenDaysAgo)
      .get();

    const activityByUser = new Map<string, number>();
    recentActivitySnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const userId = data.changedBy || 'system';
      activityByUser.set(userId, (activityByUser.get(userId) || 0) + 1);
    });

    // Calculate metrics for each member
    const members: TeamMemberMetrics[] = [];

    for (const [memberId, member] of memberAssignments) {
      let totalKSBs = 0;
      let publishedKSBs = 0;
      let reviewPending = 0;
      let readyToGenerate = 0;

      // Get KSB stats for each assigned domain
      for (const domainId of member.domains) {
        const ksbsSnapshot = await adminDb
          .collection('pv_domains')
          .doc(domainId)
          .collection('capability_components')
          .get();

        ksbsSnapshot.docs.forEach((doc) => {
          const ksb = doc.data();
          totalKSBs++;

          if (ksb.status === 'published') publishedKSBs++;
          if (ksb.status === 'review') reviewPending++;
          if (ksb.status === 'draft' && ksb.research?.sourceCount > 0) readyToGenerate++;
        });
      }

      members.push({
        memberId,
        memberName: member.name,
        memberEmail: member.email,
        assignedDomains: member.domains.length,
        totalKSBs,
        publishedKSBs,
        reviewPending,
        readyToGenerate,
        completionRate: totalKSBs > 0 ? Math.round((publishedKSBs / totalKSBs) * 100) : 0,
        recentActivity: activityByUser.get(memberId) || 0,
      });
    }

    // Sort by completion rate descending
    members.sort((a, b) => b.completionRate - a.completionRate);

    const totalPublished = members.reduce((sum, m) => sum + m.publishedKSBs, 0);
    const totalKSBs = members.reduce((sum, m) => sum + m.totalKSBs, 0);

    return {
      success: true,
      stats: {
        members,
        totalAssignedDomains: assignedDomainIds.size,
        totalUnassignedDomains: domainsSnapshot.size - assignedDomainIds.size,
        overallCompletionRate: totalKSBs > 0 ? Math.round((totalPublished / totalKSBs) * 100) : 0,
        topPerformer: members.length > 0 ? {
          name: members[0].memberName,
          completionRate: members[0].completionRate,
        } : undefined,
        lastUpdated: new Date().toISOString(),
      },
    };
  } catch (error) {
    log.error('[getTeamPerformanceStats] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch team performance stats',
    };
  }
}

// ============================================================================
// My Assignments (For Team Members)
// ============================================================================

export interface MyAssignmentsSummary {
  assignedDomains: Array<{
    domainId: string;
    domainName: string;
    totalKSBs: number;
    published: number;
    review: number;
    readyToGenerate: number;
    completionRate: number;
  }>;
  totals: {
    domains: number;
    totalKSBs: number;
    published: number;
    review: number;
    readyToGenerate: number;
    completionRate: number;
  };
  recentActivity: RecentActivityItem[];
}

export async function getMyAssignmentsSummary(userId: string): Promise<{
  success: boolean;
  summary?: MyAssignmentsSummary;
  error?: string;
}> {
  try {
    // Get user's domain assignments
    const assignmentsSnapshot = await adminDb
      .collection('content_assignments')
      .where('assigneeId', '==', userId)
      .where('assignmentType', '==', 'domain')
      .where('status', '==', 'active')
      .get();

    const assignedDomains: MyAssignmentsSummary['assignedDomains'] = [];
    let totalKSBs = 0;
    let totalPublished = 0;
    let totalReview = 0;
    let totalReadyToGenerate = 0;

    for (const assignmentDoc of assignmentsSnapshot.docs) {
      const assignment = assignmentDoc.data();
      const domainId = assignment.domainId;

      if (!domainId) continue;

      // Get domain details
      const domainDoc = await adminDb.collection('pv_domains').doc(domainId).get();
      const domainData = domainDoc.data();
      const domainName = domainData?.name || `Domain ${domainId}`;

      // Get KSB stats for this domain
      const ksbsSnapshot = await adminDb
        .collection('pv_domains')
        .doc(domainId)
        .collection('capability_components')
        .get();

      let published = 0;
      let review = 0;
      let readyToGenerate = 0;

      ksbsSnapshot.docs.forEach((doc) => {
        const ksb = doc.data();
        if (ksb.status === 'published') published++;
        if (ksb.status === 'review') review++;
        if (ksb.status === 'draft' && ksb.research?.sourceCount > 0) readyToGenerate++;
      });

      const domainTotalKSBs = ksbsSnapshot.size;

      assignedDomains.push({
        domainId,
        domainName,
        totalKSBs: domainTotalKSBs,
        published,
        review,
        readyToGenerate,
        completionRate: domainTotalKSBs > 0 ? Math.round((published / domainTotalKSBs) * 100) : 0,
      });

      totalKSBs += domainTotalKSBs;
      totalPublished += published;
      totalReview += review;
      totalReadyToGenerate += readyToGenerate;
    }

    // Get recent activity for this user
    const recentActivitySnapshot = await adminDb
      .collection('ksb_status_changes')
      .where('changedBy', '==', userId)
      .orderBy('changedAt', 'desc')
      .limit(10)
      .get();

    const recentActivity: RecentActivityItem[] = recentActivitySnapshot.docs.map((doc) => {
      const data = doc.data();
      let type: RecentActivityItem['type'] = 'review';
      let description = `Status: ${data.previousStatus} → ${data.newStatus}`;

      if (data.newStatus === 'published') {
        type = 'publish';
        description = 'Published content';
      } else if (data.newStatus === 'review') {
        type = 'generation';
        description = 'Generated content';
      }

      return {
        id: doc.id,
        type,
        ksbId: data.ksbId,
        domainId: data.domainId,
        description,
        performedBy: userId,
        performedAt: toDateFromSerialized(data.changedAt)?.toISOString() || new Date().toISOString(),
      };
    });

    return {
      success: true,
      summary: {
        assignedDomains,
        totals: {
          domains: assignedDomains.length,
          totalKSBs,
          published: totalPublished,
          review: totalReview,
          readyToGenerate: totalReadyToGenerate,
          completionRate: totalKSBs > 0 ? Math.round((totalPublished / totalKSBs) * 100) : 0,
        },
        recentActivity,
      },
    };
  } catch (error) {
    log.error('[getMyAssignmentsSummary] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch assignments summary',
    };
  }
}

/**
 * Get operations summary for a specific domain
 */
export async function getDomainOperationsSummary(domainId: string): Promise<{
  success: boolean;
  summary?: {
    totalKSBs: number;
    byType: Record<string, number>;
    byStatus: Record<KSBContentStatus, number>;
    avgQualityScore: number;
    readyForGeneration: number;
    missingResearch: number;
    completionRate: number;
  };
  error?: string;
}> {
  try {
    const snapshot = await adminDb
      .collection('pv_domains')
      .doc(domainId)
      .collection('capability_components')
      .get();

    const byType: Record<string, number> = {
      knowledge: 0,
      skill: 0,
      behavior: 0,
      ai_integration: 0,
    };

    const byStatus: Record<KSBContentStatus, number> = {
      draft: 0,
      generating: 0,
      review: 0,
      published: 0,
      archived: 0,
    };

    let totalQualityScore = 0;
    let qualityScoreCount = 0;
    let readyForGeneration = 0;
    let missingResearch = 0;

    snapshot.docs.forEach((doc) => {
      const ksb = doc.data();

      // Count by type
      const type = ksb.type || 'knowledge';
      byType[type] = (byType[type] || 0) + 1;

      // Count by status
      const status: KSBContentStatus = ksb.status || 'draft';
      byStatus[status]++;

      // Quality score
      if (ksb.coverageScore?.overall) {
        totalQualityScore += ksb.coverageScore.overall;
        qualityScoreCount++;
      }

      // Ready for generation
      if (status === 'draft' && ksb.research?.sourceCount > 0) {
        readyForGeneration++;
      }

      // Missing research
      if (!ksb.research?.sourceCount) {
        missingResearch++;
      }
    });

    const totalKSBs = snapshot.size;

    return {
      success: true,
      summary: {
        totalKSBs,
        byType,
        byStatus,
        avgQualityScore: qualityScoreCount > 0 ? Math.round(totalQualityScore / qualityScoreCount) : 0,
        readyForGeneration,
        missingResearch,
        completionRate: totalKSBs > 0 ? Math.round((byStatus.published / totalKSBs) * 100) : 0,
      },
    };
  } catch (error) {
    log.error('[getDomainOperationsSummary] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch domain summary',
    };
  }
}
