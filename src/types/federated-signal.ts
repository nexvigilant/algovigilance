/**
 * Federated Signal Intelligence Types
 *
 * Type definitions for privacy-preserving multi-organization
 * signal detection without raw ICSR data sharing.
 *
 * @remarks
 * Implements differential privacy guarantees with epsilon-based
 * budget tracking and k-anonymity validation.
 *
 * @copyright AlgoVigilance 2025
 * @license Proprietary - Trade Secret
 */

// =============================================================================
// Branded ID Types
// =============================================================================

/** Branded string type for Federated Query IDs */
export type FederatedQueryId = string & { readonly __brand: 'FederatedQueryId' };

/** Branded string type for Federated Organization IDs */
export type FederatedOrganizationId = string & { readonly __brand: 'FederatedOrganizationId' };

/** Branded string type for Audit Entry IDs */
export type AuditEntryId = string & { readonly __brand: 'AuditEntryId' };

// =============================================================================
// Enum Types with Type Guards
// =============================================================================

/**
 * Signal detection methods available for federated queries.
 */
export type SignalMethod = 'PRR' | 'ROR' | 'IC' | 'EBGM' | 'CHI_SQUARE';

/**
 * All valid signal methods.
 */
export const SIGNAL_METHODS: readonly SignalMethod[] = [
  'PRR', 'ROR', 'IC', 'EBGM', 'CHI_SQUARE'
] as const;

/**
 * Type guard for SignalMethod.
 */
export function isSignalMethod(value: string): value is SignalMethod {
  return SIGNAL_METHODS.includes(value as SignalMethod);
}

/**
 * Data quality indicator for local statistics.
 */
export type DataQuality = 'high' | 'medium' | 'low';

/**
 * All valid data quality levels.
 */
export const DATA_QUALITY_LEVELS: readonly DataQuality[] = ['high', 'medium', 'low'] as const;

/**
 * Type guard for DataQuality.
 */
export function isDataQuality(value: string): value is DataQuality {
  return DATA_QUALITY_LEVELS.includes(value as DataQuality);
}

/**
 * Status of aggregation process.
 */
export type AggregationStatus =
  | 'pending'
  | 'collecting'
  | 'aggregating'
  | 'complete'
  | 'failed'
  | 'insufficient_participants';

/**
 * All valid aggregation statuses.
 */
export const AGGREGATION_STATUSES: readonly AggregationStatus[] = [
  'pending', 'collecting', 'aggregating', 'complete', 'failed', 'insufficient_participants'
] as const;

/**
 * Type guard for AggregationStatus.
 */
export function isAggregationStatus(value: string): value is AggregationStatus {
  return AGGREGATION_STATUSES.includes(value as AggregationStatus);
}

/**
 * Signal strength classification.
 */
export type SignalStrength =
  | 'very_strong'
  | 'strong'
  | 'moderate'
  | 'weak'
  | 'very_weak'
  | 'no_signal';

/**
 * All valid signal strengths.
 */
export const SIGNAL_STRENGTHS: readonly SignalStrength[] = [
  'very_strong', 'strong', 'moderate', 'weak', 'very_weak', 'no_signal'
] as const;

/**
 * Type guard for SignalStrength.
 */
export function isSignalStrength(value: string): value is SignalStrength {
  return SIGNAL_STRENGTHS.includes(value as SignalStrength);
}

/**
 * Organization type in federated network.
 */
export type FederatedOrgType = 'pharma' | 'regulator' | 'mah' | 'cro' | 'academic';

/**
 * All valid organization types.
 */
export const FEDERATED_ORG_TYPES: readonly FederatedOrgType[] = [
  'pharma', 'regulator', 'mah', 'cro', 'academic'
] as const;

/**
 * Type guard for FederatedOrgType.
 */
export function isFederatedOrgType(value: string): value is FederatedOrgType {
  return FEDERATED_ORG_TYPES.includes(value as FederatedOrgType);
}

/**
 * Privacy noise mechanism.
 */
export type NoiseMechanism = 'laplace' | 'gaussian';

/**
 * All valid noise mechanisms.
 */
export const NOISE_MECHANISMS: readonly NoiseMechanism[] = ['laplace', 'gaussian'] as const;

/**
 * Type guard for NoiseMechanism.
 */
export function isNoiseMechanism(value: string): value is NoiseMechanism {
  return NOISE_MECHANISMS.includes(value as NoiseMechanism);
}

/**
 * Audit operation type.
 */
export type AuditOperationType = 'query' | 'contribution' | 'aggregation' | 'result';

