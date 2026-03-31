/**
 * Inter-KSB Relationships Types
 * Learning paths, prerequisites, and content connections
 */

// ============================================================================
// INTER-KSB RELATIONSHIPS (P0 - Critical for Learning Paths)
// ============================================================================

/**
 * Relationship type between KSBs
 */
export type KSBRelationshipType =
  | 'similar'           // Conceptually related
  | 'contrasting'       // Shows different approach/perspective
  | 'builds_on'         // Extends or deepens this concept
  | 'regional_variant'  // Same concept, different region
  | 'complementary';    // Together provide complete picture

/**
 * Related KSB reference with relationship metadata
 */
export interface RelatedKSB {
  ksbId: string;
  relationshipType: KSBRelationshipType;
  strength: number;                   // 0-100 relatedness score
  description?: string;               // Why they're related
  bidirectional?: boolean;            // Relationship applies both ways
}

/**
 * Inter-KSB Relationships - Learning path and content connections
 *
 * Enables:
 * - Learning path validation (prerequisites)
 * - Content recommendations (related KSBs)
 * - Deprecation workflows (supersedes/supersededBy)
 */
export interface KSBRelationships {
  // Learning sequence
  prerequisites: string[];            // KSB IDs required before this one
  corequisites: string[];             // Should be learned together
  postrequisites?: string[];          // KSBs that build on this one (derived)

  // Content connections
  relatedKSBs: RelatedKSB[];

  // Version/replacement tracking
  supersedes?: string;                // This KSB replaces older one
  supersededBy?: string;              // This KSB has been replaced
  deprecationReason?: string;         // Why it was superseded

  // Cross-domain connections
  crossDomainLinks?: {
    domainId: string;
    ksbIds: string[];
    linkType: 'foundation' | 'application' | 'integration';
  }[];
}
