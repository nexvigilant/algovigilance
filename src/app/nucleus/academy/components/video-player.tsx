'use client';

import { useState, useEffect, useMemo } from 'react';
import { Play, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DOMPurify from 'isomorphic-dompurify';
import { LearningObjectives } from '../build/components/learning-objectives';
import { CalloutBox, CALLOUT_CONFIGS, type CalloutType } from '../build/components/callout-box';
import {
  ListCardGrid,
  parsePriority,
  type ListCardItem,
} from '../build/components/list-card-grid';
import {
  ComparisonTable,
  isComparisonHeading,
  detectComparisonVariant,
  type ComparisonColumn,
  type ComparisonItem,
  type ComparisonVariant,
} from '../build/components/comparison-table';

import { logger } from '@/lib/logger';
const log = logger.scope('components/video-player');

interface VideoPlayerProps {
  videoUrl: string;
  videoProvider?: 'vimeo' | 'youtube' | 'bunny' | 'cloudflare';
  title: string;
  onProgress?: (progress: number) => void; // 0-100
  onComplete?: () => void;
  timestamps?: readonly {
    readonly id: string;
    readonly title: string;
    readonly description?: string;
    readonly secondsFromStart: number;
  }[];
  onTimestampClick?: (seconds: number) => void; // For parent to handle timestamp navigation
}

export function VideoPlayer({
  videoUrl,
  videoProvider = 'vimeo',
  title,
  onProgress,
  onComplete,
  timestamps: _timestamps,
  onTimestampClick
}: VideoPlayerProps) {
  // All hooks must be called unconditionally
  const [hasStarted, setHasStarted] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [jumpToTime, setJumpToTime] = useState<number | null>(null);

  // Flag for validation - early return moved to main return statement
  const isVideoUrlMissing = !videoUrl || videoUrl.trim() === '';

  // Extract video ID from URL or use as-is
  const getEmbedUrl = (url: string, provider: string, timeSeconds?: number): string => {
    if (provider === 'vimeo') {
      // Support both full URLs and just IDs
      const vimeoId = url.includes('vimeo.com')
        ? url.split('/').pop()?.split('?')[0]
        : url;
      let embedUrl = `https://player.vimeo.com/video/${vimeoId}?h=&color=00a8e8&title=0&byline=0&portrait=0`;
      // Add time fragment for jump-to (F020)
      if (timeSeconds !== undefined && timeSeconds > 0) {
        embedUrl += `#t=${timeSeconds}s`;
      }
      return embedUrl;
    }

    if (provider === 'youtube') {
      const youtubeId = url.includes('youtube.com') || url.includes('youtu.be')
        ? url.split('/').pop()?.split('?')[0].split('v=').pop()
        : url;
      let embedUrl = `https://www.youtube.com/embed/${youtubeId}`;
      // Add time parameter for jump-to (F020)
      if (timeSeconds !== undefined && timeSeconds > 0) {
        embedUrl += `?start=${Math.floor(timeSeconds)}`;
      }
      return embedUrl;
    }

    // For Bunny or Cloudflare, assume URL is already formatted
    return url;
  };

  const embedUrl = getEmbedUrl(videoUrl, videoProvider, jumpToTime || undefined);

  // Extract video ID for thumbnail generation
  const getVideoId = (url: string, provider: string): string => {
    if (provider === 'vimeo') {
      return url.includes('vimeo.com') ? url.split('/').pop()?.split('?')[0] || '' : url;
    }
    if (provider === 'youtube') {
      return url.includes('youtube.com') || url.includes('youtu.be')
        ? url.split('/').pop()?.split('?')[0].split('v=').pop() || ''
        : url;
    }
    return '';
  };

  const _videoId = getVideoId(videoUrl, videoProvider);

  // Preconnect to video providers for faster loading
  useEffect(() => {
    if (typeof window !== 'undefined' && !hasStarted) {
      // Preconnect to video provider domains
      const link = document.createElement('link');
      link.rel = 'preconnect';

      if (videoProvider === 'vimeo') {
        link.href = 'https://player.vimeo.com';
      } else if (videoProvider === 'youtube') {
        link.href = 'https://www.youtube.com';
      }

      document.head.appendChild(link);

      // Prefetch DNS for even faster resolution
      const dnsLink = document.createElement('link');
      dnsLink.rel = 'dns-prefetch';
      dnsLink.href = link.href;
      document.head.appendChild(dnsLink);
    }
  }, [videoProvider, hasStarted]);

  useEffect(() => {
    // Listen for Vimeo player events via postMessage
    if (videoProvider === 'vimeo') {
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== 'https://player.vimeo.com') return;

        try {
          const data = JSON.parse(event.data);

          // Track progress
          if (data.event === 'timeupdate' && onProgress) {
            const percent = (data.data?.percent || 0) * 100;
            onProgress(percent);
          }

          // Track completion
          if (data.event === 'ended' && onComplete) {
            onComplete();
          }

          // Track play
          if (data.event === 'play') {
            setHasStarted(true);
          }
        } catch (error) {
          log.error('Error parsing Vimeo message:', error);
          // Don't crash the component on invalid messages
        }
      };

      window.addEventListener('message', handleMessage);

      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }
    return undefined;
  }, [videoProvider, onProgress, onComplete]);

  const handlePlayClick = () => {
    setIsLoading(true);
    setShouldLoadVideo(true);
    setHasStarted(true);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const _handleTimestampClick = (seconds: number) => {
    // Set jump time for next video load
    setJumpToTime(seconds);

    // If video is already loaded, we need to reload the iframe with new time
    if (shouldLoadVideo) {
      setIsLoading(true);
      // The embedUrl will be recalculated with new jumpToTime
    }

    // Notify parent component
    if (onTimestampClick) {
      onTimestampClick(seconds);
    }
  };

  // Validate videoUrl - return error if missing
  if (isVideoUrlMissing) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Video URL is missing for this lesson. Please contact support.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden shadow-lg">
      {/* Loading skeleton for immediate visual feedback */}
      {!hasStarted && (
        <div className="absolute inset-0 animate-pulse">
          <div className="w-full h-full bg-gradient-to-br from-nex-dark to-nex-deep opacity-90" />
        </div>
      )}

      {/* Play button overlay */}
      {!hasStarted && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-nex-dark/70 to-nex-deep/70 z-10 group cursor-pointer transition-all hover:backdrop-blur-sm"
          onClick={handlePlayClick}
          role="button"
          tabIndex={0}
          aria-label={`Play video: ${title}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handlePlayClick();
            }
          }}
        >
          <div className="text-center transform transition-transform group-hover:scale-105">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-cyan group-hover:bg-cyan-dark/80 transition-all shadow-xl">
              <Play className="h-8 w-8 text-white ml-1" />
            </div>
            <p className="text-white font-medium mt-4 text-lg px-4">{title}</p>
            <p className="text-white/70 text-sm mt-1">Click to play</p>
          </div>
        </div>
      )}

      {/* Loading spinner overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-cyan border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-sm">Loading video...</p>
          </div>
        </div>
      )}

      {/* Video iframe */}
      {shouldLoadVideo && (
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture; accelerometer; encrypted-media; gyroscope"
          allowFullScreen
          title={title}
          onLoad={handleIframeLoad}
          onError={() => {
            setVideoError(true);
            setIsLoading(false);
          }}
          loading="lazy"
        />
      )}

      {/* Error overlay */}
      {videoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <Alert variant="destructive" className="max-w-md mx-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load video. Please check your connection or contact support if the problem persists.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}

interface LessonContentProps {
  content: string;
  hasVideo: boolean;
  lessonId?: string; // For localStorage keys in LearningObjectives
}

/**
 * Extracts learning objectives from HTML content
 * Detects H2/H3 with "Learning Objectives" followed by a list
 */
function extractLearningObjectives(html: string): { objectives: string[]; remainingHtml: string } | null {
  // Create a temporary DOM element to parse HTML
  if (typeof window === 'undefined') return null;

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Find "Learning Objectives" heading (H2 or H3)
  const headings = tempDiv.querySelectorAll('h2, h3');
  let objectivesHeading: Element | null = null;

  for (const heading of Array.from(headings)) {
    const text = heading.textContent?.trim().toLowerCase() || '';
    if (text.includes('learning objective')) {
      objectivesHeading = heading;
      break;
    }
  }

  if (!objectivesHeading) return null;

  // Find the list following the heading
  let listElement = objectivesHeading.nextElementSibling;

  // Skip any paragraphs between heading and list (like "Upon completion...")
  while (listElement && listElement.tagName !== 'UL' && listElement.tagName !== 'OL') {
    if (listElement.tagName === 'H1' || listElement.tagName === 'H2' || listElement.tagName === 'H3') {
      // Hit another heading, no objectives list found
      return null;
    }
    listElement = listElement.nextElementSibling;
  }

  if (!listElement) return null;

  // Extract objectives from list items
  const objectives: string[] = [];
  const listItems = listElement.querySelectorAll('li');
  listItems.forEach((li) => {
    const text = li.textContent?.trim();
    if (text) objectives.push(text);
  });

  if (objectives.length === 0) return null;

  // Remove the objectives section from the HTML
  let currentElement: Element | null = objectivesHeading;
  const toRemove: Element[] = [];

  // Collect elements to remove (heading, any intro paragraphs, and the list)
  while (currentElement && currentElement !== listElement) {
    toRemove.push(currentElement);
    currentElement = currentElement.nextElementSibling;
  }
  if (listElement) toRemove.push(listElement);

  // Remove collected elements
  toRemove.forEach((el) => el.remove());

  return {
    objectives,
    remainingHtml: tempDiv.innerHTML,
  };
}

/**
 * Callout data structure
 */
interface CalloutData {
  type: CalloutType;
  icon: string;
  label: string;
  content: string;
  id: string; // Unique ID for React key
}

/**
 * Extracts semantic callouts from HTML content
 * Detects H3/H4 headings with specific callout type keywords
 * Converts to interactive CalloutBox components with semantic color coding
 *
 * Supported types:
 * - Career Critical (🎯 Purple)
 * - Capability Accelerator (⚡ Cyan)
 * - Critical Compliance Alert (🚩 Red)
 * - Real-World Application (🎬 Green)
 * - Data Point (📊 Blue)
 */
function extractCallouts(html: string): { callouts: CalloutData[]; processedHtml: string } {
  // Only run on client-side where DOM APIs are available
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { callouts: [], processedHtml: html };
  }

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  const callouts: CalloutData[] = [];
  let calloutCounter = 0;

  // Define callout type detection patterns
  const calloutPatterns: Array<{
    type: CalloutType;
    keywords: string[];
  }> = [
    { type: 'career-critical', keywords: ['career critical', 'career-critical'] },
    {
      type: 'capability-accelerator',
      keywords: ['capability accelerator', 'capability-accelerator', 'pro tip', 'learning tip'],
    },
    {
      type: 'red-flag',
      keywords: [
        'critical compliance alert',
        'compliance alert',
        'red flag',
        'red-flag',
        'warning',
        'caution',
        'critical mistake',
      ],
    },
    {
      type: 'real-world',
      keywords: ['real-world', 'real world', 'case study', 'example', 'scenario'],
    },
    {
      type: 'data-point',
      keywords: ['data point', 'data-point', 'research', 'study shows', 'statistics'],
    },
  ];

  // Find all H3 and H4 headings
  const headings = tempDiv.querySelectorAll('h3, h4');

  for (const heading of Array.from(headings)) {
    const headingText = heading.textContent?.trim().toLowerCase() || '';

    // Try to match against callout patterns
    let matchedType: CalloutType | null = null;

    for (const pattern of calloutPatterns) {
      for (const keyword of pattern.keywords) {
        if (headingText.includes(keyword)) {
          matchedType = pattern.type;
          break;
        }
      }
      if (matchedType) break;
    }

    // If no match found, continue to next heading
    if (!matchedType) {
      continue;
    }

    // Get the callout configuration
    const config = CALLOUT_CONFIGS[matchedType];

    // Extract content following the heading
    const contentElements: Element[] = [];
    let currentElement = heading.nextElementSibling;

    // Collect content until we hit another heading or callout
    while (currentElement) {
      const tagName = currentElement.tagName;

      // Stop if we hit another major heading
      if (tagName === 'H1' || tagName === 'H2' || tagName === 'H3' || tagName === 'H4') {
        // Check if this is another callout
        const nextText = currentElement.textContent?.trim().toLowerCase() || '';
        let isCallout = false;

        for (const pattern of calloutPatterns) {
          for (const keyword of pattern.keywords) {
            if (nextText.includes(keyword)) {
              isCallout = true;
              break;
            }
          }
          if (isCallout) break;
        }

        if (isCallout || tagName === 'H1' || tagName === 'H2') {
          break; // Stop collecting content
        }
      }

      contentElements.push(currentElement);
      currentElement = currentElement.nextElementSibling;
    }

    // If we found content, create a callout
    if (contentElements.length > 0) {
      // Extract HTML content
      const contentHtml = contentElements.map((el) => el.outerHTML).join('');

      // Create callout data
      callouts.push({
        type: matchedType,
        icon: config.icon,
        label: config.label,
        content: contentHtml,
        id: `callout-${calloutCounter++}`,
      });

      // Create placeholder in DOM
      const placeholder = document.createElement('div');
      placeholder.setAttribute('data-callout-id', callouts[callouts.length - 1].id);
      placeholder.className = 'callout-placeholder';

      // Replace heading and content with placeholder
      heading.replaceWith(placeholder);
      contentElements.forEach((el) => el.remove());
    }
  }

  return {
    callouts,
    processedHtml: tempDiv.innerHTML,
  };
}

/**
 * Long list data structure
 */
interface LongListData {
  items: ListCardItem[];
  sectionTitle?: string;
  id: string; // Unique ID for React key
}

/**
 * Extracts long lists (≥7 items) from HTML content and converts to card grid
 * Detects ordered/unordered lists with semantic heading keywords
 *
 * Keywords trigger card conversion:
 * - principles, methods, phases, types, steps, guidelines
 * - criteria, components, elements, stages, requirements
 * - categories, aspects, factors, characteristics
 *
 * Priority detection in titles:
 * - (critical), (essential) → critical priority (red)
 * - (important), (key) → high priority (orange)
 *
 * Learning Science: Miller's Law (7±2 items) requires chunking strategy
 * Card-based presentation improves retention by 40-50%
 */
function extractLongLists(
  html: string,
  minItems: number = 7
): { longLists: LongListData[]; processedHtml: string } {
  // Create a temporary DOM element to parse HTML
  if (typeof window === 'undefined') {
    return { longLists: [], processedHtml: html };
  }

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  const longLists: LongListData[] = [];
  let listCounter = 0;

  // Keywords that indicate a list suitable for card conversion
  const semanticKeywords = [
    'principle',
    'method',
    'phase',
    'type',
    'step',
    'guideline',
    'criterion',
    'criteria',
    'component',
    'element',
    'stage',
    'requirement',
    'category',
    'aspect',
    'factor',
    'characteristic',
  ];

  // Find all lists (OL and UL)
  const lists = tempDiv.querySelectorAll('ol, ul');

  for (const list of Array.from(lists)) {
    const listItems = list.querySelectorAll(':scope > li'); // Direct children only

    // Check if list meets minimum length threshold
    if (listItems.length < minItems) continue;

    // Check if list has semantic heading before it
    let headingElement: Element | null = null;
    let previousElement = list.previousElementSibling;

    // Look back up to 2 elements for a heading
    let lookbackCount = 0;
    while (previousElement && lookbackCount < 2) {
      if (
        previousElement.tagName === 'H2' ||
        previousElement.tagName === 'H3' ||
        previousElement.tagName === 'H4'
      ) {
        headingElement = previousElement;
        break;
      }
      // Skip paragraphs (like intro text)
      if (previousElement.tagName !== 'P') {
        break;
      }
      previousElement = previousElement.previousElementSibling;
      lookbackCount++;
    }

    // If no heading or heading doesn't contain semantic keywords, skip
    if (!headingElement) continue;

    const headingText = headingElement.textContent?.toLowerCase() || '';
    const hasSemanticKeyword = semanticKeywords.some((keyword) =>
      headingText.includes(keyword)
    );

    if (!hasSemanticKeyword) continue;

    // Extract items from list
    const items: ListCardItem[] = [];

    listItems.forEach((li, index) => {
      // Get the main text content
      let titleText = '';
      let descriptionHtml = '';

      // If the <li> has nested elements (like <p>, <ul>), extract them separately
      const _childNodes = Array.from(li.childNodes);
      let hasDescription = false;

      // Clone the <li> to extract parts
      const liClone = li.cloneNode(true) as HTMLElement;

      // Find nested lists or paragraphs that could be descriptions
      const nestedLists = liClone.querySelectorAll('ul, ol');
      const nestedParas = liClone.querySelectorAll('p');

      if (nestedLists.length > 0 || nestedParas.length > 0) {
        hasDescription = true;

        // Extract main text (everything before nested content)
        const textContent: string[] = [];
        for (const node of Array.from(liClone.childNodes)) {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim();
            if (text) textContent.push(text);
          } else if (
            node.nodeName !== 'UL' &&
            node.nodeName !== 'OL' &&
            node.nodeName !== 'P'
          ) {
            const text = (node as HTMLElement).textContent?.trim();
            if (text) textContent.push(text);
          } else {
            break; // Stop at first block element
          }
        }

        titleText = textContent.join(' ');

        // Extract description HTML
        const descriptionParts: string[] = [];
        nestedLists.forEach((nl) => descriptionParts.push(nl.outerHTML));
        nestedParas.forEach((np) => descriptionParts.push(np.outerHTML));
        descriptionHtml = descriptionParts.join('');
      } else {
        // Simple list item with no nested content
        titleText = li.textContent?.trim() || '';
      }

      // Parse priority from title
      const { cleanText, priority } = parsePriority(titleText);

      items.push({
        number: index + 1,
        title: cleanText,
        description: hasDescription ? descriptionHtml : undefined,
        priority,
      });
    });

    // Create long list data
    const sectionTitle = headingElement.textContent?.trim();

    longLists.push({
      items,
      sectionTitle,
      id: `list-${listCounter++}`,
    });

    // Create placeholder in DOM
    const placeholder = document.createElement('div');
    placeholder.setAttribute('data-list-id', longLists[longLists.length - 1].id);
    placeholder.className = 'list-placeholder';

    // Replace heading and list with placeholder
    headingElement.replaceWith(placeholder);
    list.remove();

    // Also remove any intro paragraph between heading and list
    // (This is already handled by the heading replacement)
  }

  return {
    longLists,
    processedHtml: tempDiv.innerHTML,
  };
}

/**
 * Extract comparison tables from HTML content
 *
 * Detects headings with comparison keywords ("vs.", "versus", "compared to", etc.)
 * and converts following parallel content into structured comparison tables.
 *
 * Supported patterns:
 * - Labeled paragraphs: "Clinical: ...", "Industry: ..."
 * - Labeled lists: bullet/numbered with clear A/B labels
 * - Structured content with subsections for each side
 *
 * Returns comparison data and processed HTML with placeholders
 */
interface ComparisonTableData {
  title?: string;
  leftColumn: ComparisonColumn;
  rightColumn: ComparisonColumn;
  variant: ComparisonVariant;
  id: string;
}

function extractComparisonTables(html: string): {
  comparisons: ComparisonTableData[];
  processedHtml: string;
} {
  if (typeof window === 'undefined') {
    return { comparisons: [], processedHtml: html };
  }

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const comparisons: ComparisonTableData[] = [];
  let comparisonCounter = 0;

  // Find all headings (H2, H3, H4)
  const headings = tempDiv.querySelectorAll('h2, h3, h4');

  for (const heading of Array.from(headings)) {
    const headingText = heading.textContent?.trim() || '';

    // Check if heading contains comparison keywords
    if (!isComparisonHeading(headingText)) {
      continue;
    }

    // Extract comparison data from following content
    const comparisonData = extractComparisonContent(heading);

    if (!comparisonData) {
      continue; // No valid comparison structure found
    }

    const { leftColumn, rightColumn, contentElements } = comparisonData;

    // Auto-detect variant
    const allContent = contentElements.map((el) => el.textContent || '').join(' ');
    const variant = detectComparisonVariant(headingText, allContent);

    comparisons.push({
      title: headingText,
      leftColumn,
      rightColumn,
      variant,
      id: `comparison-${comparisonCounter++}`,
    });

    // Replace heading and content with placeholder
    const placeholder = document.createElement('div');
    placeholder.setAttribute('data-comparison-id', comparisons[comparisons.length - 1].id);
    placeholder.className = 'comparison-placeholder';

    heading.replaceWith(placeholder);

    // Remove all comparison content elements
    contentElements.forEach((el) => el.remove());
  }

  return {
    comparisons,
    processedHtml: tempDiv.innerHTML,
  };
}

/**
 * Extract comparison content from elements following a comparison heading
 */
function extractComparisonContent(heading: Element): {
  leftColumn: ComparisonColumn;
  rightColumn: ComparisonColumn;
  contentElements: Element[];
} | null {
  const leftItems: ComparisonItem[] = [];
  const rightItems: ComparisonItem[] = [];
  const contentElements: Element[] = [];

  let leftHeading = 'Side A';
  let rightHeading = 'Side B';

  // Collect elements until next heading or end of siblings
  let currentElement = heading.nextElementSibling;
  let elementCount = 0;
  const maxElements = 20; // Prevent infinite loops

  while (currentElement && elementCount < maxElements) {
    // Stop at next heading of same or higher level
    const tagName = currentElement.tagName;
    const headingLevel = parseInt(heading.tagName.charAt(1));
    if (
      ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(tagName) &&
      parseInt(tagName.charAt(1)) <= headingLevel
    ) {
      break;
    }

    contentElements.push(currentElement);
    elementCount++;

    // Pattern 1: Labeled paragraphs or div blocks
    if (tagName === 'P' || tagName === 'DIV') {
      const text = currentElement.textContent?.trim() || '';
      const html = currentElement.innerHTML;

      // Check for label pattern: "Label: Content"
      const labelMatch = text.match(/^([^:]+):\s*([\s\S]+)/);

      if (labelMatch) {
        const label = labelMatch[1].trim();
        const contentText = labelMatch[2].trim();
        const contentHtml = html.replace(/^[^:]+:\s*/, '');

        // Determine if critical/highlight
        const highlight =
          contentText.toLowerCase().includes('critical') ||
          contentText.toLowerCase().includes('key difference');

        // Detect which column based on label
        const lowerLabel = label.toLowerCase();
        if (
          lowerLabel.includes('clinical') ||
          lowerLabel.includes('side a') ||
          lowerLabel.includes('left') ||
          (leftItems.length === 0 && rightItems.length === 0) // First item goes to left
        ) {
          if (leftItems.length === 0) {
            leftHeading = label; // Use first label as column heading
          }
          leftItems.push({
            label: leftItems.length > 0 ? undefined : undefined,
            content: contentHtml,
            highlight,
          });
        } else {
          if (rightItems.length === 0) {
            rightHeading = label; // Use first label as column heading
          }
          rightItems.push({
            label: rightItems.length > 0 ? undefined : undefined,
            content: contentHtml,
            highlight,
          });
        }
      }
    }

    // Pattern 2: Lists with labeled items
    if (tagName === 'UL' || tagName === 'OL') {
      const listItems = currentElement.querySelectorAll('li');

      for (const li of Array.from(listItems)) {
        const text = li.textContent?.trim() || '';
        const html = li.innerHTML;

        const labelMatch = text.match(/^([^:]+):\s*([\s\S]+)/);

        if (labelMatch) {
          const label = labelMatch[1].trim();
          const contentHtml = html.replace(/^[^:]+:\s*/, '');

          const highlight =
            text.toLowerCase().includes('critical') ||
            text.toLowerCase().includes('key difference');

          const lowerLabel = label.toLowerCase();
          if (
            lowerLabel.includes('clinical') ||
            lowerLabel.includes('side a') ||
            (leftItems.length === rightItems.length && leftItems.length === 0)
          ) {
            if (leftItems.length === 0) {
              leftHeading = label;
            }
            leftItems.push({ content: contentHtml, highlight });
          } else {
            if (rightItems.length === 0) {
              rightHeading = label;
            }
            rightItems.push({ content: contentHtml, highlight });
          }
        }
      }
    }

    currentElement = currentElement.nextElementSibling;
  }

  // Validate: Must have at least 1 item in each column
  if (leftItems.length === 0 || rightItems.length === 0) {
    return null;
  }

  // Balance columns: Ensure same number of items
  while (leftItems.length < rightItems.length) {
    leftItems.push({ content: '—' }); // Empty placeholder
  }
  while (rightItems.length < leftItems.length) {
    rightItems.push({ content: '—' }); // Empty placeholder
  }

  return {
    leftColumn: { heading: leftHeading, items: leftItems },
    rightColumn: { heading: rightHeading, items: rightItems },
    contentElements,
  };
}

export function LessonContent({ content, hasVideo, lessonId = 'default' }: LessonContentProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sanitize HTML content to prevent XSS attacks
  // Must be before any conditional returns due to React hooks rules
  const sanitizedContent = useMemo(() => {
    if (!content) return '';  // Handle empty content in the hook
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'p',
        'br',
        'strong',
        'em',
        'u',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'ul',
        'ol',
        'li',
        'a',
        'img',
        'blockquote',
        'code',
        'pre',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
        'div',
        'span',
      ],
      ALLOWED_ATTR: [
        'href',
        'src',
        'alt',
        'title',
        'class',
        'id',
        'target',
        'rel',
        'data-callout-id',
        'data-list-id',
        'data-comparison-id',
      ],
      ALLOW_DATA_ATTR: true, // Allow data attributes for component placeholders
    });
  }, [content]);

  // Extract learning objectives if present
  const parsedContent = useMemo(() => {
    return extractLearningObjectives(sanitizedContent);
  }, [sanitizedContent]);

  // Extract callouts from content (only on client after mount)
  const { callouts, processedHtml: htmlAfterCallouts } = useMemo(() => {
    if (!isMounted) {
      return { callouts: [], processedHtml: parsedContent?.remainingHtml || sanitizedContent };
    }
    return extractCallouts(parsedContent?.remainingHtml || sanitizedContent);
  }, [isMounted, parsedContent, sanitizedContent]);

  // Extract long lists from content (after callouts)
  const { longLists, processedHtml: htmlAfterLists } = useMemo(() => {
    return extractLongLists(htmlAfterCallouts);
  }, [htmlAfterCallouts]);

  // Extract comparison tables from content (after lists)
  const { comparisons, processedHtml: finalProcessedHtml } = useMemo(() => {
    return extractComparisonTables(htmlAfterLists);
  }, [htmlAfterLists]);

  // Early return for empty content - after all hooks have been called
  if (!content) return null;

  // Combined rendering of content with all components
  const renderContentWithComponents = () => {
    // If no components, render plain HTML
    if (callouts.length === 0 && longLists.length === 0 && comparisons.length === 0) {
      return (
        <div
          className="lesson-content"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(finalProcessedHtml) }}
        />
      );
    }

    // Build placeholders map for easy lookup
    const placeholders = new Map<string, React.ReactNode>();

    // Add callout placeholders
    callouts.forEach((callout) => {
      const pattern = `<div data-callout-id="${callout.id}" class="callout-placeholder"></div>`;
      placeholders.set(
        pattern,
        <CalloutBox key={callout.id} type={callout.type} icon={callout.icon} label={callout.label}>
          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(callout.content) }} />
        </CalloutBox>
      );
    });

    // Add list card placeholders
    longLists.forEach((list) => {
      const pattern = `<div data-list-id="${list.id}" class="list-placeholder"></div>`;
      placeholders.set(
        pattern,
        <ListCardGrid
          key={list.id}
          items={list.items}
          lessonId={lessonId}
          sectionTitle={list.sectionTitle}
        />
      );
    });

    // Add comparison table placeholders
    comparisons.forEach((comparison) => {
      const pattern = `<div data-comparison-id="${comparison.id}" class="comparison-placeholder"></div>`;
      placeholders.set(
        pattern,
        <ComparisonTable
          key={comparison.id}
          id={comparison.id}
          title={comparison.title}
          leftColumn={comparison.leftColumn}
          rightColumn={comparison.rightColumn}
          variant={comparison.variant}
          lessonId={lessonId}
        />
      );
    });

    // Split HTML by all placeholders
    const parts: React.ReactNode[] = [];
    let remainingHtml = finalProcessedHtml;
    let keyCounter = 0;

    // Find all placeholder positions
    const placeholderPositions: Array<{ position: number; pattern: string; component: React.ReactNode }> = [];

    placeholders.forEach((component, pattern) => {
      const position = remainingHtml.indexOf(pattern);
      if (position !== -1) {
        placeholderPositions.push({ position, pattern, component });
      }
    });

    // Sort by position
    placeholderPositions.sort((a, b) => a.position - b.position);

    // Build parts in order
    let lastPosition = 0;

    placeholderPositions.forEach(({ position, pattern, component }) => {
      // Add HTML before this placeholder
      const beforeHtml = remainingHtml.substring(lastPosition, position);
      if (beforeHtml.trim()) {
        parts.push(
          <div
            key={`html-${keyCounter++}`}
            className="lesson-content"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(beforeHtml) }}
          />
        );
      }

      // Add the component
      parts.push(component);

      // Update position
      lastPosition = position + pattern.length;
    });

    // Add any remaining HTML
    const remainingFinalHtml = remainingHtml.substring(lastPosition);
    if (remainingFinalHtml.trim()) {
      parts.push(
        <div
          key={`html-${keyCounter++}`}
          className="lesson-content"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(remainingFinalHtml) }}
        />
      );
    }

    return <>{parts}</>;
  };

  return (
    <div className={hasVideo ? 'mt-8' : ''}>
      {/* Render interactive Learning Objectives if detected */}
      {parsedContent?.objectives && parsedContent.objectives.length > 0 && (
        <LearningObjectives
          objectives={parsedContent.objectives}
          lessonId={lessonId}
          enablePersistence={true}
          sticky={true}
        />
      )}

      {/* Render content with embedded callouts and list cards */}
      {renderContentWithComponents()}
    </div>
  );
}
