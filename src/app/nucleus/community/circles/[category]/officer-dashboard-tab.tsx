'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  FileText,
  Users,
  ChevronRight,
  Megaphone,
  ArrowRightLeft,
  Flame,
  TrendingUp,
  TrendingDown,
  Plus,
  ClipboardList,
  CalendarPlus,
  BarChart3,
} from 'lucide-react';
import {
  getOfficerDashboard,
  getMemberEngagement,
  type OfficerDashboard,
  type OrgTask,
  type CalendarEntry,
  type OrgEvent,
  type Announcement,
  type OfficerAssignment,
  type MemberEngagement,
  completeTask,
} from '@/lib/api/circles-org-api';
import { useAuth } from '@/hooks/use-auth';

// ── Priority & Status Styles ──────────────────

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'border-red-500/30 text-red-400 bg-red-500/10',
  high: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
  medium: 'border-cyan/30 text-cyan bg-cyan/10',
  low: 'border-nex-light text-cyan-soft/60',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'text-cyan-soft/60',
  in_progress: 'text-cyan',
  completed: 'text-emerald-400',
  overdue: 'text-red-400',
};

// ── Sub-Components ────────────────────────────

function RoleChip({ assignment }: { assignment: OfficerAssignment }) {
  return (
    <Badge variant="outline" className="border-nex-gold-500/30 text-nex-gold-400 gap-1">
      {assignment.role_name}
    </Badge>
  );
}

