/**
 * PV Curriculum Types
 *
 * Types for the 7-sheet PV KSB Framework workbook
 * Supports hierarchical Firestore structure with domains as root documents
 *
 * Schema:
 *   /pv_domains/{domainId}
 *     /capability_components/{componentId}
 *     /activity_anchors/{anchorId}
 *     /assessment_methods/{methodId}
 *   /pv_domain_integration/{integrationId}
 *   /pv_implementation_guidance/{guideId}
 *   /pv_success_metrics/{metricId}
 *
 * Recommended Firestore Indexes:
 * ================================
 * Add these to firestore.indexes.json for optimal query performance:
 *
 * 1. Content needing review:
 *    collection: pv_domains/{domainId}/capability_components
 *    fields: lifecycle.nextReviewDate ASC, status
 *
 * 2. Coverage score filtering:
 *    collection: pv_domains/{domainId}/capability_components
 *    fields: coverageScore.overall ASC, status
 *
 * 3. Stale research detection:
 *    collection: pv_domains/{domainId}/capability_components
 *    fields: research.lastResearchedAt ASC, status
 *
 * 4. Quality tier filtering:
 *    collection: pv_domains/{domainId}/capability_components
 *    fields: qualityMetrics.qualityTier, status
 *
 * 5. Lifecycle state queries:
 *    collection: pv_domains/{domainId}/capability_components
 *    fields: lifecycle.contentState, lifecycle.nextReviewDate ASC
 *
 * 6. Prerequisites lookup (for learning path validation):
 *    collection: pv_domains/{domainId}/capability_components
 *    fields: relationships.prerequisites (array-contains)
 */

// Core types
export * from './core';

// Research & provenance
export * from './research';

// Quality metrics
export * from './quality';

// Lifecycle management
export * from './lifecycle';

// Inter-KSB relationships
export * from './relationships';

// Main entity
export * from './capability-component';

// Activity engines
export * from './activity-engines';

// Portfolio & progress
export * from './portfolio';

// Framework types
export * from './framework';
