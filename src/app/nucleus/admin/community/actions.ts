'use server';

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedUser } from '../../community/actions/utils/auth';
import type { SmartForum } from '@/types/community/forums';

interface AdminUserProfile {
  uid: string;
  displayName?: string;
  email?: string;
  role?: string;
  createdAt?: unknown;
  [key: string]: unknown;
}

interface CommunitySettings {
  defaultVisibility: string;
  autoModerationLevel: string;
  features: {
    forums: boolean;
    messaging: boolean;
    polls: boolean;
  };
  updatedAt?: unknown;
  updatedBy?: string;
}

/**
 * Logs an admin action to the Guardian Audit Trail.
 */
async function logAdminAction(userId: string, actionType: string, metadata: Record<string, unknown>) {
  try {
    await adminDb.collection('guardian_audit_trail').add({
      userId,
      type: `admin_${actionType}`,
      risk: { score: 0, flags: ['admin_action'], requiresReview: false },
      metadata,
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    log.error('Failed to log admin action:', error);
  }
}

import { logger } from '@/lib/logger';
const log = logger.scope('community/actions');

// Check if user is admin - verifies session AND role
async function checkAdmin() {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  try {
    // SECURITY: Verify admin role in Firestore
    const userDoc = await adminDb.collection('users').doc(user.uid).get();
    if (!userDoc.exists) {
      log.error(`[checkAdmin] User document not found for uid: ${user.uid}`);
      throw new Error('Unauthorized: User not found');
    }

    const userData = userDoc.data();
    if (userData?.role !== 'admin') {
      log.error(`[checkAdmin] Unauthorized access attempt by user: ${user.uid}, role: ${userData?.role}`);
      throw new Error('Unauthorized: Admin access required');
    }

    return user;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      throw error;
    }
    log.error('[checkAdmin] Unexpected error during admin check', { error });
    throw new Error('Authentication failed');
  }
}

/**
 * Get all circles (forums) for admin
 * Includes active, archived, etc.
 */
export async function getAllCirclesAdmin(): Promise<SmartForum[]> {
  try {
    await checkAdmin();

    const snapshot = await adminDb
      .collection('forums')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as SmartForum
    );
  } catch (error) {
    log.error('Error fetching admin circles:', error);
    throw new Error('Failed to fetch circles');
  }
}

/**
 * Get a single circle for admin editing
 */
export async function getCircleAdmin(
  circleId: string
): Promise<SmartForum | null> {
  try {
    await checkAdmin();

    const circleDoc = await adminDb.collection('forums').doc(circleId).get();

    if (!circleDoc.exists) {
      return null;
    }

    return {
      id: circleDoc.id,
      ...circleDoc.data(),
    } as SmartForum;
  } catch (error) {
    log.error('Error fetching circle details:', error);
    return null;
  }
}

/**
 * Update circle details (admin)
 */
export async function updateCircleAdmin(
  circleId: string,
  data: Partial<SmartForum>
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await checkAdmin();

    await Promise.all([
      adminDb
        .collection('forums')
        .doc(circleId)
        .update({
          ...data,
          updatedAt: FieldValue.serverTimestamp(),
        }),
      logAdminAction(user.uid, 'update_circle', { circleId, data }),
    ]);

    revalidatePath('/nucleus/admin/community/circles');
    revalidatePath(`/nucleus/admin/community/circles/${circleId}/edit`);
    return { success: true };
  } catch (error) {
    log.error('Error updating circle:', error);
    return { success: false, error: 'Failed to update circle' };
  }
}

/**
 * Update circle status
 */
export async function updateCircleStatusAdmin(
  circleId: string,
  status: 'active' | 'archived' | 'draft'
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await checkAdmin();

    await Promise.all([
      adminDb.collection('forums').doc(circleId).update({
        status,
        updatedAt: FieldValue.serverTimestamp(),
      }),
      logAdminAction(user.uid, 'update_circle_status', { circleId, status }),
    ]);

    revalidatePath('/nucleus/admin/community/circles');
    return { success: true };
  } catch (error) {
    log.error('Error updating circle status:', error);
    return { success: false, error: 'Failed to update status' };
  }
}

/**
 * Get all users for admin
 */
export async function getAllUsersAdmin(): Promise<AdminUserProfile[]> {
  try {
    await checkAdmin();

    // Order by creation date by default, limit to 100 for now to prevent massive reads
    // In production, this should be paginated
    const snapshot = await adminDb
      .collection('users')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    return snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    log.error('Error fetching admin users:', error);
    throw new Error('Failed to fetch users');
  }
}

/**
 * Delete circle
 */
export async function deleteCircleAdmin(
  circleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await checkAdmin();

    await Promise.all([
      adminDb.collection('forums').doc(circleId).delete(),
      logAdminAction(user.uid, 'delete_circle', { circleId }),
    ]);

    revalidatePath('/nucleus/admin/community/circles');
    return { success: true };
  } catch (error) {
    log.error('Error deleting circle:', error);
    return { success: false, error: 'Failed to delete circle' };
  }
}

/**
 * Toggle circle featured status
 */
export async function toggleFeaturedCircle(
  circleId: string,
  isFeatured: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin();

    await adminDb.collection('forums').doc(circleId).update({
      'metadata.isFeatured': isFeatured,
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath('/nucleus/admin/community/discovery');
    revalidatePath('/nucleus/admin/community/circles');
    return { success: true };
  } catch (error) {
    log.error('Error toggling featured status:', error);
    return { success: false, error: 'Failed to update featured status' };
  }
}

/**
 * Get community settings
 */
export async function getCommunitySettings(): Promise<CommunitySettings | null> {
  try {
    await checkAdmin();

    const settingsDoc = await adminDb.collection('settings').doc('community').get();
    if (settingsDoc.exists) {
      return (settingsDoc.data() as CommunitySettings) ?? null;
    }

    // Default settings
    return {
      defaultVisibility: 'public',
      autoModerationLevel: 'medium',
      features: {
        forums: true,
        messaging: true,
        polls: true,
      },
    } satisfies CommunitySettings;
  } catch (error) {
    log.error('Error fetching settings:', error);
    return null;
  }
}

/**
 * Update community settings
 */
export async function updateCommunitySettings(
  settings: Partial<CommunitySettings>
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await checkAdmin();

    await adminDb
      .collection('settings')
      .doc('community')
      .set(
        {
          ...settings,
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: user.uid,
        },
        { merge: true }
      );

    revalidatePath('/nucleus/admin/community/settings');
    return { success: true };
  } catch (error) {
    log.error('Error updating settings:', error);
    return { success: false, error: 'Failed to update settings' };
  }
}
