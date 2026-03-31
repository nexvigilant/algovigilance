'use server';

/**
 * API Key Management Server Actions
 *
 * Generates, validates, and revokes tenant API keys for programmatic
 * platform access. Keys are SHA-256 hashed before storage.
 *
 * Key format: nv_{env}_{32 random hex chars}
 *   - nv_live_a1b2c3d4...  (production)
 *   - nv_test_a1b2c3d4...  (sandbox)
 *
 * Firestore: /tenants/{tenantId}/api_keys/{keyId}
 *
 * Rate limits per tier (requests per minute):
 *   academic:   60 RPM
 *   biotech:    300 RPM
 *   cro:        600 RPM
 *   enterprise: 1200 RPM
 *   government: 600 RPM
 */

import {
  adminDb,
  adminFieldValue,
} from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { TIER_LIMITS, type SubscriptionTier } from './tenant';
import { createHash, randomBytes } from 'crypto';
import { toDateFromSerialized } from '@/types/academy';

const log = logger.scope('actions/api-keys');

// ============================================================================
// Types
// ============================================================================

export interface ApiKeyRecord {
  id: string;
  tenantId: string;
  name: string;
  prefix: string;          // First 12 chars for identification (nv_live_a1b2)
  keyHash: string;         // SHA-256 hash of the full key
  environment: 'live' | 'test';
  scopes: ApiKeyScope[];
  rateLimit: number;       // RPM
  createdBy: string;
  createdAt: FirebaseFirestore.FieldValue;
  lastUsedAt: FirebaseFirestore.FieldValue | null;
  expiresAt: Date | null;
  status: 'active' | 'revoked';
  usageCount: number;
}

export type ApiKeyScope =
  | 'programs:read'
  | 'programs:write'
  | 'signals:read'
  | 'signals:write'
  | 'data:read'
  | 'data:write'
  | 'team:read';

/** Returned only once at creation time */
export interface ApiKeyCreated {
  id: string;
  key: string;           // Full key — only shown once
  prefix: string;
  name: string;
  environment: 'live' | 'test';
  rateLimit: number;
}

// Max keys per tier
const MAX_KEYS_PER_TIER: Record<SubscriptionTier, number> = {
  academic: 2,
  biotech: 5,
  cro: 10,
  enterprise: 25,
  government: 10,
};

// ============================================================================
// Utility Functions
// ============================================================================

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

function generateApiKey(environment: 'live' | 'test'): string {
  const random = randomBytes(16).toString('hex'); // 32 hex chars
  return `nv_${environment}_${random}`;
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Generate a new API key
 */
export async function createApiKey(
  tenantId: string,
  userId: string,
  name: string,
  environment: 'live' | 'test' = 'test',
  scopes: ApiKeyScope[] = ['programs:read', 'signals:read', 'data:read'],
  expiresInDays?: number
): Promise<{ success: boolean; key?: ApiKeyCreated; error?: string }> {
  try {
    // Validate tenant exists and check tier limits
    const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      return { success: false, error: 'Organization not found' };
    }

    const tenantData = tenantDoc.data();
    const tier = (tenantData?.tier || 'academic') as SubscriptionTier;

    // Check key count limit
    const existingKeys = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('api_keys')
      .where('status', '==', 'active')
      .count()
      .get();

    const keyCount = existingKeys.data().count;
    const maxKeys = MAX_KEYS_PER_TIER[tier];

    if (keyCount >= maxKeys) {
      return {
        success: false,
        error: `API key limit reached (${maxKeys} for ${tier} tier). Revoke unused keys or upgrade.`,
      };
    }

    // Check API access is enabled for tier (biotech+ only per feature matrix)
    if (tier === 'academic') {
      return {
        success: false,
        error: 'API access requires Biotech tier or higher. Upgrade to enable API keys.',
      };
    }

    // Generate key
    const key = generateApiKey(environment);
    const prefix = key.slice(0, 12);
    const keyHashValue = hashKey(key);
    const rateLimit = TIER_LIMITS[tier].apiRateLimitRpm;

    // Calculate expiration
    let expiresAt: Date | null = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // Store hashed key
    const keyRef = adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('api_keys')
      .doc();

    await keyRef.set({
      id: keyRef.id,
      tenantId,
      name: name.trim(),
      prefix,
      keyHash: keyHashValue,
      environment,
      scopes,
      rateLimit,
      createdBy: userId,
      createdAt: adminFieldValue.serverTimestamp(),
      lastUsedAt: null,
      expiresAt,
      status: 'active',
      usageCount: 0,
    });

    log.info('API key created', { tenantId, keyId: keyRef.id, environment, prefix });

    return {
      success: true,
      key: {
        id: keyRef.id,
        key,            // Only returned at creation
        prefix,
        name: name.trim(),
        environment,
        rateLimit,
      },
    };
  } catch (error) {
    log.error('Error creating API key', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create API key',
    };
  }
}

