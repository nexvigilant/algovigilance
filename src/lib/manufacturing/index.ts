/**
 * Academy Manufacturing Pipeline
 *
 * Automated content generation infrastructure for producing
 * 1,286 ALOs from KSBs at scale with quality validation.
 *
 * @module lib/manufacturing
 */

// Batch Processing
export {
  BatchController,
  runBatch,
  resumeBatch,
  DEFAULT_BATCH_CONFIG,
} from './batch-controller';

// Checkpoint Management
export {
  // Batch-level checkpoints
  saveCheckpoint,
  loadCheckpoint,
  listCheckpoints,
  deleteCheckpoint,
  generateBatchId,
  getLatestCheckpoint,
  // Incremental (section-level) checkpoints
  saveIncrementalCheckpoint,
  loadIncrementalCheckpoint,
  updateIncrementalCheckpoint,
  deleteIncrementalCheckpoint,
  listIncrementalCheckpoints,
  cleanupStaleIncrementalCheckpoints,
  generateTempAloId,
  needsGeneration,
  type ALOSection,
  type IncrementalCheckpoint,
} from './checkpoint-manager';

// Quality Gates
export {
  runQualityGates,
  checkQuality,
  validateBloomAlignment,
  DEFAULT_VALIDATION_RULES,
} from './quality-gates';

// Engine Mapping
export { ActivityEngineMapper } from './engine-mapper';

// Quality Prediction
export {
  QualityPredictor,
  qualityPredictor,
  type QualityPrediction,
  type RiskFactor,
  type InputAdjustment,
} from './quality-predictor';

// Rubric Validation
export {
  RubricValidator,
  rubricValidator,
  type RubricCriterion,
  type RubricIssue,
  type RubricConsistencyResult,
} from './rubric-validator';

// Content Deduplication
export {
  ContentDeduplicationService,
  contentDeduplication,
  filterDuplicates,
  type SimilarityCheckResult,
  type ALOSummary,
} from './content-deduplication';

// Re-export types
export type {
  BatchConfig,
  BatchProgress,
  BatchResult,
  BatchCheckpoint,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationRules,
  BloomValidationResult,
  PipelineStage,
  StageInput,
  StageOutput,
  PipelineConfig,
  PipelineResult,
} from '@/types/manufacturing';
