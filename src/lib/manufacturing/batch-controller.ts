/**
 * Batch Controller for ALO Manufacturing Pipeline
 *
 * Orchestrates the batch processing of 1,286 KSBs into ALOs,
 * with checkpointing, retry logic, and progress tracking.
 *
 * @module lib/manufacturing/batch-controller
 */

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { batchProcess, withRetry, withTiming } from '@/lib/parallel-utils';
import { generateFullALOContent } from '@/lib/ai/flows/generate-alo-content';
import { ActivityEngineMapper } from './engine-mapper';
import { PIPELINE_CONFIG } from '@/lib/constants/config';
import {
  saveCheckpoint,
  loadCheckpoint,
  deleteCheckpoint,
  generateBatchId,
} from './checkpoint-manager';
import { qualityPredictor, type QualityPrediction } from './quality-predictor';
import type {
  BatchConfig,
  BatchProgress,
  BatchResult,
} from '@/types/manufacturing';
import type { ALOGenerationInput } from '@/lib/ai/flows/generate-alo-content';

const log = logger.scope('batch-controller');

/**
 * Default batch configuration
 */
export const DEFAULT_BATCH_CONFIG: Partial<BatchConfig> = {
  sourceCollection: 'pv_domains',
  targetCollection: 'alos',
  batchSize: PIPELINE_CONFIG.defaultBatchSize,
  parallelWorkers: PIPELINE_CONFIG.parallelWorkers,
  retryAttempts: PIPELINE_CONFIG.maxRetries,
  checkpoint: true,
  dryRun: false,
};

/**
 * Extended batch configuration with quality prediction
 */
interface ExtendedBatchConfig extends BatchConfig {
  enableQualityPrediction?: boolean;
  minQualityScore?: number;
  autoAdjust?: boolean;
  batchId?: string; // For skip tracking
}

/**
 * KSB entry from Firestore
 */
interface KSBEntry {
  id: string;
  domainId: string;
  ksbCode: string;
  itemName: string;
  itemDescription?: string; // Primary field in Firestore
  description?: string;     // Legacy fallback
  type: string;
  bloomLevel?: string;
  proficiencyLevel?: string;
  keywords?: string[];
}

/**
 * Validation result for KSB pre-generation checks
 */
interface KSBValidationResult {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
}

/**
 * Validates that a KSB has the required fields for ALO generation.
 * Returns validation result with missing field details.
 */
function validateKSBForGeneration(ksb: KSBEntry): KSBValidationResult {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!ksb.type || ksb.type.trim() === '') {
    missingFields.push('type');
  }
  if (!ksb.itemName || ksb.itemName.trim() === '') {
    missingFields.push('itemName');
  }
  // Check itemDescription (primary) or description (fallback)
  const descriptionField = ksb.itemDescription || ksb.description;
  if (!descriptionField || descriptionField.trim() === '') {
    missingFields.push('itemDescription');
  }

  // Check recommended fields (warnings only)
  if (!ksb.bloomLevel || ksb.bloomLevel.trim() === '') {
    warnings.push('bloomLevel missing - defaulting to "understand"');
  }
  if (!ksb.proficiencyLevel || ksb.proficiencyLevel.trim() === '') {
    warnings.push('proficiencyLevel missing - defaulting to "L2"');
  }
  if (!ksb.keywords || ksb.keywords.length === 0) {
    warnings.push('keywords empty - may reduce concept quality');
  }

  // Additional quality checks
  if (descriptionField && descriptionField.length < 50) {
    warnings.push(`description too short (${descriptionField.length} chars) - may reduce quality`);
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings,
  };
}

/**
 * Domain metadata
 */
interface DomainInfo {
  id: string;
  name: string;
  themeCluster?: string;
}

/**
 * Fetches KSBs from Firestore that need content generation
 */
