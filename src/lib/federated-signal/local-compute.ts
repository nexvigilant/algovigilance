/**
 * Federated Signal Intelligence - Local Computation Module
 *
 * Runs within each organization's boundary to compute local statistics
 * without exposing raw ICSR data. Adds differential privacy noise before
 * sharing with the aggregation service.
 *
 * @copyright AlgoVigilance 2025
 * @license Proprietary - Trade Secret
 */

import type {
  ContingencyTable,
  FederatedSignalQuery,
  LocalStatistics,
  LocalStatisticsMetadata,
  PrivacyConfig,
  DataQuality,
} from '../../types/federated-signal';

// =============================================================================
// Differential Privacy Utilities
// =============================================================================

/**
 * Generate Laplace noise for differential privacy
 * @param scale - Scale parameter (sensitivity/epsilon)
 * @returns Random sample from Laplace distribution
 */
function laplaceSample(scale: number): number {
  // Use inverse CDF method
  const u = Math.random() - 0.5;
  return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}

/**
 * Generate Gaussian noise for differential privacy
 * @param sigma - Standard deviation
 * @returns Random sample from Gaussian distribution
 */
function gaussianSample(sigma: number): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  return sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Add calibrated noise to a count for differential privacy
 * @param trueCount - Actual count value
 * @param config - Privacy configuration
 * @returns Noised count (rounded to non-negative integer)
 */
export function addNoise(trueCount: number, config: PrivacyConfig): number {
  const scale = config.sensitivity / config.epsilon;

  let noise: number;
  if (config.mechanism === 'laplace') {
    noise = laplaceSample(scale);
  } else {
    // Gaussian noise (requires slightly higher epsilon for same privacy)
    const sigma = scale * Math.sqrt(2 * Math.log(1.25 / 0.05));
    noise = gaussianSample(sigma);
  }

  // Round to integer and ensure non-negative
  const noisedCount = Math.max(0, Math.round(trueCount + noise));
  return noisedCount;
}

/**
 * Add noise to entire contingency table
 * @param table - True contingency table
 * @param config - Privacy configuration (budget split across 4 cells)
 * @returns Noised contingency table
 */
export function addNoiseToTable(
  table: ContingencyTable,
  config: PrivacyConfig
): ContingencyTable {
  // Split privacy budget across 4 cells (parallel composition)
  const cellConfig: PrivacyConfig = {
    ...config,
    epsilon: config.epsilon / 4,
  };

  return {
    a: addNoise(table.a, cellConfig),
    b: addNoise(table.b, cellConfig),
    c: addNoise(table.c, cellConfig),
    d: addNoise(table.d, cellConfig),
  };
}

// =============================================================================
// Local Computation
// =============================================================================

/**
 * Interface for local safety database queries
 * Organizations implement this to connect to their safety database
 */
export interface LocalSafetyDatabase {
  /**
   * Count cases matching drug-event criteria
   * @param drugCriteria - Drug selection criteria
   * @param eventCriteria - Event selection criteria
   * @param timeWindow - Time range
   * @returns Count of matching cases
   */
  countDrugEventCases(
    drugCriteria: FederatedSignalQuery['drugCriteria'],
    eventCriteria: FederatedSignalQuery['eventCriteria'],
    timeWindow: FederatedSignalQuery['timeWindow']
  ): Promise<number>;

  /**
   * Count cases with drug (regardless of event)
   */
  countDrugCases(
    drugCriteria: FederatedSignalQuery['drugCriteria'],
    timeWindow: FederatedSignalQuery['timeWindow']
  ): Promise<number>;

  /**
   * Count cases with event (regardless of drug)
   */
  countEventCases(
    eventCriteria: FederatedSignalQuery['eventCriteria'],
    timeWindow: FederatedSignalQuery['timeWindow']
  ): Promise<number>;

  /**
   * Count total cases in database
   */
  countTotalCases(
    timeWindow: FederatedSignalQuery['timeWindow']
  ): Promise<number>;

  /**
   * Get data quality assessment
   */
  getDataQuality(): Promise<DataQuality>;

  /**
   * Get coverage percentage for query
   */
  getCoveragePercentage(
    timeWindow: FederatedSignalQuery['timeWindow']
  ): Promise<number>;
}

/**
 * Compute local contingency table from safety database
 * @param query - Federated signal query
 * @param database - Local safety database interface
 * @returns Raw contingency table (before noise)
 */
export async function computeLocalContingency(
  query: FederatedSignalQuery,
  database: LocalSafetyDatabase
): Promise<ContingencyTable> {
  // Run counts in parallel for efficiency
  const [drugEvent, drugTotal, eventTotal, total] = await Promise.all([
    database.countDrugEventCases(query.drugCriteria, query.eventCriteria, query.timeWindow),
    database.countDrugCases(query.drugCriteria, query.timeWindow),
    database.countEventCases(query.eventCriteria, query.timeWindow),
    database.countTotalCases(query.timeWindow),
  ]);

  // Compute contingency table cells
  const a = drugEvent;                    // Drug + Event
  const b = drugTotal - drugEvent;        // Drug + No Event
  const c = eventTotal - drugEvent;       // No Drug + Event
  const d = total - a - b - c;            // No Drug + No Event

  return { a, b, c, d };
}

/**
 * Configuration for local compute module
 */
export interface LocalComputeConfig {
  /** Organization identifier (pseudonymous) */
  organizationId: string;
  /** Private key for signing (PEM format) */
  privateKey: string;
  /** Public key for verification (PEM format) */
  publicKey: string;
  /** Default privacy configuration */
  defaultPrivacy: PrivacyConfig;
}

