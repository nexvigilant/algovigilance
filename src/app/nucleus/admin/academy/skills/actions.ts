'use server';

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-auth';
import { logger } from '@/lib/logger';
import type { Skill } from '@/types/academy';

const log = logger.scope('skills/actions');

const SKILLS_COLLECTION = 'skills';

/**
 * Seed data for initial skills
 */
const PHARMA_SKILLS: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Adverse Event Reporting',
    description: 'Understanding and processing adverse event reports according to regulatory requirements',
    category: 'regulatory',
    industryStandard: true,
    associatedRoles: ['Safety Scientist', 'PV Associate', 'Drug Safety Specialist'],
  },
  {
    name: 'Signal Detection',
    description: 'Identifying potential safety signals from aggregate data analysis',
    category: 'clinical',
    industryStandard: true,
    associatedRoles: ['Signal Detection Scientist', 'Epidemiologist', 'Safety Analyst'],
  },
  {
    name: 'MedDRA Coding',
    description: 'Accurate coding of medical terms using MedDRA dictionary',
    category: 'technical',
    industryStandard: true,
    associatedRoles: ['Medical Coder', 'PV Associate', 'Data Entry Specialist'],
  },
  {
    name: 'Risk Management',
    description: 'Developing and implementing risk management plans for medicinal products',
    category: 'regulatory',
    industryStandard: true,
    associatedRoles: ['Risk Manager', 'Regulatory Affairs', 'Safety Scientist'],
  },
  {
    name: 'Literature Review',
    description: 'Systematic review of scientific literature for safety information',
    category: 'clinical',
    industryStandard: true,
    associatedRoles: ['Medical Writer', 'Safety Scientist', 'Clinical Researcher'],
  },
  {
    name: 'Regulatory Writing',
    description: 'Preparing regulatory documents including PSURs, DSURs, and safety reports',
    category: 'regulatory',
    industryStandard: true,
    associatedRoles: ['Regulatory Writer', 'Medical Writer', 'Regulatory Affairs'],
  },
  {
    name: 'Database Management',
    description: 'Managing safety databases and ensuring data quality',
    category: 'technical',
    industryStandard: true,
    associatedRoles: ['Database Administrator', 'Data Manager', 'PV Systems Specialist'],
  },
  {
    name: 'Stakeholder Communication',
    description: 'Effective communication with regulatory authorities, HCPs, and patients',
    category: 'soft-skill',
    industryStandard: false,
    associatedRoles: ['Medical Information', 'Regulatory Affairs', 'Safety Scientist'],
  },
  {
    name: 'Project Management',
    description: 'Managing PV projects, timelines, and cross-functional teams',
    category: 'business',
    industryStandard: false,
    associatedRoles: ['PV Manager', 'Project Manager', 'Team Lead'],
  },
  {
    name: 'Quality Assurance',
    description: 'Ensuring compliance with GVP and internal quality standards',
    category: 'regulatory',
    industryStandard: true,
    associatedRoles: ['QA Specialist', 'Auditor', 'Compliance Officer'],
  },
];

export interface CreateSkillInput {
  name: string;
  description: string;
  category: Skill['category'];
  parentSkillId?: string;
  subSkills?: string[];
  industryStandard?: boolean;
  associatedRoles?: string[];
}

export interface UpdateSkillInput {
  name?: string;
  description?: string;
  category?: Skill['category'];
  parentSkillId?: string;
  subSkills?: string[];
  industryStandard?: boolean;
  associatedRoles?: string[];
}

/**
 * Get all skills
 * SECURITY: Requires admin role
 */
export async function getSkills(): Promise<{
  success: boolean;
  skills?: Skill[];
  error?: string;
}> {
  try {
    await requireAdmin();
  } catch {
    log.error('[getSkills] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    const snapshot = await adminDb
      .collection(SKILLS_COLLECTION)
      .orderBy('name', 'asc')
      .get();

    const skills: Skill[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name || '',
        description: data.description || '',
        category: data.category || 'technical',
        parentSkillId: data.parentSkillId || undefined,
        subSkills: data.subSkills || undefined,
        industryStandard: data.industryStandard || false,
        associatedRoles: data.associatedRoles || [],
        createdAt: data.createdAt || adminTimestamp.now(),
        updatedAt: data.updatedAt || adminTimestamp.now(),
      };
    });

    return { success: true, skills };
  } catch (error) {
    log.error('Error fetching skills:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch skills',
    };
  }
}

/**
 * Create a new skill
 * SECURITY: Requires admin role
 */
export async function createSkill(input: CreateSkillInput): Promise<{
  success: boolean;
  skillId?: string;
  error?: string;
}> {
  try {
    await requireAdmin();
  } catch {
    log.error('[createSkill] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    const now = adminTimestamp.now();
    const docRef = await adminDb.collection(SKILLS_COLLECTION).add({
      name: input.name,
      description: input.description,
      category: input.category,
      parentSkillId: input.parentSkillId || null,
      subSkills: input.subSkills || [],
      industryStandard: input.industryStandard || false,
      associatedRoles: input.associatedRoles || [],
      createdAt: now,
      updatedAt: now,
    });

    log.info(`Skill created: ${docRef.id}`);
    return { success: true, skillId: docRef.id };
  } catch (error) {
    log.error('Error creating skill:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create skill',
    };
  }
}

/**
 * Update an existing skill
 * SECURITY: Requires admin role
 */
export async function updateSkill(
  id: string,
  input: UpdateSkillInput
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();
  } catch {
    log.error('[updateSkill] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    const updateData: Record<string, unknown> = {
      updatedAt: adminTimestamp.now(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.parentSkillId !== undefined) updateData.parentSkillId = input.parentSkillId || null;
    if (input.subSkills !== undefined) updateData.subSkills = input.subSkills;
    if (input.industryStandard !== undefined) updateData.industryStandard = input.industryStandard;
    if (input.associatedRoles !== undefined) updateData.associatedRoles = input.associatedRoles;

    await adminDb.collection(SKILLS_COLLECTION).doc(id).update(updateData);

    log.info(`Skill updated: ${id}`);
    return { success: true };
  } catch (error) {
    log.error('Error updating skill:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update skill',
    };
  }
}

/**
 * Delete a skill
 * SECURITY: Requires admin role
 */
export async function deleteSkill(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();
  } catch {
    log.error('[deleteSkill] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    await adminDb.collection(SKILLS_COLLECTION).doc(id).delete();
    log.info(`Skill deleted: ${id}`);
    return { success: true };
  } catch (error) {
    log.error('Error deleting skill:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete skill',
    };
  }
}

/**
 * Seed skills with default pharma industry skills
 * SECURITY: Requires admin role
 */
export async function seedSkills(): Promise<{
  success: boolean;
  count?: number;
  error?: string;
}> {
  try {
    await requireAdmin();
  } catch {
    log.error('[seedSkills] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    const batch = adminDb.batch();
    const now = adminTimestamp.now();

    for (const skill of PHARMA_SKILLS) {
      const docRef = adminDb.collection(SKILLS_COLLECTION).doc();
      batch.set(docRef, {
        ...skill,
        createdAt: now,
        updatedAt: now,
      });
    }

    await batch.commit();
    log.info(`Seeded ${PHARMA_SKILLS.length} skills`);
    return { success: true, count: PHARMA_SKILLS.length };
  } catch (error) {
    log.error('Error seeding skills:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to seed skills',
    };
  }
}
