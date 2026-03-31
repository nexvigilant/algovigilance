import { NextRequest, NextResponse } from 'next/server';
import * as orgActions from '@/lib/actions/circles-org';
import * as gcalActions from '@/lib/actions/gcal-sync';

/**
 * Circle Organization Management API Router
 *
 * POST /api/circles-org
 * Body: { action: string, circleId: string, ...params }
 *
 * Routes to the appropriate server action based on the action field.
 */

type ActionMap = Record<string, (body: Record<string, unknown>) => Promise<unknown>>;

const actions: ActionMap = {
  // Roles
  createOfficerRole: (b) => orgActions.createOfficerRole(b.circleId as string, b.req as Parameters<typeof orgActions.createOfficerRole>[1]),
  listOfficerRoles: (b) => orgActions.listOfficerRoles(b.circleId as string),
  updateOfficerRole: (b) => orgActions.updateOfficerRole(b.circleId as string, b.roleId as string, b.req as Parameters<typeof orgActions.updateOfficerRole>[2]),
  deleteOfficerRole: (b) => orgActions.deleteOfficerRole(b.circleId as string, b.roleId as string),

  // Assignments
  assignOfficer: (b) => orgActions.assignOfficer(b.circleId as string, b.req as Parameters<typeof orgActions.assignOfficer>[1]),
  listAssignments: (b) => orgActions.listAssignments(b.circleId as string),
  endAssignment: (b) => orgActions.endAssignment(b.circleId as string, b.assignmentId as string),

  // Tasks
  createTask: (b) => orgActions.createTask(b.circleId as string, b.req as Parameters<typeof orgActions.createTask>[1]),
  listTasks: (b) => orgActions.listTasks(b.circleId as string, b.filters as Parameters<typeof orgActions.listTasks>[1]),
  updateTask: (b) => orgActions.updateTask(b.circleId as string, b.taskId as string, b.req as Parameters<typeof orgActions.updateTask>[2]),
  completeTask: (b) => orgActions.completeTask(b.circleId as string, b.taskId as string, b.completedBy as string),
  deleteTask: (b) => orgActions.deleteTask(b.circleId as string, b.taskId as string),

  // Calendar
  listCalendarEntries: (b) => orgActions.listCalendarEntries(b.circleId as string, b.filters as Parameters<typeof orgActions.listCalendarEntries>[1]),
  createCalendarEntry: (b) => orgActions.createCalendarEntry(b.circleId as string, b.req as Parameters<typeof orgActions.createCalendarEntry>[1]),

  // Events
  createEvent: (b) => orgActions.createEvent(b.circleId as string, b.req as Parameters<typeof orgActions.createEvent>[1]),
  listEvents: (b) => orgActions.listEvents(b.circleId as string, b.filters as Parameters<typeof orgActions.listEvents>[1]),
  getEvent: (b) => orgActions.getEvent(b.circleId as string, b.eventId as string),
  updateEvent: (b) => orgActions.updateEvent(b.circleId as string, b.eventId as string, b.req as Parameters<typeof orgActions.updateEvent>[2]),
  checkInEvent: (b) => orgActions.checkInEvent(b.circleId as string, b.eventId as string, b.userId as string, (b.method as 'qr' | 'manual') ?? 'manual'),
  listEventAttendance: (b) => orgActions.listEventAttendance(b.circleId as string, b.eventId as string),

  // Documents
  createDocument: (b) => orgActions.createDocument(b.circleId as string, b.req as Parameters<typeof orgActions.createDocument>[1]),
  listDocuments: (b) => orgActions.listDocuments(b.circleId as string, b.filters as Parameters<typeof orgActions.listDocuments>[1]),
  searchDocuments: (b) => orgActions.searchDocuments(b.circleId as string, b.query as string),

  // Engagement
  getMemberEngagement: (b) => orgActions.getMemberEngagement(b.circleId as string, b.userId as string),
  getEngagementSummary: (b) => orgActions.getEngagementSummary(b.circleId as string, b.period as string | undefined),

  // Transitions
  createTransition: (b) => orgActions.createTransition(b.circleId as string, b.req as Parameters<typeof orgActions.createTransition>[1]),
  listTransitions: (b) => orgActions.listTransitions(b.circleId as string),
  updateTransitionChecklist: (b) => orgActions.updateTransitionChecklist(b.circleId as string, b.transitionId as string, b.checklistItemId as string, b.completed as boolean),
  completeTransition: (b) => orgActions.completeTransition(b.circleId as string, b.transitionId as string, b.reflectionNotes as string | undefined),

  // Announcements
  createAnnouncement: (b) => orgActions.createAnnouncement(b.circleId as string, b.req as Parameters<typeof orgActions.createAnnouncement>[1]),
  listAnnouncements: (b) => orgActions.listAnnouncements(b.circleId as string),
  markAnnouncementRead: (b) => orgActions.markAnnouncementRead(b.circleId as string, b.announcementId as string, b.userId as string),

  // Notification Preferences
  getNotificationPreferences: (b) => orgActions.getNotificationPreferences(b.circleId as string, b.userId as string),
  updateNotificationPreferences: (b) => orgActions.updateNotificationPreferences(b.circleId as string, b.userId as string, b.req as Parameters<typeof orgActions.updateNotificationPreferences>[2]),

  // Year Duplication
  duplicateYear: (b) => orgActions.duplicateYear(b.circleId as string, b.req as Parameters<typeof orgActions.duplicateYear>[1]),

  // Export
  exportMembers: (b) => orgActions.exportMembers(b.circleId as string, b.req as Parameters<typeof orgActions.exportMembers>[1]),

  // Google Calendar Sync
  getGCalAuthUrl: (b) => gcalActions.getGCalAuthUrl(b.circleId as string),
  getGCalConnection: (b) => gcalActions.getGCalConnection(b.circleId as string, b.userId as string),
  disconnectGCal: (b) => gcalActions.disconnectGCal(b.circleId as string),
  syncGCal: (b) => gcalActions.syncGCal(b.circleId as string),

  // Dashboard
  getOfficerDashboard: (b) => orgActions.getOfficerDashboard(b.circleId as string, b.userId as string),
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const { action, ...params } = body;

    if (typeof action !== 'string' || !actions[action]) {
      return NextResponse.json(
        { message: `Unknown action: ${String(action)}` },
        { status: 400 },
      );
    }

    const result = await actions[action](params);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('Not authenticated') ? 401 :
                   message.includes('Unauthorized') ? 403 : 500;
    return NextResponse.json({ message }, { status });
  }
}
