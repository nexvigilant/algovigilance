/**
 * Community Marketplace Types
 *
 * Expert marketplace, anonymized case studies, and peer benchmarking.
 * Maps to PRPaaS: COMMUNITY = forums + knowledge sharing +
 * anonymized case studies + peer benchmarking + expert marketplace.
 *
 * @module types/community/marketplace
 */

import type { FlexibleTimestamp } from './timestamps';

// ============================================================================
// Expert Marketplace
// ============================================================================

export type ExpertiseCategory =
  | 'medicinal_chemistry'
  | 'pharmacovigilance'
  | 'regulatory_affairs'
  | 'clinical_operations'
  | 'biostatistics'
  | 'pharmacology'
  | 'toxicology'
  | 'drug_safety'
  | 'signal_detection'
  | 'medical_writing'
  | 'quality_assurance'
  | 'data_management'
  | 'patent_strategy'
  | 'bd_licensing';

export const EXPERTISE_CATEGORIES: ExpertiseCategory[] = [
  'medicinal_chemistry', 'pharmacovigilance', 'regulatory_affairs',
  'clinical_operations', 'biostatistics', 'pharmacology', 'toxicology',
  'drug_safety', 'signal_detection', 'medical_writing', 'quality_assurance',
  'data_management', 'patent_strategy', 'bd_licensing',
];

export type ExpertAvailability = 'available' | 'limited' | 'booked' | 'inactive';

export type EngagementType = 'consulting' | 'fractional' | 'advisory' | 'project' | 'mentoring';

/** Expert profile linked to community member */
export interface ExpertProfile {
  id: string;
  userId: string;
  tenantId?: string;          // Null for independent experts
  displayName: string;
  avatar?: string;
  title: string;              // e.g. "Senior PV Scientist"
  organization?: string;
  bio: string;
  expertiseCategories: ExpertiseCategory[];
  skills: string[];           // Specific skills (e.g. "MedDRA coding", "PSUR authoring")
  yearsExperience: number;
  certifications: string[];   // Professional certs (e.g. "ISoP", "RAPS")
  availability: ExpertAvailability;
  engagementTypes: EngagementType[];
  hourlyRate?: number;        // In cents (USD). Null = contact for pricing
  currency: string;
  rating: number;             // 0-5 from completed engagements
  reviewCount: number;
  completedEngagements: number;
  // PRPaaS: Academy-to-marketplace pipeline
  pathwayCompletions: string[];  // Completed capability pathway IDs
  communityReputation: number;   // Mirrors community reputation score
  verifiedExpert: boolean;       // Platform-verified credentials
  status: 'pending_review' | 'active' | 'suspended';
  createdAt: FlexibleTimestamp;
  updatedAt: FlexibleTimestamp;
}

/** Expert marketplace listing (public-facing view) */
export interface ExpertListing {
  id: string;
  expertId: string;
  displayName: string;
  avatar?: string;
  title: string;
  expertiseCategories: ExpertiseCategory[];
  topSkills: string[];        // Top 5 skills
  yearsExperience: number;
  availability: ExpertAvailability;
  engagementTypes: EngagementType[];
  rating: number;
  reviewCount: number;
  verifiedExpert: boolean;
  matchScore?: number;        // Populated during search/recommendations
  matchReasons?: string[];    // Why this expert was recommended
}

/** Expert engagement request */
export interface ExpertEngagement {
  id: string;
  expertId: string;
  requestorUserId: string;
  requestorTenantId: string;
  engagementType: EngagementType;
  title: string;
  description: string;
  estimatedHours?: number;
  budgetCents?: number;
  status: 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  platformCommissionPercent: number;  // 15% per PRPaaS
  createdAt: FlexibleTimestamp;
  completedAt?: FlexibleTimestamp;
}

// ============================================================================
// Anonymized Case Studies
// ============================================================================

