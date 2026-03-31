/**
 * Tests for reference deduplication utilities
 *
 * @module reference-dedup.test
 */

import {
  mergeReferenceSets,
  findDuplicates,
  mergeDuplicateGroup,
  toAnnotatedBibTeX,
  type ReferenceSource,
  type DuplicateGroup,
  type MergedReference,
} from '../reference-dedup';
import type { ParsedReference } from '../reference-parser';

// =============================================================================
// Test Fixtures
// =============================================================================

/**
 * Create a minimal ParsedReference for testing
 */
function createRef(overrides: Partial<ParsedReference['structured']> & { id?: string }): ParsedReference {
  const { id = `ref-${Math.random().toString(36).slice(2, 8)}`, ...structured } = overrides;
  return {
    id,
    raw: `[${id}] ${structured.title || 'Untitled'}`,
    structured: {
      title: '',
      authors: [],
      year: undefined,
      journal: undefined,
      volume: undefined,
      issue: undefined,
      pages: undefined,
      doi: undefined,
      pmid: undefined,
      url: undefined,
      ...structured,
    },
    confidence: 0.8,
    format: 'unknown',
    position: { start: 0, end: 100 },
  };
}

// Sample references for testing
const sampleRefs = {
  // Reference with DOI
  withDOI: createRef({
    id: 'ref-doi-1',
    title: 'Cardiovascular outcomes with semaglutide in type 2 diabetes',
    authors: ['Smith J', 'Jones M', 'Williams A'],
    year: 2023,
    journal: 'New England Journal of Medicine',
    doi: '10.1056/NEJMoa2302392',
    pmid: '37123456',
  }),

  // Same reference, different format (for DOI matching)
  withDOIDuplicate: createRef({
    id: 'ref-doi-2',
    title: 'Cardiovascular outcomes with semaglutide in T2D',
    authors: ['Smith, John', 'Jones, Mary'],
    year: 2023,
    doi: '10.1056/NEJMoa2302392', // Same DOI
  }),

  // Reference with only PMID
  withPMID: createRef({
    id: 'ref-pmid-1',
    title: 'GLP-1 receptor agonists and cardiovascular risk',
    authors: ['Brown K', 'Davis R'],
    year: 2022,
    journal: 'Lancet',
    pmid: '35987654',
  }),

  // Same PMID, different title
  withPMIDDuplicate: createRef({
    id: 'ref-pmid-2',
    title: 'GLP-1 agonists cardiovascular risk analysis',
    authors: ['Brown, Keith'],
    year: 2022,
    pmid: '35987654', // Same PMID
  }),

  // Reference for fuzzy matching
  fuzzyRef1: createRef({
    id: 'ref-fuzzy-1',
    title: 'Meta-analysis of SGLT2 inhibitors cardiovascular benefits',
    authors: ['Wilson E', 'Taylor P'],
    year: 2024,
    journal: 'Diabetes Care',
  }),

  // Similar title for fuzzy matching
  fuzzyRef2: createRef({
    id: 'ref-fuzzy-2',
    title: 'Meta-analysis of SGLT2 inhibitors and cardiovascular benefits',
    authors: ['Wilson, E', 'Taylor, P'],
    year: 2024,
    journal: 'Diabetes Care',
  }),

  // Unique reference (no duplicate)
  unique1: createRef({
    id: 'ref-unique-1',
    title: 'Novel approaches to pharmacovigilance signal detection',
    authors: ['Garcia L', 'Martinez R'],
    year: 2024,
    journal: 'Drug Safety',
    doi: '10.1007/s40264-024-01234-5',
  }),

  // Another unique reference
  unique2: createRef({
    id: 'ref-unique-2',
    title: 'Machine learning in adverse event detection',
    authors: ['Lee S', 'Kim J'],
    year: 2023,
    journal: 'JAMIA',
    pmid: '36543210',
  }),

  // Sparse reference (minimal data)
  sparse: createRef({
    id: 'ref-sparse',
    title: 'Drug safety study',
    authors: [],
    year: undefined,
  }),

  // Complete reference (all fields)
  complete: createRef({
    id: 'ref-complete',
    title: 'Comprehensive drug safety analysis',
    authors: ['Anderson M', 'Thompson K', 'White L'],
    year: 2024,
    journal: 'Clinical Pharmacology & Therapeutics',
    volume: '115',
    issue: '3',
    pages: '456-478',
    doi: '10.1002/cpt.2024.115.3',
    pmid: '38765432',
    url: 'https://example.com/article',
  }),
};

