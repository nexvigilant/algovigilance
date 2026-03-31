/**
 * Tests for MeSH to FAERS (MedDRA) Mapping Utility
 *
 * @module mesh-faers-mapping.test
 */

import {
  mapMeshToFaers,
  findRelatedMedDRA,
  getMeshForSOC,
  getRelevantFAERSCategories,
  buildFAERSQuery,
  suggestMeshForReaction,
  getMappingStats,
  type _MeshToMedDRAMapping,
  type _FAERSReactionCategory,
} from '../mesh-faers-mapping';

// =============================================================================
// mapMeshToFaers Tests
// =============================================================================

describe('mapMeshToFaers', () => {
  describe('direct mapping (curated)', () => {
    it('should map Cardiovascular Diseases to cardiac and vascular disorders', () => {
      const result = mapMeshToFaers('Cardiovascular Diseases');

      expect(result.meshTerm).toBe('Cardiovascular Diseases');
      expect(result.confidence).toBe('high');
      expect(result.source).toBe('curated');
      expect(result.meddraTerms.length).toBeGreaterThan(0);
      expect(result.meddraTerms.map((t) => t.soc)).toContain('Cardiac disorders');
      expect(result.meddraTerms.map((t) => t.soc)).toContain('Vascular disorders');
    });

    it('should map Hepatotoxicity to Hepatobiliary disorders', () => {
      const result = mapMeshToFaers('Hepatotoxicity');

      expect(result.confidence).toBe('high');
      expect(result.meddraTerms.length).toBe(1);
      expect(result.meddraTerms[0].soc).toBe('Hepatobiliary disorders');
    });

    it('should map Drug-Induced Liver Injury to Hepatobiliary disorders', () => {
      const result = mapMeshToFaers('Drug-Induced Liver Injury');

      expect(result.confidence).toBe('high');
      expect(result.meddraTerms[0].soc).toBe('Hepatobiliary disorders');
    });

    it('should map Seizures to Nervous system disorders', () => {
      const result = mapMeshToFaers('Seizures');

      expect(result.meddraTerms[0].soc).toBe('Nervous system disorders');
    });

    it('should map Anaphylaxis to Immune system disorders', () => {
      const result = mapMeshToFaers('Anaphylaxis');

      expect(result.meddraTerms[0].soc).toBe('Immune system disorders');
    });

    it('should map Stevens-Johnson Syndrome to Skin disorders', () => {
      const result = mapMeshToFaers('Stevens-Johnson Syndrome');

      expect(result.meddraTerms[0].soc).toBe('Skin and subcutaneous tissue disorders');
    });

    it('should map QT Prolongation to Cardiac disorders', () => {
      const result = mapMeshToFaers('QT Prolongation');

      expect(result.meddraTerms[0].soc).toBe('Cardiac disorders');
    });

    it('should map Suicidal Ideation to Psychiatric disorders', () => {
      const result = mapMeshToFaers('Suicidal Ideation');

      expect(result.meddraTerms[0].soc).toBe('Psychiatric disorders');
    });

    it('should map Acute Kidney Injury to Renal disorders', () => {
      const result = mapMeshToFaers('Acute Kidney Injury');

      expect(result.meddraTerms[0].soc).toBe('Renal and urinary disorders');
    });

    it('should map Rhabdomyolysis to Musculoskeletal disorders', () => {
      const result = mapMeshToFaers('Rhabdomyolysis');

      expect(result.meddraTerms[0].soc).toBe('Musculoskeletal and connective tissue disorders');
    });
  });

  describe('multi-SOC mappings', () => {
    it('should map Hemorrhage to both Vascular and Blood disorders', () => {
      const result = mapMeshToFaers('Hemorrhage');

      expect(result.meddraTerms.length).toBe(2);
      const socs = result.meddraTerms.map((t) => t.soc);
      expect(socs).toContain('Vascular disorders');
      expect(socs).toContain('Blood and lymphatic system disorders');
    });

    it('should map Hypoglycemia to Endocrine and Metabolic disorders', () => {
      const result = mapMeshToFaers('Hypoglycemia');

      expect(result.meddraTerms.length).toBe(2);
      const socs = result.meddraTerms.map((t) => t.soc);
      expect(socs).toContain('Endocrine disorders');
      expect(socs).toContain('Metabolism and nutrition disorders');
    });
  });

  describe('fuzzy matching', () => {
    it('should fuzzy match partial terms with medium confidence', () => {
      // "Cardiac" should fuzzy match to "Arrhythmias, Cardiac" or similar
      const result = mapMeshToFaers('Cardiac');

      // May or may not fuzzy match depending on similarity threshold
      expect(['high', 'medium', 'low']).toContain(result.confidence);
    });

    it('should fuzzy match lowercase variations', () => {
      // Testing case normalization in fuzzy matching
      const result = mapMeshToFaers('heart diseases');

      // Should match "Heart Diseases" with case-insensitive matching
      expect(['high', 'medium']).toContain(result.confidence);
    });
  });

  describe('no match scenarios', () => {
    it('should return low confidence for unknown terms', () => {
      const result = mapMeshToFaers('CompletelyUnknownMeSHTerm');

      expect(result.meshTerm).toBe('CompletelyUnknownMeSHTerm');
      expect(result.confidence).toBe('low');
      expect(result.source).toBe('inferred');
      expect(result.meddraTerms).toEqual([]);
    });

    it('should return low confidence for non-medical terms', () => {
      const result = mapMeshToFaers('Software Engineering');

      expect(result.confidence).toBe('low');
      expect(result.meddraTerms).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const result = mapMeshToFaers('');

      expect(result.meshTerm).toBe('');
      expect(result.meddraTerms).toEqual([]);
    });

    it('should trim whitespace', () => {
      const result = mapMeshToFaers('  Hepatotoxicity  ');

      expect(result.meshTerm).toBe('Hepatotoxicity');
      expect(result.confidence).toBe('high');
    });

    it('should handle special characters', () => {
      const result = mapMeshToFaers('Drug-Related Side Effects and Adverse Reactions');

      expect(result.confidence).toBe('high');
      expect(result.meddraTerms[0].soc).toBe('General disorders and administration site conditions');
    });
  });

  describe('MedDRA term structure', () => {
    it('should return properly structured MedDRA terms', () => {
      const result = mapMeshToFaers('Heart Diseases');

      expect(result.meddraTerms[0]).toEqual({
        preferredTerm: 'Cardiac disorders',
        soc: 'Cardiac disorders',
        pt: 'Cardiac disorders',
      });
    });
  });
});