export type CaseStudyCategory =
  | 'signal_detection'
  | 'risk_assessment'
  | 'regulatory_submission'
  | 'drug_interaction'
  | 'safety_communication'
  | 'periodic_reporting'
  | 'clinical_trial_safety'
  | 'post_market_surveillance';

export const CASE_STUDY_CATEGORIES: CaseStudyCategory[] = [
  'signal_detection', 'risk_assessment', 'regulatory_submission',
  'drug_interaction', 'safety_communication', 'periodic_reporting',
  'clinical_trial_safety', 'post_market_surveillance',
];

/** Anonymized case study for cross-tenant knowledge sharing */
export interface CaseStudy {
  id: string;
  authorUserId: string;
  authorTenantId: string;
  // All identifying info stripped — anonymized at publish time
  title: string;
  summary: string;
  content: string;              // Markdown, anonymized
  contentHtml: string;
  category: CaseStudyCategory;
  tags: string[];
  therapeuticArea?: string;     // Generic (e.g. "oncology", not specific drug)
  regulatoryContext?: string;   // e.g. "ICH E2C(R2)", "FDA REMS"
  lessonsLearned: string[];
  primitives: string[];         // T1/T2 primitives identified
  // Engagement
  viewCount: number;
  bookmarkCount: number;
  citationCount: number;        // Times referenced in other posts
  helpfulVotes: number;
  // NexCore analysis
  nexcoreAnalysis?: {
    pvRelevance: number;
    pvKeywords: string[];
    topics: string[];
    signalHints: string[];
    analyzedAt: FlexibleTimestamp;
  };
  // Platform metadata
  visibility: 'platform' | 'tenant';  // Platform = visible to all tenants
  status: 'draft' | 'pending_review' | 'published' | 'archived';
  reviewedBy?: string;          // Admin who approved for platform visibility
  publishedAt?: FlexibleTimestamp;
  createdAt: FlexibleTimestamp;
  updatedAt: FlexibleTimestamp;
}

// ============================================================================
// Peer Benchmarking
// ============================================================================

export type BenchmarkDimension =
  | 'signal_detection_rate'
  | 'case_processing_time'
  | 'report_quality_score'
  | 'regulatory_compliance_rate'
  | 'team_competency_level'
  | 'knowledge_coverage'
  | 'community_engagement';

export const BENCHMARK_DIMENSIONS: BenchmarkDimension[] = [
  'signal_detection_rate', 'case_processing_time', 'report_quality_score',
  'regulatory_compliance_rate', 'team_competency_level', 'knowledge_coverage',
  'community_engagement',
];

/** Anonymized benchmark data point (one tenant's metric) */
export interface BenchmarkDataPoint {
  dimension: BenchmarkDimension;
  value: number;
  percentile: number;           // Tenant's percentile vs platform
  platformMedian: number;
  platformP25: number;
  platformP75: number;
  sampleSize: number;           // Number of tenants contributing
  period: string;               // e.g. "2026-Q1"
}

/** Benchmark report for a tenant */
export interface BenchmarkReport {
  tenantId: string;
  period: string;
  generatedAt: string;
  dataPoints: BenchmarkDataPoint[];
  overallScore: number;         // Composite 0-100
  overallPercentile: number;
  insights: string[];           // AI-generated insights
  recommendations: string[];    // Platform-generated recommendations
}

// ============================================================================
// Community Content with Tenant Awareness
// ============================================================================

/** Extended post data with PRPaaS platform fields */
export interface PlatformPostMetadata {
  tenantId?: string;            // Null for platform-level content
  visibility: 'tenant' | 'platform';  // Who can see it
  // NexCore computation results (stored after fire-and-forget analysis)
  nexcoreAnalysis?: {
    pvRelevance: number;
    pvKeywords: string[];
    primitives: { name: string; symbol: string; confidence: number }[];
    topics: string[];
    signalHints: string[];
    analyzedAt: FlexibleTimestamp;
  };
  // Platform ML contribution
  contributedToMl: boolean;     // Whether this content feeds platform ML
  anonymizedForAggregation: boolean;
}
