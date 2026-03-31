'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';
import type { SmartForum, FlexibleTimestamp } from '@/types/community';
import type { CommunityUserId } from '@/types/community/branded-ids';

import { logger } from '@/lib/logger';
const log = logger.scope('forums/moderation');

/**
 * Join request type for pending moderation
 */
interface JoinRequest {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  createdAt: FlexibleTimestamp;
  answers?: { question: string; answer: string }[];
  status: 'pending' | 'approved' | 'rejected';
}

/**
 * Helper to get authenticated user from session cookie
 */
async function getAuthenticatedUser() {
  const token = (await cookies()).get('nucleus_id_token')?.value;
  if (!token) return null;
  try {
    return await adminAuth.verifyIdToken(token, true);
  } catch (error) {
    return null;
  }
}

/**
 * Get pending join requests for a forum (moderators only)
 */
export async function getPendingJoinRequests(forumId: string): Promise<{
  success: boolean;
  requests?: JoinRequest[];
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const forumDoc = await adminDb.collection('forums').doc(forumId).get();

    if (!forumDoc.exists) {
      return { success: false, error: 'Forum not found' };
    }

    const forum = forumDoc.data() as SmartForum;

    // Check if user is moderator
    if (!forum.membership?.moderatorIds?.includes(user.uid as CommunityUserId)) {
      return {
        success: false,
        error: 'Only moderators can view join requests',
      };
    }

    // Query the join_requests subcollection
    const requestsSnapshot = await adminDb
      .collection('forums')
      .doc(forumId)
      .collection('join_requests')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();

    const requests = requestsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as JoinRequest[];

    return { success: true, requests };
  } catch (error) {
    log.error('Error fetching pending requests:', error);
    return { success: false, error: 'Failed to fetch pending requests' };
  }
}

/**
 * Approve a join request (moderators only)
 */
export async function approveJoinRequest(
  forumId: string,
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const forumDoc = await adminDb.collection('forums').doc(forumId).get();

    if (!forumDoc.exists) {
      return { success: false, error: 'Forum not found' };
    }

    const forum = forumDoc.data() as SmartForum;

    // Check if user is moderator
    if (!forum.membership?.moderatorIds?.includes(user.uid as CommunityUserId)) {
      return { success: false, error: 'Only moderators can approve requests' };
    }

    // Get the request document
    const requestDoc = await adminDb
      .collection('forums')
      .doc(forumId)
      .collection('join_requests')
      .doc(requestId)
      .get();

    if (!requestDoc.exists) {
      return { success: false, error: 'Request not found' };
    }

    const requestData = requestDoc.data();
    if (!requestData) return { success: false, error: 'Request data is empty' };
    const userId = requestData.userId;

    // Update request status
    await requestDoc.ref.update({
      status: 'approved',
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: user.uid,
    });

    // Remove from pending, add to members
    await adminDb.collection('forums').doc(forumId).update({
      'membership.pendingRequests': FieldValue.arrayRemove(userId),
      'membership.memberIds': FieldValue.arrayUnion(userId),
      'membership.memberCount': FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Notify the user
    await adminDb
      .collection('users')
      .doc(userId)
      .collection('notifications')
      .add({
        type: 'join_request_approved',
        forumId: forumId,
        forumName: forum.name,
        message: `Your request to join ${forum.name} has been approved!`,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });

    return { success: true };
  } catch (error) {
    log.error('Error approving join request:', error);
    return { success: false, error: 'Failed to approve request' };
  }
}

/**
 * Reject a join request (moderators only)
 */
export async function rejectJoinRequest(
  forumId: string,
  requestId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const forumDoc = await adminDb.collection('forums').doc(forumId).get();

    if (!forumDoc.exists) {
      return { success: false, error: 'Forum not found' };
    }

    const forum = forumDoc.data() as SmartForum;

    // Check if user is moderator
    if (!forum.membership?.moderatorIds?.includes(user.uid as CommunityUserId)) {
      return { success: false, error: 'Only moderators can reject requests' };
    }

    // Get the request document
    const requestDoc = await adminDb
      .collection('forums')
      .doc(forumId)
      .collection('join_requests')
      .doc(requestId)
      .get();

    if (!requestDoc.exists) {
      return { success: false, error: 'Request not found' };
    }

    const requestData = requestDoc.data();
    if (!requestData) return { success: false, error: 'Request data is empty' };
    const userId = requestData.userId;

    // Update request status
    await requestDoc.ref.update({
      status: 'rejected',
      reviewNote: reason || null,
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: user.uid,
    });

    // Remove from pending
    await adminDb.collection('forums').doc(forumId).update({
      'membership.pendingRequests': FieldValue.arrayRemove(userId),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Notify the user
    await adminDb
      .collection('users')
      .doc(userId)
      .collection('notifications')
      .add({
        type: 'join_request_rejected',
        forumId: forumId,
        forumName: forum.name,
        message: `Your request to join ${forum.name} was declined.${reason ? ` Reason: ${reason}` : ''}`,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });

    return { success: true };
  } catch (error) {
    log.error('Error rejecting join request:', error);
    return { success: false, error: 'Failed to reject request' };
  }
}
