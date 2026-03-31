/**
 * Shared type definitions for AlgoVigilance Nucleus
 *
 * Usage: Import types from '@/types'
 * Example: import type { User, DashboardKPI } from '@/types';
 */

// ============================================================================
// User & Authentication Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'practitioner' | 'early_professional' | 'professional' | 'admin' | 'moderator' | 'user';

export interface AuthSession {
  user: User;
  expiresAt: Date;
}

// ============================================================================
// Subscription & Payment Types
// ============================================================================

export type SubscriptionTier = 'student' | 'professional';
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled' | 'paused';
export type PostGradStatus = 'current' | 'early_professional' | 'full_professional';

export interface SubscriptionData {
  tier: SubscriptionTier | null;
  status: SubscriptionStatus;
  stripeCustomerId: string | null;
  subscriptionId: string | null;
  currentPeriodEnd: Date | null;
  isFoundingMember: boolean;
  foundingDiscountEndsAt: Date | null;

  // Practitioner-specific fields
  isStudent: boolean;
  universityEmail: string | null;
  universityName: string | null;
  expectedGraduation: Date | null;
  graduationDate: Date | null;
  lastStudentVerification: Date | null;
  rateLocked: boolean;
  postGradStatus: PostGradStatus | null;
}

export interface TrialData {
  startedAt: Date | null;
  endsAt: Date | null;
  hasUsedTrial: boolean;
  completedOnboarding: boolean;
}

export interface NucleusData {
  tier: SubscriptionTier | null;
  status: 'active' | 'inactive';
  onboardingCompleted: boolean;
  onboardingResults: Record<string, unknown> | null;
}

export interface StripeProduct {
  id: string;
  name: string;
  description: string;
  active: boolean;
  metadata: {
    tier: string;
    role: string;
    discount_type?: string;
    duration_months?: string;
    converts_to?: string;
  };
}

export interface StripePrice {
  id: string;
  product: string;
  active: boolean;
  currency: string;
  unit_amount: number;
  recurring: {
    interval: 'month' | 'year';
    interval_count: number;
  } | null;
  type: 'one_time' | 'recurring';
  metadata: Record<string, string>;
}

export interface CheckoutSession {
  sessionId: string | null;
  url: string | null;
  mode: 'subscription' | 'payment';
  price: string;
  success_url: string;
  cancel_url: string;
  created: Date;
}

export interface StripeSubscription {
  id: string;
  status: 'active' | 'past_due' | 'canceled' | 'unpaid';
  current_period_end: Date;
  current_period_start: Date;
  cancel_at_period_end: boolean;
  role: string | null;
  items: Array<{
    price: StripePrice;
    product: StripeProduct;
  }>;
}

export type SubscriptionEventType =
  | 'trial_started'
  | 'trial_ended'
  | 'subscription_created'
  | 'subscription_updated'
  | 'payment_succeeded'
  | 'payment_failed'
  | 'rate_change_scheduled'
  | 'rate_changed'
  | 'student_verified'
  | 'graduation_date_updated'
  | 'tier_upgraded'
  | 'tier_downgraded'
  | 'subscription_canceled';

export interface SubscriptionEvent {
  id: string;
  userId: string;
  eventType: SubscriptionEventType;
  timestamp: Date;
  metadata: Record<string, unknown>;
  stripeEventId: string | null;
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface DashboardKPI {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface ThreatEvent {
  id: string;
  event: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  action: string;
  timestamp: Date;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  rank: number;
  points?: number;
}

// ============================================================================
// AlgoVigilance Ecosystem Types
// ============================================================================

export interface EcosystemService {
  id: string;
  title: string;
  description: string;
  icon: string;
  link: string;
  status: 'active' | 'beta' | 'coming-soon';
}

export interface CapabilityPathway {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  instructor?: string;
  thumbnail?: string;
  enrolledCount?: number;
  rating?: number;
}

/** @deprecated Use `CapabilityPathway` instead */
export type Course = CapabilityPathway;

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'remote';
  salary?: string;
  description: string;
  requirements: string[];
  postedAt: Date;
  expiresAt?: Date;
}

// ============================================================================
// Content Types (Blog, Community)
// ============================================================================

export interface BlogPost {
  id: string;
  title: string;
  description: string;
  content: string;
  author: string;
  category: string;
  tags?: string[];
  publishedAt: Date;
  updatedAt?: Date;
  thumbnail?: string;
  featured?: boolean;
}

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  author: User;
  category: string;
  upvotes: number;
  replies: number;
  createdAt: Date;
  updatedAt?: Date;
  isPinned?: boolean;
}

// ============================================================================
// Common UI Types
// ============================================================================

export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  description?: string;
  disabled?: boolean;
  external?: boolean;
}

export interface SidebarSection {
  title: string;
  items: NavItem[];
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

// ============================================================================
// Form Types
// ============================================================================

export interface FormErrors {
  [key: string]: string | undefined;
}

export interface FormField<T = string> {
  value: T;
  error?: string;
  touched: boolean;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// Genkit AI Types
// ============================================================================

export interface SearchQuery {
  query: string;
  context?: string;
  filters?: Record<string, unknown>;
}

export interface SearchResult {
  title: string;
  description: string;
  url: string;
  relevance: number;
}

// ============================================================================
// Utility Types
// ============================================================================

export type WithId<T> = T & { id: string };

export type WithTimestamps<T> = T & {
  createdAt: Date;
  updatedAt: Date;
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