/**
 * List API keys for a tenant (returns metadata, never the actual key)
 */
export async function listApiKeys(
  tenantId: string
): Promise<{ success: boolean; keys?: Omit<ApiKeyRecord, 'keyHash'>[]; error?: string }> {
  try {
    const snapshot = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('api_keys')
      .orderBy('createdAt', 'desc')
      .get();

    const keys = snapshot.docs.map(doc => {
      const data = doc.data();
      // Never return the hash
      const { keyHash: _hash, ...rest } = data;
      return rest as Omit<ApiKeyRecord, 'keyHash'>;
    });

    return { success: true, keys };
  } catch (error) {
    log.error('Error listing API keys', { error });
    return { success: false, error: 'Failed to list API keys' };
  }
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(
  tenantId: string,
  keyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const ref = adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('api_keys')
      .doc(keyId);

    const doc = await ref.get();
    if (!doc.exists) {
      return { success: false, error: 'API key not found' };
    }

    if (doc.data()?.status === 'revoked') {
      return { success: false, error: 'Key is already revoked' };
    }

    await ref.update({
      status: 'revoked',
      revokedAt: adminFieldValue.serverTimestamp(),
    });

    log.info('API key revoked', { tenantId, keyId });
    return { success: true };
  } catch (error) {
    log.error('Error revoking API key', { error });
    return { success: false, error: 'Failed to revoke API key' };
  }
}

/**
 * Validate an API key and return tenant context
 *
 * Used by API middleware to authenticate requests.
 * Performs SHA-256 hash lookup against stored hashes.
 *
 * Complexity: O(n) where n = number of active keys with matching prefix.
 * In practice, prefix filtering reduces to O(1) for unique prefixes.
 */
export async function validateApiKey(
  key: string
): Promise<{
  valid: boolean;
  tenantId?: string;
  tier?: SubscriptionTier;
  scopes?: ApiKeyScope[];
  rateLimit?: number;
  error?: string;
}> {
  try {
    // Extract prefix for fast lookup
    const prefix = key.slice(0, 12);

    if (!prefix.startsWith('nv_')) {
      return { valid: false, error: 'Invalid key format' };
    }

    // Query by prefix across all tenants
    const snapshot = await adminDb
      .collectionGroup('api_keys')
      .where('prefix', '==', prefix)
      .where('status', '==', 'active')
      .limit(5)
      .get();

    if (snapshot.empty) {
      return { valid: false, error: 'Invalid API key' };
    }

    // Verify full hash
    const keyHashValue = hashKey(key);

    for (const doc of snapshot.docs) {
      const data = doc.data();

      if (data.keyHash === keyHashValue) {
        // Check expiration
        if (data.expiresAt) {
          const expiry = data.expiresAt.toDate ? toDateFromSerialized(data.expiresAt) : new Date(data.expiresAt);
          if (expiry < new Date()) {
            return { valid: false, error: 'API key expired' };
          }
        }

        // Update usage stats (fire-and-forget)
        doc.ref.update({
          lastUsedAt: adminFieldValue.serverTimestamp(),
          usageCount: (data.usageCount || 0) + 1,
        }).catch(() => { /* non-critical */ });

        // Get tenant tier
        const tenantDoc = await adminDb.collection('tenants').doc(data.tenantId).get();
        const tier = (tenantDoc.data()?.tier || 'academic') as SubscriptionTier;

        return {
          valid: true,
          tenantId: data.tenantId,
          tier,
          scopes: data.scopes,
          rateLimit: data.rateLimit,
        };
      }
    }

    return { valid: false, error: 'Invalid API key' };
  } catch (error) {
    log.error('Error validating API key', { error });
    return { valid: false, error: 'Validation failed' };
  }
}
