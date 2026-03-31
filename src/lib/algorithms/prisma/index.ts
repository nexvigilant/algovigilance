/**
 * PRISMA Systematic Review Module
 *
 * Implements the PRISMA 2020 framework for systematic reviews and meta-analyses.
 * Re-exports all functions and types from sub-modules.
 *
 * @see https://www.prisma-statement.org/
 * @see BMJ 2020;372:n71 (PRISMA 2020 Statement)
 */

// Type definitions
export type {
  PRISMAPhase,
  ScreeningDecision,
  RecordSource,
  LiteratureRecord,
  EligibilityCriteria,
  ScreeningConfig,
  PRISMAFlowDiagram,
  PipelineResult,
  ChecklistItemStatus,
  ChecklistItemResult,
  ComplianceReport,
  SystematicReviewReport,
} from './types';

// Screening helpers (internal but exported for advanced use)
export { generateFingerprint, screenAbstract, assessEligibility } from './screening';

// Core pipeline
export { processScreeningPipeline } from './pipeline';

// PRISMA compliance validation
export { validatePRISMACompliance } from './compliance';

// Flow diagram generation
export { generateFlowDiagramText, generateFlowDiagramJSON } from './flow-diagram';

// Utility functions
export {
  createRecord,
  getExclusionStatistics,
  validateFlowConsistency,
  quickScreen,
  quickComplianceCheck,
} from './utils';
