'use server';

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { serializeForClient } from '@/lib/serialization-utils';
import type {
  LearnerProfile,
  LearnerFilters,
  AdminAction,
  UserRestriction,
  ModerationCase,
  UserWarning,
  Appeal,
  SuspendUserPayload,
  ChangeRolePayload,
  IssuedWarningPayload,
  ResolveCasePayload,
  CaseFilters,
  ModerationStats,
  LearnerStats,
} from '@/types/learner-management';
import {
  sendWarningNotification,
  sendSuspensionNotification,
  sendReactivationNotification,
  sendAppealApprovedNotification,
  sendAppealDeniedNotification,
} from '@/app/nucleus/admin/academy/learners/notification-service';

import { requireAdmin, requireModerator } from '@/lib/admin-auth';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('learners/actions');

// ============================================================================
// Learner Queries
// ============================================================================

export async function getLearners(filters: LearnerFilters = {}) {
  await requireAdmin();

  try {
    let query: FirebaseFirestore.Query = adminDb.collection('users');

    // Apply filters
    if (filters.role && filters.role.length > 0) {
      query = query.where('role', 'in', filters.role);
    }

    if (filters.status && filters.status.length > 0) {
      query = query.where('status', 'in', filters.status);
    }

    // Sort
    const sortField = filters.sortBy || 'createdAt';
    const sortDirection = filters.sortOrder || 'desc';
    query = query.orderBy(sortField, sortDirection);

    // Limit
    query = query.limit(filters.limit || 50);

    const snapshot = await query.get();
    const learners: LearnerProfile[] = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();

      // Get additional stats
      const [warningCount, restrictionCount, enrollmentCount] = await Promise.all([
        getActiveWarningCount(docSnap.id),
        getActiveRestrictionCount(docSnap.id),
        getEnrollmentCount(docSnap.id),
      ]);

      // Serialize timestamps for client component compatibility
      learners.push(serializeForClient({
        id: docSnap.id,
        email: data.email || '',
        displayName: data.displayName || data.email?.split('@')[0] || 'Unknown',
        photoURL: data.photoURL,
        role: data.role || 'user',
        status: data.status || 'active',
        createdAt: data.createdAt,
        lastLoginAt: data.lastLoginAt,
        lastActivityAt: data.lastActivityAt,
        enrollmentCount,
        completedCount: data.completedCount || 0,
        warningCount,
        activeRestrictions: restrictionCount,
        postCount: data.postCount || 0,
        commentCount: data.commentCount || 0,
        contributionScore: data.contributionScore || 0,
      }) as LearnerProfile);
    }

    // Client-side search filter (Firestore doesn't support full-text search)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return learners.filter(
        (l) =>
          l.email.toLowerCase().includes(searchLower) ||
          l.displayName.toLowerCase().includes(searchLower)
      );
    }

    return learners;
  } catch (error) {
    log.error('Error fetching learners:', error);
    throw new Error('Failed to fetch learners');
  }
}

export async function getLearnerById(userId: string): Promise<LearnerProfile | null> {
  await requireAdmin();

  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) return null;

    const data = userDoc.data();
    if (!data) return null;
    const [warningCount, restrictionCount, enrollmentCount] = await Promise.all([
      getActiveWarningCount(userId),
      getActiveRestrictionCount(userId),
      getEnrollmentCount(userId),
    ]);

    // Serialize timestamps for client component compatibility
    return serializeForClient({
      id: userDoc.id,
      email: data.email || '',
      displayName: data.displayName || data.email?.split('@')[0] || 'Unknown',
      photoURL: data.photoURL,
      role: data.role || 'user',
      status: data.status || 'active',
      createdAt: data.createdAt,
      lastLoginAt: data.lastLoginAt,
      lastActivityAt: data.lastActivityAt,
      enrollmentCount,
      completedCount: data.completedCount || 0,
      warningCount,
      activeRestrictions: restrictionCount,
      postCount: data.postCount || 0,
      commentCount: data.commentCount || 0,
      contributionScore: data.contributionScore || 0,
    }) as LearnerProfile;
  } catch (error) {
    log.error('Error fetching learner:', error);
    throw new Error('Failed to fetch learner');
  }
}

// ============================================================================
// Admin Actions
// ============================================================================

