// Barrel re-export — preserves the @/lib/actions/ksb-builder import path.
// All server action files must have 'use server' as their first statement,
// which they do. This index file simply re-exports from each sub-module.

export type {
  KSBLibraryEntry,
  EnhancedCitation,
  EnhancedKSBInput,
  GenerationWarning,
  QualityGateResult,
  FunctionalAreaInfo,
  DomainInfo,
} from './types';

export {
  getFunctionalAreas,
  getDomains,
} from './domain-actions';

export {
  getKSBsForBuilder,
  getKSBForBuilder,
  updateKSBHook,
  updateKSBConcept,
  updateKSBActivity,
  updateKSBReflection,
  updateKSBMetadata,
  updateKSBFullContent,
  getKSBContentStatus,
  updateKSBStatus,
  submitForReview,
  publishKSB,
  archiveKSB,
  updateKSBResearch,
  getKSBsForDomain,
} from './ksb-actions';

export {
  searchKSBLibrary,
  getKSBFromLibrary,
  linkKSBToLibrary,
} from './library-actions';

export {
  validateQualityGates,
  getGenerationWarnings,
  syncKSBCoverage,
  getDomainWorkflowStats,
} from './analytics-actions';

export {
  generateALOContent,
} from './generation-actions';
