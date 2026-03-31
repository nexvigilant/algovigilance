/**
 * FDA Regulatory Intelligence Module Types
 *
 * Firestore schema types for regulatory documents, alerts, and user preferences.
 */

import { type Timestamp } from 'firebase/firestore';

/**
 * Plain timestamp that can cross the Next.js server→client boundary.
 * Firestore Timestamp class instances have prototypes that fail serialization.
 * Use this for data returned from server actions to client components.
 */
export interface SerializableTimestamp {
  seconds: number;
  nanoseconds: number;
}

// =============================================================================
// Core Document Types
// =============================================================================

export type RegulatorySourceType =
  | 'guidance'
  | 'warning_letter'
  | 'form_483'
  | 'safety_communication'
  | 'recall'
  | 'advisory_meeting'
  | 'federal_register';

export type DocumentStatus = 'draft' | 'final' | 'withdrawn' | 'active';

export type ImpactLevel = 'high' | 'medium' | 'low';

export type ProficiencyLevel = 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L5+' | 'L5++';

// =============================================================================
// Regulatory Document
// =============================================================================

export interface RegulatoryDocument {
  // Identity
  id: string;
  sourceType: RegulatorySourceType;

  // Content
  title: string;
  summary: string;
  fullText?: string;
  documentUrl: string;
  pdfUrl?: string;

  // Metadata (SerializableTimestamp for server→client boundary safety)
  publishedDate: SerializableTimestamp;
  effectiveDate?: SerializableTimestamp;
  commentDeadline?: SerializableTimestamp;
  status: DocumentStatus;

  // Classification
  productAreas: string[];
  therapeuticAreas: string[];
  complianceAreas: string[];
  keywords: string[];
  fdaCenter?: 'CDER' | 'CBER' | 'CDRH' | 'CFSAN' | 'CVM' | 'ORA';

  // AI Analysis
  aiAnalysis?: RegulatoryAIAnalysis;

  // PDC Integration
  frameworkAlignment?: FrameworkAlignment;

  // Tracking
  createdAt: SerializableTimestamp;
  updatedAt: SerializableTimestamp;
  viewCount: number;
  bookmarkCount: number;
}

export interface RegulatoryAIAnalysis {
  executiveSummary: string;
  keyChanges: string[];
  impactAssessment: ImpactLevel;
  affectedParties: string[];
  actionItems: string[];
  relatedDocuments: string[];
  generatedAt: SerializableTimestamp;
}

export interface FrameworkAlignment {
  relevantEPAs: string[];
  relevantCPAs: string[];
  relevantDomains: string[];
  proficiencyImpact: ProficiencyImpact[];
  suggestedLearning: string[];
}

export interface ProficiencyImpact {
  domainId: string;
  impactLevel: 'minor' | 'moderate' | 'significant';
  description: string;
}

// =============================================================================
// User Alerts
// =============================================================================

export type AlertType = 'new_document' | 'deadline_reminder' | 'update' | 'trend';

export type AlertPriority = 'urgent' | 'high' | 'normal';

export interface UserAlert {
  id: string;
  userId: string;
  documentId: string;
  alertType: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  read: boolean;
  dismissed: boolean;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}

// =============================================================================
// User Preferences
// =============================================================================

export type EmailDigestFrequency = 'immediate' | 'daily' | 'weekly' | 'none';

export interface UserRegulatoryPreferences {
  userId: string;

  // Alert Channels
  alertChannels: {
    inApp: boolean;
    email: boolean;
    emailDigest: EmailDigestFrequency;
  };

  // Content Filters
  productAreas: string[];
  therapeuticAreas: string[];
  documentTypes: RegulatorySourceType[];
  fdaCenters: string[];
  keywords: string[];

  // Timeline Tracking
  watchedDocuments: string[];
  savedSearches: SavedSearch[];

  // Settings
  updatedAt: Timestamp;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: RegulatorySearchQuery;
  alertOnNew: boolean;
  createdAt: Timestamp;
}

// =============================================================================
// Timeline Tracking
// =============================================================================

export type TimelineEventType =
  | 'published'
  | 'comment_period_start'
  | 'comment_period_end'
  | 'effective'
  | 'updated'
  | 'withdrawn';

export interface RegulatoryTimeline {
  id: string;
  documentId: string;
  documentTitle: string;
  events: TimelineEvent[];
  upcomingDeadlines: UpcomingDeadline[];
}

export interface TimelineEvent {
  date: Timestamp;
  eventType: TimelineEventType;
  description: string;
}

export interface UpcomingDeadline {
  date: Timestamp;
  description: string;
  remindersSent: number[];
}

// =============================================================================
// Search & Filtering
// =============================================================================

