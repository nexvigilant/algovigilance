/**
 * Circles Organization Management Types
 *
 * Extends the Circles platform with student organization features:
 * role-based officer management, task tracking, calendar, events,
 * document management, and officer transitions.
 *
 * Source: NV-SOW-2026-001 (Student Organization Platform Requirements)
 */

// ── Officer Roles & Permissions ───────────────

/** Permission actions available to roles */
export type PermissionAction = 'view' | 'edit' | 'approve' | 'archive' | 'admin';

/** Permission scopes define what entity the permission applies to */
export type PermissionScope =
  | 'tasks'
  | 'calendar'
  | 'documents'
  | 'members'
  | 'events'
  | 'communications'
  | 'finances'
  | 'settings';

/** A single permission grant */
export interface RolePermission {
  scope: PermissionScope;
  actions: PermissionAction[];
}

/** Configurable officer role within an organization circle */
export interface OfficerRole {
  id: string;
  circle_id: string;
  name: string;
  slug: string;
  description: string;
  permissions: RolePermission[];
  /** Display order in dashboards and lists */
  sort_order: number;
  /** Whether multiple members can hold this role simultaneously (co-chairs) */
  allow_multiple: boolean;
  /** Whether this role is required for the org to function */
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateOfficerRoleRequest {
  name: string;
  description?: string;
  permissions?: RolePermission[];
  sort_order?: number;
  allow_multiple?: boolean;
  is_required?: boolean;
}

export interface UpdateOfficerRoleRequest {
  name?: string;
  description?: string;
  permissions?: RolePermission[];
  sort_order?: number;
  allow_multiple?: boolean;
  is_required?: boolean;
}

// ── Notification Preferences ──────────────────

export type NotificationChannel = 'in_app' | 'email' | 'push';
export type NotificationFrequency = 'immediate' | 'daily_digest' | 'weekly_digest' | 'off';

export interface NotificationPreferences {
  user_id: string;
  circle_id: string;
  announcements: { channel: NotificationChannel; frequency: NotificationFrequency };
  task_reminders: { channel: NotificationChannel; frequency: NotificationFrequency };
  event_reminders: { channel: NotificationChannel; frequency: NotificationFrequency };
  attendance_reminders: { channel: NotificationChannel; frequency: NotificationFrequency };
  transition_updates: { channel: NotificationChannel; frequency: NotificationFrequency };
  updated_at: string;
}

export interface UpdateNotificationPreferencesRequest {
  announcements?: { channel?: NotificationChannel; frequency?: NotificationFrequency };
  task_reminders?: { channel?: NotificationChannel; frequency?: NotificationFrequency };
  event_reminders?: { channel?: NotificationChannel; frequency?: NotificationFrequency };
  attendance_reminders?: { channel?: NotificationChannel; frequency?: NotificationFrequency };
  transition_updates?: { channel?: NotificationChannel; frequency?: NotificationFrequency };
}

// ── Year-to-Year Duplication ──────────────────

export interface DuplicateYearRequest {
  source_year: string;
  target_year: string;
  include_tasks: boolean;
  include_events: boolean;
  include_calendar: boolean;
  include_document_structure: boolean;
  created_by: string;
}

export interface DuplicateYearResult {
  tasks_copied: number;
  events_copied: number;
  calendar_entries_copied: number;
  document_folders_copied: number;
  source_year: string;
  target_year: string;
}

// ── Export ─────────────────────────────────────

export type ExportFormat = 'csv' | 'json';

export interface ExportMembersRequest {
  format: ExportFormat;
  include_engagement: boolean;
  include_alumni: boolean;
}

export interface ExportResult {
  data: string;
  filename: string;
  mime_type: string;
  row_count: number;
}

// ── Google Calendar Sync ──────────────────────

export type GCalSyncStatus = 'disconnected' | 'connected' | 'syncing' | 'error';

export interface GCalConnection {
  user_id: string;
  circle_id: string;
  status: GCalSyncStatus;
  google_email: string | null;
  calendar_id: string | null;
  last_sync_at: string | null;
  sync_errors: string[];
  connected_at: string | null;
}

export interface GCalSyncResult {
  pushed: number;
  pulled: number;
  errors: string[];
  last_sync_at: string;
}

/** Officer assignment — links a member to a role with term dates */
export interface OfficerAssignment {
  id: string;
  circle_id: string;
  role_id: string;
  role_name: string;
  user_id: string;
  user_display_name: string;
  term_start: string;
  term_end: string | null;
  status: 'active' | 'completed' | 'resigned';
  assigned_at: string;
}

export interface AssignOfficerRequest {
  role_id: string;
  user_id: string;
  term_start?: string;
  term_end?: string;
}

// ── Tasks ─────────────────────────────────────

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';

/** Relative deadline support per SOW */
export type RelativeDeadline = 'early_month' | 'mid_month' | 'late_month';

export interface OrgTask {
  id: string;
  circle_id: string;
  title: string;
  description: string;
  /** Role that owns this task (auto-assignment) */
  assigned_role_id: string | null;
  assigned_role_name: string | null;
  /** Specific user override (when role has multiple holders) */
  assigned_user_id: string | null;
  assigned_user_name: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  relative_deadline: RelativeDeadline | null;
  /** If this task recurs */
  recurrence: TaskRecurrence | null;
  /** Tags for categorization */
  tags: string[];
  /** Link to an event if task is event-related */
  event_id: string | null;
  completed_at: string | null;
  completed_by: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TaskRecurrence {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';
  /** Day of week (0=Sun) for weekly/biweekly */
  day_of_week: number | null;
  /** Day of month for monthly */
  day_of_month: number | null;
  /** Month for annually */
  month: number | null;
  /** When recurrence ends */
  ends_at: string | null;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  assigned_role_id?: string;
  assigned_user_id?: string;
  priority?: TaskPriority;
  due_date?: string;
  relative_deadline?: RelativeDeadline;
  recurrence?: TaskRecurrence;
  tags?: string[];
  event_id?: string;
  created_by: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  assigned_role_id?: string;
  assigned_user_id?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  relative_deadline?: RelativeDeadline;
  recurrence?: TaskRecurrence;
  tags?: string[];
}

// ── Calendar ──────────────────────────────────

export type CalendarEntryType = 'task_deadline' | 'event' | 'meeting' | 'reminder';

export interface CalendarEntry {
  id: string;
  circle_id: string;
  entry_type: CalendarEntryType;
  title: string;
  description: string;
  start_time: string;
  end_time: string | null;
  all_day: boolean;
  location: string | null;
  /** Role filter — only show to these roles */
  visible_to_roles: string[];
  /** Source entity */
  source_task_id: string | null;
  source_event_id: string | null;
  recurrence: TaskRecurrence | null;
  created_by: string;
  created_at: string;
}

export interface CreateCalendarEntryRequest {
  entry_type: CalendarEntryType;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  all_day?: boolean;
  location?: string;
  visible_to_roles?: string[];
  recurrence?: TaskRecurrence;
  created_by: string;
}

// ── Events ────────────────────────────────────

export type EventStatus = 'planning' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface OrgEvent {
  id: string;
  circle_id: string;
  name: string;
  description: string;
  /** "Why should I attend?" — value-first per SOW UX requirement */
  value_proposition: string;
  event_type: string;
  status: EventStatus;
  start_time: string;
  end_time: string | null;
  location: string | null;
  /** Pre-event checklist items */
  checklist: EventChecklistItem[];
  /** Speaker and vendor contacts */
  contacts: EventContact[];
  /** Attendance tracking */
  attendance_count: number;
  rsvp_count: number;
  capacity: number | null;
  /** Post-event */
  feedback_collected: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EventChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  assigned_role_id: string | null;
  due_date: string | null;
}

export interface EventContact {
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  organization: string | null;
}

export interface CreateEventRequest {
  name: string;
  description?: string;
  value_proposition?: string;
  event_type?: string;
  start_time: string;
  end_time?: string;
  location?: string;
  capacity?: number;
  checklist?: Omit<EventChecklistItem, 'id'>[];
  contacts?: EventContact[];
  created_by: string;
}

export interface UpdateEventRequest {
  name?: string;
  description?: string;
  value_proposition?: string;
  status?: EventStatus;
  start_time?: string;
  end_time?: string;
  location?: string;
  capacity?: number;
}

export interface EventAttendance {
  id: string;
  event_id: string;
  user_id: string;
  user_display_name: string;
  checked_in_at: string;
  check_in_method: 'qr' | 'manual' | 'auto';
}

// ── Documents ─────────────────────────────────

export type DocumentTag = 'receipts' | 'events' | 'meetings' | 'constitution' | 'minutes' | 'reports' | 'templates' | 'other';

export interface OrgDocument {
  id: string;
  circle_id: string;
  name: string;
  description: string;
  /** Folder path: "2026/events/spring-formal/" */
  folder_path: string;
  file_url: string | null;
  file_size: number | null;
  mime_type: string | null;
  tags: DocumentTag[];
  /** Role that owns this document */
  owner_role_id: string | null;
  /** Version tracking */
  version: number;
  /** Academic year for archival */
  academic_year: string;
  is_archived: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentRequest {
  name: string;
  description?: string;
  folder_path?: string;
  file_url?: string;
  tags?: DocumentTag[];
  owner_role_id?: string;
  academic_year?: string;
  created_by: string;
}

// ── Engagement Metrics ────────────────────────

export interface MemberEngagement {
  user_id: string;
  user_display_name: string;
  role: string;
  meetings_attended: number;
  events_attended: number;
  tasks_completed: number;
  posts_created: number;
  /** Consecutive meetings attended */
  attendance_streak: number;
  /** Participation frequency score (0-100) */
  engagement_score: number;
  last_active_at: string;
  is_alumni: boolean;
  graduation_year: string | null;
}

export interface EngagementSummary {
  circle_id: string;
  total_members: number;
  active_members: number;
  average_attendance_rate: number;
  average_engagement_score: number;
  top_contributors: MemberEngagement[];
  at_risk_members: MemberEngagement[];
  period: string;
}

// ── Officer Transitions ───────────────────────

export type TransitionStatus = 'pending' | 'in_progress' | 'completed';

export interface OfficerTransition {
  id: string;
  circle_id: string;
  role_id: string;
  role_name: string;
  outgoing_user_id: string;
  outgoing_user_name: string;
  incoming_user_id: string | null;
  incoming_user_name: string | null;
  status: TransitionStatus;
  /** Structured handoff */
  checklist: TransitionChecklistItem[];
  /** "What I Wish I Knew" */
  reflection_notes: string | null;
  /** Key contacts to pass along */
  key_contacts: EventContact[];
  term_year: string;
  started_at: string;
  completed_at: string | null;
}

export interface TransitionChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  category: 'documents' | 'contacts' | 'access' | 'knowledge' | 'financial';
}

export interface CreateTransitionRequest {
  role_id: string;
  outgoing_user_id: string;
  incoming_user_id?: string;
  term_year: string;
}

// ── Announcements ─────────────────────────────

export type AnnouncementPriority = 'normal' | 'important' | 'urgent';

export interface Announcement {
  id: string;
  circle_id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  /** Target audience — empty means all members */
  target_roles: string[];
  is_pinned: boolean;
  /** Read tracking */
  read_count: number;
  total_recipients: number;
  created_by: string;
  created_at: string;
  expires_at: string | null;
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  priority?: AnnouncementPriority;
  target_roles?: string[];
  is_pinned?: boolean;
  expires_at?: string;
  created_by: string;
}

// ── Dashboard Aggregates ──────────────────────

export interface OfficerDashboard {
  /** Current user's role assignments */
  my_roles: OfficerAssignment[];
  /** Tasks assigned to me (via role or direct) */
  my_tasks: OrgTask[];
  /** Upcoming calendar entries visible to my roles */
  upcoming_calendar: CalendarEntry[];
  /** Upcoming events */
  upcoming_events: OrgEvent[];
  /** Unread announcements */
  announcements: Announcement[];
  /** Pending transitions I'm involved in */
  pending_transitions: OfficerTransition[];
  /** Quick engagement stats */
  engagement: EngagementSummary | null;
}
