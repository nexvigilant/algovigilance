'use server';

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { SmartForum } from '@/types/community';
import type { CommunityUserId } from '@/types/community/branded-ids';
import { orchestrateActivity } from '../utils';
import { convertTimestamps } from '../utils/timestamp';
import { withRateLimit } from '@/lib/rate-limit';

import { getAuthenticatedUser } from '../utils/auth';
import { generateCapabilityProof, verifyCapabilityProof } from '../user/capability';

import { logger } from '@/lib/logger';
const log = logger.scope('forums/membership');

async function updateVerifiedPractitionerBadge(userId: string, pathwayId?: string) {
  if (!pathwayId) return;

  const proofResult = await generateCapabilityProof(pathwayId);
  if (!proofResult.success || !proofResult.proof?.proofToken) {
    return;
  }

  const verified = await verifyCapabilityProof(proofResult.proof.proofToken);
  if (!verified || verified.userId !== userId || verified.pathwayId !== pathwayId) {
    return;
  }

  await adminDb.collection('users').doc(userId).update({
    'capability.verifiedPractitioner': true,
    'capability.pathwayId': pathwayId,
    'capability.progressPercent': verified.progress,
    'capability.proofToken': proofResult.proof.proofToken,
    'capability.verifiedAt': FieldValue.serverTimestamp(),
  });
}

/**
 * Join a forum
 */
export async function joinForum(
  forumId: string,
  formAnswers?: {
    questionId: string;
    questionLabel: string;
    answer: string | string[];
  }[]
): Promise<{ success: boolean; pending?: boolean; error?: string }> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Rate limit check
    const rateLimitResult = await withRateLimit(user.uid, 'forum_join');
    if (!rateLimitResult.allowed) {
      log.warn('Forum join rate limit exceeded', { userId: user.uid, forumId });
      return { success: false, error: rateLimitResult.error || 'Too many join requests. Please try again later.' };
    }

    const forumRef = adminDb.collection('forums').doc(forumId);
    const forumDoc = await forumRef.get();

    if (!forumDoc.exists) {
      return { success: false, error: 'Forum not found' };
    }

    const forum = forumDoc.data() as SmartForum;
    const requiredPathway = forum.metadata?.requiredPathway;

    // Check if already a member
    if (forum.membership?.memberIds?.includes(user.uid as CommunityUserId)) {
      return { success: false, error: 'Already a member of this forum' };
    }

    // Check join type
    if (forum.membership?.joinType === 'invite-only') {
      return { success: false, error: 'This forum is invite-only' };
    }

    if (forum.membership?.joinType === 'request') {
      // Check if already has pending request
      if (forum.membership?.pendingRequests?.includes(user.uid as CommunityUserId)) {
        return {
          success: false,
          error: 'You already have a pending request for this forum',
        };
      }

      // Get user details for the request
      let userName: string | undefined;
      let userEmail: string | undefined;
      try {
        const userDoc = await adminDb.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          userName = userData?.name || userData?.displayName;
          userEmail = userData?.email;
        }
      } catch (userLookupError) {
        // Continue without user details - join request will still work
        log.debug('[membership] Could not fetch user details for join request:', userLookupError);
      }

      // Store join request with answers in subcollection
      await adminDb.collection('forums').doc(forumId).collection('join_requests').add({
        forumId,
        userId: user.uid,
        userName,
        userEmail,
        status: 'pending',
        answers: formAnswers || [],
        createdAt: FieldValue.serverTimestamp(),
      });

      // Add to pending requests array for quick lookup
      await forumRef.update({
        'membership.pendingRequests': FieldValue.arrayUnion(user.uid),
        updatedAt: FieldValue.serverTimestamp(),
      });

      try {
        await updateVerifiedPractitionerBadge(user.uid, requiredPathway);
      } catch (verificationError) {
        log.warn('Capability verification failed during join request', {
          forumId,
          userId: user.uid,
          error: verificationError,
        });
      }

      // Create notifications for forum moderators using batch write to avoid N+1
      const moderatorIds = forum.membership?.moderatorIds || [];
      if (moderatorIds.length > 0) {
        const batch = adminDb.batch();
        for (const modId of moderatorIds) {
          const notificationRef = adminDb
            .collection('users')
            .doc(modId)
            .collection('notifications')
            .doc();
          batch.set(notificationRef, {
            type: 'join_request',
            forumId: forumId,
            forumName: forum.name,
            requesterId: user.uid,
            requesterName: userName,
            message: `New join request for ${forum.name}`,
            read: false,
            createdAt: FieldValue.serverTimestamp(),
          });
        }
        await batch.commit();
      }

      return { success: true, pending: true };
    }

    // Add user to forum
    await forumRef.update({
      'membership.memberIds': [
        ...(forum.membership?.memberIds || []),
        user.uid,
      ],
      'membership.memberCount': FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Unified activity orchestration
    await orchestrateActivity({
      type: 'circle_joined',
      metadata: {
        contentId: forumId,
        contentType: 'forum',
        topics: forum.tags || [],
        category: forum.category,
      }
    });

    try {
      await updateVerifiedPractitionerBadge(user.uid, requiredPathway);
    } catch (verificationError) {
      log.warn('Capability verification failed during join', {
        forumId,
        userId: user.uid,
        error: verificationError,
      });
    }

    return { success: true };
  } catch (error) {
    log.error('Error joining forum:', error);
    return { success: false, error: 'Failed to join forum' };
  }
}

/**
 * Leave a forum
 */
export async function leaveForum(
  forumId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const forumRef = adminDb.collection('forums').doc(forumId);
    const forumDoc = await forumRef.get();

    if (!forumDoc.exists) {
      return { success: false, error: 'Forum not found' };
    }

    const forum = forumDoc.data() as SmartForum;

    // Check if user is a member
    if (!forum.membership?.memberIds?.includes(user.uid as CommunityUserId)) {
      return { success: false, error: 'Not a member of this forum' };
    }

    // Don't allow creator to leave
    if (forum.createdBy === user.uid) {
      return {
        success: false,
        error: 'Forum creator cannot leave. Archive the forum instead.',
      };
    }

    // Remove user from forum
    const updatedMemberIds = forum.membership.memberIds.filter(
      (id) => id !== user.uid
    );
    await forumRef.update({
      'membership.memberIds': updatedMemberIds,
      'membership.memberCount': FieldValue.increment(-1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    log.error('Error leaving forum:', error);
    return { success: false, error: 'Failed to leave forum' };
  }
}

/**
 * Get user's joined forums
 */
export async function getUserForums(): Promise<{
  success: boolean;
  forums?: SmartForum[];
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const querySnapshot = await adminDb
      .collection('forums')
      .where('membership.memberIds', 'array-contains', user.uid)
      .where('status', '==', 'active')
      .orderBy('stats.activityLevel', 'desc')
      .limit(50)
      .get();

    const forums = querySnapshot.docs.map((doc) => convertTimestamps({
      id: doc.id,
      ...doc.data(),
    })) as SmartForum[];

    return { success: true, forums };
  } catch (error) {
    log.error('Error fetching user forums:', error);
    return { success: false, error: 'Failed to fetch user forums' };
  }
}

/**
 * Circle Aliases (Support for AlgoVigilance terminology)
 */
export async function joinCircle(
  forumId: string,
  formAnswers?: { questionId: string; questionLabel: string; answer: string | string[] }[]
) {
  return joinForum(forumId, formAnswers);
}

export async function leaveCircle(forumId: string) {
  return leaveForum(forumId);
}

export async function getUserCircles() {
  return getUserForums();
}
