/**
 * Intelligence Content - Firestore Integration
 *
 * Fetches published content from Firestore for the Intelligence hub.
 * Works alongside file-based content for a hybrid CMS approach.
 */

import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc as _getDoc,
  doc as _doc,
  Timestamp,
} from 'firebase/firestore';
import type {
  ContentMeta,
  ContentItem,
  ContentType,
  PodcastMeta,
  PublicationMeta,
  PerspectiveMeta,
  FieldNoteMeta,
  SignalMeta,
} from '@/types/intelligence';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('lib/intelligence-firestore');

const COLLECTION = 'intelligence';

/**
 * Convert Firestore document to ContentItem format
 */
function docToContentItem(docData: Record<string, unknown>, docId: string): ContentItem | null {
  try {
    const type = docData.type as ContentType;

    // Build base metadata
    const baseMeta: Partial<ContentMeta> = {
      slug: docData.slug as string,
      title: docData.title as string,
      description: (docData.description as string) || '',
      type,
      status: (docData.status as 'draft' | 'review' | 'published' | 'archived') || 'published',
      publishedAt: docData.publishedAt instanceof Timestamp
        ? toDateFromSerialized(docData.publishedAt).toISOString()
        : (docData.publishedAt as string) || new Date().toISOString(),
      updatedAt: docData.updatedAt instanceof Timestamp
        ? toDateFromSerialized(docData.updatedAt).toISOString()
        : undefined,
      author: (docData.author as string) || 'AlgoVigilance Intelligence',
      image: docData.image as string | undefined,
      imageAlt: docData.imageAlt as string | undefined,
      tags: (docData.tags as string[]) || [],
      readingTime: docData.readingTime as number | undefined,
      featured: (docData.featured as boolean) || false,
      series: docData.series as string | undefined,
      seriesOrder: docData.seriesOrder as number | undefined,
      relatedSlugs: (docData.relatedSlugs as string[]) || [],
    };

    // Add type-specific fields
    let meta: ContentMeta;

    switch (type) {
      case 'podcast':
        meta = {
          ...baseMeta,
          type: 'podcast',
          audioUrl: docData.audioUrl as string | undefined,
          duration: (docData.duration as number) || 0,
          episodeNumber: (docData.episodeNumber as number) || 1,
          seasonNumber: docData.seasonNumber as number | undefined,
          spotifyEpisodeId: docData.spotifyEpisodeId as string | undefined,
          spotifyUrl: docData.spotifyUrl as string | undefined,
          applePodcastsUrl: docData.applePodcastsUrl as string | undefined,
          youtubeUrl: docData.youtubeUrl as string | undefined,
          guests: docData.guests as string[] | undefined,
          hasTranscript: docData.hasTranscript as boolean | undefined,
        } as PodcastMeta;
        // Use duration as readingTime for podcasts
        if (!meta.readingTime && (meta as PodcastMeta).duration) {
          meta.readingTime = (meta as PodcastMeta).duration;
        }
        break;

      case 'publication':
        meta = {
          ...baseMeta,
          type: 'publication',
          pdfUrl: docData.pdfUrl as string | undefined,
          pageCount: docData.pageCount as number | undefined,
          publicationType: (docData.publicationType as 'whitepaper' | 'research' | 'report' | 'guide') || 'whitepaper',
          executiveSummary: docData.executiveSummary as string | undefined,
          citation: docData.citation as string | undefined,
          doi: docData.doi as string | undefined,
        } as PublicationMeta;
        break;

      case 'perspective':
        meta = {
          ...baseMeta,
          type: 'perspective',
          pullQuote: docData.pullQuote as string | undefined,
          isOpinion: docData.isOpinion as boolean | undefined,
        } as PerspectiveMeta;
        break;

      case 'field-note':
        meta = {
          ...baseMeta,
          type: 'field-note',
          originalPlatform: docData.originalPlatform as 'linkedin' | 'newsletter' | 'medium' | undefined,
          originalUrl: docData.originalUrl as string | undefined,
        } as FieldNoteMeta;
        break;

      case 'signal':
        meta = {
          ...baseMeta,
          type: 'signal',
          signalStrength: (docData.signalStrength as 'emerging' | 'developing' | 'confirmed') || 'emerging',
          validationStatus: (docData.validationStatus as 'detected' | 'under_review' | 'validated') || 'detected',
          impactAreas: (docData.impactAreas as string[]) || [],
          signalSource: (docData.signalSource as 'regulatory' | 'industry' | 'research' | 'market' | 'technology') || 'industry',
          platform: docData.platform as 'linkedin' | 'twitter' | 'threads' | undefined,
          originalUrl: docData.originalUrl as string | undefined,
          keyDataPoint: docData.keyDataPoint as string | undefined,
          detectedAt: docData.detectedAt instanceof Timestamp
            ? toDateFromSerialized(docData.detectedAt).toISOString()
            : docData.detectedAt as string | undefined,
        } as SignalMeta;
        break;

      default:
        log.warn(`Unknown content type: ${type}`);
        return null;
    }

    return {
      meta,
      content: (docData.body as string) || '',
      filePath: `firestore://${COLLECTION}/${docId}`,
    };
  } catch (error) {
    log.error('Error converting Firestore document to ContentItem:', error);
    return null;
  }
}

/**
 * Get all published content from Firestore
 */
export async function getFirestoreContent(): Promise<ContentItem[]> {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc')
    );

    const snapshot = await getDocs(q);

    const items = snapshot.docs
      .map((docSnap) => docToContentItem(docSnap.data(), docSnap.id))
      .filter((item): item is ContentItem => item !== null);

    return items;
  } catch (error) {
    log.error('Error fetching Firestore content:', error);
    return [];
  }
}

/**
 * Get content by type from Firestore
 */
export async function getFirestoreContentByType(type: ContentType): Promise<ContentItem[]> {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('status', '==', 'published'),
      where('type', '==', type),
      orderBy('publishedAt', 'desc')
    );

    const snapshot = await getDocs(q);

    const items = snapshot.docs
      .map((docSnap) => docToContentItem(docSnap.data(), docSnap.id))
      .filter((item): item is ContentItem => item !== null);

    return items;
  } catch (error) {
    log.error(`Error fetching Firestore content by type (${type}):`, error);
    return [];
  }
}

/**
 * Get a single content item by slug from Firestore
 */
export async function getFirestoreContentBySlug(slug: string): Promise<ContentItem | null> {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('slug', '==', slug),
      where('status', '==', 'published')
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const docSnap = snapshot.docs[0];
    return docToContentItem(docSnap.data(), docSnap.id);
  } catch (error) {
    log.error(`Error fetching Firestore content by slug (${slug}):`, error);
    return null;
  }
}

/**
 * Get featured content from Firestore
 */
export async function getFirestoreFeaturedContent(): Promise<ContentItem | null> {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('status', '==', 'published'),
      where('featured', '==', true),
      orderBy('publishedAt', 'desc')
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const docSnap = snapshot.docs[0];
    return docToContentItem(docSnap.data(), docSnap.id);
  } catch (error) {
    log.error('Error fetching Firestore featured content:', error);
    return null;
  }
}

/**
 * Get all slugs from Firestore for static generation
 */
export async function getFirestoreContentSlugs(): Promise<string[]> {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('status', '==', 'published')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs
      .map((docSnap) => docSnap.data().slug as string)
      .filter((slug): slug is string => !!slug);
  } catch (error) {
    log.error('Error fetching Firestore content slugs:', error);
    return [];
  }
}
