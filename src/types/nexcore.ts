/**
 * TypeScript types mirroring nexcore-api JSON responses
 */

// ── Signal Detection ──────────────────────

export interface ContingencyTable {
  a: number; // Drug + Event
  b: number; // Drug + No Event
  c: number; // No Drug + Event
  d: number; // No Drug + No Event
}

export interface SignalCompleteResponse {
  prr: number;
  prr_ci_lower: number;
  prr_ci_upper: number;
  prr_signal: boolean;
  ror: number;
  ror_ci_lower: number;
  ror_ci_upper: number;
  ror_signal: boolean;
  ic: number;
  ic_ci_lower: number;
  ic_signal: boolean;
  ebgm: number;
  eb05: number;
  ebgm_signal: boolean;
  chi_square: number;
  signal_detected: boolean;
}

export interface SignalMetricResponse {
  value: number;
  ci_lower: number;
  ci_upper: number;
  signal: boolean;
}

// ── Guardian ──────────────────────────────

export interface GuardianStatusResponse {
  iteration_count: number;
  sensor_count: number;
  actuator_count: number;
  sensors: SensorInfo[];
  actuators: ActuatorInfo[];
  status: string;
  paused: boolean;
  risk_threshold: number;
}

export interface SensorInfo {
  name: string;
  sensor_type: string;
  description: string;
}

export interface ActuatorInfo {
  name: string;
  priority: number;
  description: string;
}

export interface GuardianTickResponse {
  iteration_id: string;
  timestamp: string;
  signals_detected: number;
  actions_taken: number;
  results: ActuatorResultSummary[];
  duration_ms: number;
}

export interface ActuatorResultSummary {
  actuator: string;
  action: string;
  success: boolean;
  message: string;
}

// ── FAERS ─────────────────────────────────

export interface FaersSearchResponse {
  results: FaersResult[];
  total: number;
  query: string;
}

export interface FaersResult {
  safetyreportid: string;
  receivedate: string;
  serious: number;
  patient: {
    drug: FaersDrug[];
    reaction: FaersReaction[];
  };
}

export interface FaersDrug {
  medicinalproduct: string;
  drugcharacterization: string;
}

export interface FaersReaction {
  reactionmeddrapt: string;
  reactionoutcome: string;
}

export interface FaersDrugEventsResponse {
  drug: string;
  events: FaersEventCount[];
  total_reports: number;
}

export interface FaersEventCount {
  event: string;
  count: number;
  percentage: number;
}

export interface FaersSignalCheckResponse {
  drug: string;
  event: string;
  signal_detected: boolean;
  prr: number;
  ror: number;
  case_count: number;
}

// ── Brain ─────────────────────────────────

export interface BrainSessionsResponse {
  sessions: BrainSession[];
}

export interface BrainSession {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  artifact_count: number;
}

export interface BrainSessionResponse {
  session: BrainSession;
  artifacts: BrainArtifact[];
}

export interface BrainArtifact {
  id: string;
  name: string;
  artifact_type: string;
  content: string;
  created_at: string;
  version: number;
}

// ── Community (Hybrid Computation) ───────────

export interface CommunityAnalysisResponse {
  postId: string | null;
  pvRelevance: number;
  pvKeywords: string[];
  primitives: PrimitiveMatch[];
  topics: string[];
  signalHints: string[];
  source: "nexcore" | "local";
}

export interface PrimitiveMatch {
  name: string;
  symbol: string;
  confidence: number;
}

export interface CommunitySearchResponse {
  posts: CommunitySearchResult[];
  circles: CommunitySearchResult[];
  members: CommunitySearchResult[];
  total: number;
  query: string;
}

export interface CommunitySearchResult {
  id: string;
  type: "post" | "circle" | "member";
  title: string;
  excerpt: string;
  relevance: number;
}

export interface CommunitySuggestionsResponse {
  suggestions: CommunitySuggestion[];
}

export interface CommunitySuggestion {
  id: string;
  type: "post" | "circle" | "member";
  title: string;
  reason: string;
  score: number;
}

// ── Marketplace (PRPaaS) ──────────────────

export interface MarketplaceExpertResult {
  id: string;
  display_name: string;
  title: string;
  expertise_categories: string[];
  top_skills: string[];
  years_experience: number;
  availability: string;
  rating: number;
  review_count: number;
  verified: boolean;
  match_score: number;
  match_reasons: string[];
}

export interface MarketplaceSearchResponse {
  experts: MarketplaceExpertResult[];
  total: number;
  query: string;
}

// ── Benchmarking (PRPaaS) ─────────────────

export interface BenchmarkDataPointResponse {
  dimension: string;
  value: number;
  percentile: number;
  platform_median: number;
  platform_p25: number;
  platform_p75: number;
  sample_size: number;
  period: string;
}

export interface BenchmarkResponse {
  tenant_id: string;
  period: string;
  data_points: BenchmarkDataPointResponse[];
  overall_score: number;
  overall_percentile: number;
  insights: string[];
  recommendations: string[];
}

export interface BenchmarkAggregatesResponse {
  period: string;
  total_tenants: number;
  dimensions: {
    dimension: string;
    median: number;
    p25: number;
    p75: number;
    sample_size: number;
  }[];
}

// ── Guardian API Keys & Billing ──────────────

export interface GuardianApiKey {
  key_id: string;
  name?: string;
  prefix: string;
  created_at: string;
  last_used?: string;
  active: boolean;
}

export interface GuardianCreateKeyResponse {
  api_key: string;
  key_id: string;
  name: string;
}

export interface GuardianListKeysResponse {
  keys: GuardianApiKey[];
}

export interface GuardianUsageResponse {
  user_id: string;
  plan: string;
  queries_used: number;
  query_limit: number;
  period_start: string;
  period_end: string;
}

export interface BillingPortalResponse {
  url: string;
}

// ── Health ─────────────────────────────────

export interface HealthResponse {
  status: string;
  version?: string;
  uptime_seconds?: number;
}
