// Quality gate thresholds for KSB validation
// Separated from actions.ts to avoid 'use server' export restrictions

export interface QualityGateThresholds {
  minCoverageScore: number;        // Minimum coverage score (0-100)
  minCitationCount: number;        // Minimum number of citations
  requireRegulatorySource: boolean; // Require at least one regulatory source
  maxStaleDays: number;            // Max days since last research
  minResearchQuality: number;      // Minimum research quality score
}

// Default thresholds - can be overridden per generation
export const DEFAULT_THRESHOLDS: QualityGateThresholds = {
  minCoverageScore: 30,
  minCitationCount: 0,
  requireRegulatorySource: false,
  maxStaleDays: 730, // 2 years
  minResearchQuality: 40,
};

// Stricter thresholds for production-ready content
export const PRODUCTION_THRESHOLDS: QualityGateThresholds = {
  minCoverageScore: 70,
  minCitationCount: 3,
  requireRegulatorySource: true,
  maxStaleDays: 365,
  minResearchQuality: 75,
};
