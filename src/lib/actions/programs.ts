'use server';

/**
 * Program Management Server Actions
 *
 * CRUD operations for pharmacovigilance programs within tenant organizations.
 * Programs are scoped to tenants and enforced by tier limits.
 *
 * Firestore collection: /tenants/{tenantId}/programs/{programId}
 */

import {
  adminDb,
  adminFieldValue,
} from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { TIER_LIMITS, type SubscriptionTier } from './tenant';

const log = logger.scope('actions/programs');

// ============================================================================
// Schemas
// ============================================================================

export const ProgramStageSchema = z.enum([
  'target_validation',
  'lead_identification',
  'lead_optimization',
  'preclinical',
  'clinical',
]);

export type ProgramStage = z.infer<typeof ProgramStageSchema>;

export const ProgramStatusSchema = z.enum([
  'active',
  'paused',
  'completed',
  'archived',
]);

export type ProgramStatus = z.infer<typeof ProgramStatusSchema>;

export const TherapeuticAreaSchema = z.enum([
  'oncology',
  'cardiovascular',
  'neurology',
  'immunology',
  'infectious_disease',
  'rare_disease',
  'respiratory',
  'endocrinology',
  'gastroenterology',
  'dermatology',
  'ophthalmology',
  'hematology',
  'general',
]);

export const CreateProgramInputSchema = z.object({
  codeName: z.string().min(2, 'Code name must be at least 2 characters').max(100),
  therapeuticArea: TherapeuticAreaSchema,
  targetName: z.string().min(1, 'Target name is required').max(200),
  targetGene: z.string().max(50).optional(),
  currentStage: ProgramStageSchema.default('target_validation'),
  description: z.string().max(1000).optional(),
  budgetTotal: z.number().min(0).optional(),
});

export type CreateProgramInput = z.infer<typeof CreateProgramInputSchema>;

export const UpdateProgramInputSchema = z.object({
  codeName: z.string().min(2).max(100).optional(),
  currentStage: ProgramStageSchema.optional(),
  status: ProgramStatusSchema.optional(),
  description: z.string().max(1000).optional(),
  budgetTotal: z.number().min(0).optional(),
  budgetSpent: z.number().min(0).optional(),
});

export type UpdateProgramInput = z.infer<typeof UpdateProgramInputSchema>;

/**
 * Program record as stored in Firestore
 */
export interface ProgramRecord {
  id: string;
  tenantId: string;
  codeName: string;
  therapeuticArea: string;
  targetName: string;
  targetGene?: string;
  currentStage: ProgramStage;
  status: ProgramStatus;
  description?: string;
  budgetTotal?: number;
  budgetSpent: number;
  createdBy: string;
  createdAt: FirebaseFirestore.FieldValue;
  updatedAt: FirebaseFirestore.FieldValue;
}

// ============================================================================
// Stage Display Info
// ============================================================================

export const STAGE_INFO: Record<ProgramStage, { label: string; order: number }> = {
  target_validation: { label: 'Target Validation', order: 0 },
  lead_identification: { label: 'Lead Identification', order: 1 },
  lead_optimization: { label: 'Lead Optimization', order: 2 },
  preclinical: { label: 'Preclinical', order: 3 },
  clinical: { label: 'Clinical', order: 4 },
};

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Create a new program within a tenant organization
 */
