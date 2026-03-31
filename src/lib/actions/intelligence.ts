'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { requireAdmin } from '@/lib/admin-auth';
import type {
  ContentType,
  ContentStatus,
  IntelligenceDocument,
  IntelligenceFormData,
  IntelligenceListItem,
} from '@/types/intelligence';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('intelligence/actions');

const COLLECTION = 'intelligence';

// ============================================================================
// Read Operations
// ============================================================================

/**
 * Get all Intelligence content for admin list view
 * SECURITY: Requires admin role
 */
export async function getIntelligenceList(filters?: {
  type?: ContentType;
  status?: ContentStatus;
}): Promise<{
  success: boolean;
  items?: IntelligenceListItem[];
  error?: string;
}> {
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[getIntelligenceList] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    let queryRef: FirebaseFirestore.Query = adminDb
      .collection(COLLECTION)
      .orderBy('updatedAt', 'desc');

    // Apply filters if provided
    if (filters?.type) {
      queryRef = queryRef.where('type', '==', filters.type);
    }
    if (filters?.status) {
      queryRef = queryRef.where('status', '==', filters.status);
    }

    const snapshot = await queryRef.get();

    const items: IntelligenceListItem[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        slug: data.slug || '',
        title: data.title || '',
        type: data.type || 'perspective',
        status: data.status || 'draft',
        author: data.author || '',
        publishedAt: data.publishedAt instanceof Timestamp
          ? toDateFromSerialized(data.publishedAt).toISOString()
          : null,
        updatedAt: data.updatedAt instanceof Timestamp
          ? toDateFromSerialized(data.updatedAt).toISOString()
          : new Date().toISOString(),
        featured: data.featured || false,
        image: data.image || undefined,
        source: 'firestore',
      };
    });

    return { success: true, items };
  } catch (error) {
    log.error('Error fetching intelligence list:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch content',
    };
  }
}

/**
 * Get a single Intelligence document by ID for editing
 * SECURITY: Requires admin role
 */
export async function getIntelligenceById(id: string): Promise<{
  success: boolean;
  content?: IntelligenceDocument;
  error?: string;
}> {
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[getIntelligenceById] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    const docRef = adminDb.collection(COLLECTION).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return { success: false, error: 'Content not found' };
    }

    const data = docSnap.data();
    if (!data) return { success: false, error: 'Content data is empty' };
    const content: IntelligenceDocument = {
      id: docSnap.id,
      source: 'firestore',
      slug: data.slug || '',
      title: data.title || '',
      description: data.description || '',
      type: data.type || 'perspective',
      status: data.status || 'draft',
      publishedAt: data.publishedAt || null,
      author: data.author || '',
      image: data.image,
      imageAlt: data.imageAlt,
      tags: data.tags || [],
      readingTime: data.readingTime,
      featured: data.featured || false,
      series: data.series,
      seriesOrder: data.seriesOrder,
      relatedSlugs: data.relatedSlugs || [],
      body: data.body || '',
      createdAt: data.createdAt || Timestamp.now(),
      updatedAt: data.updatedAt || Timestamp.now(),
      createdBy: data.createdBy || '',
      updatedBy: data.updatedBy,
      // Type-specific fields
      audioUrl: data.audioUrl,
      duration: data.duration,
      episodeNumber: data.episodeNumber,
      seasonNumber: data.seasonNumber,
      spotifyEpisodeId: data.spotifyEpisodeId,
      spotifyUrl: data.spotifyUrl,
      applePodcastsUrl: data.applePodcastsUrl,
      youtubeUrl: data.youtubeUrl,
      guests: data.guests,
      hasTranscript: data.hasTranscript,
      pdfUrl: data.pdfUrl,
      pageCount: data.pageCount,
      publicationType: data.publicationType,
      executiveSummary: data.executiveSummary,
      citation: data.citation,
      doi: data.doi,
      pullQuote: data.pullQuote,
      isOpinion: data.isOpinion,
      originalPlatform: data.originalPlatform,
      originalUrl: data.originalUrl,
      signalStrength: data.signalStrength,
      validationStatus: data.validationStatus,
      impactAreas: data.impactAreas,
      signalSource: data.signalSource,
      platform: data.platform,
      keyDataPoint: data.keyDataPoint,
      detectedAt: data.detectedAt,
    };

    return { success: true, content };
  } catch (error) {
    log.error('Error fetching intelligence content:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch content',
    };
  }
}

// ============================================================================
// Create Operations
// ============================================================================

/**
 * Create new Intelligence content
 * SECURITY: Requires admin role
 */
