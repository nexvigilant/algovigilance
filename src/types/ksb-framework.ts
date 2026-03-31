/**
 * KSB Framework Integration Types
 *
 * Integrates Knowledge, Skills, and Behaviors (KSBs) with the
 * Universal Competency Framework (Domains, EPAs, CPAs).
 *
 * Architecture: KSB Management → Functional Areas → Domain-Specific KSBs
 */

import type { Timestamp } from 'firebase/firestore';
import type { ProficiencyLevel } from './pv-framework';

/**
 * KSB Type Classification
 */
export type KSBType = 'knowledge' | 'skill' | 'behavior';

/**
 * KSB Status Workflow
 */
export type KSBStatus =
  | 'draft'              // Initial creation
  | 'pending_review'     // Submitted for expert review
  | 'approved'           // Approved and ready for use
  | 'published'          // Live and available to learners
  | 'archived';          // Deprecated/retired

/**
 * Bloom's Taxonomy Levels for Learning Objectives
 */
export type BloomLevel =
  | 'remember'    // Recall facts
  | 'understand'  // Explain concepts
  | 'apply'       // Use knowledge
  | 'analyze'     // Break down information
  | 'evaluate'    // Justify decisions
  | 'create';     // Generate new ideas

/**
 * Role Types for Career Mapping
 */
export type RoleType = 'entry' | 'mid' | 'senior' | 'executive';

/**
 * Criticality Levels
 */
export type CriticalityLevel = 'essential' | 'important' | 'beneficial';

/**
 * User Progress Status
 */
export type ProgressStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'verified';      // Supervisor endorsed

/**
 * KSB Framework Alignment
 *
 * Maps KSB to Domains, EPAs, and CPAs from deployed framework
 */
export interface KSBFrameworkAlignment {
  // Competency Domains (from /domains collection)
  competency_domains: Array<{
    domain_id: string;                  // "D1", "D2", etc.
    domain_name: string;                // "Scientific Foundation"
    cluster_name: string;               // "Core Clinical Competencies"
    relevance: 'primary' | 'secondary' | 'supporting';
    level_target: ProficiencyLevel;     // L1-L5++
    behavioral_anchors: string[];       // Observable behaviors at this level
  }>;

  // EPA Alignment (from /epas collection)
  epa_alignment: Array<{
    epa_id: string;                     // "EPA-1", "EPA-2", etc.
    epa_name: string;                   // "Individual Case Safety Report Processing"
    epa_type: 'core' | 'executive';
    contribution: 'essential' | 'supporting' | 'peripheral';
    entrustment_level: ProficiencyLevel;
    observable_criteria: string[];      // Performance criteria
  }>;

  // CPA Alignment (from /cpas collection) - optional
  cpa_alignment?: Array<{
    cpa_id: string;                     // "CPA-1", "CPA-2", etc.
    cpa_name: string;                   // "Safety Data Management"
    cpa_tier: string;                   // "foundation", "advanced", "capstone"
    integration_role: string;           // How KSB integrates into CPA
  }>;
}

/**
 * Entrustment Criteria
 *
 * Observable criteria for competence at target proficiency level
 */
export interface EntrustmentCriteria {
  supervision_required: string;         // Description of supervision level
  observable_behaviors: string[];       // 5-10 observable actions
  performance_standards: string[];      // 3-5 quality metrics
  advancement_requirements: string[];   // 2-4 criteria to advance
}

/**
 * Learning Objective with Bloom's Taxonomy
 */
export interface LearningObjective {
  objective: string;                    // SMART objective statement
  bloom_level: BloomLevel;
  assessment_method: string;            // How competence is measured
}

/**
 * Content Structure Weights
 *
 * Must sum to 100
 */
export interface ContentStructure {
  theory_weight: number;                // 0-100
  practice_weight: number;              // 0-100
  assessment_weight: number;            // 0-100
}

/**
 * Occupation Role for Career Mapping
 */
export interface OccupationRole {
  job_title: string;                    // "Drug Safety Associate"
  role_type: RoleType;
  criticality: CriticalityLevel;
}

/**
 * Quality Metrics
 */
export interface QualityMetrics {
  validation_score: number;             // 0-100
  factual_accuracy: number;             // 0-100
  completeness: number;                 // 0-100
  last_validated: Timestamp | Date;
}

/**
 * Core KSB Document
 *
 * Firestore: /ksb_library/{ksbId}
 */
export interface KSB {
  // Core Identity
  id: string;                           // "K-PV-001", "S-PV-042", "B-PV-015"
  functional_area: string;              // "pharmacovigilance"
  professional_domain: string;          // "pharmacovigilance"
  name: string;                         // Concise title
  type: KSBType;
  description: string;                  // Comprehensive overview

  // Framework Integration
  framework_alignment: KSBFrameworkAlignment;
  proficiency_level_target: ProficiencyLevel;
  entrustment_criteria: EntrustmentCriteria;

  // Learning Content
  learning_objectives: LearningObjective[];
  content_structure: ContentStructure;
  recommended_learning_activities: string[];
  assessment_strategies: string[];

  // Career Mapping
  occupation_roles: OccupationRole[];
  career_pathways: string[];            // Career progression paths

  // Research Foundation (simplified - full data in research pipeline)
  research_summary?: string;            // Comprehensive synthesis
  citations_count: number;              // Count of authoritative sources

  // Quality Metrics
  quality_metrics: QualityMetrics;

  // Status & Workflow
  status: KSBStatus;
  priority: number;                     // 1-5, higher = more important

  // Metadata
  created_by: string;                   // User ID
  approved_by?: string;                 // User ID
  created_at: Timestamp | Date;
  updated_at: Timestamp | Date;
  published_at?: Timestamp | Date;

