'use server';

/**
 * Circle Organization Management — Server Actions
 *
 * Firestore-backed CRUD for officer roles, tasks, calendar, events,
 * documents, engagement, transitions, and announcements.
 *
 * Collections:
 *   circles/{circleId}/org_roles/{roleId}
 *   circles/{circleId}/org_assignments/{assignmentId}
 *   circles/{circleId}/org_tasks/{taskId}
 *   circles/{circleId}/org_calendar/{entryId}
 *   circles/{circleId}/org_events/{eventId}
 *   circles/{circleId}/org_events/{eventId}/attendance/{recordId}
 *   circles/{circleId}/org_documents/{docId}
 *   circles/{circleId}/org_transitions/{transitionId}
 *   circles/{circleId}/org_announcements/{announcementId}
 *   circles/{circleId}/org_engagement/{userId}
 */

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import type {
  OfficerRole, CreateOfficerRoleRequest, UpdateOfficerRoleRequest,
  OfficerAssignment, AssignOfficerRequest,
  OrgTask, CreateTaskRequest, UpdateTaskRequest,
  CalendarEntry, CreateCalendarEntryRequest,
  OrgEvent, CreateEventRequest, UpdateEventRequest, EventAttendance,
  OrgDocument, CreateDocumentRequest,
  MemberEngagement, EngagementSummary,
  OfficerTransition, CreateTransitionRequest,
  Announcement, CreateAnnouncementRequest,
  OfficerDashboard,
  NotificationPreferences, UpdateNotificationPreferencesRequest,
  DuplicateYearRequest, DuplicateYearResult,
  ExportMembersRequest, ExportResult,
} from '@/lib/api/circles-org-types';

import { logger } from '@/lib/logger';
const log = logger.scope('circles-org');

// ── Auth Helper ───────────────────────────────

async function getAuthUser() {
  const session = (await cookies()).get('session')?.value;
  if (!session) throw new Error('Not authenticated');
  return adminAuth.verifySessionCookie(session, true);
}

function circleRef(circleId: string) {
  return adminDb.collection('circles').doc(circleId);
}

function now() {
  return adminTimestamp.now().toDate().toISOString();
}

// ── Officer Roles ─────────────────────────────

export async function createOfficerRole(circleId: string, req: CreateOfficerRoleRequest) {
  await getAuthUser();
  const ref = circleRef(circleId).collection('org_roles').doc();
  const role: OfficerRole = {
    id: ref.id,
    circle_id: circleId,
    name: req.name,
    slug: req.name.toLowerCase().replace(/\s+/g, '-'),
    description: req.description ?? '',
    permissions: req.permissions ?? [],
    sort_order: req.sort_order ?? 0,
    allow_multiple: req.allow_multiple ?? false,
    is_required: req.is_required ?? false,
    created_at: now(),
    updated_at: now(),
  };
  await ref.set(role);
  revalidatePath(`/nucleus/community/circles`);
  return role;
}

export async function listOfficerRoles(circleId: string): Promise<OfficerRole[]> {
  const snap = await circleRef(circleId).collection('org_roles')
    .orderBy('sort_order', 'asc').get();
  return snap.docs.map((d) => d.data() as OfficerRole);
}

export async function updateOfficerRole(circleId: string, roleId: string, req: UpdateOfficerRoleRequest) {
  await getAuthUser();
  const ref = circleRef(circleId).collection('org_roles').doc(roleId);
  await ref.update({ ...req, updated_at: now() });
  const snap = await ref.get();
  return snap.data() as OfficerRole;
}

export async function deleteOfficerRole(circleId: string, roleId: string) {
  await getAuthUser();
  await circleRef(circleId).collection('org_roles').doc(roleId).delete();
  return { status: 'deleted' };
}

// ── Officer Assignments ───────────────────────

export async function assignOfficer(circleId: string, req: AssignOfficerRequest) {
  await getAuthUser();
  const roleSnap = await circleRef(circleId).collection('org_roles').doc(req.role_id).get();
  const role = roleSnap.data() as OfficerRole | undefined;

  const ref = circleRef(circleId).collection('org_assignments').doc();
  const assignment: OfficerAssignment = {
    id: ref.id,
    circle_id: circleId,
    role_id: req.role_id,
    role_name: role?.name ?? 'Unknown',
    user_id: req.user_id,
    user_display_name: '', // Populated by caller or trigger
    term_start: req.term_start ?? now(),
    term_end: req.term_end ?? null,
    status: 'active',
    assigned_at: now(),
  };
  await ref.set(assignment);
  return assignment;
}

