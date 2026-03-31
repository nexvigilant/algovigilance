/**
 * Reference Extraction Parser
 *
 * Parses citations and references from Deep Research reports into structured data.
 * Handles multiple citation formats (APA, IEEE, Vancouver, inline) and extracts
 * metadata like authors, year, title, DOI, and source.
 *
 * Priority Index: 8.0 (EORS identification)
 * - Frequency: 4 (daily research tasks)
 * - Effort: 4 (15-60 min manual extraction)
 * - Complexity: 2 (moderate tooling)
 *
 * @module deep-research/reference-parser
 */

// =============================================================================
// Types
// =============================================================================

export interface ParsedReference {
  /** Unique identifier within the extraction context */
  id: string;
  /** Original raw citation text */
  raw: string;
  /** Extracted structured fields */
  structured: {
    authors: string[];
    title: string | null;
    year: number | null;
    journal: string | null;
    volume: string | null;
    issue: string | null;
    pages: string | null;
    doi: string | null;
    pmid: string | null;
    url: string | null;
  };
  /** Confidence score for the extraction (0-1) */
  confidence: number;
  /** Detected citation format */
  format: CitationFormat;
  /** Position in source document */
  position: {
    line: number | null;
    section: string | null;
  };
}

export type CitationFormat =
  | 'apa'
  | 'ieee'
  | 'vancouver'
  | 'harvard'
  | 'chicago'
  | 'inline'
  | 'pubmed'
  | 'unknown';

export interface ExtractionResult {
  /** Successfully parsed references */
  references: ParsedReference[];
  /** Statistics about the extraction */
  stats: {
    total: number;
    parsed: number;
    failed: number;
    avgConfidence: number;
    formatDistribution: Record<CitationFormat, number>;
  };
  /** Any warnings or issues encountered */
  warnings: string[];
}

export interface ParserOptions {
  /** Minimum confidence threshold to include a reference (default: 0.3) */
  minConfidence?: number;
  /** Try to resolve DOIs to full metadata (default: false) */
  resolveDois?: boolean;
  /** Include inline citations like "[1]" or "(Smith, 2020)" */
  includeInline?: boolean;
  /** Deduplicate similar references */
  deduplicate?: boolean;
}

// =============================================================================
// Regex Patterns
// =============================================================================

