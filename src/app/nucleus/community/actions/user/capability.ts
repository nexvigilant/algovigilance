'use server';

import { adminDb } from '@/lib/firebase-admin';
import { getAuthenticatedUser } from '../utils/auth';
import { logger } from '@/lib/logger';
import { createHmac } from 'crypto';

const log = logger.scope('actions/user/capability');

/**
 * Guardian Protocol: Secure proof token generation
 * Uses HMAC-SHA256 for tamper-proof capability verification.
 */
const POC_SECRET = process.env.POC_SIGNING_SECRET || 'nex-poc-default-secret-change-in-prod';

/**
 * AlgoVigilance Proof of Capability (PoC) System
 * 
 * Cryptographically secure verification of pathway progress to unlock
 * high-trust circles and regulatory discussion groups.
 */

export interface CapabilityProof {
  userId: string;
  pathwayId: string;
  progressPercent: number;
  verifiedAt: Date;
  proofToken: string; // Hash of userId + pathwayId + progress
  status: 'verified' | 'insufficient' | 'revoked';
}

/**
 * Generates a capability proof for a specific pathway.
 */
export async function generateCapabilityProof(pathwayId: string): Promise<{
  success: boolean;
  proof?: CapabilityProof;
  error?: string;
}> {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return { success: false, error: 'Unauthorized' };

    const userId = authUser.uid;

    // 1. Fetch real progress from the Academy module
    // In production, this would call getPathwayProgress(userId, pathwayId)
    // For now, querying the denormalized user stats
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    const progress = userData?.stats?.pathwayProgress?.[pathwayId] || 0;
    const reputation = userData?.stats?.reputation || 0;

    // 2. Security Check: Minimal reputation + progress requirement
    if (progress < 50 || reputation < 100) {
      return { success: false, error: 'Insufficient capability progress or reputation' };
    }

    // 3. Generate Cryptographic Token using HMAC-SHA256
    // Guardian Protocol: Tamper-proof capability verification
    const timestamp = Date.now();
    const payload = `${userId}:${pathwayId}:${progress}:${timestamp}`;
    const signature = createHmac('sha256', POC_SECRET)
      .update(payload)
      .digest('hex');
    const proofToken = Buffer.from(`${payload}:${signature}`).toString('base64');

    const proof: CapabilityProof = {
      userId,
      pathwayId,
      progressPercent: progress,
      verifiedAt: new Date(),
      proofToken,
      status: 'verified',
    };

    // Guardian Protocol: Audit trail for capability verification
    log.info('Capability proof generated', { 
      userId, 
      pathwayId, 
      progress,
      reputation,
      tokenPrefix: proofToken.substring(0, 16) + '...'
    });

    return { success: true, proof };
  } catch (error) {
    log.error('Proof generation failed', { error });
    return { success: false, error: 'Failed to verify capability' };
  }
}

/**
 * Guardian Protocol: Verify a capability proof token
 * Returns null if invalid, otherwise returns decoded payload.
 */
export async function verifyCapabilityProof(proofToken: string): Promise<{
  userId: string;
  pathwayId: string;
  progress: number;
  timestamp: number;
} | null> {
  try {
    const decoded = Buffer.from(proofToken, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 5) return null;

    const [userId, pathwayId, progressStr, timestampStr, providedSignature] = parts;
    const progress = parseInt(progressStr, 10);
    const timestamp = parseInt(timestampStr, 10);

    // Verify HMAC signature
    const payload = `${userId}:${pathwayId}:${progress}:${timestamp}`;
    const expectedSignature = createHmac('sha256', POC_SECRET)
      .update(payload)
      .digest('hex');

    if (providedSignature !== expectedSignature) {
      log.warn('Invalid PoC signature detected', { userId, pathwayId });
      return null;
    }

    // Check token expiry (24 hours)
    const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > TOKEN_EXPIRY_MS) {
      log.info('Expired PoC token', { userId, pathwayId, age: Date.now() - timestamp });
      return null;
    }

    return { userId, pathwayId, progress, timestamp };
  } catch {
    return null;
  }
}

/**
 * Verifies if a user has the required capability to join a high-trust circle.
 */
export async function canUserAccessHighTrustCircle(circleId: string): Promise<boolean> {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return false;

    const forumDoc = await adminDb.collection('forums').doc(circleId).get();
    const forumData = forumDoc.data();

    // If not a high-trust circle, allow access
    if (forumData?.membership?.trustLevel !== 'high') return true;

    const requiredPathway = forumData.metadata?.requiredPathway;
    if (!requiredPathway) return true;

    const result = await generateCapabilityProof(requiredPathway);
    return result.success && result.proof?.status === 'verified';
  } catch (error) {
    return false;
  }
}
