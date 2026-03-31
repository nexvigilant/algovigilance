/**
 * Terminology Adapter Tests
 */

import {
  createTerminologyAdapter,
  createBilingualAdapter,
  mergeAdapters,
} from '../../tools/algorithms/terminology-adapter';

// =============================================================================
// Test Fixtures
// =============================================================================

type TestDomain = 'technical' | 'business' | 'customer';

const createTestAdapter = () => {
  return createTerminologyAdapter<TestDomain>({
    domains: ['technical', 'business', 'customer'],
    defaultDomain: 'customer',
    translations: [
      {
        term: 'API rate limit',
        aliases: ['rate limiting', 'throttling'],
        translations: {
          technical: 'HTTP 429 Rate Limit Exceeded',
          business: 'API usage quota reached',
          customer: 'Too many requests, please wait',
        },
      },
      {
        term: 'database migration',
        translations: {
          technical: 'Schema migration with zero-downtime deployment',
          business: 'System upgrade in progress',
          customer: 'We are improving our service',
        },
      },
      {
        term: 'authentication failure',
        translations: {
          technical: 'Auth token invalid or expired (401)',
          business: 'User session ended',
          customer: 'Please sign in again',
          default: 'Login required',
        },
      },
    ],
    analogies: [
      {
        conceptId: 'api_concept',
        conceptName: 'API Communication',
        analogies: {
          technical: 'REST endpoints with JSON payloads',
          business: 'System-to-system messaging',
          customer: 'Apps talking to each other',
        },
      },
    ],
    fuzzyMatch: true,
    fuzzyThreshold: 0.6,
  });
};

// =============================================================================
// translate Tests
// =============================================================================

describe('translate()', () => {
  it('translates term to specified domain', () => {
    const adapter = createTestAdapter();

    expect(adapter.translate('API rate limit', 'technical')).toBe('HTTP 429 Rate Limit Exceeded');
    expect(adapter.translate('API rate limit', 'business')).toBe('API usage quota reached');
    expect(adapter.translate('API rate limit', 'customer')).toBe('Too many requests, please wait');
  });

  it('uses default domain when none specified', () => {
    const adapter = createTestAdapter();

    // Default is 'customer'
    expect(adapter.translate('API rate limit')).toBe('Too many requests, please wait');
  });

  it('finds term by alias', () => {
    const adapter = createTestAdapter();

    expect(adapter.translate('rate limiting', 'technical')).toBe('HTTP 429 Rate Limit Exceeded');
    expect(adapter.translate('throttling', 'business')).toBe('API usage quota reached');
  });

  it('is case insensitive', () => {
    const adapter = createTestAdapter();

    expect(adapter.translate('API RATE LIMIT', 'technical')).toBe('HTTP 429 Rate Limit Exceeded');
    expect(adapter.translate('api rate limit', 'technical')).toBe('HTTP 429 Rate Limit Exceeded');
  });

  it('returns original term if no translation found', () => {
    const adapter = createTestAdapter();

    expect(adapter.translate('unknown term', 'technical')).toBe('unknown term');
  });

  it('falls back to default translation', () => {
    const adapter = createTestAdapter();

    // 'authentication failure' has a default translation
    // If we ask for a domain without specific translation, it should use default
    expect(adapter.translate('authentication failure', 'customer')).toBe('Please sign in again');
  });

  it('uses fuzzy matching for similar terms', () => {
    const adapter = createTestAdapter();

    // 'API rate limits' is similar to 'API rate limit'
    const result = adapter.translate('API rate limits', 'technical');

    // Should fuzzy match to 'API rate limit'
    expect(result).toBe('HTTP 429 Rate Limit Exceeded');
  });
});

// =============================================================================
// getAllTranslations Tests
// =============================================================================

describe('getAllTranslations()', () => {
  it('returns all translations for a term', () => {
    const adapter = createTestAdapter();

    const translations = adapter.getAllTranslations('API rate limit');

    expect(translations).not.toBeNull();
    expect(translations?.technical).toBe('HTTP 429 Rate Limit Exceeded');
    expect(translations?.business).toBe('API usage quota reached');
    expect(translations?.customer).toBe('Too many requests, please wait');
  });

  it('returns null for unknown term', () => {
    const adapter = createTerminologyAdapter<TestDomain>({
      domains: ['technical', 'business', 'customer'],
      defaultDomain: 'customer',
      translations: [],
      fuzzyMatch: false,
    });

    const translations = adapter.getAllTranslations('completely unknown');
    expect(translations).toBeNull();
  });
});

// =============================================================================
// getAnalogy Tests
// =============================================================================

describe('getAnalogy()', () => {
  it('returns analogy for concept in domain', () => {
    const adapter = createTestAdapter();

    expect(adapter.getAnalogy('api_concept', 'technical')).toBe('REST endpoints with JSON payloads');
    expect(adapter.getAnalogy('api_concept', 'customer')).toBe('Apps talking to each other');
  });

  it('returns null for unknown concept', () => {
    const adapter = createTestAdapter();

    expect(adapter.getAnalogy('unknown_concept', 'technical')).toBeNull();
  });

  it('returns null if domain has no analogy', () => {
    const adapter = createTerminologyAdapter<TestDomain>({
      domains: ['technical', 'business', 'customer'],
      defaultDomain: 'customer',
      translations: [],
      analogies: [
        {
          conceptId: 'partial',
          conceptName: 'Partial',
          analogies: {
            technical: 'Only technical analogy',
          },
        },
      ],
    });

    expect(adapter.getAnalogy('partial', 'customer')).toBeNull();
  });
});

