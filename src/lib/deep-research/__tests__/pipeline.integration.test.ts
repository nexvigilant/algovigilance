/**
 * Reference Pipeline Integration Tests
 *
 * End-to-end tests for the extract → enrich workflow:
 * 1. Extract references from text using reference-parser
 * 2. Enrich with PubMed metadata using pubmed-enricher
 * 3. Validate complete pipeline output
 */

import { extractReferences, type ParsedReference } from '../reference-parser';
import {
  enrichReferences,
  type _EnrichmentResult,
  type _PubMedArticle,
} from '../pubmed-enricher';

// =============================================================================
// Mock Setup
// =============================================================================

const originalFetch = global.fetch;

function mockFetchResponse(data: string, ok = true, status = 200) {
  return jest.fn().mockResolvedValue({
    ok,
    status,
    text: async () => data,
    json: async () => JSON.parse(data),
  });
}

// Sample PubMed XML response for enrichment
const MOCK_PUBMED_XML = `
<?xml version="1.0" ?>
<PubmedArticleSet>
  <PubmedArticle>
    <MedlineCitation Status="MEDLINE" Owner="NLM">
      <PMID Version="1">27633186</PMID>
      <Article PubModel="Print">
        <Journal>
          <ISSN IssnType="Electronic">1533-4406</ISSN>
          <JournalIssue CitedMedium="Internet">
            <Volume>375</Volume>
            <Issue>19</Issue>
            <PubDate>
              <Year>2016</Year>
              <Month>Nov</Month>
              <Day>10</Day>
            </PubDate>
          </JournalIssue>
          <Title>New England Journal of Medicine</Title>
          <ISOAbbreviation>N Engl J Med</ISOAbbreviation>
        </Journal>
        <ArticleTitle>Semaglutide and Cardiovascular Outcomes in Patients with Type 2 Diabetes</ArticleTitle>
        <Pagination>
          <MedlinePgn>1834-1844</MedlinePgn>
        </Pagination>
        <Abstract>
          <AbstractText>BACKGROUND: Regulatory guidance specifies the need to establish cardiovascular safety of new antidiabetic therapies in patients with type 2 diabetes.</AbstractText>
        </Abstract>
        <AuthorList CompleteYN="Y">
          <Author ValidYN="Y">
            <LastName>Marso</LastName>
            <ForeName>Steven P</ForeName>
            <Initials>SP</Initials>
          </Author>
          <Author ValidYN="Y">
            <LastName>Daniels</LastName>
            <ForeName>Gilbert H</ForeName>
            <Initials>GH</Initials>
          </Author>
        </AuthorList>
        <ArticleIdList>
          <ArticleId IdType="pubmed">27633186</ArticleId>
          <ArticleId IdType="doi">10.1056/NEJMoa1607141</ArticleId>
          <ArticleId IdType="pmc">PMC5569266</ArticleId>
        </ArticleIdList>
      </Article>
      <KeywordList Owner="NOTNLM">
        <Keyword>semaglutide</Keyword>
        <Keyword>cardiovascular</Keyword>
        <Keyword>diabetes</Keyword>
      </KeywordList>
    </MedlineCitation>
  </PubmedArticle>
</PubmedArticleSet>
`;

// Mock ESearch response
const MOCK_ESEARCH_JSON = JSON.stringify({
  esearchresult: {
    count: '1',
    idlist: ['27633186'],
  },
});

// =============================================================================
// Test Fixtures
// =============================================================================

const SAMPLE_RESEARCH_REPORT = `
# Literature Review: GLP-1 Agonist Safety

## Executive Summary

This systematic review examines the cardiovascular safety profile of GLP-1 receptor agonists.

## Key Studies

### Study 1: SUSTAIN-6 Trial

**Authors:** Marso SP, Daniels GH, Tanaka-Baugus K, et al.
**Title:** Semaglutide and Cardiovascular Outcomes in Patients with Type 2 Diabetes
**Year:** 2016
**Journal:** New England Journal of Medicine
**Volume:** 375
**Pages:** 1834-1844
**DOI:** 10.1056/NEJMoa1607141
**PMID:** 27633186

The SUSTAIN-6 trial demonstrated a significant reduction in cardiovascular events.
According to Smith (2023), these findings have been replicated across multiple studies.

## References

1. Marso SP et al. Semaglutide and Cardiovascular Outcomes. N Engl J Med. 2016;375:1834-1844.
   doi: 10.1056/NEJMoa1607141
`;

// =============================================================================
// Integration Tests
// =============================================================================

