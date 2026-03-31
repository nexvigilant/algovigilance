import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { User } from 'firebase/auth';

import { logger } from '@/lib/logger';
const log = logger.scope('lib/sync-user');

/**
 * Sync user data from Firebase Auth to Firestore
 * Called after successful authentication to ensure user profile is up-to-date
 *
 * NOTE: This function only syncs EXISTING users to prevent race conditions.
 * New user profile creation is handled by createUserProfile() server action.
 */
export async function syncUserToFirestore(user: User) {
  if (!user) return;

  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    // GUARD: Skip sync for new users
    // Let createUserProfile() handle new user creation to prevent race conditions
    if (!userDoc.exists()) {
      log.debug('New user detected, skipping sync (profile creation handled by server action)');
      return;
    }

    // Only sync existing users - update Auth fields without overwriting profile data
    const userData = {
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      updatedAt: serverTimestamp(),
    };

    // Merge update - preserves all existing profile fields
    await setDoc(userRef, userData, { merge: true });
  } catch (error) {
    log.error('Error syncing user to Firestore:', error);
  }
}
