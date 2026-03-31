/**
 * Reference Deduplication Utility
 *
 * Merge and deduplicate references from multiple sources (Deep Research outputs,
 * literature reviews, etc.) into a unified bibliography.
 *
 * @example
 * ```ts
 * import { mergeReferenceSets, findDuplicates } from '@/lib/deep-research/reference-dedup';
 *
 * // Merge from multiple sources
 * const unified = mergeReferenceSets([
 *   { source: 'glp1-review.md', refs: refs1 },
 *   { source: 'cv-safety.md', refs: refs2 },
 * ]);
 *
 * // Find potential duplicates for manual review
 * const dupes = findDuplicates(allRefs, { threshold: 0.8 });
 * ```
 */

import type { ParsedReference } from './reference-parser';

// =============================================================================
// Types
// =============================================================================

export interface ReferenceSource {
  /** Source identifier (filename, URL, etc.) */
  source: string;
  /** References from this source */
  refs: ParsedReference[];
}

export interface MergedReference extends ParsedReference {
  /** Sources this reference appeared in */
  sources: string[];
  /** Original references that were merged */
  originals: ParsedReference[];
  /** Merge confidence (how confident are we these are the same?) */
  mergeConfidence: number;
}

export interface DuplicateGroup {
  /** Primary reference (highest confidence) */
  primary: ParsedReference;
  /** Potential duplicates */
  duplicates: ParsedReference[];
  /** Similarity scores */
  scores: number[];
  /** Suggested action */
  action: 'merge' | 'review' | 'keep_separate';
}

export interface MergeResult {
  /** Deduplicated references */
  merged: MergedReference[];
  /** Statistics */
  stats: {
    totalInput: number;
    uniqueOutput: number;
    duplicatesFound: number;
    mergesByMethod: {
      doi: number;
      pmid: number;
      title: number;
      fuzzy: number;
    };
  };
  /** References that couldn't be confidently merged */
  needsReview: DuplicateGroup[];
}

export interface DeduplicationOptions {
  /** Minimum similarity threshold for fuzzy matching (0-1) */
  threshold?: number;
  /** Prefer DOI matching over fuzzy title matching */
  preferDOI?: boolean;
  /** Include references from all sources even if duplicate */
  keepAllSources?: boolean;
  /** Maximum Levenshtein distance for title matching */
  maxTitleDistance?: number;
}

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Merge multiple reference sets into a deduplicated bibliography
 */
export function mergeReferenceSets(
  sources: ReferenceSource[],
  options: DeduplicationOptions = {}
): MergeResult {
  const { threshold = 0.75, preferDOI = true } = options;

  // Collect all references with source tracking
  const allRefs: Array<{ ref: ParsedReference; source: string }> = [];
  for (const { source, refs } of sources) {
    for (const ref of refs) {
      allRefs.push({ ref, source });
    }
  }

  const totalInput = allRefs.length;
  const merged: MergedReference[] = [];
  const used = new Set<number>();
  const needsReview: DuplicateGroup[] = [];

  const stats = {
    totalInput,
    uniqueOutput: 0,
    duplicatesFound: 0,
    mergesByMethod: { doi: 0, pmid: 0, title: 0, fuzzy: 0 },
  };

  // Group by DOI first (most reliable)
  if (preferDOI) {
    const doiGroups = groupByIdentifier(allRefs, 'doi');
    for (const [_doi, indices] of doiGroups) {
      if (indices.length > 1) {
        const mergedRef = mergeGroup(allRefs, indices);
        merged.push(mergedRef);
        stats.mergesByMethod.doi += indices.length - 1;
        stats.duplicatesFound += indices.length - 1;
        indices.forEach((i) => used.add(i));
      }
    }
  }

  // Group by PMID
  const pmidGroups = groupByIdentifier(
    allRefs.filter((_, i) => !used.has(i)),
    'pmid'
  );
  for (const [_pmid, indices] of pmidGroups) {
    if (indices.length > 1) {
      const actualIndices = indices.map((i) =>
        allRefs.findIndex((r) => r.ref === allRefs.filter((_, j) => !used.has(j))[i].ref)
      );
      const mergedRef = mergeGroup(allRefs, actualIndices);
      merged.push(mergedRef);
      stats.mergesByMethod.pmid += indices.length - 1;
      stats.duplicatesFound += indices.length - 1;
      actualIndices.forEach((i) => used.add(i));
    }
  }

  // Fuzzy title matching for remaining
  const remaining = allRefs
    .map((r, i) => ({ ...r, index: i }))
    .filter((_, i) => !used.has(i));

  for (let i = 0; i < remaining.length; i++) {
    if (used.has(remaining[i].index)) continue;

    const group = [remaining[i].index];
    const scores: number[] = [];

    for (let j = i + 1; j < remaining.length; j++) {
      if (used.has(remaining[j].index)) continue;

      const similarity = calculateSimilarity(
        remaining[i].ref,
        remaining[j].ref
      );

      if (similarity >= threshold) {
        group.push(remaining[j].index);
        scores.push(similarity);
      } else if (similarity >= threshold * 0.8) {
        // Close but not confident - add to review
        needsReview.push({
          primary: remaining[i].ref,
          duplicates: [remaining[j].ref],
          scores: [similarity],
          action: 'review',
        });
      }
    }

    if (group.length > 1) {
      const mergedRef = mergeGroup(allRefs, group);
      merged.push(mergedRef);
      stats.mergesByMethod.fuzzy += group.length - 1;
      stats.duplicatesFound += group.length - 1;
      group.forEach((idx) => used.add(idx));
    }
  }

  // Add remaining non-duplicates
  for (let i = 0; i < allRefs.length; i++) {
    if (!used.has(i)) {
      merged.push({
        ...allRefs[i].ref,
        sources: [allRefs[i].source],
        originals: [allRefs[i].ref],
        mergeConfidence: 1.0,
      });
    }
  }

  stats.uniqueOutput = merged.length;

  return { merged, stats, needsReview };
}