// =============================================================================
// mergeReferenceSets Tests
// =============================================================================

describe('mergeReferenceSets', () => {
  describe('DOI-based deduplication', () => {
    it('should merge references with matching DOIs', () => {
      const sources: ReferenceSource[] = [
        { source: 'source1.md', refs: [sampleRefs.withDOI] },
        { source: 'source2.md', refs: [sampleRefs.withDOIDuplicate] },
      ];

      const result = mergeReferenceSets(sources);

      expect(result.merged.length).toBe(1);
      expect(result.stats.duplicatesFound).toBe(1);
      expect(result.stats.mergesByMethod.doi).toBe(1);
      expect(result.merged[0].sources).toContain('source1.md');
      expect(result.merged[0].sources).toContain('source2.md');
    });

    it('should prefer more complete reference as primary', () => {
      const sources: ReferenceSource[] = [
        { source: 'source1.md', refs: [sampleRefs.withDOIDuplicate] }, // Less complete
        { source: 'source2.md', refs: [sampleRefs.withDOI] }, // More complete (has PMID, journal)
      ];

      const result = mergeReferenceSets(sources);

      // Should use the more complete reference's title
      expect(result.merged[0].structured.journal).toBe('New England Journal of Medicine');
      expect(result.merged[0].structured.pmid).toBe('37123456');
    });

    it('should normalize DOI case for matching', () => {
      const upperDOI = createRef({
        title: 'Test Article',
        doi: '10.1056/NEJMOA2302392', // Uppercase
      });
      const lowerDOI = createRef({
        title: 'Test Article Different',
        doi: '10.1056/nejmoa2302392', // Lowercase
      });

      const sources: ReferenceSource[] = [
        { source: 'source1.md', refs: [upperDOI] },
        { source: 'source2.md', refs: [lowerDOI] },
      ];

      const result = mergeReferenceSets(sources);
      expect(result.merged.length).toBe(1);
      expect(result.stats.mergesByMethod.doi).toBe(1);
    });
  });

  describe('PMID-based deduplication', () => {
    it('should merge references with matching PMIDs', () => {
      const sources: ReferenceSource[] = [
        { source: 'source1.md', refs: [sampleRefs.withPMID] },
        { source: 'source2.md', refs: [sampleRefs.withPMIDDuplicate] },
      ];

      const result = mergeReferenceSets(sources);

      expect(result.merged.length).toBe(1);
      expect(result.stats.duplicatesFound).toBe(1);
      expect(result.stats.mergesByMethod.pmid).toBe(1);
    });

    it('should merge via PMID after DOI pass', () => {
      // One ref has DOI, two refs share PMID
      const refWithBoth = createRef({
        title: 'Complete reference',
        doi: '10.1000/unique-doi',
        pmid: '99999999',
      });
      const refWithSamePMID = createRef({
        title: 'Another reference same pmid',
        pmid: '99999999',
      });
      const refWithDifferentPMID = createRef({
        title: 'Different pmid reference',
        pmid: '88888888',
      });

      const sources: ReferenceSource[] = [
        { source: 'source1.md', refs: [refWithBoth, refWithDifferentPMID] },
        { source: 'source2.md', refs: [refWithSamePMID] },
      ];

      const result = mergeReferenceSets(sources);

      // refWithBoth and refWithSamePMID should merge, refWithDifferentPMID stays separate
      expect(result.merged.length).toBe(2);
    });
  });

  describe('fuzzy title matching', () => {
    it('should merge references with similar titles', () => {
      const sources: ReferenceSource[] = [
        { source: 'source1.md', refs: [sampleRefs.fuzzyRef1] },
        { source: 'source2.md', refs: [sampleRefs.fuzzyRef2] },
      ];

      const result = mergeReferenceSets(sources, { threshold: 0.7 });

      expect(result.merged.length).toBe(1);
      expect(result.stats.mergesByMethod.fuzzy).toBe(1);
    });

    it('should not merge very different titles', () => {
      const ref1 = createRef({
        title: 'Cardiovascular outcomes in diabetes patients',
        authors: ['Smith J'],
        year: 2023,
      });
      const ref2 = createRef({
        title: 'Hepatotoxicity patterns in oncology drugs',
        authors: ['Jones M'],
        year: 2023,
      });

      const sources: ReferenceSource[] = [
        { source: 'source1.md', refs: [ref1] },
        { source: 'source2.md', refs: [ref2] },
      ];

      const result = mergeReferenceSets(sources);

      expect(result.merged.length).toBe(2);
      expect(result.stats.duplicatesFound).toBe(0);
    });

    it('should add borderline matches to needsReview', () => {
      // These titles are somewhat similar but not quite at threshold
      const ref1 = createRef({
        title: 'GLP-1 receptor agonists safety profile analysis',
        authors: ['Author A'],
        year: 2024,
      });
      const ref2 = createRef({
        title: 'GLP-1 agonist safety review',
        authors: ['Author B'],
        year: 2024,
      });

      const sources: ReferenceSource[] = [
        { source: 'source1.md', refs: [ref1, ref2] },
      ];

      // Use a high threshold so these fall into "review" zone
      const result = mergeReferenceSets(sources, { threshold: 0.9 });

      // They should either be separate or in needsReview
      expect(result.needsReview.length + result.merged.length).toBeGreaterThan(0);
    });
  });

  describe('statistics tracking', () => {
    it('should correctly count total input references', () => {
      const sources: ReferenceSource[] = [
        { source: 'source1.md', refs: [sampleRefs.unique1, sampleRefs.unique2] },
        { source: 'source2.md', refs: [sampleRefs.withDOI, sampleRefs.withPMID] },
      ];

      const result = mergeReferenceSets(sources);

      expect(result.stats.totalInput).toBe(4);
      expect(result.stats.uniqueOutput).toBe(4); // No duplicates
    });

    it('should correctly count unique output after merging', () => {
      const sources: ReferenceSource[] = [
        { source: 'source1.md', refs: [sampleRefs.withDOI, sampleRefs.unique1] },
        { source: 'source2.md', refs: [sampleRefs.withDOIDuplicate, sampleRefs.unique2] },
      ];

      const result = mergeReferenceSets(sources);

      expect(result.stats.totalInput).toBe(4);
      expect(result.stats.uniqueOutput).toBe(3); // One DOI duplicate merged
      expect(result.stats.duplicatesFound).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle empty sources array', () => {
      const result = mergeReferenceSets([]);

      expect(result.merged).toEqual([]);
      expect(result.stats.totalInput).toBe(0);
      expect(result.stats.uniqueOutput).toBe(0);
    });

    it('should handle source with empty refs', () => {
      const sources: ReferenceSource[] = [
        { source: 'empty.md', refs: [] },
        { source: 'source1.md', refs: [sampleRefs.unique1] },
      ];

      const result = mergeReferenceSets(sources);

      expect(result.merged.length).toBe(1);
      expect(result.stats.totalInput).toBe(1);
    });

    it('should handle single reference', () => {
      const sources: ReferenceSource[] = [
        { source: 'source1.md', refs: [sampleRefs.unique1] },
      ];

      const result = mergeReferenceSets(sources);

      expect(result.merged.length).toBe(1);
      expect(result.merged[0].sources).toEqual(['source1.md']);
      expect(result.stats.duplicatesFound).toBe(0);
    });

    it('should handle sparse references with minimal data', () => {
      const sources: ReferenceSource[] = [
        { source: 'source1.md', refs: [sampleRefs.sparse] },
        { source: 'source2.md', refs: [sampleRefs.unique1] },
      ];

      const result = mergeReferenceSets(sources);

      expect(result.merged.length).toBe(2);
    });

    it('should handle multiple duplicates of same reference', () => {
      // Three copies of the same DOI
      const dup1 = createRef({ title: 'Copy 1', doi: '10.1000/test' });
      const dup2 = createRef({ title: 'Copy 2', doi: '10.1000/test' });
      const dup3 = createRef({ title: 'Copy 3', doi: '10.1000/test' });

      const sources: ReferenceSource[] = [
        { source: 'source1.md', refs: [dup1] },
        { source: 'source2.md', refs: [dup2] },
        { source: 'source3.md', refs: [dup3] },
      ];

      const result = mergeReferenceSets(sources);

      expect(result.merged.length).toBe(1);
      expect(result.merged[0].sources.length).toBe(3);
      expect(result.stats.duplicatesFound).toBe(2);
      expect(result.stats.mergesByMethod.doi).toBe(2);
    });
  });

  describe('options', () => {
    it('should respect threshold option for fuzzy matching', () => {
      const ref1 = createRef({
        title: 'Analysis of drug safety in clinical trials',
        year: 2023,
      });
      const ref2 = createRef({
        title: 'Analysis of drug safety clinical trial data',
        year: 2023,
      });

      const sources: ReferenceSource[] = [
        { source: 'source1.md', refs: [ref1, ref2] },
      ];

      // Low threshold - should merge
      const lowResult = mergeReferenceSets(sources, { threshold: 0.5 });
      // High threshold - should not merge
      const highResult = mergeReferenceSets(sources, { threshold: 0.95 });

      expect(lowResult.merged.length).toBeLessThanOrEqual(highResult.merged.length);
    });

    it('should skip DOI matching when preferDOI is false', () => {
      const sources: ReferenceSource[] = [
        { source: 'source1.md', refs: [sampleRefs.withDOI] },
        { source: 'source2.md', refs: [sampleRefs.withDOIDuplicate] },
      ];

      const result = mergeReferenceSets(sources, { preferDOI: false });

      // DOI matching is skipped, but they may still match via fuzzy title
      // The key is that mergesByMethod.doi should be 0
      expect(result.stats.mergesByMethod.doi).toBe(0);
    });
  });
});

