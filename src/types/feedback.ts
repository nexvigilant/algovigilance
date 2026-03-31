import { type Timestamp } from 'firebase/firestore';

export type FeedbackType = 'bug' | 'feedback' | 'feature_request';
export type BugSeverity = 'low' | 'medium' | 'high' | 'critical';
export type FeedbackRating = 1 | 2 | 3 | 4 | 5;
export type FeatureArea = 'public' | 'nucleus' | 'academy' | 'community';
export type SubmissionStatus = 'new' | 'reviewed' | 'in_progress' | 'resolved';

export interface BugReportData {
  description: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  severity: BugSeverity;
}

export interface FeedbackData {
  rating: FeedbackRating;
  comment: string;
}

export interface FeatureRequestData {
  area: FeatureArea;
  description: string;
  valueProposition?: string;
}

export interface SubmissionMetadata {
  userAgent: string;
  screenSize: string;
  currentPath: string;
}

export interface FeedbackSubmission {
  id?: string;
  type: FeedbackType;
  userId: string;
  userEmail: string;
  createdAt: Timestamp;
  status: SubmissionStatus;
  metadata: SubmissionMetadata;
  bugReport?: BugReportData;
  feedback?: FeedbackData;
  featureRequest?: FeatureRequestData;
}

// Form input types (before Firestore conversion)
export interface BugReportFormData {
  description: string;
  stepsToReproduce: string;
  expectedBehavior: string;
  severity: BugSeverity;
}

export interface FeedbackFormData {
  rating: FeedbackRating;
  comment: string;
}

export interface FeatureRequestFormData {
  area: FeatureArea;
  description: string;
  valueProposition: string;
}