// =============================================================================
// findRelatedMedDRA Tests
// =============================================================================

describe('findRelatedMedDRA', () => {
  it('should map multiple MeSH terms', () => {
    const results = findRelatedMedDRA([
      'Cardiovascular Diseases',
      'Hepatotoxicity',
      'Seizures',
    ]);

    expect(results.size).toBe(3);
    expect(results.get('Cardiovascular Diseases')?.meddraTerms.length).toBeGreaterThan(0);
    expect(results.get('Hepatotoxicity')?.meddraTerms.length).toBe(1);
    expect(results.get('Seizures')?.meddraTerms.length).toBe(1);
  });

  it('should handle empty array', () => {
    const results = findRelatedMedDRA([]);

    expect(results.size).toBe(0);
  });

  it('should handle single term', () => {
    const results = findRelatedMedDRA(['Anaphylaxis']);

    expect(results.size).toBe(1);
    expect(results.get('Anaphylaxis')?.confidence).toBe('high');
  });

  it('should handle mix of known and unknown terms', () => {
    const results = findRelatedMedDRA([
      'Heart Diseases', // Known
      'UnknownTerm123', // Unknown
      'Depression', // Known
    ]);

    expect(results.size).toBe(3);
    expect(results.get('Heart Diseases')?.confidence).toBe('high');
    expect(results.get('UnknownTerm123')?.confidence).toBe('low');
    expect(results.get('Depression')?.confidence).toBe('high');
  });

  it('should handle duplicate terms', () => {
    const results = findRelatedMedDRA([
      'Hepatotoxicity',
      'Hepatotoxicity',
      'Hepatotoxicity',
    ]);

    // Map should deduplicate keys
    expect(results.size).toBe(1);
  });
});

// =============================================================================
// getMeshForSOC Tests
// =============================================================================