async function fetchKSBsNeedingContent(
  config: BatchConfig,
  processedIds: string[] = []
): Promise<KSBEntry[]> {
  const ksbs: KSBEntry[] = [];

  // Get all domains
  const domainsSnapshot = await adminDb.collection(config.sourceCollection).get();

  for (const domainDoc of domainsSnapshot.docs) {
    const domainId = domainDoc.id;

    // Get capability components for this domain
    const componentsSnapshot = await adminDb
      .collection(config.sourceCollection)
      .doc(domainId)
      .collection('capability_components')
      .get();

    for (const componentDoc of componentsSnapshot.docs) {
      const data = componentDoc.data();
      const ksbId = componentDoc.id;

      // Skip already processed
      if (processedIds.includes(ksbId)) continue;

      // Skip if specific KSBs requested and this isn't one
      if (config.ksbIds && config.ksbIds.length > 0 && !config.ksbIds.includes(ksbId)) {
        continue;
      }

      // Skip if content already generated (has workflow flag)
      if (data['workflow.contentGenerated'] === true) continue;

      ksbs.push({
        id: ksbId,
        domainId,
        ksbCode: data.ksbCode || data.code || ksbId,
        itemName: data.itemName || data.name || data.title || '',
        itemDescription: data.itemDescription || data.description || '',
        description: data.description || data.itemDescription || '',
        type: data.type || 'knowledge',
        bloomLevel: data.bloomLevel,
        proficiencyLevel: data.proficiencyLevel,
        keywords: data.keywords || [],
      });
    }
  }

  log.info(`Found ${ksbs.length} KSBs needing content generation`);
  return ksbs;
}

/**
 * Fetches domain info for a given domain ID
 */
async function getDomainInfo(domainId: string): Promise<DomainInfo> {
  const doc = await adminDb.collection('pv_domains').doc(domainId).get();
  const data = doc.data();
  return {
    id: domainId,
    name: data?.name || data?.title || domainId,
    themeCluster: data?.themeCluster,
  };
}

/**
 * Result of processing a single KSB
 */
interface ProcessKSBResult {
  ksbId: string;
  success: boolean;
  error?: string;
  skipped?: boolean;
  adjusted?: boolean;
  qualityPrediction?: QualityPrediction;
  validationWarnings?: string[];
}

/**
 * Skip reason types for categorization
 */
type SkipReason = 'validation_failed' | 'quality_too_low' | 'missing_data' | 'generation_failed';

/**
 * Skipped KSB record for tracking and retry
 */
interface SkippedKSBRecord {
  ksbId: string;
  ksbCode: string;
  domainId: string;
  batchId: string;
  reason: SkipReason;
  details: string;
  missingFields?: string[];
  qualityScore?: number;
  riskFactors?: string[];
  suggestedActions?: string[];
  skippedAt: Date;
  retryable: boolean;
}

/**
 * Tracks a skipped KSB in Firestore for analysis and retry
 */
async function trackSkippedKSB(record: SkippedKSBRecord): Promise<void> {
  try {
    await adminDb.collection('manufacturing_skipped').doc(record.ksbId).set({
      ...record,
      skippedAt: new Date(),
      status: 'pending_review',
    });
    log.debug(`Tracked skipped KSB ${record.ksbId}`, {
      reason: record.reason,
      retryable: record.retryable,
    });
  } catch (error) {
    // Don't fail the batch if tracking fails - just log
    log.warn(`Failed to track skipped KSB ${record.ksbId}`, { error });
  }
}

/**
 * Processes a single KSB into an ALO
 */