export async function listAssignments(circleId: string): Promise<OfficerAssignment[]> {
  const snap = await circleRef(circleId).collection('org_assignments')
    .where('status', '==', 'active').get();
  return snap.docs.map((d) => d.data() as OfficerAssignment);
}

export async function endAssignment(circleId: string, assignmentId: string) {
  await getAuthUser();
  const ref = circleRef(circleId).collection('org_assignments').doc(assignmentId);
  await ref.update({ status: 'completed', term_end: now() });
  const snap = await ref.get();
  return snap.data() as OfficerAssignment;
}

// ── Tasks ─────────────────────────────────────

export async function createTask(circleId: string, req: CreateTaskRequest) {
  await getAuthUser();
  const ref = circleRef(circleId).collection('org_tasks').doc();

  let roleName: string | null = null;
  if (req.assigned_role_id) {
    const roleSnap = await circleRef(circleId).collection('org_roles').doc(req.assigned_role_id).get();
    roleName = (roleSnap.data() as OfficerRole | undefined)?.name ?? null;
  }

  const task: OrgTask = {
    id: ref.id,
    circle_id: circleId,
    title: req.title,
    description: req.description ?? '',
    assigned_role_id: req.assigned_role_id ?? null,
    assigned_role_name: roleName,
    assigned_user_id: req.assigned_user_id ?? null,
    assigned_user_name: null,
    status: 'pending',
    priority: req.priority ?? 'medium',
    due_date: req.due_date ?? null,
    relative_deadline: req.relative_deadline ?? null,
    recurrence: req.recurrence ?? null,
    tags: req.tags ?? [],
    event_id: req.event_id ?? null,
    completed_at: null,
    completed_by: null,
    created_by: req.created_by,
    created_at: now(),
    updated_at: now(),
  };
  await ref.set(task);
  revalidatePath(`/nucleus/community/circles`);
  return task;
}

export async function listTasks(
  circleId: string,
  filters?: { status?: string; role_id?: string; user_id?: string },
): Promise<OrgTask[]> {
  let query: FirebaseFirestore.Query = circleRef(circleId).collection('org_tasks');
  if (filters?.status) query = query.where('status', '==', filters.status);
  if (filters?.role_id) query = query.where('assigned_role_id', '==', filters.role_id);
  if (filters?.user_id) query = query.where('assigned_user_id', '==', filters.user_id);
  const snap = await query.orderBy('created_at', 'desc').get();
  return snap.docs.map((d) => d.data() as OrgTask);
}

export async function updateTask(circleId: string, taskId: string, req: UpdateTaskRequest) {
  await getAuthUser();
  const ref = circleRef(circleId).collection('org_tasks').doc(taskId);
  await ref.update({ ...req, updated_at: now() });
  const snap = await ref.get();
  revalidatePath(`/nucleus/community/circles`);
  return snap.data() as OrgTask;
}

export async function completeTask(circleId: string, taskId: string, completedBy: string) {
  await getAuthUser();
  const ref = circleRef(circleId).collection('org_tasks').doc(taskId);
  await ref.update({
    status: 'completed',
    completed_at: now(),
    completed_by: completedBy,
    updated_at: now(),
  });
  const snap = await ref.get();
  revalidatePath(`/nucleus/community/circles`);
  return snap.data() as OrgTask;
}

export async function deleteTask(circleId: string, taskId: string) {
  await getAuthUser();
  await circleRef(circleId).collection('org_tasks').doc(taskId).delete();
  return { status: 'deleted' };
}

// ── Calendar ──────────────────────────────────

export async function listCalendarEntries(
  circleId: string,
  filters?: { from?: string; to?: string; role_id?: string },
): Promise<CalendarEntry[]> {
  let query: FirebaseFirestore.Query = circleRef(circleId).collection('org_calendar');
  if (filters?.from) query = query.where('start_time', '>=', filters.from);
  if (filters?.to) query = query.where('start_time', '<=', filters.to);
  const snap = await query.orderBy('start_time', 'asc').get();
  let entries = snap.docs.map((d) => d.data() as CalendarEntry);
  if (filters?.role_id) {
    entries = entries.filter((e) =>
      e.visible_to_roles.length === 0 || e.visible_to_roles.includes(filters.role_id!),
    );
  }
  return entries;
}

