/**
 * Circles Organization Management API Client
 *
 * REST client for student org features: officer roles, tasks, calendar,
 * events, documents, engagement, transitions, and announcements.
 *
 * Source: NV-SOW-2026-001
 */

import type {
  OfficerRole, CreateOfficerRoleRequest, UpdateOfficerRoleRequest,
  OfficerAssignment, AssignOfficerRequest,
  OrgTask, CreateTaskRequest, UpdateTaskRequest,
  TaskPriority, TaskStatus, TaskRecurrence, RelativeDeadline,
  CalendarEntry, CreateCalendarEntryRequest, CalendarEntryType,
  OrgEvent, CreateEventRequest, UpdateEventRequest, EventAttendance,
  EventStatus, EventChecklistItem, EventContact,
  OrgDocument, CreateDocumentRequest, DocumentTag,
  MemberEngagement, EngagementSummary,
  OfficerTransition, CreateTransitionRequest, TransitionChecklistItem, TransitionStatus,
  Announcement, CreateAnnouncementRequest, AnnouncementPriority,
  OfficerDashboard,
  PermissionAction, PermissionScope, RolePermission,
  NotificationPreferences, UpdateNotificationPreferencesRequest,
  NotificationChannel, NotificationFrequency,
  DuplicateYearRequest, DuplicateYearResult,
  ExportMembersRequest, ExportResult, ExportFormat,
  GCalConnection, GCalSyncResult, GCalSyncStatus,
} from './circles-org-types';

// Re-export all types
export type {
  OfficerRole, CreateOfficerRoleRequest, UpdateOfficerRoleRequest,
  OfficerAssignment, AssignOfficerRequest,
  OrgTask, CreateTaskRequest, UpdateTaskRequest,
  TaskPriority, TaskStatus, TaskRecurrence, RelativeDeadline,
  CalendarEntry, CreateCalendarEntryRequest, CalendarEntryType,
  OrgEvent, CreateEventRequest, UpdateEventRequest, EventAttendance,
  EventStatus, EventChecklistItem, EventContact,
  OrgDocument, CreateDocumentRequest, DocumentTag,
  MemberEngagement, EngagementSummary,
  OfficerTransition, CreateTransitionRequest, TransitionChecklistItem, TransitionStatus,
  Announcement, CreateAnnouncementRequest, AnnouncementPriority,
  OfficerDashboard,
  PermissionAction, PermissionScope, RolePermission,
  NotificationPreferences, UpdateNotificationPreferencesRequest,
  NotificationChannel, NotificationFrequency,
  DuplicateYearRequest, DuplicateYearResult,
  ExportMembersRequest, ExportResult, ExportFormat,
  GCalConnection, GCalSyncResult, GCalSyncStatus,
};

interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const API_URL = '/api/circles-org';

/**
 * Call the circles-org API route with an action name and parameters.
 * All org management goes through a single POST endpoint.
 */
function callAction<T>(action: string, params: Record<string, unknown>): Promise<ApiResult<T>> {
  return fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  })
    .then((res) =>
      res.json().catch(() => ({ message: 'Request failed' })).then((body: unknown) => {
        if (!res.ok) {
          const err = body as { message?: string };
          return { success: false as const, error: err.message ?? `HTTP ${res.status}` };
        }
        return { success: true as const, data: body as T };
      }),
    )
    .catch((e: unknown) => ({
      success: false as const,
      error: e instanceof Error ? e.message : 'Network error',
    }));
}

// ── Officer Roles ─────────────────────────────

export function createOfficerRole(circleId: string, req: CreateOfficerRoleRequest) {
  return callAction<OfficerRole>('createOfficerRole', { circleId, req });
}

export function listOfficerRoles(circleId: string) {
  return callAction<OfficerRole[]>('listOfficerRoles', { circleId });
}

export function updateOfficerRole(circleId: string, roleId: string, req: UpdateOfficerRoleRequest) {
  return callAction<OfficerRole>('updateOfficerRole', { circleId, roleId, req });
}

export function deleteOfficerRole(circleId: string, roleId: string) {
  return callAction<{ status: string }>('deleteOfficerRole', { circleId, roleId });
}

// ── Officer Assignments ───────────────────────

export function assignOfficer(circleId: string, req: AssignOfficerRequest) {
  return callAction<OfficerAssignment>('assignOfficer', { circleId, req });
}

export function listAssignments(circleId: string) {
  return callAction<OfficerAssignment[]>('listAssignments', { circleId });
}

export function endAssignment(circleId: string, assignmentId: string) {
  return callAction<OfficerAssignment>('endAssignment', { circleId, assignmentId });
}

// ── Tasks ─────────────────────────────────────

export function createTask(circleId: string, req: CreateTaskRequest) {
  return callAction<OrgTask>('createTask', { circleId, req });
}

export function listTasks(circleId: string, filters?: { status?: string; role_id?: string; user_id?: string }) {
  return callAction<OrgTask[]>('listTasks', { circleId, filters });
}

export function updateTask(circleId: string, taskId: string, req: UpdateTaskRequest) {
  return callAction<OrgTask>('updateTask', { circleId, taskId, req });
}

export function completeTask(circleId: string, taskId: string, completedBy: string) {
  return callAction<OrgTask>('completeTask', { circleId, taskId, completedBy });
}

