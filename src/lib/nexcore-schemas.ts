/**
 * NexCore API Response Schemas (Zod)
 *
 * Engineering source: Williams 1909, Ch 5-7 — Relay / Impedance Matching
 * T1 Primitives: κ(Comparison) + ∂(Boundary) + μ(Mapping) + Σ(Sum)
 *
 * Principle: At the boundary between two electrical circuits, an impedance
 * mismatch causes signal reflection and loss. A relay or transformer matches
 * impedances so signals pass cleanly.
 *
 * Applied to API boundaries: the Rust backend and TypeScript frontend are
 * two "circuits" with different type systems. Zod schemas at the boundary
 * act as the relay — validating that what arrives matches what we expect,
 * and catching impedance mismatches (schema drift) at the boundary
 * rather than letting corrupt data propagate into UI components.
 */

import { z } from 'zod';

// ── Signal Detection ──────────────────────

export const SignalCompleteSchema = z.object({
  prr: z.number(),
  prr_ci_lower: z.number(),
  prr_ci_upper: z.number(),
  prr_signal: z.boolean(),
  ror: z.number(),
  ror_ci_lower: z.number(),
  ror_ci_upper: z.number(),
  ror_signal: z.boolean(),
  ic: z.number(),
  ic_ci_lower: z.number(),
  ic_signal: z.boolean(),
  ebgm: z.number(),
  eb05: z.number(),
  ebgm_signal: z.boolean(),
  chi_square: z.number(),
  signal_detected: z.boolean(),
});

// ── Guardian ──────────────────────────────

export const GuardianStatusSchema = z.object({
  iteration_count: z.number(),
  sensor_count: z.number(),
  actuator_count: z.number(),
  sensors: z.array(z.object({
    name: z.string(),
    sensor_type: z.string(),
    description: z.string(),
  })),
  actuators: z.array(z.object({
    name: z.string(),
    priority: z.number(),
    description: z.string(),
  })),
  status: z.string(),
  paused: z.boolean(),
  risk_threshold: z.number(),
});

export const GuardianTickSchema = z.object({
  iteration_id: z.string(),
  timestamp: z.string(),
  signals_detected: z.number(),
  actions_taken: z.number(),
  results: z.array(z.object({
    actuator: z.string(),
    action: z.string(),
    success: z.boolean(),
    message: z.string(),
  })),
  duration_ms: z.number(),
});

// ── FAERS ─────────────────────────────────

export const FaersSearchSchema = z.object({
  results: z.array(z.object({
    safetyreportid: z.string(),
    receivedate: z.string(),
    serious: z.number(),
    patient: z.object({
      drug: z.array(z.object({
        medicinalproduct: z.string(),
        drugcharacterization: z.string(),
      })),
      reaction: z.array(z.object({
        reactionmeddrapt: z.string(),
        reactionoutcome: z.string(),
      })),
    }),
  })),
  total: z.number(),
  query: z.string(),
});

export const FaersDrugEventsSchema = z.object({
  drug: z.string(),
  events: z.array(z.object({
    event: z.string(),
    count: z.number(),
    percentage: z.number(),
  })),
  total_reports: z.number(),
});

export const FaersSignalCheckSchema = z.object({
  drug: z.string(),
  event: z.string(),
  signal_detected: z.boolean(),
  prr: z.number(),
  ror: z.number(),
  case_count: z.number(),
});

// ── Brain ─────────────────────────────────

const BrainSessionShape = z.object({
  id: z.string(),
  name: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  artifact_count: z.number(),
});

export const BrainSessionsSchema = z.object({
  sessions: z.array(BrainSessionShape),
});

export const BrainSessionSchema = z.object({
  session: BrainSessionShape,
  artifacts: z.array(z.object({
    id: z.string(),
    name: z.string(),
    artifact_type: z.string(),
    content: z.string(),
    created_at: z.string(),
    version: z.number(),
  })),
});

// ── Health ─────────────────────────────────

export const HealthSchema = z.object({
  status: z.string(),
  version: z.string().optional(),
  uptime_seconds: z.number().optional(),
});

// ── Community ─────────────────────────────