export async function createIntelligence(
  formData: IntelligenceFormData
): Promise<{
  success: boolean;
  id?: string;
  error?: string;
}> {
  let adminCtx;
  try {
    adminCtx = await requireAdmin();
  } catch (error) {
    log.error('[createIntelligence] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    // Validate required fields
    if (!formData.slug || !formData.title || !formData.type) {
      return { success: false, error: 'Missing required fields: slug, title, type' };
    }

    // Check for duplicate slug
    const existingSnapshot = await adminDb
      .collection(COLLECTION)
      .where('slug', '==', formData.slug)
      .get();

    if (!existingSnapshot.empty) {
      return { success: false, error: 'Content with this slug already exists' };
    }

    const now = Timestamp.now();
    const publishedAt = formData.publishedAt
      ? Timestamp.fromDate(new Date(formData.publishedAt))
      : null;

    const docData = {
      slug: formData.slug,
      title: formData.title,
      description: formData.description || '',
      type: formData.type,
      status: formData.status || 'draft',
      publishedAt,
      author: formData.author || 'AlgoVigilance Intelligence',
      image: formData.image || null,
      imageAlt: formData.imageAlt || null,
      tags: formData.tags || [],
      readingTime: formData.readingTime || null,
      featured: formData.featured || false,
      series: formData.series || null,
      seriesOrder: formData.seriesOrder || null,
      relatedSlugs: formData.relatedSlugs || [],
      body: formData.body || '',
      source: 'firestore',
      createdAt: now,
      updatedAt: now,
      createdBy: adminCtx.uid,
      // Type-specific fields (only include if provided)
      ...(formData.audioUrl && { audioUrl: formData.audioUrl }),
      ...(formData.duration && { duration: formData.duration }),
      ...(formData.episodeNumber && { episodeNumber: formData.episodeNumber }),
      ...(formData.seasonNumber && { seasonNumber: formData.seasonNumber }),
      ...(formData.spotifyEpisodeId && { spotifyEpisodeId: formData.spotifyEpisodeId }),
      ...(formData.spotifyUrl && { spotifyUrl: formData.spotifyUrl }),
      ...(formData.applePodcastsUrl && { applePodcastsUrl: formData.applePodcastsUrl }),
      ...(formData.youtubeUrl && { youtubeUrl: formData.youtubeUrl }),
      ...(formData.guests?.length && { guests: formData.guests }),
      ...(formData.hasTranscript !== undefined && { hasTranscript: formData.hasTranscript }),
      ...(formData.pdfUrl && { pdfUrl: formData.pdfUrl }),
      ...(formData.pageCount && { pageCount: formData.pageCount }),
      ...(formData.publicationType && { publicationType: formData.publicationType }),
      ...(formData.executiveSummary && { executiveSummary: formData.executiveSummary }),
      ...(formData.citation && { citation: formData.citation }),
      ...(formData.doi && { doi: formData.doi }),
      ...(formData.pullQuote && { pullQuote: formData.pullQuote }),
      ...(formData.isOpinion !== undefined && { isOpinion: formData.isOpinion }),
      ...(formData.originalPlatform && { originalPlatform: formData.originalPlatform }),
      ...(formData.originalUrl && { originalUrl: formData.originalUrl }),
      ...(formData.signalStrength && { signalStrength: formData.signalStrength }),
      ...(formData.validationStatus && { validationStatus: formData.validationStatus }),
      ...(formData.impactAreas?.length && { impactAreas: formData.impactAreas }),
      ...(formData.signalSource && { signalSource: formData.signalSource }),
      ...(formData.platform && { platform: formData.platform }),
      ...(formData.keyDataPoint && { keyDataPoint: formData.keyDataPoint }),
      ...(formData.detectedAt && { detectedAt: Timestamp.fromDate(new Date(formData.detectedAt)) }),
    };

    const docRef = await adminDb.collection(COLLECTION).add(docData);

    log.info(`Created intelligence content: ${docRef.id} (${formData.slug})`);
    return { success: true, id: docRef.id };
  } catch (error) {
    log.error('Error creating intelligence content:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create content',
    };
  }
}

// ============================================================================
// Update Operations
// ============================================================================

/**
 * Update existing Intelligence content
 * SECURITY: Requires admin role
 */
export async function updateIntelligence(
  id: string,
  formData: Partial<IntelligenceFormData>
): Promise<{
  success: boolean;
  error?: string;
}> {
  let adminCtx;
  try {
    adminCtx = await requireAdmin();
  } catch (error) {
    log.error('[updateIntelligence] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    const docRef = adminDb.collection(COLLECTION).doc(id);
    const existingDoc = await docRef.get();

    if (!existingDoc.exists) {
      return { success: false, error: 'Content not found' };
    }

    // If slug is being changed, check for duplicates
    if (formData.slug && formData.slug !== existingDoc.data()?.slug) {
      const duplicateSnapshot = await adminDb
        .collection(COLLECTION)
        .where('slug', '==', formData.slug)
        .get();

      if (!duplicateSnapshot.empty) {
        return { success: false, error: 'Content with this slug already exists' };
      }
    }

    const now = Timestamp.now();
    const publishedAt = formData.publishedAt
      ? Timestamp.fromDate(new Date(formData.publishedAt))
      : formData.publishedAt === null
        ? null
        : undefined;

    // Build update object, excluding undefined values
    const updateData: Record<string, unknown> = {
      updatedAt: now,
      updatedBy: adminCtx.uid,
    };

    // Only include fields that are explicitly provided
    if (formData.slug !== undefined) updateData.slug = formData.slug;
    if (formData.title !== undefined) updateData.title = formData.title;
    if (formData.description !== undefined) updateData.description = formData.description;
    if (formData.type !== undefined) updateData.type = formData.type;
    if (formData.status !== undefined) updateData.status = formData.status;
    if (publishedAt !== undefined) updateData.publishedAt = publishedAt;
    if (formData.author !== undefined) updateData.author = formData.author;
    if (formData.image !== undefined) updateData.image = formData.image || null;
    if (formData.imageAlt !== undefined) updateData.imageAlt = formData.imageAlt || null;
    if (formData.tags !== undefined) updateData.tags = formData.tags;
    if (formData.readingTime !== undefined) updateData.readingTime = formData.readingTime;
    if (formData.featured !== undefined) updateData.featured = formData.featured;
    if (formData.series !== undefined) updateData.series = formData.series || null;
    if (formData.seriesOrder !== undefined) updateData.seriesOrder = formData.seriesOrder;
    if (formData.relatedSlugs !== undefined) updateData.relatedSlugs = formData.relatedSlugs;
    if (formData.body !== undefined) updateData.body = formData.body;

    // Type-specific fields
    if (formData.audioUrl !== undefined) updateData.audioUrl = formData.audioUrl || null;
    if (formData.duration !== undefined) updateData.duration = formData.duration;
    if (formData.episodeNumber !== undefined) updateData.episodeNumber = formData.episodeNumber;
    if (formData.seasonNumber !== undefined) updateData.seasonNumber = formData.seasonNumber;
    if (formData.spotifyEpisodeId !== undefined) updateData.spotifyEpisodeId = formData.spotifyEpisodeId || null;
    if (formData.spotifyUrl !== undefined) updateData.spotifyUrl = formData.spotifyUrl || null;
    if (formData.applePodcastsUrl !== undefined) updateData.applePodcastsUrl = formData.applePodcastsUrl || null;
    if (formData.youtubeUrl !== undefined) updateData.youtubeUrl = formData.youtubeUrl || null;
    if (formData.guests !== undefined) updateData.guests = formData.guests;
    if (formData.hasTranscript !== undefined) updateData.hasTranscript = formData.hasTranscript;
    if (formData.pdfUrl !== undefined) updateData.pdfUrl = formData.pdfUrl || null;
    if (formData.pageCount !== undefined) updateData.pageCount = formData.pageCount;
    if (formData.publicationType !== undefined) updateData.publicationType = formData.publicationType || null;
    if (formData.executiveSummary !== undefined) updateData.executiveSummary = formData.executiveSummary || null;
    if (formData.citation !== undefined) updateData.citation = formData.citation || null;
    if (formData.doi !== undefined) updateData.doi = formData.doi || null;
    if (formData.pullQuote !== undefined) updateData.pullQuote = formData.pullQuote || null;
    if (formData.isOpinion !== undefined) updateData.isOpinion = formData.isOpinion;
    if (formData.originalPlatform !== undefined) updateData.originalPlatform = formData.originalPlatform || null;
    if (formData.originalUrl !== undefined) updateData.originalUrl = formData.originalUrl || null;
    if (formData.signalStrength !== undefined) updateData.signalStrength = formData.signalStrength || null;
    if (formData.validationStatus !== undefined) updateData.validationStatus = formData.validationStatus || null;
    if (formData.impactAreas !== undefined) updateData.impactAreas = formData.impactAreas;
    if (formData.signalSource !== undefined) updateData.signalSource = formData.signalSource || null;
    if (formData.platform !== undefined) updateData.platform = formData.platform || null;
    if (formData.keyDataPoint !== undefined) updateData.keyDataPoint = formData.keyDataPoint || null;
    if (formData.detectedAt !== undefined) {
      updateData.detectedAt = formData.detectedAt
        ? Timestamp.fromDate(new Date(formData.detectedAt))
        : null;
    }

    await docRef.update(updateData);

    log.info(`Updated intelligence content: ${id}`);
    return { success: true };
  } catch (error) {
    log.error('Error updating intelligence content:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update content',
    };
  }
}

/**
 * Toggle featured status
 * SECURITY: Requires admin role
 */
export async function toggleFeatured(id: string): Promise<{
  success: boolean;
  featured?: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[toggleFeatured] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    const docRef = adminDb.collection(COLLECTION).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return { success: false, error: 'Content not found' };
    }

    const newFeatured = !docSnap.data()?.featured;
    await docRef.update({
      featured: newFeatured,
      updatedAt: Timestamp.now(),
    });

    return { success: true, featured: newFeatured };
  } catch (error) {
    log.error('Error toggling featured status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle featured',
    };
  }
}

