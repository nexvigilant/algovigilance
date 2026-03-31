/**
 * PV Framework Types
 * Domains, anchors, assessments, and metrics
 */

import type { ProficiencyLevel } from './core';

// ============================================================================
// DOMAIN TYPES
// ============================================================================

/**
 * Domain Overview
 *
 * Firestore: /pv_domains/{domainId}
 */
export interface PVDomain {
  id: string;                           // "D01", "D02", etc.
  name: string;                         // Full domain name
  definition: string;                   // Comprehensive definition
  educationalRationale: string;         // Why this domain matters
  positionInFramework: string;          // Where it fits in overall framework
  prerequisites: string[];              // Required prior domains
  advancementPathways: string[];        // Next domains/careers
  totalKSBs: number;                    // Cached count

  // Statistics (cached for UI performance)
  stats: {
    knowledge: number;
    skills: number;
    behaviors: number;
    aiIntegration: number;
    activityAnchors: number;
    assessmentMethods: number;
  };

  // Metadata
  status: 'active' | 'draft' | 'archived';
  order: number;                        // Display order (1-15)
  lastUpdated: Date;
  createdAt: Date;
}

/**
 * Activity Anchor
 *
 * Observable behaviors that describe competence at each proficiency level
 * Firestore: /pv_domains/{domainId}/activity_anchors/{anchorId}
 */
export interface ActivityAnchor {
  id: string;                           // "D01-L3-01"
  domainId: string;
  proficiencyLevel: ProficiencyLevel;
  levelName: string;                    // "Competent", "Expert", etc.
  anchorNumber: number;                 // Order within level
  activityDescription: string;          // What the person can do
  observableBehaviors: string[];        // Specific observable actions
  evidenceTypes: string[];              // How to demonstrate competence

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Assessment Method
 *
 * How to evaluate competence for a domain
 * Firestore: /pv_domains/{domainId}/assessment_methods/{methodId}
 */
export interface AssessmentMethod {
  id: string;                           // "D01-AM-01"
  domainId: string;
  assessmentType: string;               // "Written Exam", "Portfolio", etc.
  purpose: string;                      // Why this assessment
  applicableLevels: ProficiencyLevel[]; // Which levels it applies to
  evidenceRequired: string;             // What evidence is needed
  passingCriteria: string;              // What constitutes passing
  frequency: string;                    // How often assessed
  assessorQualifications: string;       // Who can assess

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cross-Domain Integration
 *
 * Relationships between domains
 * Firestore: /pv_domain_integration/{integrationId}
 */
export interface DomainIntegration {
  id: string;                           // "D01-D05-primary"
  sourceDomainId: string;               // "D01"
  direction: string;                    // "Primary", "Supporting", "AI Gateway"
  relatedDomain: string;                // "D05" or "EPA3"
  integrationPoint: string;             // Name of integration
  dataProcessExchange: string;          // What is exchanged
  prerequisiteLevel?: ProficiencyLevel; // Required level
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Implementation Guidance
 *
 * Learning phases for domain mastery
 * Firestore: /pv_implementation_guidance/{guideId}
 */
export interface ImplementationPhase {
  id: string;                           // "D01-P1"
  domainId: string;
  phase: number;                        // 1, 2, 3, etc.
  phaseName: string;                    // "Foundation", "Advanced", etc.
  duration: string;                     // "3 weeks", "Ongoing"
  focusAreas: string;                   // What to focus on
  keyActivities: string;                // Activities to complete
  assessmentGate: string;               // What must pass to proceed
  resourcesRequired: string;            // Resources needed

  // Flag for review
  reviewRequired?: boolean;             // True if evidence-based estimate

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Success Metric
 *
 * KPIs for measuring domain competence
 * Firestore: /pv_success_metrics/{metricId}
 */
export interface SuccessMetric {
  id: string;                           // "D01-SM-01"
  domainId: string;
  metricCategory: string;               // "Individual", "Organizational", "Global"
  metricName: string;                   // Name of the metric
  target: string;                       // Target value or description
  measurementMethod: string;            // How to measure
  frequency: string;                    // How often measured
  responsibleParty: string;             // Who is responsible

  // Flag for review
  reviewRequired?: boolean;             // True if evidence-based estimate

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Migration Result Summary
 */
export interface MigrationResult {
  success: boolean;
  domains: number;
  capabilityComponents: number;
  activityAnchors: number;
  assessmentMethods: number;
  domainIntegrations: number;
  implementationPhases: number;
  successMetrics: number;
  errors?: string[];
}

/**
 * Domain Statistics (for updating domain docs)
 */
export interface DomainStats {
  knowledge: number;
  skills: number;
  behaviors: number;
  aiIntegration: number;
  activityAnchors: number;
  assessmentMethods: number;
}