const PrimitiveMatchShape = z.object({
  name: z.string(),
  symbol: z.string(),
  confidence: z.number(),
});

export const CommunityAnalysisSchema = z.object({
  postId: z.string().nullable(),
  pvRelevance: z.number(),
  pvKeywords: z.array(z.string()),
  primitives: z.array(PrimitiveMatchShape),
  topics: z.array(z.string()),
  signalHints: z.array(z.string()),
  source: z.enum(['nexcore', 'local']),
});

const CommunitySearchResultShape = z.object({
  id: z.string(),
  type: z.enum(['post', 'circle', 'member']),
  title: z.string(),
  excerpt: z.string(),
  relevance: z.number(),
});

export const CommunitySearchSchema = z.object({
  posts: z.array(CommunitySearchResultShape),
  circles: z.array(CommunitySearchResultShape),
  members: z.array(CommunitySearchResultShape),
  total: z.number(),
  query: z.string(),
});

const CommunitySuggestionShape = z.object({
  id: z.string(),
  type: z.enum(['post', 'circle', 'member']),
  title: z.string(),
  reason: z.string(),
  score: z.number(),
});

export const CommunitySuggestionsSchema = z.object({
  suggestions: z.array(CommunitySuggestionShape),
});

// ── Marketplace ──────────────────────────

export const MarketplaceSearchSchema = z.object({
  experts: z.array(z.object({
    id: z.string(),
    display_name: z.string(),
    title: z.string(),
    expertise_categories: z.array(z.string()),
    top_skills: z.array(z.string()),
    years_experience: z.number(),
    availability: z.string(),
    rating: z.number(),
    review_count: z.number(),
    verified: z.boolean(),
    match_score: z.number(),
    match_reasons: z.array(z.string()),
  })),
  total: z.number(),
  query: z.string(),
});

// ── Benchmarks ───────────────────────────

export const BenchmarkSchema = z.object({
  tenant_id: z.string(),
  period: z.string(),
  data_points: z.array(z.object({
    dimension: z.string(),
    value: z.number(),
    percentile: z.number(),
    platform_median: z.number(),
    platform_p25: z.number(),
    platform_p75: z.number(),
    sample_size: z.number(),
    period: z.string(),
  })),
  overall_score: z.number(),
  overall_percentile: z.number(),
  insights: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export const BenchmarkAggregatesSchema = z.object({
  period: z.string(),
  total_tenants: z.number(),
  dimensions: z.array(z.object({
    dimension: z.string(),
    median: z.number(),
    p25: z.number(),
    p75: z.number(),
    sample_size: z.number(),
  })),
});

// ── Schema Registry ───────────────────────
// Maps API paths to their Zod schemas for automatic validation.

export const schemaRegistry: Record<string, z.ZodType> = {
  '/api/v1/pv/signal/complete': SignalCompleteSchema,
  '/api/v1/guardian/status': GuardianStatusSchema,
  '/api/v1/guardian/tick': GuardianTickSchema,
  '/api/v1/faers/search': FaersSearchSchema,
  '/api/v1/faers/drug-events': FaersDrugEventsSchema,
  '/api/v1/faers/signal-check': FaersSignalCheckSchema,
  '/api/v1/brain/sessions': BrainSessionsSchema,
  '/api/v1/community/analyze': CommunityAnalysisSchema,
  '/api/v1/community/search': CommunitySearchSchema,
  '/api/v1/community/suggestions': CommunitySuggestionsSchema,
  '/api/v1/community/for-you': CommunitySuggestionsSchema,
  '/api/v1/marketplace/experts': MarketplaceSearchSchema,
  '/api/v1/benchmarks': BenchmarkSchema,
  '/api/v1/benchmarks/platform': BenchmarkAggregatesSchema,
  '/health': HealthSchema,
};

/**
 * Look up the Zod schema for a given API path.
 * Returns undefined for unregistered paths (no validation).
 */
export function getSchemaForPath(path: string): z.ZodType | undefined {
  // Strip query params for matching
  const basePath = path.split('?')[0];
  return schemaRegistry[basePath];
}
