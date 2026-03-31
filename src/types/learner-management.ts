import { type Timestamp } from 'firebase/firestore';

// ============================================================================
// Admin Actions
// ============================================================================

export type AdminActionType =
  | 'suspend'
  | 'reactivate'
  | 'role_change'
  | 'password_reset'
  | 'enrollment_transfer'
  | 'account_merge'
  | 'data_export'
  | 'delete'
  | 'feature_flag'
  | 'force_logout';

export interface AdminAction {
  actionId: string;
  actionType: AdminActionType;
  targetUserId: string;
  performedBy: string;
  reason: string;
  metadata: Record<string, unknown>;
  previousState?: Record<string, unknown>;
  createdAt: Timestamp;
  reversible: boolean;
  reversed: boolean;
  reversedAt?: Timestamp;
  reversedBy?: string;
}

export type RestrictionType = 'suspension' | 'feature_flag' | 'ip_restriction' | 'content_ban';

export interface UserRestriction {
  restrictionId: string;
  userId: string;
  type: RestrictionType;
  reason: string;
  createdBy: string;
  createdAt: Timestamp;
  expiresAt?: Timestamp | null;
  active: boolean;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Moderation
// ============================================================================

export type CaseStatus = 'open' | 'in_review' | 'resolved' | 'escalated' | 'appealed';
export type CasePriority = 'critical' | 'high' | 'medium' | 'low';
export type ContentType = 'post' | 'comment' | 'message' | 'profile' | 'forum' | 'resource';
export type CaseResolution = 'warning' | 'content_removed' | 'suspension' | 'ban' | 'dismissed' | 'no_action';

export type ViolationType =
  | 'harassment'
  | 'threats'
  | 'hate_speech'
  | 'misinformation'
  | 'spam'
  | 'solicitation'
  | 'impersonation'
  | 'pii_exposure'
  | 'off_topic'
  | 'self_promotion'
  | 'profanity'
  | 'copyright'
  | 'illegal_content'
  | 'other';

export interface ModerationCase {
  caseId: string;
  status: CaseStatus;
  priority: CasePriority;

  // Target
  reportedUserId: string;
  reportedContentId?: string;
  reportedContentType?: ContentType;
  contentSnapshot?: string;

  // Case details
  violationType: ViolationType;
  description: string;
  evidence: string[];

  // Assignment
  assignedTo?: string;
  escalatedTo?: string;
  escalatedReason?: string;

  // Resolution
  resolution?: CaseResolution;
  resolutionNotes?: string;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  resolvedAt?: Timestamp;

  // Internal
  internalNotes: CaseNote[];
  reportedBy?: string;
  source: 'user_report' | 'moderator' | 'ai_detection';
}

export interface CaseNote {
  noteId: string;
  content: string;
  authorId: string;
  createdAt: Timestamp;
}

// ============================================================================
// Warnings
// ============================================================================

export type WarningLevel = 1 | 2 | 3 | 4 | 5;

export interface UserWarning {
  warningId: string;
  userId: string;
  level: WarningLevel;
  type: ViolationType;
  message: string;
  caseId?: string;
  issuedBy: string;
  issuedAt: Timestamp;
  acknowledged: boolean;
  acknowledgedAt?: Timestamp;
  expiresAt?: Timestamp | null;
  active: boolean;
}

export interface WarningTemplate {
  templateId: string;
  name: string;
  level: WarningLevel;
  type: ViolationType;
  subject: string;
  message: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  active: boolean;
}

// ============================================================================
// Appeals
// ============================================================================

export type AppealStatus = 'pending' | 'under_review' | 'approved' | 'denied';

export interface Appeal {
  appealId: string;
  caseId: string;
  warningId?: string;
  restrictionId?: string;
  userId: string;

  // Appeal content
  reason: string;
  evidence: string[];

  // Status
  status: AppealStatus;
  reviewedBy?: string;
  reviewNotes?: string;
  outcome?: string;

  // Timestamps
  submittedAt: Timestamp;
  reviewedAt?: Timestamp;
}

// ============================================================================
// Learner Profile (Extended User)
// ============================================================================

export interface LearnerProfile {
  // Core user data
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'user' | 'practitioner' | 'professional' | 'moderator' | 'admin';

  // Status
  status: 'active' | 'suspended' | 'banned' | 'pending' | 'deleted';

  // Metadata
  createdAt: Timestamp;
  lastLoginAt?: Timestamp;
  lastActivityAt?: Timestamp;

  // Enrollments summary
  enrollmentCount: number;
  completedCount: number;

  // Moderation summary
  warningCount: number;
  activeRestrictions: number;

  // Engagement
  postCount: number;
  commentCount: number;
  contributionScore: number;
}

// ============================================================================
// UI/Filter Types
// ============================================================================

export interface LearnerFilters {
  search?: string;
  role?: string[];
  status?: string[];
  hasWarnings?: boolean;
  hasRestrictions?: boolean;
  enrolledIn?: string;
  sortBy?: 'name' | 'email' | 'createdAt' | 'lastActivity' | 'warnings';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CaseFilters {
  status?: CaseStatus[];
  priority?: CasePriority[];
  violationType?: ViolationType[];
  assignedTo?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy?: 'priority' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface AuditLogFilters {
  actionType?: AdminActionType[];
  performedBy?: string;
  targetUserId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// ============================================================================
// Action Payloads
// ============================================================================

export interface SuspendUserPayload {
  userId: string;
  reason: string;
  duration?: number; // days, null = permanent
  notifyUser?: boolean;
}

export interface ChangeRolePayload {
  userId: string;
  newRole: 'user' | 'practitioner' | 'professional' | 'moderator' | 'admin';
  reason: string;
}

export interface IssuedWarningPayload {
  userId: string;
  level: WarningLevel;
  type: ViolationType;
  message: string;
  caseId?: string;
  expiresInDays?: number;
}

export interface ResolveCasePayload {
  caseId: string;
  resolution: CaseResolution;
  notes: string;
  issueWarning?: boolean;
  warningLevel?: WarningLevel;
  suspendUser?: boolean;
  suspensionDays?: number;
}

// ============================================================================
// Dashboard Stats
// ============================================================================

export interface ModerationStats {
  openCases: number;
  criticalCases: number;
  pendingAppeals: number;
  resolvedToday: number;
  avgResolutionTime: number; // hours
  casesByType: Record<ViolationType, number>;
}

export interface LearnerStats {
  totalLearners: number;
  activeLearners: number;
  suspendedUsers: number;
  newThisWeek: number;
  byRole: Record<string, number>;
}