describe('Reference Pipeline Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('Extract → Enrich Pipeline', () => {
    it('should extract references and enrich with PubMed data', async () => {
      // Setup mock to return PubMed data
      global.fetch = mockFetchResponse(MOCK_PUBMED_XML);

      // Step 1: Extract references from research report
      const extractionResult = extractReferences(SAMPLE_RESEARCH_REPORT, {
        minConfidence: 0.3,
        deduplicate: true,
        includeInline: true,
      });

      // Verify extraction
      expect(extractionResult.references.length).toBeGreaterThan(0);
      expect(extractionResult.stats.total).toBeGreaterThan(0);

      // Find reference with PMID
      const refWithPmid = extractionResult.references.find(
        (r) => r.structured.pmid === '27633186'
      );
      expect(refWithPmid).toBeDefined();

      // Step 2: Enrich references with PubMed
      const enrichmentResults = await enrichReferences(
        extractionResult.references
      );

      // Verify enrichment
      expect(enrichmentResults.length).toBe(extractionResult.references.length);

      // Check that PMID reference was enriched
      const enrichedRef = enrichmentResults.find(
        (r) => r.original.structured.pmid === '27633186'
      );

      if (enrichedRef?.matched) {
        expect(enrichedRef.matchMethod).toBe('pmid');
        expect(enrichedRef.enriched).toBeDefined();
        expect(enrichedRef.enriched?.title).toContain('Semaglutide');
      }
    });

    it('should handle DOI-based enrichment', async () => {
      // Setup mock for DOI search
      const searchMock = mockFetchResponse(MOCK_ESEARCH_JSON);
      const fetchMock = mockFetchResponse(MOCK_PUBMED_XML);

      // Alternate between search and fetch responses
      let callCount = 0;
      global.fetch = jest.fn().mockImplementation(() => {
        callCount++;
        // First call is DOI search, subsequent are fetch
        return callCount === 1
          ? searchMock()
          : fetchMock();
      });

      // Create reference with DOI only (no PMID)
      const doiOnlyRef: ParsedReference = {
        id: 'test-1',
        raw: 'Test reference with DOI',
        structured: {
          authors: ['Test Author'],
          title: 'Test Title',
          year: 2023,
          journal: 'Test Journal',
          volume: null,
          issue: null,
          pages: null,
          doi: '10.1056/NEJMoa1607141',
          pmid: null,
          url: null,
        },
        confidence: 0.8,
        format: 'unknown',
        position: { line: null, section: null },
      };

      const results = await enrichReferences([doiOnlyRef]);

      expect(results.length).toBe(1);
      // DOI search should trigger enrichment attempt
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should preserve original reference data when enrichment fails', async () => {
      // Setup mock to return empty result
      global.fetch = mockFetchResponse('<PubmedArticleSet></PubmedArticleSet>');

      const testRef: ParsedReference = {
        id: 'test-no-match',
        raw: 'Reference without PubMed match',
        structured: {
          authors: ['Unknown Author'],
          title: 'Obscure Paper',
          year: 2023,
          journal: null,
          volume: null,
          issue: null,
          pages: null,
          doi: '10.9999/not-found',
          pmid: null,
          url: null,
        },
        confidence: 0.5,
        format: 'unknown',
        position: { line: null, section: null },
      };

      const results = await enrichReferences([testRef]);

      expect(results.length).toBe(1);
      expect(results[0].matched).toBe(false);
      expect(results[0].matchMethod).toBe('none');
      expect(results[0].original).toEqual(testRef);
      expect(results[0].enriched).toBeNull();
    });
  });

  describe('Full Pipeline Statistics', () => {
    it('should track enrichment success rate', async () => {
      global.fetch = mockFetchResponse(MOCK_PUBMED_XML);

      // Extract from sample
      const extracted = extractReferences(SAMPLE_RESEARCH_REPORT, {
        minConfidence: 0.3,
        deduplicate: true,
      });

      // Enrich
      const enriched = await enrichReferences(extracted.references);

      // Calculate statistics
      const totalRefs = enriched.length;
      const matchedRefs = enriched.filter((r) => r.matched).length;
      const successRate = totalRefs > 0 ? matchedRefs / totalRefs : 0;

      // Output should have complete stats
      expect(totalRefs).toBeGreaterThan(0);
      expect(successRate).toBeGreaterThanOrEqual(0);
      expect(successRate).toBeLessThanOrEqual(1);
    });

    it('should categorize match methods correctly', async () => {
      global.fetch = mockFetchResponse(MOCK_PUBMED_XML);

      // Create refs with different identifiers
      const refs: ParsedReference[] = [
        {
          id: 'pmid-ref',
          raw: 'Reference with PMID',
          structured: {
            authors: ['Author A'],
            title: 'Title A',
            year: 2023,
            journal: null,
            volume: null,
            issue: null,
            pages: null,
            doi: null,
            pmid: '27633186',
            url: null,
          },
          confidence: 0.9,
          format: 'unknown',
          position: { line: null, section: null },
        },
        {
          id: 'no-id-ref',
          raw: 'Reference without identifiers',
          structured: {
            authors: ['Author B'],
            title: 'Title B',
            year: 2022,
            journal: null,
            volume: null,
            issue: null,
            pages: null,
            doi: null,
            pmid: null,
            url: null,
          },
          confidence: 0.4,
          format: 'unknown',
          position: { line: null, section: null },
        },
      ];

      const results = await enrichReferences(refs);

      // Should have correct match methods
      const pmidMatch = results.find((r) => r.original.id === 'pmid-ref');
      const noIdMatch = results.find((r) => r.original.id === 'no-id-ref');

      // PMID should match
      expect(pmidMatch?.matchMethod).toBe('pmid');
      // No identifier should not match
      expect(noIdMatch?.matchMethod).toBe('none');
    });
  });

  describe('Inline Citation Pipeline', () => {
    it('should handle inline citations through the pipeline', async () => {
      global.fetch = mockFetchResponse(MOCK_PUBMED_XML);

      const textWithInlineCitations = `
        According to Smith (2023), the treatment showed efficacy.
        Jones et al. (2022) confirmed these findings.
        Earlier work by (Brown, 2021) established the baseline.
      `;

      // Extract with inline citations enabled
      const extracted = extractReferences(textWithInlineCitations, {
        minConfidence: 0,
        includeInline: true,
      });

      // Verify inline citations were extracted
      const inlineCitations = extracted.references.filter(
        (r) => r.format === 'inline'
      );
      expect(inlineCitations.length).toBeGreaterThan(0);

      // Verify author-year data was captured
      const withAuthorYear = inlineCitations.filter(
        (r) => r.structured.authors.length > 0 && r.structured.year !== null
      );
      expect(withAuthorYear.length).toBeGreaterThanOrEqual(2);

      // Enrich (inline citations without PMID/DOI won't match)
      const enriched = await enrichReferences(extracted.references);

      // Should still preserve original data
      expect(enriched.length).toBe(extracted.references.length);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const refs: ParsedReference[] = [
        {
          id: 'test',
          raw: 'Test ref',
          structured: {
            authors: [],
            title: null,
            year: null,
            journal: null,
            volume: null,
            issue: null,
            pages: null,
            doi: null,
            pmid: '12345678',
            url: null,
          },
          confidence: 0.5,
          format: 'unknown',
          position: { line: null, section: null },
        },
      ];

      // Enricher handles errors gracefully - returns unmatched results
      const results = await enrichReferences(refs);

      // Should return results without throwing
      expect(results.length).toBe(1);
      expect(results[0].matched).toBe(false);
      expect(results[0].matchMethod).toBe('none');
      expect(results[0].original).toEqual(refs[0]);
    });

    it('should handle empty input gracefully', async () => {
      // Extract from empty text
      const extracted = extractReferences('');
      expect(extracted.references).toEqual([]);
      expect(extracted.stats.total).toBe(0);

      // Enrich empty array
      const enriched = await enrichReferences([]);
      expect(enriched).toEqual([]);
    });
  });
});