/**
 * Find potential duplicates within a single reference set
 */
export function findDuplicates(
  refs: ParsedReference[],
  options: DeduplicationOptions = {}
): DuplicateGroup[] {
  const { threshold = 0.75 } = options;
  const groups: DuplicateGroup[] = [];
  const used = new Set<number>();

  for (let i = 0; i < refs.length; i++) {
    if (used.has(i)) continue;

    const duplicates: ParsedReference[] = [];
    const scores: number[] = [];

    for (let j = i + 1; j < refs.length; j++) {
      if (used.has(j)) continue;

      const similarity = calculateSimilarity(refs[i], refs[j]);

      if (similarity >= threshold) {
        duplicates.push(refs[j]);
        scores.push(similarity);
        used.add(j);
      }
    }

    if (duplicates.length > 0) {
      used.add(i);
      groups.push({
        primary: refs[i],
        duplicates,
        scores,
        action: scores.every((s) => s >= 0.9) ? 'merge' : 'review',
      });
    }
  }

  return groups;
}

/**
 * Merge a single duplicate group into one reference
 */
export function mergeDuplicateGroup(group: DuplicateGroup): MergedReference {
  const allRefs = [group.primary, ...group.duplicates];

  // Pick the reference with the most complete data
  const sorted = allRefs.sort((a, b) => {
    const scoreA = calculateCompletenessScore(a);
    const scoreB = calculateCompletenessScore(b);
    return scoreB - scoreA;
  });

  const primary = sorted[0];

  // Merge fields from all references
  const structured = { ...primary.structured };

  for (const ref of sorted.slice(1)) {
    // Fill in missing fields from other references
    if (!structured.doi && ref.structured.doi) {
      structured.doi = ref.structured.doi;
    }
    if (!structured.pmid && ref.structured.pmid) {
      structured.pmid = ref.structured.pmid;
    }
    if (!structured.url && ref.structured.url) {
      structured.url = ref.structured.url;
    }
    if (structured.authors.length === 0 && ref.structured.authors.length > 0) {
      structured.authors = ref.structured.authors;
    }
  }

  return {
    ...primary,
    structured,
    sources: [], // Would need source tracking
    originals: allRefs,
    mergeConfidence: group.scores.length > 0
      ? group.scores.reduce((a, b) => a + b, 0) / group.scores.length
      : 1.0,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Group references by a specific identifier (DOI, PMID)
 */
function groupByIdentifier(
  refs: Array<{ ref: ParsedReference; source: string }>,
  field: 'doi' | 'pmid'
): Map<string, number[]> {
  const groups = new Map<string, number[]>();

  refs.forEach(({ ref }, index) => {
    const value = ref.structured[field];
    if (value) {
      const normalized = value.toLowerCase().trim();
      if (!groups.has(normalized)) {
        groups.set(normalized, []);
      }
      groups.get(normalized)?.push(index);
    }
  });

  return groups;
}

/**
 * Merge a group of references into one
 */
function mergeGroup(
  allRefs: Array<{ ref: ParsedReference; source: string }>,
  indices: number[]
): MergedReference {
  const refs = indices.map((i) => allRefs[i]);

  // Sort by completeness
  const sorted = refs.sort((a, b) => {
    return calculateCompletenessScore(b.ref) - calculateCompletenessScore(a.ref);
  });

  const primary = sorted[0].ref;
  const sources = [...new Set(refs.map((r) => r.source))];

  // Merge structured data
  const structured = { ...primary.structured };
  for (const { ref } of sorted.slice(1)) {
    if (!structured.doi && ref.structured.doi) structured.doi = ref.structured.doi;
    if (!structured.pmid && ref.structured.pmid) structured.pmid = ref.structured.pmid;
    if (!structured.url && ref.structured.url) structured.url = ref.structured.url;
    if (!structured.title && ref.structured.title) structured.title = ref.structured.title;
    if (!structured.year && ref.structured.year) structured.year = ref.structured.year;
    if (structured.authors.length === 0 && ref.structured.authors.length > 0) {
      structured.authors = ref.structured.authors;
    }
  }

  return {
    id: primary.id,
    raw: primary.raw,
    structured,
    confidence: Math.max(...refs.map((r) => r.ref.confidence)),
    format: primary.format,
    position: primary.position,
    sources,
    originals: refs.map((r) => r.ref),
    mergeConfidence: 1.0, // High confidence for DOI/PMID matches
  };
}

/**
 * Calculate similarity between two references (0-1)
 */
function calculateSimilarity(a: ParsedReference, b: ParsedReference): number {
  let score = 0;
  let weights = 0;

  // DOI match (highest weight)
  if (a.structured.doi && b.structured.doi) {
    const match = a.structured.doi.toLowerCase() === b.structured.doi.toLowerCase();
    score += match ? 1.0 : 0;
    weights += 1.0;
    if (match) return 1.0; // Exact DOI = definite match
  }

  // PMID match
  if (a.structured.pmid && b.structured.pmid) {
    const match = a.structured.pmid === b.structured.pmid;
    score += match ? 1.0 : 0;
    weights += 1.0;
    if (match) return 1.0; // Exact PMID = definite match
  }

  // Title similarity (Jaccard on words)
  if (a.structured.title && b.structured.title) {
    const titleSim = jaccardSimilarity(
      normalizeTitle(a.structured.title),
      normalizeTitle(b.structured.title)
    );
    score += titleSim * 0.6;
    weights += 0.6;
  }

  // Year match
  if (a.structured.year && b.structured.year) {
    const yearMatch = a.structured.year === b.structured.year;
    score += yearMatch ? 0.2 : 0;
    weights += 0.2;
  }

  // Author overlap
  if (a.structured.authors.length > 0 && b.structured.authors.length > 0) {
    const authorSim = authorSimilarity(a.structured.authors, b.structured.authors);
    score += authorSim * 0.3;
    weights += 0.3;
  }

  return weights > 0 ? score / weights : 0;
}

/**
 * Calculate completeness score for a reference
 */
function calculateCompletenessScore(ref: ParsedReference): number {
  let score = 0;

  if (ref.structured.title) score += 2;
  if (ref.structured.authors.length > 0) score += 2;
  if (ref.structured.year) score += 1;
  if (ref.structured.doi) score += 3;
  if (ref.structured.pmid) score += 2;
  if (ref.structured.journal) score += 1;
  if (ref.structured.volume) score += 0.5;
  if (ref.structured.pages) score += 0.5;
  if (ref.structured.url) score += 1;

  return score;
}

/**
 * Normalize title for comparison
 */
function normalizeTitle(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2); // Remove short words
}

/**
 * Jaccard similarity between word sets
 */
function jaccardSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);

  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Compare author lists
 */
