/**
 * Clinical Language Service
 *
 * Transforms PV/regulatory terminology into clinical language that
 * healthcare professionals understand and use daily.
 *
 * Usage:
 * ```typescript
 * import { clinicalLanguageService } from '@/lib/clinical-language';
 *
 * // Translate a single term
 * const text = clinicalLanguageService.translate('causality assessment', 'pharmacist');
 * // → "likelihood the drug caused this"
 *
 * // Get a clinical analogy
 * const analogy = clinicalLanguageService.getAnalogy('case_triage', 'nurse');
 * // → "Like triaging a patient in the ED..."
 *
 * // Transform a complete prompt
 * const prompt = clinicalLanguageService.transformPrompt(
 *   'Please complete the causality assessment for this adverse event.',
 *   'pharmacist'
 * );
 * // → "Please complete the likelihood the drug caused this for this unwanted drug reaction."
 * ```
 */

import type { ClinicalDomain } from '@/types/clinical-pathways';
import { TRANSLATION_MAP, type TranslationEntry } from './translations';
import { ANALOGY_MAP, type AnalogyEntry } from './analogies';

export { CLINICAL_TRANSLATIONS, TRANSLATION_MAP } from './translations';
export { CLINICAL_ANALOGIES, ANALOGY_MAP } from './analogies';
export type { TranslationEntry } from './translations';
export type { AnalogyEntry } from './analogies';

/**
 * Clinical Language Service
 *
 * Provides methods to translate PV terminology to clinical language
 * based on the user's healthcare domain.
 */
export interface ClinicalLanguageService {
  /**
   * Translate a single PV term to clinical language
   *
   * @param term - The PV/regulatory term to translate
   * @param domain - The user's clinical domain
   * @returns The clinical translation, or original term if not found
   */
  translate(term: string, domain: ClinicalDomain): string;

  /**
   * Get a clinical analogy for a PV concept
   *
   * @param conceptId - The concept identifier
   * @param domain - The user's clinical domain
   * @returns The clinical analogy, or empty string if not found
   */
  getAnalogy(conceptId: string, domain: ClinicalDomain): string;

  /**
   * Transform a complete text, replacing all PV terms with clinical language
   *
   * @param text - The text containing PV terms
   * @param domain - The user's clinical domain
   * @returns The transformed text with all terms translated
   */
  transformPrompt(text: string, domain: ClinicalDomain): string;

  /**
   * Check if a term has a translation available
   *
   * @param term - The term to check
   * @returns True if translation exists
   */
  hasTranslation(term: string): boolean;

  /**
   * Get all available translations for a term
   *
   * @param term - The term to look up
   * @returns The translation entry, or undefined if not found
   */
  getTranslationEntry(term: string): TranslationEntry | undefined;

  /**
   * Get all available analogies for a concept
   *
   * @param conceptId - The concept identifier
   * @returns The analogy entry, or undefined if not found
   */
  getAnalogyEntry(conceptId: string): AnalogyEntry | undefined;
}

/**
 * Get the best translation for a domain
 */
function getTranslation(entry: TranslationEntry, domain: ClinicalDomain): string {
  // Try domain-specific first
  const domainTranslation = entry.translations[domain];
  if (domainTranslation) {
    return domainTranslation;
  }

  // Fall back to default
  const defaultTranslation = entry.translations.default;
  if (defaultTranslation) {
    return defaultTranslation;
  }

  // Return original term if no translation found
  return entry.pvTerm;
}

/**
 * Get the best analogy for a domain
 */
function getAnalogy(entry: AnalogyEntry, domain: ClinicalDomain): string {
  // Try domain-specific first
  const domainAnalogy = entry.analogies[domain];
  if (domainAnalogy) {
    return domainAnalogy;
  }

  // Fall back to default
  const defaultAnalogy = entry.analogies.default;
  if (defaultAnalogy) {
    return defaultAnalogy;
  }

  return '';
}

/**
 * Create a clinical language service instance
 */
function createClinicalLanguageService(): ClinicalLanguageService {
  return {
    translate(term: string, domain: ClinicalDomain): string {
      const entry = TRANSLATION_MAP.get(term.toLowerCase());
      if (!entry) {
        return term;
      }
      return getTranslation(entry, domain);
    },

    getAnalogy(conceptId: string, domain: ClinicalDomain): string {
      const entry = ANALOGY_MAP.get(conceptId);
      if (!entry) {
        return '';
      }
      return getAnalogy(entry, domain);
    },

    transformPrompt(text: string, domain: ClinicalDomain): string {
      let result = text;

      // Sort terms by length (longest first) to avoid partial replacements
      const sortedTerms = Array.from(TRANSLATION_MAP.keys()).sort(
        (a, b) => b.length - a.length
      );

      for (const term of sortedTerms) {
        const entry = TRANSLATION_MAP.get(term);
        if (!entry) continue;

        const translation = getTranslation(entry, domain);
        if (translation === entry.pvTerm) continue;

        // Case-insensitive replacement while preserving boundaries
        const regex = new RegExp(`\\b${escapeRegex(term)}\\b`, 'gi');
        result = result.replace(regex, translation);
      }

      return result;
    },

    hasTranslation(term: string): boolean {
      return TRANSLATION_MAP.has(term.toLowerCase());
    },

    getTranslationEntry(term: string): TranslationEntry | undefined {
      return TRANSLATION_MAP.get(term.toLowerCase());
    },

    getAnalogyEntry(conceptId: string): AnalogyEntry | undefined {
      return ANALOGY_MAP.get(conceptId);
    },
  };
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Singleton instance of the clinical language service
 */
export const clinicalLanguageService = createClinicalLanguageService();

/**
 * Convenience function for translation
 */
export function translateTerm(term: string, domain: ClinicalDomain): string {
  return clinicalLanguageService.translate(term, domain);
}

/**
 * Convenience function for analogies
 */
export function getClinicalAnalogy(conceptId: string, domain: ClinicalDomain): string {
  return clinicalLanguageService.getAnalogy(conceptId, domain);
}

/**
 * Convenience function for prompt transformation
 */
export function transformToClinicaLanguage(text: string, domain: ClinicalDomain): string {
  return clinicalLanguageService.transformPrompt(text, domain);
}