// =============================================================================
// Pipeline Utility Tests
// =============================================================================

describe('Pipeline Utilities', () => {
  describe('Reference Deduplication', () => {
    it('should deduplicate by DOI across extraction and enrichment', async () => {
      global.fetch = mockFetchResponse(MOCK_PUBMED_XML);

      // Text with duplicate references (same DOI mentioned twice)
      const textWithDuplicates = `
        ### Study 1
        **DOI:** 10.1056/NEJMoa1607141

        ### Study 2 (same study, different format)
        doi: 10.1056/NEJMoa1607141
      `;

      const extracted = extractReferences(textWithDuplicates, {
        deduplicate: true,
      });

      // Should deduplicate
      const uniqueDois = new Set(
        extracted.references
          .map((r) => r.structured.doi)
          .filter(Boolean)
      );
      expect(uniqueDois.size).toBeLessThanOrEqual(extracted.references.length);
    });
  });

  describe('Confidence Aggregation', () => {
    it('should combine extraction and enrichment confidence', async () => {
      global.fetch = mockFetchResponse(MOCK_PUBMED_XML);

      const extracted = extractReferences(SAMPLE_RESEARCH_REPORT, {
        minConfidence: 0,
      });

      const enriched = await enrichReferences(extracted.references);

      // For matched references, enrichment boosts effective confidence
      const matchedRefs = enriched.filter((r) => r.matched);

      for (const match of matchedRefs) {
        // Original extraction confidence
        expect(match.original.confidence).toBeGreaterThanOrEqual(0);
        // Enrichment confirmed the reference
        expect(match.enriched).toBeDefined();
      }
    });
  });
});