export async function suspendUser(payload: SuspendUserPayload, adminId: string) {
  await requireAdmin();

  try {
    const batch = adminDb.batch();
    const userRef = adminDb.collection('users').doc(payload.userId);

    // Get current state for audit
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new Error('User not found');
    const previousState = userDoc.data();
    if (!previousState) throw new Error('User data is empty');

    // Update user status
    batch.update(userRef, {
      status: 'suspended',
      updatedAt: adminTimestamp.now(),
    });

    // Create restriction record
    const restrictionRef = adminDb.collection('user_restrictions').doc();
    const expiresAt = payload.duration
      ? adminTimestamp.fromDate(new Date(Date.now() + payload.duration * 24 * 60 * 60 * 1000))
      : null;

    batch.set(restrictionRef, {
      restrictionId: restrictionRef.id,
      userId: payload.userId,
      type: 'suspension',
      reason: payload.reason,
      createdBy: adminId,
      createdAt: adminTimestamp.now(),
      expiresAt,
      active: true,
    });

    // Create audit log
    const actionRef = adminDb.collection('admin_actions').doc();
    batch.set(actionRef, {
      actionId: actionRef.id,
      actionType: 'suspend',
      targetUserId: payload.userId,
      performedBy: adminId,
      reason: payload.reason,
      metadata: { duration: payload.duration, restrictionId: restrictionRef.id },
      previousState: { status: previousState.status },
      createdAt: adminTimestamp.now(),
      reversible: true,
      reversed: false,
    });

    await batch.commit();

    // Send email notification
    const durationText = payload.duration
      ? `${payload.duration} day${payload.duration > 1 ? 's' : ''}`
      : 'Indefinite';
    await sendSuspensionNotification(
      payload.userId,
      payload.reason,
      durationText,
      toDateFromSerialized(expiresAt),
      true // canAppeal
    );

    return { success: true, restrictionId: restrictionRef.id };
  } catch (error) {
    log.error('Error suspending user:', error);
    throw new Error('Failed to suspend user');
  }
}

export async function reactivateUser(userId: string, reason: string, adminId: string) {
  await requireAdmin();

  try {
    const batch = adminDb.batch();
    const userRef = adminDb.collection('users').doc(userId);

    // Get current state
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new Error('User not found');
    const previousState = userDoc.data();
    if (!previousState) throw new Error('User data is empty');

    // Update user status
    batch.update(userRef, {
      status: 'active',
      updatedAt: adminTimestamp.now(),
    });

    // Deactivate all active restrictions
    const restrictionsSnapshot = await adminDb
      .collection('user_restrictions')
      .where('userId', '==', userId)
      .where('active', '==', true)
      .get();

    restrictionsSnapshot.forEach((doc) => {
      batch.update(doc.ref, { active: false });
    });

    // Create audit log
    const actionRef = adminDb.collection('admin_actions').doc();
    batch.set(actionRef, {
      actionId: actionRef.id,
      actionType: 'reactivate',
      targetUserId: userId,
      performedBy: adminId,
      reason,
      metadata: { deactivatedRestrictions: restrictionsSnapshot.size },
      previousState: { status: previousState.status },
      createdAt: adminTimestamp.now(),
      reversible: true,
      reversed: false,
    });

    await batch.commit();

    // Send email notification
    await sendReactivationNotification(userId, reason);

    return { success: true };
  } catch (error) {
    log.error('Error reactivating user:', error);
    throw new Error('Failed to reactivate user');
  }
}

