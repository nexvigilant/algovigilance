'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  Plus,
  Clock,
  AlertTriangle,
  Filter,
  RotateCcw,
  Calendar,
  Tag,
} from 'lucide-react';
import {
  listTasks,
  createTask,
  updateTask,
  completeTask,
  listOfficerRoles,
  type OrgTask,
  type OfficerRole,
  type CreateTaskRequest,
  type TaskPriority,
  type TaskStatus,
} from '@/lib/api/circles-org-api';
import { useAuth } from '@/hooks/use-auth';

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'border-red-500/30 text-red-400 bg-red-500/10',
  high: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
  medium: 'border-cyan/30 text-cyan bg-cyan/10',
  low: 'border-nex-light text-cyan-soft/60',
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'To Do',
  in_progress: 'In Progress',
  completed: 'Done',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

function TaskCard({
  task,
  circleId,
  onUpdate,
}: {
  task: OrgTask;
  circleId: string;
  onUpdate: () => void;
}) {
  const { user } = useAuth();
  const [completing, setCompleting] = useState(false);
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

  const handleComplete = async () => {
    if (!user?.uid) return;
    setCompleting(true);
    const res = await completeTask(circleId, task.id, user.uid);
    if (res.success) onUpdate();
    setCompleting(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    const res = await updateTask(circleId, task.id, { status: newStatus as TaskStatus });
    if (res.success) onUpdate();
  };

  return (
    <Card className={`border bg-nex-surface p-4 transition-colors ${isOverdue ? 'border-red-500/30' : 'border-nex-light hover:border-cyan/20'}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => void handleComplete()}
          disabled={completing || task.status === 'completed'}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
            task.status === 'completed'
              ? 'border-emerald-500 bg-emerald-500/20'
              : 'border-nex-light hover:border-cyan'
          } disabled:opacity-50`}
        >
          {task.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
        </button>

        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${task.status === 'completed' ? 'text-cyan-soft/40 line-through' : 'text-white'}`}>
            {task.title}
          </p>
          {task.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-cyan-soft/50">{task.description}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {task.assigned_role_name && (
              <Badge variant="outline" className="border-nex-gold-500/30 text-nex-gold-400 text-[10px]">
                {task.assigned_role_name}
              </Badge>
            )}
            {task.assigned_user_name && (
              <span className="text-[10px] text-cyan-soft/40">@{task.assigned_user_name}</span>
            )}
            {task.due_date && (
              <span className={`flex items-center gap-0.5 text-[10px] ${isOverdue ? 'text-red-400 font-medium' : 'text-cyan-soft/40'}`}>
                {isOverdue && <AlertTriangle className="h-3 w-3" />}
                <Calendar className="h-3 w-3" />
                {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
            {task.recurrence && (
              <span className="flex items-center gap-0.5 text-[10px] text-cyan-soft/40">
                <RotateCcw className="h-3 w-3" />
                {task.recurrence.frequency}
              </span>
            )}
            {task.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="border-nex-light text-cyan-soft/40 text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="outline" className={`text-[10px] ${PRIORITY_STYLES[task.priority] ?? ''}`}>
            {task.priority}
          </Badge>
          <Select value={task.status} onValueChange={(v) => void handleStatusChange(v)}>
            <SelectTrigger className="h-7 w-24 border-nex-light bg-nex-deep text-[10px] text-cyan-soft/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(STATUS_LABELS) as [TaskStatus, string][]).map(([value, label]) => (
                <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}

function CreateTaskDialog({
  circleId,
  roles,
  onCreated,
}: {
  circleId: string;
  roles: OfficerRole[];
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [roleId, setRoleId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [recurrenceFreq, setRecurrenceFreq] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !user?.uid) return;
    setCreating(true);
    const req: CreateTaskRequest = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      assigned_role_id: roleId || undefined,
      due_date: dueDate || undefined,
      recurrence: recurrenceFreq ? { frequency: recurrenceFreq as CreateTaskRequest['recurrence'] extends infer R ? R extends { frequency: infer F } ? F : never : never, day_of_week: null, day_of_month: null, month: null, ends_at: null } : undefined,
      created_by: user.uid,
    };
    const res = await createTask(circleId, req);
    if (res.success) {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setRoleId('');
      setDueDate('');
      setRecurrenceFreq('');
      setOpen(false);
      onCreated();
    }
    setCreating(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-cyan-dark text-white hover:bg-cyan-dark/80">
          <Plus className="mr-1.5 h-4 w-4" /> New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="border-nex-light bg-nex-deep sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Create Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-nex-light bg-nex-surface text-white placeholder:text-cyan-soft/40"
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-md border border-nex-light bg-nex-surface p-2.5 text-sm text-white placeholder:text-cyan-soft/40 focus:border-cyan/50 focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
              <SelectTrigger className="border-nex-light bg-nex-surface text-sm text-white">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger className="border-nex-light bg-nex-surface text-sm text-white">
                <SelectValue placeholder="Assign to role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No role</SelectItem>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="border-nex-light bg-nex-surface text-sm text-white"
            />
            <Select value={recurrenceFreq} onValueChange={setRecurrenceFreq}>
              <SelectTrigger className="border-nex-light bg-nex-surface text-sm text-white">
                <SelectValue placeholder="Repeat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">One-time</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Biweekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="annually">Annually</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => void handleCreate()}
            disabled={creating || !title.trim()}
            className="w-full bg-cyan-dark text-white hover:bg-cyan-dark/80"
          >
            {creating ? 'Creating...' : 'Create Task'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Tasks Tab ────────────────────────────

interface TasksTabProps {
  circleId: string;
}

export function TasksTab({ circleId }: TasksTabProps) {
  const [tasks, setTasks] = useState<OrgTask[]>([]);
  const [roles, setRoles] = useState<OfficerRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const filters: { status?: string; role_id?: string } = {};
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (roleFilter !== 'all') filters.role_id = roleFilter;
    const [tasksRes, rolesRes] = await Promise.all([
      listTasks(circleId, Object.keys(filters).length > 0 ? filters : undefined),
      listOfficerRoles(circleId),
    ]);
    if (tasksRes.data) setTasks(tasksRes.data);
    if (rolesRes.data) setRoles(rolesRes.data);
    setLoading(false);
  }, [circleId, statusFilter, roleFilter]);

  useEffect(() => { void loadData(); }, [loadData]);

  const filteredTasks = tasks.filter((t) => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const overdue = filteredTasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed' && t.status !== 'cancelled');
  const pending = filteredTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const completed = filteredTasks.filter((t) => t.status === 'completed');

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="h-20 animate-pulse border border-nex-light bg-nex-surface" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 w-48 border-nex-light bg-nex-surface text-sm text-white placeholder:text-cyan-soft/40"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-32 border-nex-light bg-nex-surface text-xs text-cyan-soft/60">
            <Filter className="mr-1 h-3 w-3" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(Object.entries(STATUS_LABELS) as [TaskStatus, string][]).map(([value, label]) => (
              <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="h-8 w-36 border-nex-light bg-nex-surface text-xs text-cyan-soft/60">
            <Tag className="mr-1 h-3 w-3" />
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map((r) => (
              <SelectItem key={r.id} value={r.id} className="text-xs">{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <CreateTaskDialog circleId={circleId} roles={roles} onCreated={() => void loadData()} />
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 text-xs text-cyan-soft/50">
        <span>{filteredTasks.length} total</span>
        <span>{pending.length} active</span>
        {overdue.length > 0 && <span className="font-medium text-red-400">{overdue.length} overdue</span>}
        <span>{completed.length} done</span>
      </div>

      {/* Overdue Section */}
      {overdue.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-red-400">
            <AlertTriangle className="h-3.5 w-3.5" /> Overdue ({overdue.length})
          </h3>
          <div className="space-y-2">
            {overdue.map((t) => <TaskCard key={t.id} task={t} circleId={circleId} onUpdate={() => void loadData()} />)}
          </div>
        </div>
      )}

      {/* Active Tasks */}
      {pending.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-soft/50">
            Active ({pending.length})
          </h3>
          <div className="space-y-2">
            {pending.map((t) => <TaskCard key={t.id} task={t} circleId={circleId} onUpdate={() => void loadData()} />)}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-soft/50">
            Completed ({completed.length})
          </h3>
          <div className="space-y-2">
            {completed.map((t) => <TaskCard key={t.id} task={t} circleId={circleId} onUpdate={() => void loadData()} />)}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <Card className="border border-nex-light bg-nex-surface p-8 text-center">
          <Clock className="mx-auto mb-3 h-10 w-10 text-cyan-soft/30" />
          <p className="text-cyan-soft/60">No tasks yet. Create the first one to get started.</p>
        </Card>
      )}
    </div>
  );
}
