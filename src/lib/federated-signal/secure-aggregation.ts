/**
 * Federated Signal Intelligence - Secure Aggregation Service
 *
 * Aggregates local statistics from multiple organizations to compute
 * global signal detection results without accessing raw ICSR data.
 *
 * @copyright AlgoVigilance 2025
 * @license Proprietary - Trade Secret
 */

import type {
  ContingencyTable,
  ContingencyTableExtended,
  FederatedOrganizationId,
  FederatedQueryId,
  FederatedSignalQuery,
  FederatedSignalResult,
  LocalStatistics,
  PRRResult,
  RORResult,
  ICResult,
  SignalMethod,
  SignalResults,
  SignalStrength,
  AggregationProgress,
  PrivacyGuarantee,
} from '../../types/federated-signal';

import { calculateFederatedEBGM, type EBGMResult } from './ebgm';
import { classifySignalStrength } from './signal-utils';

// =============================================================================
// Signal Detection Algorithms (on aggregated data)
// =============================================================================

/**
 * Calculate PRR (Proportional Reporting Ratio) from contingency table
 * @param table - Aggregated contingency table
 * @returns PRR result with confidence intervals
 */
export function calculatePRR(table: ContingencyTableExtended): PRRResult {
  const { a, b, c, d, N } = table;

  // Handle edge cases
  if (a === 0 || (a + b) === 0 || (a + c) === 0) {
    return {
      value: 0,
      ci95Lower: 0,
      ci95Upper: 0,
      chiSquare: 0,
      isSignal: false,
      strength: 'no_signal',
    };
  }

  // PRR = [a/(a+b)] / [(a+c)/N]
  const prr = (a / (a + b)) / ((a + c) / N);

  // Standard error (log scale)
  const se = Math.sqrt(1/a - 1/(a+b) + 1/c - 1/(c+d));

  // 95% CI
  const ci95Lower = Math.exp(Math.log(prr) - 1.96 * se);
  const ci95Upper = Math.exp(Math.log(prr) + 1.96 * se);

  // Chi-square statistic
  const E = table.E;
  const chiSquare = E > 0 ? Math.pow(a - E, 2) / E : 0;

  // Signal determination (federated thresholds - more conservative)
  const isSignal = prr >= 2.5 && chiSquare >= 4.0 && a >= 5 && ci95Lower > 1.0;

  return {
    value: prr,
    ci95Lower,
    ci95Upper,
    chiSquare,
    isSignal,
    strength: classifySignalStrength(prr, isSignal),
  };
}

/**
 * Calculate ROR (Reporting Odds Ratio) from contingency table
 * @param table - Aggregated contingency table
 * @returns ROR result with confidence intervals
 */
export function calculateROR(table: ContingencyTableExtended): RORResult {
  const { a, b, c, d } = table;

  // Handle edge cases with Haldane correction
  const aa = a + 0.5;
  const bb = b + 0.5;
  const cc = c + 0.5;
  const dd = d + 0.5;

  // ROR = (a*d) / (b*c)
  const ror = (aa * dd) / (bb * cc);

  // Standard error (log scale)
  const se = Math.sqrt(1/aa + 1/bb + 1/cc + 1/dd);

  // 95% CI
  const ci95Lower = Math.exp(Math.log(ror) - 1.96 * se);
  const ci95Upper = Math.exp(Math.log(ror) + 1.96 * se);

  // Signal determination (federated threshold: CI lower > 1.25)
  const isSignal = ci95Lower > 1.25 && a >= 5;

  return {
    value: ror,
    ci95Lower,
    ci95Upper,
    isSignal,
    strength: classifySignalStrength(ror, isSignal),
  };
}

/**
 * Calculate IC (Information Component / BCPNN) from contingency table
 * @param table - Aggregated contingency table
 * @returns IC result with credibility intervals
 */
export function calculateIC(table: ContingencyTableExtended): ICResult {
  const { a, E } = table;

  // Handle edge cases
  if (a === 0 || E === 0) {
    return {
      value: 0,
      ic025: -Infinity,
      ic975: Infinity,
      isSignal: false,
      strength: 'no_signal',
    };
  }

  // IC = log2((a + 0.5) / (E + 0.5))
  const ic = Math.log2((a + 0.5) / (E + 0.5));

  // Variance (log2 scale)
  const variance = (1 / Math.pow(Math.log(2), 2)) * (1/a + 1/E);
  const sd = Math.sqrt(variance);

  // 95% Credibility interval
  const ic025 = ic - 1.96 * sd;
  const ic975 = ic + 1.96 * sd;

  // Signal determination (federated threshold: IC025 > 0.5)
  const isSignal = ic025 > 0.5 && a >= 5;

  // Map IC to equivalent "strength" (IC is log scale)
  // IC ≈ log2(PRR) for large N
  const equivalentPrr = Math.pow(2, ic);

  return {
    value: ic,
    ic025,
    ic975,
    isSignal,
    strength: classifySignalStrength(equivalentPrr, isSignal),
  };
}

