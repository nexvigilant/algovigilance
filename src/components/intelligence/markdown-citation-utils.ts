// ============================================================================
// Markdown Citation Parsing Utilities
// Extracted from enhanced-markdown.tsx for modularity
// ============================================================================

/** Segment type for parsed citation text */
export interface CitationSegment {
  type: 'text' | 'citation';
  content: string;
  citations?: number[];
}

// ============================================================================
// Module State
// ============================================================================

/** Track scroll position for back-navigation from references */
export let lastCitationScrollPosition: number | null = null;

/** Update the last citation scroll position */
export function setLastCitationScrollPosition(position: number | null): void {
  lastCitationScrollPosition = position;
}

// ============================================================================
// Citation Detection Functions
// ============================================================================

/** Check if text contains citation markers like [1], [2,3], or [1-3] */
export function hasCitations(text: string): boolean {
  return /\[\d+(?:[-,]\d+)*\]/.test(text);
}

/** Parse text into segments of plain text and citations */
export function parseTextWithCitations(text: string): CitationSegment[] {
  const segments: CitationSegment[] = [];
  // Match citations like [1], [1,2], [1-3], [1,2,3-5]
  const regex = /\[(\d+(?:[-,]\d+)*)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the citation
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, match.index)
      });
    }

    // Parse citation numbers (handles ranges like 1-3 and lists like 1,2,3)
    const citationStr = match[1];
    const citations: number[] = [];

    for (const part of citationStr.split(',')) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        for (let i = start; i <= end; i++) {
          citations.push(i);
        }
      } else {
        citations.push(Number(part));
      }
    }

    segments.push({
      type: 'citation',
      content: match[0],
      citations
    });

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex)
    });
  }

  return segments;
}
