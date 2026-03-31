/**
 * PubMed Enricher Tests
 *
 * Tests for NCBI E-utilities integration with mocked API responses.
 */

import {
  searchPubMed,
  fetchArticlesByPMID,
  enrichByPMID,
  enrichMultiplePMIDs,
  searchByDOI,
  enrichReferences,
  pubmedToReference,
  type PubMedArticle,
} from '../pubmed-enricher';
import type { ParsedReference } from '../reference-parser';

// =============================================================================
// Mock Setup
// =============================================================================

// Store original fetch
const originalFetch = global.fetch;

// Mock response builder
function mockFetchResponse(data: string | object, ok = true, status = 200) {
  return jest.fn().mockResolvedValue({
    ok,
    status,
    text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
    json: async () => (typeof data === 'object' ? data : JSON.parse(data)),
  });
}

// Sample XML responses
const SAMPLE_ARTICLE_XML = `
<?xml version="1.0" ?>
<!DOCTYPE PubmedArticleSet PUBLIC "-//NLM//DTD PubMedArticle, 1st January 2024//EN" "https://dtd.nlm.nih.gov/ncbi/pubmed/out/pubmed_240101.dtd">
<PubmedArticleSet>
  <PubmedArticle>
    <MedlineCitation Status="MEDLINE" Owner="NLM">
      <PMID Version="1">12345678</PMID>
      <Article PubModel="Print">
        <Journal>
          <ISSN IssnType="Electronic">1234-5678</ISSN>
          <JournalIssue CitedMedium="Internet">
            <Volume>45</Volume>
            <Issue>3</Issue>
            <PubDate>
              <Year>2023</Year>
              <Month>Mar</Month>
              <Day>15</Day>
            </PubDate>
          </JournalIssue>
          <Title>Journal of Drug Safety</Title>
          <ISOAbbreviation>J Drug Saf</ISOAbbreviation>
        </Journal>
        <ArticleTitle>Cardiovascular Safety of GLP-1 Receptor Agonists: A Systematic Review</ArticleTitle>
        <Pagination>
          <MedlinePgn>123-145</MedlinePgn>
        </Pagination>
        <Abstract>
          <AbstractText>Background: GLP-1 receptor agonists have shown promising cardiovascular outcomes...</AbstractText>
        </Abstract>
        <AuthorList CompleteYN="Y">
          <Author ValidYN="Y">
            <LastName>Smith</LastName>
            <ForeName>John A</ForeName>
            <Initials>JA</Initials>
            <AffiliationInfo>
              <Affiliation>Department of Pharmacology, University Medical Center</Affiliation>
            </AffiliationInfo>
          </Author>
          <Author ValidYN="Y">
            <LastName>Johnson</LastName>
            <ForeName>Mary B</ForeName>
            <Initials>MB</Initials>
            <Identifier Source="ORCID">0000-0001-2345-6789</Identifier>
          </Author>
        </AuthorList>
        <PublicationTypeList>
          <PublicationType UI="D016428">Journal Article</PublicationType>
          <PublicationType UI="D016454">Review</PublicationType>
        </PublicationTypeList>
        <KeywordList Owner="NOTNLM">
          <Keyword MajorTopicYN="N">GLP-1</Keyword>
          <Keyword MajorTopicYN="N">cardiovascular</Keyword>
          <Keyword MajorTopicYN="N">safety</Keyword>
        </KeywordList>
      </Article>
      <MeshHeadingList>
        <MeshHeading>
          <DescriptorName UI="D000368" MajorTopicYN="N">Cardiovascular Diseases</DescriptorName>
        </MeshHeading>
        <MeshHeading>
          <DescriptorName UI="D000069450" MajorTopicYN="N">Glucagon-Like Peptide-1 Receptor</DescriptorName>
        </MeshHeading>
      </MeshHeadingList>
    </MedlineCitation>
    <PubmedData>
      <ArticleIdList>
        <ArticleId IdType="pubmed">12345678</ArticleId>
        <ArticleId IdType="doi">10.1000/jds.2023.0042</ArticleId>
        <ArticleId IdType="pmc">PMC9876543</ArticleId>
      </ArticleIdList>
    </PubmedData>
  </PubmedArticle>
</PubmedArticleSet>
`;

