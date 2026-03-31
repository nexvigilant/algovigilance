/**
 * Intelligence Content Hub Types
 *
 * Content taxonomy for AlgoVigilance's magazine-style intelligence hub.
 * Supports hybrid storage: MDX files + Firestore database.
 */

import type { Timestamp } from 'firebase/firestore';

/** Content categories matching editorial departments */
export type ContentType =
  | 'podcast'      // Signal In the Static episodes
  | 'publication'  // Whitepapers, research, formal pieces
  | 'perspective'  // Thought leadership, commentary, opinion
  | 'field-note'   // LinkedIn articles, newsletter pieces
  | 'signal';      // Social cross-posts, quick takes

/** Content status for editorial workflow */
export type ContentStatus = 'draft' | 'review' | 'published' | 'archived';

/** Base frontmatter shared by all content types */
export interface BaseContentMeta {
  /** URL-friendly identifier */
  slug: string;
  /** Display title */
  title: string;
  /** SEO/preview description (max 160 chars) */
  description: string;
  /** Content category */
  type: ContentType;
  /** Publication status */
  status: ContentStatus;
  /** ISO date string */
  publishedAt: string;
  /** ISO date string */
  updatedAt?: string;
  /** Author name for sign-off (displays as "AlgoVigilance Intelligence Team" in byline) */
  author: string;
  /** Featured image path (relative to /public) */
  image?: string;
  /** Image alt text for accessibility */
  imageAlt?: string;
  /** Topic tags for filtering/discovery */
  tags: string[];
  /** Estimated reading time in minutes (auto-calculated for text, manual for audio) */
  readingTime?: number;
  /** Is this featured/editor's choice content? */
  featured?: boolean;
  /** Series/collection this belongs to (e.g., "FDA Watch 2025") */
  series?: string;
  /** Order within series */
  seriesOrder?: number;
  /** Related content slugs for "Read next" */
  relatedSlugs?: string[];
}

/** Podcast episode specific metadata */
export interface PodcastMeta extends BaseContentMeta {
  type: 'podcast';
  /** Audio file URL (fallback if no embed available) */
  audioUrl?: string;
  /** Episode duration in minutes */
  duration: number;
  /** Episode number */
  episodeNumber: number;
  /** Season number (optional) */
  seasonNumber?: number;
  /** Spotify episode ID for embed (extracted from URL or provided directly) */
  spotifyEpisodeId?: string;
  /** Spotify episode URL */
  spotifyUrl?: string;
  /** Apple Podcasts episode URL */
  applePodcastsUrl?: string;
  /** YouTube video URL (if video podcast) */
  youtubeUrl?: string;
  /** Guest names if interview */
  guests?: string[];
  /** Transcript available */
  hasTranscript?: boolean;
}

/** Publication/whitepaper specific metadata */
export interface PublicationMeta extends BaseContentMeta {
  type: 'publication';
  /** PDF download URL */
  pdfUrl?: string;
  /** Page count */
  pageCount?: number;
  /** Publication type */
  publicationType: 'whitepaper' | 'research' | 'report' | 'guide';
  /** Executive summary (separate from description) */
  executiveSummary?: string;
  /** Citation format */
  citation?: string;
  /** DOI if registered */
  doi?: string;
}

/** Thought leadership/perspective specific metadata */
export interface PerspectiveMeta extends BaseContentMeta {
  type: 'perspective';
  /** Pull quote to highlight */
  pullQuote?: string;
  /** Is this an opinion/editorial piece? */
  isOpinion?: boolean;
}

/** Field note (LinkedIn/newsletter) specific metadata */
export interface FieldNoteMeta extends BaseContentMeta {
  type: 'field-note';
  /** Original platform if cross-posted */
  originalPlatform?: 'linkedin' | 'newsletter' | 'medium';
  /** Original URL if cross-posted */
  originalUrl?: string;
}

/** Signal strength classification (mirrors PV signal terminology) */
export type SignalStrength = 'emerging' | 'developing' | 'confirmed';

/** Signal validation status */
export type SignalValidationStatus = 'detected' | 'under_review' | 'validated';

