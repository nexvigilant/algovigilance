/**
 * Federated Signal Intelligence Module
 *
 * Privacy-preserving multi-organization signal detection.
 *
 * @copyright AlgoVigilance 2025
 * @license Proprietary - Trade Secret
 */

// Local Computation (per-organization)
export {
  LocalComputeModule,
  MockSafetyDatabase,
  addNoise,
  addNoiseToTable,
  computeLocalContingency,
  laplaceSample,
  gaussianSample,
  type LocalSafetyDatabase,
  type LocalComputeConfig,
} from './local-compute';

// Secure Aggregation Service
export {
  SecureAggregationService,
  FederatedQueryBuilder,
  calculatePRR,
  calculateROR,
  calculateIC,
  type AggregationServiceConfig,
} from './secure-aggregation';

export { classifySignalStrength } from './signal-utils';

// EBGM (Empirical Bayesian Geometric Mean) Algorithm
export {
  calculateEBGM,
  calculateFederatedEBGM,
  DEFAULT_GPS_HYPERPARAMETERS,
  FEDERATED_EBGM_THRESHOLDS,
  type GPSHyperparameters,
} from './ebgm';

// Re-export types
export type {
  ContingencyTable,
  ContingencyTableExtended,
  FederatedSignalQuery,
  FederatedSignalResult,
  LocalStatistics,
  LocalStatisticsMetadata,
  PRRResult,
  RORResult,
  ICResult,
  EBGMResult,
  SignalResults,
  SignalStrength,
  SignalMethod,
  AggregationProgress,
  AggregationStatus,
  PrivacyConfig,
  PrivacyBudget,
  PrivacyGuarantee,
  DrugCriteria,
  EventCriteria,
  TimeWindow,
  DataQuality,
  FederatedOrganization,
  NetworkStatistics,
  FederatedResult,
  FederatedAuditEntry,
} from '../../types/federated-signal';

// Re-export constants
export {
  FEDERATED_SIGNAL_THRESHOLDS,
  STANDARD_SIGNAL_THRESHOLDS,
} from '../../types/federated-signal';
