/**
 * Research Validation Algorithms
 *
 * CMER Framework for automated research quality assessment
 */

// v1.0 Core Implementation
export {
  validateResearch,
  quickValidate,
  type ResearchArtifact,
  type ValidationResult,
  type ValidationFlag,
  type Citation,
  type Claim,
  type DataPoint,
  type Methodology,
  type Author,
  type ResearchMetadata,
  type StudyType,
  type BiasControl,
  type FlagSeverity,
  type ValidationWeights,
} from './research-validator';

// v2.0 Extensions
export {
  // S-Value (Surprisal) module
  pValueToSValue,
  classifyEvidenceStrength,
  extractPValuesFromText,
  calculateSValueScore,
  // Effect size normalization
  oddsRatioToCohenD,
  tStatToCohenD,
  rSquaredToCohenD,
  etaSquaredToCohenD,
  interpretCohenD,
  // Domain classifier
  classifyDomain,
  getDomainWeights,
  assessDomainSpecificQuality,
  // Citation kinematics
  calculateCitationVelocity,
  calculateCitationAcceleration,
  calculateDisruptionIndex,
  calculateCredibilityScore2,
  // Reproducibility
  assessDataWithholding,
  calculateFAIRScore,
  // Kill switches
  checkKillSwitches,
  // Types
  type ResearchDomain,
  type EvidenceStrength,
  type DomainQualityIndicators,
  type CitationKinematics,
  type StatisticalEvidence,
  type DataWithholdingReason,
  type ReproducibilityAssessment,
  type KillSwitchResult,
} from './cmer-v2-extensions';

// Text Extractors
export {
  extractDomainIndicators,
  extractStatisticalEvidence,
  detectAblationStudy,
  extractICRCoefficients,
  detectPreregistration,
  detectErrorPropagation,
  detectSaturationStatement,
  detectCodeAvailability,
  detectBenchmarkComparison,
  detectVVStandards,
  detectSTROBECompliance,
} from './text-extractors';

// v2.0 Unified Validator
export {
  validateResearchV2,
  quickValidateV2,
  type ResearchArtifactV2,
  type ValidationResultV2,
  type QuickValidationV2Input,
} from './research-validator-v2';

// CIDRE - Citation Cartel Detection
export {
  // Graph construction
  createGraph,
  addNode,
  addEdge,
  buildGraph,
  // Graph metrics
  outDegree,
  inDegree,
  hasEdge,
  getNeighbors,
  getInNeighbors,
  nodeReciprocity,
  globalReciprocity,
  localClusteringCoefficient,
  globalClusteringCoefficient,
  // CIDRE core algorithm
  indirectReciprocityScore,
  nodeCIDREScore,
  findStronglyConnectedComponents,
  analyzeCluster,
  analyzeCIDRE,
  // Utility functions
  getCartelCentrality,
  isInCartelCluster,
  getNodeCluster,
  quickCartelCheck,
  // Types
  type CitationNode,
  type CitationEdge,
  type CitationGraph,
  type CartelCluster,
  type CIDREResult,
} from './cidre-algorithm';

// API Integration Architecture (Types & Stubs)
export {
  // Citation API types
  type OpenAlexWork,
  type CrossRefWork,
  type SemanticScholarPaper,
  type CitationRelationship,
  type AuthorNode,
  type FetchCitationNetworkOptions,
  // Google Cloud API types
  type FactCheckClaimReview,
  type NLPEntity,
  type EntityType,
  type APIClientConfig,
  // API endpoints
  API_ENDPOINTS,
  // Stub functions (CrossRef, Google Cloud - not yet implemented)
  fetchCrossRefReferences,
  searchFactChecks,
  extractEntities,
} from './api-integration-architecture';

// OpenAlex API Client (Live Implementation)
export {
  OpenAlexClient,
  OpenAlexError,
  OpenAlexNotFoundError,
  OpenAlexRateLimitError,
  getOpenAlexClient,
  fetchOpenAlexCitationNetwork,
  buildCitationGraphFromOpenAlex,
  type OpenAlexConfig,
} from './openalex-client';

// Semantic Scholar API Client (Live Implementation)
export {
  SemanticScholarClient,
  SemanticScholarError,
  SemanticScholarNotFoundError,
  SemanticScholarRateLimitError,
  getSemanticScholarClient,
  fetchSemanticScholarCitations,
  enrichWithSemanticScholar,
  type SemanticScholarConfig,
  type CitationWithContext,
  type ReferenceWithContext,
  type EnrichedCitationRelationship,
} from './semantic-scholar-client';

// PRISMA Systematic Review Algorithm Suite
export {
  // Core Pipeline
  processScreeningPipeline,
  quickScreen,
  // Compliance Validation
  validatePRISMACompliance,
  quickComplianceCheck,
  // Flow Diagram Generation
  generateFlowDiagramText,
  generateFlowDiagramJSON,
  // Utility Functions
  createRecord,
  getExclusionStatistics,
  validateFlowConsistency,
  // Types
  type PRISMAPhase,
  type ScreeningDecision,
  type RecordSource,
  type LiteratureRecord,
  type EligibilityCriteria,
  type ScreeningConfig,
  type PRISMAFlowDiagram,
  type PipelineResult,
  type ChecklistItemStatus,
  type ChecklistItemResult,
  type ComplianceReport,
  type SystematicReviewReport,
} from './prisma';