// =============================================================================
// transformTemplate Tests
// =============================================================================

describe('transformTemplate()', () => {
  it('selects domain-specific template text', () => {
    const adapter = createTestAdapter();

    const result = adapter.transformTemplate(
      {
        technical: 'Technical message',
        business: 'Business message',
        customer: 'Customer message',
      },
      'technical'
    );

    expect(result).toBe('Technical message');
  });

  it('uses default when domain not available', () => {
    const adapter = createTestAdapter();

    const result = adapter.transformTemplate(
      {
        default: 'Default message',
      },
      'technical'
    );

    expect(result).toBe('Default message');
  });

  it('uses default domain when none specified', () => {
    const adapter = createTestAdapter();

    const result = adapter.transformTemplate({
      technical: 'Technical',
      business: 'Business',
      customer: 'Customer',
    });

    // Default domain is 'customer'
    expect(result).toBe('Customer');
  });
});

// =============================================================================
// hasTranslation Tests
// =============================================================================

describe('hasTranslation()', () => {
  it('returns true for known term', () => {
    const adapter = createTestAdapter();

    expect(adapter.hasTranslation('API rate limit')).toBe(true);
    expect(adapter.hasTranslation('database migration')).toBe(true);
  });

  it('returns true for alias', () => {
    const adapter = createTestAdapter();

    expect(adapter.hasTranslation('throttling')).toBe(true);
  });

  it('returns false for unknown term (with fuzzy off)', () => {
    const adapter = createTerminologyAdapter<TestDomain>({
      domains: ['technical', 'business', 'customer'],
      defaultDomain: 'customer',
      translations: [{ term: 'known', translations: { default: 'Known' } }],
      fuzzyMatch: false,
    });

    expect(adapter.hasTranslation('unknown')).toBe(false);
  });
});

// =============================================================================
// getTerms and getConcepts Tests
// =============================================================================

describe('getTerms()', () => {
  it('returns all registered terms', () => {
    const adapter = createTestAdapter();
    const terms = adapter.getTerms();

    expect(terms).toContain('api rate limit');
    expect(terms).toContain('database migration');
    expect(terms).toContain('authentication failure');
    expect(terms.length).toBe(3);
  });
});

describe('getConcepts()', () => {
  it('returns all registered concept IDs', () => {
    const adapter = createTestAdapter();
    const concepts = adapter.getConcepts();

    expect(concepts).toContain('api_concept');
  });
});

// =============================================================================
// addTranslation Tests
// =============================================================================

describe('addTranslation()', () => {
  it('adds new translation at runtime', () => {
    const adapter = createTestAdapter();

    adapter.addTranslation({
      term: 'new feature',
      translations: {
        technical: 'Feature flag enabled',
        customer: 'New option available',
      },
    });

    expect(adapter.translate('new feature', 'technical')).toBe('Feature flag enabled');
  });
});

// =============================================================================
// addAnalogy Tests
// =============================================================================

describe('addAnalogy()', () => {
  it('adds new analogy at runtime', () => {
    const adapter = createTestAdapter();

    adapter.addAnalogy({
      conceptId: 'new_concept',
      conceptName: 'New Concept',
      analogies: {
        technical: 'Technical analogy',
        customer: 'Customer analogy',
      },
    });

    expect(adapter.getAnalogy('new_concept', 'technical')).toBe('Technical analogy');
  });
});

// =============================================================================
// createBilingualAdapter Tests
// =============================================================================

describe('createBilingualAdapter()', () => {
  it('creates adapter with two domains', () => {
    const adapter = createBilingualAdapter('en', 'es', {
      hello: 'hola',
      goodbye: 'adiós',
    });

    expect(adapter.translate('hello', 'es')).toBe('hola');
    expect(adapter.translate('goodbye', 'es')).toBe('adiós');
  });

  it('returns original in source domain', () => {
    const adapter = createBilingualAdapter('en', 'es', {
      hello: 'hola',
    });

    expect(adapter.translate('hello', 'en')).toBe('hello');
  });
});

// =============================================================================
// mergeAdapters Tests
// =============================================================================

describe('mergeAdapters()', () => {
  it('combines translations from multiple adapters', () => {
    const adapter1 = createTerminologyAdapter<TestDomain>({
      domains: ['technical', 'business', 'customer'],
      defaultDomain: 'customer',
      translations: [
        { term: 'term1', translations: { technical: 'Tech 1' } },
      ],
    });

    const adapter2 = createTerminologyAdapter<TestDomain>({
      domains: ['technical', 'business', 'customer'],
      defaultDomain: 'customer',
      translations: [
        { term: 'term2', translations: { technical: 'Tech 2' } },
      ],
    });

    const merged = mergeAdapters([adapter1, adapter2], {
      domains: ['technical', 'business', 'customer'],
      defaultDomain: 'customer',
    });

    expect(merged.translate('term1', 'technical')).toBe('Tech 1');
    expect(merged.translate('term2', 'technical')).toBe('Tech 2');
  });
});