/**
 * All valid audit operation types.
 */
export const AUDIT_OPERATION_TYPES: readonly AuditOperationType[] = [
  'query', 'contribution', 'aggregation', 'result'
] as const;

/**
 * Type guard for AuditOperationType.
 */
export function isAuditOperationType(value: string): value is AuditOperationType {
  return AUDIT_OPERATION_TYPES.includes(value as AuditOperationType);
}

/**
 * Audit operation outcome.
 */
export type AuditOutcome = 'success' | 'failure' | 'partial';

/**
 * All valid audit outcomes.
 */
export const AUDIT_OUTCOMES: readonly AuditOutcome[] = ['success', 'failure', 'partial'] as const;

/**
 * Type guard for AuditOutcome.
 */
export function isAuditOutcome(value: string): value is AuditOutcome {
  return AUDIT_OUTCOMES.includes(value as AuditOutcome);
}

// =============================================================================
// Core Types
// =============================================================================

/**
 * Contingency table for disproportionality analysis.
 * Standard 2x2 table used across all signal detection methods.
 *
 * @remarks
 * The four cells represent:
 * - a: Drug + Event (cases of interest)
 * - b: Drug + No Event
 * - c: No Drug + Event
 * - d: No Drug + No Event
 */
export interface ContingencyTable {
  /** Drug + Event (cases of interest) */
  readonly a: number;
  /** Drug + No Event */
  readonly b: number;
  /** No Drug + Event */
  readonly c: number;
  /** No Drug + No Event */
  readonly d: number;
}

/**
 * Extended contingency table with computed values.
 *
 * @remarks
 * Extends the basic table with derived statistics
 * needed for signal detection calculations.
 */
export interface ContingencyTableExtended extends ContingencyTable {
  /** Total reports: a + b + c + d */
  readonly N: number;
  /** Expected count: (a+b)(a+c)/N */
  readonly E: number;
  /** Drug total: a + b */
  readonly drugTotal: number;
  /** Event total: a + c */
  readonly eventTotal: number;
}

// =============================================================================
// Query Types
// =============================================================================

/**
 * Drug criteria for federated signal query.
 *
 * @remarks
 * At least one criterion should be provided to identify
 * the drug of interest for signal detection.
 */
export interface DrugCriteria {
  /** Generic/INN name */
  readonly genericName?: string;
  /** ATC classification code */
  readonly atcCode?: string;
  /** Brand/trade names */
  readonly brandNames?: readonly string[];
  /** Active substance identifier */
  readonly substanceId?: string;
}

/**
 * Event criteria for federated signal query.
 *
 * @remarks
 * Uses MedDRA terminology for event identification.
 */
export interface EventCriteria {
  /** MedDRA Preferred Term code */
  readonly meddraCode?: string;
  /** MedDRA PT text */
  readonly ptTerm?: string;
  /** MedDRA System Organ Class code */
  readonly socCode?: string;
  /** MedDRA HLT code */
  readonly hltCode?: string;
}

/**
 * Time window for query scope.
 */
export interface TimeWindow {
  /** Start of reporting period */
  readonly start: Date;
  /** End of reporting period */
  readonly end: Date;
}

/**
 * Federated signal query request.
 *
 * @remarks
 * Represents a complete query for federated signal detection
 * with privacy budget and audit trail.
 */
export interface FederatedSignalQuery {
  /** Unique query identifier */
  readonly queryId: FederatedQueryId;
  /** Drug selection criteria */
  readonly drugCriteria: DrugCriteria;
  /** Event selection criteria */
  readonly eventCriteria: EventCriteria;
  /** Time range for case selection */
  readonly timeWindow: TimeWindow;
  /** Signal detection methods to compute */
  readonly requestedMetrics: readonly SignalMethod[];
  /** Differential privacy epsilon for this query */
  readonly privacyBudget: number;
  /** Requesting organization (for audit) */
  readonly requesterId: FederatedOrganizationId;
  /** Timestamp of request */
  readonly requestedAt: Date;
}

// =============================================================================
// Privacy Types
// =============================================================================

/**
 * Differential privacy configuration
 */
export interface PrivacyConfig {
  /** Privacy parameter (lower = more private) */
  epsilon: number;
  /** Sensitivity of the query (typically 1 for counting queries) */
  sensitivity: number;
  /** Noise mechanism */
  mechanism: 'laplace' | 'gaussian';
}

/**
 * Organization's privacy budget status
 */