export function deleteTask(circleId: string, taskId: string) {
  return callAction<{ status: string }>('deleteTask', { circleId, taskId });
}

// ── Calendar ──────────────────────────────────

export function listCalendarEntries(circleId: string, filters?: { from?: string; to?: string; role_id?: string }) {
  return callAction<CalendarEntry[]>('listCalendarEntries', { circleId, filters });
}

export function createCalendarEntry(circleId: string, req: CreateCalendarEntryRequest) {
  return callAction<CalendarEntry>('createCalendarEntry', { circleId, req });
}

// ── Events ────────────────────────────────────

export function createEvent(circleId: string, req: CreateEventRequest) {
  return callAction<OrgEvent>('createEvent', { circleId, req });
}

export function listEvents(circleId: string, filters?: { status?: string }) {
  return callAction<OrgEvent[]>('listEvents', { circleId, filters });
}

export function getEvent(circleId: string, eventId: string) {
  return callAction<OrgEvent>('getEvent', { circleId, eventId });
}

export function updateEvent(circleId: string, eventId: string, req: UpdateEventRequest) {
  return callAction<OrgEvent>('updateEvent', { circleId, eventId, req });
}

export function checkInEvent(circleId: string, eventId: string, userId: string, method: 'qr' | 'manual' = 'manual') {
  return callAction<EventAttendance>('checkInEvent', { circleId, eventId, userId, method });
}

export function listEventAttendance(circleId: string, eventId: string) {
  return callAction<EventAttendance[]>('listEventAttendance', { circleId, eventId });
}

// ── Documents ─────────────────────────────────

export function createDocument(circleId: string, req: CreateDocumentRequest) {
  return callAction<OrgDocument>('createDocument', { circleId, req });
}

export function listDocuments(circleId: string, filters?: { folder_path?: string; tag?: string; academic_year?: string }) {
  return callAction<OrgDocument[]>('listDocuments', { circleId, filters });
}

export function searchDocuments(circleId: string, query: string) {
  return callAction<OrgDocument[]>('searchDocuments', { circleId, query });
}

// ── Engagement ────────────────────────────────

export function getMemberEngagement(circleId: string, userId: string) {
  return callAction<MemberEngagement>('getMemberEngagement', { circleId, userId });
}

export function getEngagementSummary(circleId: string, period?: string) {
  return callAction<EngagementSummary>('getEngagementSummary', { circleId, period });
}

// ── Officer Transitions ───────────────────────

export function createTransition(circleId: string, req: CreateTransitionRequest) {
  return callAction<OfficerTransition>('createTransition', { circleId, req });
}

export function listTransitions(circleId: string) {
  return callAction<OfficerTransition[]>('listTransitions', { circleId });
}

export function updateTransitionChecklist(circleId: string, transitionId: string, checklistItemId: string, completed: boolean) {
  return callAction<OfficerTransition>('updateTransitionChecklist', { circleId, transitionId, checklistItemId, completed });
}

export function completeTransition(circleId: string, transitionId: string, reflectionNotes?: string) {
  return callAction<OfficerTransition>('completeTransition', { circleId, transitionId, reflectionNotes });
}

// ── Announcements ─────────────────────────────

export function createAnnouncement(circleId: string, req: CreateAnnouncementRequest) {
  return callAction<Announcement>('createAnnouncement', { circleId, req });
}

export function listAnnouncements(circleId: string) {
  return callAction<Announcement[]>('listAnnouncements', { circleId });
}

export function markAnnouncementRead(circleId: string, announcementId: string, userId: string) {
  return callAction<{ status: string }>('markAnnouncementRead', { circleId, announcementId, userId });
}

// ── Notification Preferences ──────────────────

export function getNotificationPreferences(circleId: string, userId: string) {
  return callAction<NotificationPreferences>('getNotificationPreferences', { circleId, userId });
}

export function updateNotificationPreferences(circleId: string, userId: string, req: UpdateNotificationPreferencesRequest) {
  return callAction<NotificationPreferences>('updateNotificationPreferences', { circleId, userId, req });
}

// ── Year Duplication ──────────────────────────

export function duplicateYear(circleId: string, req: DuplicateYearRequest) {
  return callAction<DuplicateYearResult>('duplicateYear', { circleId, req });
}

// ── Export ─────────────────────────────────────

export function exportMembers(circleId: string, req: ExportMembersRequest) {
  return callAction<ExportResult>('exportMembers', { circleId, req });
}

// ── Google Calendar Sync ──────────────────────

export function getGCalAuthUrl(circleId: string) {
  return callAction<string>('getGCalAuthUrl', { circleId });
}

export function getGCalConnection(circleId: string, userId: string) {
  return callAction<GCalConnection>('getGCalConnection', { circleId, userId });
}

export function disconnectGCal(circleId: string) {
  return callAction<GCalConnection>('disconnectGCal', { circleId });
}

export function syncGCal(circleId: string) {
  return callAction<GCalSyncResult>('syncGCal', { circleId });
}

// ── Dashboard (Aggregate) ─────────────────────

export function getOfficerDashboard(circleId: string, userId: string) {
  return callAction<OfficerDashboard>('getOfficerDashboard', { circleId, userId });
}
