'use server';

/**
 * @deprecated LEGACY FILE - DO NOT USE FOR NEW DEVELOPMENT
 *
 * This file uses the deprecated `functional_areas` and `ksb_library` collections.
 *
 * For new development, use:
 * - `pdc_framework/domains/items` for domains (via framework-browser/actions.ts)
 * - `pv_domains/{id}/capability_components` for KSBs (via ksb-builder/actions.ts)
 *
 * Migration path:
 * - Replace `getFunctionalAreas()` → Use domain clusters from PDC v4.1
 * - Replace `getKSBsByFunctionalArea()` → Use `getKSBsForBuilder(domainId)` from ksb-builder/actions.ts
 *
 * Files that need updating to remove dependency on this module:
 * - src/app/nucleus/admin/academy/framework/page.tsx
 * - src/app/nucleus/admin/academy/framework/[areaId]/page.tsx
 * - src/app/nucleus/admin/academy/courses/generate/functional-area-selector.tsx
 */

import { adminDb as db } from '@/lib/firebase-admin';
import type { FunctionalArea, KSB } from '@/types/ksb-framework';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('ksb-management/actions');

/**
 * Recursively convert Firestore Timestamps to Dates in an object
 */
function convertTimestamps(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;

  // Check if it's a Firestore Timestamp
  if (obj && typeof obj === 'object' && '_seconds' in obj && '_nanoseconds' in obj) {
    return new Date((obj as { _seconds: number })._seconds * 1000);
  }

  // Check if it has toDate method (Firestore Timestamp instance)
  if (obj && typeof obj === 'object' && 'toDate' in obj && typeof (obj as { toDate: unknown }).toDate === 'function') {
    return toDateFromSerialized(obj as { toDate: () => Date });
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => convertTimestamps(item));
  }

  // Handle plain objects
  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = convertTimestamps(value);
    }
    return result;
  }

  return obj;
}

/**
 * Fetch all functional areas
 * Returns areas ordered by display order
 */
export async function getFunctionalAreas(): Promise<FunctionalArea[]> {
  try {
    const areasRef = db.collection('functional_areas');
    const snapshot = await areasRef.orderBy('order', 'asc').get();

    return snapshot.docs.map(doc => convertTimestamps(doc.data()) as FunctionalArea);
  } catch (error) {
    log.error('Error fetching functional areas:', error);
    throw new Error('Failed to fetch functional areas');
  }
}

/**
 * Fetch a single functional area by ID
 */
export async function getFunctionalArea(areaId: string): Promise<FunctionalArea | null> {
  try {
    const areaRef = db.collection('functional_areas').doc(areaId);
    const snapshot = await areaRef.get();

    if (!snapshot.exists) {
      return null;
    }

    return convertTimestamps(snapshot.data()) as FunctionalArea;
  } catch (error) {
    log.error(`Error fetching functional area ${areaId}:`, error);
    throw new Error('Failed to fetch functional area');
  }
}

/**
 * Fetch KSBs for a functional area
 * Optionally filter by type (knowledge, skill, behavior)
 * Optionally filter by status
 */
export async function getKSBsByFunctionalArea(
  functionalArea: string,
  type?: 'knowledge' | 'skill' | 'behavior',
  status?: string
): Promise<KSB[]> {
  try {
    const ksbRef = db.collection('ksb_library');
    // Simple query without orderBy to avoid composite index requirement
    const snapshot = await ksbRef
      .where('functional_area', '==', functionalArea)
      .get();

    let ksbs = snapshot.docs.map(doc => {
      const data = doc.data();
      return convertTimestamps(data) as KSB;
    });

    // Client-side filtering for type and status
    if (type) {
      ksbs = ksbs.filter(ksb => ksb.type === type);
    }

    if (status) {
      ksbs = ksbs.filter(ksb => ksb.status === status);
    }

    // Client-side sorting by priority (desc) then name (asc)
    ksbs.sort((a, b) => {
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return (a.name || '').localeCompare(b.name || '');
    });

    return ksbs;
  } catch (error) {
    log.error(`Error fetching KSBs for ${functionalArea}:`, error);
    throw new Error('Failed to fetch KSBs');
  }
}

/**
 * Fetch a single KSB by ID
 */
export async function getKSB(ksbId: string): Promise<KSB | null> {
  try {
    const ksbRef = db.collection('ksb_library').doc(ksbId);
    const snapshot = await ksbRef.get();

    if (!snapshot.exists) {
      return null;
    }

    return convertTimestamps(snapshot.data()) as KSB;
  } catch (error) {
    log.error(`Error fetching KSB ${ksbId}:`, error);
    throw new Error('Failed to fetch KSB');
  }
}
