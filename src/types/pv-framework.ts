/**
 * Pharmacovigilance Professional Development Framework Types
 *
 * Defines proficiency levels, competency domains, and career progression
 * pathways for pharmaceutical safety professionals.
 */

/**
 * Proficiency Levels
 * Maps to the 7-level competency framework
 */
export type ProficiencyLevel =
  | 'L1'    // Foundational - Entry level awareness
  | 'L2'    // Developing - Can perform with supervision
  | 'L3'    // Competent - Independent practitioner
  | 'L4'    // Proficient - Advanced practice
  | 'L5'    // Expert - Subject matter expert
  | 'L5+'   // Thought Leader - Industry expert
  | 'L5++'; // Authority - Global expert

/**
 * Bloom's Taxonomy Levels
 */
export type BloomLevel =
  | 'remember'
  | 'understand'
  | 'apply'
  | 'analyze'
  | 'evaluate'
  | 'create';

/**
 * KSB Type Classification
 */
export type KSBType = 'knowledge' | 'skill' | 'behavior';

/**
 * KSB Status
 */
export type KSBStatus = 'draft' | 'published' | 'archived';

/**
 * KSB Entry - Lean structure for extracted KSBs
 *
 * Firestore: /ksb_library/{ksbId}
 */
export interface KSBEntry {
  // Identity
  id: string;                      // "KSB-D01-K0001"
  domainId: string;                // "D01"
  domainName: string;              // "Foundations of PV..."
  type: KSBType;

  // Content
  name: string;                    // Item name
  description: string;             // Full description
  category: string;                // Category grouping
  subcategory: string;             // Subcategory
  topicArea: string;               // High-level topic

  // Framework Position
  proficiencyLevel: ProficiencyLevel;
  bloomsTaxonomy: BloomLevel;
  keywords: string[];
  curriculumRef: string;

  // Provenance
  source: {
    file: string;
    location: string;
    extractedAt: Date;
  };

  // Status
  status: KSBStatus;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Domain Reference - Cached stats for UI
 *
 * Firestore: /pv_domain_refs/{domainId}
 */
export interface DomainRef {
  id: string;                      // "D01"
  name: string;                    // Full domain name
  shortName: string;               // Abbreviated name
  order: number;                   // Display order (1-15)

  // Cached KSB counts
  stats: {
    knowledge: number;
    skills: number;
    behaviors: number;
    total: number;
    byLevel: Record<ProficiencyLevel, number>;
  };

  status: 'active' | 'draft';
  updatedAt: Date;
}

/**
 * User KSB Progress
 *
 * Firestore: /users/{userId}/ksb_progress/{ksbId}
 */
export interface UserKSBProgress {
  ksbId: string;
  domainId: string;
  ksbType: KSBType;

  status: 'not_started' | 'in_progress' | 'completed' | 'verified';
  currentLevel: ProficiencyLevel;
  targetLevel: ProficiencyLevel;
  progressPercentage: number;

  // Evidence
  completedActivities: string[];
  assessmentResults: Array<{
    id: string;
    score: number;
    completedAt: Date;
  }>;

  // Verification
  verifiedBy?: string;
  verifiedAt?: Date;

  // Timestamps
  startedAt: Date;
  lastActivityAt: Date;
  completedAt?: Date;
}
