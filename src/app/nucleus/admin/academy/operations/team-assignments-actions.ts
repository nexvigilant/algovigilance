'use server';

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-auth';
import { notifyDomainAssignment } from './notifications-actions';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('operations/team-assignments-actions');

// ============================================================================
// Team Assignment Types
// ============================================================================

export interface TeamMember {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'user' | 'practitioner' | 'professional' | 'moderator' | 'admin';
}

export interface ContentAssignment {
  id: string;
  assigneeId: string;
  assigneeName: string;
  assigneeEmail: string;
  assignedBy: string;
  assignedAt: string;
  domainId?: string;
  domainName?: string;
  ksbId?: string;
  ksbName?: string;
  assignmentType: 'domain' | 'ksb';
  status: 'active' | 'completed' | 'reassigned';
  notes?: string;
}

export interface AssignmentStats {
  totalAssignments: number;
  byMember: Record<string, {
    name: string;
    total: number;
    domains: number;
    ksbs: number;
  }>;
  unassignedDomains: number;
  unassignedKSBs: number;
}

// ============================================================================
// Fetch Team Members (Admin/Moderator roles)
// ============================================================================

export async function getTeamMembers(): Promise<{
  success: boolean;
  members?: TeamMember[];
  error?: string;
}> {
  try {
    // Get users with admin or moderator roles
    const snapshot = await adminDb
      .collection('users')
      .where('role', 'in', ['admin', 'moderator'])
      .get();

    const members: TeamMember[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email || '',
        displayName: data.displayName || data.email || 'Unknown',
        photoURL: data.photoURL,
        role: data.role || 'user',
      };
    });

    return { success: true, members };
  } catch (error) {
    log.error('[getTeamMembers] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch team members',
    };
  }
}

// ============================================================================
// Fetch Content Assignments
// ============================================================================

export async function getContentAssignments(filters?: {
  assigneeId?: string;
  domainId?: string;
  status?: 'active' | 'completed' | 'reassigned';
}): Promise<{
  success: boolean;
  assignments?: ContentAssignment[];
  error?: string;
}> {
  try {
    let query = adminDb.collection('content_assignments') as FirebaseFirestore.Query;

    if (filters?.assigneeId) {
      query = query.where('assigneeId', '==', filters.assigneeId);
    }
    if (filters?.domainId) {
      query = query.where('domainId', '==', filters.domainId);
    }
    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }

    const snapshot = await query.orderBy('assignedAt', 'desc').get();

    const assignments: ContentAssignment[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        assigneeId: data.assigneeId,
        assigneeName: data.assigneeName,
        assigneeEmail: data.assigneeEmail,
        assignedBy: data.assignedBy,
        assignedAt: toDateFromSerialized(data.assignedAt)?.toISOString() || new Date().toISOString(),
        domainId: data.domainId,
        domainName: data.domainName,
        ksbId: data.ksbId,
        ksbName: data.ksbName,
        assignmentType: data.assignmentType,
        status: data.status,
        notes: data.notes,
      };
    });

    return { success: true, assignments };
  } catch (error) {
    log.error('[getContentAssignments] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch assignments',
    };
  }
}

// ============================================================================
// Get Assignment Statistics
// ============================================================================

export async function getAssignmentStats(): Promise<{
  success: boolean;
  stats?: AssignmentStats;
  error?: string;
}> {
  try {
    // Get all active assignments
    const assignmentsSnapshot = await adminDb
      .collection('content_assignments')
      .where('status', '==', 'active')
      .get();

    const byMember: Record<string, { name: string; total: number; domains: number; ksbs: number }> = {};
    const assignedDomains = new Set<string>();
    const assignedKSBs = new Set<string>();

    assignmentsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const memberId = data.assigneeId;
      const memberName = data.assigneeName;

      if (!byMember[memberId]) {
        byMember[memberId] = { name: memberName, total: 0, domains: 0, ksbs: 0 };
      }

      byMember[memberId].total++;

      if (data.assignmentType === 'domain') {
        byMember[memberId].domains++;
        if (data.domainId) assignedDomains.add(data.domainId);
      } else {
        byMember[memberId].ksbs++;
        if (data.ksbId) assignedKSBs.add(`${data.domainId}-${data.ksbId}`);
      }
    });

    // Count total domains
    const domainsSnapshot = await adminDb.collection('pv_domains').get();
    const totalDomains = domainsSnapshot.size;

    // Count total KSBs (sample a few domains to estimate) - parallel queries to avoid N+1
    const sampleDomains = domainsSnapshot.docs.slice(0, 5);
    const ksbCounts = await Promise.all(
      sampleDomains.map((domainDoc) =>
        adminDb
          .collection('pv_domains')
          .doc(domainDoc.id)
          .collection('capability_components')
          .get()
          .then((snapshot) => snapshot.size)
      )
    );
    // Extrapolate for remaining domains
    const totalKSBsEstimate = Math.round(
      (ksbCounts.reduce((sum, count) => sum + count, 0) / sampleDomains.length) * totalDomains
    );

    return {
      success: true,
      stats: {
        totalAssignments: assignmentsSnapshot.size,
        byMember,
        unassignedDomains: totalDomains - assignedDomains.size,
        unassignedKSBs: totalKSBsEstimate - assignedKSBs.size,
      },
    };
  } catch (error) {
    log.error('[getAssignmentStats] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch assignment stats',
    };
  }
}

