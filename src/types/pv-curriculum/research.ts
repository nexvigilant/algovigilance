/**
 * Research & Provenance Types
 * Citations, regulatory context, and AI generation metadata
 */

// ============================================================================
// RESEARCH & PROVENANCE TYPES
// ============================================================================

/**
 * Citation type for categorizing sources
 */
export type CitationType =
  | 'regulation'        // CFR, EU regulations
  | 'guidance'          // FDA guidance, ICH guidelines, GVP modules
  | 'journal'           // Peer-reviewed articles
  | 'book'              // Textbooks, reference books
  | 'website'           // Official websites, databases
  | 'internal'          // Company SOPs, internal docs
  | 'standard';         // Industry standards (ISO, etc.)

/**
 * Authority level of research sources
 */
export type AuthorityLevel =
  | 'regulatory'        // Law/regulation (highest authority)
  | 'guidance'          // Official guidance documents
  | 'industry_standard' // Widely accepted practices
  | 'peer_reviewed'     // Academic/scientific literature
  | 'expert_opinion'    // SME input, white papers
  | 'internal';         // Internal documentation

/**
 * Citation - Individual source reference
 */
export interface Citation {
  id: string;
  type: CitationType;
  title: string;
  source: string;                     // "FDA", "ICH", "EMA", journal name, etc.
  identifier?: string;                // DOI, CFR number, ICH code (e.g., "E2A")
  url?: string;
  section?: string;                   // Specific section referenced
  publishedDate?: Date;
  accessedDate: Date;
  relevanceScore: number;             // 1-5 (5 = directly applicable)
  notes?: string;                     // Why this source is relevant
}

/**
 * Research Data - Complete research provenance for a KSB
 */
export interface ResearchData {
  citations: Citation[];
  authorityLevel: AuthorityLevel;

  // Research metadata
  lastResearchedAt: Date;
  researchedBy?: string;              // User ID who conducted research
  researchMethod?: 'manual' | 'ai_assisted' | 'sme_interview' | 'literature_review';

  // Geographic and temporal scope
  geographicScope: string[];          // ['global', 'us', 'eu', 'japan', etc.]
  temporalValidity?: {
    validFrom?: Date;
    validUntil?: Date;                // When content may need review
    reviewTriggers?: string[];        // Events that trigger review
  };

  // Research completeness
  coverageAreas: {
    definition: boolean;              // Core concept defined
    regulations: boolean;             // Regulatory requirements covered
    bestPractices: boolean;           // Industry standards included
    examples: boolean;                // Real-world examples provided
    assessmentCriteria: boolean;      // How to evaluate competency
  };

  // Quality indicators
  sourceCount: number;                // Total citations
  primarySourceCount: number;         // Regulatory/guidance sources
  peerReviewedCount: number;          // Academic sources
}

/**
 * AI Generation Metadata - Audit trail for AI-generated content
 */
export interface AIGenerationMeta {
  // Model information
  model: string;                      // "gemini-2.5-flash-001"
  promptVersion: string;              // Version of prompt template used
  promptTemplate?: string;            // Name/ID of prompt template

  // Input context
  sourceDocuments: string[];          // Document IDs fed to AI
  researchDataUsed: boolean;          // Whether ResearchData was provided
  contextTokens?: number;             // Approximate tokens in context

  // Output metrics
  generatedAt: Date;
  generationDurationMs?: number;      // How long generation took
  confidenceScore?: number;           // AI's self-assessed confidence (0-100)
  tokensGenerated?: number;           // Output token count

  // Post-generation edits
  humanEditPercentage?: number;       // % of content modified by humans
  editedBy?: string;                  // User ID who edited
  editedAt?: Date;
  editSummary?: string;               // What was changed

  // Regeneration tracking
  regenerationCount: number;          // Times this content was regenerated
  regenerationReason?: string;        // Why last regeneration occurred
  previousVersionId?: string;         // Link to previous version
}

/**
 * Regulatory Context - Jurisdiction and guideline applicability
 */
export interface RegulatoryContext {
  // Primary applicability
  primaryRegion: 'global' | 'us' | 'eu' | 'japan' | 'china' | 'canada' | 'australia' | 'row';

  // Applicable guidelines and regulations
  applicableGuidelines: RegulatoryReference[];

  // Regional variations
  regionalVariations?: RegionalVariation[];

  // Regulatory update tracking
  lastRegulatoryReview?: Date;
  nextReviewDue?: Date;
  regulatoryChangeAlerts?: string[];  // Pending changes to monitor
}

/**
 * Reference to a specific regulatory document
 */
export interface RegulatoryReference {
  type: 'ich' | 'fda' | 'ema' | 'pmda' | 'nmpa' | 'hc' | 'tga' | 'who' | 'other';
  code: string;                       // "E2A", "21 CFR 312.32", "GVP Module VI"
  title: string;
  section?: string;                   // Specific section if applicable
  version?: string;                   // Document version/revision
  effectiveDate?: Date;
}

/**
 * Regional variation in regulatory requirements
 */
export interface RegionalVariation {
  region: string;                     // "US", "EU", "Japan", etc.
  variation: string;                  // Description of how it differs
  guideline?: string;                 // Specific guideline that differs
  impact: 'content' | 'process' | 'timeline' | 'format';
  notes?: string;
}