/**
 * Update content status (draft, review, published, archived)
 * SECURITY: Requires admin role
 */
export async function updateContentStatus(
  id: string,
  status: ContentStatus
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[updateContentStatus] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    const docRef = adminDb.collection(COLLECTION).doc(id);
    const now = Timestamp.now();

    const updateData: Record<string, unknown> = {
      status,
      updatedAt: now,
    };

    // Set publishedAt when publishing for the first time
    if (status === 'published') {
      const docSnap = await docRef.get();
      if (docSnap.exists && !docSnap.data()?.publishedAt) {
        updateData.publishedAt = now;
      }
    }

    await docRef.update(updateData);

    log.info(`Updated intelligence content status: ${id} -> ${status}`);
    return { success: true };
  } catch (error) {
    log.error('Error updating content status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update status',
    };
  }
}

// ============================================================================
// Delete Operations
// ============================================================================

/**
 * Delete Intelligence content
 * SECURITY: Requires admin role
 */
export async function deleteIntelligence(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[deleteIntelligence] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    const docRef = adminDb.collection(COLLECTION).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return { success: false, error: 'Content not found' };
    }

    await docRef.delete();

    log.info(`Deleted intelligence content: ${id}`);
    return { success: true };
  } catch (error) {
    log.error('Error deleting intelligence content:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete content',
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a slug from a title
 */
export async function generateSlug(title: string): Promise<{
  success: boolean;
  slug?: string;
  error?: string;
}> {
  try {
    await requireAdmin();
  } catch (error) {
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  // Generate base slug
  let slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  // Check for existing slugs and append number if needed
  const existingSnapshot = await adminDb
    .collection(COLLECTION)
    .where('slug', '>=', slug)
    .where('slug', '<=', slug + '\uf8ff')
    .get();

  if (!existingSnapshot.empty) {
    const existingSlugs = existingSnapshot.docs.map(d => d.data().slug);
    let counter = 1;
    let newSlug = slug;
    while (existingSlugs.includes(newSlug)) {
      newSlug = `${slug}-${counter}`;
      counter++;
    }
    slug = newSlug;
  }

  return { success: true, slug };
}

/**
 * Get content statistics for admin dashboard
 */
export async function getIntelligenceStats(): Promise<{
  success: boolean;
  stats?: {
    total: number;
    published: number;
    draft: number;
    review: number;
    archived: number;
    byType: Record<ContentType, number>;
    featured: number;
  };
  error?: string;
}> {
  try {
    await requireAdmin();
  } catch (error) {
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    const snapshot = await adminDb.collection(COLLECTION).get();

    const stats = {
      total: 0,
      published: 0,
      draft: 0,
      review: 0,
      archived: 0,
      byType: {
        podcast: 0,
        publication: 0,
        perspective: 0,
        'field-note': 0,
        signal: 0,
      } as Record<ContentType, number>,
      featured: 0,
    };

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      stats.total++;

      // Count by status
      switch (data.status) {
        case 'published':
          stats.published++;
          break;
        case 'draft':
          stats.draft++;
          break;
        case 'review':
          stats.review++;
          break;
        case 'archived':
          stats.archived++;
          break;
      }

      // Count by type
      if (data.type in stats.byType) {
        stats.byType[data.type as ContentType]++;
      }

      // Count featured
      if (data.featured) {
        stats.featured++;
      }
    });

    return { success: true, stats };
  } catch (error) {
    log.error('Error fetching intelligence stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch stats',
    };
  }
}