async function processKSB(
  ksb: KSBEntry,
  config: ExtendedBatchConfig
): Promise<ProcessKSBResult> {
  const startTime = Date.now();

  try {
    // Pre-generation validation: Check required fields before processing
    const validation = validateKSBForGeneration(ksb);

    if (!validation.isValid) {
      log.warn(`Skipping KSB ${ksb.id} - missing required fields`, {
        missingFields: validation.missingFields,
        ksbCode: ksb.ksbCode,
        domainId: ksb.domainId,
      });

      // Track skipped KSB for later analysis/retry
      await trackSkippedKSB({
        ksbId: ksb.id,
        ksbCode: ksb.ksbCode,
        domainId: ksb.domainId,
        batchId: config.batchId || 'unknown',
        reason: 'validation_failed',
        details: `Missing required fields: ${validation.missingFields.join(', ')}`,
        missingFields: validation.missingFields,
        suggestedActions: validation.missingFields.map(f => `Add ${f} to KSB definition`),
        skippedAt: new Date(),
        retryable: true, // Can retry once fields are populated
      });

      return {
        ksbId: ksb.id,
        success: false,
        skipped: true,
        error: `Missing required fields: ${validation.missingFields.join(', ')}`,
      };
    }

    // Log warnings for recommended but missing fields
    if (validation.warnings.length > 0) {
      log.info(`KSB ${ksb.id} has quality warnings`, {
        warnings: validation.warnings,
        ksbCode: ksb.ksbCode,
      });
    }

    // Get domain info
    const domainInfo = await getDomainInfo(ksb.domainId);

    // Determine activity engine type
    // Note: code_playground is not yet supported in ALO generation, fallback to synthesis
    const suggestedEngine = ActivityEngineMapper.suggestEngine({
      type: ksb.type,
      bloomLevel: ksb.bloomLevel,
      title: ksb.itemName,
      description: ksb.description || ksb.itemDescription || '',
    });

    // Map unsupported engines to supported ones
    const supportedEngines = ['red_pen', 'triage', 'synthesis', 'calculator', 'timeline'] as const;
    type SupportedEngine = typeof supportedEngines[number];
    const engineType: SupportedEngine = supportedEngines.includes(suggestedEngine as SupportedEngine)
      ? (suggestedEngine as SupportedEngine)
      : 'synthesis'; // Fallback for code_playground and other unsupported engines

    // Build generation input
    // Map to KSBLibraryEntry format expected by generateFullALOContent
    let input: ALOGenerationInput = {
      ksbEntry: {
        id: ksb.id,
        ksbCode: ksb.ksbCode,
        title: ksb.itemName,
        description: ksb.description || ksb.itemDescription || '',
        type: ksb.type as 'knowledge' | 'skill' | 'behavior',
        keywords: ksb.keywords || [],
        researchQuality: 0.5, // Default quality score for batch processing
        lastUpdated: new Date(),
      },
      domainId: ksb.domainId,
      domainName: domainInfo.name,
      ksbType: ksb.type as 'knowledge' | 'skill' | 'behavior' | 'ai_integration',
      proficiencyLevel: ksb.proficiencyLevel || 'L2',
      bloomLevel: ksb.bloomLevel || 'understand',
      activityEngineType: engineType,
    };

    // Quality prediction gate
    let qualityPrediction: QualityPrediction | undefined;
    let wasAdjusted = false;

    if (config.enableQualityPrediction !== false) {
      qualityPrediction = qualityPredictor.predictQuality(input);
      const minScore = config.minQualityScore ?? 50;

      if (qualityPrediction.recommendation === 'skip' || qualityPrediction.predictedScore < minScore) {
        log.warn(`Skipping KSB ${ksb.id} - predicted quality too low (${qualityPrediction.predictedScore}/100)`, {
          riskFactors: qualityPrediction.riskFactors.map(r => r.factor),
        });

        // Track skipped KSB for later analysis/retry
        await trackSkippedKSB({
          ksbId: ksb.id,
          ksbCode: ksb.ksbCode,
          domainId: ksb.domainId,
          batchId: config.batchId || 'unknown',
          reason: 'quality_too_low',
          details: `Predicted quality score ${qualityPrediction.predictedScore} below threshold ${minScore}`,
          qualityScore: qualityPrediction.predictedScore,
          riskFactors: qualityPrediction.riskFactors.map(r => r.factor),
          suggestedActions: qualityPrediction.adjustments?.map(a => `${a.field}: ${String(a.currentValue)} → ${String(a.suggestedValue)} (${a.reason})`) || [],
          skippedAt: new Date(),
          retryable: true, // Can retry after improving input quality
        });

        return {
          ksbId: ksb.id,
          success: false,
          skipped: true,
          qualityPrediction,
          error: `Predicted quality score ${qualityPrediction.predictedScore} below threshold ${minScore}`,
        };
      }

      // Apply auto-adjustments if enabled
      if (config.autoAdjust !== false && qualityPrediction.adjustments?.length) {
        input = qualityPredictor.applyAdjustments(input, qualityPrediction);
        wasAdjusted = true;
        log.info(`Applied ${qualityPrediction.adjustments.length} adjustments to KSB ${ksb.id}`, {
          adjustments: qualityPrediction.adjustments.map(a => a.field),
        });
      }
    }

    if (config.dryRun) {
      log.debug(`[DRY RUN] Would generate ALO for KSB ${ksb.id}`, {
        engineType: input.activityEngineType,
        predictedScore: qualityPrediction?.predictedScore,
        adjusted: wasAdjusted,
      });
      return { ksbId: ksb.id, success: true, adjusted: wasAdjusted, qualityPrediction };
    }

    // Generate ALO content
    const content = await withRetry(
      () => generateFullALOContent(input),
      {
        maxAttempts: config.retryAttempts,
        baseDelayMs: 2000,
        label: `generate-${ksb.id}`,
      }
    );

    // Save to Firestore
    const aloRef = adminDb.collection(config.targetCollection).doc();
    await aloRef.set({
      id: aloRef.id,
      ksbId: ksb.id,
      domainId: ksb.domainId,
      targetLevel: parseInt(ksb.proficiencyLevel?.replace('L', '') || '2', 10),
      title: ksb.itemName,
      description: ksb.description,
      hook: content.hook,
      concept: content.concept,
      activity: content.activity,
      reflection: content.reflection,
      metadata: content.activityMetadata,
      status: 'review',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Mark KSB as processed
    await adminDb
      .collection(config.sourceCollection)
      .doc(ksb.domainId)
      .collection('capability_components')
      .doc(ksb.id)
      .update({
        'workflow.contentGenerated': true,
        'workflow.contentGeneratedAt': new Date(),
        'workflow.aloId': aloRef.id,
      });

    const duration = Date.now() - startTime;
    log.debug(`Generated ALO for KSB ${ksb.id}`, {
      duration,
      aloId: aloRef.id,
      predictedScore: qualityPrediction?.predictedScore,
      adjusted: wasAdjusted,
      validationWarnings: validation.warnings.length > 0 ? validation.warnings : undefined,
    });

    return {
      ksbId: ksb.id,
      success: true,
      adjusted: wasAdjusted,
      qualityPrediction,
      validationWarnings: validation.warnings.length > 0 ? validation.warnings : undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error(`Failed to process KSB ${ksb.id}`, { error: errorMessage });
    return { ksbId: ksb.id, success: false, error: errorMessage };
  }
}

/**
 * Main batch processing controller
 */
export class BatchController {
  private config: BatchConfig;
  private batchId: string;
  private progress: BatchProgress;
  private isRunning: boolean = false;
  private shouldStop: boolean = false;

  constructor(config: Partial<BatchConfig> = {}) {
    this.config = { ...DEFAULT_BATCH_CONFIG, ...config } as BatchConfig;
    this.batchId = generateBatchId();
    this.progress = {
      batchId: this.batchId,
      startTime: new Date(),
      totalItems: 0,
      completedItems: 0,
      failedItems: 0,
      status: 'pending',
    };
  }

  /**
   * Starts batch processing from scratch
   */
  async start(): Promise<BatchResult> {
    if (this.isRunning) {
      throw new Error('Batch is already running');
    }

    this.isRunning = true;
    this.progress.status = 'processing';
    this.progress.startTime = new Date();

    log.info(`Starting batch ${this.batchId}`, { config: this.config });

    try {
      // Fetch KSBs needing content
      const ksbs = await fetchKSBsNeedingContent(this.config);
      this.progress.totalItems = ksbs.length;

      if (ksbs.length === 0) {
        log.info('No KSBs need content generation');
        this.progress.status = 'completed';
        return this.buildResult([]);
      }

      // Process in batches
      const results = await this.processBatches(ksbs, []);

      // Clean up checkpoint on success
      if (this.config.checkpoint) {
        await deleteCheckpoint(this.batchId);
      }

      this.progress.status = 'completed';
      return this.buildResult(results);
    } catch (error) {
      this.progress.status = 'failed';
      log.error(`Batch ${this.batchId} failed`, { error });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Resumes from a checkpoint
   */
  async resume(checkpointId: string): Promise<BatchResult> {
    if (this.isRunning) {
      throw new Error('Batch is already running');
    }

    const checkpoint = await loadCheckpoint(checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }

    this.batchId = checkpoint.batchId;
    this.config = checkpoint.config;
    this.isRunning = true;
    this.progress.status = 'processing';
    this.progress.startTime = new Date();

    log.info(`Resuming batch ${this.batchId}`, {
      processedCount: checkpoint.processedKsbIds.length,
    });

    try {
      // Fetch remaining KSBs
      const ksbs = await fetchKSBsNeedingContent(this.config, checkpoint.processedKsbIds);
      this.progress.totalItems = ksbs.length + checkpoint.processedKsbIds.length;
      this.progress.completedItems = checkpoint.processedKsbIds.length;

      // Process remaining
      const results = await this.processBatches(ksbs, checkpoint.processedKsbIds);

      // Clean up checkpoint
      await deleteCheckpoint(this.batchId);

      this.progress.status = 'completed';
      return this.buildResult(results);
    } catch (error) {
      this.progress.status = 'failed';
      log.error(`Resumed batch ${this.batchId} failed`, { error });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Processes KSBs in batches with checkpointing
   */
  private async processBatches(
    ksbs: KSBEntry[],
    alreadyProcessed: string[]
  ): Promise<Array<{ ksbId: string; success: boolean; error?: string; durationMs: number }>> {
    const results: Array<{ ksbId: string; success: boolean; error?: string; durationMs: number }> = [];
    const processedIds = [...alreadyProcessed];
    const checkpointInterval = this.config.batchSize;

    for (let i = 0; i < ksbs.length; i += this.config.batchSize) {
      if (this.shouldStop) {
        log.info('Batch processing stopped by user');
        break;
      }

      const batch = ksbs.slice(i, i + this.config.batchSize);
      this.progress.currentKsbId = batch[0]?.id;

      log.info(`Processing batch ${Math.floor(i / this.config.batchSize) + 1}`, {
        size: batch.length,
        progress: `${this.progress.completedItems}/${this.progress.totalItems}`,
      });

      // Process batch with concurrency control
      const { result: batchResults, durationMs } = await withTiming(
        () =>
          batchProcess(
            batch,
            async (ksb) => processKSB(ksb, { ...this.config, batchId: this.batchId }),
            {
              concurrency: this.config.parallelWorkers,
              continueOnError: true,
              label: `batch-${Math.floor(i / this.config.batchSize)}`,
            }
          ),
        { label: 'batch-process' }
      );

      // Collect results
      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value) {
          results.push({ ...result.value, durationMs: result.durationMs });
          processedIds.push(result.value.ksbId);

          if (result.value.success) {
            this.progress.completedItems++;
          } else {
            this.progress.failedItems++;
          }
        } else if (result.status === 'rejected') {
          this.progress.failedItems++;
        }
      }

      // Save checkpoint
      if (this.config.checkpoint && (i + this.config.batchSize) % checkpointInterval === 0) {
        await saveCheckpoint({
          batchId: this.batchId,
          config: this.config,
          processedKsbIds: processedIds,
          lastKsbId: batch[batch.length - 1]?.id || '',
          timestamp: new Date(),
        });
      }

      log.info(`Batch complete`, {
        completed: this.progress.completedItems,
        failed: this.progress.failedItems,
        durationMs,
      });
    }

    return results;
  }

  /**
   * Gets current progress
   */
  getProgress(): BatchProgress {
    return { ...this.progress };
  }

  /**
   * Gracefully stops the batch (saves checkpoint)
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.shouldStop = true;
    log.info(`Stopping batch ${this.batchId}`);
  }

  /**
   * Builds the final result object
   */
  private buildResult(
    results: Array<{ ksbId: string; success: boolean; error?: string; durationMs: number }>
  ): BatchResult {
    return {
      batchId: this.batchId,
      config: this.config,
      progress: this.progress,
      results,
      endTime: new Date(),
    };
  }
}

/**
 * Convenience function to run a batch with default config
 */
export async function runBatch(config: Partial<BatchConfig> = {}): Promise<BatchResult> {
  const controller = new BatchController(config);
  return controller.start();
}

/**
 * Convenience function to resume a batch
 */
export async function resumeBatch(checkpointId: string): Promise<BatchResult> {
  const controller = new BatchController();
  return controller.resume(checkpointId);
}