/** Signal (industry intelligence alert) specific metadata */
export interface SignalMeta extends BaseContentMeta {
  type: 'signal';
  /** Signal strength classification */
  signalStrength: SignalStrength;
  /** Validation status - signals are "detected" until expert review */
  validationStatus: SignalValidationStatus;
  /** Who/what this signal impacts */
  impactAreas: string[];
  /** Source of the signal (regulatory, industry, research, market) */
  signalSource: 'regulatory' | 'industry' | 'research' | 'market' | 'technology';
  /** Original platform if cross-posted */
  platform?: 'linkedin' | 'twitter' | 'threads';
  /** Original post URL if cross-posted */
  originalUrl?: string;
  /** Key data point or metric driving the signal */
  keyDataPoint?: string;
  /** Detection date (may differ from publish date) */
  detectedAt?: string;
}

/** Union type for all content metadata */
export type ContentMeta =
  | PodcastMeta
  | PublicationMeta
  | PerspectiveMeta
  | FieldNoteMeta
  | SignalMeta;

/** Content with parsed MDX */
export interface ContentItem<T extends ContentMeta = ContentMeta> {
  meta: T;
  /** Raw MDX content */
  content: string;
  /** File path for reference */
  filePath: string;
}

/** Content card display props (for list views) */
export interface ContentCardProps {
  slug: string;
  title: string;
  description: string;
  type: ContentType;
  publishedAt: string;
  author: string;
  image?: string;
  imageAlt?: string;
  tags: string[];
  readingTime?: number;
  featured?: boolean;
  /** Type-specific extras */
  episodeNumber?: number;
  duration?: number;
  publicationType?: string;
  platform?: string;
  /** Signal-specific */
  signalStrength?: SignalStrength;
  validationStatus?: SignalValidationStatus;
  impactAreas?: string[];
  signalSource?: string;
}

/** Content type display configuration */
export const CONTENT_TYPE_CONFIG: Record<ContentType, {
  label: string;
  icon: string;
  color: string;
  pluralLabel: string;
  description: string;
}> = {
  podcast: {
    label: 'Signal In the Static',
    icon: '🎙️',
    color: 'purple',
    pluralLabel: 'Episodes',
    description: 'Our podcast exploring pharmaceutical safety and professional development',
  },
  publication: {
    label: 'Publication',
    icon: '📄',
    color: 'navy',
    pluralLabel: 'Publications',
    description: 'Whitepapers, research, and formal publications',
  },
  perspective: {
    label: 'Perspective',
    icon: '💡',
    color: 'teal',
    pluralLabel: 'Perspectives',
    description: 'Thought leadership, commentary, and opinion',
  },
  'field-note': {
    label: 'From the Field',
    icon: '✍️',
    color: 'gray',
    pluralLabel: 'Field Notes',
    description: 'Professional insights and industry observations',
  },
  signal: {
    label: 'Intel Signals',
    icon: '📡',
    color: 'amber',
    pluralLabel: 'Signals',
    description: 'Industry intelligence alerts requiring validation',
  },
};

/** Series/collection metadata */
export interface SeriesMeta {
  slug: string;
  title: string;
  description: string;
  image?: string;
  /** Content slugs in order */
  contentSlugs: string[];
}

// ============================================
// FIRESTORE STORAGE TYPES
// ============================================

/** Content source indicator for hybrid file/Firestore system */
export type ContentSource = 'file' | 'firestore';

/** Base Firestore document fields */
export interface FirestoreDocumentFields {
  /** Firestore document ID */
  id: string;
  /** Content source for hybrid system */
  source: ContentSource;
  /** Creation timestamp */
  createdAt: Timestamp;
  /** Last update timestamp */
  updatedAt: Timestamp;
  /** User ID of creator */
  createdBy: string;
  /** User ID of last editor */
  updatedBy?: string;
}

/** Firestore-stored Intelligence content */
export interface IntelligenceDocument extends FirestoreDocumentFields {
  /** URL-friendly identifier */
  slug: string;
  /** Display title */
  title: string;
  /** SEO/preview description */
  description: string;
  /** Content category */
  type: ContentType;
  /** Publication status */
  status: ContentStatus;
  /** Publication date */
  publishedAt: Timestamp | null;
  /** Author name */
  author: string;
  /** Featured image URL (Firebase Storage) */
  image?: string;
  /** Image alt text */
  imageAlt?: string;
  /** Topic tags */
  tags: string[];
  /** Estimated reading time in minutes */
  readingTime?: number;
  /** Is this featured content? */
  featured: boolean;
  /** Series slug if part of a series */
  series?: string;
  /** Order within series */
  seriesOrder?: number;
  /** Related content slugs */
  relatedSlugs?: string[];
  /** Main content body (markdown) */
  body: string;