const PATTERNS = {
  // DOI patterns
  doi: /\b(10\.\d{4,}\/[^\s\]"'<>]+)/gi,

  // PMID patterns
  pmid: /\bPMID:\s*(\d+)/gi,
  pmidAlt: /pubmed\/(\d+)/gi,

  // Year patterns
  year: /\b(19|20)\d{2}\b/g,
  yearParens: /\((\d{4})\)/,

  // Author patterns (various formats)
  authorLastFirst: /([A-Z][a-z]+),?\s+([A-Z]\.?\s*)+/g,
  authorEtAl: /([A-Z][a-z]+)\s+et\s+al\.?/gi,

  // URL patterns
  url: /https?:\/\/[^\s\]"'<>]+/gi,

  // Journal/volume/issue/pages
  journalCitation: /([A-Za-z\s&]+)\.\s*(\d{4});\s*(\d+)(?:\((\d+)\))?:\s*([\d-]+)/,
  volumeIssuePages: /(\d+)\s*\((\d+)\)\s*:\s*([\d-]+)/,

  // Section headers in research reports
  sectionHeader: /^#{1,3}\s+(.+)$/gm,

  // Numbered reference format
  numberedRef: /^\[(\d+)\]\s*(.+)$/gm,

  // Study blocks from Deep Research
  studyBlock: /###\s+Study\s+(\d+)[:\s]*(.+?)(?=###\s+Study|\n##|$)/gs,
};

// =============================================================================
// Core Parser Functions
// =============================================================================

/**
 * Extract references from a Deep Research report or similar text
 */
export function extractReferences(
  text: string,
  options: ParserOptions = {}
): ExtractionResult {
  const {
    minConfidence = 0.3,
    includeInline = false,
    deduplicate = true,
  } = options;

  const references: ParsedReference[] = [];
  const warnings: string[] = [];
  let refId = 0;

  // Strategy 1: Look for structured study blocks (Deep Research format)
  const studyMatches = text.matchAll(PATTERNS.studyBlock);
  for (const match of studyMatches) {
    const studyNum = match[1];
    const studyContent = match[2];

    const parsed = parseStudyBlock(studyContent, ++refId, parseInt(studyNum));
    if (parsed.confidence >= minConfidence) {
      references.push(parsed);
    }
  }

  // Strategy 2: Look for numbered references [1], [2], etc.
  const numberedMatches = text.matchAll(PATTERNS.numberedRef);
  for (const match of numberedMatches) {
    const refNum = match[1];
    const refText = match[2];

    // Skip if already captured as study block
    if (references.some((r) => r.raw.includes(refText.substring(0, 50)))) {
      continue;
    }

    const parsed = parseCitation(refText, ++refId);
    parsed.position.section = `Reference ${refNum}`;
    if (parsed.confidence >= minConfidence) {
      references.push(parsed);
    }
  }

  // Strategy 3: Look for DOIs and extract surrounding context
  const doiMatches = text.matchAll(PATTERNS.doi);
  for (const match of doiMatches) {
    const doi = match[1];

    // Skip if already captured
    if (references.some((r) => r.structured.doi === doi)) {
      continue;
    }

    // Get context around DOI (100 chars before and after)
    const start = Math.max(0, (match.index ?? 0) - 100);
    const end = Math.min(text.length, (match.index ?? 0) + doi.length + 100);
    const context = text.substring(start, end);

    const parsed = parseCitation(context, ++refId);
    parsed.structured.doi = doi;
    parsed.confidence = Math.max(parsed.confidence, 0.7); // DOI presence boosts confidence

    if (parsed.confidence >= minConfidence) {
      references.push(parsed);
    }
  }

  // Strategy 4: Include inline citations if requested
  if (includeInline) {
    const inlineRefs = extractInlineCitations(text);
    for (const inline of inlineRefs) {
      if (!references.some((r) => r.raw === inline.raw)) {
        inline.id = `ref-${++refId}`;
        if (inline.confidence >= minConfidence) {
          references.push(inline);
        }
      }
    }
  }

  // Deduplicate if requested
  const finalRefs = deduplicate
    ? deduplicateReferences(references)
    : references;

  // Calculate statistics
  const stats = calculateStats(finalRefs, text);

  return {
    references: finalRefs,
    stats,
    warnings,
  };
}

/**
 * Parse a Deep Research study block into a reference
 */
function parseStudyBlock(
  content: string,
  id: number,
  studyNum: number
): ParsedReference {
  const lines = content.trim().split('\n');
  const structured: ParsedReference['structured'] = {
    authors: [],
    title: null,
    year: null,
    journal: null,
    volume: null,
    issue: null,
    pages: null,
    doi: null,
    pmid: null,
    url: null,
  };

  let confidence = 0.5; // Base confidence for structured block

  for (const line of lines) {
    const trimmed = line.trim();

    // Look for key-value patterns
    if (trimmed.startsWith('**Authors:**') || trimmed.startsWith('Authors:')) {
      const authorText = trimmed.replace(/\*?\*?Authors:\*?\*?\s*/i, '');
      structured.authors = parseAuthors(authorText);
      confidence += 0.1;
    } else if (trimmed.startsWith('**Title:**') || trimmed.startsWith('Title:')) {
      structured.title = trimmed.replace(/\*?\*?Title:\*?\*?\s*/i, '').trim();
      confidence += 0.1;
    } else if (trimmed.startsWith('**Year:**') || trimmed.startsWith('Year:')) {
      const yearMatch = trimmed.match(/(\d{4})/);
      if (yearMatch) {
        structured.year = parseInt(yearMatch[1]);
        confidence += 0.1;
      }
    } else if (trimmed.startsWith('**Journal:**') || trimmed.startsWith('Journal:')) {
      structured.journal = trimmed.replace(/\*?\*?Journal:\*?\*?\s*/i, '').trim();
      confidence += 0.05;
    } else if (trimmed.startsWith('**DOI:**') || trimmed.startsWith('DOI:')) {
      const doiMatch = trimmed.match(PATTERNS.doi);
      if (doiMatch) {
        structured.doi = doiMatch[1];
        confidence += 0.15;
      }
    } else if (trimmed.startsWith('**PMID:**') || trimmed.startsWith('PMID:')) {
      const pmidMatch = trimmed.match(/(\d+)/);
      if (pmidMatch) {
        structured.pmid = pmidMatch[1];
        confidence += 0.1;
      }
    }

    // Also check for inline DOI/PMID/URL
    const doiInline = trimmed.match(PATTERNS.doi);
    if (doiInline && !structured.doi) {
      structured.doi = doiInline[1];
      confidence += 0.1;
    }

    const urlInline = trimmed.match(PATTERNS.url);
    if (urlInline && !structured.url) {
      structured.url = urlInline[0];
    }
  }

  // If no title found, use first meaningful line
  if (!structured.title && lines.length > 0) {
    const firstLine = lines[0].replace(/^\*+|\*+$/g, '').trim();
    if (firstLine.length > 10 && !firstLine.includes(':')) {
      structured.title = firstLine;
    }
  }

  // Extract year from content if not found
  if (!structured.year) {
    const yearMatch = content.match(PATTERNS.yearParens);
    if (yearMatch) {
      structured.year = parseInt(yearMatch[1]);
    }
  }

  return {
    id: `ref-${id}`,
    raw: content.trim(),
    structured,
    confidence: Math.min(confidence, 1),
    format: 'unknown', // Study blocks are custom format
    position: {
      line: null,
      section: `Study ${studyNum}`,
    },
  };
}

/**
 * Parse a generic citation string
 */
function parseCitation(text: string, id: number): ParsedReference {
  const structured: ParsedReference['structured'] = {
    authors: [],
    title: null,
    year: null,
    journal: null,
    volume: null,
    issue: null,
    pages: null,
    doi: null,
    pmid: null,
    url: null,
  };

  let confidence = 0.3;
  let format: CitationFormat = 'unknown';

  // Extract DOI
  const doiMatch = text.match(PATTERNS.doi);
  if (doiMatch) {
    structured.doi = doiMatch[1];
    confidence += 0.2;
  }

  // Extract PMID
  const pmidMatch = text.match(PATTERNS.pmid) || text.match(PATTERNS.pmidAlt);
  if (pmidMatch) {
    structured.pmid = pmidMatch[1];
    confidence += 0.15;
  }

  // Extract URL
  const urlMatch = text.match(PATTERNS.url);
  if (urlMatch) {
    structured.url = urlMatch[0];
    confidence += 0.05;
  }

  // Extract year
  const years = text.match(PATTERNS.year);
  if (years) {
    // Take the most likely year (usually the first one in parentheses or standalone)
    const yearInParens = text.match(PATTERNS.yearParens);
    structured.year = yearInParens
      ? parseInt(yearInParens[1])
      : parseInt(years[0]);
    confidence += 0.1;
  }

  // Try to detect format and extract accordingly
  const formatResult = detectAndExtractByFormat(text, structured);
  format = formatResult.format;
  confidence += formatResult.confidenceBoost;

  // Parse authors if not already done
  if (structured.authors.length === 0) {
    structured.authors = parseAuthors(text);
    if (structured.authors.length > 0) {
      confidence += 0.1;
    }
  }

  return {
    id: `ref-${id}`,
    raw: text.trim(),
    structured,
    confidence: Math.min(confidence, 1),
    format,
    position: {
      line: null,
      section: null,
    },
  };
}

/**
 * Detect citation format and extract format-specific fields
 */
function detectAndExtractByFormat(
  text: string,
  structured: ParsedReference['structured']
): { format: CitationFormat; confidenceBoost: number } {
  // APA: Author, A. A., & Author, B. B. (Year). Title. Journal, Volume(Issue), Pages.
  if (text.match(/\(\d{4}\)\.\s+[^.]+\.\s+[A-Z][a-z]+/)) {
    return { format: 'apa', confidenceBoost: 0.15 };
  }

  // IEEE: [N] A. Author, "Title," Journal, vol. X, no. Y, pp. Z, Year.
  if (text.match(/vol\.\s*\d+|no\.\s*\d+|pp\.\s*[\d-]+/i)) {
    const volMatch = text.match(/vol\.\s*(\d+)/i);
    const issueMatch = text.match(/no\.\s*(\d+)/i);
    const pagesMatch = text.match(/pp\.\s*([\d-]+)/i);

    if (volMatch) structured.volume = volMatch[1];
    if (issueMatch) structured.issue = issueMatch[1];
    if (pagesMatch) structured.pages = pagesMatch[1];

    return { format: 'ieee', confidenceBoost: 0.15 };
  }

  // Vancouver: Author AA, Author BB. Title. Journal. Year;Volume(Issue):Pages.
  const vancouverMatch = text.match(PATTERNS.journalCitation);
  if (vancouverMatch) {
    structured.journal = vancouverMatch[1].trim();
    structured.year = parseInt(vancouverMatch[2]);
    structured.volume = vancouverMatch[3];
    if (vancouverMatch[4]) structured.issue = vancouverMatch[4];
    structured.pages = vancouverMatch[5];
    return { format: 'vancouver', confidenceBoost: 0.2 };
  }

  return { format: 'unknown', confidenceBoost: 0 };
}

/**
 * Parse author string into array of author names
 */
function parseAuthors(text: string): string[] {
  const authors: string[] = [];

  // Handle "et al." pattern
  const etAlMatch = text.match(PATTERNS.authorEtAl);
  if (etAlMatch) {
    authors.push(etAlMatch[1] + ' et al.');
    return authors;
  }

  // Try to find "Last, First" patterns
  const lastFirstMatches = text.matchAll(PATTERNS.authorLastFirst);
  for (const match of lastFirstMatches) {
    authors.push(match[0].trim());
    if (authors.length >= 5) break; // Limit to first 5 authors
  }

  // If no matches, try splitting by common separators
  if (authors.length === 0) {
    const parts = text.split(/[,;&]/).map((p) => p.trim());
    for (const part of parts) {
      // Check if it looks like a name (capitalized words)
      if (part.match(/^[A-Z][a-z]+(\s+[A-Z]\.?\s*)+$/) && part.length < 50) {
        authors.push(part);
        if (authors.length >= 5) break;
      }
    }
  }

  return authors;
}

/**
 * Extract inline citations like [1], (Smith 2020), etc.
 */
function extractInlineCitations(text: string): ParsedReference[] {
  const refs: ParsedReference[] = [];

  // Numbered citations [1], [2], [1-3], [1,2,3]
  const numberedPattern = /\[(\d+(?:[-,]\d+)*)\]/g;
  const numberedMatches = text.matchAll(numberedPattern);
  for (const match of numberedMatches) {
    refs.push({
      id: '',
      raw: match[0],
      structured: {
        authors: [],
        title: null,
        year: null,
        journal: null,
        volume: null,
        issue: null,
        pages: null,
        doi: null,
        pmid: null,
        url: null,
      },
      confidence: 0.2,
      format: 'inline',
      position: { line: null, section: null },
    });
  }

  // Author-year citations (Smith, 2020) or (Smith et al., 2020)
  const authorYearPattern = /\(([A-Z][a-z]+(?:\s+et\s+al\.)?),?\s*(\d{4})\)/g;
  const authorYearMatches = text.matchAll(authorYearPattern);
  for (const match of authorYearMatches) {
    refs.push({
      id: '',
      raw: match[0],
      structured: {
        authors: [match[1]],
        title: null,
        year: parseInt(match[2]),
        journal: null,
        volume: null,
        issue: null,
        pages: null,
        doi: null,
        pmid: null,
        url: null,
      },
      confidence: 0.4,
      format: 'inline',
      position: { line: null, section: null },
    });
  }

  // Author-year citations with author OUTSIDE parens: Smith (2023), Jones et al. (2022)
  const authorOutsidePattern = /([A-Z][a-z]+(?:\s+et\s+al\.)?)\s*\((\d{4})\)/g;
  const authorOutsideMatches = text.matchAll(authorOutsidePattern);
  for (const match of authorOutsideMatches) {
    refs.push({
      id: '',
      raw: match[0],
      structured: {
        authors: [match[1]],
        title: null,
        year: parseInt(match[2]),
        journal: null,
        volume: null,
        issue: null,
        pages: null,
        doi: null,
        pmid: null,
        url: null,
      },
      confidence: 0.5, // Slightly higher confidence - more explicit format
      format: 'inline',
      position: { line: null, section: null },
    });
  }

  return refs;
}

/**
 * Deduplicate references based on DOI, title similarity, or author+year
 */
function deduplicateReferences(refs: ParsedReference[]): ParsedReference[] {
  const seen = new Map<string, ParsedReference>();

  for (const ref of refs) {
    // Prefer DOI as unique key
    if (ref.structured.doi) {
      const existing = seen.get(`doi:${ref.structured.doi}`);
      if (!existing || ref.confidence > existing.confidence) {
        seen.set(`doi:${ref.structured.doi}`, ref);
      }
      continue;
    }

    // Fall back to title normalization
    if (ref.structured.title) {
      const normalizedTitle = ref.structured.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 50);
      const key = `title:${normalizedTitle}`;
      const existing = seen.get(key);
      if (!existing || ref.confidence > existing.confidence) {
        seen.set(key, ref);
      }
      continue;
    }

    // Fall back to author+year
    if (ref.structured.authors.length > 0 && ref.structured.year) {
      const key = `authoryear:${ref.structured.authors[0]}:${ref.structured.year}`;
      const existing = seen.get(key);
      if (!existing || ref.confidence > existing.confidence) {
        seen.set(key, ref);
      }
      continue;
    }

    // Keep unique raw text
    const rawKey = `raw:${ref.raw.substring(0, 100)}`;
    if (!seen.has(rawKey)) {
      seen.set(rawKey, ref);
    }
  }

  return Array.from(seen.values());
}