// ============================================================================
// Create Assignment
// ============================================================================

export async function createAssignment(params: {
  assigneeId: string;
  assigneeName: string;
  assigneeEmail: string;
  assignedBy: string;
  assignmentType: 'domain' | 'ksb';
  domainId?: string;
  domainName?: string;
  ksbId?: string;
  ksbName?: string;
  notes?: string;
}): Promise<{
  success: boolean;
  assignmentId?: string;
  error?: string;
}> {
  try {
    await requireAdmin();

    // Check for existing active assignment
    let existingQuery = adminDb
      .collection('content_assignments')
      .where('assignmentType', '==', params.assignmentType)
      .where('status', '==', 'active') as FirebaseFirestore.Query;

    if (params.assignmentType === 'domain' && params.domainId) {
      existingQuery = existingQuery.where('domainId', '==', params.domainId);
    } else if (params.assignmentType === 'ksb' && params.ksbId) {
      existingQuery = existingQuery
        .where('domainId', '==', params.domainId)
        .where('ksbId', '==', params.ksbId);
    }

    const existingSnapshot = await existingQuery.get();

    // If there's an existing assignment, mark it as reassigned
    if (!existingSnapshot.empty) {
      const batch = adminDb.batch();
      existingSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          status: 'reassigned',
          reassignedAt: adminTimestamp.now(),
        });
      });
      await batch.commit();
    }

    // Create new assignment
    const docRef = await adminDb.collection('content_assignments').add({
      assigneeId: params.assigneeId,
      assigneeName: params.assigneeName,
      assigneeEmail: params.assigneeEmail,
      assignedBy: params.assignedBy,
      assignedAt: adminTimestamp.now(),
      assignmentType: params.assignmentType,
      domainId: params.domainId || null,
      domainName: params.domainName || null,
      ksbId: params.ksbId || null,
      ksbName: params.ksbName || null,
      status: 'active',
      notes: params.notes || null,
    });

    return { success: true, assignmentId: docRef.id };
  } catch (error) {
    log.error('[createAssignment] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create assignment',
    };
  }
}

// ============================================================================
// Remove Assignment
// ============================================================================

export async function removeAssignment(assignmentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();

    await adminDb.collection('content_assignments').doc(assignmentId).update({
      status: 'completed',
      completedAt: adminTimestamp.now(),
    });

    return { success: true };
  } catch (error) {
    log.error('[removeAssignment] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove assignment',
    };
  }
}

// ============================================================================
// Bulk Assign Domain to Team Member
// ============================================================================

export async function assignDomainToMember(
  domainId: string,
  domainName: string,
  assigneeId: string,
  assigneeName: string,
  assigneeEmail: string,
  assignedBy: string,
  notes?: string
): Promise<{
  success: boolean;
  assignmentId?: string;
  error?: string;
}> {
  const result = await createAssignment({
    assigneeId,
    assigneeName,
    assigneeEmail,
    assignedBy,
    assignmentType: 'domain',
    domainId,
    domainName,
    notes,
  });

  // Send notification to the assignee
  if (result.success) {
    await notifyDomainAssignment({
      assigneeId,
      assigneeName,
      domainId,
      domainName,
      assignedBy,
    });
  }

  return result;
}

// ============================================================================
// Get Assignments for User (My Assignments)
// ============================================================================

export async function getMyAssignments(userId: string): Promise<{
  success: boolean;
  assignments?: ContentAssignment[];
  error?: string;
}> {
  return getContentAssignments({ assigneeId: userId, status: 'active' });
}

// ============================================================================
// Get Domain Assignment
// ============================================================================

export async function getDomainAssignment(domainId: string): Promise<{
  success: boolean;
  assignment?: ContentAssignment | null;
  error?: string;
}> {
  try {
    const snapshot = await adminDb
      .collection('content_assignments')
      .where('domainId', '==', domainId)
      .where('assignmentType', '==', 'domain')
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { success: true, assignment: null };
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
      success: true,
      assignment: {
        id: doc.id,
        assigneeId: data.assigneeId,
        assigneeName: data.assigneeName,
        assigneeEmail: data.assigneeEmail,
        assignedBy: data.assignedBy,
        assignedAt: toDateFromSerialized(data.assignedAt)?.toISOString() || new Date().toISOString(),
        domainId: data.domainId,
        domainName: data.domainName,
        assignmentType: 'domain',
        status: data.status,
        notes: data.notes,
      },
    };
  } catch (error) {
    log.error('[getDomainAssignment] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch domain assignment',
    };
  }
}
