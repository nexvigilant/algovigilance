'use server';

/**
 * Team Invitation Server Actions
 *
 * Manages team member invitations for tenant organizations.
 * Invitations are stored in Firestore and checked during signup/signin.
 *
 * Firestore collection: /tenants/{tenantId}/invitations/{invitationId}
 */

import {
  adminDb,
  adminFieldValue,
} from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { TIER_LIMITS, type SubscriptionTier } from './tenant';
import { toDateFromSerialized } from '@/types/academy';

const log = logger.scope('actions/invitations');

// ============================================================================
// Schemas
// ============================================================================

export const MemberRoleSchema = z.enum([
  'admin',
  'scientist',
  'viewer',
]);

export type MemberRole = z.infer<typeof MemberRoleSchema>;

export const InviteMemberInputSchema = z.object({
  email: z.string().email('Must be a valid email address'),
  role: MemberRoleSchema.default('scientist'),
  message: z.string().max(500).optional(),
});

export type InviteMemberInput = z.infer<typeof InviteMemberInputSchema>;

export interface InvitationRecord {
  id: string;
  tenantId: string;
  email: string;
  role: MemberRole;
  message?: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  invitedBy: string;
  invitedByEmail: string;
  createdAt: FirebaseFirestore.FieldValue;
  expiresAt: FirebaseFirestore.FieldValue;
}

export interface MemberRecord {
  userId: string;
  email: string;
  displayName?: string;
  role: 'owner' | MemberRole;
  joinedAt: FirebaseFirestore.FieldValue;
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Invite a team member to the organization
 */
export async function inviteMember(
  tenantId: string,
  inviterUserId: string,
  inviterEmail: string,
  input: InviteMemberInput
): Promise<{ success: boolean; invitationId?: string; error?: string }> {
  try {
    const validated = InviteMemberInputSchema.parse(input);

    // Check tier limit
    const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      return { success: false, error: 'Organization not found' };
    }

    const tenantData = tenantDoc.data();
    const tier = tenantData?.tier as SubscriptionTier;
    const limits = TIER_LIMITS[tier];
    const currentMemberCount = tenantData?.memberCount || 1;

    if (currentMemberCount >= limits.maxTeamMembers) {
      return {
        success: false,
        error: `Team member limit reached (${limits.maxTeamMembers} for ${tier} tier). Upgrade to invite more members.`,
      };
    }

    // Check for existing member with same email
    const existingMember = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('members')
      .where('email', '==', validated.email)
      .limit(1)
      .get();

    if (!existingMember.empty) {
      return { success: false, error: 'This person is already a team member' };
    }

    // Check for existing pending invitation
    const existingInvitation = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('invitations')
      .where('email', '==', validated.email)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (!existingInvitation.empty) {
      return { success: false, error: 'An invitation is already pending for this email' };
    }

    // Create invitation
    const invitationRef = adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('invitations')
      .doc();

    // Invitation expires in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await invitationRef.set({
      id: invitationRef.id,
      tenantId,
      email: validated.email.toLowerCase(),
      role: validated.role,
      message: validated.message,
      status: 'pending',
      invitedBy: inviterUserId,
      invitedByEmail: inviterEmail,
      createdAt: adminFieldValue.serverTimestamp(),
      expiresAt: expiresAt,
    });

    log.info('Invitation sent', { tenantId, email: validated.email, role: validated.role });

    return { success: true, invitationId: invitationRef.id };
  } catch (error) {
    log.error('Error inviting member', { error });
    return {
      success: false,
      error: error instanceof z.ZodError
        ? error.errors.map(e => e.message).join(', ')
        : error instanceof Error ? error.message : 'Failed to send invitation',
    };
  }
}

/**
 * List team members for a tenant
 */
export async function listMembers(
  tenantId: string
): Promise<{ success: boolean; members?: MemberRecord[]; error?: string }> {
  try {
    const snapshot = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('members')
      .orderBy('joinedAt', 'asc')
      .get();

    const members = snapshot.docs.map(doc => doc.data()) as MemberRecord[];

    return { success: true, members };
  } catch (error) {
    log.error('Error listing members', { error });
    return { success: false, error: 'Failed to load team members' };
  }
}

/**
 * List pending invitations for a tenant
 */
export async function listPendingInvitations(
  tenantId: string
): Promise<{ success: boolean; invitations?: InvitationRecord[]; error?: string }> {
  try {
    const snapshot = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('invitations')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();

    const invitations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as InvitationRecord[];

    return { success: true, invitations };
  } catch (error) {
    log.error('Error listing invitations', { error });
    return { success: false, error: 'Failed to load invitations' };
  }
}

/**
 * Revoke a pending invitation
 */
export async function revokeInvitation(
  tenantId: string,
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const ref = adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('invitations')
      .doc(invitationId);

    const doc = await ref.get();
    if (!doc.exists) {
      return { success: false, error: 'Invitation not found' };
    }

    if (doc.data()?.status !== 'pending') {
      return { success: false, error: 'Invitation is no longer pending' };
    }

    await ref.update({ status: 'revoked' });

    log.info('Invitation revoked', { tenantId, invitationId });

    return { success: true };
  } catch (error) {
    log.error('Error revoking invitation', { error });
    return { success: false, error: 'Failed to revoke invitation' };
  }
}

/**
 * Check and accept pending invitations for a user email
 * Called during sign-in/sign-up flow
 */
export async function checkAndAcceptInvitations(
  userId: string,
  userEmail: string,
  displayName?: string
): Promise<{ accepted: boolean; tenantId?: string; role?: string }> {
  try {
    // Search across all tenants for pending invitations matching this email
    const tenantsSnapshot = await adminDb.collectionGroup('invitations')
      .where('email', '==', userEmail.toLowerCase())
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (tenantsSnapshot.empty) {
      return { accepted: false };
    }

    const invitationDoc = tenantsSnapshot.docs[0];
    const invitation = invitationDoc.data();
    const tenantId = invitation.tenantId;

    // Check if invitation is expired
    const expiresAt = toDateFromSerialized(invitation.expiresAt) || invitation.expiresAt;
    if (expiresAt && new Date(expiresAt) < new Date()) {
      await invitationDoc.ref.update({ status: 'expired' });
      return { accepted: false };
    }

    // Accept invitation: add member + update invitation + update tenant + update user
    const batch = adminDb.batch();

    // 1. Add as member
    batch.set(
      adminDb.collection('tenants').doc(tenantId).collection('members').doc(userId),
      {
        userId,
        email: userEmail,
        displayName: displayName || null,
        role: invitation.role,
        joinedAt: adminFieldValue.serverTimestamp(),
      }
    );

    // 2. Update invitation status
    batch.update(invitationDoc.ref, { status: 'accepted' });

    // 3. Increment tenant member count
    batch.update(adminDb.collection('tenants').doc(tenantId), {
      memberCount: adminFieldValue.increment(1),
      updatedAt: adminFieldValue.serverTimestamp(),
    });

    // 4. Link tenant to user profile
    batch.update(adminDb.collection('users').doc(userId), {
      tenantId,
      tenantRole: invitation.role,
      updatedAt: adminFieldValue.serverTimestamp(),
    });

    await batch.commit();

    log.info('Invitation accepted', { tenantId, userId, role: invitation.role });

    return { accepted: true, tenantId, role: invitation.role };
  } catch (error) {
    log.error('Error accepting invitation', { error });
    return { accepted: false };
  }
}