export async function createCalendarEntry(circleId: string, req: CreateCalendarEntryRequest) {
  await getAuthUser();
  const ref = circleRef(circleId).collection('org_calendar').doc();
  const entry: CalendarEntry = {
    id: ref.id,
    circle_id: circleId,
    entry_type: req.entry_type,
    title: req.title,
    description: req.description ?? '',
    start_time: req.start_time,
    end_time: req.end_time ?? null,
    all_day: req.all_day ?? false,
    location: req.location ?? null,
    visible_to_roles: req.visible_to_roles ?? [],
    source_task_id: null,
    source_event_id: null,
    recurrence: req.recurrence ?? null,
    created_by: req.created_by,
    created_at: now(),
  };
  await ref.set(entry);
  return entry;
}

// ── Events ────────────────────────────────────

export async function createEvent(circleId: string, req: CreateEventRequest) {
  await getAuthUser();
  const ref = circleRef(circleId).collection('org_events').doc();
  const event: OrgEvent = {
    id: ref.id,
    circle_id: circleId,
    name: req.name,
    description: req.description ?? '',
    value_proposition: req.value_proposition ?? '',
    event_type: req.event_type ?? 'other',
    status: 'planning',
    start_time: req.start_time,
    end_time: req.end_time ?? null,
    location: req.location ?? null,
    checklist: (req.checklist ?? []).map((c, i) => ({ ...c, id: `cl-${i}` })),
    contacts: req.contacts ?? [],
    attendance_count: 0,
    rsvp_count: 0,
    capacity: req.capacity ?? null,
    feedback_collected: false,
    created_by: req.created_by,
    created_at: now(),
    updated_at: now(),
  };
  await ref.set(event);

  // Auto-create calendar entry
  await createCalendarEntry(circleId, {
    entry_type: 'event',
    title: req.name,
    description: req.description,
    start_time: req.start_time,
    end_time: req.end_time,
    location: req.location,
    created_by: req.created_by,
  });

  revalidatePath(`/nucleus/community/circles`);
  return event;
}

export async function listEvents(
  circleId: string,
  filters?: { status?: string },
): Promise<OrgEvent[]> {
  let query: FirebaseFirestore.Query = circleRef(circleId).collection('org_events');
  if (filters?.status) query = query.where('status', '==', filters.status);
  const snap = await query.orderBy('start_time', 'desc').get();
  return snap.docs.map((d) => d.data() as OrgEvent);
}

export async function getEvent(circleId: string, eventId: string): Promise<OrgEvent | null> {
  const snap = await circleRef(circleId).collection('org_events').doc(eventId).get();
  return snap.exists ? (snap.data() as OrgEvent) : null;
}

export async function updateEvent(circleId: string, eventId: string, req: UpdateEventRequest) {
  await getAuthUser();
  const ref = circleRef(circleId).collection('org_events').doc(eventId);
  await ref.update({ ...req, updated_at: now() });
  const snap = await ref.get();
  revalidatePath(`/nucleus/community/circles`);
  return snap.data() as OrgEvent;
}

export async function checkInEvent(
  circleId: string,
  eventId: string,
  userId: string,
  method: 'qr' | 'manual' = 'manual',
) {
  await getAuthUser();
  const ref = circleRef(circleId).collection('org_events').doc(eventId)
    .collection('attendance').doc(userId);

  const existing = await ref.get();
  if (existing.exists) {
    return existing.data() as EventAttendance;
  }

  const record: EventAttendance = {
    id: ref.id,
    event_id: eventId,
    user_id: userId,
    user_display_name: '', // Populated by trigger or lookup
    checked_in_at: now(),
    check_in_method: method,
  };
  await ref.set(record);

  // Increment attendance count
  const eventRef = circleRef(circleId).collection('org_events').doc(eventId);
  const eventSnap = await eventRef.get();
  const current = (eventSnap.data() as OrgEvent | undefined)?.attendance_count ?? 0;
  await eventRef.update({ attendance_count: current + 1 });

  // Update member engagement
  await incrementEngagement(circleId, userId, 'events_attended');

  return record;
}