export interface PrivacyBudget {
  /** Organization identifier */
  organizationId: string;
  /** Daily total budget */
  dailyBudget: number;
  /** Budget consumed today */
  consumed: number;
  /** Budget remaining */
  remaining: number;
  /** Budget reset timestamp */
  resetsAt: Date;
}

/**
 * Privacy guarantee metadata
 */
export interface PrivacyGuarantee {
  /** Composed epsilon across all participants */
  composedEpsilon: number;
  /** Minimum participants required */
  participantMinimum: number;
  /** Whether k-anonymity threshold was met */
  kAnonymitySatisfied: boolean;
  /** Differential privacy guarantee description */
  guarantee: string;
}

// =============================================================================
// Local Computation Types
// =============================================================================

/**
 * Local statistics metadata
 */
export interface LocalStatisticsMetadata {
  /** Quality assessment of underlying data */
  dataQuality: DataQuality;
  /** Percentage of local database covered by query */
  coveragePercentage: number;
  /** Epsilon used for this contribution */
  noiseEpsilon: number;
  /** Timestamp of computation */
  computedAt: Date;
}

/**
 * Local organization's contribution to federated query
 */
export interface LocalStatistics {
  /** Query this responds to */
  queryId: string;
  /** Pseudonymous organization identifier */
  organizationId: string;
  /** When statistics were computed */
  timestamp: Date;
  /** Noised contingency table values */
  contingencyTable: ContingencyTable;
  /** Metadata about the contribution */
  metadata: LocalStatisticsMetadata;
  /** Cryptographic signature for attestation */
  signature: string;
  /** Public key for verification */
  publicKey: string;
}

// =============================================================================
// Aggregation Types
// =============================================================================

/**
 * Aggregation progress tracking
 */
export interface AggregationProgress {
  /** Current status */
  status: AggregationStatus;
  /** Participants who have contributed */
  participantsReceived: number;
  /** Total participants expected */
  participantsExpected: number;
  /** Timeout for collection phase */
  collectionDeadline: Date;
  /** Error message if failed */
  error?: string;
}

// =============================================================================
// Signal Result Types
// =============================================================================

/**
 * PRR (Proportional Reporting Ratio) result
 */
export interface PRRResult {
  /** PRR value */
  value: number;
  /** 95% CI lower bound */
  ci95Lower: number;
  /** 95% CI upper bound */
  ci95Upper: number;
  /** Chi-square statistic */
  chiSquare: number;
  /** Whether signal criteria met */
  isSignal: boolean;
  /** Signal strength classification */
  strength: SignalStrength;
}

/**
 * ROR (Reporting Odds Ratio) result
 */
export interface RORResult {
  /** ROR value */
  value: number;
  /** 95% CI lower bound */
  ci95Lower: number;
  /** 95% CI upper bound */
  ci95Upper: number;
  /** Whether signal criteria met */
  isSignal: boolean;
  /** Signal strength classification */
  strength: SignalStrength;
}

/**
 * IC (Information Component) result
 */
export interface ICResult {
  /** IC value (log2 scale) */
  value: number;
  /** IC025 (lower 95% credibility bound) */
  ic025: number;
  /** IC975 (upper 95% credibility bound) */
  ic975: number;
  /** Whether signal criteria met */
  isSignal: boolean;
  /** Signal strength classification */
  strength: SignalStrength;
}

/**
 * EBGM (Empirical Bayesian Geometric Mean) result
 * DuMouchel's Gamma-Poisson Shrinker model
 */
export interface EBGMResult {
  /** EBGM value (shrinkage-adjusted RR estimate) */
  value: number;
  /** EB05 (5th percentile of posterior - lower credibility bound) */
  eb05: number;
  /** EB95 (95th percentile of posterior - upper credibility bound) */
  eb95: number;
  /** Qn (posterior probability λ came from first mixture component) */
  posteriorWeight: number;
  /** Raw N/E ratio before shrinkage */
  rawRatio: number;
  /** Shrinkage factor applied (EBGM / rawRatio) */
  shrinkageFactor: number;
  /** Whether signal criteria met (EB05 > threshold) */
  isSignal: boolean;
  /** Signal strength classification */
  strength: SignalStrength;
}

/**
 * Combined signal detection results
 */
export interface SignalResults {
  prr?: PRRResult;
  ror?: RORResult;
  ic?: ICResult;
  ebgm?: EBGMResult;
  /** Overall signal determination */
  overallSignal: boolean;
  /** Consensus strength across methods */
  consensusStrength: SignalStrength;
}

/**
 * Complete federated signal result
 */
