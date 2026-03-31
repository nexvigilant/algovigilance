'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

const log = logger.scope('actions/utils/auth');

/**
 * Shared authentication and user utility for community actions.
 */

/**
 * Get authenticated user from session cookie.
 * Verifies the token and returns the decoded payload.
 */
export async function getAuthenticatedUser() {
  const token = (await cookies()).get('nucleus_id_token')?.value;
  if (!token) {
    log.debug('No session token found in cookies');
    return null;
  }
  
  try {
    return await adminAuth.verifyIdToken(token, true);
  } catch (error) {
    log.error('Token verification failed', { error });
    return null;
  }
}

/**
 * Get current user information including display name and avatar.
 */
export async function getCurrentUserInfo(uid: string) {
  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      log.warn('User document not found', { uid });
      return null;
    }
    
    const userData = userDoc.data();
    return {
      uid,
      name: userData?.name || userData?.displayName || 'Anonymous',
      avatar: userData?.avatar || userData?.photoURL || null,
    };
  } catch (error) {
    log.error('Failed to fetch user info', { uid, error });
    return null;
  }
}