  // Type-specific fields (optional based on type)
  /** Podcast: Audio URL */
  audioUrl?: string;
  /** Podcast: Duration in minutes */
  duration?: number;
  /** Podcast: Episode number */
  episodeNumber?: number;
  /** Podcast: Season number */
  seasonNumber?: number;
  /** Podcast: Spotify episode ID */
  spotifyEpisodeId?: string;
  /** Podcast: Spotify URL */
  spotifyUrl?: string;
  /** Podcast: Apple Podcasts URL */
  applePodcastsUrl?: string;
  /** Podcast: YouTube URL */
  youtubeUrl?: string;
  /** Podcast: Guest names */
  guests?: string[];
  /** Podcast: Has transcript */
  hasTranscript?: boolean;

  /** Publication: PDF URL */
  pdfUrl?: string;
  /** Publication: Page count */
  pageCount?: number;
  /** Publication: Type */
  publicationType?: 'whitepaper' | 'research' | 'report' | 'guide';
  /** Publication: Executive summary */
  executiveSummary?: string;
  /** Publication: Citation */
  citation?: string;
  /** Publication: DOI */
  doi?: string;

  /** Perspective: Pull quote */
  pullQuote?: string;
  /** Perspective: Is opinion */
  isOpinion?: boolean;

  /** Field Note: Original platform */
  originalPlatform?: 'linkedin' | 'newsletter' | 'medium';
  /** Field Note/Signal: Original URL */
  originalUrl?: string;

  /** Signal: Strength */
  signalStrength?: SignalStrength;
  /** Signal: Validation status */
  validationStatus?: SignalValidationStatus;
  /** Signal: Impact areas */
  impactAreas?: string[];
  /** Signal: Source type */
  signalSource?: 'regulatory' | 'industry' | 'research' | 'market' | 'technology';
  /** Signal: Platform */
  platform?: 'linkedin' | 'twitter' | 'threads';
  /** Signal: Key data point */
  keyDataPoint?: string;
  /** Signal: Detection date */
  detectedAt?: Timestamp;
}

/** Form data for creating/editing Intelligence content */
export interface IntelligenceFormData {
  slug: string;
  title: string;
  description: string;
  type: ContentType;
  status: ContentStatus;
  publishedAt?: string; // ISO string for form handling
  author: string;
  image?: string;
  imageAlt?: string;
  tags: string[];
  readingTime?: number;
  featured: boolean;
  series?: string;
  seriesOrder?: number;
  relatedSlugs?: string[];
  body: string;

  // Type-specific (all optional, validated based on type)
  audioUrl?: string;
  duration?: number;
  episodeNumber?: number;
  seasonNumber?: number;
  spotifyEpisodeId?: string;
  spotifyUrl?: string;
  applePodcastsUrl?: string;
  youtubeUrl?: string;
  guests?: string[];
  hasTranscript?: boolean;
  pdfUrl?: string;
  pageCount?: number;
  publicationType?: 'whitepaper' | 'research' | 'report' | 'guide';
  executiveSummary?: string;
  citation?: string;
  doi?: string;
  pullQuote?: string;
  isOpinion?: boolean;
  originalPlatform?: 'linkedin' | 'newsletter' | 'medium';
  originalUrl?: string;
  signalStrength?: SignalStrength;
  validationStatus?: SignalValidationStatus;
  impactAreas?: string[];
  signalSource?: 'regulatory' | 'industry' | 'research' | 'market' | 'technology';
  platform?: 'linkedin' | 'twitter' | 'threads';
  keyDataPoint?: string;
  detectedAt?: string; // ISO string for form handling
}

/** List item for admin content table */
export interface IntelligenceListItem {
  id: string;
  slug: string;
  title: string;
  type: ContentType;
  status: ContentStatus;
  author: string;
  publishedAt: string | null;
  updatedAt: string;
  featured: boolean;
  image?: string;
  source: ContentSource;
}