/**
 * Classify signal strength based on PRR-equivalent value
 */
/**
 * Determine consensus strength across multiple methods
 */
function getConsensusStrength(
  prr?: PRRResult,
  ror?: RORResult,
  ic?: ICResult,
  ebgm?: EBGMResult
): SignalStrength {
  const strengths: SignalStrength[] = [];
  if (prr?.isSignal) strengths.push(prr.strength);
  if (ror?.isSignal) strengths.push(ror.strength);
  if (ic?.isSignal) strengths.push(ic.strength);
  if (ebgm?.isSignal) strengths.push(ebgm.strength);

  if (strengths.length === 0) return 'no_signal';

  // Map to numeric values for averaging
  const strengthMap: Record<SignalStrength, number> = {
    'no_signal': 0,
    'very_weak': 1,
    'weak': 2,
    'moderate': 3,
    'strong': 4,
    'very_strong': 5,
  };

  const avg = strengths.reduce((sum, s) => sum + strengthMap[s], 0) / strengths.length;

  // Map back to category
  if (avg >= 4.5) return 'very_strong';
  if (avg >= 3.5) return 'strong';
  if (avg >= 2.5) return 'moderate';
  if (avg >= 1.5) return 'weak';
  if (avg >= 0.5) return 'very_weak';
  return 'no_signal';
}

// =============================================================================
// Aggregation Service
// =============================================================================

/**
 * Configuration for the aggregation service
 */
export interface AggregationServiceConfig {
  /** Minimum participants required for valid aggregation */
  minParticipants: number;
  /** Minimum total cases in aggregated table */
  minTotalCases: number;
  /** Collection timeout in milliseconds */
  collectionTimeoutMs: number;
  /** Whether to verify signatures */
  verifySignatures: boolean;
}

const DEFAULT_CONFIG: AggregationServiceConfig = {
  minParticipants: 3,
  minTotalCases: 10,
  collectionTimeoutMs: 5 * 60 * 1000, // 5 minutes
  verifySignatures: true,
};

/**
 * Pending aggregation query
 */
interface PendingAggregation {
  query: FederatedSignalQuery;
  contributions: LocalStatistics[];
  progress: AggregationProgress;
  startTime: Date;
}

/**
 * Secure Aggregation Service for federated signal detection
 */
export class SecureAggregationService {
  private config: AggregationServiceConfig;
  private pendingAggregations: Map<string, PendingAggregation> = new Map();

