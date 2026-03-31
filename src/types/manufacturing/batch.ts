/**
 * Configuration for batch processing KSBs
 */
export interface BatchConfig {
  sourceCollection: string;
  targetCollection: string;
  batchSize: number;
  parallelWorkers: number;
  retryAttempts: number;
  checkpoint: boolean;
  dryRun: boolean;
  ksbIds?: string[]; // Optional: limit to specific KSBs
}

/**
 * Progress tracking for a batch
 */
export interface BatchProgress {
  batchId: string;
  startTime: Date;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  currentKsbId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
}

/**
 * Result of a batch process
 */
export interface BatchResult {
  batchId: string;
  config: BatchConfig;
  progress: BatchProgress;
  results: {
    ksbId: string;
    success: boolean;
    error?: string;
    durationMs: number;
  }[];
  endTime: Date;
}

/**
 * Checkpoint for resuming interrupted batches
 */
export interface BatchCheckpoint {
  batchId: string;
  config: BatchConfig;
  processedKsbIds: string[];
  lastKsbId: string;
  timestamp: Date;
}
