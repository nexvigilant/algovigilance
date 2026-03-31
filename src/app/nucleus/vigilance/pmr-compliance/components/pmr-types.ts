import { type SignalResult } from '@/lib/pv-compute';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PmrRecord {
  id: string;
  center: string;
  appType: string;
  appNumber: string;
  applicant: string;
  product: string;
  approvalDate: string;
  submissionType: string;
  submissionNumber: string;
  uniqueId: string;
  pmrOrPmc: string;
  pmrType: string;
  setNumber: string;
  pmrNumber: string;
  description: string;
  status: string;
  statusExplanation: string;
  dueDate: string;
  lastReportDate: string;
}

export interface StatusCounts {
  [status: string]: number;
}

export interface ApplicantProfile {
  name: string;
  total: number;
  delayed: number;
  fulfilled: number;
  ongoing: number;
  pending: number;
  delayRate: number;
}

export interface AuthorityProfile {
  type: string;
  total: number;
  delayed: number;
  fulfilled: number;
  ongoing: number;
  fulfillmentRate: number;
  delayRate: number;
}

export interface FaersCrossRef {
  product: string;
  status: 'pending' | 'loading' | 'loaded' | 'error';
  totalReports?: number;
  signalCount?: number;
  topSignal?: string;
  topPrr?: number;
  events?: { event: string; count: number; signals: SignalResult }[];
  error?: string;
}

export type TabId = 'overview' | 'applicants' | 'authority' | 'overdue' | 'faers' | 'browse';