/**
 * Calculate extraction statistics
 */
function calculateStats(
  refs: ParsedReference[],
  _originalText: string
): ExtractionResult['stats'] {
  const formatDist: Record<CitationFormat, number> = {
    apa: 0,
    ieee: 0,
    vancouver: 0,
    harvard: 0,
    chicago: 0,
    inline: 0,
    pubmed: 0,
    unknown: 0,
  };

  let totalConfidence = 0;
  let parsed = 0;

  for (const ref of refs) {
    formatDist[ref.format]++;
    totalConfidence += ref.confidence;
    if (ref.confidence >= 0.5) {
      parsed++;
    }
  }

  return {
    total: refs.length,
    parsed,
    failed: refs.length - parsed,
    avgConfidence: refs.length > 0 ? totalConfidence / refs.length : 0,
    formatDistribution: formatDist,
  };
}

// =============================================================================
// Export Utilities
// =============================================================================

/**
 * Convert parsed references to BibTeX format
 */
export function toBibTeX(refs: ParsedReference[]): string {
  return refs
    .filter((r) => r.confidence >= 0.5)
    .map((ref, i) => {
      const s = ref.structured;
      const key = s.doi?.replace(/[^a-zA-Z0-9]/g, '') || `ref${i + 1}`;
      const authors = s.authors.join(' and ') || 'Unknown';
      const title = s.title || 'Untitled';
      const year = s.year || 'n.d.';

      return `@article{${key},
  author = {${authors}},
  title = {${title}},
  year = {${year}},
  ${s.journal ? `journal = {${s.journal}},` : ''}
  ${s.volume ? `volume = {${s.volume}},` : ''}
  ${s.pages ? `pages = {${s.pages}},` : ''}
  ${s.doi ? `doi = {${s.doi}},` : ''}
}`;
    })
    .join('\n\n');
}

