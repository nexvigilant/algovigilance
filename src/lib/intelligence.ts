/**
 * Intelligence Content Library
 *
 * Utilities for reading, parsing, and querying MDX content
 * for the Intelligence hub.
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import type {
  ContentMeta,
  ContentItem,
  ContentType,
  ContentCardProps,
  PodcastMeta,
  PublicationMeta,
} from '@/types/intelligence';

import { logger } from '@/lib/logger';
const log = logger.scope('lib/intelligence');

/** Content directory path */
const CONTENT_DIR = path.join(process.cwd(), 'content', 'intelligence');

/** Map content types to their directory names */
const TYPE_DIRS: Record<ContentType, string> = {
  podcast: 'podcast',
  publication: 'publications',
  perspective: 'perspectives',
  'field-note': 'field-notes',
  signal: 'signals',
};

/**
 * Get all MDX files from a directory
 */
function getMdxFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir).filter((file) => file.endsWith('.mdx'));
}

/**
 * Parse frontmatter and content from an MDX file
 */
function parseContent<T extends ContentMeta>(
  filePath: string,
  type: ContentType
): ContentItem<T> | null {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContent);

    // Auto-calculate reading time if not provided
    const stats = readingTime(content);
    const calculatedReadingTime = Math.ceil(stats.minutes);

    const slug = path.basename(filePath, '.mdx');

    // For podcasts, use duration as readingTime if not explicitly set
    // This ensures podcast cards show listen time, not text reading time
    const effectiveReadingTime =
      type === 'podcast' && data.duration
        ? data.duration
        : (data.readingTime ?? calculatedReadingTime);

    const meta = {
      ...data,
      slug,
      type,
      readingTime: effectiveReadingTime,
    } as T;

    return {
      meta,
      content,
      filePath,
    };
  } catch (error) {
    log.error(`Error parsing ${filePath}:`, error);
    return null;
  }
}

/**
 * Get all content items of a specific type
 */
export function getContentByType<T extends ContentMeta>(
  type: ContentType
): ContentItem<T>[] {
  const dir = path.join(CONTENT_DIR, TYPE_DIRS[type]);
  const files = getMdxFiles(dir);

  const items = files
    .map((file) => parseContent<T>(path.join(dir, file), type))
    .filter((item): item is ContentItem<T> => item !== null)
    .filter((item) => item.meta.status === 'published');

  // Sort by publish date, newest first
  return items.sort(
    (a, b) =>
      new Date(b.meta.publishedAt).getTime() -
      new Date(a.meta.publishedAt).getTime()
  );
}

/** Cache for all content to avoid repeated disk reads */
let allContentCache: ContentItem[] | null = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

/**
 * Get all published content across all types
 */
export function getAllContent(): ContentItem[] {
  const now = Date.now();
  if (allContentCache && (now - lastCacheUpdate < CACHE_TTL)) {
    return allContentCache;
  }

  const types: ContentType[] = [
    'podcast',
    'publication',
    'perspective',
    'field-note',
    'signal',
  ];

  const allContent = types.flatMap((type) => getContentByType(type));

  // Sort by publish date, newest first
  const sortedContent = allContent.sort(
    (a, b) =>
      new Date(b.meta.publishedAt).getTime() -
      new Date(a.meta.publishedAt).getTime()
  );

  allContentCache = sortedContent;
  lastCacheUpdate = now;
  return sortedContent;
}

/**
 * Get a single content item by slug
 */
export function getContentBySlug(slug: string): ContentItem | null {
  const types: ContentType[] = [
    'podcast',
    'publication',
    'perspective',
    'field-note',
    'signal',
  ];

  for (const type of types) {
    const dir = path.join(CONTENT_DIR, TYPE_DIRS[type]);
    const filePath = path.join(dir, `${slug}.mdx`);

    if (fs.existsSync(filePath)) {
      return parseContent(filePath, type);
    }
  }

  return null;
}

/**
 * Get featured content for the homepage hero
 */
export function getFeaturedContent(): ContentItem | null {
  const allContent = getAllContent();
  return allContent.find((item) => item.meta.featured) ?? allContent[0] ?? null;
}

/**
 * Get latest podcast episode
 */
export function getLatestPodcast(): ContentItem<PodcastMeta> | null {
  const podcasts = getContentByType<PodcastMeta>('podcast');
  return podcasts[0] ?? null;
}