  constructor(config: Partial<AggregationServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize a new aggregation query
   * @param query - Federated signal query
   * @param expectedParticipants - Number of expected participants
   * @returns Query ID
   */
  initializeQuery(
    query: FederatedSignalQuery,
    expectedParticipants: number
  ): string {
    const deadline = new Date(Date.now() + this.config.collectionTimeoutMs);

    const pending: PendingAggregation = {
      query,
      contributions: [],
      progress: {
        status: 'pending',
        participantsReceived: 0,
        participantsExpected: expectedParticipants,
        collectionDeadline: deadline,
      },
      startTime: new Date(),
    };

    this.pendingAggregations.set(query.queryId, pending);
    return query.queryId;
  }

  /**
   * Submit local statistics for aggregation
   * @param statistics - Local statistics from an organization
   * @returns Updated progress
   */
  async submitContribution(
    statistics: LocalStatistics
  ): Promise<AggregationProgress> {
    const pending = this.pendingAggregations.get(statistics.queryId);

    if (!pending) {
      return {
        status: 'failed',
        participantsReceived: 0,
        participantsExpected: 0,
        collectionDeadline: new Date(),
        error: `Query ${statistics.queryId} not found`,
      };
    }

    // Check if collection window has closed
    if (new Date() > pending.progress.collectionDeadline) {
      pending.progress.status = 'failed';
      pending.progress.error = 'Collection deadline exceeded';
      return pending.progress;
    }

    // Verify signature (placeholder - real impl would use crypto)
    if (this.config.verifySignatures) {
      const valid = await this.verifySignature(statistics);
      if (!valid) {
        return {
          ...pending.progress,
          error: `Invalid signature from ${statistics.organizationId}`,
        };
      }
    }

    // Check for duplicate submissions
    const alreadySubmitted = pending.contributions.some(
      c => c.organizationId === statistics.organizationId
    );
    if (alreadySubmitted) {
      return {
        ...pending.progress,
        error: `Duplicate submission from ${statistics.organizationId}`,
      };
    }

    // Add contribution
    pending.contributions.push(statistics);
    pending.progress.participantsReceived++;
    pending.progress.status = 'collecting';

    // Check if we have enough participants to aggregate
    if (pending.progress.participantsReceived >= pending.progress.participantsExpected) {
      pending.progress.status = 'aggregating';
    }

    return pending.progress;
  }

  /**
   * Get current aggregation progress
   * @param queryId - Query identifier
   */
  getProgress(queryId: string): AggregationProgress | null {
    return this.pendingAggregations.get(queryId)?.progress ?? null;
  }

  /**
   * Compute aggregated result when enough contributions are received
   * @param queryId - Query identifier
   * @returns Federated signal result or null if not ready
   */
  async computeResult(queryId: string): Promise<FederatedSignalResult | null> {
    const pending = this.pendingAggregations.get(queryId);

    if (!pending) {
      return null;
    }

    // Check minimum participants
    if (pending.contributions.length < this.config.minParticipants) {
      pending.progress.status = 'insufficient_participants';
      pending.progress.error = `Need ${this.config.minParticipants} participants, got ${pending.contributions.length}`;
      return null;
    }

    const computeStart = Date.now();

    // Aggregate contingency tables
    const globalTable = this.aggregateTables(
      pending.contributions.map(c => c.contingencyTable)
    );

    // Check minimum cases
    if (globalTable.a < this.config.minTotalCases) {
      pending.progress.status = 'insufficient_participants';
      pending.progress.error = `Need ${this.config.minTotalCases} total cases, got ${globalTable.a}`;
      return null;
    }

    // Compute signal detection metrics
    const prr = pending.query.requestedMetrics.includes('PRR')
      ? calculatePRR(globalTable)
      : undefined;
    const ror = pending.query.requestedMetrics.includes('ROR')
      ? calculateROR(globalTable)
      : undefined;
    const ic = pending.query.requestedMetrics.includes('IC')
      ? calculateIC(globalTable)
      : undefined;
    const ebgm = pending.query.requestedMetrics.includes('EBGM')
      ? calculateFederatedEBGM(globalTable)
      : undefined;

    const overallSignal = (prr?.isSignal ?? false) || (ror?.isSignal ?? false) || (ic?.isSignal ?? false) || (ebgm?.isSignal ?? false);

    const signals: SignalResults = {
      prr,
      ror,
      ic,
      ebgm,
      overallSignal,
      consensusStrength: getConsensusStrength(prr, ror, ic, ebgm),
    };

    // Calculate privacy guarantee
    const privacyGuarantee = this.calculatePrivacyGuarantee(pending);

    // Build result
    const computeEnd = Date.now();

    const result: FederatedSignalResult = {
      queryId,
      timestamp: new Date(),
      participantCount: pending.contributions.length,
      globalContingency: globalTable,
      signals,
      privacyGuarantee,
      aggregationInfo: {
        collectionDuration: pending.progress.collectionDeadline.getTime() - pending.startTime.getTime(),
        computationDuration: computeEnd - computeStart,
        excludedParticipants: pending.progress.participantsExpected - pending.contributions.length,
      },
    };

    // Update status
    pending.progress.status = 'complete';

    return result;
  }

  /**
   * Aggregate multiple contingency tables by summing cells
   */
  private aggregateTables(tables: ContingencyTable[]): ContingencyTableExtended {
    const a = tables.reduce((sum, t) => sum + t.a, 0);
    const b = tables.reduce((sum, t) => sum + t.b, 0);
    const c = tables.reduce((sum, t) => sum + t.c, 0);
    const d = tables.reduce((sum, t) => sum + t.d, 0);

    const N = a + b + c + d;
    const drugTotal = a + b;
    const eventTotal = a + c;
    const E = N > 0 ? (drugTotal * eventTotal) / N : 0;

    return {
      a,
      b,
      c,
      d,
      N,
      E,
      drugTotal,
      eventTotal,
    };
  }

  /**
   * Calculate privacy guarantee for the aggregation
   */
  private calculatePrivacyGuarantee(pending: PendingAggregation): PrivacyGuarantee {
    // Composed epsilon across participants (sequential composition)
    const epsilons = pending.contributions.map(c => c.metadata.noiseEpsilon);
    const composedEpsilon = Math.max(...epsilons); // Conservative: use max

    return {
      composedEpsilon,
      participantMinimum: this.config.minParticipants,
      kAnonymitySatisfied: pending.contributions.length >= this.config.minParticipants,
      guarantee: `ε-differential privacy with ε=${composedEpsilon.toFixed(2)} and k=${pending.contributions.length} participants`,
    };
  }

  /**
   * Verify cryptographic signature of local statistics
   * Placeholder implementation - real version would use Web Crypto
   */
  private async verifySignature(statistics: LocalStatistics): Promise<boolean> {
    // In production, verify signature against public key
    // For POC, just check signature exists
    return statistics.signature.length > 0 && statistics.publicKey.length > 0;
  }

  /**
   * Clean up expired pending aggregations
   */
  cleanupExpired(): number {
    const now = new Date();
    let cleaned = 0;
    const toDelete: string[] = [];

    this.pendingAggregations.forEach((pending, queryId) => {
      if (now > pending.progress.collectionDeadline && pending.progress.status !== 'complete') {
        toDelete.push(queryId);
      }
    });

    toDelete.forEach(queryId => {
      this.pendingAggregations.delete(queryId);
      cleaned++;
    });

    return cleaned;
  }

  /**
   * Force close a query (for testing/admin)
   */
  closeQuery(queryId: string): void {
    this.pendingAggregations.delete(queryId);
  }
}

// =============================================================================
// Query Builder
// =============================================================================

/**
 * Builder for constructing federated signal queries
 */
/** Strip readonly for builder's mutable internal state */
type Mutable<T> = { -readonly [P in keyof T]: T[P] };

export class FederatedQueryBuilder {
  private query: Partial<Mutable<FederatedSignalQuery>> & { requestedMetrics: SignalMethod[]; privacyBudget: number; requestedAt: Date } = {
    requestedMetrics: [],
    privacyBudget: 0.5,
    requestedAt: new Date(),
  };