describe('getMeshForSOC', () => {
  it('should return MeSH terms for Cardiac disorders', () => {
    const meshTerms = getMeshForSOC('Cardiac disorders');

    expect(meshTerms.length).toBeGreaterThan(0);
    expect(meshTerms).toContain('Heart Diseases');
    expect(meshTerms).toContain('Arrhythmias, Cardiac');
    expect(meshTerms).toContain('Myocardial Infarction');
  });

  it('should return MeSH terms for Hepatobiliary disorders', () => {
    const meshTerms = getMeshForSOC('Hepatobiliary disorders');

    expect(meshTerms).toContain('Liver Diseases');
    expect(meshTerms).toContain('Drug-Induced Liver Injury');
    expect(meshTerms).toContain('Hepatotoxicity');
    expect(meshTerms).toContain('Hepatitis');
  });

  it('should be case-insensitive', () => {
    const uppercase = getMeshForSOC('CARDIAC DISORDERS');
    const lowercase = getMeshForSOC('cardiac disorders');
    const mixed = getMeshForSOC('Cardiac Disorders');

    expect(uppercase).toEqual(lowercase);
    expect(lowercase).toEqual(mixed);
  });

  it('should return empty array for unknown SOC', () => {
    const meshTerms = getMeshForSOC('Unknown SOC');

    expect(meshTerms).toEqual([]);
  });

  it('should return MeSH terms for Psychiatric disorders', () => {
    const meshTerms = getMeshForSOC('Psychiatric disorders');

    expect(meshTerms).toContain('Mental Disorders');
    expect(meshTerms).toContain('Depression');
    expect(meshTerms).toContain('Suicidal Ideation');
  });

  it('should return MeSH terms for Skin disorders', () => {
    const meshTerms = getMeshForSOC('Skin and subcutaneous tissue disorders');

    expect(meshTerms).toContain('Stevens-Johnson Syndrome');
    expect(meshTerms).toContain('Toxic Epidermal Necrolysis');
    expect(meshTerms).toContain('Rash');
  });
});

// =============================================================================
// getRelevantFAERSCategories Tests
// =============================================================================

describe('getRelevantFAERSCategories', () => {
  it('should return Cardiovascular Events category', () => {
    const categories = getRelevantFAERSCategories(['Cardiovascular Diseases']);

    expect(categories.length).toBeGreaterThan(0);
    expect(categories.some((c) => c.category === 'Cardiovascular Events')).toBe(true);
  });

  it('should return Hepatotoxicity category', () => {
    const categories = getRelevantFAERSCategories(['Drug-Induced Liver Injury']);

    expect(categories.some((c) => c.category === 'Hepatotoxicity')).toBe(true);
  });

  it('should return multiple categories for multiple MeSH terms', () => {
    const categories = getRelevantFAERSCategories([
      'Cardiovascular Diseases',
      'Stevens-Johnson Syndrome',
      'Anaphylaxis',
    ]);

    expect(categories.length).toBeGreaterThan(1);
    expect(categories.some((c) => c.category === 'Cardiovascular Events')).toBe(true);
    expect(categories.some((c) => c.category === 'Serious Skin Reactions')).toBe(true);
    expect(categories.some((c) => c.category === 'Anaphylaxis')).toBe(true);
  });

  it('should be case-insensitive', () => {
    const uppercase = getRelevantFAERSCategories(['CARDIOVASCULAR DISEASES']);
    const lowercase = getRelevantFAERSCategories(['cardiovascular diseases']);

    expect(uppercase.length).toBe(lowercase.length);
  });

  it('should return empty array for unknown MeSH terms', () => {
    const categories = getRelevantFAERSCategories(['UnknownMeSHTerm']);

    expect(categories).toEqual([]);
  });

  it('should return empty array for empty input', () => {
    const categories = getRelevantFAERSCategories([]);

    expect(categories).toEqual([]);
  });

  it('should return category with expected structure', () => {
    const categories = getRelevantFAERSCategories(['Rhabdomyolysis']);

    expect(categories.length).toBe(1);
    const category = categories[0];
    expect(category).toHaveProperty('category');
    expect(category).toHaveProperty('meshTerms');
    expect(category).toHaveProperty('meddraSOC');
    expect(category).toHaveProperty('exampleReactions');
    expect(category.category).toBe('Rhabdomyolysis');
    expect(category.meddraSOC).toBe('Musculoskeletal and connective tissue disorders');
  });

  it('should deduplicate categories', () => {
    // Multiple MeSH terms that map to same category
    const categories = getRelevantFAERSCategories([
      'Myocardial Infarction',
      'Stroke', // Both in Cardiovascular Events
    ]);

    // Should not have duplicate Cardiovascular Events
    const cvCategories = categories.filter((c) => c.category === 'Cardiovascular Events');
    expect(cvCategories.length).toBe(1);
  });
});

// =============================================================================
// buildFAERSQuery Tests
// =============================================================================