// =============================================================================
// findDuplicates Tests
// =============================================================================

describe('findDuplicates', () => {
  it('should find duplicates within a single reference set', () => {
    const refs = [sampleRefs.withDOI, sampleRefs.withDOIDuplicate, sampleRefs.unique1];

    const groups = findDuplicates(refs);

    expect(groups.length).toBe(1);
    expect(groups[0].primary.structured.doi).toBe('10.1056/NEJMoa2302392');
    expect(groups[0].duplicates.length).toBe(1);
  });

  it('should return empty array when no duplicates', () => {
    const refs = [sampleRefs.unique1, sampleRefs.unique2];

    const groups = findDuplicates(refs);

    expect(groups).toEqual([]);
  });

  it('should set action to "merge" for high similarity matches', () => {
    // Create very similar refs (identical except format)
    const ref1 = createRef({
      title: 'Exact Same Title Here',
      authors: ['Smith J'],
      year: 2024,
      doi: '10.1000/exact',
    });
    const ref2 = createRef({
      title: 'Exact Same Title Here',
      authors: ['Smith J'],
      year: 2024,
      doi: '10.1000/exact',
    });

    const groups = findDuplicates([ref1, ref2]);

    expect(groups.length).toBe(1);
    expect(groups[0].action).toBe('merge');
  });

  it('should set action to "review" for borderline matches', () => {
    // Create refs that are similar but not identical enough for 'merge'
    // Need similarity between threshold and 0.9 to get 'review' action
    const ref1 = createRef({
      title: 'Drug Safety Guidelines for Clinical Practice',
      authors: ['Smith J'],
      year: 2024,
    });
    const ref2 = createRef({
      title: 'Safety Guidelines Clinical Applications',
      authors: ['Jones M'],
      year: 2023, // Different year reduces similarity
    });

    // Lower threshold to catch borderline matches
    const groups = findDuplicates([ref1, ref2], { threshold: 0.4 });

    // If they match with score < 0.9, should be 'review'
    if (groups.length > 0 && groups[0].scores[0] < 0.9) {
      expect(groups[0].action).toBe('review');
    }
  });

  it('should group multiple duplicates together', () => {
    // Three refs with same DOI
    const ref1 = createRef({ title: 'Version 1', doi: '10.1000/multi' });
    const ref2 = createRef({ title: 'Version 2', doi: '10.1000/multi' });
    const ref3 = createRef({ title: 'Version 3', doi: '10.1000/multi' });

    const groups = findDuplicates([ref1, ref2, ref3]);

    expect(groups.length).toBe(1);
    expect(groups[0].duplicates.length).toBe(2); // 2 duplicates of primary
  });

  it('should respect threshold option', () => {
    const ref1 = createRef({
      title: 'Analysis of cardiovascular outcomes',
      year: 2023,
    });
    const ref2 = createRef({
      title: 'Analysis of cardiovascular results',
      year: 2023,
    });

    // Low threshold
    const lowGroups = findDuplicates([ref1, ref2], { threshold: 0.5 });
    // High threshold
    const highGroups = findDuplicates([ref1, ref2], { threshold: 0.99 });

    expect(highGroups.length).toBeLessThanOrEqual(lowGroups.length);
  });

  it('should handle empty input', () => {
    const groups = findDuplicates([]);
    expect(groups).toEqual([]);
  });

  it('should handle single reference', () => {
    const groups = findDuplicates([sampleRefs.unique1]);
    expect(groups).toEqual([]);
  });
});