function TaskRow({
  task,
  circleId,
  onComplete,
}: {
  task: OrgTask;
  circleId: string;
  onComplete: () => void;
}) {
  const { user } = useAuth();
  const [completing, setCompleting] = useState(false);
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

  const handleComplete = async () => {
    if (!user?.uid) return;
    setCompleting(true);
    const res = await completeTask(circleId, task.id, user.uid);
    if (res.success) onComplete();
    setCompleting(false);
  };

  return (
    <div className="flex items-center gap-3 border-b border-nex-light/30 py-3 last:border-0">
      <button
        onClick={() => void handleComplete()}
        disabled={completing || task.status === 'completed'}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-nex-light transition-colors hover:border-cyan disabled:opacity-50"
      >
        {task.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${task.status === 'completed' ? 'text-cyan-soft/40 line-through' : 'text-white'}`}>
          {task.title}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          {task.assigned_role_name && (
            <span className="text-xs text-cyan-soft/50">{task.assigned_role_name}</span>
          )}
          {task.due_date && (
            <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-cyan-soft/40'}`}>
              {isOverdue && <AlertTriangle className="mr-0.5 inline h-3 w-3" />}
              {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>
      <Badge variant="outline" className={`text-[10px] ${PRIORITY_STYLES[task.priority] ?? ''}`}>
        {task.priority}
      </Badge>
    </div>
  );
}

function CalendarRow({ entry }: { entry: CalendarEntry }) {
  const isToday = new Date(entry.start_time).toDateString() === new Date().toDateString();
  return (
    <div className="flex items-center gap-3 border-b border-nex-light/30 py-2.5 last:border-0">
      <div className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded ${isToday ? 'bg-cyan/20' : 'bg-nex-surface'}`}>
        <span className={`text-[10px] font-medium uppercase ${isToday ? 'text-cyan' : 'text-cyan-soft/50'}`}>
          {new Date(entry.start_time).toLocaleDateString('en-US', { month: 'short' })}
        </span>
        <span className={`text-sm font-bold ${isToday ? 'text-cyan' : 'text-white'}`}>
          {new Date(entry.start_time).getDate()}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">{entry.title}</p>
        {entry.location && (
          <p className="text-xs text-cyan-soft/40">{entry.location}</p>
        )}
      </div>
      <Badge variant="outline" className="border-nex-light text-cyan-soft/50 text-[10px]">
        {entry.entry_type.replace('_', ' ')}
      </Badge>
    </div>
  );
}

function EventCard({ event }: { event: OrgEvent }) {
  const daysUntil = Math.ceil((new Date(event.start_time).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return (
    <Card className="border border-nex-light bg-nex-surface p-3 transition-colors hover:border-cyan/30">
      <div className="mb-1 flex items-start justify-between">
        <h4 className="text-sm font-medium text-white">{event.name}</h4>
        <Badge
          variant="outline"
          className={`text-[10px] ${
            event.status === 'scheduled' ? 'border-cyan/30 text-cyan' :
            event.status === 'in_progress' ? 'border-emerald-500/30 text-emerald-400' :
            'border-nex-light text-cyan-soft/50'
          }`}
        >
          {event.status}
        </Badge>
      </div>
      {event.value_proposition && (
        <p className="mb-2 text-xs text-cyan-soft/60 italic">
          &ldquo;{event.value_proposition}&rdquo;
        </p>
      )}
      <div className="flex items-center justify-between text-xs text-cyan-soft/40">
        <span>
          {new Date(event.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
        {daysUntil > 0 && <span>{daysUntil}d away</span>}
        {event.attendance_count > 0 && (
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {event.attendance_count}{event.capacity ? `/${event.capacity}` : ''}
          </span>
        )}
      </div>
    </Card>
  );
}

function AnnouncementRow({ announcement }: { announcement: Announcement }) {
  return (
    <div className="border-b border-nex-light/30 py-2.5 last:border-0">
      <div className="flex items-center gap-2">
        {announcement.priority === 'urgent' && <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
        {announcement.priority === 'important' && <Megaphone className="h-3.5 w-3.5 text-amber-400" />}
        <p className="text-sm font-medium text-white">{announcement.title}</p>
        {announcement.is_pinned && (
          <Badge variant="outline" className="border-nex-gold-500/30 text-nex-gold-400 text-[10px]">pinned</Badge>
        )}
      </div>
      <p className="mt-0.5 line-clamp-2 text-xs text-cyan-soft/60">{announcement.content}</p>
    </div>
  );
}

// ── Progress Visibility ───────────────────────

function StreakBadge({ streak }: { streak: number }) {
  if (streak <= 0) return null;
  const color = streak >= 5 ? 'text-nex-gold-400 border-nex-gold-500/30' :
                streak >= 3 ? 'text-emerald-400 border-emerald-500/30' :
                'text-cyan border-cyan/30';
  return (
    <Badge variant="outline" className={`gap-1 text-xs ${color}`}>
      <Flame className="h-3 w-3" />
      {streak} streak
    </Badge>
  );
}

function EngagementCard({ engagement, circleId }: { engagement: MemberEngagement; circleId: string }) {
  const score = engagement.engagement_score;
  const scoreColor = score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-amber-400' : 'text-red-400';
  const barColor = score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <Card className="border border-nex-light bg-nex-surface p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
        <BarChart3 className="h-4 w-4 text-cyan" />
        Your Engagement
      </h3>
      {/* Score bar */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs text-cyan-soft/50">Engagement Score</span>
          <span className={`text-sm font-bold ${scoreColor}`}>{score}/100</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-nex-light">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${score}%` }} />
        </div>
      </div>
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded border border-nex-light/50 p-2 text-center">
          <p className="text-lg font-bold text-white">{engagement.meetings_attended}</p>
          <p className="text-[10px] text-cyan-soft/40">Meetings</p>
        </div>
        <div className="rounded border border-nex-light/50 p-2 text-center">
          <p className="text-lg font-bold text-white">{engagement.events_attended}</p>
          <p className="text-[10px] text-cyan-soft/40">Events</p>
        </div>
        <div className="rounded border border-nex-light/50 p-2 text-center">
          <p className="text-lg font-bold text-white">{engagement.tasks_completed}</p>
          <p className="text-[10px] text-cyan-soft/40">Tasks Done</p>
        </div>
        <div className="rounded border border-nex-light/50 p-2 text-center">
          <p className="text-lg font-bold text-white">{engagement.posts_created}</p>
          <p className="text-[10px] text-cyan-soft/40">Posts</p>
        </div>
      </div>
      {/* Streak */}
      {engagement.attendance_streak > 0 && (
        <div className="mt-3 flex items-center justify-center">
          <StreakBadge streak={engagement.attendance_streak} />
        </div>
      )}
    </Card>
  );
}