export async function listEventAttendance(circleId: string, eventId: string): Promise<EventAttendance[]> {
  const snap = await circleRef(circleId).collection('org_events').doc(eventId)
    .collection('attendance').orderBy('checked_in_at', 'asc').get();
  return snap.docs.map((d) => d.data() as EventAttendance);
}

// ── Documents ─────────────────────────────────

export async function createDocument(circleId: string, req: CreateDocumentRequest) {
  await getAuthUser();
  const ref = circleRef(circleId).collection('org_documents').doc();
  const doc: OrgDocument = {
    id: ref.id,
    circle_id: circleId,
    name: req.name,
    description: req.description ?? '',
    folder_path: req.folder_path ?? '',
    file_url: req.file_url ?? null,
    file_size: null,
    mime_type: null,
    tags: req.tags ?? [],
    owner_role_id: req.owner_role_id ?? null,
    version: 1,
    academic_year: req.academic_year ?? `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    is_archived: false,
    created_by: req.created_by,
    created_at: now(),
    updated_at: now(),
  };
  await ref.set(doc);
  revalidatePath(`/nucleus/community/circles`);
  return doc;
}

export async function listDocuments(
  circleId: string,
  filters?: { folder_path?: string; tag?: string; academic_year?: string },
): Promise<OrgDocument[]> {
  let query: FirebaseFirestore.Query = circleRef(circleId).collection('org_documents');
  if (filters?.academic_year) query = query.where('academic_year', '==', filters.academic_year);
  const snap = await query.orderBy('folder_path', 'asc').get();
  let docs = snap.docs.map((d) => d.data() as OrgDocument);
  if (filters?.tag) docs = docs.filter((d) => d.tags.includes(filters.tag as OrgDocument['tags'][number]));
  if (filters?.folder_path) docs = docs.filter((d) => d.folder_path.startsWith(filters.folder_path!));
  return docs;
}

export async function searchDocuments(circleId: string, query: string): Promise<OrgDocument[]> {
  // Firestore doesn't support full-text search natively — do client-side filter
  const snap = await circleRef(circleId).collection('org_documents').get();
  const q = query.toLowerCase();
  return snap.docs
    .map((d) => d.data() as OrgDocument)
    .filter((d) => d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q));
}

// ── Engagement ────────────────────────────────

async function incrementEngagement(circleId: string, userId: string, field: keyof MemberEngagement) {
  const ref = circleRef(circleId).collection('org_engagement').doc(userId);
  const snap = await ref.get();
  if (snap.exists) {
    const current = (snap.data() as MemberEngagement)[field];
    if (typeof current === 'number') {
      await ref.update({ [field]: current + 1, last_active_at: now() });
    }
  } else {
    const engagement: MemberEngagement = {
      user_id: userId,
      user_display_name: '',
      role: '',
      meetings_attended: 0,
      events_attended: 0,
      tasks_completed: 0,
      posts_created: 0,
      attendance_streak: 0,
      engagement_score: 0,
      last_active_at: now(),
      is_alumni: false,
      graduation_year: null,
    };
    if (typeof engagement[field] === 'number') {
      (engagement[field] as number) = 1;
    }
    await ref.set(engagement);
  }
}

export async function getMemberEngagement(circleId: string, userId: string): Promise<MemberEngagement | null> {
  const snap = await circleRef(circleId).collection('org_engagement').doc(userId).get();
  return snap.exists ? (snap.data() as MemberEngagement) : null;
}

export async function getEngagementSummary(circleId: string, _period?: string): Promise<EngagementSummary> {
  const snap = await circleRef(circleId).collection('org_engagement').get();
  const members = snap.docs.map((d) => d.data() as MemberEngagement);
  const active = members.filter((m) => {
    const lastActive = new Date(m.last_active_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return lastActive >= thirtyDaysAgo;
  });

  const avgAttendance = members.length > 0
    ? members.reduce((sum, m) => sum + m.events_attended, 0) / members.length
    : 0;
  const avgScore = members.length > 0
    ? members.reduce((sum, m) => sum + m.engagement_score, 0) / members.length
    : 0;

  const sorted = [...members].sort((a, b) => b.engagement_score - a.engagement_score);

  return {
    circle_id: circleId,
    total_members: members.length,
    active_members: active.length,
    average_attendance_rate: avgAttendance,
    average_engagement_score: Math.round(avgScore),
    top_contributors: sorted.slice(0, 5),
    at_risk_members: sorted.filter((m) => m.engagement_score < 20).slice(0, 5),
    period: _period ?? 'last_30_days',
  };
}

// ── Officer Transitions ───────────────────────

export async function createTransition(circleId: string, req: CreateTransitionRequest) {
  await getAuthUser();
  const roleSnap = await circleRef(circleId).collection('org_roles').doc(req.role_id).get();
  const role = roleSnap.data() as OfficerRole | undefined;

  const defaultChecklist = [
    { id: 'tc-1', label: 'Transfer all role-specific documents', completed: false, category: 'documents' as const },
    { id: 'tc-2', label: 'Share login credentials and access', completed: false, category: 'access' as const },
    { id: 'tc-3', label: 'Introduce key contacts', completed: false, category: 'contacts' as const },
    { id: 'tc-4', label: 'Review upcoming deadlines and recurring tasks', completed: false, category: 'knowledge' as const },
    { id: 'tc-5', label: 'Walk through active projects', completed: false, category: 'knowledge' as const },
    { id: 'tc-6', label: 'Transfer financial records (if applicable)', completed: false, category: 'financial' as const },
    { id: 'tc-7', label: 'Update role assignment in system', completed: false, category: 'access' as const },
    { id: 'tc-8', label: 'Write "What I Wish I Knew" reflection', completed: false, category: 'knowledge' as const },
  ];

  const ref = circleRef(circleId).collection('org_transitions').doc();
  const transition: OfficerTransition = {
    id: ref.id,
    circle_id: circleId,
    role_id: req.role_id,
    role_name: role?.name ?? 'Unknown',
    outgoing_user_id: req.outgoing_user_id,
    outgoing_user_name: '',
    incoming_user_id: req.incoming_user_id ?? null,
    incoming_user_name: null,
    status: 'pending',
    checklist: defaultChecklist,
    reflection_notes: null,
    key_contacts: [],
    term_year: req.term_year,
    started_at: now(),
    completed_at: null,
  };
  await ref.set(transition);
  revalidatePath(`/nucleus/community/circles`);
  return transition;
}

export async function listTransitions(circleId: string): Promise<OfficerTransition[]> {
  const snap = await circleRef(circleId).collection('org_transitions')
    .orderBy('started_at', 'desc').get();
  return snap.docs.map((d) => d.data() as OfficerTransition);
}

export async function updateTransitionChecklist(
  circleId: string,
  transitionId: string,
  checklistItemId: string,
  completed: boolean,
) {
  await getAuthUser();
  const ref = circleRef(circleId).collection('org_transitions').doc(transitionId);
  const snap = await ref.get();
  const transition = snap.data() as OfficerTransition;
  const updatedChecklist = transition.checklist.map((item) =>
    item.id === checklistItemId ? { ...item, completed } : item,
  );
  await ref.update({ checklist: updatedChecklist, status: 'in_progress' });
  return { ...transition, checklist: updatedChecklist, status: 'in_progress' as const };
}

export async function completeTransition(circleId: string, transitionId: string, reflectionNotes?: string) {
  await getAuthUser();
  const ref = circleRef(circleId).collection('org_transitions').doc(transitionId);
  await ref.update({
    status: 'completed',
    completed_at: now(),
    reflection_notes: reflectionNotes ?? null,
  });
  const snap = await ref.get();
  revalidatePath(`/nucleus/community/circles`);
  return snap.data() as OfficerTransition;
}

// ── Announcements ─────────────────────────────

export async function createAnnouncement(circleId: string, req: CreateAnnouncementRequest) {
  await getAuthUser();
  const ref = circleRef(circleId).collection('org_announcements').doc();
  const announcement: Announcement = {
    id: ref.id,
    circle_id: circleId,
    title: req.title,
    content: req.content,
    priority: req.priority ?? 'normal',
    target_roles: req.target_roles ?? [],
    is_pinned: req.is_pinned ?? false,
    read_count: 0,
    total_recipients: 0,
    created_by: req.created_by,
    created_at: now(),
    expires_at: req.expires_at ?? null,
  };
  await ref.set(announcement);
  revalidatePath(`/nucleus/community/circles`);
  return announcement;
}

export async function listAnnouncements(circleId: string): Promise<Announcement[]> {
  const snap = await circleRef(circleId).collection('org_announcements')
    .orderBy('created_at', 'desc').get();
  return snap.docs.map((d) => d.data() as Announcement)
    .filter((a) => !a.expires_at || new Date(a.expires_at) > new Date());
}

export async function markAnnouncementRead(circleId: string, announcementId: string, _userId: string) {
  const ref = circleRef(circleId).collection('org_announcements').doc(announcementId);
  const snap = await ref.get();
  const current = (snap.data() as Announcement | undefined)?.read_count ?? 0;
  await ref.update({ read_count: current + 1 });
  return { status: 'read' };
}

// ── Notification Preferences ──────────────────

const DEFAULT_PREFS: Omit<NotificationPreferences, 'user_id' | 'circle_id' | 'updated_at'> = {
  announcements: { channel: 'in_app', frequency: 'immediate' },
  task_reminders: { channel: 'in_app', frequency: 'daily_digest' },
  event_reminders: { channel: 'in_app', frequency: 'immediate' },
  attendance_reminders: { channel: 'in_app', frequency: 'immediate' },
  transition_updates: { channel: 'in_app', frequency: 'immediate' },
};

export async function getNotificationPreferences(circleId: string, userId: string): Promise<NotificationPreferences> {
  const ref = circleRef(circleId).collection('org_notification_prefs').doc(userId);
  const snap = await ref.get();
  if (snap.exists) return snap.data() as NotificationPreferences;
  // Return defaults if not set
  return { user_id: userId, circle_id: circleId, ...DEFAULT_PREFS, updated_at: now() };
}

export async function updateNotificationPreferences(
  circleId: string,
  userId: string,
  req: UpdateNotificationPreferencesRequest,
): Promise<NotificationPreferences> {
  await getAuthUser();
  const ref = circleRef(circleId).collection('org_notification_prefs').doc(userId);
  const snap = await ref.get();
  const existing = snap.exists
    ? (snap.data() as NotificationPreferences)
    : { user_id: userId, circle_id: circleId, ...DEFAULT_PREFS, updated_at: now() };

  const updated: NotificationPreferences = {
    ...existing,
    announcements: { ...existing.announcements, ...req.announcements },
    task_reminders: { ...existing.task_reminders, ...req.task_reminders },
    event_reminders: { ...existing.event_reminders, ...req.event_reminders },
    attendance_reminders: { ...existing.attendance_reminders, ...req.attendance_reminders },
    transition_updates: { ...existing.transition_updates, ...req.transition_updates },
    updated_at: now(),
  };
  await ref.set(updated);
  return updated;
}

// ── Year-to-Year Duplication ──────────────────

export async function duplicateYear(circleId: string, req: DuplicateYearRequest): Promise<DuplicateYearResult> {
  await getAuthUser();
  const result: DuplicateYearResult = {
    tasks_copied: 0,
    events_copied: 0,
    calendar_entries_copied: 0,
    document_folders_copied: 0,
    source_year: req.source_year,
    target_year: req.target_year,
  };

  const batch = adminDb.batch();
  const cRef = circleRef(circleId);

  // Duplicate recurring tasks
  if (req.include_tasks) {
    const tasksSnap = await cRef.collection('org_tasks')
      .where('recurrence', '!=', null).get();
    for (const doc of tasksSnap.docs) {
      const task = doc.data() as OrgTask;
      const newRef = cRef.collection('org_tasks').doc();

      // Shift due dates by one year
      let newDueDate: string | null = null;
      if (task.due_date) {
        const d = new Date(task.due_date);
        const yearDiff = parseInt(req.target_year) - parseInt(req.source_year);
        d.setFullYear(d.getFullYear() + yearDiff);
        newDueDate = d.toISOString();
      }

      batch.set(newRef, {
        ...task,
        id: newRef.id,
        status: 'pending',
        due_date: newDueDate,
        completed_at: null,
        completed_by: null,
        created_by: req.created_by,
        created_at: now(),
        updated_at: now(),
      });
      result.tasks_copied++;
    }
  }

  // Duplicate events (as templates, status=planning)
  if (req.include_events) {
    const eventsSnap = await cRef.collection('org_events').get();
    // Filter to source year events
    const sourceEvents = eventsSnap.docs
      .map((d) => d.data() as OrgEvent)
      .filter((e) => e.start_time.startsWith(req.source_year));

    for (const event of sourceEvents) {
      const newRef = cRef.collection('org_events').doc();
      const yearDiff = parseInt(req.target_year) - parseInt(req.source_year);

      const newStart = new Date(event.start_time);
      newStart.setFullYear(newStart.getFullYear() + yearDiff);
      let newEnd: string | null = null;
      if (event.end_time) {
        const e = new Date(event.end_time);
        e.setFullYear(e.getFullYear() + yearDiff);
        newEnd = e.toISOString();
      }

      batch.set(newRef, {
        ...event,
        id: newRef.id,
        status: 'planning',
        start_time: newStart.toISOString(),
        end_time: newEnd,
        attendance_count: 0,
        rsvp_count: 0,
        feedback_collected: false,
        checklist: event.checklist.map((c) => ({ ...c, completed: false })),
        created_by: req.created_by,
        created_at: now(),
        updated_at: now(),
      });
      result.events_copied++;
    }
  }

  // Duplicate calendar entries
  if (req.include_calendar) {
    const calSnap = await cRef.collection('org_calendar').get();
    const sourceEntries = calSnap.docs
      .map((d) => d.data() as CalendarEntry)
      .filter((c) => c.start_time.startsWith(req.source_year) && c.recurrence);

    for (const entry of sourceEntries) {
      const newRef = cRef.collection('org_calendar').doc();
      const yearDiff = parseInt(req.target_year) - parseInt(req.source_year);
      const newStart = new Date(entry.start_time);
      newStart.setFullYear(newStart.getFullYear() + yearDiff);

      batch.set(newRef, {
        ...entry,
        id: newRef.id,
        start_time: newStart.toISOString(),
        created_by: req.created_by,
        created_at: now(),
      });
      result.calendar_entries_copied++;
    }
  }

  // Duplicate document folder structure (empty folders)
  if (req.include_document_structure) {
    const docsSnap = await cRef.collection('org_documents').get();
    const folders = new Set<string>();
    docsSnap.docs.forEach((d) => {
      const doc = d.data() as OrgDocument;
      if (doc.academic_year === req.source_year && doc.folder_path) {
        folders.add(doc.folder_path);
      }
    });

    for (const folder of folders) {
      const newRef = cRef.collection('org_documents').doc();
      batch.set(newRef, {
        id: newRef.id,
        circle_id: circleId,
        name: `${folder} (${req.target_year})`,
        description: `Folder structure duplicated from ${req.source_year}`,
        folder_path: folder.replace(req.source_year, req.target_year),
        file_url: null,
        file_size: null,
        mime_type: null,
        tags: ['templates'],
        owner_role_id: null,
        version: 1,
        academic_year: req.target_year,
        is_archived: false,
        created_by: req.created_by,
        created_at: now(),
        updated_at: now(),
      });
      result.document_folders_copied++;
    }
  }

  await batch.commit();
  log.info(`Duplicated year ${req.source_year} -> ${req.target_year} for circle ${circleId}`, result);
  revalidatePath(`/nucleus/community/circles`);
  return result;
}

// ── Export Members ─────────────────────────────

export async function exportMembers(circleId: string, req: ExportMembersRequest): Promise<ExportResult> {
  await getAuthUser();

  // Get members from circle
  const membersSnap = await circleRef(circleId).collection('members').get();
  const members = membersSnap.docs.map((d) => d.data() as { user_id: string; role: string; status: string; joined_at: string });

  // Optionally get engagement data
  let engagementMap = new Map<string, MemberEngagement>();
  if (req.include_engagement) {
    const engSnap = await circleRef(circleId).collection('org_engagement').get();
    engSnap.docs.forEach((d) => {
      const eng = d.data() as MemberEngagement;
      engagementMap.set(eng.user_id, eng);
    });
  }

  // Filter alumni
  const filtered = req.include_alumni
    ? members
    : members.filter((m) => m.status === 'Active');

  if (req.format === 'csv') {
    const headers = ['user_id', 'role', 'status', 'joined_at'];
    if (req.include_engagement) {
      headers.push('meetings_attended', 'events_attended', 'tasks_completed', 'engagement_score', 'attendance_streak');
    }

    const rows = filtered.map((m) => {
      const base = [m.user_id, m.role, m.status, m.joined_at];
      if (req.include_engagement) {
        const eng = engagementMap.get(m.user_id);
        base.push(
          String(eng?.meetings_attended ?? 0),
          String(eng?.events_attended ?? 0),
          String(eng?.tasks_completed ?? 0),
          String(eng?.engagement_score ?? 0),
          String(eng?.attendance_streak ?? 0),
        );
      }
      return base.join(',');
    });

    return {
      data: [headers.join(','), ...rows].join('\n'),
      filename: `members-${circleId}-${new Date().toISOString().slice(0, 10)}.csv`,
      mime_type: 'text/csv',
      row_count: filtered.length,
    };
  }

  // JSON format
  const jsonData = filtered.map((m) => ({
    ...m,
    engagement: req.include_engagement ? engagementMap.get(m.user_id) ?? null : undefined,
  }));

  return {
    data: JSON.stringify(jsonData, null, 2),
    filename: `members-${circleId}-${new Date().toISOString().slice(0, 10)}.json`,
    mime_type: 'application/json',
    row_count: filtered.length,
  };
}

// ── Dashboard (Aggregate) ─────────────────────

export async function getOfficerDashboard(circleId: string, userId: string): Promise<OfficerDashboard> {
  // Parallel fetch all dashboard data
  const [
    assignmentsSnap,
    tasksSnap,
    calendarSnap,
    eventsSnap,
    announcementsSnap,
    transitionsSnap,
  ] = await Promise.all([
    circleRef(circleId).collection('org_assignments')
      .where('user_id', '==', userId).where('status', '==', 'active').get(),
    circleRef(circleId).collection('org_tasks')
      .where('status', 'in', ['pending', 'in_progress']).get(),
    circleRef(circleId).collection('org_calendar')
      .where('start_time', '>=', now()).orderBy('start_time', 'asc').limit(10).get(),
    circleRef(circleId).collection('org_events')
      .where('status', 'in', ['planning', 'scheduled', 'in_progress']).orderBy('start_time', 'asc').limit(5).get(),
    circleRef(circleId).collection('org_announcements')
      .orderBy('created_at', 'desc').limit(10).get(),
    circleRef(circleId).collection('org_transitions')
      .where('status', 'in', ['pending', 'in_progress']).get(),
  ]);

  const myRoles = assignmentsSnap.docs.map((d) => d.data() as OfficerAssignment);
  const myRoleIds = new Set(myRoles.map((r) => r.role_id));

  // Filter tasks to those assigned to user's roles or directly to user
  const allTasks = tasksSnap.docs.map((d) => d.data() as OrgTask);
  const myTasks = allTasks.filter(
    (t) =>
      (t.assigned_role_id && myRoleIds.has(t.assigned_role_id)) ||
      t.assigned_user_id === userId,
  );

  const calendar = calendarSnap.docs.map((d) => d.data() as CalendarEntry);
  const events = eventsSnap.docs.map((d) => d.data() as OrgEvent);
  const announcements = announcementsSnap.docs.map((d) => d.data() as Announcement)
    .filter((a) => !a.expires_at || new Date(a.expires_at) > new Date())
    .filter((a) => a.target_roles.length === 0 || a.target_roles.some((r) => myRoleIds.has(r)));

  const transitions = transitionsSnap.docs.map((d) => d.data() as OfficerTransition)
    .filter((t) => t.outgoing_user_id === userId || t.incoming_user_id === userId);

  let engagement: EngagementSummary | null = null;
  if (myRoleIds.size > 0) {
    engagement = await getEngagementSummary(circleId);
  }

  return {
    my_roles: myRoles,
    my_tasks: myTasks,
    upcoming_calendar: calendar,
    upcoming_events: events,
    announcements,
    pending_transitions: transitions,
    engagement,
  };
}