/**
 * Convert parsed references to RIS format
 */
export function toRIS(refs: ParsedReference[]): string {
  return refs
    .filter((r) => r.confidence >= 0.5)
    .map((ref) => {
      const s = ref.structured;
      const lines = ['TY  - JOUR'];

      for (const author of s.authors) {
        lines.push(`AU  - ${author}`);
      }

      if (s.title) lines.push(`TI  - ${s.title}`);
      if (s.year) lines.push(`PY  - ${s.year}`);
      if (s.journal) lines.push(`JO  - ${s.journal}`);
      if (s.volume) lines.push(`VL  - ${s.volume}`);
      if (s.issue) lines.push(`IS  - ${s.issue}`);
      if (s.pages) lines.push(`SP  - ${s.pages}`);
      if (s.doi) lines.push(`DO  - ${s.doi}`);
      if (s.url) lines.push(`UR  - ${s.url}`);

      lines.push('ER  -');
      return lines.join('\n');
    })
    .join('\n\n');
}

/**
 * Convert parsed references to CSV format
 */
export function toCSV(refs: ParsedReference[]): string {
  const headers = [
    'ID',
    'Authors',
    'Title',
    'Year',
    'Journal',
    'Volume',
    'Issue',
    'Pages',
    'DOI',
    'PMID',
    'URL',
    'Confidence',
    'Format',
  ];

  const rows = refs.map((ref) => {
    const s = ref.structured;
    return [
      ref.id,
      s.authors.join('; '),
      s.title || '',
      s.year?.toString() || '',
      s.journal || '',
      s.volume || '',
      s.issue || '',
      s.pages || '',
      s.doi || '',
      s.pmid || '',
      s.url || '',
      ref.confidence.toFixed(2),
      ref.format,
    ]
      .map((v) => `"${v.replace(/"/g, '""')}"`)
      .join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
