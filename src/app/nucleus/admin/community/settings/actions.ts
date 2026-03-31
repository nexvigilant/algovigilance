'use server';

import { adminAuth, adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('settings/actions');

// Check if user is admin - verifies session AND role
async function checkAdmin() {
  const session = (await cookies()).get('session')?.value;
  if (!session) {
    throw new Error('Not authenticated');
  }

  try {
    const user = await adminAuth.verifySessionCookie(session, true);

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
    throw new Error('Not authenticated');
  }
}

export interface RateLimitSettings {
  postsPerHour: number;
  repliesPerHour: number;
  messagesPerHour: number;
  reactionsPerMinute: number;
  enabled: boolean;
}

export interface SpamSettings {
  autoDetect: boolean;
  reportThreshold: number;
  blockNewAccountsHours: number;
  linkRestrictions: 'none' | 'moderate' | 'strict';
  suspiciousPatterns: string[];
}

export interface ContentRestrictions {
  minPostLength: number;
  maxPostLength: number;
  minReplyLength: number;
  maxReplyLength: number;
  allowImages: boolean;
  allowLinks: boolean;
  allowMentions: boolean;
  profanityFilter: boolean;
}

export interface NotificationSettings {
  emailDigest: boolean;
  digestFrequency: 'daily' | 'weekly' | 'never';
  adminAlerts: boolean;
  moderatorNotifications: boolean;
}

/**
 * Pathway-to-Circle mapping configuration
 * Maps capability pathways to circles for dynamic sidebar navigation
 */
export interface PathwayMapping {
  pathwayId: string;
  pathwayName: string;
  circleIds: string[];
  requiredTrustLevel: 'standard' | 'verified' | 'expert';
  isActive: boolean;
}

export interface PathwayConfiguratorSettings {
  mappings: PathwayMapping[];
  enableDynamicSidebar: boolean;
  updatedAt?: Date;
  updatedBy?: string;
}

export interface CommunitySettingsExtended {
  defaultVisibility: 'public' | 'private' | 'semi-private';
  autoModerationLevel: 'low' | 'medium' | 'high';
  features: {
    forums: boolean;
    messaging: boolean;
    polls: boolean;
    reactions: boolean;
    badges: boolean;
  };
  rateLimits: RateLimitSettings;
  spam: SpamSettings;
  content: ContentRestrictions;
  notifications: NotificationSettings;
  updatedAt?: Date;
  updatedBy?: string;
}

const DEFAULT_SETTINGS: CommunitySettingsExtended = {
  defaultVisibility: 'public',
  autoModerationLevel: 'medium',
  features: {
    forums: true,
    messaging: true,
    polls: true,
    reactions: true,
    badges: true,
  },
  rateLimits: {
    postsPerHour: 10,
    repliesPerHour: 30,
    messagesPerHour: 50,
    reactionsPerMinute: 20,
    enabled: true,
  },
  spam: {
    autoDetect: true,
    reportThreshold: 3,
    blockNewAccountsHours: 24,
    linkRestrictions: 'moderate',
    suspiciousPatterns: [],
  },
  content: {
    minPostLength: 10,
    maxPostLength: 10000,
    minReplyLength: 1,
    maxReplyLength: 5000,
    allowImages: true,
    allowLinks: true,
    allowMentions: true,
    profanityFilter: true,
  },
  notifications: {
    emailDigest: true,
    digestFrequency: 'weekly',
    adminAlerts: true,
    moderatorNotifications: true,
  },
};

/**
 * Get extended community settings
 */
export async function getExtendedSettings(): Promise<CommunitySettingsExtended> {
  try {
    await checkAdmin();

    const settingsDoc = await adminDb.collection('settings').doc('community').get();

    if (!settingsDoc.exists) {
      return DEFAULT_SETTINGS;
    }

    const data = settingsDoc.data() || {};

    // Merge with defaults to ensure all fields exist
    return {
      ...DEFAULT_SETTINGS,
      ...data,
      features: {
        ...DEFAULT_SETTINGS.features,
        ...data.features,
      },
      rateLimits: {
        ...DEFAULT_SETTINGS.rateLimits,
        ...data.rateLimits,
      },
      spam: {
        ...DEFAULT_SETTINGS.spam,
        ...data.spam,
      },
      content: {
        ...DEFAULT_SETTINGS.content,
        ...data.content,
      },
      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...data.notifications,
      },
      updatedAt: toDateFromSerialized(data.updatedAt),
    };
  } catch (error) {
    log.error('Error fetching extended settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Update rate limit settings
 */
export async function updateRateLimitSettings(
  settings: RateLimitSettings
): Promise<{ success: boolean; error?: string }> {
  try {
    const settingsRef = adminDb.collection('settings').doc('community');
    const [admin, currentDoc] = await Promise.all([
      checkAdmin(),
      settingsRef.get(),
    ]);
    const currentData = currentDoc.exists ? currentDoc.data() || {} : {};

    await settingsRef.set({
      ...currentData,
      rateLimits: settings,
      updatedAt: adminTimestamp.now(),
      updatedBy: admin.uid,
    });

    revalidatePath('/nucleus/admin/community/settings');
    return { success: true };
  } catch (error) {
    log.error('Error updating rate limit settings:', error);
    return { success: false, error: 'Failed to update rate limit settings' };
  }
}

/**
 * Update spam settings
 */
export async function updateSpamSettings(
  settings: SpamSettings
): Promise<{ success: boolean; error?: string }> {
  try {
    const settingsRef = adminDb.collection('settings').doc('community');
    const [admin, currentDoc] = await Promise.all([
      checkAdmin(),
      settingsRef.get(),
    ]);
    const currentData = currentDoc.exists ? currentDoc.data() || {} : {};

    await settingsRef.set({
      ...currentData,
      spam: settings,
      updatedAt: adminTimestamp.now(),
      updatedBy: admin.uid,
    });

    revalidatePath('/nucleus/admin/community/settings');
    return { success: true };
  } catch (error) {
    log.error('Error updating spam settings:', error);
    return { success: false, error: 'Failed to update spam settings' };
  }
}

/**
 * Update content restriction settings
 */
export async function updateContentSettings(
  settings: ContentRestrictions
): Promise<{ success: boolean; error?: string }> {
  try {
    const settingsRef = adminDb.collection('settings').doc('community');
    const [admin, currentDoc] = await Promise.all([
      checkAdmin(),
      settingsRef.get(),
    ]);
    const currentData = currentDoc.exists ? currentDoc.data() || {} : {};

    await settingsRef.set({
      ...currentData,
      content: settings,
      updatedAt: adminTimestamp.now(),
      updatedBy: admin.uid,
    });

    revalidatePath('/nucleus/admin/community/settings');
    return { success: true };
  } catch (error) {
    log.error('Error updating content settings:', error);
    return { success: false, error: 'Failed to update content settings' };
  }
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(
  settings: NotificationSettings
): Promise<{ success: boolean; error?: string }> {
  try {
    const settingsRef = adminDb.collection('settings').doc('community');
    const [admin, currentDoc] = await Promise.all([
      checkAdmin(),
      settingsRef.get(),
    ]);
    const currentData = currentDoc.exists ? currentDoc.data() || {} : {};

    await settingsRef.set({
      ...currentData,
      notifications: settings,
      updatedAt: adminTimestamp.now(),
      updatedBy: admin.uid,
    });

    revalidatePath('/nucleus/admin/community/settings');
    return { success: true };
  } catch (error) {
    log.error('Error updating notification settings:', error);
    return { success: false, error: 'Failed to update notification settings' };
  }
}

/**
 * Reset all settings to defaults
 */
export async function resetToDefaults(): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await checkAdmin();

    const settingsRef = adminDb.collection('settings').doc('community');
    await settingsRef.set({
      ...DEFAULT_SETTINGS,
      updatedAt: adminTimestamp.now(),
      updatedBy: admin.uid,
    });

    revalidatePath('/nucleus/admin/community/settings');
    return { success: true };
  } catch (error) {
    log.error('Error resetting settings:', error);
    return { success: false, error: 'Failed to reset settings' };
  }
}

// ============================================================================
// Pathway Configurator Settings
// ============================================================================

const DEFAULT_PATHWAY_SETTINGS: PathwayConfiguratorSettings = {
  mappings: [],
  enableDynamicSidebar: false,
};

/**
 * Get pathway configurator settings
 */
export async function getPathwaySettings(): Promise<PathwayConfiguratorSettings> {
  try {
    await checkAdmin();

    const settingsDoc = await adminDb.collection('settings').doc('pathways').get();

    if (!settingsDoc.exists) {
      return DEFAULT_PATHWAY_SETTINGS;
    }

    const data = settingsDoc.data() || {};
    return {
      ...DEFAULT_PATHWAY_SETTINGS,
      ...data,
      mappings: data.mappings || [],
      updatedAt: toDateFromSerialized(data.updatedAt),
    };
  } catch (error) {
    log.error('Error fetching pathway settings:', error);
    return DEFAULT_PATHWAY_SETTINGS;
  }
}

/**
 * Update pathway mappings with Guardian Protocol audit logging
 */
export async function updatePathwayMappings(
  mappings: PathwayMapping[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const settingsRef = adminDb.collection('settings').doc('pathways');
    const [admin, currentDoc] = await Promise.all([
      checkAdmin(),
      settingsRef.get(),
    ]);
    const currentData = currentDoc.exists ? currentDoc.data() || {} : {};

    // Prepare the update
    const updateData = {
      ...currentData,
      mappings,
      updatedAt: adminTimestamp.now(),
      updatedBy: admin.uid,
    };

    // Execute update with audit trail
    const batch = adminDb.batch();
    batch.set(settingsRef, updateData);

    // Guardian Protocol: Log governance update to audit trail
    const auditRef = adminDb.collection('guardian_audit_trail').doc();
    batch.set(auditRef, {
      userId: admin.uid,
      type: 'governance_update',
      action: 'pathway_mapping_changed',
      metadata: {
        previousMappingCount: currentData.mappings?.length || 0,
        newMappingCount: mappings.length,
        changedPathways: mappings.map(m => m.pathwayId),
      },
      timestamp: adminTimestamp.now(),
    });

    await batch.commit();

    revalidatePath('/nucleus/admin/community/settings');
    revalidatePath('/nucleus/community');
    return { success: true };
  } catch (error) {
    log.error('Error updating pathway mappings:', error);
    return { success: false, error: 'Failed to update pathway mappings' };
  }
}

/**
 * Toggle dynamic sidebar feature
 */
export async function toggleDynamicSidebar(
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const settingsRef = adminDb.collection('settings').doc('pathways');
    const [admin, currentDoc] = await Promise.all([
      checkAdmin(),
      settingsRef.get(),
    ]);
    const currentData = currentDoc.exists ? currentDoc.data() || {} : {};

    // Execute update with audit trail
    const batch = adminDb.batch();
    batch.set(settingsRef, {
      ...currentData,
      enableDynamicSidebar: enabled,
      updatedAt: adminTimestamp.now(),
      updatedBy: admin.uid,
    }, { merge: true });

    // Guardian Protocol: Log governance update
    const auditRef = adminDb.collection('guardian_audit_trail').doc();
    batch.set(auditRef, {
      userId: admin.uid,
      type: 'governance_update',
      action: 'dynamic_sidebar_toggled',
      metadata: {
        enabled,
      },
      timestamp: adminTimestamp.now(),
    });

    await batch.commit();

    revalidatePath('/nucleus/admin/community/settings');
    revalidatePath('/nucleus/community');
    return { success: true };
  } catch (error) {
    log.error('Error toggling dynamic sidebar:', error);
    return { success: false, error: 'Failed to toggle dynamic sidebar' };
  }
}

/**
 * Get available circles for mapping
 */
export async function getAvailableCircles(): Promise<Array<{ id: string; name: string; visibility: string }>> {
  try {
    await checkAdmin();

    const circlesSnapshot = await adminDb.collection('circles')
      .orderBy('name')
      .get();

    return circlesSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || 'Unnamed Circle',
      visibility: doc.data().visibility || 'public',
    }));
  } catch (error) {
    log.error('Error fetching available circles:', error);
    return [];
  }
}

/**
 * Get available capability pathways from PDC
 */
export async function getAvailablePathways(): Promise<Array<{ id: string; name: string; domain: string }>> {
  try {
    await checkAdmin();

    // Fetch from pv_domains collection (PDC framework)
    const domainsSnapshot = await adminDb.collection('pv_domains').get();

    const pathways: Array<{ id: string; name: string; domain: string }> = [];

    for (const domainDoc of domainsSnapshot.docs) {
      const domainData = domainDoc.data();
      pathways.push({
        id: domainDoc.id,
        name: domainData.name || domainDoc.id,
        domain: domainData.category || 'General',
      });
    }

    return pathways;
  } catch (error) {
    log.error('Error fetching available pathways:', error);
    return [];
  }
}
