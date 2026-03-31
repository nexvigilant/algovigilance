'use server';

/**
 * Tenant Context Utilities
 *
 * Extracts and validates tenant context from authenticated requests.
 * Maps to PRPaaS TenantContext pattern — every operation is tenant-scoped.
 *
 * Current implementation: Firestore-backed (single-tenant mode).
 * PRPaaS target: PostgreSQL with RLS + compile-time Rust enforcement.
 */

import { adminDb } from '@/lib/firebase-admin';
import { getAuthenticatedUser } from '@/app/nucleus/community/actions/utils/auth';
import type {
  TenantContext,
  SubscriptionTier,
  TenantUserRole,
  Tenant,
} from '@/types/platform';
import { derivePermissions } from '@/types/platform';
import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';

const log = logger.scope('platform/tenant');

/**
 * Get the tenant context for the current authenticated user.
 *
 * Phase 1 (current): Single-tenant mode — all users belong to the
 * default AlgoVigilance tenant. TenantContext is constructed from
 * Firestore user doc + tenant doc.
 *
 * Phase 2+ (PRPaaS): Multi-tenant — tenant_id extracted from JWT claims,
 * mapped to PostgreSQL tenant record with RLS.
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return null;

    // Phase 1: Look up tenant membership in Firestore
    const userDoc = await adminDb.collection('users').doc(authUser.uid).get();
    if (!userDoc.exists) return null;

    const userData = userDoc.data();
    const tenantId = userData?.tenantId || 'default';

    // Get tenant record (or use defaults for Phase 1)
    let tier: SubscriptionTier = 'accelerator';  // Default for Phase 1
    let role: TenantUserRole = 'scientist';

    const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
    if (tenantDoc.exists) {
      const tenantData = tenantDoc.data();
      tier = (tenantData?.tier || 'accelerator') as SubscriptionTier;
    }

    // Check tenant_users for role
    const membershipQuery = await adminDb.collection('tenant_users')
      .where('firebaseUid', '==', authUser.uid)
      .where('tenantId', '==', tenantId)
      .limit(1)
      .get();

    if (!membershipQuery.empty) {
      const membership = membershipQuery.docs[0].data();
      role = (membership.role || 'scientist') as TenantUserRole;
    } else if (userData?.role === 'admin') {
      role = 'admin';
    }

    return {
      tenantId,
      userId: authUser.uid,
      role,
      tier,
      permissions: derivePermissions(tier, role),
    };
  } catch (error) {
    log.error('Failed to build tenant context:', error);
    return null;
  }
}

/**
 * Get tenant info by ID.
 * Returns default tenant for Phase 1 single-tenant mode.
 */
export async function getTenantInfo(tenantId: string): Promise<Tenant | null> {
  try {
    const doc = await adminDb.collection('tenants').doc(tenantId).get();
    if (!doc.exists) {
      // Phase 1 default tenant
      if (tenantId === 'default') {
        return {
          id: 'default',
          name: 'AlgoVigilance',
          slug: 'nexvigilant',
          tier: 'accelerator',
          status: 'active',
          settings: {
            dataContributionOptIn: true,
            defaultCommunityVisibility: 'platform',
            enabledModules: ['community', 'academy', 'guardian', 'insights'],
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      return null;
    }

    const data = doc.data();
    return {
      id: doc.id,
      name: data?.name || '',
      slug: data?.slug || '',
      tier: data?.tier || 'explorer',
      status: data?.status || 'active',
      trialEndsAt: toDateFromSerialized(data?.trialEndsAt)?.toISOString(),
      settings: data?.settings || {
        dataContributionOptIn: false,
        defaultCommunityVisibility: 'tenant',
        enabledModules: ['community'],
      },
      createdAt: toDateFromSerialized(data?.createdAt)?.toISOString() || new Date().toISOString(),
      updatedAt: toDateFromSerialized(data?.updatedAt)?.toISOString() || new Date().toISOString(),
    };
  } catch (error) {
    log.error('Failed to get tenant info:', error);
    return null;
  }
}