  // Optional
  tags?: string[];                      // For filtering/search
  notes?: string;                       // Internal notes
}

/**
 * Functional Area
 *
 * Organizes KSBs by professional domain
 * Firestore: /functional_areas/{areaId}
 */
export interface FunctionalArea {
  // Identity
  area_id: string;                      // "pharmacovigilance", "clinical_research"
  area_name: string;                    // "Pharmacovigilance"
  description: string;                  // Long description
  icon: string;                         // Lucide icon name
  professional_domain: string;          // Maps to framework

  // Statistics (cached for performance)
  stats: {
    total_ksbs: number;
    knowledge_count: number;
    skills_count: number;
    behaviors_count: number;
    published_count: number;
    draft_count: number;
  };

  // Framework References
  framework_metadata_id: string;        // "pharmacovigilance"
  total_domains: number;                // 15 for PV
  total_epas: number;                   // 20 for PV
  total_cpas: number;                   // 8 for PV

  // Status
  status: 'active' | 'coming_soon' | 'archived';
  order: number;                        // Display order

  // Metadata
  created_at: Timestamp | Date;
  updated_at: Timestamp | Date;
}

/**
 * User KSB Progress
 *
 * Tracks individual user progress on specific KSB
 * Firestore: /users/{userId}/ksb_progress/{ksbId}
 */
export interface KSBProgress {
  // Identity
  user_id: string;
  ksb_id: string;
  ksb_name: string;
  ksb_type: KSBType;
  functional_area: string;

  // Progress Tracking
  status: ProgressStatus;
  progress_percentage: number;          // 0-100

  current_proficiency: ProficiencyLevel;
  target_proficiency: ProficiencyLevel;

  // Learning Activities
  completed_activities: string[];
  completed_assessments: Array<{
    assessment_id: string;
    score: number;                      // 0-100
    completed_at: Timestamp | Date;
  }>;

  // Supervisor Verification
  verified_by?: string;                 // Supervisor user ID
  verification_date?: Timestamp | Date;
  verification_notes?: string;

  // Timestamps
  started_at: Timestamp | Date;
  completed_at?: Timestamp | Date;
  last_activity_at: Timestamp | Date;
}

/**
 * Create KSB Request
 */
export interface CreateKSBRequest {
  functional_area: string;
  professional_domain: string;
  name: string;
  type: KSBType;
  description: string;

  framework_alignment: KSBFrameworkAlignment;
  proficiency_level_target: ProficiencyLevel;
  entrustment_criteria: EntrustmentCriteria;

  learning_objectives: LearningObjective[];
  content_structure: ContentStructure;
  recommended_learning_activities: string[];
  assessment_strategies: string[];

  occupation_roles: OccupationRole[];
  career_pathways: string[];

  priority?: number;
  tags?: string[];
  notes?: string;
}

/**
 * Update KSB Request
 */
export interface UpdateKSBRequest {
  name?: string;
  description?: string;

  framework_alignment?: KSBFrameworkAlignment;
  proficiency_level_target?: ProficiencyLevel;
  entrustment_criteria?: EntrustmentCriteria;

  learning_objectives?: LearningObjective[];
  content_structure?: ContentStructure;
  recommended_learning_activities?: string[];
  assessment_strategies?: string[];

  occupation_roles?: OccupationRole[];
  career_pathways?: string[];

  research_summary?: string;
  citations_count?: number;

  status?: KSBStatus;
  priority?: number;

  tags?: string[];
  notes?: string;
}

/**
 * KSB Filter Options
 */
export interface KSBFilter {
  functional_area?: string;
  type?: KSBType | KSBType[];
  status?: KSBStatus | KSBStatus[];
  proficiency_level?: ProficiencyLevel | ProficiencyLevel[];
  domain_id?: string;                   // Filter by domain alignment
  epa_id?: string;                      // Filter by EPA alignment
  cpa_id?: string;                      // Filter by CPA alignment
  tags?: string[];
  search_query?: string;
}

/**
 * KSB Coverage Analysis
 *
 * Analyzes framework coverage for a functional area
 */
export interface KSBCoverageAnalysis {
  functional_area: string;

  // Domain Coverage
  domain_coverage: Record<string, {
    domain_name: string;
    ksb_count: number;
    coverage_percentage: number;        // % of expected KSBs
  }>;

  // EPA Coverage
  epa_coverage: Record<string, {
    epa_name: string;
    ksb_count: number;
    coverage_percentage: number;
  }>;

  // CPA Coverage
  cpa_coverage: Record<string, {
    cpa_name: string;
    ksb_count: number;
    coverage_percentage: number;
  }>;

  // Proficiency Level Distribution
  proficiency_distribution: Record<ProficiencyLevel, number>;

  // Coverage Gaps
  gaps: Array<{
    type: 'domain' | 'epa' | 'cpa';
    id: string;
    name: string;
    missing_ksbs: number;
    priority: 'high' | 'medium' | 'low';
  }>;

  // Overall Statistics
  overall: {
    total_ksbs: number;
    knowledge_count: number;
    skills_count: number;
    behaviors_count: number;
    average_coverage: number;           // 0-100
  };
}

/**
 * Framework Alignment Options
 *
 * Available options for framework alignment picker
 */
export interface FrameworkAlignmentOptions {
  domains: Array<{
    domain_id: string;
    domain_name: string;
    cluster_name: string;
    proficiency_levels: ProficiencyLevel[];
  }>;

  epas: Array<{
    epa_id: string;
    epa_name: string;
    epa_type: 'core' | 'executive';
    entrustment_levels: ProficiencyLevel[];
  }>;

  cpas: Array<{
    cpa_id: string;
    cpa_name: string;
    cpa_tier: string;
  }>;
}
