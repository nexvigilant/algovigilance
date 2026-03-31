import { z } from 'zod';

/**
 * AlgoVigilance Community Validation Engine
 *
 * Centralized Zod schemas for all community-related data structures.
 * Ensures consistent validation across user actions and admin management.
 */

export const AttachmentSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  fileUrl: z.string().url(),
  fileSize: z.number().max(50 * 1024 * 1024, 'File too large (max 50MB)'),
  fileType: z.enum(['image', 'document', 'pdf', 'spreadsheet', 'other']),
  mimeType: z.string(),
  uploadedAt: z.any(),
});

export const CreatePostSchema = z.object({
  title: z
    .string()
    .min(10, 'Title must be at least 10 characters')
    .max(200, 'Title must be 200 characters or less'),
  content: z
    .string()
    .min(20, 'Content must be at least 20 characters')
    .max(20000, 'Content too long'),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).max(5, 'Maximum 5 tags allowed'),
  attachments: z.array(AttachmentSchema).max(5).optional(),
});

export const CreateReplySchema = z.object({
  postId: z.string(),
  content: z
    .string()
    .min(1, 'Reply cannot be empty')
    .max(5000, 'Reply too long'),
  parentReplyId: z.string().optional(),
});

export const CircleTaxonomySchema = z.object({
  functions: z.array(z.string()).optional(),
  industries: z.array(z.string()).optional(),
  careerStages: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  goals: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  pathways: z.array(z.string()).optional(),
});

export const CreateCircleSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  category: z.string(),
  type: z.enum(['public', 'private', 'invite-only']),
  tags: z.array(z.string()).max(10),
  circleTags: CircleTaxonomySchema.optional(),
});

/**
 * Performance-optimized validation wrapper.
 */
export async function validateData<T>(schema: z.ZodSchema<T>, data: unknown): Promise<{ success: boolean; data?: T; error?: string }> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errorMessage = result.error.errors[0]?.message || 'Invalid data provided';
  return { success: false, error: errorMessage };
}