  /**
   * Set the query ID (auto-generated if not set)
   */
  withQueryId(id: string): this {
    this.query.queryId = id as FederatedQueryId;
    return this;
  }

  /**
   * Set drug criteria
   */
  forDrug(criteria: {
    genericName?: string;
    atcCode?: string;
    brandNames?: string[];
  }): this {
    this.query.drugCriteria = criteria;
    return this;
  }

  /**
   * Set event criteria
   */
  forEvent(criteria: {
    meddraCode?: string;
    ptTerm?: string;
    socCode?: string;
    hltCode?: string;
  }): this {
    this.query.eventCriteria = criteria;
    return this;
  }

  /**
   * Set time window
   */
  inTimeRange(start: Date, end: Date): this {
    this.query.timeWindow = { start, end };
    return this;
  }

  /**
   * Request specific metrics
   */
  withMetrics(...metrics: ('PRR' | 'ROR' | 'IC' | 'EBGM' | 'CHI_SQUARE')[]): this {
    this.query.requestedMetrics = metrics;
    return this;
  }

  /**
   * Set privacy budget (epsilon)
   */
  withPrivacyBudget(epsilon: number): this {
    this.query.privacyBudget = epsilon;
    return this;
  }

  /**
   * Set requester ID
   */
  requestedBy(requesterId: string): this {
    this.query.requesterId = requesterId as FederatedOrganizationId;
    return this;
  }

  /**
   * Build the query
   */
  build(): FederatedSignalQuery {
    // Generate query ID if not set
    if (!this.query.queryId) {
      this.query.queryId = `fq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` as FederatedQueryId;
    }

    // Validate required fields
    if (!this.query.drugCriteria) {
      throw new Error('Drug criteria required');
    }
    if (!this.query.eventCriteria) {
      throw new Error('Event criteria required');
    }
    if (!this.query.timeWindow) {
      throw new Error('Time window required');
    }
    if (this.query.requestedMetrics?.length === 0) {
      this.query.requestedMetrics = ['PRR', 'ROR', 'IC'] as SignalMethod[];
    }

    return this.query as FederatedSignalQuery;
  }
}

// Note: Functions are exported inline above