export interface RegulatorySearchQuery {
  searchText?: string;
  sourceTypes?: RegulatorySourceType[];
  productAreas?: string[];
  therapeuticAreas?: string[];
  complianceAreas?: string[];
  fdaCenters?: string[];
  status?: DocumentStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  impactLevel?: ImpactLevel[];
  hasDeadline?: boolean;
  sortBy?: 'publishedDate' | 'relevance' | 'impactLevel';
  sortOrder?: 'asc' | 'desc';
}

export interface RegulatorySearchResult {
  documents: RegulatoryDocument[];
  totalCount: number;
  facets: SearchFacets;
}

export interface SearchFacets {
  sourceTypes: FacetCount[];
  productAreas: FacetCount[];
  therapeuticAreas: FacetCount[];
  fdaCenters: FacetCount[];
  impactLevels: FacetCount[];
}

export interface FacetCount {
  value: string;
  count: number;
}

// =============================================================================
// Learning Recommendations
// =============================================================================

export type RecommendationTrigger = 'new_regulation' | 'knowledge_gap' | 'trending_topic';

export type RecommendationPriority = 'immediate' | 'soon' | 'background';

export interface LearningRecommendation {
  documentId: string;
  userId: string;

  trigger: {
    type: RecommendationTrigger;
    description: string;
  };

  recommendations: {
    priority: RecommendationPriority;
    ksbIds: string[];
    estimatedTime: number;
    rationale: string;
  }[];

  competencyGaps: CompetencyGap[];

  createdAt: Timestamp;
  dismissed: boolean;
}

export interface CompetencyGap {
  domainId: string;
  currentLevel: ProficiencyLevel;
  targetLevel: ProficiencyLevel;
  gap: string;
}

// =============================================================================
// Ingestion & Processing
// =============================================================================

export type IngestionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface IngestionJob {
  id: string;
  sourceType: RegulatorySourceType;
  status: IngestionStatus;
  startedAt: Timestamp;
  completedAt?: Timestamp;
  documentsProcessed: number;
  errors: string[];
}

// =============================================================================
// Analytics
// =============================================================================

export interface RegulatoryAnalytics {
  totalDocuments: number;
  documentsByType: Record<RegulatorySourceType, number>;
  documentsByCenter: Record<string, number>;
  recentActivity: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
  topKeywords: FacetCount[];
  upcomingDeadlines: number;
}

// =============================================================================
// API Response Types
// =============================================================================

export interface OpenFDARecall {
  recall_number: string;
  recall_initiation_date: string;
  center_classification_date: string;
  termination_date?: string;
  classification: string;
  status: string;
  product_description: string;
  reason_for_recall: string;
  recalling_firm: string;
  city: string;
  state: string;
  country: string;
  distribution_pattern: string;
  product_quantity: string;
  voluntary_mandated: string;
}

export interface OpenFDASafetyReport {
  safetyreportid: string;
  receivedate: string;
  transmissiondate: string;
  serious: string;
  seriousnessdeath?: string;
  seriousnesslifethreatening?: string;
  seriousnesshospitalization?: string;
  seriousnessdisabling?: string;
  seriousnessother?: string;
  patient?: {
    patientonsetage?: string;
    patientsex?: string;
    drug?: Array<{
      medicinalproduct?: string;
      drugindication?: string;
      drugadministrationroute?: string;
    }>;
    reaction?: Array<{
      reactionmeddrapt?: string;
      reactionoutcome?: string;
    }>;
  };
}

// =============================================================================
// Constants
// =============================================================================

export const PRODUCT_AREAS = [
  'drugs',
  'biologics',
  'devices',
  'food',
  'cosmetics',
  'tobacco',
  'veterinary',
] as const;

export const THERAPEUTIC_AREAS = [
  'oncology',
  'cardiology',
  'neurology',
  'immunology',
  'infectious_disease',
  'endocrinology',
  'pulmonology',
  'gastroenterology',
  'dermatology',
  'ophthalmology',
  'rare_diseases',
  'pediatrics',
  'women_health',
  'psychiatry',
] as const;

export const COMPLIANCE_AREAS = [
  'cgmp',
  'data_integrity',
  'clinical_trials',
  'labeling',
  'advertising',
  'post_market',
  'quality_systems',
  'inspections',
  'imports',
  'exports',
] as const;

export const FDA_CENTERS = [
  { id: 'CDER', name: 'Center for Drug Evaluation and Research' },
  { id: 'CBER', name: 'Center for Biologics Evaluation and Research' },
  { id: 'CDRH', name: 'Center for Devices and Radiological Health' },
  { id: 'CFSAN', name: 'Center for Food Safety and Applied Nutrition' },
  { id: 'CVM', name: 'Center for Veterinary Medicine' },
  { id: 'ORA', name: 'Office of Regulatory Affairs' },
] as const;

export const ALERT_REMINDER_DAYS = [30, 14, 7, 1] as const;