export async function createProgram(
  tenantId: string,
  userId: string,
  input: CreateProgramInput
): Promise<{ success: boolean; programId?: string; error?: string }> {
  try {
    const validated = CreateProgramInputSchema.parse(input);

    // Check tier limit
    const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      return { success: false, error: 'Organization not found' };
    }

    const tenantData = tenantDoc.data();
    const tier = tenantData?.tier as SubscriptionTier;
    const limits = TIER_LIMITS[tier];

    // Count existing programs
    const programsSnapshot = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('programs')
      .where('status', 'in', ['active', 'paused'])
      .count()
      .get();

    const currentCount = programsSnapshot.data().count;
    if (currentCount >= limits.maxPrograms) {
      return {
        success: false,
        error: `Program limit reached (${limits.maxPrograms} for ${tier} tier). Upgrade to create more programs.`,
      };
    }

    // Check for duplicate code name within tenant
    const duplicateCheck = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('programs')
      .where('codeName', '==', validated.codeName)
      .limit(1)
      .get();

    if (!duplicateCheck.empty) {
      return { success: false, error: 'A program with this code name already exists' };
    }

    // Create program document
    const programRef = adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('programs')
      .doc();

    const programData: ProgramRecord = {
      id: programRef.id,
      tenantId,
      codeName: validated.codeName,
      therapeuticArea: validated.therapeuticArea,
      targetName: validated.targetName,
      targetGene: validated.targetGene,
      currentStage: validated.currentStage,
      status: 'active',
      description: validated.description,
      budgetTotal: validated.budgetTotal,
      budgetSpent: 0,
      createdBy: userId,
      createdAt: adminFieldValue.serverTimestamp(),
      updatedAt: adminFieldValue.serverTimestamp(),
    };

    await programRef.set(programData);

    log.info('Program created', { tenantId, programId: programRef.id, codeName: validated.codeName });

    return { success: true, programId: programRef.id };
  } catch (error) {
    log.error('Error creating program', { error });
    return {
      success: false,
      error: error instanceof z.ZodError
        ? error.errors.map(e => e.message).join(', ')
        : error instanceof Error ? error.message : 'Failed to create program',
    };
  }
}

/**
 * List all programs for a tenant
 */
export async function listPrograms(
  tenantId: string
): Promise<{ success: boolean; programs?: ProgramRecord[]; error?: string }> {
  try {
    const snapshot = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('programs')
      .orderBy('createdAt', 'desc')
      .get();

    const programs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ProgramRecord[];

    return { success: true, programs };
  } catch (error) {
    log.error('Error listing programs', { error });
    return { success: false, error: 'Failed to load programs' };
  }
}

/**
 * Get a single program by ID
 */
export async function getProgram(
  tenantId: string,
  programId: string
): Promise<{ success: boolean; program?: ProgramRecord; error?: string }> {
  try {
    const doc = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('programs')
      .doc(programId)
      .get();

    if (!doc.exists) {
      return { success: false, error: 'Program not found' };
    }

    return {
      success: true,
      program: { id: doc.id, ...doc.data() } as ProgramRecord,
    };
  } catch (error) {
    log.error('Error getting program', { error });
    return { success: false, error: 'Failed to load program' };
  }
}

/**
 * Update a program
 */
export async function updateProgram(
  tenantId: string,
  programId: string,
  input: UpdateProgramInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = UpdateProgramInputSchema.parse(input);

    const programRef = adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('programs')
      .doc(programId);

    const doc = await programRef.get();
    if (!doc.exists) {
      return { success: false, error: 'Program not found' };
    }

    // If renaming, check for duplicate
    if (validated.codeName) {
      const duplicateCheck = await adminDb
        .collection('tenants')
        .doc(tenantId)
        .collection('programs')
        .where('codeName', '==', validated.codeName)
        .limit(1)
        .get();

      if (!duplicateCheck.empty && duplicateCheck.docs[0].id !== programId) {
        return { success: false, error: 'A program with this code name already exists' };
      }
    }

    // Build update object (only include defined fields)
    const updateData: Record<string, unknown> = {
      updatedAt: adminFieldValue.serverTimestamp(),
    };

    if (validated.codeName !== undefined) updateData.codeName = validated.codeName;
    if (validated.currentStage !== undefined) updateData.currentStage = validated.currentStage;
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.budgetTotal !== undefined) updateData.budgetTotal = validated.budgetTotal;
    if (validated.budgetSpent !== undefined) updateData.budgetSpent = validated.budgetSpent;

    await programRef.update(updateData);

    log.info('Program updated', { tenantId, programId });

    return { success: true };
  } catch (error) {
    log.error('Error updating program', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update program',
    };
  }
}

/**
 * Get program count for a tenant (for dashboard stats)
 */
export async function getProgramCount(
  tenantId: string
): Promise<{ total: number; active: number; limit: number }> {
  try {
    const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
    const tier = (tenantDoc.data()?.tier || 'academic') as SubscriptionTier;
    const limit = TIER_LIMITS[tier].maxPrograms;

    const totalSnapshot = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('programs')
      .count()
      .get();

    const activeSnapshot = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('programs')
      .where('status', '==', 'active')
      .count()
      .get();

    return {
      total: totalSnapshot.data().count,
      active: activeSnapshot.data().count,
      limit,
    };
  } catch (error) {
    log.error('Error getting program count', { error });
    return { total: 0, active: 0, limit: 3 };
  }
}