function EngagementSummaryCard({ summary }: { summary: NonNullable<OfficerDashboard['engagement']> }) {
  const activeRate = summary.total_members > 0
    ? Math.round((summary.active_members / summary.total_members) * 100)
    : 0;
  const rateColor = activeRate >= 50 ? 'text-emerald-400' : activeRate >= 25 ? 'text-amber-400' : 'text-red-400';

  return (
    <Card className="border border-nex-light bg-nex-surface p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
        <TrendingUp className="h-4 w-4 text-cyan" />
        Organization Health
      </h3>
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <p className={`text-lg font-bold ${rateColor}`}>{activeRate}%</p>
          <p className="text-[10px] text-cyan-soft/40">Active Rate</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-white">{summary.active_members}/{summary.total_members}</p>
          <p className="text-[10px] text-cyan-soft/40">Members</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-white">{summary.average_engagement_score}</p>
          <p className="text-[10px] text-cyan-soft/40">Avg Score</p>
        </div>
      </div>
      {/* At-risk members warning */}
      {summary.at_risk_members.length > 0 && (
        <div className="mt-3 rounded border border-amber-500/20 bg-amber-500/5 p-2">
          <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-amber-400">
            <TrendingDown className="h-3 w-3" />
            {summary.at_risk_members.length} at-risk member{summary.at_risk_members.length > 1 ? 's' : ''}
          </p>
          <p className="text-[10px] text-cyan-soft/40">
            Low engagement scores — consider outreach
          </p>
        </div>
      )}
    </Card>
  );
}

// ── Quick Actions (Low Input Burden) ──────────