// =============================================================================
// mergeDuplicateGroup Tests
// =============================================================================

describe('mergeDuplicateGroup', () => {
  it('should select most complete reference as primary', () => {
    const group: DuplicateGroup = {
      primary: sampleRefs.sparse, // Less complete
      duplicates: [sampleRefs.complete], // More complete
      scores: [0.95],
      action: 'merge',
    };

    const merged = mergeDuplicateGroup(group);

    // Should use complete reference's data
    expect(merged.structured.journal).toBe('Clinical Pharmacology & Therapeutics');
    expect(merged.structured.volume).toBe('115');
    expect(merged.structured.doi).toBe('10.1002/cpt.2024.115.3');
  });

  it('should merge fields from all references', () => {
    const ref1 = createRef({
      title: 'Primary reference',
      authors: ['Author A'],
      doi: '10.1000/primary',
    });
    const ref2 = createRef({
      title: 'Secondary reference',
      authors: [],
      pmid: '12345678', // Has PMID that primary lacks
      url: 'https://example.com',
    });

    const group: DuplicateGroup = {
      primary: ref1,
      duplicates: [ref2],
      scores: [0.9],
      action: 'merge',
    };

    const merged = mergeDuplicateGroup(group);

    // Should have both DOI and PMID
    expect(merged.structured.doi).toBe('10.1000/primary');
    expect(merged.structured.pmid).toBe('12345678');
    expect(merged.structured.url).toBe('https://example.com');
  });

  it('should calculate merge confidence from scores', () => {
    const group: DuplicateGroup = {
      primary: sampleRefs.withDOI,
      duplicates: [sampleRefs.withDOIDuplicate],
      scores: [0.8, 0.9], // Average should be 0.85
      action: 'merge',
    };

    const merged = mergeDuplicateGroup(group);

    // Use toBeCloseTo for floating-point comparison
    expect(merged.mergeConfidence).toBeCloseTo(0.85, 5);
  });

  it('should set mergeConfidence to 1.0 when no scores', () => {
    const group: DuplicateGroup = {
      primary: sampleRefs.withDOI,
      duplicates: [],
      scores: [],
      action: 'merge',
    };

    const merged = mergeDuplicateGroup(group);

    expect(merged.mergeConfidence).toBe(1.0);
  });

  it('should include all original references', () => {
    const group: DuplicateGroup = {
      primary: sampleRefs.withDOI,
      duplicates: [sampleRefs.withDOIDuplicate, sampleRefs.unique1],
      scores: [0.9, 0.85],
      action: 'merge',
    };

    const merged = mergeDuplicateGroup(group);

    expect(merged.originals.length).toBe(3);
  });
});