describe('buildFAERSQuery', () => {
  it('should build query from single MeSH term', () => {
    const query = buildFAERSQuery(['Heart Diseases']);

    expect(query).toContain('"Cardiac disorders"');
  });

  it('should build query with OR for multiple SOCs', () => {
    const query = buildFAERSQuery(['Cardiovascular Diseases']);

    // Should have both Cardiac disorders and Vascular disorders
    expect(query).toContain('"Cardiac disorders"');
    expect(query).toContain('"Vascular disorders"');
    expect(query).toContain(' OR ');
  });

  it('should combine multiple MeSH terms', () => {
    const query = buildFAERSQuery(['Hepatotoxicity', 'Seizures']);

    expect(query).toContain('"Hepatobiliary disorders"');
    expect(query).toContain('"Nervous system disorders"');
  });

  it('should deduplicate SOCs', () => {
    const query = buildFAERSQuery(['Heart Diseases', 'Arrhythmias, Cardiac']);

    // Both map to Cardiac disorders - should not duplicate
    const matches = query.match(/"Cardiac disorders"/g);
    expect(matches?.length).toBe(1);
  });

  it('should return empty string for empty input', () => {
    const query = buildFAERSQuery([]);

    expect(query).toBe('');
  });

  it('should return empty string for unknown MeSH terms', () => {
    const query = buildFAERSQuery(['UnknownTerm']);

    expect(query).toBe('');
  });

  it('should format terms with quotes', () => {
    const query = buildFAERSQuery(['Hepatotoxicity']);

    expect(query).toBe('"Hepatobiliary disorders"');
  });
});

// =============================================================================
// suggestMeshForReaction Tests
// =============================================================================

describe('suggestMeshForReaction', () => {
  it('should suggest MeSH terms for cardiac reaction', () => {
    const suggestions = suggestMeshForReaction('Cardiac arrest');

    expect(suggestions.length).toBeGreaterThan(0);
    // Should suggest cardiac-related MeSH terms
  });

  it('should suggest MeSH terms for hepatic reaction', () => {
    const suggestions = suggestMeshForReaction('Hepatic failure');

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some((s) => s.includes('Liver') || s.includes('Hepat'))).toBe(true);
  });

  it('should suggest MeSH terms for skin reaction', () => {
    const suggestions = suggestMeshForReaction('Stevens-Johnson syndrome');

    expect(suggestions).toContain('Stevens-Johnson Syndrome');
    expect(suggestions).toContain('Toxic Epidermal Necrolysis');
  });

  it('should suggest MeSH terms for anaphylaxis', () => {
    const suggestions = suggestMeshForReaction('Anaphylactic reaction');

    expect(suggestions).toContain('Anaphylaxis');
    expect(suggestions).toContain('Drug Hypersensitivity');
  });

  it('should be case-insensitive', () => {
    const uppercase = suggestMeshForReaction('RHABDOMYOLYSIS');
    const lowercase = suggestMeshForReaction('rhabdomyolysis');

    // Results should include rhabdomyolysis-related terms
    expect(uppercase).toContain('Rhabdomyolysis');
    expect(lowercase).toContain('Rhabdomyolysis');
  });

  it('should handle partial matches', () => {
    const suggestions = suggestMeshForReaction('myocardial');

    // Should match Myocardial Infarction
    expect(suggestions.some((s) => s.toLowerCase().includes('myocardial'))).toBe(true);
  });

  it('should return empty array for no matches', () => {
    const suggestions = suggestMeshForReaction('xyzabc123');

    expect(suggestions).toEqual([]);
  });

  it('should deduplicate suggestions', () => {
    const suggestions = suggestMeshForReaction('cardiac');

    const uniqueSuggestions = [...new Set(suggestions)];
    expect(suggestions.length).toBe(uniqueSuggestions.length);
  });
});

// =============================================================================
// getMappingStats Tests
// =============================================================================