function QuickActions({ circleId }: { circleId: string }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 gap-1.5 border-nex-light text-cyan-soft/70 hover:border-cyan/30 hover:text-cyan"
        onClick={() => {
          // Navigate to tasks tab with create dialog open
          const el = document.querySelector('[value="tasks"]') as HTMLElement;
          el?.click();
        }}
      >
        <Plus className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">New</span> Task
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 gap-1.5 border-nex-light text-cyan-soft/70 hover:border-cyan/30 hover:text-cyan"
        onClick={() => {
          const el = document.querySelector('[value="events"]') as HTMLElement;
          el?.click();
        }}
      >
        <CalendarPlus className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">New</span> Event
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 gap-1.5 border-nex-light text-cyan-soft/70 hover:border-cyan/30 hover:text-cyan"
        onClick={() => {
          const el = document.querySelector('[value="feed"]') as HTMLElement;
          el?.click();
        }}
      >
        <Megaphone className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Post</span> Update
      </Button>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────

interface OfficerDashboardTabProps {
  circleId: string;
}

export function OfficerDashboardTab({ circleId }: OfficerDashboardTabProps) {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<OfficerDashboard | null>(null);
  const [myEngagement, setMyEngagement] = useState<MemberEngagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError(null);
    const [dashRes, engRes] = await Promise.all([
      getOfficerDashboard(circleId, user.uid),
      getMemberEngagement(circleId, user.uid),
    ]);
    if (dashRes.success && dashRes.data) {
      setDashboard(dashRes.data);
    } else {
      setError(dashRes.error ?? 'Failed to load dashboard');
    }
    if (engRes.success && engRes.data) {
      setMyEngagement(engRes.data);
    }
    setLoading(false);
  }, [circleId, user?.uid]);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="h-48 animate-pulse border border-nex-light bg-nex-surface" />
        ))}
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <Card className="border border-nex-light bg-nex-surface p-8 text-center">
        <p className="text-cyan-soft/60">{error ?? 'No dashboard data available'}</p>
        <p className="mt-2 text-xs text-cyan-soft/40">
          Organization features are being set up. Ask an admin to configure officer roles.
        </p>
      </Card>
    );
  }

  const pendingTasks = dashboard.my_tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');
  const overdueTasks = pendingTasks.filter((t) => t.due_date && new Date(t.due_date) < new Date());
  const thisWeekTasks = pendingTasks.filter((t) => {
    if (!t.due_date) return false;
    const due = new Date(t.due_date);
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return due >= now && due <= weekEnd;
  });

  return (
    <div className="space-y-4">
      {/* Role Chips */}
      {dashboard.my_roles.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-cyan-soft/50">Your roles:</span>
          {dashboard.my_roles.map((r) => <RoleChip key={r.id} assignment={r} />)}
        </div>
      )}

      {/* Quick Actions — Low Input Burden (SOW §1.3) */}
      <QuickActions circleId={circleId} />

      {/* Quick Stats — Mobile: 2 cols, Desktop: 4 cols */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        <Card className="border border-nex-light bg-nex-surface p-3 text-center">
          <p className="text-2xl font-bold text-white">{thisWeekTasks.length}</p>
          <p className="text-xs text-cyan-soft/50">Tasks This Week</p>
        </Card>
        <Card className={`border bg-nex-surface p-3 text-center ${overdueTasks.length > 0 ? 'border-red-500/30' : 'border-nex-light'}`}>
          <p className={`text-2xl font-bold ${overdueTasks.length > 0 ? 'text-red-400' : 'text-white'}`}>
            {overdueTasks.length}
          </p>
          <p className="text-xs text-cyan-soft/50">Overdue</p>
        </Card>
        <Card className="border border-nex-light bg-nex-surface p-3 text-center">
          <p className="text-2xl font-bold text-white">{dashboard.upcoming_events.length}</p>
          <p className="text-xs text-cyan-soft/50">Upcoming Events</p>
        </Card>
        <Card className="border border-nex-light bg-nex-surface p-3 text-center">
          <p className="text-2xl font-bold text-white">{dashboard.announcements.length}</p>
          <p className="text-xs text-cyan-soft/50">Announcements</p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* My Tasks */}
        <Card className="border border-nex-light bg-nex-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <CheckCircle2 className="h-4 w-4 text-cyan" />
              My Tasks
            </h3>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-cyan-soft/50 hover:text-cyan">
              View All <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
          {pendingTasks.length === 0 ? (
            <p className="py-6 text-center text-sm text-cyan-soft/40">No pending tasks</p>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {pendingTasks.slice(0, 8).map((task) => (
                <TaskRow key={task.id} task={task} circleId={circleId} onComplete={() => void loadDashboard()} />
              ))}
            </div>
          )}
        </Card>

        {/* Calendar */}
        <Card className="border border-nex-light bg-nex-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Calendar className="h-4 w-4 text-cyan" />
              Upcoming
            </h3>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-cyan-soft/50 hover:text-cyan">
              Full Calendar <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
          {dashboard.upcoming_calendar.length === 0 ? (
            <p className="py-6 text-center text-sm text-cyan-soft/40">Nothing scheduled</p>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {dashboard.upcoming_calendar.slice(0, 6).map((entry) => (
                <CalendarRow key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </Card>

        {/* Upcoming Events */}
        {dashboard.upcoming_events.length > 0 && (
          <Card className="border border-nex-light bg-nex-surface p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <Users className="h-4 w-4 text-cyan" />
              Events
            </h3>
            <div className="space-y-2">
              {dashboard.upcoming_events.slice(0, 4).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </Card>
        )}

        {/* Announcements */}
        {dashboard.announcements.length > 0 && (
          <Card className="border border-nex-light bg-nex-surface p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <Megaphone className="h-4 w-4 text-cyan" />
              Announcements
            </h3>
            <div className="max-h-72 overflow-y-auto">
              {dashboard.announcements.map((a) => (
                <AnnouncementRow key={a.id} announcement={a} />
              ))}
            </div>
          </Card>
        )}

        {/* Pending Transitions */}
        {dashboard.pending_transitions.length > 0 && (
          <Card className="border border-amber-500/30 bg-nex-surface p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <ArrowRightLeft className="h-4 w-4 text-amber-400" />
              Officer Transitions
            </h3>
            {dashboard.pending_transitions.map((t) => (
              <div key={t.id} className="border-b border-nex-light/30 py-2.5 last:border-0">
                <p className="text-sm text-white">
                  {t.role_name}: {t.outgoing_user_name} → {t.incoming_user_name ?? 'TBD'}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] ${
                    t.status === 'pending' ? 'border-amber-500/30 text-amber-400' :
                    t.status === 'in_progress' ? 'border-cyan/30 text-cyan' :
                    'border-emerald-500/30 text-emerald-400'
                  }`}>
                    {t.status}
                  </Badge>
                  <span className="text-xs text-cyan-soft/40">
                    {t.checklist.filter((c) => c.completed).length}/{t.checklist.length} items done
                  </span>
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* Progress Visibility — Engagement (SOW §1.3) */}
        {myEngagement && (
          <EngagementCard engagement={myEngagement} circleId={circleId} />
        )}

        {/* Org Health — Leaders only */}
        {dashboard.engagement && dashboard.my_roles.length > 0 && (
          <EngagementSummaryCard summary={dashboard.engagement} />
        )}
      </div>
    </div>
  );
}
