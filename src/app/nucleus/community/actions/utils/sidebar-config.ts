'use server';

import { adminDb } from '@/lib/firebase-admin';
import { getAuthenticatedUser } from './auth';
import { logger } from '@/lib/logger';

const log = logger.scope('sidebar-config');

/**
 * Pathway mapping as stored in settings
 */
export interface PathwayMapping {
  pathwayId: string;
  pathwayName: string;
  circleIds: string[];
  requiredTrustLevel: 'standard' | 'verified' | 'expert';
  isActive: boolean;
}

/**
 * Circle information for navigation
 */
export interface CircleNavInfo {
  id: string;
  name: string;
  slug?: string;
  visibility: string;
}

/**
 * Compiled sidebar navigation item
 */
export interface DynamicNavItem {
  pathwayId: string;
  pathwayName: string;
  circles: CircleNavInfo[];
  requiredTrustLevel: 'standard' | 'verified' | 'expert';
}

/**
 * Full sidebar configuration result
 */
export interface SidebarConfig {
  enabled: boolean;
  navItems: DynamicNavItem[];
  userTrustLevel: 'standard' | 'verified' | 'expert';
}

/**
 * Fetches the admin-defined pathway-to-circle mappings
 * and computes which items the current user can see
 */
export async function getSidebarConfig(): Promise<SidebarConfig> {
  try {
    // Get current user's trust level
    const user = await getAuthenticatedUser();
    let userTrustLevel: 'standard' | 'verified' | 'expert' = 'standard';

    if (user) {
      const userDoc = await adminDb.collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData?.expertLevel) {
          userTrustLevel = 'expert';
        } else if (userData?.verifiedPractitioner) {
          userTrustLevel = 'verified';
        }
      }
    }

    // Fetch pathway settings
    const settingsDoc = await adminDb.collection('settings').doc('pathways').get();

    if (!settingsDoc.exists) {
      return {
        enabled: false,
        navItems: [],
        userTrustLevel,
      };
    }

    const settingsData = settingsDoc.data();
    const enabled = settingsData?.enableDynamicSidebar ?? false;
    const mappings: PathwayMapping[] = settingsData?.mappings ?? [];

    if (!enabled || mappings.length === 0) {
      return {
        enabled,
        navItems: [],
        userTrustLevel,
      };
    }

    // Filter mappings by user's trust level
    const trustLevelOrder = { standard: 0, verified: 1, expert: 2 };
    const userTrustOrder = trustLevelOrder[userTrustLevel];

    const accessibleMappings = mappings.filter(mapping => {
      if (!mapping.isActive) return false;
      const requiredOrder = trustLevelOrder[mapping.requiredTrustLevel];
      return userTrustOrder >= requiredOrder;
    });

    // Fetch circle details for accessible mappings
    const allCircleIds = [...new Set(accessibleMappings.flatMap(m => m.circleIds))];

    const circlePromises = allCircleIds.map(async (circleId) => {
      const circleDoc = await adminDb.collection('circles').doc(circleId).get();
      if (!circleDoc.exists) return null;
      const data = circleDoc.data();
      return {
        id: circleId,
        name: data?.name || 'Unnamed Circle',
        slug: data?.slug,
        visibility: data?.visibility || 'public',
      };
    });

    const circleResults = await Promise.all(circlePromises);
    const circleMap = new Map<string, CircleNavInfo>();
    circleResults.forEach(circle => {
      if (circle) circleMap.set(circle.id, circle);
    });

    // Build navigation items
    const navItems: DynamicNavItem[] = accessibleMappings.map(mapping => ({
      pathwayId: mapping.pathwayId,
      pathwayName: mapping.pathwayName,
      circles: mapping.circleIds
        .map(id => circleMap.get(id))
        .filter((c): c is CircleNavInfo => c !== undefined),
      requiredTrustLevel: mapping.requiredTrustLevel,
    }));

    return {
      enabled,
      navItems,
      userTrustLevel,
    };
  } catch (error) {
    log.error('Error fetching sidebar config:', error);
    return {
      enabled: false,
      navItems: [],
      userTrustLevel: 'standard',
    };
  }
}

/**
 * Lightweight check if dynamic sidebar is enabled
 * (useful for conditional rendering without full config fetch)
 */
export async function isDynamicSidebarEnabled(): Promise<boolean> {
  try {
    const settingsDoc = await adminDb.collection('settings').doc('pathways').get();
    return settingsDoc.exists && settingsDoc.data()?.enableDynamicSidebar === true;
  } catch (error) {
    log.error('Error checking dynamic sidebar status:', error);
    return false;
  }
}
