'use server';

import { logger } from '@/lib/logger';
import { adminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-auth';

const log = logger.scope('admin/settings/actions');

// ============================================================================
// Types
// ============================================================================

export interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    maintenanceMode: boolean;
    maintenanceMessage: string;
  };
  features: {
    communityEnabled: boolean;
    academyEnabled: boolean;
    careersEnabled: boolean;
    guardianEnabled: boolean;
    aiAssistEnabled: boolean;
  };
  notifications: {
    emailEnabled: boolean;
    digestFrequency: 'daily' | 'weekly' | 'never';
    marketingEnabled: boolean;
  };
  security: {
    maxLoginAttempts: number;
    sessionTimeoutMinutes: number;
    requireEmailVerification: boolean;
    allowSocialLogin: boolean;
  };
}

const DEFAULT_SETTINGS: SystemSettings = {
  general: {
    siteName: 'AlgoVigilance',
    siteDescription: 'Empowerment Through Vigilance',
    maintenanceMode: false,
    maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back soon.',
  },
  features: {
    communityEnabled: true,
    academyEnabled: true,
    careersEnabled: false,
    guardianEnabled: false,
    aiAssistEnabled: true,
  },
  notifications: {
    emailEnabled: true,
    digestFrequency: 'daily',
    marketingEnabled: false,
  },
  security: {
    maxLoginAttempts: 5,
    sessionTimeoutMinutes: 60,
    requireEmailVerification: true,
    allowSocialLogin: true,
  },
};

const SETTINGS_DOC_ID = 'system_settings';

// ============================================================================
// Get System Settings
// ============================================================================

export async function getSystemSettings(): Promise<{
  success: boolean;
  settings?: SystemSettings;
  error?: string;
}> {
  try {
    await requireAdmin();

    const docRef = adminDb.collection('system_config').doc(SETTINGS_DOC_ID);
    const doc = await docRef.get();

    if (!doc.exists) {
      // Create default settings if they don't exist
      await docRef.set({
        ...DEFAULT_SETTINGS,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return { success: true, settings: DEFAULT_SETTINGS };
    }

    const data = doc.data();

    // Merge with defaults to ensure all fields exist
    const settings: SystemSettings = {
      general: { ...DEFAULT_SETTINGS.general, ...data?.general },
      features: { ...DEFAULT_SETTINGS.features, ...data?.features },
      notifications: { ...DEFAULT_SETTINGS.notifications, ...data?.notifications },
      security: { ...DEFAULT_SETTINGS.security, ...data?.security },
    };

    return { success: true, settings };
  } catch (error) {
    log.error('[getSystemSettings] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch settings',
    };
  }
}

// ============================================================================
// Update System Settings
// ============================================================================

export async function updateSystemSettings(settings: SystemSettings): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const admin = await requireAdmin();

    const docRef = adminDb.collection('system_config').doc(SETTINGS_DOC_ID);

    // Log the change for audit purposes
    await adminDb.collection('admin_audit_log').add({
      action: 'settings_updated',
      adminId: admin.uid,
      adminEmail: admin.email,
      timestamp: new Date(),
      changes: settings,
    });

    await docRef.set(
      {
        ...settings,
        updatedAt: new Date(),
        updatedBy: admin.uid,
      },
      { merge: true }
    );

    log.info('[updateSystemSettings] Settings updated by:', admin.email);
    return { success: true };
  } catch (error) {
    log.error('[updateSystemSettings] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update settings',
    };
  }
}

// ============================================================================
// Get Feature Flag
// ============================================================================

export async function getFeatureFlag(
  feature: keyof SystemSettings['features']
): Promise<boolean> {
  try {
    const result = await getSystemSettings();
    if (result.success && result.settings) {
      return result.settings.features[feature] ?? DEFAULT_SETTINGS.features[feature];
    }
    return DEFAULT_SETTINGS.features[feature];
  } catch (error) {
    log.error('[getFeatureFlag] Error:', error);
    return DEFAULT_SETTINGS.features[feature];
  }
}

// ============================================================================
// Check Maintenance Mode
// ============================================================================

export async function isMaintenanceMode(): Promise<{
  enabled: boolean;
  message: string;
}> {
  try {
    const result = await getSystemSettings();
    if (result.success && result.settings) {
      return {
        enabled: result.settings.general.maintenanceMode,
        message: result.settings.general.maintenanceMessage,
      };
    }
    return {
      enabled: DEFAULT_SETTINGS.general.maintenanceMode,
      message: DEFAULT_SETTINGS.general.maintenanceMessage,
    };
  } catch (error) {
    log.error('[isMaintenanceMode] Error:', error);
    return {
      enabled: false,
      message: DEFAULT_SETTINGS.general.maintenanceMessage,
    };
  }
}