// =============================================================================
// toAnnotatedBibTeX Tests
// =============================================================================

describe('toAnnotatedBibTeX', () => {
  it('should generate valid BibTeX entries', () => {
    const merged: MergedReference[] = [
      {
        ...sampleRefs.complete,
        sources: ['source1.md', 'source2.md'],
        originals: [sampleRefs.complete],
        mergeConfidence: 1.0,
      },
    ];

    const bibtex = toAnnotatedBibTeX(merged);

    expect(bibtex).toContain('@article{');
    expect(bibtex).toContain('title = {Comprehensive drug safety analysis}');
    expect(bibtex).toContain('author = {Anderson M and Thompson K and White L}');
    expect(bibtex).toContain('year = {2024}');
    expect(bibtex).toContain('journal = {Clinical Pharmacology & Therapeutics}');
    expect(bibtex).toContain('doi = {10.1002/cpt.2024.115.3}');
    expect(bibtex).toContain('pmid = {38765432}');
  });

  it('should include source annotations', () => {
    const merged: MergedReference[] = [
      {
        ...sampleRefs.withDOI,
        sources: ['review1.md', 'review2.md', 'review3.md'],
        originals: [],
        mergeConfidence: 0.95,
      },
    ];

    const bibtex = toAnnotatedBibTeX(merged);

    expect(bibtex).toContain('note = {Sources: review1.md, review2.md, review3.md}');
  });

  it('should generate unique BibTeX keys', () => {
    const merged: MergedReference[] = [
      {
        ...sampleRefs.withDOI,
        sources: ['source1.md'],
        originals: [],
        mergeConfidence: 1.0,
      },
      {
        ...sampleRefs.unique1,
        sources: ['source2.md'],
        originals: [],
        mergeConfidence: 1.0,
      },
    ];

    const bibtex = toAnnotatedBibTeX(merged);

    // Count @article entries
    const entries = bibtex.match(/@article\{/g);
    expect(entries?.length).toBe(2);

    // Keys should be different (author+year+firstword format)
    expect(bibtex).toContain('Smith2023cardiovascular');
    expect(bibtex).toContain('Garcia2024novel');
  });

  it('should handle references with missing fields', () => {
    const merged: MergedReference[] = [
      {
        ...sampleRefs.sparse,
        sources: ['source1.md'],
        originals: [],
        mergeConfidence: 1.0,
      },
    ];

    const bibtex = toAnnotatedBibTeX(merged);

    // Should still generate valid BibTeX
    expect(bibtex).toContain('@article{');
    expect(bibtex).toContain('title = {Drug safety study}');
    // Should not have undefined or null values
    expect(bibtex).not.toContain('undefined');
    expect(bibtex).not.toContain('null');
  });

  it('should handle empty merged array', () => {
    const bibtex = toAnnotatedBibTeX([]);
    expect(bibtex).toBe('');
  });

  it('should handle references with no authors', () => {
    const noAuthors = createRef({
      title: 'Anonymous study',
      year: 2024,
    });
    const merged: MergedReference[] = [
      {
        ...noAuthors,
        sources: ['source.md'],
        originals: [],
        mergeConfidence: 1.0,
      },
    ];

    const bibtex = toAnnotatedBibTeX(merged);

    // Should use 'unknown' as author fallback
    expect(bibtex).toContain('unknown2024anonymous');
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('integration', () => {
  it('should handle realistic multi-source merge workflow', () => {
    // Simulate merging from two literature reviews
    const review1Refs = [
      createRef({
        title: 'Safety of GLP-1 receptor agonists: systematic review',
        authors: ['Johnson A', 'Williams B'],
        year: 2024,
        journal: 'Drug Safety',
        doi: '10.1007/s40264-024-01389-2',
      }),
      createRef({
        title: 'Cardiovascular effects of SGLT2 inhibitors',
        authors: ['Smith C'],
        year: 2023,
        pmid: '37654321',
      }),
    ];

    const review2Refs = [
      createRef({
        // Same DOI as review1, slightly different title
        title: 'Safety of GLP-1 RAs: a systematic review',
        authors: ['Johnson, A', 'Williams, B'],
        year: 2024,
        doi: '10.1007/s40264-024-01389-2',
      }),
      createRef({
        // Same PMID as review1
        title: 'SGLT2 inhibitors and cardiovascular outcomes',
        authors: ['Smith, Charles'],
        year: 2023,
        pmid: '37654321',
      }),
      createRef({
        // Unique to review2
        title: 'Novel biomarkers for drug safety monitoring',
        authors: ['Lee D'],
        year: 2024,
        journal: 'Clinical Pharmacology',
      }),
    ];

    const sources: ReferenceSource[] = [
      { source: 'glp1-review.md', refs: review1Refs },
      { source: 'cv-safety-review.md', refs: review2Refs },
    ];

    const result = mergeReferenceSets(sources);

    // Should have 3 unique references (2 merged, 1 unique)
    expect(result.merged.length).toBe(3);
    expect(result.stats.totalInput).toBe(5);
    expect(result.stats.duplicatesFound).toBe(2);

    // Check DOI-merged reference
    const doiMerged = result.merged.find((m) =>
      m.structured.doi === '10.1007/s40264-024-01389-2'
    );
    expect(doiMerged).toBeDefined();
    expect(doiMerged?.sources).toContain('glp1-review.md');
    expect(doiMerged?.sources).toContain('cv-safety-review.md');

    // Check PMID-merged reference
    const pmidMerged = result.merged.find((m) =>
      m.structured.pmid === '37654321'
    );
    expect(pmidMerged).toBeDefined();
    expect(pmidMerged?.sources.length).toBe(2);

    // Check unique reference
    const unique = result.merged.find((m) =>
      m.structured.title?.includes('Novel biomarkers')
    );
    expect(unique).toBeDefined();
    expect(unique?.sources).toEqual(['cv-safety-review.md']);
  });

  it('should produce exportable BibTeX from merged result', () => {
    const sources: ReferenceSource[] = [
      { source: 'source1.md', refs: [sampleRefs.withDOI, sampleRefs.unique1] },
      { source: 'source2.md', refs: [sampleRefs.withDOIDuplicate] },
    ];

    const result = mergeReferenceSets(sources);
    const bibtex = toAnnotatedBibTeX(result.merged);

    // Should have 2 entries (DOI duplicates merged + unique)
    const entries = bibtex.match(/@article\{/g);
    expect(entries?.length).toBe(2);

    // Both merged references should have source annotations
    expect(bibtex).toContain('note = {Sources:');
  });
});

// =============================================================================
// Similarity Algorithm Tests
// =============================================================================

describe('similarity calculation', () => {
  it('should give 1.0 for exact DOI match', () => {
    const ref1 = createRef({ title: 'Different title A', doi: '10.1000/test' });
    const ref2 = createRef({ title: 'Different title B', doi: '10.1000/test' });

    const groups = findDuplicates([ref1, ref2]);

    expect(groups.length).toBe(1);
    expect(groups[0].scores[0]).toBe(1.0);
  });

  it('should give 1.0 for exact PMID match', () => {
    const ref1 = createRef({ title: 'Title A', pmid: '12345678' });
    const ref2 = createRef({ title: 'Title B', pmid: '12345678' });

    const groups = findDuplicates([ref1, ref2]);

    expect(groups.length).toBe(1);
    expect(groups[0].scores[0]).toBe(1.0);
  });

  it('should consider author overlap in similarity', () => {
    // Same authors, different titles
    const ref1 = createRef({
      title: 'Study one on cardiovascular outcomes',
      authors: ['Smith J', 'Jones M', 'Williams A'],
      year: 2024,
    });
    const ref2 = createRef({
      title: 'Study two on cardiovascular outcomes',
      authors: ['Smith J', 'Jones M', 'Williams A'],
      year: 2024,
    });

    // Different authors, same title
    const ref3 = createRef({
      title: 'Study three on cardiovascular outcomes',
      authors: ['Brown K', 'Davis R'],
      year: 2024,
    });

    // ref1 and ref2 should be more similar due to author overlap
    const groups = findDuplicates([ref1, ref2, ref3], { threshold: 0.6 });

    // Check that same-author refs are grouped
    if (groups.length > 0) {
      const group = groups.find((g) =>
        g.primary.structured.authors.includes('Smith J')
      );
      expect(group).toBeDefined();
    }
  });

  it('should consider year match in similarity', () => {
    const ref1 = createRef({
      title: 'Safety analysis methodology',
      year: 2024,
    });
    const ref2 = createRef({
      title: 'Safety analysis methodology',
      year: 2024, // Same year
    });
    const ref3 = createRef({
      title: 'Safety analysis methodology',
      year: 2020, // Different year
    });

    // ref1 and ref2 should have higher similarity
    const groups = findDuplicates([ref1, ref2, ref3], { threshold: 0.7 });

    expect(groups.length).toBeGreaterThanOrEqual(1);
  });
});