export async function changeUserRole(payload: ChangeRolePayload, adminId: string) {
  await requireAdmin();

  try {
    const batch = adminDb.batch();
    const userRef = adminDb.collection('users').doc(payload.userId);

    // Get current state
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new Error('User not found');
    const previousState = userDoc.data();
    if (!previousState) throw new Error('User data is empty');

    // Update role
    batch.update(userRef, {
      role: payload.newRole,
      updatedAt: adminTimestamp.now(),
    });

    // Create audit log
    const actionRef = adminDb.collection('admin_actions').doc();
    batch.set(actionRef, {
      actionId: actionRef.id,
      actionType: 'role_change',
      targetUserId: payload.userId,
      performedBy: adminId,
      reason: payload.reason,
      metadata: { newRole: payload.newRole, previousRole: previousState.role },
      previousState: { role: previousState.role },
      createdAt: adminTimestamp.now(),
      reversible: true,
      reversed: false,
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    log.error('Error changing user role:', error);
    throw new Error('Failed to change user role');
  }
}

export async function forceLogout(userId: string, reason: string, adminId: string) {
  await requireAdmin();

  try {
    // Create audit log and update user flag in parallel
    // Note: Actual session invalidation would require Firebase Admin SDK
    // This creates a flag that client-side auth can check
    await Promise.all([
      adminDb.collection('admin_actions').add({
        actionType: 'force_logout',
        targetUserId: userId,
        performedBy: adminId,
        reason,
        metadata: {},
        createdAt: adminTimestamp.now(),
        reversible: false,
        reversed: false,
      }),
      adminDb.collection('users').doc(userId).update({
        forceLogout: true,
        forceLogoutAt: adminTimestamp.now(),
      }),
    ]);

    return { success: true };
  } catch (error) {
    log.error('Error forcing logout:', error);
    throw new Error('Failed to force logout');
  }
}

// ============================================================================
// Moderation Actions
// ============================================================================

export async function createModerationCase(
  caseData: Partial<ModerationCase>,
  moderatorId: string
) {
  await requireModerator();

  try {
    const caseRef = adminDb.collection('moderation_cases').doc();
    const now = adminTimestamp.now();

    await adminDb.collection('moderation_cases').add({
      caseId: caseRef.id,
      status: 'open',
      priority: caseData.priority || 'medium',
      reportedUserId: caseData.reportedUserId,
      reportedContentId: caseData.reportedContentId,
      reportedContentType: caseData.reportedContentType,
      contentSnapshot: caseData.contentSnapshot,
      violationType: caseData.violationType,
      description: caseData.description,
      evidence: caseData.evidence || [],
      assignedTo: moderatorId,
      createdAt: now,
      updatedAt: now,
      internalNotes: [],
      source: caseData.source || 'moderator',
      reportedBy: caseData.reportedBy,
    });

    return { success: true, caseId: caseRef.id };
  } catch (error) {
    log.error('Error creating case:', error);
    throw new Error('Failed to create moderation case');
  }
}

export async function resolveCase(payload: ResolveCasePayload, moderatorId: string) {
  await requireModerator();

  try {
    const batch = adminDb.batch();
    const caseRef = adminDb.collection('moderation_cases').doc(payload.caseId);

    // Get case
    const caseDoc = await caseRef.get();
    if (!caseDoc.exists) throw new Error('Case not found');
    const caseData = caseDoc.data() as ModerationCase;

    // Update case
    batch.update(caseRef, {
      status: 'resolved',
      resolution: payload.resolution,
      resolutionNotes: payload.notes,
      resolvedAt: adminTimestamp.now(),
      updatedAt: adminTimestamp.now(),
    });

    // Issue warning if specified
    if (payload.issueWarning && payload.warningLevel) {
      const warningRef = adminDb.collection('user_warnings').doc();
      batch.set(warningRef, {
        warningId: warningRef.id,
        userId: caseData.reportedUserId,
        level: payload.warningLevel,
        type: caseData.violationType,
        message: payload.notes,
        caseId: payload.caseId,
        issuedBy: moderatorId,
        issuedAt: adminTimestamp.now(),
        acknowledged: false,
        active: true,
      });
    }

    // Suspend if specified
    if (payload.suspendUser && payload.suspensionDays) {
      const userRef = adminDb.collection('users').doc(caseData.reportedUserId);
      batch.update(userRef, {
        status: 'suspended',
        updatedAt: adminTimestamp.now(),
      });

      const restrictionRef = adminDb.collection('user_restrictions').doc();
      batch.set(restrictionRef, {
        restrictionId: restrictionRef.id,
        userId: caseData.reportedUserId,
        type: 'suspension',
        reason: `Case ${payload.caseId}: ${payload.notes}`,
        createdBy: moderatorId,
        createdAt: adminTimestamp.now(),
        expiresAt: adminTimestamp.fromDate(
          new Date(Date.now() + payload.suspensionDays * 24 * 60 * 60 * 1000)
        ),
        active: true,
      });
    }

    await batch.commit();
    return { success: true };
  } catch (error) {
    log.error('Error resolving case:', error);
    throw new Error('Failed to resolve case');
  }
}

export async function issueWarning(payload: IssuedWarningPayload, moderatorId: string) {
  await requireModerator();

  try {
    const expiresAt = payload.expiresInDays
      ? adminTimestamp.fromDate(new Date(Date.now() + payload.expiresInDays * 24 * 60 * 60 * 1000))
      : null;

    const warningRef = await adminDb.collection('user_warnings').add({
      userId: payload.userId,
      level: payload.level,
      type: payload.type,
      message: payload.message,
      caseId: payload.caseId,
      issuedBy: moderatorId,
      issuedAt: adminTimestamp.now(),
      acknowledged: false,
      expiresAt,
      active: true,
    });

    // Send email notification
    await sendWarningNotification(
      payload.userId,
      String(payload.level),
      payload.message,
      toDateFromSerialized(expiresAt)
    );

    return { success: true, warningId: warningRef.id };
  } catch (error) {
    log.error('Error issuing warning:', error);
    throw new Error('Failed to issue warning');
  }
}

export async function getModerationCases(filters: CaseFilters = {}) {
  await requireModerator();

  try {
    let query: FirebaseFirestore.Query = adminDb.collection('moderation_cases');

    if (filters.status && filters.status.length > 0) {
      query = query.where('status', 'in', filters.status);
    }

    if (filters.priority && filters.priority.length > 0) {
      query = query.where('priority', 'in', filters.priority);
    }

    if (filters.assignedTo) {
      query = query.where('assignedTo', '==', filters.assignedTo);
    }

    const sortField = filters.sortBy || 'createdAt';
    const sortDirection = filters.sortOrder || 'desc';
    query = query.orderBy(sortField, sortDirection);

    const snapshot = await query.get();
    // Serialize timestamps for client component compatibility
    return snapshot.docs.map((doc) =>
      serializeForClient({ ...doc.data(), caseId: doc.id }) as ModerationCase
    );
  } catch (error) {
    log.error('Error fetching cases:', error);
    throw new Error('Failed to fetch moderation cases');
  }
}

export async function getAppeals(status?: string) {
  await requireModerator();

  try {
    let query: FirebaseFirestore.Query = adminDb
      .collection('appeals')
      .orderBy('submittedAt', 'desc');

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    // Serialize timestamps for client component compatibility
    return snapshot.docs.map((doc) =>
      serializeForClient({ ...doc.data(), appealId: doc.id }) as Appeal
    );
  } catch (error) {
    log.error('Error fetching appeals:', error);
    throw new Error('Failed to fetch appeals');
  }
}

export async function reviewAppeal(
  appealId: string,
  decision: 'approved' | 'denied',
  notes: string,
  moderatorId: string
) {
  await requireModerator();

  try {
    const appealRef = adminDb.collection('appeals').doc(appealId);
    const appealDoc = await appealRef.get();
    if (!appealDoc.exists) throw new Error('Appeal not found');

    const appealData = appealDoc.data() as Appeal;

    await appealRef.update({
      status: decision,
      reviewedBy: moderatorId,
      reviewNotes: notes,
      reviewedAt: adminTimestamp.now(),
    });

    // If approved, reverse the action (restriction and warning updates are independent)
    if (decision === 'approved') {
      const reversals: Promise<unknown>[] = [];
      if (appealData.restrictionId) {
        reversals.push(
          adminDb.collection('user_restrictions').doc(appealData.restrictionId).update({
            active: false,
          })
        );
      }
      if (appealData.warningId) {
        reversals.push(
          adminDb.collection('user_warnings').doc(appealData.warningId).update({
            active: false,
          })
        );
      }
      if (reversals.length > 0) {
        await Promise.all(reversals);
      }
    }

    // Send email notification
    const originalAction = appealData.warningId
      ? 'Warning'
      : appealData.restrictionId
        ? 'Suspension'
        : 'Moderation Action';

    if (decision === 'approved') {
      await sendAppealApprovedNotification(appealData.userId, originalAction, notes);
    } else {
      await sendAppealDeniedNotification(appealData.userId, originalAction, notes);
    }

    return { success: true };
  } catch (error) {
    log.error('Error reviewing appeal:', error);
    throw new Error('Failed to review appeal');
  }
}

// ============================================================================
// Stats & Helpers
// ============================================================================

async function getActiveWarningCount(userId: string): Promise<number> {
  const snapshot = await adminDb
    .collection('user_warnings')
    .where('userId', '==', userId)
    .where('active', '==', true)
    .get();
  return snapshot.size;
}

async function getActiveRestrictionCount(userId: string): Promise<number> {
  const snapshot = await adminDb
    .collection('user_restrictions')
    .where('userId', '==', userId)
    .where('active', '==', true)
    .get();
  return snapshot.size;
}

async function getEnrollmentCount(userId: string): Promise<number> {
  const snapshot = await adminDb
    .collection('enrollments')
    .where('userId', '==', userId)
    .get();
  return snapshot.size;
}

export async function getLearnerStats(): Promise<LearnerStats> {
  await requireAdmin();

  try {
    const snapshot = await adminDb.collection('users').get();

    const stats: LearnerStats = {
      totalLearners: snapshot.size,
      activeLearners: 0,
      suspendedUsers: 0,
      newThisWeek: 0,
      byRole: {},
    };

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    snapshot.forEach((doc) => {
      const data = doc.data();

      // Count by status
      if (data.status === 'active' || !data.status) stats.activeLearners++;
      if (data.status === 'suspended') stats.suspendedUsers++;

      // Count by role
      const role = data.role || 'user';
      stats.byRole[role] = (stats.byRole[role] || 0) + 1;

      // New this week
      if (toDateFromSerialized(data.createdAt) > oneWeekAgo) stats.newThisWeek++;
    });

    return stats;
  } catch (error) {
    log.error('Error fetching stats:', error);
    throw new Error('Failed to fetch learner stats');
  }
}

export async function getModerationStats(): Promise<ModerationStats> {
  await requireModerator();

  try {
    const snapshot = await adminDb.collection('moderation_cases').get();

    const stats: ModerationStats = {
      openCases: 0,
      criticalCases: 0,
      pendingAppeals: 0,
      resolvedToday: 0,
      avgResolutionTime: 0,
      casesByType: {} as Record<string, number>,
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let totalResolutionTime = 0;
    let resolvedCount = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();

      if (data.status === 'open' || data.status === 'in_review') stats.openCases++;
      if (data.priority === 'critical' && data.status !== 'resolved') stats.criticalCases++;

      // Count by type
      const type = (data.violationType || 'other') as keyof typeof stats.casesByType;
      stats.casesByType[type] = (stats.casesByType[type] || 0) + 1;

      // Resolved today
      if (toDateFromSerialized(data.resolvedAt) >= today) stats.resolvedToday++;

      // Resolution time
      if (data.resolvedAt && data.createdAt) {
        const resTime = toDateFromSerialized(data.resolvedAt).getTime() - toDateFromSerialized(data.createdAt).getTime();
        totalResolutionTime += resTime;
        resolvedCount++;
      }
    });

    // Get pending appeals
    const appealsSnapshot = await adminDb
      .collection('appeals')
      .where('status', '==', 'pending')
      .get();
    stats.pendingAppeals = appealsSnapshot.size;

    // Calculate average resolution time in hours
    if (resolvedCount > 0) {
      stats.avgResolutionTime = Math.round(
        totalResolutionTime / resolvedCount / (1000 * 60 * 60)
      );
    }

    return stats;
  } catch (error) {
    log.error('Error fetching moderation stats:', error);
    throw new Error('Failed to fetch moderation stats');
  }
}

export async function getAdminActions(userId?: string, limit_count: number = 50) {
  await requireAdmin();

  try {
    let query: FirebaseFirestore.Query = adminDb
      .collection('admin_actions')
      .orderBy('createdAt', 'desc')
      .limit(limit_count);

    if (userId) {
      query = query.where('targetUserId', '==', userId);
    }

    const snapshot = await query.get();
    // Serialize timestamps for client component compatibility
    return snapshot.docs.map((doc) =>
      serializeForClient(doc.data()) as AdminAction
    );
  } catch (error) {
    log.error('Error fetching admin actions:', error);
    throw new Error('Failed to fetch admin actions');
  }
}

export async function getUserWarnings(userId: string) {
  await requireModerator();

  try {
    const snapshot = await adminDb
      .collection('user_warnings')
      .where('userId', '==', userId)
      .orderBy('issuedAt', 'desc')
      .get();
    // Serialize timestamps for client component compatibility
    return snapshot.docs.map((doc) =>
      serializeForClient(doc.data()) as UserWarning
    );
  } catch (error) {
    log.error('Error fetching warnings:', error);
    throw new Error('Failed to fetch warnings');
  }
}

export async function getUserRestrictions(userId: string) {
  await requireModerator();

  try {
    const snapshot = await adminDb
      .collection('user_restrictions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    // Serialize timestamps for client component compatibility
    return snapshot.docs.map((doc) =>
      serializeForClient(doc.data()) as UserRestriction
    );
  } catch (error) {
    log.error('Error fetching restrictions:', error);
    throw new Error('Failed to fetch restrictions');
  }
}