/**
 * Local computation module for federated signal detection
 */
export class LocalComputeModule {
  private config: LocalComputeConfig;
  private database: LocalSafetyDatabase;

  constructor(config: LocalComputeConfig, database: LocalSafetyDatabase) {
    this.config = config;
    this.database = database;
  }

  /**
   * Process a federated signal query
   * @param query - Query from aggregation service
   * @returns Local statistics with privacy protection
   */
  async processQuery(query: FederatedSignalQuery): Promise<LocalStatistics> {
    // 1. Compute raw contingency table
    const rawTable = await computeLocalContingency(query, this.database);

    // 2. Apply differential privacy noise
    const privacyConfig: PrivacyConfig = {
      epsilon: query.privacyBudget,
      sensitivity: this.config.defaultPrivacy.sensitivity,
      mechanism: this.config.defaultPrivacy.mechanism,
    };
    const noisedTable = addNoiseToTable(rawTable, privacyConfig);

    // 3. Gather metadata
    const [dataQuality, coveragePercentage] = await Promise.all([
      this.database.getDataQuality(),
      this.database.getCoveragePercentage(query.timeWindow),
    ]);

    const metadata: LocalStatisticsMetadata = {
      dataQuality,
      coveragePercentage,
      noiseEpsilon: query.privacyBudget,
      computedAt: new Date(),
    };

    // 4. Create signature (placeholder - real implementation would use crypto)
    const signature = await this.signStatistics(query.queryId, noisedTable);

    return {
      queryId: query.queryId,
      organizationId: this.config.organizationId,
      timestamp: new Date(),
      contingencyTable: noisedTable,
      metadata,
      signature,
      publicKey: this.config.publicKey,
    };
  }

  /**
   * Sign statistics for integrity verification
   * @param queryId - Query identifier
   * @param table - Contingency table to sign
   * @returns Digital signature
   */
  private async signStatistics(
    queryId: string,
    table: ContingencyTable
  ): Promise<string> {
    // In production, use Web Crypto API with RSA/ECDSA
    // This is a placeholder for the POC
    const message = JSON.stringify({ queryId, table });

    // Try to use Web Crypto if available (browser environment)
    if (typeof TextEncoder !== 'undefined' && typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch {
        // Fall through to placeholder
      }
    }

    // Fallback for Node.js/test environments
    return `placeholder-sig-${queryId}-${Date.now()}`;
  }

  /**
   * Check if query is valid and within budget
   * @param query - Query to validate
   * @param currentBudget - Remaining privacy budget
   * @returns Validation result
   */
  validateQuery(
    query: FederatedSignalQuery,
    currentBudget: number
  ): { valid: boolean; reason?: string } {
    // Check privacy budget
    if (query.privacyBudget > currentBudget) {
      return {
        valid: false,
        reason: `Insufficient privacy budget. Required: ${query.privacyBudget}, Available: ${currentBudget}`,
      };
    }

    // Check epsilon bounds
    if (query.privacyBudget < 0.1 || query.privacyBudget > 2.0) {
      return {
        valid: false,
        reason: `Privacy budget out of range (0.1-2.0): ${query.privacyBudget}`,
      };
    }

    // Check time window
    const now = new Date();
    if (query.timeWindow.end > now) {
      return {
        valid: false,
        reason: 'Time window extends into the future',
      };
    }

    // Check required criteria
    if (!query.drugCriteria.genericName && !query.drugCriteria.atcCode) {
      return {
        valid: false,
        reason: 'Drug criteria must specify genericName or atcCode',
      };
    }

    if (!query.eventCriteria.meddraCode && !query.eventCriteria.ptTerm) {
      return {
        valid: false,
        reason: 'Event criteria must specify meddraCode or ptTerm',
      };
    }

    return { valid: true };
  }
}

// =============================================================================
// Mock Database (for testing/demo)
// =============================================================================

/**
 * Mock safety database for testing and demonstration
 * Generates plausible random data
 */
export class MockSafetyDatabase implements LocalSafetyDatabase {
  private totalCases: number;
  private seed: number;

  constructor(totalCases: number = 10000, seed: number = 42) {
    this.totalCases = totalCases;
    this.seed = seed;
  }

  private seededRandom(): number {
    // Simple seeded random for reproducibility
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  async countDrugEventCases(): Promise<number> {
    // Simulate drug-event co-occurrence (rare: 0.1-2% of drug cases)
    const rate = 0.001 + this.seededRandom() * 0.02;
    return Math.floor(this.totalCases * rate);
  }

  async countDrugCases(): Promise<number> {
    // Drug appears in 5-15% of cases
    const rate = 0.05 + this.seededRandom() * 0.1;
    return Math.floor(this.totalCases * rate);
  }

  async countEventCases(): Promise<number> {
    // Event appears in 1-5% of cases
    const rate = 0.01 + this.seededRandom() * 0.04;
    return Math.floor(this.totalCases * rate);
  }

  async countTotalCases(): Promise<number> {
    return this.totalCases;
  }

  async getDataQuality(): Promise<DataQuality> {
    const rand = this.seededRandom();
    if (rand > 0.7) return 'high';
    if (rand > 0.3) return 'medium';
    return 'low';
  }

  async getCoveragePercentage(): Promise<number> {
    return 85 + this.seededRandom() * 15; // 85-100%
  }
}

// =============================================================================
// Exports
// =============================================================================

export {
  laplaceSample,
  gaussianSample,
};
