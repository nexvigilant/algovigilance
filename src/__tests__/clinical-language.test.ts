/**
 * Clinical Language Service Tests
 *
 * Tests for the PV-to-clinical language translation service.
 * Verifies that healthcare professionals see terminology
 * familiar to their domain.
 */

import {
  clinicalLanguageService,
  translateTerm,
  getClinicalAnalogy,
  transformToClinicaLanguage,
  TRANSLATION_MAP,
  ANALOGY_MAP,
} from '@/lib/clinical-language';
import type { ClinicalDomain } from '@/types/clinical-pathways';

describe('ClinicalLanguageService', () => {
  describe('translate()', () => {
    it('translates "causality assessment" for pharmacist domain', () => {
      const result = clinicalLanguageService.translate('causality assessment', 'pharmacist');
      expect(result).toBe('likelihood the drug caused this');
    });

    it('translates "causality assessment" for nurse domain', () => {
      const result = clinicalLanguageService.translate('causality assessment', 'nurse');
      expect(result).toBe('whether the medication caused the reaction');
    });

    it('translates "causality assessment" for physician domain', () => {
      const result = clinicalLanguageService.translate('causality assessment', 'physician');
      expect(result).toBe('causal relationship determination');
    });

    it('translates "adverse event" differently per domain', () => {
      expect(clinicalLanguageService.translate('adverse event', 'pharmacist'))
        .toBe('unwanted drug reaction');
      expect(clinicalLanguageService.translate('adverse event', 'nurse'))
        .toBe('medication side effect');
      expect(clinicalLanguageService.translate('adverse event', 'physician'))
        .toBe('adverse drug reaction');
    });

    it('falls back to default when domain-specific translation missing', () => {
      // qa_specialist may not have all translations, should fall back
      const result = clinicalLanguageService.translate('adverse event', 'qa_specialist');
      // Should get the qa_specialist translation if it exists, otherwise default
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });

    it('returns original term when no translation exists', () => {
      const unknownTerm = 'xyz_unknown_term_123';
      const result = clinicalLanguageService.translate(unknownTerm, 'pharmacist');
      expect(result).toBe(unknownTerm);
    });

    it('handles case-insensitive matching', () => {
      expect(clinicalLanguageService.translate('ADVERSE EVENT', 'pharmacist'))
        .toBe('unwanted drug reaction');
      expect(clinicalLanguageService.translate('Adverse Event', 'nurse'))
        .toBe('medication side effect');
    });
  });

  describe('getAnalogy()', () => {
    it('returns pharmacist analogy for case_triage', () => {
      const result = clinicalLanguageService.getAnalogy('case_triage', 'pharmacist');
      expect(result).toContain('DUR flags');
    });

    it('returns nurse analogy for case_triage', () => {
      const result = clinicalLanguageService.getAnalogy('case_triage', 'nurse');
      expect(result).toContain('triaging');
      expect(result).toContain('ED');
    });

    it('returns physician analogy for case_triage', () => {
      const result = clinicalLanguageService.getAnalogy('case_triage', 'physician');
      expect(result).toContain('differential');
    });

    it('returns empty string for unknown concept', () => {
      const result = clinicalLanguageService.getAnalogy('unknown_concept', 'pharmacist');
      expect(result).toBe('');
    });

    it('falls back to default analogy when domain-specific missing', () => {
      // regulatory_affairs may not have specific analogies
      const result = clinicalLanguageService.getAnalogy('case_triage', 'regulatory_affairs');
      // Should get something (default fallback)
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('transformPrompt()', () => {
    it('transforms multiple PV terms in a single prompt', () => {
      const prompt = 'Please complete the causality assessment for this adverse event.';
      const result = clinicalLanguageService.transformPrompt(prompt, 'pharmacist');

      expect(result).toContain('likelihood the drug caused this');
      expect(result).toContain('unwanted drug reaction');
      expect(result).not.toContain('causality assessment');
      expect(result).not.toContain('adverse event');
    });

    it('preserves non-PV terms unchanged', () => {
      const prompt = 'Please describe what happened to the patient.';
      const result = clinicalLanguageService.transformPrompt(prompt, 'pharmacist');

      expect(result).toBe(prompt); // No PV terms to translate
    });

    it('handles empty prompts', () => {
      const result = clinicalLanguageService.transformPrompt('', 'pharmacist');
      expect(result).toBe('');
    });

    it('transforms different terms per domain', () => {
      const prompt = 'Document the dechallenge and outcome.';

      const pharmacistResult = clinicalLanguageService.transformPrompt(prompt, 'pharmacist');
      const nurseResult = clinicalLanguageService.transformPrompt(prompt, 'nurse');

      expect(pharmacistResult).toContain('what happened when the drug was stopped');
      expect(nurseResult).toContain('result of discontinuing the medication');
    });
  });

  describe('hasTranslation()', () => {
    it('returns true for known terms', () => {
      expect(clinicalLanguageService.hasTranslation('adverse event')).toBe(true);
      expect(clinicalLanguageService.hasTranslation('causality assessment')).toBe(true);
      expect(clinicalLanguageService.hasTranslation('dechallenge')).toBe(true);
    });

    it('returns false for unknown terms', () => {
      expect(clinicalLanguageService.hasTranslation('random_unknown')).toBe(false);
    });

    it('handles case-insensitive check', () => {
      expect(clinicalLanguageService.hasTranslation('ADVERSE EVENT')).toBe(true);
      expect(clinicalLanguageService.hasTranslation('Dechallenge')).toBe(true);
    });
  });

  describe('getTranslationEntry()', () => {
    it('returns full entry for known terms', () => {
      const entry = clinicalLanguageService.getTranslationEntry('adverse event');

      expect(entry).toBeDefined();
      expect(entry?.pvTerm).toBe('adverse event');
      expect(entry?.translations.pharmacist).toBe('unwanted drug reaction');
      expect(entry?.translations.nurse).toBe('medication side effect');
    });

    it('returns undefined for unknown terms', () => {
      const entry = clinicalLanguageService.getTranslationEntry('unknown_term');
      expect(entry).toBeUndefined();
    });
  });

  describe('getAnalogyEntry()', () => {
    it('returns full entry for known concepts', () => {
      const entry = clinicalLanguageService.getAnalogyEntry('case_triage');

      expect(entry).toBeDefined();
      expect(entry?.conceptId).toBe('case_triage');
      expect(entry?.analogies.pharmacist).toContain('DUR');
    });

    it('returns undefined for unknown concepts', () => {
      const entry = clinicalLanguageService.getAnalogyEntry('unknown_concept');
      expect(entry).toBeUndefined();
    });
  });
});

describe('Convenience Functions', () => {
  describe('translateTerm()', () => {
    it('works as shorthand for service.translate()', () => {
      const result = translateTerm('adverse event', 'pharmacist');
      expect(result).toBe('unwanted drug reaction');
    });
  });

  describe('getClinicalAnalogy()', () => {
    it('works as shorthand for service.getAnalogy()', () => {
      const result = getClinicalAnalogy('seriousness_assessment', 'nurse');
      expect(result).toContain('immediate intervention');
    });
  });

  describe('transformToClinicaLanguage()', () => {
    it('works as shorthand for service.transformPrompt()', () => {
      const result = transformToClinicaLanguage(
        'Report this adverse event',
        'pharmacist'
      );
      expect(result).toContain('unwanted drug reaction');
    });
  });
});

describe('Translation Coverage', () => {
  const _domains: ClinicalDomain[] = [
    'pharmacist',
    'nurse',
    'physician',
    'qa_specialist',
    'regulatory_affairs',
    'medical_writer',
  ];

  it('has translations in the map', () => {
    expect(TRANSLATION_MAP.size).toBeGreaterThan(30);
  });

  it('has analogies in the map', () => {
    expect(ANALOGY_MAP.size).toBeGreaterThan(10);
  });

  it('covers key PV terms', () => {
    const keyTerms = [
      'adverse event',
      'causality assessment',
      'seriousness criteria',
      'dechallenge',
      'rechallenge',
      'onset date',
      'outcome',
      'suspect drug',
      'concomitant medications',
    ];

    for (const term of keyTerms) {
      expect(TRANSLATION_MAP.has(term)).toBe(true);
    }
  });

  it('covers key workflow analogies', () => {
    const keyAnalogies = [
      'case_triage',
      'seriousness_assessment',
      'causality_assessment',
      'drug_identification',
      'event_description',
    ];

    for (const analogy of keyAnalogies) {
      expect(ANALOGY_MAP.has(analogy)).toBe(true);
    }
  });

  it('provides translations for primary domains (pharmacist, nurse, physician)', () => {
    const primaryDomains: ClinicalDomain[] = ['pharmacist', 'nurse', 'physician'];
    const sampleTerms = ['adverse event', 'causality assessment', 'dechallenge'];

    for (const term of sampleTerms) {
      for (const domain of primaryDomains) {
        const translation = clinicalLanguageService.translate(term, domain);
        // Should get a domain-specific translation, not the original term
        expect(translation).not.toBe(term);
        expect(translation.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('Edge Cases', () => {
  it('handles terms with special characters', () => {
    // ICSR contains no special regex characters, but test the pattern
    const result = clinicalLanguageService.translate('ICSR', 'pharmacist');
    expect(result).toBe('drug reaction report');
  });

  it('handles long prompts with multiple translations', () => {
    const longPrompt = `
      Please complete the causality assessment for this adverse event.
      Document the suspect drug and any concomitant medications.
      Record the onset date and outcome.
      Was there a dechallenge? What about rechallenge?
    `;

    const result = clinicalLanguageService.transformPrompt(longPrompt, 'pharmacist');

    // All key terms should be translated
    expect(result).not.toContain('causality assessment');
    expect(result).not.toContain('adverse event');
    expect(result).not.toContain('suspect drug');
    expect(result).not.toContain('concomitant medications');
    expect(result).not.toContain('dechallenge');
    expect(result).not.toContain('rechallenge');
  });

  it('does not double-translate terms', () => {
    // If a translation contains another PV term, it shouldn't be re-translated
    const prompt = 'adverse event';
    const result = clinicalLanguageService.transformPrompt(prompt, 'pharmacist');

    // "unwanted drug reaction" contains "drug" but shouldn't trigger further translation
    expect(result).toBe('unwanted drug reaction');
  });
});