export interface FederatedSignalResult {
  /** Query this responds to */
  queryId: string;
  /** When result was computed */
  timestamp: Date;
  /** Number of participating organizations */
  participantCount: number;
  /** Aggregated contingency table */
  globalContingency: ContingencyTableExtended;
  /** Signal detection results by method */
  signals: SignalResults;
  /** Privacy guarantee metadata */
  privacyGuarantee: PrivacyGuarantee;
  /** Aggregation process info */
  aggregationInfo: {
    /** Collection duration in ms */
    collectionDuration: number;
    /** Computation duration in ms */
    computationDuration: number;
    /** Any participants excluded */
    excludedParticipants: number;
    /** Reason for exclusions */
    exclusionReasons?: string[];
  };
}

// =============================================================================
// Network Types
// =============================================================================

/**
 * Organization registration in federated network
 */
export interface FederatedOrganization {
  /** Unique identifier (pseudonymous) */
  id: string;
  /** Display name */
  name: string;
  /** Organization type */
  type: 'pharma' | 'regulator' | 'mah' | 'cro' | 'academic';
  /** Geographic region */
  region: string;
  /** When joined the network */
  joinedAt: Date;
  /** Current privacy budget */
  privacyBudget: PrivacyBudget;
  /** Trust score (0-100) */
  trustScore: number;
  /** Is currently active */
  isActive: boolean;
  /** Public key for secure communication */
  publicKey: string;
}

/**
 * Network-wide statistics
 */
export interface NetworkStatistics {
  /** Total registered organizations */
  totalOrganizations: number;
  /** Currently active organizations */
  activeOrganizations: number;
  /** Total queries processed */
  totalQueries: number;
  /** Queries in last 24 hours */
  queriesLast24h: number;
  /** Average participants per query */
  avgParticipation: number;
  /** Network uptime percentage */
  uptimePercentage: number;
}

// =============================================================================
// Threshold Configuration
// =============================================================================

/**
 * Signal detection thresholds for federated queries
 * More conservative than standard thresholds due to noise
 */
export const FEDERATED_SIGNAL_THRESHOLDS = {
  PRR: {
    /** Minimum PRR value for signal */
    minValue: 2.5, // Standard: 2.0
    /** Minimum chi-square */
    minChiSquare: 4.0,
    /** Minimum case count */
    minCases: 5, // Standard: 3
    /** CI lower bound must exclude null */
    ciExcludesNull: true,
  },
  ROR: {
    /** CI lower bound threshold */
    ciLowerThreshold: 1.25, // Standard: 1.0
    /** Minimum case count */
    minCases: 5,
  },
  IC: {
    /** IC025 threshold */
    ic025Threshold: 0.5, // Standard: 0.0
    /** Minimum case count */
    minCases: 5,
  },
  EBGM: {
    /** EB05 threshold for signal (conservative for federated) */
    eb05Threshold: 2.5, // Standard: 2.0
    /** Minimum EBGM value */
    minEBGM: 2.0,
    /** Minimum case count */
    minCases: 5,
  },
  /** Minimum participants for query validity */
  minParticipants: 3,
  /** Minimum total cases for aggregation */
  minTotalCases: 10,
} as const;

/**
 * Standard (non-federated) thresholds for comparison
 */
export const STANDARD_SIGNAL_THRESHOLDS = {
  PRR: {
    minValue: 2.0,
    minChiSquare: 4.0,
    minCases: 3,
    ciExcludesNull: true,
  },
  ROR: {
    ciLowerThreshold: 1.0,
    minCases: 3,
  },
  IC: {
    ic025Threshold: 0.0,
    minCases: 3,
  },
  EBGM: {
    /** Standard EB05 threshold per DuMouchel */
    eb05Threshold: 2.0,
    /** Minimum EBGM value */
    minEBGM: 2.0,
    /** Minimum case count */
    minCases: 3,
  },
} as const;

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Result wrapper for federated operations
 */
export interface FederatedResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  privacyBudgetConsumed: number;
  timestamp: Date;
}

/**
 * Audit log entry for federated operations
 */
export interface FederatedAuditEntry {
  /** Entry identifier */
  id: string;
  /** Operation type */
  operation: 'query' | 'contribution' | 'aggregation' | 'result';
  /** Actor (pseudonymous) */
  actorId: string;
  /** Query identifier */
  queryId: string;
  /** Operation timestamp */
  timestamp: Date;
  /** Operation outcome */
  outcome: 'success' | 'failure' | 'partial';
  /** Privacy budget impact */
  privacyImpact: number;
  /** Additional metadata (non-sensitive) */
  metadata: Record<string, unknown>;
}