/**
 * Get all podcast episodes
 */
export function getAllPodcasts(): ContentItem<PodcastMeta>[] {
  return getContentByType<PodcastMeta>('podcast');
}

/**
 * Get all publications
 */
export function getAllPublications(): ContentItem<PublicationMeta>[] {
  return getContentByType<PublicationMeta>('publication');
}

/**
 * Get content by tag
 */
export function getContentByTag(tag: string): ContentItem[] {
  const allContent = getAllContent();
  return allContent.filter((item) =>
    item.meta.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
}

/**
 * Get all unique tags
 */
export function getAllTags(): string[] {
  const allContent = getAllContent();
  const tags = new Set<string>();

  allContent.forEach((item) => {
    item.meta.tags.forEach((tag) => tags.add(tag));
  });

  return Array.from(tags).sort();
}

/**
 * Get content in a series
 */
export function getSeriesContent(seriesSlug: string): ContentItem[] {
  const allContent = getAllContent();
  return allContent
    .filter((item) => item.meta.series === seriesSlug)
    .sort((a, b) => (a.meta.seriesOrder ?? 0) - (b.meta.seriesOrder ?? 0));
}

/**
 * Get related content for a given item
 */
export function getRelatedContent(
  item: ContentItem,
  limit: number = 3
): ContentItem[] {
  // First, check explicit relatedSlugs
  if (item.meta.relatedSlugs?.length) {
    const related = item.meta.relatedSlugs
      .map((slug) => getContentBySlug(slug))
      .filter((c): c is ContentItem => c !== null);

    if (related.length >= limit) {
      return related.slice(0, limit);
    }
  }

  // Fall back to tag-based matching
  const allContent = getAllContent();
  const scored = allContent
    .filter((c) => c.meta.slug !== item.meta.slug)
    .map((c) => {
      const sharedTags = c.meta.tags.filter((t) =>
        item.meta.tags.includes(t)
      ).length;
      const sameType = c.meta.type === item.meta.type ? 1 : 0;
      const sameSeries = c.meta.series === item.meta.series ? 2 : 0;

      return {
        item: c,
        score: sharedTags * 2 + sameType + sameSeries,
      };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.item);
}

/**
 * Transform content item to card props for display
 */
export function toCardProps(item: ContentItem): ContentCardProps {
  const base: ContentCardProps = {
    slug: item.meta.slug,
    title: item.meta.title,
    description: item.meta.description,
    type: item.meta.type,
    publishedAt: item.meta.publishedAt,
    author: item.meta.author,
    image: item.meta.image,
    imageAlt: item.meta.imageAlt,
    tags: item.meta.tags,
    readingTime: item.meta.readingTime,
    featured: item.meta.featured,
  };

  // Add type-specific fields
  if (item.meta.type === 'podcast') {
    const podcast = item.meta as PodcastMeta;
    base.episodeNumber = podcast.episodeNumber;
    base.duration = podcast.duration;
  }

  if (item.meta.type === 'publication') {
    const pub = item.meta as PublicationMeta;
    base.publicationType = pub.publicationType;
  }

  if (item.meta.type === 'signal') {
    base.platform = (item.meta as { platform?: string }).platform;
  }

  return base;
}

/**
 * Get trending content (placeholder - would be based on analytics)
 */
export function getTrendingContent(limit: number = 5): ContentItem[] {
  // For now, return most recent non-signal content
  const allContent = getAllContent();
  return allContent
    .filter((item) => item.meta.type !== 'signal')
    .slice(0, limit);
}

/**
 * Get content counts by type
 */
export function getContentStats(): Record<ContentType, number> {
  const types: ContentType[] = [
    'podcast',
    'publication',
    'perspective',
    'field-note',
    'signal',
  ];

  return types.reduce(
    (acc, type) => {
      acc[type] = getContentByType(type).length;
      return acc;
    },
    {} as Record<ContentType, number>
  );
}

/**
 * Generate static paths for all content
 */
export function generateContentPaths(): { slug: string }[] {
  const allContent = getAllContent();
  return allContent.map((item) => ({ slug: item.meta.slug }));
}

// ============================================================================
// HYBRID FUNCTIONS (File + Firestore)
// ============================================================================

import {
  getFirestoreContent,
  getFirestoreContentByType,
  getFirestoreContentBySlug,
  getFirestoreFeaturedContent,
  getFirestoreContentSlugs,
} from './intelligence-firestore';

/**
 * Get all published content from both file system and Firestore
 * Firestore content takes precedence for duplicate slugs
 */
export async function getAllContentHybrid(): Promise<ContentItem[]> {
  // Get content from both sources in parallel
  const [fileContent, firestoreContent] = await Promise.all([
    Promise.resolve(getAllContent()),
    getFirestoreContent(),
  ]);

  // Create a map by slug for deduplication (Firestore takes precedence)
  const contentMap = new Map<string, ContentItem>();

  // Add file-based content first
  fileContent.forEach((item) => {
    contentMap.set(item.meta.slug, item);
  });

  // Firestore content overwrites duplicates
  firestoreContent.forEach((item) => {
    contentMap.set(item.meta.slug, item);
  });

  // Convert back to array and sort by publish date
  return Array.from(contentMap.values()).sort(
    (a, b) =>
      new Date(b.meta.publishedAt).getTime() -
      new Date(a.meta.publishedAt).getTime()
  );
}

/**
 * Get content by type from both sources
 */
export async function getContentByTypeHybrid<T extends ContentMeta>(
  type: ContentType
): Promise<ContentItem<T>[]> {
  const [fileContent, firestoreContent] = await Promise.all([
    Promise.resolve(getContentByType<T>(type)),
    getFirestoreContentByType(type),
  ]);

  // Deduplicate by slug
  const contentMap = new Map<string, ContentItem<T>>();

  fileContent.forEach((item) => {
    contentMap.set(item.meta.slug, item);
  });

  firestoreContent.forEach((item) => {
    contentMap.set(item.meta.slug, item as ContentItem<T>);
  });

  return Array.from(contentMap.values()).sort(
    (a, b) =>
      new Date(b.meta.publishedAt).getTime() -
      new Date(a.meta.publishedAt).getTime()
  );
}

/**
 * Get single content item by slug from both sources
 * Firestore takes precedence
 */
export async function getContentBySlugHybrid(slug: string): Promise<ContentItem | null> {
  // Check Firestore first (takes precedence)
  const firestoreItem = await getFirestoreContentBySlug(slug);
  if (firestoreItem) {
    return firestoreItem;
  }

  // Fall back to file system
  return getContentBySlug(slug);
}

/**
 * Get featured content from both sources
 * Firestore featured takes precedence
 */
export async function getFeaturedContentHybrid(): Promise<ContentItem | null> {
  // Check Firestore first
  const firestoreFeatured = await getFirestoreFeaturedContent();
  if (firestoreFeatured) {
    return firestoreFeatured;
  }

  // Fall back to file system
  return getFeaturedContent();
}

/**
 * Generate static paths from both sources
 */
export async function generateContentPathsHybrid(): Promise<{ slug: string }[]> {
  const [filePaths, firestoreSlugs] = await Promise.all([
    Promise.resolve(generateContentPaths()),
    getFirestoreContentSlugs(),
  ]);

  // Combine and deduplicate
  const slugSet = new Set<string>();
  filePaths.forEach((p) => slugSet.add(p.slug));
  firestoreSlugs.forEach((slug) => slugSet.add(slug));

  return Array.from(slugSet).map((slug) => ({ slug }));
}

/**
 * Get related content using hybrid sources
 */
export async function getRelatedContentHybrid(
  item: ContentItem,
  limit: number = 3
): Promise<ContentItem[]> {
  // First, check explicit relatedSlugs
  if (item.meta.relatedSlugs?.length) {
    const relatedPromises = item.meta.relatedSlugs.map((slug) =>
      getContentBySlugHybrid(slug)
    );
    const related = (await Promise.all(relatedPromises)).filter(
      (c): c is ContentItem => c !== null
    );

    if (related.length >= limit) {
      return related.slice(0, limit);
    }
  }

  // Fall back to tag-based matching
  const allContent = await getAllContentHybrid();
  const scored = allContent
    .filter((c) => c.meta.slug !== item.meta.slug)
    .map((c) => {
      const sharedTags = c.meta.tags.filter((t) =>
        item.meta.tags.includes(t)
      ).length;
      const sameType = c.meta.type === item.meta.type ? 1 : 0;
      const sameSeries = c.meta.series === item.meta.series ? 2 : 0;

      return {
        item: c,
        score: sharedTags * 2 + sameType + sameSeries,
      };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.item);
}