const SAMPLE_SEARCH_RESPONSE = {
  esearchresult: {
    count: '150',
    idlist: ['12345678', '87654321', '11223344'],
  },
};

const EMPTY_ARTICLE_XML = `
<?xml version="1.0" ?>
<PubmedArticleSet>
</PubmedArticleSet>
`;

const MINIMAL_ARTICLE_XML = `
<?xml version="1.0" ?>
<PubmedArticleSet>
  <PubmedArticle>
    <MedlineCitation>
      <PMID>99999999</PMID>
      <Article>
        <ArticleTitle>Minimal Article</ArticleTitle>
      </Article>
    </MedlineCitation>
  </PubmedArticle>
</PubmedArticleSet>
`;

// =============================================================================
// Test Suites
// =============================================================================

describe('PubMed Enricher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  // ===========================================================================
  // searchPubMed
  // ===========================================================================

  describe('searchPubMed', () => {
    it('should search PubMed and return results', async () => {
      // Mock esearch response, then efetch response
      let callCount = 0;
      global.fetch = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // esearch
          return Promise.resolve({
            ok: true,
            json: async () => SAMPLE_SEARCH_RESPONSE,
          });
        } else {
          // efetch
          return Promise.resolve({
            ok: true,
            text: async () => SAMPLE_ARTICLE_XML,
          });
        }
      });

      const result = await searchPubMed('GLP-1 cardiovascular safety');

      expect(result.query).toBe('GLP-1 cardiovascular safety');
      expect(result.count).toBe(150);
      expect(result.pmids).toHaveLength(3);
      expect(result.pmids).toContain('12345678');
    });

    it('should return empty results on search failure', async () => {
      global.fetch = mockFetchResponse({}, false, 500);

      const result = await searchPubMed('failing query');

      expect(result.count).toBe(0);
      expect(result.pmids).toHaveLength(0);
      expect(result.articles).toHaveLength(0);
    });

    it('should respect maxResults option', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ esearchresult: { count: '5', idlist: ['1'] } }),
      });

      await searchPubMed('test', { maxResults: 5 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('retmax=5')
      );
    });

    it('should include API key when provided', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ esearchresult: { count: '0', idlist: [] } }),
      });

      await searchPubMed('test', { apiKey: 'test-api-key' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api_key=test-api-key')
      );
    });
  });

  // ===========================================================================
  // fetchArticlesByPMID
  // ===========================================================================

  describe('fetchArticlesByPMID', () => {
    it('should fetch article details by PMID', async () => {
      global.fetch = mockFetchResponse(SAMPLE_ARTICLE_XML);

      const articles = await fetchArticlesByPMID('12345678');

      expect(articles).toHaveLength(1);
      expect(articles[0].pmid).toBe('12345678');
      expect(articles[0].title).toBe(
        'Cardiovascular Safety of GLP-1 Receptor Agonists: A Systematic Review'
      );
    });

    it('should handle multiple PMIDs', async () => {
      global.fetch = mockFetchResponse(SAMPLE_ARTICLE_XML);

      const _articles = await fetchArticlesByPMID(['12345678', '87654321']);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('id=12345678%2C87654321')
      );
    });

    it('should return empty array for empty PMID list', async () => {
      const articles = await fetchArticlesByPMID([]);
      expect(articles).toHaveLength(0);
    });

    it('should parse all article fields correctly', async () => {
      global.fetch = mockFetchResponse(SAMPLE_ARTICLE_XML);

      const [article] = await fetchArticlesByPMID('12345678');

      // Basic fields
      expect(article.pmid).toBe('12345678');
      expect(article.doi).toBe('10.1000/jds.2023.0042');
      expect(article.pmc).toBe('PMC9876543');

      // Journal
      expect(article.journal.name).toBe('Journal of Drug Safety');
      expect(article.journal.abbreviation).toBe('J Drug Saf');
      expect(article.journal.issn).toBe('1234-5678');

      // Publication
      expect(article.publication.year).toBe(2023);
      expect(article.publication.month).toBe('Mar');
      expect(article.publication.volume).toBe('45');
      expect(article.publication.issue).toBe('3');
      expect(article.publication.pages).toBe('123-145');

      // Authors
      expect(article.authors).toHaveLength(2);
      expect(article.authors[0].lastName).toBe('Smith');
      expect(article.authors[0].foreName).toBe('John A');
      expect(article.authors[1].orcid).toBe('0000-0001-2345-6789');

      // MeSH terms
      expect(article.meshTerms).toContain('Cardiovascular Diseases');
      expect(article.meshTerms).toContain('Glucagon-Like Peptide-1 Receptor');

      // Keywords
      expect(article.keywords).toContain('GLP-1');
      expect(article.keywords).toContain('cardiovascular');

      // Publication types
      expect(article.publicationType).toContain('Journal Article');
      expect(article.publicationType).toContain('Review');

      // Abstract
      expect(article.abstract).toContain('GLP-1 receptor agonists');

      // URL
      expect(article.url).toBe('https://pubmed.ncbi.nlm.nih.gov/12345678/');
    });

    it('should handle minimal article data', async () => {
      global.fetch = mockFetchResponse(MINIMAL_ARTICLE_XML);

      const [article] = await fetchArticlesByPMID('99999999');

      expect(article.pmid).toBe('99999999');
      expect(article.title).toBe('Minimal Article');
      expect(article.authors).toHaveLength(0);
      expect(article.meshTerms).toHaveLength(0);
    });

    it('should return empty array on fetch error', async () => {
      global.fetch = mockFetchResponse('', false, 500);

      const articles = await fetchArticlesByPMID('12345678');

      expect(articles).toHaveLength(0);
    });
  });

  // ===========================================================================
  // enrichByPMID
  // ===========================================================================

  describe('enrichByPMID', () => {
    it('should return single article for valid PMID', async () => {
      global.fetch = mockFetchResponse(SAMPLE_ARTICLE_XML);

      const article = await enrichByPMID('12345678');

      expect(article).not.toBeNull();
      expect(article?.pmid).toBe('12345678');
    });

    it('should return null for non-existent PMID', async () => {
      global.fetch = mockFetchResponse(EMPTY_ARTICLE_XML);

      const article = await enrichByPMID('00000000');

      expect(article).toBeNull();
    });
  });

  // ===========================================================================
  // enrichMultiplePMIDs
  // ===========================================================================

  describe('enrichMultiplePMIDs', () => {
    it('should return map of PMID to article', async () => {
      global.fetch = mockFetchResponse(SAMPLE_ARTICLE_XML);

      const result = await enrichMultiplePMIDs(['12345678']);

      expect(result).toBeInstanceOf(Map);
      expect(result.has('12345678')).toBe(true);
      expect(result.get('12345678')?.title).toContain('GLP-1');
    });

    it('should batch large PMID lists', async () => {
      // Create 250 PMIDs (should trigger batching at 200)
      const pmids = Array.from({ length: 250 }, (_, i) => String(10000000 + i));

      global.fetch = mockFetchResponse(SAMPLE_ARTICLE_XML);

      await enrichMultiplePMIDs(pmids, { requestDelay: 0 });

      // Should have made 2 fetch calls (200 + 50)
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  // ===========================================================================
  // searchByDOI
  // ===========================================================================

  describe('searchByDOI', () => {
    it('should search by DOI and return article', async () => {
      let callCount = 0;
      global.fetch = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              esearchresult: { count: '1', idlist: ['12345678'] },
            }),
          });
        } else {
          return Promise.resolve({
            ok: true,
            text: async () => SAMPLE_ARTICLE_XML,
          });
        }
      });

      const article = await searchByDOI('10.1000/jds.2023.0042');

      expect(article).not.toBeNull();
      expect(article?.pmid).toBe('12345678');
    });

    it('should handle DOI with https prefix', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ esearchresult: { count: '0', idlist: [] } }),
      });

      await searchByDOI('https://doi.org/10.1000/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('10.1000%2Ftest')
      );
    });

    it('should return null when DOI not found', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ esearchresult: { count: '0', idlist: [] } }),
      });

      const article = await searchByDOI('10.9999/nonexistent');

      expect(article).toBeNull();
    });
  });

  // ===========================================================================
  // enrichReferences
  // ===========================================================================

  describe('enrichReferences', () => {
    const sampleRefs: ParsedReference[] = [
      {
        id: 'ref-1',
        raw: 'Smith et al. PMID: 12345678',
        structured: {
          authors: ['Smith'],
          title: null,
          year: 2023,
          journal: null,
          volume: null,
          issue: null,
          pages: null,
          doi: null,
          pmid: '12345678',
          url: null,
        },
        confidence: 0.6,
        format: 'vancouver',
        position: { line: 1, section: null },
      },
      {
        id: 'ref-2',
        raw: 'Johnson et al. DOI: 10.1000/test',
        structured: {
          authors: ['Johnson'],
          title: null,
          year: 2022,
          journal: null,
          volume: null,
          issue: null,
          pages: null,
          doi: '10.1000/test',
          pmid: null,
          url: null,
        },
        confidence: 0.5,
        format: 'apa',
        position: { line: 2, section: null },
      },
      {
        id: 'ref-3',
        raw: 'No identifiers here',
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
        confidence: 0.3,
        format: 'unknown',
        position: { line: 3, section: null },
      },
    ];

    it('should enrich references with PMID', async () => {
      global.fetch = mockFetchResponse(SAMPLE_ARTICLE_XML);

      const results = await enrichReferences([sampleRefs[0]], {
        requestDelay: 0,
      });

      expect(results).toHaveLength(1);
      expect(results[0].matched).toBe(true);
      expect(results[0].matchMethod).toBe('pmid');
      expect(results[0].enriched?.title).toContain('GLP-1');
    });

    it('should enrich references with DOI', async () => {
      let callCount = 0;
      global.fetch = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // DOI search
          return Promise.resolve({
            ok: true,
            json: async () => ({
              esearchresult: { count: '1', idlist: ['12345678'] },
            }),
          });
        } else {
          // efetch
          return Promise.resolve({
            ok: true,
            text: async () => SAMPLE_ARTICLE_XML,
          });
        }
      });

      const results = await enrichReferences([sampleRefs[1]], {
        requestDelay: 0,
      });

      expect(results).toHaveLength(1);
      expect(results[0].matched).toBe(true);
      expect(results[0].matchMethod).toBe('doi');
    });

    it('should handle references without identifiers', async () => {
      const results = await enrichReferences([sampleRefs[2]], {
        requestDelay: 0,
      });

      expect(results).toHaveLength(1);
      expect(results[0].matched).toBe(false);
      expect(results[0].matchMethod).toBe('none');
      expect(results[0].enriched).toBeNull();
    });

    it('should preserve original reference in results', async () => {
      global.fetch = mockFetchResponse(SAMPLE_ARTICLE_XML);

      const results = await enrichReferences([sampleRefs[0]], {
        requestDelay: 0,
      });

      expect(results[0].original).toBe(sampleRefs[0]);
    });
  });

  // ===========================================================================
  // pubmedToReference
  // ===========================================================================

  describe('pubmedToReference', () => {
    const sampleArticle: PubMedArticle = {
      pmid: '12345678',
      doi: '10.1000/test',
      title: 'Test Article Title',
      abstract: 'This is an abstract.',
      authors: [
        {
          lastName: 'Smith',
          foreName: 'John',
          initials: 'J',
          affiliation: 'Test University',
          orcid: null,
        },
        {
          lastName: 'Doe',
          foreName: 'Jane',
          initials: 'J',
          affiliation: null,
          orcid: '0000-0001-0000-0000',
        },
      ],
      journal: {
        name: 'Test Journal',
        abbreviation: 'Test J',
        issn: '1234-5678',
      },
      publication: {
        year: 2023,
        month: 'Jan',
        day: '15',
        volume: '10',
        issue: '2',
        pages: '100-110',
      },
      meshTerms: ['Drug Safety', 'Pharmacovigilance'],
      keywords: ['safety', 'drugs'],
      publicationType: ['Journal Article'],
      affiliations: ['Test University'],
      pmc: 'PMC1234567',
      url: 'https://pubmed.ncbi.nlm.nih.gov/12345678/',
    };

    it('should convert PubMed article to ParsedReference', () => {
      const ref = pubmedToReference(sampleArticle);

      expect(ref.id).toBe('pmid-12345678');
      expect(ref.confidence).toBe(1.0); // PubMed data is authoritative
      expect(ref.format).toBe('pubmed');
    });

    it('should include all structured fields', () => {
      const ref = pubmedToReference(sampleArticle);

      expect(ref.structured.authors).toContain('Smith, John');
      expect(ref.structured.authors).toContain('Doe, Jane');
      expect(ref.structured.title).toBe('Test Article Title');
      expect(ref.structured.year).toBe(2023);
      expect(ref.structured.journal).toBe('Test Journal');
      expect(ref.structured.volume).toBe('10');
      expect(ref.structured.issue).toBe('2');
      expect(ref.structured.pages).toBe('100-110');
      expect(ref.structured.doi).toBe('10.1000/test');
      expect(ref.structured.pmid).toBe('12345678');
    });

    it('should generate formatted citation string', () => {
      const ref = pubmedToReference(sampleArticle);

      expect(ref.raw).toContain('Smith');
      expect(ref.raw).toContain('Test Article Title');
      expect(ref.raw).toContain('PMID: 12345678');
    });

    it('should handle "et al." for many authors', () => {
      const manyAuthors: PubMedArticle = {
        ...sampleArticle,
        authors: [
          { lastName: 'A', foreName: null, initials: null, affiliation: null, orcid: null },
          { lastName: 'B', foreName: null, initials: null, affiliation: null, orcid: null },
          { lastName: 'C', foreName: null, initials: null, affiliation: null, orcid: null },
          { lastName: 'D', foreName: null, initials: null, affiliation: null, orcid: null },
        ],
      };

      const ref = pubmedToReference(manyAuthors);

      expect(ref.raw).toContain('A et al.');
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('Edge cases', () => {
    it('should handle network timeout gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network timeout'));

      const result = await searchPubMed('test query');

      expect(result.count).toBe(0);
      expect(result.articles).toHaveLength(0);
    });

    it('should handle malformed XML response', async () => {
      global.fetch = mockFetchResponse('<invalid>xml</notclosed>');

      const articles = await fetchArticlesByPMID('12345678');

      // Should not crash, return empty or partial results
      expect(articles).toBeInstanceOf(Array);
    });

    it('should handle missing optional fields in XML', async () => {
      const xmlWithMissingFields = `
        <PubmedArticleSet>
          <PubmedArticle>
            <MedlineCitation>
              <PMID>11111111</PMID>
              <Article>
                <ArticleTitle>Title Only</ArticleTitle>
              </Article>
            </MedlineCitation>
          </PubmedArticle>
        </PubmedArticleSet>
      `;
      global.fetch = mockFetchResponse(xmlWithMissingFields);

      const [article] = await fetchArticlesByPMID('11111111');

      expect(article.pmid).toBe('11111111');
      expect(article.doi).toBeNull();
      expect(article.abstract).toBeNull();
      expect(article.publication.year).toBeNull();
    });

    it('should handle special characters in search query', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ esearchresult: { count: '0', idlist: [] } }),
      });

      await searchPubMed('GLP-1 (receptor) [agonist]');

      expect(global.fetch).toHaveBeenCalled();
      // Query should be URL-encoded
      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('term=');
    });
  });

  // ===========================================================================
  // Rate Limiting
  // ===========================================================================

  describe('Rate limiting', () => {
    it('should apply delay between batch requests', async () => {
      const pmids = Array.from({ length: 250 }, (_, i) => String(10000000 + i));

      global.fetch = mockFetchResponse(SAMPLE_ARTICLE_XML);

      const start = Date.now();
      await enrichMultiplePMIDs(pmids, { requestDelay: 50 });
      const elapsed = Date.now() - start;

      // Should have waited at least 50ms between the 2 batches
      expect(elapsed).toBeGreaterThanOrEqual(40); // Allow some timing variance
    });
  });
});