function authorSimilarity(a: string[], b: string[]): number {
  // Normalize to last names
  const normalize = (authors: string[]) =>
    authors.map((name) => {
      const parts = name.split(/[,\s]+/);
      return parts[0]?.toLowerCase() || '';
    });

  const lastNamesA = normalize(a);
  const lastNamesB = normalize(b);

  return jaccardSimilarity(lastNamesA, lastNamesB);
}

// =============================================================================
// Export Utilities
// =============================================================================

/**
 * Export merged references with source annotations
 */
export function toAnnotatedBibTeX(merged: MergedReference[]): string {
  const entries: string[] = [];

  for (const ref of merged) {
    const key = generateBibKey(ref);
    const sources = ref.sources.join(', ');

    let entry = `@article{${key},\n`;
    entry += `  note = {Sources: ${sources}},\n`;

    if (ref.structured.title) {
      entry += `  title = {${ref.structured.title}},\n`;
    }
    if (ref.structured.authors.length > 0) {
      entry += `  author = {${ref.structured.authors.join(' and ')}},\n`;
    }
    if (ref.structured.year) {
      entry += `  year = {${ref.structured.year}},\n`;
    }
    if (ref.structured.journal) {
      entry += `  journal = {${ref.structured.journal}},\n`;
    }
    if (ref.structured.doi) {
      entry += `  doi = {${ref.structured.doi}},\n`;
    }
    if (ref.structured.pmid) {
      entry += `  pmid = {${ref.structured.pmid}},\n`;
    }

    entry += `}\n`;
    entries.push(entry);
  }

  return entries.join('\n');
}

/**
 * Generate a BibTeX key from reference
 */
function generateBibKey(ref: ParsedReference): string {
  const author = ref.structured.authors[0]?.split(/[,\s]/)[0] || 'unknown';
  const year = ref.structured.year || 'nd';
  const titleWord =
    ref.structured.title?.split(/\s+/)[0]?.toLowerCase() || 'untitled';

  return `${author}${year}${titleWord}`.replace(/[^a-zA-Z0-9]/g, '');
}