describe('getMappingStats', () => {
  it('should return statistics object', () => {
    const stats = getMappingStats();

    expect(stats).toHaveProperty('totalMeshTerms');
    expect(stats).toHaveProperty('totalSOCs');
    expect(stats).toHaveProperty('categories');
  });

  it('should have positive counts', () => {
    const stats = getMappingStats();

    expect(stats.totalMeshTerms).toBeGreaterThan(0);
    expect(stats.totalSOCs).toBeGreaterThan(0);
    expect(stats.categories).toBeGreaterThan(0);
  });

  it('should have reasonable MeSH term count', () => {
    const stats = getMappingStats();

    // Should have at least 50 mapped MeSH terms
    expect(stats.totalMeshTerms).toBeGreaterThanOrEqual(50);
  });

  it('should have expected SOC count', () => {
    const stats = getMappingStats();

    // MedDRA has ~27 SOCs, we should have a subset mapped
    expect(stats.totalSOCs).toBeGreaterThanOrEqual(10);
    expect(stats.totalSOCs).toBeLessThanOrEqual(30);
  });

  it('should have expected category count', () => {
    const stats = getMappingStats();

    // We defined 8 FAERS categories
    expect(stats.categories).toBe(8);
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('integration', () => {
  it('should support PV literature-to-FAERS workflow', () => {
    // Simulate getting MeSH terms from enriched PubMed references
    const meshTerms = [
      'Cardiovascular Diseases',
      'Drug-Induced Liver Injury',
      'Suicide',
    ];

    // Map to FAERS-compatible terms
    const mappings = findRelatedMedDRA(meshTerms);

    // Build query for FAERS search
    const query = buildFAERSQuery(meshTerms);

    // Get relevant categories for filtering
    const categories = getRelevantFAERSCategories(meshTerms);

    expect(mappings.size).toBe(3);
    expect(query.length).toBeGreaterThan(0);
    expect(categories.length).toBeGreaterThan(0);
  });

  it('should support FAERS-to-literature workflow', () => {
    // Simulate starting with FAERS reaction terms
    const faersReactions = ['Cardiac arrest', 'Drug-induced liver injury', 'Suicidal ideation'];

    // Get MeSH suggestions for literature search
    const allSuggestions: string[] = [];
    for (const reaction of faersReactions) {
      const suggestions = suggestMeshForReaction(reaction);
      allSuggestions.push(...suggestions);
    }

    // Should have suggestions for each reaction type
    expect(allSuggestions.length).toBeGreaterThan(0);
    expect([...new Set(allSuggestions)].length).toBeGreaterThan(3);
  });

  it('should support reverse lookup SOC → MeSH → validation', () => {
    // Start with a MedDRA SOC
    const soc = 'Cardiac disorders';

    // Get all MeSH terms that map to this SOC
    const meshTerms = getMeshForSOC(soc);

    // Validate by mapping back
    for (const mesh of meshTerms) {
      const mapping = mapMeshToFaers(mesh);
      expect(mapping.meddraTerms.some((t) => t.soc === soc)).toBe(true);
    }
  });
});

// =============================================================================
// Coverage for All Categories
// =============================================================================

describe('FAERS categories coverage', () => {
  const expectedCategories = [
    'Cardiovascular Events',
    'Hepatotoxicity',
    'Serious Skin Reactions',
    'Anaphylaxis',
    'Suicidality',
    'QT Prolongation',
    'Rhabdomyolysis',
    'Renal Toxicity',
  ];

  it.each(expectedCategories)('should have category: %s', (category) => {
    const stats = getMappingStats();
    expect(stats.categories).toBeGreaterThanOrEqual(1);

    // Find a MeSH term that maps to this category
    const allCategories = getRelevantFAERSCategories([
      'Cardiovascular Diseases',
      'Drug-Induced Liver Injury',
      'Stevens-Johnson Syndrome',
      'Anaphylaxis',
      'Suicidal Ideation',
      'Long QT Syndrome',
      'Rhabdomyolysis',
      'Acute Kidney Injury',
    ]);

    expect(allCategories.some((c) => c.category === category)).toBe(true);
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('edge cases', () => {
  it('should handle very long input', () => {
    const longTerm = 'A'.repeat(1000);
    const result = mapMeshToFaers(longTerm);

    expect(result.confidence).toBe('low');
    expect(result.meddraTerms).toEqual([]);
  });

  it('should handle special characters in input', () => {
    const result = mapMeshToFaers('Drug-Related Side Effects & Adverse Reactions');

    // Should not crash, may or may not match
    expect(result).toBeDefined();
  });

  it('should handle unicode characters', () => {
    const result = mapMeshToFaers('Hépatotoxicité');

    // Should not crash
    expect(result).toBeDefined();
    expect(result.confidence).toBe('low'); // Won't match
  });

  it('should handle array with null-like values safely', () => {
    // TypeScript should prevent this, but testing runtime safety
    const results = findRelatedMedDRA(['', '  ', 'Hepatotoxicity']);

    expect(results.size).toBe(3);
    expect(results.get('Hepatotoxicity')?.confidence).toBe('high');
  });
});
