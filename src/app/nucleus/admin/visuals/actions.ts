'use server';

import { adminDb } from '@/lib/firebase-admin';
import { type NeuralCircuitConfig } from '@/components/effects/deprecated/neural-circuit/NeuralCircuitBackground';

import { logger } from '@/lib/logger';
const log = logger.scope('actions');

const SETTINGS_COLLECTION = 'system_settings';
const VISUAL_SETTINGS_DOC = 'visual_config';

export async function getVisualSettings(): Promise<Partial<NeuralCircuitConfig>> {
  try {
    const doc = await adminDb
      .collection(SETTINGS_COLLECTION)
      .doc(VISUAL_SETTINGS_DOC)
      .get();

    if (!doc.exists) {
      return {}; // Use component defaults
    }

    return doc.data() as Partial<NeuralCircuitConfig>;
  } catch (error) {
    log.error('Error fetching visual settings:', error);
    return {}; // Use component defaults on error
  }
}

export async function saveVisualSettings(settings: Partial<NeuralCircuitConfig>) {
  try {
    // Verify admin role (simplified check, ideally use a robust role check)
    // In a real app, we'd check the session/token claims here.
    // For now, we assume the middleware protects the /admin route.

    await adminDb
      .collection(SETTINGS_COLLECTION)
      .doc(VISUAL_SETTINGS_DOC)
      .set(settings);
    return { success: true };
  } catch (error) {
    log.error('Error saving visual settings:', error);
    return { success: false, error: 'Failed to save settings' };
  }
}
